/**
 * Cached Roster Service
 * Enhanced roster service with intelligent caching
 */

import { rosterService } from '@/services/rosterService';
import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { performanceMonitoring } from '@/config/monitoring';
import type { Therapist } from '@/types';

/**
 * Enhanced roster service with caching
 */
export const cachedRosterService = {
  /**
   * Get today's roster with caching
   */
  getTodayRoster: async (forceRefresh: boolean = false): Promise<Therapist[]> => {
    const startTime = performance.now();
    
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<Therapist[]>(CacheKeys.TODAY_ROSTER);
        if (cached) {
          performanceMonitoring.trackUserAction('roster-cache-hit', 'CachedRosterService');
          return cached;
        }
      }

      // Fetch from API
      performanceMonitoring.trackUserAction('roster-cache-miss', 'CachedRosterService');
      const roster = await rosterService.getTodayRoster();
      
      // Cache the result
      cacheService.set(CacheKeys.TODAY_ROSTER, roster, CacheTTL.SHORT);
      
      // Also cache individual therapist statuses
      roster.forEach(therapist => {
        cacheService.set(
          CacheKeys.THERAPIST_STATUS(therapist.id),
          therapist,
          CacheTTL.SHORT
        );
      });

      performanceMonitoring.trackTiming('roster-fetch', startTime);
      return roster;
    } catch (error) {
      performanceMonitoring.trackTiming('roster-fetch', startTime);
      throw error;
    }
  },

  /**
   * Add therapist to roster with cache invalidation
   */
  addToTodayRoster: async (therapistId: string): Promise<string> => {
    const startTime = performance.now();
    
    try {
      const result = await rosterService.addToTodayRoster(therapistId);
      
      // Invalidate cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      
      performanceMonitoring.trackUserAction('roster-add', 'CachedRosterService', {
        therapistId,
      });
      performanceMonitoring.trackTiming('roster-add', startTime);
      
      return result;
    } catch (error) {
      performanceMonitoring.trackTiming('roster-add', startTime);
      throw error;
    }
  },

  /**
   * Remove therapist from roster with cache invalidation
   */
  removeFromTodayRoster: async (therapistId: string): Promise<boolean> => {
    const startTime = performance.now();
    
    try {
      const result = await rosterService.removeFromTodayRoster(therapistId);
      
      // Invalidate cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      cacheService.delete(CacheKeys.THERAPIST_STATUS(therapistId));
      
      performanceMonitoring.trackUserAction('roster-remove', 'CachedRosterService', {
        therapistId,
      });
      performanceMonitoring.trackTiming('roster-remove', startTime);
      
      return result;
    } catch (error) {
      performanceMonitoring.trackTiming('roster-remove', startTime);
      throw error;
    }
  },

  /**
   * Clear today's roster with cache invalidation
   */
  clearTodayRoster: async (): Promise<number> => {
    const startTime = performance.now();
    
    try {
      const result = await rosterService.clearTodayRoster();
      
      // Invalidate all roster-related cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      // Note: Individual therapist statuses will be invalidated by TTL
      
      performanceMonitoring.trackUserAction('roster-clear', 'CachedRosterService');
      performanceMonitoring.trackTiming('roster-clear', startTime);
      
      return result;
    } catch (error) {
      performanceMonitoring.trackTiming('roster-clear', startTime);
      throw error;
    }
  },

  /**
   * Update therapist status with cache invalidation
   */
  updateTherapistStatus: async (
    therapistId: string, 
    status: Therapist['status'], 
    currentSessionId?: string
  ): Promise<void> => {
    const startTime = performance.now();
    
    try {
      await rosterService.updateTherapistStatus(therapistId, status, currentSessionId);
      
      // Invalidate cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      cacheService.delete(CacheKeys.THERAPIST_STATUS(therapistId));
      
      performanceMonitoring.trackUserAction('therapist-status-update', 'CachedRosterService', {
        therapistId,
        status,
        currentSessionId,
      });
      performanceMonitoring.trackTiming('therapist-status-update', startTime);
    } catch (error) {
      performanceMonitoring.trackTiming('therapist-status-update', startTime);
      throw error;
    }
  },

  /**
   * Update therapist stats with cache invalidation
   */
  updateTherapistStats: async (
    therapistId: string, 
    earnings: number, 
    sessions: number
  ): Promise<void> => {
    const startTime = performance.now();
    
    try {
      await rosterService.updateTherapistStats(therapistId, earnings, sessions);
      
      // Invalidate cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      cacheService.delete(CacheKeys.THERAPIST_STATUS(therapistId));
      
      performanceMonitoring.trackUserAction('therapist-stats-update', 'CachedRosterService', {
        therapistId,
        earnings,
        sessions,
      });
      performanceMonitoring.trackTiming('therapist-stats-update', startTime);
    } catch (error) {
      performanceMonitoring.trackTiming('therapist-stats-update', startTime);
      throw error;
    }
  },

  /**
   * Clear all today's data with cache invalidation
   */
  clearAllTodayData: async (): Promise<void> => {
    const startTime = performance.now();
    
    try {
      await rosterService.clearAllTodayData();
      
      // Invalidate all relevant cache
      cacheService.delete(CacheKeys.TODAY_ROSTER);
      cacheService.delete(CacheKeys.TODAY_SESSIONS);
      cacheService.delete(CacheKeys.DAILY_STATS);
      
      performanceMonitoring.trackUserAction('clear-all-data', 'CachedRosterService');
      performanceMonitoring.trackTiming('clear-all-data', startTime);
    } catch (error) {
      performanceMonitoring.trackTiming('clear-all-data', startTime);
      throw error;
    }
  },

  /**
   * Get therapist status from cache or API
   */
  getTherapistStatus: async (therapistId: string): Promise<Therapist | null> => {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = cacheService.get<Therapist>(CacheKeys.THERAPIST_STATUS(therapistId));
      if (cached) {
        performanceMonitoring.trackUserAction('therapist-status-cache-hit', 'CachedRosterService');
        return cached;
      }

      // Fetch from API
      const roster = await (this as unknown as { getTodayRoster: () => Promise<Therapist[]> }).getTodayRoster();
      const therapist = roster?.find((t: Therapist) => t.id === therapistId);
      
      if (therapist) {
        // Cache the result
        cacheService.set(CacheKeys.THERAPIST_STATUS(therapistId), therapist, CacheTTL.SHORT);
      }

      performanceMonitoring.trackTiming('therapist-status-fetch', startTime);
      return therapist || null;
    } catch (error) {
      performanceMonitoring.trackTiming('therapist-status-fetch', startTime);
      throw error;
    }
  },

  /**
   * Preload roster data for better performance
   */
  preloadRoster: async (): Promise<void> => {
    const startTime = performance.now();
    
    try {
      // Preload roster data
      await (this as unknown as { getTodayRoster: () => Promise<Therapist[]> }).getTodayRoster();
      
      performanceMonitoring.trackUserAction('roster-preload', 'CachedRosterService');
      performanceMonitoring.trackTiming('roster-preload', startTime);
    } catch (error) {
      performanceMonitoring.trackTiming('roster-preload', startTime);
      console.warn('Failed to preload roster data:', error);
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return cacheService.getStats();
  },

  /**
   * Clear all roster-related cache
   */
  clearCache: (): void => {
    cacheService.delete(CacheKeys.TODAY_ROSTER);
    // Note: Individual therapist statuses will be cleared by TTL
  },
};
