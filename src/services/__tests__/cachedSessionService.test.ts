import { cachedSessionService } from '@/services/cachedSessionService';
import { sessionService } from '@/services/sessionService';
import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { performanceMonitoring } from '@/config/monitoring';
import type { Session, Service } from '@/types';

// Mock dependencies
jest.mock('../sessionService');
jest.mock('../cacheService');
jest.mock('../../config/monitoring', () => ({
  performanceMonitoring: {
    trackUserAction: jest.fn(),
    trackTiming: jest.fn(),
  },
}));
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;
const mockCacheService = cacheService as jest.Mocked<typeof cacheService>;
const mockPerformanceMonitoring = performanceMonitoring as jest.Mocked<typeof performanceMonitoring>;

describe('cachedSessionService', () => {
  const mockService: Service = {
    id: '1',
    category: 'Single',
    roomType: 'Shower',
    duration: 60,
    price: 100,
    ladyPayout: 40,
    shopRevenue: 60,
    description: 'Test service',
  };

  const mockSession: Session = {
    id: 'session-1',
    therapistIds: ['1', '2'],
    service: mockService,
    roomId: 'room-1',
    startTime: new Date('2024-01-01T10:00:00'),
    endTime: new Date('2024-01-01T11:00:00'),
    discount: 0,
    totalPrice: 100,
    status: 'scheduled',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(performance, 'now').mockReturnValue(1000);
  });

  describe('createSession', () => {
    it('should create session and update cache', async () => {
      const createdSession = { ...mockSession, id: 'created-session' };
      mockSessionService.createSession.mockResolvedValue(createdSession);

      const result = await cachedSessionService.createSession(mockSession);

      expect(mockSessionService.createSession).toHaveBeenCalledWith(mockSession);
      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.TODAY_SESSIONS);
      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.DAILY_STATS);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        CacheKeys.SESSION_DETAILS(createdSession.id),
        createdSession,
        CacheTTL.MEDIUM
      );
      expect(mockPerformanceMonitoring.trackUserAction).toHaveBeenCalledWith(
        'session-create',
        'CachedSessionService',
        {
          sessionId: mockSession.id,
          serviceId: mockSession.service.id,
          therapistCount: mockSession.therapistIds.length,
        }
      );
      expect(mockPerformanceMonitoring.trackTiming).toHaveBeenCalledWith('session-create', 1000);
      expect(result).toEqual(createdSession);
    });

    it('should handle errors and still track timing', async () => {
      const error = new Error('Database error');
      mockSessionService.createSession.mockRejectedValue(error);

      await expect(cachedSessionService.createSession(mockSession)).rejects.toThrow('Database error');

      expect(mockPerformanceMonitoring.trackTiming).toHaveBeenCalledWith('session-create', 1000);
      expect(mockCacheService.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateSession', () => {
    it('should update session and invalidate cache', async () => {
      const updates = { status: 'completed' as const };
      const updatedSession = { ...mockSession, ...updates };
      mockSessionService.updateSessionPartial.mockResolvedValue(updatedSession);

      const result = await cachedSessionService.updateSession('session-1', updates);

      expect(mockSessionService.updateSessionPartial).toHaveBeenCalledWith('session-1', updates);
      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.TODAY_SESSIONS);
      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.SESSION_DETAILS('session-1'));
      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.DAILY_STATS);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        CacheKeys.SESSION_DETAILS('session-1'),
        updatedSession,
        CacheTTL.MEDIUM
      );
      expect(result).toEqual(updatedSession);
    });
  });

  describe('getTodaySessions', () => {
    it('should return cached sessions if available', async () => {
      const cachedSessions = [mockSession];
      mockCacheService.get.mockReturnValue(cachedSessions);

      const result = await cachedSessionService.getTodaySessions();

      expect(mockCacheService.get).toHaveBeenCalledWith(CacheKeys.TODAY_SESSIONS);
      expect(mockSessionService.getTodaySessions).not.toHaveBeenCalled();
      expect(result).toEqual(cachedSessions);
    });

    it('should fetch and cache sessions if not in cache', async () => {
      const sessions = [mockSession];
      mockCacheService.get.mockReturnValue(null);
      mockSessionService.getTodaySessions.mockResolvedValue(sessions);

      const result = await cachedSessionService.getTodaySessions();

      expect(mockSessionService.getTodaySessions).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        CacheKeys.TODAY_SESSIONS,
        sessions,
        CacheTTL.SHORT
      );
      expect(result).toEqual(sessions);
    });

    it('should force refresh when requested', async () => {
      const sessions = [mockSession];
      mockSessionService.getTodaySessions.mockResolvedValue(sessions);

      const result = await cachedSessionService.getTodaySessions(true);

      expect(mockSessionService.getTodaySessions).toHaveBeenCalled();
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(result).toEqual(sessions);
    });
  });

  describe('clearCache', () => {
    it('should clear session-related cache', () => {
      cachedSessionService.clearCache();

      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.TODAY_SESSIONS);
      expect(mockCacheService.delete).toHaveBeenCalledWith(CacheKeys.DAILY_STATS);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const mockStats = { hits: 10, misses: 5, size: 15, hitRate: 0.67, memoryUsage: 1024 };
      mockCacheService.getStats.mockReturnValue(mockStats);

      const result = cachedSessionService.getCacheStats();

      expect(mockCacheService.getStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('preloadSessions', () => {
    it('should preload session data', async () => {
      const sessions = [mockSession];
      mockSessionService.getTodaySessions.mockResolvedValue(sessions);

      await cachedSessionService.preloadSessions();

      expect(mockSessionService.getTodaySessions).toHaveBeenCalled();
      expect(mockCacheService.set).toHaveBeenCalledWith(
        CacheKeys.TODAY_SESSIONS,
        sessions,
        CacheTTL.SHORT
      );
    });

    it('should handle preload errors gracefully', async () => {
      const error = new Error('Preload failed');
      mockSessionService.getTodaySessions.mockRejectedValue(error);

      // Should not throw
      await expect(cachedSessionService.preloadSessions()).resolves.toBeUndefined();
    });
  });
});
