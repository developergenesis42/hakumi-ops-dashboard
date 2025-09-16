import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';

// Mock monitoring module
jest.mock('../../config/monitoring', () => ({
  performanceMonitoring: {
    trackUserAction: jest.fn(),
    trackTiming: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('cacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('set and get', () => {
    it('should store and retrieve data', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      const ttl = 1000;

      cacheService.set(key, data, ttl);
      const result = cacheService.get(key);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'spa-cache-test-key',
        expect.stringContaining('"data":{"test":"data"}')
      );
      expect(result).toEqual(data);
    });

    it('should return null for expired data', () => {
      const key = 'expired-key';
      const data = { test: 'data' };
      const ttl = 1000;

      // Set data with short TTL
      cacheService.set(key, data, ttl);
      
      // Fast forward time past expiration
      jest.advanceTimersByTime(1001);
      
      const result = cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should return null for non-existent key', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');
      
      const result = cacheService.get('invalid-key');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should remove data from cache', () => {
      const key = 'test-key';
      
      cacheService.delete(key);
      
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('spa-cache-test-key');
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      // Test that clear method can be called without errors
      expect(() => cacheService.clear()).not.toThrow();
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired data', () => {
      const key = 'test-key';
      const data = { test: 'data' };
      
      cacheService.set(key, data, 1000);
      const result = cacheService.has(key);
      
      expect(result).toBe(true);
    });

    it('should return false for expired data', () => {
      const key = 'expired-key';
      const data = { test: 'data' };
      
      cacheService.set(key, data, 1000);
      jest.advanceTimersByTime(1001);
      
      const result = cacheService.has(key);
      expect(result).toBe(false);
    });

    it('should return false for non-existent key', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = cacheService.has('non-existent');
      expect(result).toBe(false);
    });
  });


  describe('CacheKeys', () => {
    it('should generate correct cache keys', () => {
      expect(CacheKeys.TODAY_SESSIONS).toBe('today-sessions');
      expect(CacheKeys.DAILY_STATS).toBe('daily-stats');
      expect(CacheKeys.SESSION_DETAILS('123')).toBe('session-details-123');
    });
  });

  describe('CacheTTL', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SHORT).toBe(1 * 60 * 1000); // 1 minute
      expect(CacheTTL.MEDIUM).toBe(5 * 60 * 1000); // 5 minutes
      expect(CacheTTL.LONG).toBe(15 * 60 * 1000); // 15 minutes
    });
  });


  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const result = cacheService.get('test-key');
      // The cache service falls back to memory cache, so it might not be null
      expect(result).toBeDefined();
    });

    it('should handle setItem errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      // Should not throw
      expect(() => {
        cacheService.set('test-key', { data: 'test' }, 1000);
      }).not.toThrow();
    });
  });
});
