/**
 * Rate Limiting Service for SPA Operations Dashboard
 * Implements multiple rate limiting algorithms to protect against abuse and DoS attacks
 */

import { logger } from '@/utils/logger';

// Rate limiting algorithms
export const RateLimitAlgorithm = {
  FIXED_WINDOW: 'fixed_window',
  SLIDING_WINDOW: 'sliding_window',
  TOKEN_BUCKET: 'token_bucket',
  LEAKY_BUCKET: 'leaky_bucket'
} as const;

export type RateLimitAlgorithm = typeof RateLimitAlgorithm[keyof typeof RateLimitAlgorithm];

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Maximum requests per window
  algorithm: RateLimitAlgorithm;
  keyGenerator?: (identifier: string) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (key: string, limit: number) => void;
}

// Rate limit result
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Rate limit entry
interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastRequest: number;
  requests: number[]; // For sliding window: timestamps of requests
}

// Token bucket entry
interface TokenBucketEntry {
  tokens: number;
  lastRefill: number;
  capacity: number;
}

// Rate limiter class
export class RateLimiter {
  private storage = new Map<string, RateLimitEntry | TokenBucketEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    // Validate algorithm
    if (!Object.values(RateLimitAlgorithm).includes(config.algorithm)) {
      throw new Error(`Invalid rate limit algorithm: ${config.algorithm}`);
    }
    
    this.config = config;
    
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);

    logger.info('Rate limiter initialized', { 
      algorithm: config.algorithm,
      windowMs: config.windowMs,
      maxRequests: config.maxRequests
    });
  }

  /**
   * Check if request is allowed
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = this.getKey(identifier);
    const now = Date.now();
    
    switch (this.config.algorithm) {
      case RateLimitAlgorithm.FIXED_WINDOW:
        return this.checkFixedWindow(key, now);
      case RateLimitAlgorithm.SLIDING_WINDOW:
        return this.checkSlidingWindow(key, now);
      case RateLimitAlgorithm.TOKEN_BUCKET:
        return this.checkTokenBucket(key, now);
      case RateLimitAlgorithm.LEAKY_BUCKET:
        return this.checkLeakyBucket(key, now);
      default:
        throw new Error(`Unsupported rate limit algorithm: ${this.config.algorithm}`);
    }
  }

  /**
   * Fixed window rate limiting
   */
  private checkFixedWindow(key: string, now: number): RateLimitResult {
    const entry = this.storage.get(key) as RateLimitEntry;
    const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
    
    if (!entry || entry.windowStart !== windowStart) {
      // New window or no entry
      const newEntry: RateLimitEntry = {
        count: 1,
        windowStart,
        lastRequest: now,
        requests: [now]
      };
      this.storage.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: windowStart + this.config.windowMs
      };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      this.config.onLimitReached?.(key, this.config.maxRequests);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + this.config.windowMs,
        retryAfter: Math.ceil((windowStart + this.config.windowMs - now) / 1000)
      };
    }

    // Increment count
    entry.count++;
    entry.lastRequest = now;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: windowStart + this.config.windowMs
    };
  }

  /**
   * Sliding window rate limiting
   */
  private checkSlidingWindow(key: string, now: number): RateLimitResult {
    const entry = this.storage.get(key) as RateLimitEntry;
    const windowStart = now - this.config.windowMs;
    
    if (!entry) {
      // First request
      const newEntry: RateLimitEntry = {
        count: 1,
        windowStart: now,
        lastRequest: now,
        requests: [now]
      };
      this.storage.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    // Remove expired requests from the sliding window
    entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    
    // Add current request
    entry.requests.push(now);
    entry.count = entry.requests.length;
    entry.lastRequest = now;

    if (entry.count > this.config.maxRequests) {
      // Rate limit exceeded
      this.config.onLimitReached?.(key, this.config.maxRequests);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.requests[entry.requests.length - this.config.maxRequests] + this.config.windowMs,
        retryAfter: Math.ceil((entry.requests[entry.requests.length - this.config.maxRequests] + this.config.windowMs - now) / 1000)
      };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.requests[0] + this.config.windowMs
    };
  }

  /**
   * Token bucket rate limiting
   */
  private checkTokenBucket(key: string, now: number): RateLimitResult {
    const entry = this.storage.get(key) as TokenBucketEntry;
    
    if (!entry) {
      // Initialize token bucket
      const newEntry: TokenBucketEntry = {
        tokens: this.config.maxRequests - 1,
        lastRefill: now,
        capacity: this.config.maxRequests
      };
      this.storage.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    // Refill tokens based on time elapsed
    const timePassed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.config.windowMs) * this.config.maxRequests);
    
    if (tokensToAdd > 0) {
      entry.tokens = Math.min(entry.capacity, entry.tokens + tokensToAdd);
      entry.lastRefill = now;
    }

    if (entry.tokens <= 0) {
      // No tokens available
      this.config.onLimitReached?.(key, this.config.maxRequests);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + this.config.windowMs,
        retryAfter: Math.ceil((this.config.windowMs - (now - entry.lastRefill)) / 1000)
      };
    }

    // Consume token
    entry.tokens--;
    
    return {
      allowed: true,
      remaining: entry.tokens,
      resetTime: now + this.config.windowMs
    };
  }

  /**
   * Leaky bucket rate limiting
   */
  private checkLeakyBucket(key: string, now: number): RateLimitResult {
    const entry = this.storage.get(key) as RateLimitEntry;
    
    if (!entry) {
      // Initialize leaky bucket
      const newEntry: RateLimitEntry = {
        count: 1,
        windowStart: now,
        lastRequest: now,
        requests: [now]
      };
      this.storage.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs
      };
    }

    // Leak requests based on time elapsed
    const timePassed = now - entry.lastRequest;
    const requestsToLeak = Math.floor((timePassed / this.config.windowMs) * this.config.maxRequests);
    
    if (requestsToLeak > 0) {
      entry.count = Math.max(0, entry.count - requestsToLeak);
      entry.lastRequest = now;
    }

    if (entry.count >= this.config.maxRequests) {
      // Bucket is full
      this.config.onLimitReached?.(key, this.config.maxRequests);
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: now + this.config.windowMs,
        retryAfter: Math.ceil((this.config.windowMs - timePassed) / 1000)
      };
    }

    // Add request to bucket
    entry.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: now + this.config.windowMs
    };
  }

  /**
   * Get rate limit key
   */
  private getKey(identifier: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(identifier);
    }
    return identifier;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.storage.entries()) {
      if ('windowStart' in entry) {
        // Fixed/Sliding window or Leaky bucket
        if (now - entry.lastRequest > this.config.windowMs * 2) {
          expiredKeys.push(key);
        }
      } else {
        // Token bucket
        if (now - entry.lastRefill > this.config.windowMs * 2) {
          expiredKeys.push(key);
        }
      }
    }

    expiredKeys.forEach(key => this.storage.delete(key));
    
    if (expiredKeys.length > 0) {
      logger.debug('Cleaned up expired rate limit entries', { count: expiredKeys.length });
    }
  }

  /**
   * Reset rate limit for specific key
   */
  reset(identifier: string): void {
    const key = this.getKey(identifier);
    this.storage.delete(key);
    logger.info('Rate limit reset', { key });
  }

  /**
   * Get current rate limit status
   */
  getStatus(identifier: string): RateLimitResult | null {
    const key = this.getKey(identifier);
    const entry = this.storage.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    if ('windowStart' in entry) {
      const windowStart = Math.floor(now / this.config.windowMs) * this.config.windowMs;
      
      if (entry.windowStart !== windowStart) {
        return {
          allowed: true,
          remaining: this.config.maxRequests,
          resetTime: windowStart + this.config.windowMs
        };
      }

      return {
        allowed: entry.count < this.config.maxRequests,
        remaining: Math.max(0, this.config.maxRequests - entry.count),
        resetTime: windowStart + this.config.windowMs
      };
    } else {
      // Token bucket
      const timePassed = now - entry.lastRefill;
      const tokensToAdd = Math.floor((timePassed / this.config.windowMs) * this.config.maxRequests);
      const currentTokens = Math.min(entry.capacity, entry.tokens + tokensToAdd);
      
      return {
        allowed: currentTokens > 0,
        remaining: currentTokens,
        resetTime: now + this.config.windowMs
      };
    }
  }

  /**
   * Destroy rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
    logger.info('Rate limiter destroyed');
  }
}

// Rate limiter manager for multiple limiters
export class RateLimiterManager {
  private limiters = new Map<string, RateLimiter>();

  /**
   * Add a rate limiter
   */
  addLimiter(name: string, config: RateLimitConfig): void {
    if (this.limiters.has(name)) {
      this.limiters.get(name)?.destroy();
    }
    
    this.limiters.set(name, new RateLimiter(config));
    logger.info('Rate limiter added', { name, config });
  }

  /**
   * Remove a rate limiter
   */
  removeLimiter(name: string): void {
    const limiter = this.limiters.get(name);
    if (limiter) {
      limiter.destroy();
      this.limiters.delete(name);
      logger.info('Rate limiter removed', { name });
    }
  }

  /**
   * Check rate limit for specific limiter
   */
  async check(name: string, identifier: string): Promise<RateLimitResult> {
    const limiter = this.limiters.get(name);
    if (!limiter) {
      throw new Error(`Rate limiter '${name}' not found`);
    }
    
    return limiter.check(identifier);
  }

  /**
   * Check multiple rate limiters
   */
  async checkAll(identifier: string): Promise<RateLimitResult[]> {
    const results: RateLimitResult[] = [];
    
    for (const [name, limiter] of this.limiters.entries()) {
      try {
        const result = await limiter.check(identifier);
        results.push(result);
        
        if (!result.allowed) {
          logger.warn('Rate limit exceeded', { 
            limiter: name, 
            identifier, 
            remaining: result.remaining,
            retryAfter: result.retryAfter
          });
          break; // Stop checking if any limiter blocks the request
        }
      } catch (error) {
        logger.error('Rate limiter check failed', { limiter: name, identifier, error });
      }
    }
    
    return results;
  }

  /**
   * Reset rate limit for specific identifier
   */
  reset(name: string, identifier: string): void {
    const limiter = this.limiters.get(name);
    if (limiter) {
      limiter.reset(identifier);
    }
  }

  /**
   * Get status for all limiters
   */
  getStatusAll(identifier: string): Record<string, RateLimitResult | null> {
    const status: Record<string, RateLimitResult | null> = {};
    
    for (const [name, limiter] of this.limiters.entries()) {
      status[name] = limiter.getStatus(identifier);
    }
    
    return status;
  }

  /**
   * Destroy all rate limiters
   */
  destroy(): void {
    for (const [, limiter] of this.limiters.entries()) {
      limiter.destroy();
    }
    this.limiters.clear();
    logger.info('All rate limiters destroyed');
  }
}

// Global rate limiter manager instance
export const rateLimiterManager = new RateLimiterManager();

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication rate limiting
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 login attempts per 15 minutes
    algorithm: RateLimitAlgorithm.FIXED_WINDOW,
    onLimitReached: (key: string) => {
      logger.warn('Login rate limit exceeded', { key });
    }
  },
  
  AUTH_REFRESH: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 refresh attempts per minute
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW
  },

  // API rate limiting
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    algorithm: RateLimitAlgorithm.TOKEN_BUCKET
  },

  API_SENSITIVE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 requests per minute for sensitive operations
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW
  },

  // Session operations
  SESSION_CREATE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 session creations per minute
    algorithm: RateLimitAlgorithm.TOKEN_BUCKET
  },

  // Data export
  DATA_EXPORT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 exports per hour
    algorithm: RateLimitAlgorithm.FIXED_WINDOW
  },

  // Real-time subscriptions
  REALTIME_SUBSCRIBE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50, // 50 subscription attempts per minute
    algorithm: RateLimitAlgorithm.SLIDING_WINDOW
  }
} as const;

// Initialize default rate limiters
export function initializeRateLimiters(): void {
  Object.entries(RATE_LIMIT_CONFIGS).forEach(([name, config]) => {
    rateLimiterManager.addLimiter(name, config);
  });
  
  logger.info('Rate limiters initialized', { 
    count: Object.keys(RATE_LIMIT_CONFIGS).length 
  });
}

// Rate limit decorator for functions
export function rateLimited(
  limiterName: string, 
  identifierExtractor?: (...args: unknown[]) => string
) {
  return function (_target: unknown, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const identifier = identifierExtractor ? identifierExtractor(...args) : 'default';
      
      try {
        const result = await rateLimiterManager.check(limiterName, identifier);
        
        if (!result.allowed) {
          const error = new Error(`Rate limit exceeded for ${limiterName}`);
          (error as Error & { statusCode?: number; retryAfter?: number }).statusCode = 429;
          (error as Error & { statusCode?: number; retryAfter?: number }).retryAfter = result.retryAfter;
          throw error;
        }
        
        return await method.apply(this, args);
      } catch (error) {
        logger.error('Rate limited function error', { 
          method: _propertyName, 
          limiter: limiterName, 
          identifier, 
          error 
        });
        throw error;
      }
    };

    return descriptor;
  };
}
