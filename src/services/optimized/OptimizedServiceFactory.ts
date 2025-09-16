/**
 * Optimized Service Factory
 * Provides optimized services with query batching and intelligent caching
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { OptimizedSessionService } from './OptimizedSessionService';
import { OptimizedRosterService } from './OptimizedRosterService';
import { enhancedCacheService } from './EnhancedCacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';

export interface OptimizedServiceConfig {
  enableBatching: boolean;
  enableCaching: boolean;
  batchTimeout: number;
  cacheTTL: number;
  enablePreloading: boolean;
  enableMetrics: boolean;
}

/**
 * Optimized Service Factory
 */
export class OptimizedServiceFactory {
  private supabase: SupabaseClient<Database>;
  private config: OptimizedServiceConfig;
  private sessionService?: OptimizedSessionService;
  private rosterService?: OptimizedRosterService;
  private isInitialized = false;

  constructor(
    supabase: SupabaseClient<Database>,
    config: Partial<OptimizedServiceConfig> = {}
  ) {
    this.supabase = supabase;
    this.config = {
      enableBatching: true,
      enableCaching: true,
      batchTimeout: 100,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      enablePreloading: true,
      enableMetrics: true,
      ...config,
    };
  }

  /**
   * Initialize optimized services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const startTime = performance.now();

    try {
      // Initialize session service
      this.sessionService = new OptimizedSessionService(this.supabase, {
        enableBatching: this.config.enableBatching,
        enableCaching: this.config.enableCaching,
        batchTimeout: this.config.batchTimeout,
        cacheTTL: this.config.cacheTTL,
      });

      // Initialize roster service
      this.rosterService = new OptimizedRosterService(this.supabase, {
        enableBatching: this.config.enableBatching,
        enableCaching: this.config.enableCaching,
        batchTimeout: this.config.batchTimeout,
        cacheTTL: this.config.cacheTTL,
      });

      // Preload data if enabled
      if (this.config.enablePreloading) {
        await this.preloadData();
      }

      this.isInitialized = true;

      logger.info('Optimized services initialized', {
        duration: performance.now() - startTime,
        config: this.config,
      });
    } catch (error) {
      logger.error('Failed to initialize optimized services', { error });
      throw error;
    }
  }

  /**
   * Get optimized session service
   */
  getSessionService(): OptimizedSessionService {
    if (!this.sessionService) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this.sessionService;
  }

  /**
   * Get optimized roster service
   */
  getRosterService(): OptimizedRosterService {
    if (!this.rosterService) {
      throw new Error('Services not initialized. Call initialize() first.');
    }
    return this.rosterService;
  }

  /**
   * Get enhanced cache service
   */
  getCacheService() {
    return enhancedCacheService;
  }

  /**
   * Preload commonly used data
   */
  async preloadData(): Promise<void> {
    const startTime = performance.now();

    try {
      const preloadPromises = [];

      // Preload session data
      if (this.sessionService) {
        preloadPromises.push(this.sessionService.preloadSessionData());
      }

      // Preload roster data
      if (this.rosterService) {
        preloadPromises.push(this.rosterService.preloadRosterData());
      }

      await Promise.all(preloadPromises);

      logger.info('Data preloaded successfully', {
        duration: performance.now() - startTime,
      });
    } catch (error) {
      logger.error('Failed to preload data', { error });
      // Don't throw - preloading is optional
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): {
    sessionService?: unknown;
    rosterService?: unknown;
    cacheService: unknown;
  } {
    return {
      sessionService: this.sessionService?.getCacheStats(),
      rosterService: this.rosterService?.getCacheStats(),
      cacheService: this.getCacheService().getDetailedStats(),
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    if (this.sessionService) {
      this.sessionService.invalidateCache();
    }
    if (this.rosterService) {
      this.rosterService.invalidateTherapistCache();
    }
    this.getCacheService().clear();
    
    logger.info('All caches cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OptimizedServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize services with new config
    this.isInitialized = false;
    this.sessionService = undefined;
    this.rosterService = undefined;
    
    logger.info('Configuration updated', { newConfig });
  }

  /**
   * Get current configuration
   */
  getConfig(): OptimizedServiceConfig {
    return { ...this.config };
  }

  /**
   * Health check for optimized services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      sessionService: boolean;
      rosterService: boolean;
      cacheService: boolean;
    };
    metrics: unknown;
  }> {
    const services = {
      sessionService: !!this.sessionService,
      rosterService: !!this.rosterService,
      cacheService: true, // Cache service is always available
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyServices > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services,
      metrics: this.getMetrics(),
    };
  }
}

// Create singleton instance
let factoryInstance: OptimizedServiceFactory | null = null;

export function createOptimizedServiceFactory(
  supabase: SupabaseClient<Database>,
  config?: Partial<OptimizedServiceConfig>
): OptimizedServiceFactory {
  if (!factoryInstance) {
    factoryInstance = new OptimizedServiceFactory(supabase, config);
  }
  return factoryInstance;
}

export function getOptimizedServiceFactory(): OptimizedServiceFactory {
  if (!factoryInstance) {
    throw new Error('Optimized service factory not initialized. Call createOptimizedServiceFactory() first.');
  }
  return factoryInstance;
}
