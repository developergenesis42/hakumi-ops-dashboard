/**
 * Cache Service
 * Centralized caching system for frequently accessed data
 */

import { performanceMonitoring } from '@/config/monitoring';

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  enableMemoryCache: boolean;
  enableLocalStorage: boolean;
  enableSessionStorage: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * Default cache configuration
 */
const defaultCacheConfig: CacheConfig = {
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 minutes
  enableMemoryCache: true,
  enableLocalStorage: true,
  enableSessionStorage: false,
};

/**
 * Memory-based cache implementation
 */
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = { hits: 0, misses: 0 };
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      memoryUsage: this.cache.size * 100, // Rough estimate
    };
  }
}

/**
 * LocalStorage-based cache implementation
 */
class LocalStorageCache<T> {
  private prefix: string;
  private config: CacheConfig;

  constructor(config: CacheConfig, prefix: string = 'spa-cache-') {
    this.config = config;
    this.prefix = prefix;
  }

  set(key: string, data: T, ttl?: number): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.config.ttl,
        accessCount: 0,
        lastAccessed: Date.now(),
      };

      localStorage.setItem(
        `${this.prefix}${key}`,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to set localStorage cache:', error);
    }
  }

  get(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.prefix}${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        localStorage.removeItem(`${this.prefix}${key}`);
        return null;
      }

      // Update access statistics
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(entry));

      return entry.data;
    } catch (error) {
      console.warn('Failed to get localStorage cache:', error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    try {
      localStorage.removeItem(`${this.prefix}${key}`);
      return true;
    } catch (error) {
      console.warn('Failed to delete localStorage cache:', error);
      return false;
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

/**
 * Main cache service
 */
class CacheService {
  private memoryCache: MemoryCache<unknown>;
  private localStorageCache: LocalStorageCache<unknown>;
  private config: CacheConfig;

  constructor(config: CacheConfig = defaultCacheConfig) {
    this.config = config;
    this.memoryCache = new MemoryCache(config);
    this.localStorageCache = new LocalStorageCache(config);
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number, options?: { 
    memoryOnly?: boolean; 
    localStorageOnly?: boolean;
  }): void {
    const startTime = performance.now();

    try {
      if (this.config.enableMemoryCache && !options?.localStorageOnly) {
        this.memoryCache.set(key, data, ttl);
      }

      if (this.config.enableLocalStorage && !options?.memoryOnly) {
        this.localStorageCache.set(key, data, ttl);
      }

      performanceMonitoring.trackUserAction('cache-set', 'CacheService', {
        key,
        ttl: ttl || this.config.ttl,
        options,
      });
    } catch (error) {
      console.error('Cache set error:', error);
    } finally {
      performanceMonitoring.trackTiming('cache-set', startTime);
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string, options?: { 
    memoryOnly?: boolean; 
    localStorageOnly?: boolean;
  }): T | null {
    const startTime = performance.now();

    try {
      // Try memory cache first (faster)
      if (this.config.enableMemoryCache && !options?.localStorageOnly) {
        const memoryData = this.memoryCache.get(key) as T | null;
        if (memoryData !== null) {
          performanceMonitoring.trackUserAction('cache-hit', 'CacheService', {
            key,
            source: 'memory',
          });
          performanceMonitoring.trackTiming('cache-get', startTime);
          return memoryData;
        }
      }

      // Try localStorage cache
      if (this.config.enableLocalStorage && !options?.memoryOnly) {
        const localStorageData = this.localStorageCache.get(key) as T | null;
        if (localStorageData !== null) {
          // Update memory cache with localStorage data
          if (this.config.enableMemoryCache) {
            this.memoryCache.set(key, localStorageData);
          }
          
          performanceMonitoring.trackUserAction('cache-hit', 'CacheService', {
            key,
            source: 'localStorage',
          });
          performanceMonitoring.trackTiming('cache-get', startTime);
          return localStorageData;
        }
      }

      performanceMonitoring.trackUserAction('cache-miss', 'CacheService', {
        key,
      });
      performanceMonitoring.trackTiming('cache-get', startTime);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      performanceMonitoring.trackTiming('cache-get', startTime);
      return null;
    }
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    if (this.config.enableMemoryCache && this.memoryCache.has(key)) {
      return true;
    }
    
    if (this.config.enableLocalStorage && this.localStorageCache.has(key)) {
      return true;
    }
    
    return false;
  }

  /**
   * Delete data from cache
   */
  delete(key: string): boolean {
    let deleted = false;
    
    if (this.config.enableMemoryCache) {
      deleted = this.memoryCache.delete(key) || deleted;
    }
    
    if (this.config.enableLocalStorage) {
      deleted = this.localStorageCache.delete(key) || deleted;
    }
    
    return deleted;
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    if (this.config.enableMemoryCache) {
      this.memoryCache.clear();
    }
    
    if (this.config.enableLocalStorage) {
      this.localStorageCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.memoryCache.getStats();
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const cacheService = new CacheService();

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : `fn-${fn.name}-${JSON.stringify(args)}`;
    
    // Try to get from cache first
    const cached = cacheService.get<ReturnType<T>>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = fn(...args);
    
    // Handle promises
    if (result instanceof Promise) {
      return result.then((resolvedResult) => {
        cacheService.set(key, resolvedResult, ttl);
        return resolvedResult;
      });
    } else {
      cacheService.set(key, result, ttl);
      return result;
    }
  }) as T;
}

/**
 * Cache keys for different data types
 */
export const CacheKeys = {
  // Roster data
  TODAY_ROSTER: 'today-roster',
  THERAPIST_STATUS: (id: string) => `therapist-status-${id}`,
  
  // Session data
  TODAY_SESSIONS: 'today-sessions',
  SESSION_DETAILS: (id: string) => `session-details-${id}`,
  
  // Service data
  SERVICES: 'services',
  SERVICE_DETAILS: (id: string) => `service-details-${id}`,
  
  // Room data
  ROOMS: 'rooms',
  ROOM_DETAILS: (id: string) => `room-details-${id}`,
  
  // Statistics
  DAILY_STATS: 'daily-stats',
  WEEKLY_STATS: 'weekly-stats',
  
  // User data
  USER_PROFILE: (id: string) => `user-profile-${id}`,
  USER_PREFERENCES: (id: string) => `user-preferences-${id}`,
} as const;

/**
 * Cache TTL constants (in milliseconds)
 */
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  PERSISTENT: 24 * 60 * 60 * 1000, // 24 hours
} as const;
