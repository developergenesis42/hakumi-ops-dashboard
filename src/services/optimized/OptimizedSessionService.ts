/**
 * Optimized Session Service
 * Implements query batching and intelligent caching to prevent N+1 queries
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { QueryBatcher } from './QueryBatcher';
import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';
import type { Session, Service } from '@/types';

// Database type aliases - kept for future use
// type SessionRow = Database['public']['Tables']['sessions']['Row'];
// type ServiceRow = Database['public']['Tables']['services']['Row'];

export interface OptimizedQueryConfig {
  enableBatching: boolean;
  enableCaching: boolean;
  batchTimeout: number;
  cacheTTL: number;
}

/**
 * Optimized Session Service with query batching and caching
 */
export class OptimizedSessionService {
  private supabase: SupabaseClient<Database>;
  private queryBatcher: QueryBatcher;
  private config: OptimizedQueryConfig;

  constructor(
    supabase: SupabaseClient<Database>,
    config: Partial<OptimizedQueryConfig> = {}
  ) {
    this.supabase = supabase;
    this.config = {
      enableBatching: true,
      enableCaching: true,
      batchTimeout: 100,
      cacheTTL: CacheTTL.SHORT,
      ...config,
    };
    this.queryBatcher = new QueryBatcher(supabase, {
      timeout: this.config.batchTimeout,
      enableDeduplication: true,
    });
  }

  /**
   * Get sessions with optimized query batching
   */
  async getSessions(options: {
    therapistIds?: string[];
    serviceIds?: string[];
    roomIds?: string[];
    status?: string[];
    dateRange?: { start: Date; end: Date };
    limit?: number;
    orderBy?: { column: string; ascending?: boolean };
  } = {}): Promise<Session[]> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey('sessions', options);
        const cached = cacheService.get<Session[]>(cacheKey);
        if (cached) {
          logger.debug('Session cache hit', { cacheKey });
          return cached;
        }
      }

      // Build optimized query
      const query = this.buildOptimizedQuery(options);
      let supabaseQuery = this.supabase
        .from('sessions')
        .select(query.select);

      // Apply filters efficiently
      if (options.therapistIds?.length) {
        supabaseQuery = supabaseQuery.overlaps('therapist_ids', options.therapistIds);
      }
      if (options.serviceIds?.length) {
        supabaseQuery = supabaseQuery.in('service_id', options.serviceIds);
      }
      if (options.roomIds?.length) {
        supabaseQuery = supabaseQuery.in('room_id', options.roomIds);
      }
      if (options.status?.length) {
        supabaseQuery = supabaseQuery.in('status', options.status);
      }
      if (options.dateRange) {
        supabaseQuery = supabaseQuery
          .gte('start_time', options.dateRange.start.toISOString())
          .lte('start_time', options.dateRange.end.toISOString());
      }
      if (options.orderBy) {
        supabaseQuery = supabaseQuery.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }
      if (options.limit) {
        supabaseQuery = supabaseQuery.limit(options.limit);
      }

      const { data, error } = await supabaseQuery;

      if (error) {
        throw error;
      }

      const sessions = (data || []).map((row: unknown) => this.convertFromDB(row as Record<string, unknown>));
      
      // Cache the result
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey('sessions', options);
        cacheService.set(cacheKey, sessions, this.config.cacheTTL);
      }

      logger.debug('Sessions fetched', { 
        count: sessions.length, 
        duration: performance.now() - startTime 
      });
      
      return sessions;
    } catch (error) {
      logger.error('Failed to fetch sessions', { error, options });
      throw error;
    }
  }

  /**
   * Get sessions by therapist with batching
   */
  async getSessionsByTherapist(
    therapistId: string,
    options: {
      dateRange?: { start: Date; end: Date };
      status?: string[];
      limit?: number;
    } = {}
  ): Promise<Session[]> {
    return this.getSessions({
      therapistIds: [therapistId],
      ...options,
    });
  }

  /**
   * Get sessions by service with batching
   */
  async getSessionsByService(
    serviceId: string,
    options: {
      dateRange?: { start: Date; end: Date };
      status?: string[];
      limit?: number;
    } = {}
  ): Promise<Session[]> {
    return this.getSessions({
      serviceIds: [serviceId],
      ...options,
    });
  }

  /**
   * Get sessions by room with batching
   */
  async getSessionsByRoom(
    roomId: string,
    options: {
      dateRange?: { start: Date; end: Date };
      status?: string[];
      limit?: number;
    } = {}
  ): Promise<Session[]> {
    return this.getSessions({
      roomIds: [roomId],
      ...options,
    });
  }

  /**
   * Get today's sessions with caching
   */
  async getTodaySessions(): Promise<Session[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.getSessions({
      dateRange: { start: startOfDay, end: endOfDay },
      orderBy: { column: 'start_time', ascending: true },
    });
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(): Promise<Session[]> {
    return this.getSessions({
      status: ['in_progress', 'prep'],
    });
  }

  /**
   * Get completed sessions
   */
  async getCompletedSessions(): Promise<Session[]> {
    return this.getSessions({
      status: ['completed'],
    });
  }

  /**
   * Batch fetch multiple session queries
   */
  async batchGetSessions(queries: Array<{
    id: string;
    options: Parameters<typeof this.getSessions>[0];
  }>): Promise<Map<string, Session[]>> {
    const startTime = performance.now();
    const results = new Map<string, Session[]>();

    try {
      // Group queries by similar parameters for optimization
      const queryGroups = this.groupSimilarQueries(queries);

      // Execute each group
      for (const [, groupQueries] of queryGroups) {
        const firstQuery = groupQueries[0];
        const sessions = await this.getSessions(firstQuery.options);
        
        // Distribute results to all queries in the group
        groupQueries.forEach(query => {
          results.set(query.id, sessions);
        });
      }

      logger.debug('Batch session fetch completed', {
        queryCount: queries.length,
        duration: performance.now() - startTime,
      });

      return results;
    } catch (error) {
      logger.error('Batch session fetch failed', { error });
      throw error;
    }
  }

  /**
   * Preload session data for better performance
   */
  async preloadSessionData(options: {
    therapistIds?: string[];
    dateRange?: { start: Date; end: Date };
  } = {}): Promise<void> {
    const startTime = performance.now();

    try {
      // Preload today's sessions
      await this.getTodaySessions();

      // Preload active sessions
      await this.getActiveSessions();

      // Preload sessions for specific therapists if provided
      if (options.therapistIds?.length) {
        const promises = options.therapistIds.map(therapistId =>
          this.getSessionsByTherapist(therapistId, options)
        );
        await Promise.all(promises);
      }

      logger.debug('Session data preloaded', {
        duration: performance.now() - startTime,
        therapistCount: options.therapistIds?.length || 0,
      });
    } catch (error) {
      logger.error('Failed to preload session data', { error });
      // Don't throw - preloading is optional
    }
  }

  /**
   * Invalidate cache for specific patterns
   */
  invalidateCache(): void {
    // Invalidate all session cache
    cacheService.delete(CacheKeys.TODAY_SESSIONS);
    // Note: In a real implementation, you'd want more sophisticated cache key management
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): unknown {
    return cacheService.getStats();
  }

  /**
   * Build optimized query with proper joins
   */
  private buildOptimizedQuery(options: Parameters<typeof this.getSessions>[0]) {
    return {
      select: `
        *,
        services (
          id,
          category,
          room_type,
          duration,
          price,
          lady_payout,
          shop_revenue,
          description
        )
      `,
    };
  }

  /**
   * Convert database row to Session
   */
  private convertFromDB(row: Record<string, unknown>): Session {
    return {
      id: row.id,
      therapistIds: row.therapist_ids,
      service: this.convertServiceFromDB(row.services),
      roomId: row.room_id,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      discount: row.discount,
      totalPrice: row.total_price,
      status: row.status as Session['status'],
      prepStartTime: row.prep_start_time ? new Date(row.prep_start_time) : undefined,
      sessionStartTime: row.session_start_time ? new Date(row.session_start_time) : undefined,
      isInPrepPhase: row.is_in_prep_phase,
    };
  }

  /**
   * Convert service from database format
   */
  private convertServiceFromDB(serviceRow: Record<string, unknown>): Service {
    return {
      id: serviceRow.id,
      name: serviceRow.name || '', // Add missing name property
      category: serviceRow.category as Service['category'],
      roomType: serviceRow.room_type as Service['roomType'],
      duration: serviceRow.duration,
      price: serviceRow.price,
      ladyPayout: serviceRow.lady_payout,
      shopRevenue: serviceRow.shop_revenue,
      description: serviceRow.description,
    };
  }

  /**
   * Generate cache key for options
   */
  private getCacheKey(prefix: string, options: Parameters<typeof this.getSessions>[0]): string {
    const keyParts = [prefix];
    
    if (options?.therapistIds?.length) {
      keyParts.push(`therapists-${options.therapistIds.sort().join(',')}`);
    }
    if (options?.serviceIds?.length) {
      keyParts.push(`services-${options.serviceIds.sort().join(',')}`);
    }
    if (options?.roomIds?.length) {
      keyParts.push(`rooms-${options.roomIds.sort().join(',')}`);
    }
    if (options?.status?.length) {
      keyParts.push(`status-${options.status.sort().join(',')}`);
    }
    if (options?.dateRange) {
      keyParts.push(`date-${options.dateRange.start.toISOString()}-${options.dateRange.end.toISOString()}`);
    }
    if (options?.limit) {
      keyParts.push(`limit-${options.limit}`);
    }
    if (options?.orderBy) {
      keyParts.push(`order-${options.orderBy.column}-${options.orderBy.ascending ? 'asc' : 'desc'}`);
    }

    return keyParts.join('|');
  }

  /**
   * Group similar queries for optimization
   */
  private groupSimilarQueries(queries: Array<{
    id: string;
    options: Parameters<typeof this.getSessions>[0];
  }>): Map<string, Array<{ id: string; options: Parameters<typeof this.getSessions>[0] }>> {
    const groups = new Map<string, Array<{ id: string; options: Parameters<typeof this.getSessions>[0] }>>();

    queries.forEach(query => {
      // Create a group key based on similar query parameters
      const groupKey = this.getQueryGroupKey(query.options);
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(query);
    });

    return groups;
  }

  /**
   * Generate group key for query optimization
   */
  private getQueryGroupKey(options: Parameters<typeof this.getSessions>[0]): string {
    const keyParts = [];
    
    // Group by date range
    if (options.dateRange) {
      const day = options.dateRange.start.toISOString().split('T')[0];
      keyParts.push(`date-${day}`);
    } else {
      keyParts.push('date-all');
    }

    // Group by status
    if (options.status?.length) {
      keyParts.push(`status-${options.status.sort().join(',')}`);
    } else {
      keyParts.push('status-all');
    }

    return keyParts.join('|');
  }

  /**
   * Get cache keys matching a pattern
   */
  private getCacheKeysForPattern(): string[] {
    // This is a simplified implementation
    // In a real app, you'd want more sophisticated pattern matching
    return [CacheKeys.TODAY_SESSIONS];
  }
}
