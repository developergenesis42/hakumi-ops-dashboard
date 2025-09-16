/**
 * Enhanced Cache Service
 * Implements intelligent cache invalidation and query optimization
 */

import { cacheService, CacheKeys, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';

export interface CacheInvalidationRule {
  pattern: string;
  dependencies: string[];
  invalidationStrategy: 'immediate' | 'lazy' | 'batch';
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  hitRate: number;
  averageResponseTime: number;
}

/**
 * Enhanced Cache Service with intelligent invalidation
 */
export class EnhancedCacheService {
  private invalidationRules: Map<string, CacheInvalidationRule> = new Map();
  private metrics: Map<string, CacheMetrics> = new Map();
  private pendingInvalidations: Set<string> = new Set();
  private invalidationQueue: Array<{ key: string; timestamp: number }> = [];

  constructor() {
    this.setupDefaultInvalidationRules();
    this.startInvalidationProcessor();
  }

  /**
   * Set data with intelligent cache key generation
   */
  set<T>(
    key: string,
    data: T,
    ttl?: number,
    options?: {
      dependencies?: string[];
      invalidationStrategy?: 'immediate' | 'lazy' | 'batch';
      tags?: string[];
    }
  ): void {
    const startTime = performance.now();

    try {
      // Set the data
      cacheService.set(key, data, ttl, options);

      // Track metrics
      this.updateMetrics(key, 'set', performance.now() - startTime);

      // Register dependencies for invalidation
      if (options?.dependencies) {
        this.registerDependencies(key, options.dependencies);
      }

      logger.debug('Cache set', { key, ttl, dependencies: options?.dependencies });
    } catch (error) {
      logger.error('Cache set error', { key, error });
    }
  }

  /**
   * Get data with metrics tracking
   */
  get<T>(key: string, options?: { memoryOnly?: boolean; localStorageOnly?: boolean }): T | null {
    const startTime = performance.now();

    try {
      const data = cacheService.get<T>(key, options);
      const responseTime = performance.now() - startTime;

      // Track metrics
      this.updateMetrics(key, data ? 'hit' : 'miss', responseTime);

      return data;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Invalidate cache with intelligent dependency resolution
   */
  invalidate(pattern: string, options?: { 
    strategy?: 'immediate' | 'lazy' | 'batch';
  }): void {
    const startTime = performance.now();

    try {
      const strategy = options?.strategy || this.getInvalidationStrategy(pattern);
      
      if (strategy === 'immediate') {
        this.executeImmediateInvalidation(pattern, true);
      } else if (strategy === 'lazy') {
        this.scheduleLazyInvalidation(pattern, true);
      } else if (strategy === 'batch') {
        this.queueBatchInvalidation(pattern, true);
      }

      // Track metrics
      this.updateMetrics(pattern, 'invalidation', performance.now() - startTime);

      logger.debug('Cache invalidation scheduled', { pattern, strategy });
    } catch (error) {
      logger.error('Cache invalidation error', { pattern, error });
    }
  }

  /**
   * Invalidate related cache entries based on data changes
   */
  invalidateRelated(entityType: string, entityId?: string, _changes?: string[]): void {
    const invalidationPatterns = this.getRelatedInvalidationPatterns(entityType, entityId, _changes);
    
    invalidationPatterns.forEach(pattern => {
      this.invalidate(pattern, { strategy: 'immediate' });
    });

    logger.debug('Related cache invalidated', { 
      entityType, 
      entityId, 
      patterns: invalidationPatterns 
    });
  }

  /**
   * Preload data for better performance
   */
  async preloadData(keys: string[], loader: (keys: string[]) => Promise<Map<string, unknown>>): Promise<void> {
    const startTime = performance.now();
    const missingKeys: string[] = [];

    try {
      // Check which keys are missing from cache
      keys.forEach(key => {
        if (!cacheService.has(key)) {
          missingKeys.push(key);
        }
      });

      if (missingKeys.length === 0) {
        logger.debug('All data already cached', { keys: keys.length });
        return;
      }

      // Load missing data
      const data = await loader(missingKeys);

      // Cache the loaded data
      data.forEach((value, key) => {
        this.set(key, value, CacheTTL.MEDIUM);
      });

      logger.debug('Data preloaded', { 
        totalKeys: keys.length,
        loadedKeys: missingKeys.length,
        duration: performance.now() - startTime 
      });
    } catch (error) {
      logger.error('Data preload failed', { keys, error });
    }
  }

  /**
   * Get cache statistics with detailed metrics
   */
  getDetailedStats(): {
    overall: CacheMetrics;
    byKey: Map<string, CacheMetrics>;
    invalidationQueue: number;
    pendingInvalidations: number;
  } {
    const overall: CacheMetrics = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      hitRate: 0,
      averageResponseTime: 0,
    };

    let totalResponseTime = 0;
    let totalOperations = 0;

    this.metrics.forEach(metrics => {
      overall.hits += metrics.hits;
      overall.misses += metrics.misses;
      overall.invalidations += metrics.invalidations;
      totalResponseTime += metrics.averageResponseTime * (metrics.hits + metrics.misses);
      totalOperations += metrics.hits + metrics.misses;
    });

    if (totalOperations > 0) {
      overall.hitRate = overall.hits / totalOperations;
      overall.averageResponseTime = totalResponseTime / totalOperations;
    }

    return {
      overall,
      byKey: new Map(this.metrics),
      invalidationQueue: this.invalidationQueue.length,
      pendingInvalidations: this.pendingInvalidations.size,
    };
  }

  /**
   * Clear all cache data
   */
  clear(): void {
    cacheService.clear();
    this.metrics.clear();
    this.pendingInvalidations.clear();
    this.invalidationQueue = [];
    logger.debug('All cache cleared');
  }

  /**
   * Setup default invalidation rules
   */
  private setupDefaultInvalidationRules(): void {
    // Session-related invalidation rules
    this.addInvalidationRule('session', {
      pattern: 'sessions|session-*',
      dependencies: ['today-sessions', 'daily-stats'],
      invalidationStrategy: 'immediate',
    });

    // Therapist-related invalidation rules
    this.addInvalidationRule('therapist', {
      pattern: 'therapists|therapist-*',
      dependencies: ['today-roster', 'therapist-status-*'],
      invalidationStrategy: 'immediate',
    });

    // Service-related invalidation rules
    this.addInvalidationRule('service', {
      pattern: 'services|service-*',
      dependencies: ['sessions|session-*'],
      invalidationStrategy: 'lazy',
    });

    // Room-related invalidation rules
    this.addInvalidationRule('room', {
      pattern: 'rooms|room-*',
      dependencies: ['sessions|session-*'],
      invalidationStrategy: 'lazy',
    });
  }

  /**
   * Add invalidation rule
   */
  private addInvalidationRule(name: string, rule: CacheInvalidationRule): void {
    this.invalidationRules.set(name, rule);
  }

  /**
   * Get invalidation strategy for pattern
   */
  private getInvalidationStrategy(pattern: string): 'immediate' | 'lazy' | 'batch' {
    for (const rule of this.invalidationRules.values()) {
      if (this.matchesPattern(pattern, rule.pattern)) {
        return rule.invalidationStrategy;
      }
    }
    return 'immediate';
  }

  /**
   * Check if pattern matches
   */
  private matchesPattern(key: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(key);
  }

  /**
   * Execute immediate invalidation
   */
  private executeImmediateInvalidation(pattern: string, _cascade?: boolean): void {
    const keys = this.getKeysMatchingPattern(pattern);
    
    keys.forEach(key => {
      cacheService.delete(key);
    });

    this.executeCascadeInvalidation(pattern);
  }

  /**
   * Schedule lazy invalidation
   */
  private scheduleLazyInvalidation(pattern: string, _cascade?: boolean): void {
    this.pendingInvalidations.add(pattern);
    
    // Execute after a short delay
    setTimeout(() => {
      this.executeImmediateInvalidation(pattern, true);
      this.pendingInvalidations.delete(pattern);
    }, 100);
  }

  /**
   * Queue batch invalidation
   */
  private queueBatchInvalidation(pattern: string, _cascade?: boolean): void {
    this.invalidationQueue.push({
      key: pattern,
      timestamp: Date.now(),
    });
  }

  /**
   * Start invalidation processor for batch operations
   */
  private startInvalidationProcessor(): void {
    setInterval(() => {
      this.processInvalidationQueue();
    }, 1000); // Process every second
  }

  /**
   * Process invalidation queue
   */
  private processInvalidationQueue(): void {
    if (this.invalidationQueue.length === 0) {
      return;
    }

    const now = Date.now();
    const toProcess = this.invalidationQueue.filter(
      item => now - item.timestamp > 1000 // Process after 1 second
    );

    toProcess.forEach(item => {
      this.executeImmediateInvalidation(item.key, true);
    });

    // Remove processed items
    this.invalidationQueue = this.invalidationQueue.filter(
      item => !toProcess.includes(item)
    );
  }

  /**
   * Execute cascade invalidation
   */
  private executeCascadeInvalidation(pattern: string): void {
    for (const rule of this.invalidationRules.values()) {
      if (this.matchesPattern(pattern, rule.pattern)) {
        rule.dependencies.forEach(depPattern => {
          this.executeImmediateInvalidation(depPattern, false);
        });
      }
    }
  }

  /**
   * Get keys matching pattern
   */
  private getKeysMatchingPattern(pattern: string): string[] {
    // This is a simplified implementation
    // In a real app, you'd want more sophisticated pattern matching
    const keys: string[] = [];
    
    // Check common cache keys
    Object.values(CacheKeys).forEach(key => {
      if (typeof key === 'string' && this.matchesPattern(key, pattern)) {
        keys.push(key);
      }
    });

    return keys;
  }

  /**
   * Get related invalidation patterns
   */
  private getRelatedInvalidationPatterns(
    entityType: string, 
    entityId?: string, 
    _changes?: string[]
  ): string[] {
    const patterns: string[] = [];

    switch (entityType) {
      case 'session':
        patterns.push('sessions|session-*', 'today-sessions', 'daily-stats');
        if (entityId) {
          patterns.push(`session-details-${entityId}`);
        }
        break;
      case 'therapist':
        patterns.push('therapists|therapist-*', 'today-roster');
        if (entityId) {
          patterns.push(`therapist-status-${entityId}`, `therapist-${entityId}`);
        }
        break;
      case 'service':
        patterns.push('services|service-*');
        if (entityId) {
          patterns.push(`service-details-${entityId}`);
        }
        break;
      case 'room':
        patterns.push('rooms|room-*');
        if (entityId) {
          patterns.push(`room-details-${entityId}`);
        }
        break;
    }

    return patterns;
  }

  /**
   * Register dependencies for a cache key
   */
  private registerDependencies(key: string, dependencies: string[]): void {
    // This would be implemented with a dependency graph
    // For now, we'll use a simple approach
    logger.debug('Dependencies registered', { key, dependencies });
  }

  /**
   * Update metrics for a cache key
   */
  private updateMetrics(key: string, operation: 'hit' | 'miss' | 'set' | 'invalidation', responseTime: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        hits: 0,
        misses: 0,
        invalidations: 0,
        hitRate: 0,
        averageResponseTime: 0,
      });
    }

    const metrics = this.metrics.get(key)!;
    
    if (operation === 'hit') {
      metrics.hits++;
    } else if (operation === 'miss') {
      metrics.misses++;
    } else if (operation === 'invalidation') {
      metrics.invalidations++;
    }

    // Update average response time
    const totalOperations = metrics.hits + metrics.misses;
    if (totalOperations > 0) {
      metrics.averageResponseTime = (metrics.averageResponseTime * (totalOperations - 1) + responseTime) / totalOperations;
    }

    // Update hit rate
    if (totalOperations > 0) {
      metrics.hitRate = metrics.hits / totalOperations;
    }
  }
}

// Create singleton instance
export const enhancedCacheService = new EnhancedCacheService();
