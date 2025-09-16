/**
 * Cached Data Hook
 * React hook for using cached data services with automatic cache management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '@/services/cacheService';
import { cachedRosterService } from '@/services/cachedRosterService';
import { cachedSessionService } from '@/services/cachedSessionService';
import { performanceMonitoring } from '@/config/monitoring';
import type { Therapist, Session } from '@/types';

export interface UseCachedDataOptions {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  enablePreloading?: boolean;
  trackPerformance?: boolean;
}

/**
 * Hook for cached roster data
 */
export const useCachedRoster = (options: UseCachedDataOptions = {}) => {
  const {
    enableAutoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enablePreloading = true,
    trackPerformance = true,
  } = options;

  const [roster, setRoster] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchRoster = useCallback(async (forceRefresh: boolean = false) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('roster-fetch-start', 'useCachedRoster', {
        forceRefresh,
      });
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await cachedRosterService.getTodayRoster(forceRefresh);
      setRoster(data);
      setLastUpdated(new Date());
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('roster-fetch-success', 'useCachedRoster', {
          count: data.length,
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('roster-fetch-error', 'useCachedRoster', {
          error: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [trackPerformance]);

  const refreshRoster = useCallback(() => {
    return fetchRoster(true);
  }, [fetchRoster]);

  const addTherapist = useCallback(async (therapistId: string) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('roster-add-start', 'useCachedRoster');
    }

    try {
      await cachedRosterService.addToTodayRoster(therapistId);
      await fetchRoster(true); // Refresh after adding
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('roster-add-success', 'useCachedRoster');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('roster-add-error', 'useCachedRoster', {
          error: error.message,
        });
      }
      throw error;
    }
  }, [fetchRoster, trackPerformance]);

  const removeTherapist = useCallback(async (therapistId: string) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('roster-remove-start', 'useCachedRoster');
    }

    try {
      await cachedRosterService.removeFromTodayRoster(therapistId);
      await fetchRoster(true); // Refresh after removing
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('roster-remove-success', 'useCachedRoster');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('roster-remove-error', 'useCachedRoster', {
          error: error.message,
        });
      }
      throw error;
    }
  }, [fetchRoster, trackPerformance]);

  const updateTherapistStatus = useCallback(async (
    therapistId: string,
    status: Therapist['status'],
    currentSessionId?: string
  ) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('therapist-status-update-start', 'useCachedRoster');
    }

    try {
      await cachedRosterService.updateTherapistStatus(therapistId, status, currentSessionId);
      await fetchRoster(true); // Refresh after updating
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('therapist-status-update-success', 'useCachedRoster');
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('therapist-status-update-error', 'useCachedRoster', {
          error: error.message,
        });
      }
      throw error;
    }
  }, [fetchRoster, trackPerformance]);

  // Initial load
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (enablePreloading) {
        cachedRosterService.preloadRoster();
      }
      
      fetchRoster();
    }
  }, [fetchRoster, enablePreloading]);

  // Auto refresh
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchRoster();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableAutoRefresh, refreshInterval, fetchRoster]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    roster,
    loading,
    error,
    lastUpdated,
    refreshRoster,
    addTherapist,
    removeTherapist,
    updateTherapistStatus,
    cacheStats: cachedRosterService.getCacheStats(),
  };
};

/**
 * Hook for cached session data
 */
export const useCachedSessions = (options: UseCachedDataOptions = {}) => {
  const {
    enableAutoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enablePreloading = true,
    trackPerformance = true,
  } = options;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  const fetchSessions = useCallback(async (forceRefresh: boolean = false) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('sessions-fetch-start', 'useCachedSessions', {
        forceRefresh,
      });
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await cachedSessionService.getTodaySessions(forceRefresh);
      setSessions(data);
      setLastUpdated(new Date());
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('sessions-fetch-success', 'useCachedSessions', {
          count: data.length,
        });
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('sessions-fetch-error', 'useCachedSessions', {
          error: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [trackPerformance]);

  const refreshSessions = useCallback(() => {
    return fetchSessions(true);
  }, [fetchSessions]);

  const createSession = useCallback(async (session: Session) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('session-create-start', 'useCachedSessions');
    }

    try {
      const newSession = await cachedSessionService.createSession(session);
      await fetchSessions(true); // Refresh after creating
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('session-create-success', 'useCachedSessions');
      }
      
      return newSession;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('session-create-error', 'useCachedSessions', {
          error: error.message,
        });
      }
      throw error;
    }
  }, [fetchSessions, trackPerformance]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    if (trackPerformance) {
      performanceMonitoring.trackUserAction('session-update-start', 'useCachedSessions');
    }

    try {
      const updatedSession = await cachedSessionService.updateSession(sessionId, updates);
      await fetchSessions(true); // Refresh after updating
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('session-update-success', 'useCachedSessions');
      }
      
      return updatedSession;
    } catch (err) {
      const error = err as Error;
      setError(error);
      
      if (trackPerformance) {
        performanceMonitoring.trackUserAction('session-update-error', 'useCachedSessions', {
          error: error.message,
        });
      }
      throw error;
    }
  }, [fetchSessions, trackPerformance]);

  const getSessionsByTherapist = useCallback(async (therapistId: string) => {
    return cachedSessionService.getSessionsByTherapist(therapistId);
  }, []);

  const getSessionsByService = useCallback(async (serviceId: string) => {
    return cachedSessionService.getSessionsByService(serviceId);
  }, []);

  const getSessionsByRoom = useCallback(async (roomId: string) => {
    return cachedSessionService.getSessionsByRoom(roomId);
  }, []);

  const getActiveSessions = useCallback(async () => {
    return cachedSessionService.getActiveSessions();
  }, []);

  const getCompletedSessions = useCallback(async () => {
    return cachedSessionService.getCompletedSessions();
  }, []);

  // Initial load
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      
      if (enablePreloading) {
        cachedSessionService.preloadSessions();
      }
      
      fetchSessions();
    }
  }, [fetchSessions, enablePreloading]);

  // Auto refresh
  useEffect(() => {
    if (enableAutoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        fetchSessions();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableAutoRefresh, refreshInterval, fetchSessions]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    sessions,
    loading,
    error,
    lastUpdated,
    refreshSessions,
    createSession,
    updateSession,
    getSessionsByTherapist,
    getSessionsByService,
    getSessionsByRoom,
    getActiveSessions,
    getCompletedSessions,
    cacheStats: cachedSessionService.getCacheStats(),
  };
};

/**
 * Hook for cache management
 */
export const useCacheManagement = () => {
  const clearAllCache = useCallback(() => {
    cacheService.clear();
    performanceMonitoring.trackUserAction('cache-clear-all', 'useCacheManagement');
  }, []);

  const clearRosterCache = useCallback(() => {
    cachedRosterService.clearCache();
    performanceMonitoring.trackUserAction('cache-clear-roster', 'useCacheManagement');
  }, []);

  const clearSessionCache = useCallback(() => {
    cachedSessionService.clearCache();
    performanceMonitoring.trackUserAction('cache-clear-sessions', 'useCacheManagement');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      general: cacheService.getStats(),
      roster: cachedRosterService.getCacheStats(),
      sessions: cachedSessionService.getCacheStats(),
    };
  }, []);

  return {
    clearAllCache,
    clearRosterCache,
    clearSessionCache,
    getCacheStats,
  };
};
