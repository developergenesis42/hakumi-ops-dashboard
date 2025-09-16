/**
 * Optimized Roster Service
 * Implements query batching and intelligent caching for roster operations
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { QueryBatcher } from './QueryBatcher';
import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';
import type { Therapist } from '@/types';

// Database type aliases
type TherapistRow = Database['public']['Tables']['therapists']['Row'];

export interface OptimizedRosterConfig {
  enableBatching: boolean;
  enableCaching: boolean;
  batchTimeout: number;
  cacheTTL: number;
}

/**
 * Optimized Roster Service with query batching and caching
 */
export class OptimizedRosterService {
  private supabase: SupabaseClient<Database>;
  private queryBatcher: QueryBatcher;
  private config: OptimizedRosterConfig;

  constructor(
    supabase: SupabaseClient<Database>,
    config: Partial<OptimizedRosterConfig> = {}
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
   * Get therapists with optimized query batching
   */
  async getTherapists(options: {
    status?: string[];
    includeInactive?: boolean;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
  } = {}): Promise<Therapist[]> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey('therapists', options);
        const cached = cacheService.get<Therapist[]>(cacheKey);
        if (cached) {
          logger.debug('Therapist cache hit', { cacheKey });
          return cached;
        }
      }

      // Build optimized query
      let query = this.supabase
        .from('therapists')
        .select('*');

      // Apply filters
      if (options.status?.length) {
        query = query.in('status', options.status);
      } else if (!options.includeInactive) {
        query = query.neq('status', 'inactive');
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      } else {
        query = query.order('name', { ascending: true });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const therapists = (data || []).map(row => this.convertFromDB(row));
      
      // Cache the result
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey('therapists', options);
        cacheService.set(cacheKey, therapists, this.config.cacheTTL);
      }

      logger.debug('Therapists fetched', { 
        count: therapists.length, 
        duration: performance.now() - startTime 
      });
      
      return therapists;
    } catch (error) {
      logger.error('Failed to fetch therapists', { error, options });
      throw error;
    }
  }

  /**
   * Get today's roster with caching
   */
  async getTodayRoster(): Promise<Therapist[]> {
    return this.getTherapists({
      status: ['available', 'in-session', 'departed'],
      orderBy: { column: 'name', ascending: true },
    });
  }

  /**
   * Get available therapists
   */
  async getAvailableTherapists(): Promise<Therapist[]> {
    return this.getTherapists({
      status: ['available'],
      orderBy: { column: 'name', ascending: true },
    });
  }

  /**
   * Get therapists in session
   */
  async getTherapistsInSession(): Promise<Therapist[]> {
    return this.getTherapists({
      status: ['in-session'],
      orderBy: { column: 'name', ascending: true },
    });
  }

  /**
   * Get therapist by ID with caching
   */
  async getTherapistById(therapistId: string): Promise<Therapist | null> {
    const startTime = performance.now();
    
    try {
      // Check cache first
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey('therapist', { id: therapistId });
        const cached = cacheService.get<Therapist>(cacheKey);
        if (cached) {
          logger.debug('Therapist cache hit', { therapistId });
          return cached;
        }
      }

      const { data, error } = await this.supabase
        .from('therapists')
        .select('*')
        .eq('id', therapistId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw error;
      }

      const therapist = this.convertFromDB(data);
      
      // Cache the result
      if (this.config.enableCaching) {
        const cacheKey = this.getCacheKey('therapist', { id: therapistId });
        cacheService.set(cacheKey, therapist, this.config.cacheTTL);
      }

      logger.debug('Therapist fetched', { 
        therapistId, 
        duration: performance.now() - startTime 
      });
      
      return therapist;
    } catch (error) {
      logger.error('Failed to fetch therapist', { therapistId, error });
      throw error;
    }
  }

  /**
   * Batch fetch multiple therapist queries
   */
  async batchGetTherapists(queries: Array<{
    id: string;
    options: Parameters<typeof this.getTherapists>[0];
  }>): Promise<Map<string, Therapist[]>> {
    const startTime = performance.now();
    const results = new Map<string, Therapist[]>();

    try {
      // Group queries by similar parameters for optimization
      const queryGroups = this.groupSimilarQueries(queries);

      // Execute each group
      for (const [, groupQueries] of queryGroups) {
        const firstQuery = groupQueries[0];
        const therapists = await this.getTherapists(firstQuery.options);
        
        // Distribute results to all queries in the group
        groupQueries.forEach(query => {
          results.set(query.id, therapists);
        });
      }

      logger.debug('Batch therapist fetch completed', {
        queryCount: queries.length,
        duration: performance.now() - startTime,
      });

      return results;
    } catch (error) {
      logger.error('Batch therapist fetch failed', { error });
      throw error;
    }
  }

  /**
   * Update therapist status with cache invalidation
   */
  async updateTherapistStatus(
    therapistId: string,
    status: Therapist['status'],
    currentSessionId?: string
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (currentSessionId) {
        updateData.current_session_id = currentSessionId;
      }

      const { error } = await this.supabase
        .from('therapists')
        .update(updateData)
        .eq('id', therapistId);

      if (error) {
        throw error;
      }

      // Invalidate related cache
      this.invalidateTherapistCache(therapistId);

      logger.debug('Therapist status updated', { 
        therapistId, 
        status, 
        duration: performance.now() - startTime 
      });
    } catch (error) {
      logger.error('Failed to update therapist status', { therapistId, status, error });
      throw error;
    }
  }

  /**
   * Update therapist stats with cache invalidation
   */
  async updateTherapistStats(
    therapistId: string,
    earnings: number,
    sessions: number
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      const { error } = await this.supabase
        .from('therapists')
        .update({
          total_earnings: earnings,
          total_sessions: sessions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', therapistId);

      if (error) {
        throw error;
      }

      // Invalidate related cache
      this.invalidateTherapistCache(therapistId);

      logger.debug('Therapist stats updated', { 
        therapistId, 
        earnings, 
        sessions, 
        duration: performance.now() - startTime 
      });
    } catch (error) {
      logger.error('Failed to update therapist stats', { therapistId, earnings, sessions, error });
      throw error;
    }
  }

  /**
   * Preload roster data for better performance
   */
  async preloadRosterData(): Promise<void> {
    const startTime = performance.now();

    try {
      // Preload today's roster
      await this.getTodayRoster();

      // Preload available therapists
      await this.getAvailableTherapists();

      // Preload therapists in session
      await this.getTherapistsInSession();

      logger.debug('Roster data preloaded', {
        duration: performance.now() - startTime,
      });
    } catch (error) {
      logger.error('Failed to preload roster data', { error });
      // Don't throw - preloading is optional
    }
  }

  /**
   * Invalidate cache for specific therapist or all roster data
   */
  invalidateTherapistCache(therapistId?: string): void {
    if (therapistId) {
      // Invalidate specific therapist cache
      const keys = [
        this.getCacheKey('therapist', { id: therapistId }),
        CacheKeys.THERAPIST_STATUS(therapistId),
      ];
      keys.forEach(key => cacheService.delete(key));
    } else {
      // Invalidate all roster cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      // Note: In a real implementation, you'd want more sophisticated cache key management
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Convert database row to Therapist
   */
  private convertFromDB(row: TherapistRow): Therapist {
    return {
      id: row.id,
      name: row.name,
      status: row.status as Therapist['status'],
      totalEarnings: row.total_earnings,
      totalSessions: row.total_sessions,
      currentSession: row.current_session_id ? { id: row.current_session_id } : undefined,
      checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
      departureTime: row.departure_time ? new Date(row.departure_time) : undefined,
      expenses: [], // Initialize empty expenses array
    };
  }

  /**
   * Generate cache key for options
   */
  private getCacheKey(prefix: string, options: Record<string, unknown>): string {
    const keyParts = [prefix];
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          keyParts.push(`${key}-${value.sort().join(',')}`);
        } else {
          keyParts.push(`${key}-${value}`);
        }
      }
    });

    return keyParts.join('|');
  }

  /**
   * Group similar queries for optimization
   */
  private groupSimilarQueries(queries: Array<{
    id: string;
    options: Parameters<typeof this.getTherapists>[0];
  }>): Map<string, Array<{ id: string; options: Parameters<typeof this.getTherapists>[0] }>> {
    const groups = new Map<string, Array<{ id: string; options: Parameters<typeof this.getTherapists>[0] }>>();

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
  private getQueryGroupKey(options: Parameters<typeof this.getTherapists>[0]): string {
    const keyParts = [];
    
    // Group by status
    if (options.status?.length) {
      keyParts.push(`status-${options.status.sort().join(',')}`);
    } else {
      keyParts.push('status-all');
    }

    // Group by includeInactive
    keyParts.push(`inactive-${options.includeInactive ? 'true' : 'false'}`);

    return keyParts.join('|');
  }
}
