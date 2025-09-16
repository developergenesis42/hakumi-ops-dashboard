/**
 * Base Service Class
 * Provides centralized error handling, caching, retry logic, and consistent API patterns
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { cacheService, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import { performanceMonitoring } from '@/config/monitoring';

// Custom error types for better error handling
export class ServiceError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly retryable: boolean;
  public readonly originalError?: Error;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.code = code;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

export class NetworkError extends ServiceError {
  constructor(message: string, originalError?: Error) {
    super(message, 0, 'NETWORK_ERROR', true, originalError);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ServiceError {
  constructor(message: string, timeoutMs: number) {
    super(message, 408, 'TIMEOUT_ERROR', true);
    this.name = 'TimeoutError';
    // Store timeout value for potential debugging
    (this as ServiceError & { timeoutMs?: number }).timeoutMs = timeoutMs;
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR', false);
    this.name = 'ValidationError';
    // Store field name for potential debugging
    if (field) {
      (this as ValidationError & { field?: string }).field = field;
    }
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND',
      false
    );
    this.name = 'NotFoundError';
  }
}

// Request configuration interface
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: {
    key: string;
    ttl?: number;
    skipCache?: boolean;
  };
  skipRateLimit?: boolean;
  skipLogging?: boolean;
}

// Default request configuration
const DEFAULT_CONFIG: Required<RequestConfig> = {
  timeout: 10000, // 10 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  cache: {
    key: '',
    ttl: CacheTTL.MEDIUM,
    skipCache: false,
  },
  skipRateLimit: false,
  skipLogging: false,
};

// Retry configuration for different error types
const RETRY_CONFIG = {
  NETWORK_ERROR: { retries: 3, delay: 1000 },
  TIMEOUT_ERROR: { retries: 2, delay: 2000 },
  RATE_LIMIT_ERROR: { retries: 1, delay: 5000 },
  SERVER_ERROR: { retries: 2, delay: 1500 },
  DEFAULT: { retries: 1, delay: 1000 },
};

/**
 * Base Service Class
 */
export abstract class BaseService {
  protected supabase: SupabaseClient;
  protected serviceName: string;

  constructor(supabase: SupabaseClient, serviceName: string) {
    this.supabase = supabase;
    this.serviceName = serviceName;
  }

  /**
   * Execute a Supabase query with error handling, retry logic, and caching
   */
  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    config: RequestConfig = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const { cache, timeout, retries, retryDelay, skipLogging } = finalConfig;

    // Check cache first if caching is enabled
    if (cache.key && !cache.skipCache) {
      const cachedData = cacheService.get<T>(cache.key);
      if (cachedData !== null) {
        if (!skipLogging) {
          logger.debug('Cache hit', { service: this.serviceName, key: cache.key });
        }
        return cachedData;
      }
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        if (!skipLogging) {
          logger.debug('Executing query', {
            service: this.serviceName,
            attempt: attempt + 1,
            maxRetries: retries + 1,
          });
        }

        const result = await this.withTimeout(queryFn(), timeout);
        
        if (result.error) {
          throw this.createServiceError(result.error);
        }

        if (result.data === null) {
          throw new NotFoundError('Resource');
        }

        // Cache successful result
        if (cache.key && !cache.skipCache) {
          cacheService.set(cache.key, result.data, cache.ttl);
          if (!skipLogging) {
            logger.debug('Data cached', { service: this.serviceName, key: cache.key });
          }
        }

        return result.data;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (!this.shouldRetry(error as Error, attempt, retries)) {
          break;
        }

        const delay = this.calculateRetryDelay(error as Error, attempt, retryDelay);
        if (!skipLogging) {
          logger.warn('Query failed, retrying', {
            service: this.serviceName,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
            delayMs: delay,
          });
        }

        await this.sleep(delay);
      }
    }

    // All retries failed
    if (!skipLogging) {
      logger.error('Query failed after all retries', {
        service: this.serviceName,
        attempts: attempt,
        error: lastError?.message,
      });
    }

    throw lastError || new ServiceError('Query failed after all retries');
  }

  /**
   * Execute a Supabase mutation with error handling and retry logic
   */
  protected async executeMutation<T>(
    mutationFn: () => Promise<{ data: T | null; error: unknown }>,
    config: RequestConfig = {}
  ): Promise<T> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const { timeout, retries, retryDelay, skipLogging } = finalConfig;

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= retries) {
      try {
        if (!skipLogging) {
          logger.debug('Executing mutation', {
            service: this.serviceName,
            attempt: attempt + 1,
            maxRetries: retries + 1,
          });
        }

        const result = await this.withTimeout(mutationFn(), timeout);
        
        if (result.error) {
          throw this.createServiceError(result.error);
        }

        if (result.data === null) {
          throw new NotFoundError('Resource');
        }

        // Invalidate related cache entries
        this.invalidateRelatedCache();

        return result.data;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (!this.shouldRetry(error as Error, attempt, retries)) {
          break;
        }

        const delay = this.calculateRetryDelay(error as Error, attempt, retryDelay);
        if (!skipLogging) {
          logger.warn('Mutation failed, retrying', {
            service: this.serviceName,
            attempt,
            error: error instanceof Error ? error.message : 'Unknown error',
            delayMs: delay,
          });
        }

        await this.sleep(delay);
      }
    }

    // All retries failed
    if (!skipLogging) {
      logger.error('Mutation failed after all retries', {
        service: this.serviceName,
        attempts: attempt,
        error: lastError?.message,
      });
    }

    throw lastError || new ServiceError('Mutation failed after all retries');
  }

  /**
   * Add timeout to a promise
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`, timeoutMs));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Create appropriate service error from Supabase error
   */
  private createServiceError(error: unknown): ServiceError {
    const errorObj = error as Record<string, unknown>;
    
    if (errorObj.code === 'PGRST116') {
      return new NotFoundError('Resource');
    }

    if (errorObj.code === '23505') {
      return new ValidationError('Resource already exists');
    }

    if (errorObj.code === '23503') {
      return new ValidationError('Referenced resource does not exist');
    }

    if (typeof errorObj.message === 'string' && errorObj.message.includes('timeout')) {
      return new TimeoutError(errorObj.message, 0);
    }

    if (typeof errorObj.message === 'string' && (errorObj.message.includes('network') || errorObj.message.includes('fetch'))) {
      return new NetworkError(errorObj.message, error as Error);
    }

    if (errorObj.status === 429) {
      return new ServiceError('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR', true, error as Error);
    }

    if (typeof errorObj.status === 'number' && errorObj.status >= 400 && errorObj.status < 500) {
      return new ServiceError(
        (errorObj.message as string) || 'Client error', 
        errorObj.status, 
        errorObj.code as string, 
        false, 
        error as Error
      );
    }

    if (typeof errorObj.status === 'number' && errorObj.status >= 500) {
      return new ServiceError(
        (errorObj.message as string) || 'Server error', 
        errorObj.status, 
        errorObj.code as string, 
        true, 
        error as Error
      );
    }

    return new ServiceError(
      (errorObj.message as string) || 'Unknown error', 
      500, 
      'UNKNOWN_ERROR', 
      false, 
      error as Error
    );
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    if (attempt > maxRetries) {
      return false;
    }

    if (error instanceof ServiceError) {
      return error.retryable;
    }

    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return true;
    }

    return false;
  }

  /**
   * Calculate retry delay based on error type and attempt number
   */
  private calculateRetryDelay(error: Error, attempt: number, baseDelay: number): number {
    if (error instanceof ServiceError) {
      const config = RETRY_CONFIG[error.code as keyof typeof RETRY_CONFIG] || RETRY_CONFIG.DEFAULT;
      return config.delay * Math.pow(2, attempt - 1); // Exponential backoff
    }

    return baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Invalidate related cache entries
   * Override in subclasses to provide specific cache invalidation logic
   */
  protected invalidateRelatedCache(): void {
    // Default implementation - can be overridden by subclasses
    logger.debug('Cache invalidation not implemented', { service: this.serviceName });
  }

  /**
   * Get cache key for a specific operation
   */
  protected getCacheKey(operation: string, ...params: unknown[]): string {
    const paramString = params.length > 0 ? `-${params.join('-')}` : '';
    return `${this.serviceName}-${operation}${paramString}`;
  }

  /**
   * Track performance metrics
   */
  protected trackPerformance(operation: string, startTime: number, success: boolean): void {
    const duration = performance.now() - startTime;
    
    performanceMonitoring.trackTiming(`${this.serviceName}-${operation}`, startTime);
    performanceMonitoring.trackUserAction(
      success ? 'service-operation-success' : 'service-operation-failure',
      this.serviceName,
      { operation, duration }
    );
  }
}
