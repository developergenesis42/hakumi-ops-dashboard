/**
 * Enhanced Session Service
 * Refactored to use the new centralized architecture with proper error handling and caching
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, RequestConfig } from '@/services/base/BaseService';
import { ApiClient } from '@/services/base/ApiClient';
import { CacheKeys, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';
import type { Session, Service } from '@/types';

// Database type aliases
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];
type ServiceRow = Database['public']['Tables']['services']['Row'];

// Session update type for partial updates
export type SessionUpdateData = Omit<Partial<Session>, 'actualEndTime'> & { 
  actualEndTime?: string; 
  actualDuration?: number; 
};

/**
 * Enhanced Session Service
 */
export class SessionService extends BaseService {
  private apiClient: ApiClient;

  constructor(supabase: SupabaseClient<Database>, apiClient: ApiClient) {
    super(supabase, 'SessionService');
    this.apiClient = apiClient;
  }

  /**
   * Get all sessions with caching
   */
  async getSessions(config: RequestConfig = {}): Promise<Session[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.get<SessionRow[]>(
        'sessions',
        {
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
          orderBy: { column: 'start_time', ascending: false },
        },
        {
          ...config,
          cache: {
            key: CacheKeys.TODAY_SESSIONS,
            ttl: CacheTTL.SHORT,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const sessions = result.map(row => this.convertFromDB(row as unknown as Database['public']['Tables']['sessions']['Row'], this.convertServiceFromDB((row as unknown as { services: Database['public']['Tables']['services']['Row'] }).services)));
      this.trackPerformance('getSessions', startTime, true);
      
      return sessions;
    } catch (error) {
      this.trackPerformance('getSessions', startTime, false);
      throw error;
    }
  }

  /**
   * Get session by ID with caching
   */
  async getSessionById(id: string, config: RequestConfig = {}): Promise<Session> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.getById<SessionRow & { services: ServiceRow }>(
        'sessions',
        id,
        {
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
        },
        {
          ...config,
          cache: {
            key: CacheKeys.SESSION_DETAILS(id),
            ttl: CacheTTL.MEDIUM,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const session = this.convertFromDB(result, this.convertServiceFromDB(result.services));
      this.trackPerformance('getSessionById', startTime, true);
      
      return session;
    } catch (error) {
      this.trackPerformance('getSessionById', startTime, false);
      throw error;
    }
  }

  /**
   * Get today's sessions
   */
  async getTodaySessions(config: RequestConfig = {}): Promise<Session[]> {
    const startTime = performance.now();
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const result = await this.apiClient.get<SessionRow[]>(
        'sessions',
        {
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
          filters: {
            start_time: `gte.${startOfDay.toISOString()}`,
            end_time: `lt.${endOfDay.toISOString()}`,
          },
          orderBy: { column: 'start_time', ascending: true },
        },
        {
          ...config,
          cache: {
            key: CacheKeys.TODAY_SESSIONS,
            ttl: CacheTTL.SHORT,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const sessions = result.map(row => this.convertFromDB(row as unknown as Database['public']['Tables']['sessions']['Row'], this.convertServiceFromDB((row as unknown as { services: Database['public']['Tables']['services']['Row'] }).services)));
      this.trackPerformance('getTodaySessions', startTime, true);
      
      return sessions;
    } catch (error) {
      this.trackPerformance('getTodaySessions', startTime, false);
      throw error;
    }
  }

  /**
   * Create a new session
   */
  async createSession(session: Omit<Session, 'id'>, config: RequestConfig = {}): Promise<Session> {
    const startTime = performance.now();
    
    try {
      const dbData = this.convertToDB(session);
      const result = await this.apiClient.post<SessionRow & { services: ServiceRow }>(
        'sessions',
        dbData,
        {
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
        },
        config
      );

      const newSession = this.convertFromDB(result, this.convertServiceFromDB(result.services));
      this.trackPerformance('createSession', startTime, true);
      
      return newSession;
    } catch (error) {
      this.trackPerformance('createSession', startTime, false);
      throw error;
    }
  }

  /**
   * Update session
   */
  async updateSession(id: string, updates: Partial<Session>, config: RequestConfig = {}): Promise<Session> {
    const startTime = performance.now();
    
    try {
      const dbUpdates = this.convertToDB(updates);
      const result = await this.apiClient.patch<SessionRow & { services: ServiceRow }>(
        'sessions',
        id,
        dbUpdates,
        {
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
        },
        config
      );

      const updatedSession = this.convertFromDB(result, this.convertServiceFromDB(result.services));
      this.trackPerformance('updateSession', startTime, true);
      
      return updatedSession;
    } catch (error) {
      this.trackPerformance('updateSession', startTime, false);
      throw error;
    }
  }

  /**
   * Update session with partial data (backward compatibility)
   */
  async updateSessionPartial(id: string, updates: SessionUpdateData, config: RequestConfig = {}): Promise<Session> {
    const startTime = performance.now();
    
    try {
      const dbUpdates: Partial<SessionUpdate> = {};
      
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.sessionStartTime) dbUpdates.session_start_time = updates.sessionStartTime.toISOString();
      if (updates.actualEndTime) (dbUpdates as Record<string, unknown>).actual_end_time = updates.actualEndTime;
      if (updates.actualDuration) (dbUpdates as Record<string, unknown>).actual_duration = updates.actualDuration;
      
      dbUpdates.updated_at = new Date().toISOString();

      const result = await this.apiClient.patch<SessionRow & { services: ServiceRow }>(
        'sessions',
        id,
        dbUpdates,
        {
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
        },
        config
      );

      const updatedSession = this.convertFromDB(result, this.convertServiceFromDB(result.services));
      this.trackPerformance('updateSessionPartial', startTime, true);
      
      return updatedSession;
    } catch (error) {
      this.trackPerformance('updateSessionPartial', startTime, false);
      throw error;
    }
  }

  /**
   * Complete session
   */
  async completeSession(
    id: string, 
    actualEndTime?: Date, 
    actualDuration?: number,
    config: RequestConfig = {}
  ): Promise<Session> {
    const startTime = performance.now();
    
    try {
      const updates: Partial<SessionUpdate> = {
        status: 'completed',
        updated_at: new Date().toISOString(),
      };

      if (actualEndTime) {
        (updates as Record<string, unknown>).actual_end_time = actualEndTime.toISOString();
      }

      if (actualDuration) {
        (updates as Record<string, unknown>).actual_duration = actualDuration;
      }

      const result = await this.apiClient.patch<SessionRow & { services: ServiceRow }>(
        'sessions',
        id,
        updates,
        {
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
        },
        config
      );

      const completedSession = this.convertFromDB(result, this.convertServiceFromDB(result.services));
      this.trackPerformance('completeSession', startTime, true);
      
      return completedSession;
    } catch (error) {
      this.trackPerformance('completeSession', startTime, false);
      throw error;
    }
  }

  /**
   * Delete session
   */
  async deleteSession(id: string, config: RequestConfig = {}): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.apiClient.delete('sessions', id, {}, config);
      this.trackPerformance('deleteSession', startTime, true);
    } catch (error) {
      this.trackPerformance('deleteSession', startTime, false);
      throw error;
    }
  }

  /**
   * Delete all sessions for today
   */
  async deleteTodaySessions(config: RequestConfig = {}): Promise<void> {
    const startTime = performance.now();
    
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Use RPC for complex delete operations
      await this.apiClient.rpc('delete_sessions_by_date_range', {
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
      }, config);

      this.trackPerformance('deleteTodaySessions', startTime, true);
    } catch (error) {
      this.trackPerformance('deleteTodaySessions', startTime, false);
      throw error;
    }
  }

  /**
   * Get sessions by therapist ID
   */
  async getSessionsByTherapist(therapistId: string, config: RequestConfig = {}): Promise<Session[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.get<SessionRow[]>(
        'sessions',
        {
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
          filters: { therapist_ids: `cs.{${therapistId}}` },
          orderBy: { column: 'start_time', ascending: false },
        },
        {
          ...config,
          cache: {
            key: this.getCacheKey('byTherapist', therapistId),
            ttl: CacheTTL.SHORT,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const sessions = result.map(row => this.convertFromDB(row as unknown as Database['public']['Tables']['sessions']['Row'], this.convertServiceFromDB((row as unknown as { services: Database['public']['Tables']['services']['Row'] }).services)));
      this.trackPerformance('getSessionsByTherapist', startTime, true);
      
      return sessions;
    } catch (error) {
      this.trackPerformance('getSessionsByTherapist', startTime, false);
      throw error;
    }
  }

  /**
   * Subscribe to session changes
   */
  subscribeToSessions(callback: (sessions: Session[]) => void): () => void {
    const channel = this.supabase
      .channel('sessions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async () => {
          try {
            const sessions = await this.getSessions({ skipLogging: true });
            callback(sessions);
          } catch (error) {
            logger.error('Failed to get sessions in real-time callback', { error });
          }
        }
      )
      .subscribe();
    
    return () => {
      this.supabase.removeChannel(channel);
    };
  }

  /**
   * Invalidate related cache entries
   */
  protected invalidateRelatedCache(): void {
    // Clear session-related cache entries
    this.apiClient.clearCache('sessions');
  }

  /**
   * Convert database row to app format
   */
  private convertFromDB(row: SessionRow, service: Service): Session {
    return {
      id: row.id,
      therapistIds: row.therapist_ids,
      service,
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
   * Convert app format to database format
   */
  private convertToDB(session: Partial<Session>): Partial<SessionInsert> {
    const dbData: Partial<SessionInsert> = {};

    if (session.therapistIds !== undefined) dbData.therapist_ids = session.therapistIds;
    if (session.service !== undefined) dbData.service_id = session.service.id;
    if (session.roomId !== undefined) dbData.room_id = session.roomId;
    if (session.startTime !== undefined) dbData.start_time = session.startTime.toISOString();
    if (session.endTime !== undefined) dbData.end_time = session.endTime.toISOString();
    if (session.discount !== undefined) dbData.discount = session.discount;
    if (session.totalPrice !== undefined) dbData.total_price = session.totalPrice;
    if (session.status !== undefined) dbData.status = session.status;
    if (session.prepStartTime !== undefined) dbData.prep_start_time = session.prepStartTime.toISOString();
    if (session.sessionStartTime !== undefined) dbData.session_start_time = session.sessionStartTime.toISOString();
    if (session.isInPrepPhase !== undefined) dbData.is_in_prep_phase = session.isInPrepPhase;

    return dbData;
  }

  /**
   * Convert service from database format
   */
  private convertServiceFromDB(serviceRow: ServiceRow): Service {
    return {
      id: serviceRow.id,
      category: serviceRow.category as Service['category'],
      roomType: serviceRow.room_type as Service['roomType'],
      duration: serviceRow.duration,
      price: serviceRow.price,
      ladyPayout: serviceRow.lady_payout,
      shopRevenue: serviceRow.shop_revenue,
      description: serviceRow.description,
    };
  }
}
