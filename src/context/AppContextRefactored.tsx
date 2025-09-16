import { useRef, useMemo, useReducer, useEffect } from 'react';
import { logger } from '@/utils/logger';
import type { AppState, AppAction, Session, WalkOut, Therapist, Room, Service } from '@/types';
import { stateCoordinator } from '@/context/stateCoordinator';
import { dataLoadingManager } from '@/services/dataLoadingManager';
import { dataSyncService } from '@/services/dataSyncService';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { sessionService } from '@/services/sessionService';
import { WalkoutService } from '@/services/walkoutService';
import { rosterService } from '@/services/rosterService';
import { dailyResetService } from '@/services/dailyResetService';
import { SessionExpirationChecker } from '@/components/SessionExpirationChecker';
import { AppContext } from '@/context/AppContextDefinition';
import { debugLog } from '@/config/environment';
import { loadDailyStatsFromLocalStorage, saveDailyStatsToLocalStorage } from '@/utils/completedSessionsPersistence';

// Provider component
export function AppProviderRefactored({ children }: { children: React.ReactNode }) {
  // Use real Supabase data
  const { therapists, rooms, services, loading } = useSupabaseData();
  const hasResetOnLogin = useRef(false);
  const hasLoadedData = useRef(false);
  
  // Load saved phase from localStorage, default to daily-operations (main dashboard)
  const savedPhase = useMemo(() => {
    return localStorage.getItem('spa-current-phase') as AppState['currentPhase'] || 'daily-operations';
  }, []);
  
  // Create initial state - start with empty data, will be populated from Supabase
  const initialState: AppState = useMemo(() => {
    const savedDailyStats = loadDailyStatsFromLocalStorage();
    const dailyStats = savedDailyStats || {
      totalSlips: 0,
      totalRevenue: 0,
      totalPayouts: 0,
      totalDiscounts: 0,
      shopRevenue: 0,
      walkOutCount: 0,
      completedSessions: 0,
    };
    
    return {
      currentPhase: savedPhase,
      therapists: [],
      todayRoster: [],
      rooms: [],
      services: [],
      sessions: [],
      walkOuts: [],
      dailyStats,
      history: [],
      undoStack: [],
    };
  }, [savedPhase]);

  // Use state coordinator instead of combined reducer
  const [state, dispatch] = useReducer(
    (state: AppState, action: AppAction) => stateCoordinator.processStateUpdate(state, action),
    initialState
  );

  // Register data loading operations
  useEffect(() => {
    // Register Supabase data loading
    dataLoadingManager.registerOperation({
      id: 'supabase-data',
      config: {
        id: 'supabase-data',
        priority: 'high',
        timeout: 10000
      },
      operation: async () => {
        return { therapists, rooms, services };
      },
      onSuccess: (data) => {
        if (!hasLoadedData.current) {
          dispatch({
            type: 'LOAD_SUPABASE_DATA',
            payload: data as { therapists: Therapist[]; rooms: Room[]; services: Service[] }
          });
          hasLoadedData.current = true;
        }
      }
    });

    // Register sessions loading
    dataLoadingManager.registerOperation({
      id: 'sessions',
      config: {
        id: 'sessions',
        dependencies: ['supabase-data'],
        priority: 'medium',
        timeout: 5000
      },
      operation: async () => {
        return sessionService.getTodaySessions();
      },
      onSuccess: (sessions) => {
        dispatch({
          type: 'LOAD_SESSIONS',
          payload: sessions as Session[]
        });
      }
    });

    // Register walkouts loading
    dataLoadingManager.registerOperation({
      id: 'walkouts',
      config: {
        id: 'walkouts',
        dependencies: ['supabase-data'],
        priority: 'medium',
        timeout: 5000
      },
      operation: async () => {
        return WalkoutService.loadTodayWalkOuts();
      },
      onSuccess: (walkouts) => {
        dispatch({
          type: 'LOAD_WALK_OUTS',
          payload: walkouts as WalkOut[]
        });
      }
    });

    // Register roster loading
    dataLoadingManager.registerOperation({
      id: 'roster',
      config: {
        id: 'roster',
        dependencies: ['supabase-data'],
        priority: 'medium',
        timeout: 5000
      },
      operation: async () => {
        return rosterService.getTodayRoster();
      },
      onSuccess: (roster) => {
        dispatch({
          type: 'LOAD_TODAY_ROSTER',
          payload: roster as Therapist[]
        });
      }
    });
  }, [therapists, rooms, services]);

  // Execute data loading when Supabase data is ready
  useEffect(() => {
    if (!loading && !hasLoadedData.current && (therapists.length > 0 || rooms.length > 0 || services.length > 0)) {
      debugLog('AppContextRefactored: Starting coordinated data loading');
      
      // Execute all operations in parallel
      dataLoadingManager.executeOperations(['supabase-data', 'sessions', 'walkouts', 'roster'])
        .catch(error => {
          logger.error('Data loading failed:', error);
        });
    }
  }, [loading, therapists.length, rooms.length, services.length]);

  // Initialize daily reset and load today's roster
  useEffect(() => {
    const initializeDailyRoster = async () => {
      try {
        const wasReset = await dailyResetService.initializeDailyReset();
        
        if (wasReset) {
          debugLog('Daily reset performed, starting with empty roster');
          dispatch({
            type: 'LOAD_TODAY_ROSTER',
            payload: []
          });
        } else {
          // Load today's roster from database first, then localStorage as fallback
          try {
            const todayRoster = await rosterService.getTodayRoster();
            if (todayRoster.length > 0) {
              debugLog('Loaded today roster from database:', todayRoster.length, 'therapists');
              dispatch({
                type: 'LOAD_TODAY_ROSTER',
                payload: todayRoster
              });
              localStorage.setItem('todayRoster', JSON.stringify(todayRoster));
            } else {
              const localRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
              debugLog('Loaded today roster from local storage:', localRoster.length, 'therapists');
              dispatch({
                type: 'LOAD_TODAY_ROSTER',
                payload: localRoster
              });
            }
          } catch (dbError) {
            logger.warn('Failed to load from database, using localStorage:', dbError);
            const localRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
            dispatch({
              type: 'LOAD_TODAY_ROSTER',
              payload: localRoster
            });
          }
        }
      } catch (error) {
        logger.error('Failed to initialize daily roster:', error);
        dispatch({
          type: 'LOAD_TODAY_ROSTER',
          payload: []
        });
      }
    };

    initializeDailyRoster();
  }, [dispatch]);

  // Set up real-time synchronization
  useEffect(() => {
    if (!loading && hasLoadedData.current) {
      debugLog('AppContextRefactored: Setting up real-time sync');
      
      // Set up real-time sync for sessions
      const cleanupSessions = dataSyncService.setupRealtimeSync('sessions', (sessions) => {
        dispatch({
          type: 'LOAD_SESSIONS',
          payload: sessions as Session[]
        });
      });

      // Set up real-time sync for walkouts
      const cleanupWalkouts = dataSyncService.setupRealtimeSync('walkouts', (walkouts) => {
        dispatch({
          type: 'LOAD_WALK_OUTS',
          payload: walkouts as WalkOut[]
        });
      });

      // Set up real-time sync for roster
      const cleanupRoster = dataSyncService.setupRealtimeSync('roster', (roster) => {
        dispatch({
          type: 'LOAD_TODAY_ROSTER',
          payload: roster as Therapist[]
        });
      });

      return () => {
        cleanupSessions();
        cleanupWalkouts();
        cleanupRoster();
      };
    }
  }, [loading]);

  // Save current phase to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('spa-current-phase', state.currentPhase);
  }, [state.currentPhase]);

  // Save daily stats to localStorage whenever it changes
  useEffect(() => {
    saveDailyStatsToLocalStorage(state.dailyStats);
  }, [state.dailyStats]);

  // Reset to daily operations dashboard when user logs in (only on initial login)
  useEffect(() => {
    debugLog('AppContextRefactored: Login effect triggered:', { 
      hasResetOnLogin: hasResetOnLogin.current 
    });
    
    if (!hasResetOnLogin.current) {
      hasResetOnLogin.current = true;
      const savedPhase = localStorage.getItem('spa-current-phase');
      if (!savedPhase) {
        debugLog('AppContextRefactored: Setting phase to daily-operations');
        dispatch({ type: 'SET_PHASE', payload: 'daily-operations' });
      }
    } else {
      hasResetOnLogin.current = false;
    }
  }, []);

  // Set up conflict resolvers
  useEffect(() => {
    dataSyncService.registerConflictResolver('sessions', (local: unknown, remote: unknown) => {
      // Use remote data if it's newer, otherwise keep local
      const localData = local as { updatedAt: string };
      const remoteData = remote as { updatedAt: string };
      return new Date(remoteData.updatedAt) > new Date(localData.updatedAt) ? remote : local;
    });

    dataSyncService.registerConflictResolver('walkouts', (local: unknown, remote: unknown) => {
      const localData = local as { updatedAt: string };
      const remoteData = remote as { updatedAt: string };
      return new Date(remoteData.updatedAt) > new Date(localData.updatedAt) ? remote : local;
    });

    dataSyncService.registerConflictResolver('roster', (local: unknown, remote: unknown) => {
      const localData = local as { updatedAt: string };
      const remoteData = remote as { updatedAt: string };
      return new Date(remoteData.updatedAt) > new Date(localData.updatedAt) ? remote : local;
    });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <SessionExpirationChecker />
      {children}
    </AppContext.Provider>
  );
}
