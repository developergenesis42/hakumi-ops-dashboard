/**
 * Cached Session Service
 * Enhanced session service with intelligent caching
 */

import { sessionService } from '@/services/sessionService';
import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { performanceMonitoring } from '@/config/monitoring';
import type { Session } from '@/types';

/**
 * Enhanced session service with caching
 */
export const cachedSessionService = {
  /**
   * Create a new session with cache invalidation
   */
  createSession: async (session: Session): Promise<Session> => {
    const startTime = performance.now();
    
    try {
      const result = await sessionService.createSession(session);
      
      // Invalidate cache
      cacheService.delete(CacheKeys.TODAY_SESSIONS);
      cacheService.delete(CacheKeys.DAILY_STATS);
      
      // Cache the new session
      cacheService.set(CacheKeys.SESSION_DETAILS(session.id), result, CacheTTL.MEDIUM);
      
      performanceMonitoring.trackUserAction('session-create', 'CachedSessionService', {
        sessionId: session.id,
        serviceId: session.service.id,
        therapistCount: session.therapistIds.length,
      });
      performanceMonitoring.trackTiming('session-create', startTime);
      
      return result;
    } catch (error) {
      performanceMonitoring.trackTiming('session-create', startTime);
      throw error;
    }
  },

  /**
   * Update an existing session with cache invalidation
   */
  updateSession: async (sessionId: string, updates: Partial<Session>): Promise<Session> => {
    const startTime = performance.now();
    
    try {
      // Convert actualEndTime to string if it exists
      const sessionUpdate = {
        ...updates,
        actualEndTime: updates.actualEndTime ? updates.actualEndTime.toISOString() : undefined
      };
      
      const result = await sessionService.updateSessionPartial(sessionId, sessionUpdate);
      
      // Invalidate cache
      cacheService.delete(CacheKeys.TODAY_SESSIONS);
      cacheService.delete(CacheKeys.SESSION_DETAILS(sessionId));
      cacheService.delete(CacheKeys.DAILY_STATS);
      
      // Cache the updated session
      cacheService.set(CacheKeys.SESSION_DETAILS(sessionId), result, CacheTTL.MEDIUM);
      
      performanceMonitoring.trackUserAction('session-update', 'CachedSessionService', {
        sessionId,
        updates: Object.keys(updates),
      });
      performanceMonitoring.trackTiming('session-update', startTime);
      
      return result;
    } catch (error) {
      performanceMonitoring.trackTiming('session-update', startTime);
      throw error;
    }
  },

  /**
   * Get all sessions for today with caching
   */
  getTodaySessions: async (forceRefresh: boolean = false): Promise<Session[]> => {
    const startTime = performance.now();
    
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheService.get<Session[]>(CacheKeys.TODAY_SESSIONS);
        if (cached) {
          performanceMonitoring.trackUserAction('sessions-cache-hit', 'CachedSessionService');
          return cached;
        }
      }

      // Fetch from API
      performanceMonitoring.trackUserAction('sessions-cache-miss', 'CachedSessionService');
      const sessions = await sessionService.getTodaySessions();
      
      // Cache the result
      cacheService.set(CacheKeys.TODAY_SESSIONS, sessions, CacheTTL.SHORT);
      
      // Also cache individual sessions
      sessions.forEach(session => {
        cacheService.set(
          CacheKeys.SESSION_DETAILS(session.id),
          session,
          CacheTTL.MEDIUM
        );
      });

      performanceMonitoring.trackTiming('sessions-fetch', startTime);
      return sessions;
    } catch (error) {
      performanceMonitoring.trackTiming('sessions-fetch', startTime);
      throw error;
    }
  },

  /**
   * Get session details from cache or API
   */
  getSessionDetails: async (sessionId: string): Promise<Session | null> => {
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = cacheService.get<Session>(CacheKeys.SESSION_DETAILS(sessionId));
      if (cached) {
        performanceMonitoring.trackUserAction('session-details-cache-hit', 'CachedSessionService');
        return cached;
      }

      // Fetch from API (get all sessions and find the one we need)
      const sessions = await cachedSessionService.getTodaySessions();
      const session = sessions?.find((s: Session) => s.id === sessionId);
      
      if (session) {
        // Cache the result
        cacheService.set(CacheKeys.SESSION_DETAILS(sessionId), session, CacheTTL.MEDIUM);
      }

      performanceMonitoring.trackTiming('session-details-fetch', startTime);
      return session || null;
    } catch (error) {
      performanceMonitoring.trackTiming('session-details-fetch', startTime);
      throw error;
    }
  },

  /**
   * Get sessions by therapist with caching
   */
  getSessionsByTherapist: async (therapistId: string): Promise<Session[]> => {
    const startTime = performance.now();
    
    try {
      const sessions = await cachedSessionService.getTodaySessions();
      const therapistSessions = sessions?.filter((session: Session) => 
        session.therapistIds.includes(therapistId)
      ) || [];

      performanceMonitoring.trackUserAction('sessions-by-therapist', 'CachedSessionService', {
        therapistId,
        sessionCount: therapistSessions.length,
      });
      performanceMonitoring.trackTiming('sessions-by-therapist', startTime);
      
      return therapistSessions;
    } catch (error) {
      performanceMonitoring.trackTiming('sessions-by-therapist', startTime);
      throw error;
    }
  },

  /**
   * Get sessions by service with caching
   */
  getSessionsByService: async (serviceId: string): Promise<Session[]> => {
    const startTime = performance.now();
    
    try {
      const sessions = await cachedSessionService.getTodaySessions();
      const serviceSessions = sessions?.filter((session: Session) => 
        session.service.id === serviceId
      ) || [];

      performanceMonitoring.trackUserAction('sessions-by-service', 'CachedSessionService', {
        serviceId,
        sessionCount: serviceSessions.length,
      });
      performanceMonitoring.trackTiming('sessions-by-service', startTime);
      
      return serviceSessions;
    } catch (error) {
      performanceMonitoring.trackTiming('sessions-by-service', startTime);
      throw error;
    }
  },

  /**
   * Get sessions by room with caching
   */
  getSessionsByRoom: async (roomId: string): Promise<Session[]> => {
    const startTime = performance.now();
    
    try {
      const sessions = await cachedSessionService.getTodaySessions();
      const roomSessions = sessions?.filter((session: Session) => 
        session.roomId === roomId
      ) || [];

      performanceMonitoring.trackUserAction('sessions-by-room', 'CachedSessionService', {
        roomId,
        sessionCount: roomSessions.length,
      });
      performanceMonitoring.trackTiming('sessions-by-room', startTime);
      
      return roomSessions;
    } catch (error) {
      performanceMonitoring.trackTiming('sessions-by-room', startTime);
      throw error;
    }
  },

  /**
   * Get active sessions with caching
   */
  getActiveSessions: async (): Promise<Session[]> => {
    const startTime = performance.now();
    
    try {
      const sessions = await cachedSessionService.getTodaySessions();
      const activeSessions = sessions?.filter((session: Session) => 
        session.status === 'in_progress'
      ) || [];

      performanceMonitoring.trackUserAction('active-sessions', 'CachedSessionService', {
        activeCount: activeSessions.length,
      });
      performanceMonitoring.trackTiming('active-sessions', startTime);
      
      return activeSessions;
    } catch (error) {
      performanceMonitoring.trackTiming('active-sessions', startTime);
      throw error;
    }
  },

  /**
   * Get completed sessions with caching
   */
  getCompletedSessions: async (): Promise<Session[]> => {
    const startTime = performance.now();
    
    try {
      const sessions = await cachedSessionService.getTodaySessions();
      const completedSessions = sessions?.filter((session: Session) => 
        session.status === 'completed'
      ) || [];

      performanceMonitoring.trackUserAction('completed-sessions', 'CachedSessionService', {
        completedCount: completedSessions.length,
      });
      performanceMonitoring.trackTiming('completed-sessions', startTime);
      
      return completedSessions;
    } catch (error) {
      performanceMonitoring.trackTiming('completed-sessions', startTime);
      throw error;
    }
  },

  /**
   * Preload session data for better performance
   */
  preloadSessions: async (): Promise<void> => {
    const startTime = performance.now();
    
    try {
      // Preload today's sessions
      await cachedSessionService.getTodaySessions();
      
      performanceMonitoring.trackUserAction('sessions-preload', 'CachedSessionService');
      performanceMonitoring.trackTiming('sessions-preload', startTime);
    } catch (error) {
      performanceMonitoring.trackTiming('sessions-preload', startTime);
      console.warn('Failed to preload session data:', error);
    }
  },

  /**
   * Get cache statistics
   */
  getCacheStats: () => {
    return cacheService.getStats();
  },

  /**
   * Clear all session-related cache
   */
  clearCache: (): void => {
    cacheService.delete(CacheKeys.TODAY_SESSIONS);
    cacheService.delete(CacheKeys.DAILY_STATS);
    // Note: Individual session details will be cleared by TTL
  },
};
