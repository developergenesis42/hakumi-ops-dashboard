/**
 * Enhanced Therapist Service
 * Refactored to use the new centralized architecture with proper error handling and caching
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, RequestConfig } from '@/services/base/BaseService';
import { ApiClient } from '@/services/base/ApiClient';
import { CacheKeys, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';
import type { Therapist } from '@/types';

// Database type aliases
type TherapistRow = Database['public']['Tables']['therapists']['Row'];
type TherapistInsert = Database['public']['Tables']['therapists']['Insert'];
type TherapistUpdate = Database['public']['Tables']['therapists']['Update'];

/**
 * Enhanced Therapist Service
 */
export class TherapistService extends BaseService {
  private apiClient: ApiClient;

  constructor(supabase: SupabaseClient<Database>, apiClient: ApiClient) {
    super(supabase, 'TherapistService');
    this.apiClient = apiClient;
  }

  /**
   * Get all therapists with caching
   */
  async getTherapists(config: RequestConfig = {}): Promise<Therapist[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.get<TherapistRow>(
        'therapists',
        {
          orderBy: { column: 'name', ascending: true },
        },
        {
          ...config,
          cache: {
            key: CacheKeys.THERAPIST_STATUS('all'),
            ttl: CacheTTL.MEDIUM,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const therapists = result.map((row: Database['public']['Tables']['therapists']['Row']) => this.convertFromDB(row));
      this.trackPerformance('getTherapists', startTime, true);
      
      return therapists;
    } catch (error) {
      this.trackPerformance('getTherapists', startTime, false);
      throw error;
    }
  }

  /**
   * Get therapist by ID with caching
   */
  async getTherapistById(id: string, config: RequestConfig = {}): Promise<Therapist> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.getById<TherapistRow>(
        'therapists',
        id,
        {},
        {
          ...config,
          cache: {
            key: CacheKeys.THERAPIST_STATUS(id),
            ttl: CacheTTL.MEDIUM,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const therapist = this.convertFromDB(result);
      this.trackPerformance('getTherapistById', startTime, true);
      
      return therapist;
    } catch (error) {
      this.trackPerformance('getTherapistById', startTime, false);
      throw error;
    }
  }

  /**
   * Create a new therapist
   */
  async createTherapist(therapist: Omit<Therapist, 'id'>, config: RequestConfig = {}): Promise<Therapist> {
    const startTime = performance.now();
    
    try {
      const dbData = this.convertToDB(therapist);
      const result = await this.apiClient.post<TherapistRow>(
        'therapists',
        dbData,
        {},
        config
      );

      const newTherapist = this.convertFromDB(result);
      this.trackPerformance('createTherapist', startTime, true);
      
      return newTherapist;
    } catch (error) {
      this.trackPerformance('createTherapist', startTime, false);
      throw error;
    }
  }

  /**
   * Update therapist
   */
  async updateTherapist(id: string, updates: Partial<Therapist>, config: RequestConfig = {}): Promise<Therapist> {
    const startTime = performance.now();
    
    try {
      const dbUpdates = this.convertToDB(updates);
      const result = await this.apiClient.patch<TherapistRow>(
        'therapists',
        id,
        dbUpdates,
        {},
        config
      );

      const updatedTherapist = this.convertFromDB(result);
      this.trackPerformance('updateTherapist', startTime, true);
      
      return updatedTherapist;
    } catch (error) {
      this.trackPerformance('updateTherapist', startTime, false);
      throw error;
    }
  }

  /**
   * Update therapist status
   */
  async updateTherapistStatus(
    id: string, 
    status: Therapist['status'], 
    currentSessionId?: string,
    config: RequestConfig = {}
  ): Promise<Therapist> {
    const startTime = performance.now();
    
    try {
      const updates: Partial<TherapistUpdate> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (currentSessionId) {
        (updates as Record<string, unknown>).current_session_id = currentSessionId;
      }

      const result = await this.apiClient.patch<TherapistRow>(
        'therapists',
        id,
        updates,
        {},
        config
      );

      const updatedTherapist = this.convertFromDB(result);
      this.trackPerformance('updateTherapistStatus', startTime, true);
      
      return updatedTherapist;
    } catch (error) {
      this.trackPerformance('updateTherapistStatus', startTime, false);
      throw error;
    }
  }

  /**
   * Update therapist statistics
   */
  async updateTherapistStats(
    id: string,
    earnings: number,
    sessions: number,
    config: RequestConfig = {}
  ): Promise<Therapist> {
    const startTime = performance.now();
    
    try {
      const updates: Partial<TherapistUpdate> = {
        total_earnings: earnings,
        total_sessions: sessions,
        updated_at: new Date().toISOString(),
      };

      const result = await this.apiClient.patch<TherapistRow>(
        'therapists',
        id,
        updates,
        {},
        config
      );

      const updatedTherapist = this.convertFromDB(result);
      this.trackPerformance('updateTherapistStats', startTime, true);
      
      return updatedTherapist;
    } catch (error) {
      this.trackPerformance('updateTherapistStats', startTime, false);
      throw error;
    }
  }

  /**
   * Delete therapist
   */
  async deleteTherapist(id: string, config: RequestConfig = {}): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.apiClient.delete('therapists', id, {}, config);
      this.trackPerformance('deleteTherapist', startTime, true);
    } catch (error) {
      this.trackPerformance('deleteTherapist', startTime, false);
      throw error;
    }
  }

  /**
   * Search therapists by name
   */
  async searchTherapists(query: string, config: RequestConfig = {}): Promise<Therapist[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.get<TherapistRow>(
        'therapists',
        {
          filters: { name: `%${query}%` },
          orderBy: { column: 'name', ascending: true },
        },
        {
          ...config,
          cache: {
            key: this.getCacheKey('search', query),
            ttl: CacheTTL.SHORT,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const therapists = result.map((row: Database['public']['Tables']['therapists']['Row']) => this.convertFromDB(row));
      this.trackPerformance('searchTherapists', startTime, true);
      
      return therapists;
    } catch (error) {
      this.trackPerformance('searchTherapists', startTime, false);
      throw error;
    }
  }

  /**
   * Get therapists by status
   */
  async getTherapistsByStatus(status: Therapist['status'], config: RequestConfig = {}): Promise<Therapist[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.get<TherapistRow>(
        'therapists',
        {
          filters: { status },
          orderBy: { column: 'name', ascending: true },
        },
        {
          ...config,
          cache: {
            key: this.getCacheKey('byStatus', status),
            ttl: CacheTTL.SHORT,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const therapists = result.map((row: Database['public']['Tables']['therapists']['Row']) => this.convertFromDB(row));
      this.trackPerformance('getTherapistsByStatus', startTime, true);
      
      return therapists;
    } catch (error) {
      this.trackPerformance('getTherapistsByStatus', startTime, false);
      throw error;
    }
  }

  /**
   * Subscribe to therapist changes
   */
  subscribeToTherapists(callback: (therapists: Therapist[]) => void): () => void {
    const channel = this.supabase
      .channel('therapists-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'therapists' },
        async () => {
          try {
            const therapists = await this.getTherapists({ skipLogging: true });
            callback(therapists);
          } catch (error) {
            logger.error('Failed to get therapists in real-time callback', { error });
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
    // Clear therapist-related cache entries
    const patterns = [
      CacheKeys.THERAPIST_STATUS('all'),
      'therapist-byStatus-*',
      'therapist-search-*',
    ];

    patterns.forEach(pattern => {
      if (pattern.includes('*')) {
        // For wildcard patterns, we'd need a more sophisticated cache key management system
        logger.debug('Cache invalidation for pattern', { pattern });
      } else {
        this.apiClient.clearCache('therapists');
      }
    });
  }

  /**
   * Convert database row to app format
   */
  private convertFromDB(row: TherapistRow): Therapist {
    return {
      id: row.id,
      name: row.name,
      status: row.status as Therapist['status'],
      totalEarnings: row.total_earnings,
      totalSessions: row.total_sessions,
      expenses: [], // Initialize empty expenses array
    };
  }

  /**
   * Convert app format to database format
   */
  private convertToDB(therapist: Partial<Therapist>): Partial<TherapistInsert> {
    const dbData: Partial<TherapistInsert> = {};

    if (therapist.name !== undefined) dbData.name = therapist.name;
    if (therapist.status !== undefined) dbData.status = therapist.status;
    if (therapist.totalEarnings !== undefined) dbData.total_earnings = therapist.totalEarnings;
    if (therapist.totalSessions !== undefined) dbData.total_sessions = therapist.totalSessions;

    return dbData;
  }
}
