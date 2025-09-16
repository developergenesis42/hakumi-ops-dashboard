/**
 * Enhanced Roster Service
 * Refactored to use the new centralized architecture with proper error handling and caching
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, RequestConfig } from '@/services/base/BaseService';
import { ApiClient } from '@/services/base/ApiClient';
import { CacheKeys, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';
import type { Therapist } from '@/types';

// Database type aliases for roster operations
type RosterRow = {
  therapist_id: string;
  therapist_name: string;
  status: string;
  total_earnings: number;
  total_sessions: number;
  current_session_id?: string;
  check_in_time?: string;
  departure_time?: string;
};

/**
 * Enhanced Roster Service
 */
export class RosterService extends BaseService {
  private apiClient: ApiClient;

  constructor(supabase: SupabaseClient<Database>, apiClient: ApiClient) {
    super(supabase, 'RosterService');
    this.apiClient = apiClient;
  }

  /**
   * Get today's roster with caching
   */
  async getTodayRoster(config: RequestConfig = {}): Promise<Therapist[]> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.rpc<RosterRow[]>(
        'get_today_roster',
        {},
        {
          ...config,
          cache: {
            key: CacheKeys.TODAY_ROSTER,
            ttl: CacheTTL.SHORT,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      const therapists = result.map(this.convertFromDB);
      this.trackPerformance('getTodayRoster', startTime, true);
      
      return therapists;
    } catch (error) {
      this.trackPerformance('getTodayRoster', startTime, false);
      throw error;
    }
  }

  /**
   * Add therapist to today's roster
   */
  async addToTodayRoster(therapistId: string, config: RequestConfig = {}): Promise<string> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.rpc<string>(
        'add_to_today_roster',
        { therapist_uuid: therapistId },
        config
      );

      this.trackPerformance('addToTodayRoster', startTime, true);
      return result;
    } catch (error) {
      this.trackPerformance('addToTodayRoster', startTime, false);
      throw error;
    }
  }

  /**
   * Remove therapist from today's roster
   */
  async removeFromTodayRoster(therapistId: string, config: RequestConfig = {}): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.rpc<boolean>(
        'remove_from_today_roster',
        { therapist_uuid: therapistId },
        config
      );

      this.trackPerformance('removeFromTodayRoster', startTime, true);
      return result;
    } catch (error) {
      this.trackPerformance('removeFromTodayRoster', startTime, false);
      throw error;
    }
  }

  /**
   * Clear today's roster
   */
  async clearTodayRoster(config: RequestConfig = {}): Promise<number> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.rpc<number>(
        'clear_today_roster',
        {},
        config
      );

      this.trackPerformance('clearTodayRoster', startTime, true);
      return result;
    } catch (error) {
      this.trackPerformance('clearTodayRoster', startTime, false);
      throw error;
    }
  }

  /**
   * Update therapist status in roster
   */
  async updateTherapistStatus(
    therapistId: string, 
    status: Therapist['status'], 
    currentSessionId?: string,
    config: RequestConfig = {}
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      // const today = new Date().toISOString().split('T')[0];
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (currentSessionId) {
        updateData.current_session_id = currentSessionId;
      }

      await this.apiClient.patch(
        'daily_rosters',
        therapistId,
        updateData,
        {},
        {
          ...config,
        }
      );

      this.trackPerformance('updateTherapistStatus', startTime, true);
    } catch (error) {
      this.trackPerformance('updateTherapistStatus', startTime, false);
      throw error;
    }
  }

  /**
   * Update check-in time for therapist
   */
  async updateCheckInTime(therapistId: string, config: RequestConfig = {}): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.rpc<boolean>(
        'update_check_in_time',
        { therapist_uuid: therapistId },
        config
      );

      this.trackPerformance('updateCheckInTime', startTime, true);
      return result;
    } catch (error) {
      this.trackPerformance('updateCheckInTime', startTime, false);
      throw error;
    }
  }

  /**
   * Update departure time for therapist
   */
  async updateDepartureTime(therapistId: string, config: RequestConfig = {}): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.rpc<boolean>(
        'update_departure_time',
        { therapist_uuid: therapistId },
        config
      );

      this.trackPerformance('updateDepartureTime', startTime, true);
      return result;
    } catch (error) {
      this.trackPerformance('updateDepartureTime', startTime, false);
      throw error;
    }
  }

  /**
   * Update therapist earnings and sessions
   */
  async updateTherapistStats(
    therapistId: string, 
    earnings: number, 
    sessions: number,
    config: RequestConfig = {}
  ): Promise<void> {
    const startTime = performance.now();
    
    try {
      // const today = new Date().toISOString().split('T')[0];
      const updateData = {
        total_earnings: earnings,
        total_sessions: sessions,
        updated_at: new Date().toISOString(),
      };

      await this.apiClient.patch(
        'daily_rosters',
        therapistId,
        updateData,
        {},
        {
          ...config,
        }
      );

      this.trackPerformance('updateTherapistStats', startTime, true);
    } catch (error) {
      this.trackPerformance('updateTherapistStats', startTime, false);
      throw error;
    }
  }

  /**
   * Clear all data for today (roster, sessions, walk-outs)
   */
  async clearAllTodayData(config: RequestConfig = {}): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Clear today's roster
      await this.clearTodayRoster(config);
      
      // Clear today's sessions
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      await this.apiClient.rpc('delete_sessions_by_date_range', {
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
      }, config);

      // Clear today's walk-outs
      await this.apiClient.rpc('delete_walk_outs_by_date_range', {
        start_date: startOfDay.toISOString(),
        end_date: endOfDay.toISOString(),
      }, config);

      this.trackPerformance('clearAllTodayData', startTime, true);
    } catch (error) {
      this.trackPerformance('clearAllTodayData', startTime, false);
      throw error;
    }
  }

  /**
   * Get roster statistics
   */
  async getRosterStats(config: RequestConfig = {}): Promise<{
    totalTherapists: number;
    availableTherapists: number;
    inSessionTherapists: number;
    departedTherapists: number;
  }> {
    const startTime = performance.now();
    
    try {
      const roster = await this.getTodayRoster({ ...config, skipLogging: true });
      
      const stats = {
        totalTherapists: roster.length,
        availableTherapists: roster.filter(t => t.status === 'available').length,
        inSessionTherapists: roster.filter(t => t.status === 'in-session').length,
        departedTherapists: roster.filter(t => t.status === 'departed').length,
      };

      this.trackPerformance('getRosterStats', startTime, true);
      return stats;
    } catch (error) {
      this.trackPerformance('getRosterStats', startTime, false);
      throw error;
    }
  }

  /**
   * Get therapist attendance history
   */
  async getTherapistAttendanceHistory(
    therapistId: string, 
    startDate: Date, 
    endDate: Date,
    config: RequestConfig = {}
  ): Promise<Array<{
    date: string;
    checkInTime?: Date;
    departureTime?: Date;
    status: string;
    totalEarnings: number;
    totalSessions: number;
  }>> {
    const startTime = performance.now();
    
    try {
      const result = await this.apiClient.get<Array<{
        date: string;
        check_in_time?: string;
        departure_time?: string;
        status: string;
        total_earnings: number;
        total_sessions: number;
      }>>(
        'daily_rosters',
        {
          filters: {
            therapist_id: therapistId,
            date: `gte.${startDate.toISOString().split('T')[0]}`,
            end_date: `lte.${endDate.toISOString().split('T')[0]}`,
          },
          orderBy: { column: 'date', ascending: true },
        },
        {
          ...config,
          cache: {
            key: this.getCacheKey('attendanceHistory', therapistId, startDate.toISOString(), endDate.toISOString()),
            ttl: CacheTTL.MEDIUM,
            skipCache: config.cache?.skipCache || false,
          },
        }
      );

      // Flatten result if it's nested, otherwise use as is
      const flattenedResult = Array.isArray(result[0]) ? result.flat() : result;
      const history = (flattenedResult as Array<{ date: string; check_in_time?: string; departure_time?: string; status: string; total_earnings: number; total_sessions: number }>).map((row) => ({
        date: row.date,
        checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
        departureTime: row.departure_time ? new Date(row.departure_time) : undefined,
        status: row.status,
        totalEarnings: row.total_earnings,
        totalSessions: row.total_sessions,
      }));

      this.trackPerformance('getTherapistAttendanceHistory', startTime, true);
      return history;
    } catch (error) {
      this.trackPerformance('getTherapistAttendanceHistory', startTime, false);
      throw error;
    }
  }

  /**
   * Subscribe to roster changes
   */
  subscribeToRoster(callback: (therapists: Therapist[]) => void): () => void {
    const channel = this.supabase
      .channel('roster-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_rosters' },
        async () => {
          try {
            const therapists = await this.getTodayRoster({ skipLogging: true });
            callback(therapists);
          } catch (error) {
            logger.error('Failed to get roster in real-time callback', { error });
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
    // Clear roster-related cache entries
    this.apiClient.clearCache('daily_rosters');
  }

  /**
   * Convert database row to app format
   */
  private convertFromDB(row: RosterRow): Therapist {
    return {
      id: row.therapist_id,
      name: row.therapist_name,
      status: row.status as Therapist['status'],
      totalEarnings: row.total_earnings,
      totalSessions: row.total_sessions,
      currentSession: row.current_session_id ? { id: row.current_session_id } : undefined,
      checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
      departureTime: row.departure_time ? new Date(row.departure_time) : undefined,
      expenses: [], // Initialize empty expenses array
    };
  }
}
