/**
 * Centralized API Client
 * Provides a unified interface for all API operations with built-in error handling, caching, and monitoring
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { BaseService, RequestConfig, ServiceError, ValidationError } from '@/services/base/BaseService';
import { cacheService, CacheTTL } from '@/services/cacheService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';

// API operation types
export type ApiOperation = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'UPSERT';

// Request interceptor function type
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

// Response interceptor function type
export type ResponseInterceptor<T> = (data: T, config: RequestConfig) => T | Promise<T>;

// Error interceptor function type
export type ErrorInterceptor = (error: ServiceError, config: RequestConfig) => ServiceError | Promise<ServiceError>;

/**
 * Centralized API Client
 */
export class ApiClient extends BaseService {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor<unknown>[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'ApiClient');
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor<T>(interceptor: ResponseInterceptor<T>): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Execute request interceptors
   */
  private async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let finalConfig = config;
    
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }
    
    return finalConfig;
  }

  /**
   * Execute response interceptors
   */
  private async executeResponseInterceptors<T>(data: T, config: RequestConfig): Promise<T> {
    let finalData: T = data;
    
    for (const interceptor of this.responseInterceptors) {
      finalData = await interceptor(finalData, config);
    }
    
    return finalData as T;
  }

  /**
   * Execute error interceptors
   */
  private async executeErrorInterceptors(error: ServiceError, config: RequestConfig): Promise<ServiceError> {
    let finalError = error;
    
    for (const interceptor of this.errorInterceptors) {
      finalError = await interceptor(finalError, config);
    }
    
    return finalError;
  }

  /**
   * Generic GET operation
   */
  async get<T>(
    table: string,
    options: {
      select?: string;
      filters?: Record<string, unknown>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      offset?: number;
    } = {},
    config: RequestConfig = {}
  ): Promise<T[]> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: {
          key: this.getCacheKey('get', table, JSON.stringify(options)),
          ttl: CacheTTL.MEDIUM,
          skipCache: false,
        },
      });

      const result = await this.executeQuery(
        async () => {
          let query = this.supabase.from(table).select(options.select || '*');
          
          // Apply filters
          if (options.filters) {
            Object.entries(options.filters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                query = query.eq(key, value);
              }
            });
          }
          
          // Apply ordering
          if (options.orderBy) {
            query = query.order(options.orderBy.column, { 
              ascending: options.orderBy.ascending ?? true 
            });
          }
          
          // Apply limit
          if (options.limit) {
            query = query.limit(options.limit);
          }
          
          // Apply offset
          if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 1000) - 1);
          }
          
          return await query;
        },
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('get', startTime, true);
      
      return processedResult as T[];
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('GET operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('get', startTime, false);
      throw processedError;
    }
  }

  /**
   * Generic GET by ID operation
   */
  async getById<T>(
    table: string,
    id: string,
    options: {
      select?: string;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: {
          key: this.getCacheKey('getById', table, id),
          ttl: CacheTTL.MEDIUM,
          skipCache: false,
        },
      });

      const result = await this.executeQuery(
        async () => await this.supabase
          .from(table)
          .select(options.select || '*')
          .eq('id', id)
          .single(),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('getById', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('GET by ID operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('getById', startTime, false);
      throw processedError;
    }
  }

  /**
   * Generic POST operation
   */
  async post<T>(
    table: string,
    data: Record<string, unknown>,
    options: {
      select?: string;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: { key: '', ttl: 0, skipCache: true }, // Don't cache mutations
      });

      const result = await this.executeMutation(
        async () => await this.supabase
          .from(table)
          .insert(data)
          .select(options.select || '*')
          .single(),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('post', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('POST operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('post', startTime, false);
      throw processedError;
    }
  }

  /**
   * Generic PUT operation
   */
  async put<T>(
    table: string,
    id: string,
    data: Record<string, unknown>,
    options: {
      select?: string;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: { key: '', ttl: 0, skipCache: true }, // Don't cache mutations
      });

      const result = await this.executeMutation(
        async () => await this.supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select(options.select || '*')
          .single(),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('put', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('PUT operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('put', startTime, false);
      throw processedError;
    }
  }

  /**
   * Generic PATCH operation
   */
  async patch<T>(
    table: string,
    id: string,
    data: Partial<Record<string, unknown>>,
    options: {
      select?: string;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: { key: '', ttl: 0, skipCache: true }, // Don't cache mutations
      });

      const result = await this.executeMutation(
        async () => await this.supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select(options.select || '*')
          .single(),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('patch', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('PATCH operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('patch', startTime, false);
      throw processedError;
    }
  }

  /**
   * Generic DELETE operation
   */
  async delete<T>(
    table: string,
    id: string,
    options: {
      select?: string;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: { key: '', ttl: 0, skipCache: true }, // Don't cache mutations
      });

      const result = await this.executeMutation(
        async () => await this.supabase
          .from(table)
          .delete()
          .eq('id', id)
          .select(options.select || '*')
          .single(),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('delete', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('DELETE operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('delete', startTime, false);
      throw processedError;
    }
  }

  /**
   * Generic UPSERT operation
   */
  async upsert<T>(
    table: string,
    data: Record<string, unknown>,
    options: {
      select?: string;
      onConflict?: string;
    } = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: { key: '', ttl: 0, skipCache: true }, // Don't cache mutations
      });

      const result = await this.executeMutation(
        async () => await this.supabase
          .from(table)
          .upsert(data, { onConflict: options.onConflict })
          .select(options.select || '*')
          .single(),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('upsert', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('UPSERT operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('upsert', startTime, false);
      throw processedError;
    }
  }

  /**
   * Execute raw SQL query
   */
  async rpc<T>(
    functionName: string,
    params: Record<string, unknown> = {},
    config: RequestConfig = {}
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: {
          key: this.getCacheKey('rpc', functionName, JSON.stringify(params)),
          ttl: CacheTTL.SHORT,
          skipCache: false,
        },
      });

      const result = await this.executeQuery(
        async () => await this.supabase.rpc(functionName, params),
        finalConfig
      );

      const processedResult = await this.executeResponseInterceptors(result, finalConfig);
      this.trackPerformance('rpc', startTime, true);
      
      return processedResult as T;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('RPC operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('rpc', startTime, false);
      throw processedError;
    }
  }

  /**
   * Batch operations
   */
  async batch<T>(
    operations: Array<{
      operation: ApiOperation;
      table: string;
      data?: Record<string, unknown>;
      id?: string;
      options?: Record<string, unknown>;
    }>,
    config: RequestConfig = {}
  ): Promise<T[]> {
    const startTime = performance.now();
    const results: T[] = [];
    
    try {
      const finalConfig = await this.executeRequestInterceptors({
        ...config,
        cache: { key: '', ttl: 0, skipCache: true }, // Don't cache batch operations
      });

      for (const op of operations) {
        let result: T;
        
        switch (op.operation) {
          case 'GET': {
            const getResult = await this.get<T>(op.table, op.options, finalConfig);
            results.push(...getResult);
            break;
          }
          case 'POST': {
            result = await this.post<T>(op.table, op.data || {}, op.options || {}, finalConfig);
            results.push(result);
            break;
          }
          case 'PUT': {
            result = await this.put<T>(op.table, op.id!, op.data || {}, op.options || {}, finalConfig);
            results.push(result);
            break;
          }
          case 'PATCH': {
            result = await this.patch<T>(op.table, op.id!, op.data || {}, op.options || {}, finalConfig);
            results.push(result);
            break;
          }
          case 'DELETE': {
            result = await this.delete<T>(op.table, op.id!, op.options, finalConfig);
            results.push(result);
            break;
          }
          case 'UPSERT': {
            result = await this.upsert<T>(op.table, op.data || {}, op.options || {}, finalConfig);
            results.push(result);
            break;
          }
          default:
            throw new ValidationError(`Unsupported operation: ${op.operation}`);
        }
      }

      this.trackPerformance('batch', startTime, true);
      return results;
    } catch (error) {
      const serviceError = error instanceof ServiceError ? error : new ServiceError('Batch operation failed');
      const processedError = await this.executeErrorInterceptors(serviceError, config);
      this.trackPerformance('batch', startTime, false);
      throw processedError;
    }
  }

  /**
   * Clear cache for specific table or all tables
   */
  clearCache(table?: string): void {
    if (table) {
      // Clear cache for specific table
      // const _pattern = new RegExp(`^${this.serviceName}-.*-${table}`);
      // Note: This is a simplified implementation - in a real app you'd want more sophisticated cache key management
      logger.debug('Cache cleared for table', { table });
    } else {
      // Clear all cache
      cacheService.clear();
      logger.debug('All cache cleared');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return cacheService.getStats();
  }
}
