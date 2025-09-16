/**
 * Service Factory
 * Centralized factory for creating and managing service instances
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { ApiClient } from '@/services/base/ApiClient';
import { BaseService } from '@/services/base/BaseService';
import { cacheService } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';

// Service registry type
type ServiceRegistry = Map<string, BaseService>;

// Service configuration
export interface ServiceConfig {
  enableCaching: boolean;
  enableRateLimiting: boolean;
  enableLogging: boolean;
  defaultTimeout: number;
  defaultRetries: number;
}

// Default service configuration
const DEFAULT_SERVICE_CONFIG: ServiceConfig = {
  enableCaching: true,
  enableRateLimiting: true,
  enableLogging: true,
  defaultTimeout: 10000,
  defaultRetries: 3,
};

/**
 * Service Factory Class
 */
export class ServiceFactory {
  private static instance: ServiceFactory | null = null;
  private supabase: SupabaseClient<Database>;
  private apiClient: ApiClient;
  private services: ServiceRegistry = new Map();
  private config: ServiceConfig;

  private constructor(supabase: SupabaseClient<Database>, config: Partial<ServiceConfig> = {}) {
    this.supabase = supabase;
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config };
    this.apiClient = new ApiClient(supabase);
    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  static getInstance(supabase?: SupabaseClient<Database>, config?: Partial<ServiceConfig>): ServiceFactory {
    if (!ServiceFactory.instance) {
      if (!supabase) {
        throw new Error('Supabase client is required for first initialization');
      }
      ServiceFactory.instance = new ServiceFactory(supabase, config);
    }
    return ServiceFactory.instance;
  }

  /**
   * Setup default interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor for logging
    if (this.config.enableLogging) {
      this.apiClient.addRequestInterceptor((config) => {
        logger.debug('API Request', {
          timeout: config.timeout,
          retries: config.retries,
          cacheKey: config.cache?.key,
        });
        return config;
      });
    }

    // Response interceptor for logging
    if (this.config.enableLogging) {
      this.apiClient.addResponseInterceptor((data, config) => {
        logger.debug('API Response', {
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 1,
          cacheKey: config.cache?.key,
        });
        return data;
      });
    }

    // Error interceptor for enhanced error handling
    this.apiClient.addErrorInterceptor((error, config) => {
      logger.error('API Error', {
        error: error.message,
        statusCode: error.statusCode,
        code: error.code,
        retryable: error.retryable,
        cacheKey: config.cache?.key,
      });
      return error;
    });
  }

  /**
   * Get or create a service instance
   */
  getService<T extends BaseService>(
    serviceClass: new (supabase: SupabaseClient<Database>, apiClient: ApiClient) => T,
    serviceName: string
  ): T {
    if (this.services.has(serviceName)) {
      return this.services.get(serviceName) as T;
    }

    const service = new serviceClass(this.supabase, this.apiClient);
    this.services.set(serviceName, service);
    
    logger.debug('Service created', { serviceName });
    return service;
  }

  /**
   * Get API client instance
   */
  getApiClient(): ApiClient {
    return this.apiClient;
  }

  /**
   * Get Supabase client instance
   */
  getSupabaseClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<ServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Service configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * Clear all services (useful for testing)
   */
  clearServices(): void {
    this.services.clear();
    logger.debug('All services cleared');
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalServices: number;
    serviceNames: string[];
    cacheStats: Record<string, unknown>;
  } {
    return {
      totalServices: this.services.size,
      serviceNames: Array.from(this.services.keys()),
      cacheStats: cacheService.getStats() as Record<string, unknown>,
    };
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    services: Record<string, boolean>;
    errors: Record<string, string>;
  }> {
    const results = {
      healthy: true,
      services: {} as Record<string, boolean>,
      errors: {} as Record<string, string>,
    };

    // Test Supabase connection
    try {
      const { error } = await this.supabase.from('therapists').select('id').limit(1);
      if (error) throw error;
      results.services.supabase = true;
    } catch (error) {
      results.healthy = false;
      results.services.supabase = false;
      results.errors.supabase = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test cache service
    try {
      cacheService.set('health-check', 'test', 1000);
      const cached = cacheService.get('health-check');
      if (cached !== 'test') throw new Error('Cache test failed');
      results.services.cache = true;
    } catch (error) {
      results.healthy = false;
      results.services.cache = false;
      results.errors.cache = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test API client
    try {
      // Simple test query
      await this.apiClient.get('therapists', { limit: 1 }, { skipLogging: true });
      results.services.apiClient = true;
    } catch (error) {
      results.healthy = false;
      results.services.apiClient = false;
      results.errors.apiClient = error instanceof Error ? error.message : 'Unknown error';
    }

    return results;
  }

  /**
   * Reset factory (useful for testing)
   */
  static reset(): void {
    ServiceFactory.instance = null;
  }
}

/**
 * Convenience function to get service factory instance
 */
export function getServiceFactory(supabase?: SupabaseClient<Database>, config?: Partial<ServiceConfig>): ServiceFactory {
  return ServiceFactory.getInstance(supabase, config);
}

/**
 * Convenience function to get a service instance
 */
export function getService<T extends BaseService>(
  serviceClass: new (supabase: SupabaseClient<Database>, apiClient: ApiClient) => T,
  serviceName: string
): T {
  return ServiceFactory.getInstance().getService(serviceClass, serviceName);
}

/**
 * Convenience function to get API client
 */
export function getApiClient(): ApiClient {
  return ServiceFactory.getInstance().getApiClient();
}
