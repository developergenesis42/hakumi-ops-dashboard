/**
 * Rate Limiter Serjestce Tests
 * Comprehensive tests for rate limiting functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RateLimiter, RateLimiterManager, RateLimitAlgorithm, RATE_LIMIT_CONFIGS } from '@/services/rateLimiterService';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  const testConfig = {
    windowMs: 1000, // 1 second
    maxRequests: 5,
    algorithm: RateLimitAlgorithm.FIXED_WINDOW,
  };

  beforeEach(() => {
    rateLimiter = new RateLimiter(testConfig);
    jest.clearAllMocks();
  });

  afterEach(() => {
    rateLimiter.destroy();
  });

  describe('Fixed Window Algorithm', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'test-user';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.check(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests exceeding limit', async () => {
      const identifier = 'test-user';
      
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(identifier);
      }
      
      // 6th request should be blocked
      const result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should reset after window expires', async () => {
      const identifier = 'test-user';
      
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(identifier);
      }
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should be allowed again
      const result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('Sliding Window Algorithm', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
        algorithm: RateLimitAlgorithm.SLIDING_WINDOW,
      });
    });

    it('should allow requests within sliding window', async () => {
      const identifier = 'test-user';
      
      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = await rateLimiter.check(identifier);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should slide the window correctly', async () => {
      const identifier = 'test-user';
      
      // Make 3 requests
      await rateLimiter.check(identifier);
      await rateLimiter.check(identifier);
      await rateLimiter.check(identifier);
      
      // Wait 600ms (half window)
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Make 2 more requests (should be allowed)
      await rateLimiter.check(identifier);
      const result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
      
      // Wait another 500ms (total 1100ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should be able to make more requests as window slides
      const newResult = await rateLimiter.check(identifier);
      expect(newResult.allowed).toBe(true);
    });
  });

  describe('Token Bucket Algorithm', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
        algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
      });
    });

    it('should consume tokens correctly', async () => {
      const identifier = 'test-user';
      
      // First request should consume 1 token
      const result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should refill tokens over time', async () => {
      const identifier = 'test-user';
      
      // Exhaust all tokens
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(identifier);
      }
      
      // Wait for token refill (500ms should refill ~2.5 tokens)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('Leaky Bucket Algorithm', () => {
    beforeEach(() => {
      rateLimiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
        algorithm: RateLimitAlgorithm.LEAKY_BUCKET,
      });
    });

    it('should leak requests over time', async () => {
      const identifier = 'test-user';
      
      // Fill the bucket
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(identifier);
      }
      
      // Wait for leakage (500ms should leak ~2.5 requests)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Should be able to add more requests
      const result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Key Generation', () => {
    it('should use custom key generator', async () => {
      const customKeyGenerator = (id: string) => `custom:${id}`;
      
      rateLimiter = new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
        algorithm: RateLimitAlgorithm.FIXED_WINDOW,
        keyGenerator: customKeyGenerator,
      });
      
      const result = await rateLimiter.check('user1');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Status Retrieval', () => {
    it('should return current status', async () => {
      const identifier = 'test-user';
      
      // Make some requests
      await rateLimiter.check(identifier);
      await rateLimiter.check(identifier);
      
      const status = rateLimiter.getStatus(identifier);
      expect(status).toBeDefined();
      expect(status?.allowed).toBe(true);
      expect(status?.remaining).toBe(3);
    });

    it('should return null for non-existent key', () => {
      const status = rateLimiter.getStatus('non-existent');
      expect(status).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset rate limit for identifier', async () => {
      const identifier = 'test-user';
      
      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        await rateLimiter.check(identifier);
      }
      
      // Should be blocked
      let result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(false);
      
      // Reset
      rateLimiter.reset(identifier);
      
      // Should be allowed again
      result = await rateLimiter.check(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });
});

describe('RateLimiterManager', () => {
  let manager: RateLimiterManager;

  beforeEach(() => {
    manager = new RateLimiterManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('should add and remove limiters', () => {
    const config = {
      windowMs: 1000,
      maxRequests: 5,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    };
    
    manager.addLimiter('test', config);
    expect(manager.getStatusAll('test').test).toBeNull(); // No requests made yet
    
    manager.removeLimiter('test');
    expect(() => manager.check('test', 'user1')).rejects.toThrow();
  });

  it('should check multiple limiters', async () => {
    const config1 = {
      windowMs: 1000,
      maxRequests: 5,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    };
    
    const config2 = {
      windowMs: 1000,
      maxRequests: 3,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    };
    
    manager.addLimiter('limiter1', config1);
    manager.addLimiter('limiter2', config2);
    
    const results = await manager.checkAll('user1');
    expect(results).toHaveLength(2);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(true);
  });

  it('should stop checking when any limiter blocks', async () => {
    const config1 = {
      windowMs: 1000,
      maxRequests: 5,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    };
    
    const config2 = {
      windowMs: 1000,
      maxRequests: 1,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    };
    
    manager.addLimiter('limiter1', config1);
    manager.addLimiter('limiter2', config2);
    
    // Exhaust limiter2
    await manager.check('limiter2', 'user1');
    
    const results = await manager.checkAll('user1');
    expect(results).toHaveLength(2);
    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(false);
  });
});

describe('Rate Limit Configurations', () => {
  it('should have valid configurations', () => {
    expect(RATE_LIMIT_CONFIGS.AUTH_LOGIN).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.AUTH_LOGIN.windowMs).toBeGreaterThan(0);
    expect(RATE_LIMIT_CONFIGS.AUTH_LOGIN.maxRequests).toBeGreaterThan(0);
    
    expect(RATE_LIMIT_CONFIGS.API_GENERAL).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.API_GENERAL.windowMs).toBeGreaterThan(0);
    expect(RATE_LIMIT_CONFIGS.API_GENERAL.maxRequests).toBeGreaterThan(0);
    
    expect(RATE_LIMIT_CONFIGS.SESSION_CREATE).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.SESSION_CREATE.windowMs).toBeGreaterThan(0);
    expect(RATE_LIMIT_CONFIGS.SESSION_CREATE.maxRequests).toBeGreaterThan(0);
  });

  it('should have appropriate limits for different operations', () => {
    // Auth operations should be more restrictive
    expect(RATE_LIMIT_CONFIGS.AUTH_LOGIN.maxRequests).toBeLessThan(
      RATE_LIMIT_CONFIGS.API_GENERAL.maxRequests
    );
    
    // Sensitive operations should be more restrictive than general API
    expect(RATE_LIMIT_CONFIGS.API_SENSITIVE.maxRequests).toBeLessThan(
      RATE_LIMIT_CONFIGS.API_GENERAL.maxRequests
    );
    
    // Data export should be very restrictive
    expect(RATE_LIMIT_CONFIGS.DATA_EXPORT.maxRequests).toBeLessThan(
      RATE_LIMIT_CONFIGS.API_GENERAL.maxRequests
    );
  });
});

describe('Error Handling', () => {
  it('should handle invalid algorithm gracefully', () => {
    expect(() => {
      new RateLimiter({
        windowMs: 1000,
        maxRequests: 5,
        algorithm: 'INVALID' as RateLimitAlgorithm,
      });
    }).toThrow();
  });

  it('should handle cleanup errors gracefully', () => {
    const rateLimiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 5,
      algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    });
    
    // Should not throw when destroying
    expect(() => rateLimiter.destroy()).not.toThrow();
  });
});

describe('Performance', () => {
  it('should handle high request volume', async () => {
    const rateLimiter = new RateLimiter({
      windowMs: 1000,
      maxRequests: 100,
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET,
    });
    
    const startTime = Date.now();
    const promises = [];
    
    // Make 100 concurrent requests
    for (let i = 0; i < 100; i++) {
      promises.push(rateLimiter.check(`user${i}`));
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    // All should be allowed (different users)
    expect(results.every(r => r.allowed)).toBe(true);
    
    // Should complete quickly (less than 100ms)
    expect(endTime - startTime).toBeLessThan(100);
    
    rateLimiter.destroy();
  });
});
