import { renderHook, act } from '@testing-library/react';
import {
  useCachedRoster,
  useCachedSessions,
  useCacheManagement,
} from '@/hooks/useCachedData';
import { cachedRosterService } from '@/services/cachedRosterService';
import { cachedSessionService } from '@/services/cachedSessionService';
import { cacheService } from '@/services/cacheService';
import { performanceMonitoring } from '@/config/monitoring';
import type { Therapist, Session } from '@/types';

// Mock dependencies
jest.mock('../../services/cachedRosterService');
jest.mock('../../services/cachedSessionService');
jest.mock('../../services/cacheService');
jest.mock('../../config/monitoring');

const mockCachedRosterService = cachedRosterService as jest.Mocked<typeof cachedRosterService>;
const mockCachedSessionService = cachedSessionService as jest.Mocked<typeof cachedSessionService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockPerformanceMonitoring = performanceMonitoring as jest.Mocked<typeof performanceMonitoring>;

describe('useCachedData', () => {
  const mockTherapists: Therapist[] = [
    { id: '1', name: 'John Doe', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    { id: '2', name: 'Jane Smith', status: 'in-session', totalEarnings: 0, totalSessions: 0, expenses: [] },
  ];

  const mockSessions: Session[] = [
    {
      id: 'session-1',
      therapistIds: ['1'],
      service: { id: 'service-1', category: 'Single', roomType: 'Shower', duration: 60, price: 100, ladyPayout: 50, shopRevenue: 50, description: 'Massage' },
      roomId: 'room-1',
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      discount: 0,
      totalPrice: 100,
      status: 'scheduled',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockCachedRosterService.getTodayRoster.mockResolvedValue(mockTherapists);
    mockCachedRosterService.addToTodayRoster.mockResolvedValue('therapist-1');
    mockCachedRosterService.clearCache.mockReturnValue(undefined);
    mockCachedRosterService.removeFromTodayRoster.mockResolvedValue(true);
    mockCachedRosterService.updateTherapistStatus.mockResolvedValue(undefined);
    mockCachedRosterService.getCacheStats.mockReturnValue({
      hits: 5,
      misses: 2,
      hitRate: 0.7,
      memoryUsage: 1024,
      size: 10
    });
    mockCachedRosterService.preloadRoster.mockResolvedValue(undefined);

    mockCachedSessionService.getTodaySessions.mockResolvedValue(mockSessions);
    mockCachedSessionService.createSession.mockResolvedValue(mockSessions[0]);
    mockCachedSessionService.updateSession.mockResolvedValue(mockSessions[0]);
    mockCachedSessionService.getSessionsByTherapist.mockResolvedValue(mockSessions);
    mockCachedSessionService.getSessionsByService.mockResolvedValue(mockSessions);
    mockCachedSessionService.getSessionsByRoom.mockResolvedValue(mockSessions);
    mockCachedSessionService.getActiveSessions.mockResolvedValue(mockSessions);
    mockCachedSessionService.getCompletedSessions.mockResolvedValue([]);
    mockCachedSessionService.clearCache.mockReturnValue(undefined);
    mockCachedSessionService.getCacheStats.mockReturnValue({
      hits: 3,
      misses: 1,
      hitRate: 0.75,
      memoryUsage: 512,
      size: 5
    });
    mockCachedSessionService.preloadSessions.mockResolvedValue(undefined);

    mockCacheService.clear.mockReturnValue(undefined);
    mockCacheService.getStats.mockReturnValue({ hits: 80, misses: 20, size: 100, hitRate: 0.8, memoryUsage: 2048 });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('useCachedRoster', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useCachedRoster());

      expect(result.current.loading).toBe(true);
      expect(result.current.roster).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch roster on mount', async () => {
      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCachedRosterService.getTodayRoster).toHaveBeenCalledWith(false);
      expect(result.current.roster).toEqual(mockTherapists);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should preload roster when enabled', async () => {
      renderHook(() => useCachedRoster({ enablePreloading: true }));

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCachedRosterService.preloadRoster).toHaveBeenCalled();
    });

    it('should not preload roster when disabled', async () => {
      renderHook(() => useCachedRoster({ enablePreloading: false }));

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCachedRosterService.preloadRoster).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      const error = new Error('Fetch failed');
      mockCachedRosterService.getTodayRoster.mockRejectedValue(error);

      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.loading).toBe(false);
    });

    it('should track performance when enabled', async () => {
      renderHook(() => useCachedRoster({ trackPerformance: true }));

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockPerformanceMonitoring.trackUserAction).toHaveBeenCalledWith(
        'roster-fetch-start',
        'useCachedRoster',
        { forceRefresh: false }
      );
      expect(mockPerformanceMonitoring.trackUserAction).toHaveBeenCalledWith(
        'roster-fetch-success',
        'useCachedRoster',
        { count: mockTherapists.length }
      );
    });

    it('should not track performance when disabled', async () => {
      renderHook(() => useCachedRoster({ trackPerformance: false }));

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockPerformanceMonitoring.trackUserAction).not.toHaveBeenCalled();
    });

    it('should refresh roster', async () => {
      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        await result.current.refreshRoster();
      });

      expect(mockCachedRosterService.getTodayRoster).toHaveBeenCalledWith(true);
    });

    it('should add therapist', async () => {
      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        await result.current.addTherapist('therapist-3');
      });

      expect(mockCachedRosterService.addToTodayRoster).toHaveBeenCalledWith('therapist-3');
      expect(mockCachedRosterService.getTodayRoster).toHaveBeenCalledWith(true);
    });

    it('should handle add therapist error', async () => {
      const error = new Error('Add failed');
      mockCachedRosterService.addToTodayRoster.mockRejectedValue(error);

      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        try {
          await result.current.addTherapist('therapist-3');
        } catch {
          // Expected to throw
        }
      });

      expect(result.current.error).toEqual(error);
    });

    it('should remove therapist', async () => {
      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        await result.current.removeTherapist('therapist-1');
      });

      expect(mockCachedRosterService.removeFromTodayRoster).toHaveBeenCalledWith('therapist-1');
      expect(mockCachedRosterService.getTodayRoster).toHaveBeenCalledWith(true);
    });

    it('should update therapist status', async () => {
      const { result } = renderHook(() => useCachedRoster());

      await act(async () => {
        await result.current.updateTherapistStatus('therapist-1', 'in-session', 'session-1');
      });

      expect(mockCachedRosterService.updateTherapistStatus).toHaveBeenCalledWith(
        'therapist-1',
        'in-session',
        'session-1'
      );
      expect(mockCachedRosterService.getTodayRoster).toHaveBeenCalledWith(true);
    });

    it('should return cache stats', () => {
      const { result } = renderHook(() => useCachedRoster());

      expect(result.current.cacheStats).toEqual({ 
        hits: 5, 
        misses: 2, 
        hitRate: 0.7, 
        memoryUsage: 1024, 
        size: 10 
      });
    });

    it('should set up auto refresh interval', async () => {
      jest.useFakeTimers();
      renderHook(() => useCachedRoster({ 
        enableAutoRefresh: true, 
        refreshInterval: 1000 
      }));

      await act(async () => {
        await Promise.resolve();
      });

      // Clear the initial call
      jest.clearAllMocks();

      // Advance time by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockCachedRosterService.getTodayRoster).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not set up auto refresh when disabled', async () => {
      jest.useFakeTimers();
      renderHook(() => useCachedRoster({ 
        enableAutoRefresh: false 
      }));

      await act(async () => {
        await Promise.resolve();
      });

      jest.clearAllMocks();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockCachedRosterService.getTodayRoster).not.toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('useCachedSessions', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useCachedSessions());

      expect(result.current.loading).toBe(true);
      expect(result.current.sessions).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should fetch sessions on mount', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCachedSessionService.getTodaySessions).toHaveBeenCalledWith(false);
      expect(result.current.sessions).toEqual(mockSessions);
      expect(result.current.loading).toBe(false);
    });

    it('should create session', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const newSession = await result.current.createSession(mockSessions[0]);
        expect(newSession).toEqual(mockSessions[0]);
      });

      expect(mockCachedSessionService.createSession).toHaveBeenCalledWith(mockSessions[0]);
      expect(mockCachedSessionService.getTodaySessions).toHaveBeenCalledWith(true);
    });

    it('should update session', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const updatedSession = await result.current.updateSession('session-1', { status: 'completed' });
        expect(updatedSession).toEqual(mockSessions[0]);
      });

      expect(mockCachedSessionService.updateSession).toHaveBeenCalledWith('session-1', { status: 'completed' });
      expect(mockCachedSessionService.getTodaySessions).toHaveBeenCalledWith(true);
    });

    it('should get sessions by therapist', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const sessions = await result.current.getSessionsByTherapist('therapist-1');
        expect(sessions).toEqual(mockSessions);
      });

      expect(mockCachedSessionService.getSessionsByTherapist).toHaveBeenCalledWith('therapist-1');
    });

    it('should get sessions by service', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const sessions = await result.current.getSessionsByService('service-1');
        expect(sessions).toEqual(mockSessions);
      });

      expect(mockCachedSessionService.getSessionsByService).toHaveBeenCalledWith('service-1');
    });

    it('should get sessions by room', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const sessions = await result.current.getSessionsByRoom('room-1');
        expect(sessions).toEqual(mockSessions);
      });

      expect(mockCachedSessionService.getSessionsByRoom).toHaveBeenCalledWith('room-1');
    });

    it('should get active sessions', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const sessions = await result.current.getActiveSessions();
        expect(sessions).toEqual(mockSessions);
      });

      expect(mockCachedSessionService.getActiveSessions).toHaveBeenCalled();
    });

    it('should get completed sessions', async () => {
      const { result } = renderHook(() => useCachedSessions());

      await act(async () => {
        const sessions = await result.current.getCompletedSessions();
        expect(sessions).toEqual([]);
      });

      expect(mockCachedSessionService.getCompletedSessions).toHaveBeenCalled();
    });
  });

  describe('useCacheManagement', () => {
    it('should clear all cache', () => {
      const { result } = renderHook(() => useCacheManagement());

      act(() => {
        result.current.clearAllCache();
      });

      expect(mockCacheService.clear).toHaveBeenCalled();
      expect(mockPerformanceMonitoring.trackUserAction).toHaveBeenCalledWith(
        'cache-clear-all',
        'useCacheManagement'
      );
    });

    it('should clear roster cache', () => {
      const { result } = renderHook(() => useCacheManagement());

      act(() => {
        result.current.clearRosterCache();
      });

      expect(mockCachedRosterService.clearCache).toHaveBeenCalled();
      expect(mockPerformanceMonitoring.trackUserAction).toHaveBeenCalledWith(
        'cache-clear-roster',
        'useCacheManagement'
      );
    });

    it('should clear session cache', () => {
      const { result } = renderHook(() => useCacheManagement());

      act(() => {
        result.current.clearSessionCache();
      });

      expect(mockCachedSessionService.clearCache).toHaveBeenCalled();
      expect(mockPerformanceMonitoring.trackUserAction).toHaveBeenCalledWith(
        'cache-clear-sessions',
        'useCacheManagement'
      );
    });

    it('should get cache stats', () => {
      const { result } = renderHook(() => useCacheManagement());

      const stats = result.current.getCacheStats();

      expect(stats).toEqual({
        general: { 
          size: 100, 
          hitRate: 0.8, 
          hits: 80, 
          memoryUsage: 2048, 
          misses: 20 
        },
        roster: { 
          hits: 5, 
          misses: 2, 
          hitRate: 0.7, 
          memoryUsage: 1024, 
          size: 10 
        },
        sessions: { 
          hits: 3, 
          misses: 1, 
          hitRate: 0.75, 
          memoryUsage: 512, 
          size: 5 
        },
      });
    });
  });
});
