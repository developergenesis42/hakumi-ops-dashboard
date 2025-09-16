/**
 * Service Wrapper Utilities
 * Provides consistent error handling patterns for service methods
 */

import { AppError, ErrorContext, RetryOptions, DEFAULT_RETRY_OPTIONS } from '@/types/errors';
import { errorService } from '@/services/errorService';
import { debugLog } from '@/config/environment';

export interface ServiceMethodOptions {
  context: string;
  retryable?: boolean;
  retryOptions?: RetryOptions;
  errorContext?: ErrorContext;
  fallbackValue?: unknown;
  methodName?: string;
}

/**
 * Wrap a service method with standardized error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  method: (...args: T) => Promise<R>,
  options: ServiceMethodOptions
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await method(...args);
    } catch (error) {
      errorService.handleError(error, options.context, {
        context: options.errorContext,
        fallbackMessage: `Failed to execute ${options.context}`
      });
      return (options.fallbackValue as R) || null;
    }
  };
}

/**
 * Wrap a service method with retry logic
 */
export function withRetry<T extends unknown[], R>(
  method: (...args: T) => Promise<R>,
  options: ServiceMethodOptions
) {
  return async (...args: T): Promise<R | null> => {
    const retryOptions = options.retryOptions || DEFAULT_RETRY_OPTIONS;
    
    return await errorService.executeWithRetry(
      () => method(...args),
      options.context,
      retryOptions,
      {
        context: options.errorContext,
        fallbackMessage: `Failed to execute ${options.context} after retries`
      }
    );
  };
}

/**
 * Wrap a service method with timeout
 */
export function withTimeout<T extends unknown[], R>(
  method: (...args: T) => Promise<R>,
  timeoutMs: number,
  options: ServiceMethodOptions
) {
  return async (...args: T): Promise<R | null> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(AppError.networkError(
          `Operation timed out after ${timeoutMs}ms`,
          options.errorContext
        ));
      }, timeoutMs);
    });

    try {
      return await Promise.race([
        method(...args),
        timeoutPromise
      ]);
    } catch (error) {
      errorService.handleError(error, options.context, {
        context: options.errorContext,
        fallbackMessage: `Operation timed out`
      });
      return (options.fallbackValue as R) || null;
    }
  };
}

/**
 * Wrap a service method with validation
 */
export function withValidation<T extends unknown[], R>(
  method: (...args: T) => Promise<R>,
  validator: (...args: T) => boolean | string,
  options: ServiceMethodOptions
) {
  return async (...args: T): Promise<R | null> => {
    try {
      const validationResult = validator(...args);
      
      if (validationResult !== true) {
        const errorMessage = typeof validationResult === 'string' 
          ? validationResult 
          : 'Validation failed';
        
        throw AppError.validationError(errorMessage, options.errorContext);
      }

      return await method(...args);
    } catch (error) {
      errorService.handleError(error, options.context, {
        context: options.errorContext,
        fallbackMessage: `Validation failed for ${options.context}`
      });
      return (options.fallbackValue as R) || null;
    }
  };
}

/**
 * Create a service method decorator with multiple features
 */
export function createServiceMethod<T extends unknown[], R>(
  method: (...args: T) => Promise<R>,
  options: ServiceMethodOptions & {
    timeout?: number;
    validator?: (...args: T) => boolean | string;
    enableRetry?: boolean;
  }
): (...args: T) => Promise<R | null> {
  let wrappedMethod: (...args: T) => Promise<R | null> = method as (...args: T) => Promise<R | null>;

  // Apply validation if provided
  if (options.validator) {
    wrappedMethod = withValidation(wrappedMethod, options.validator, options);
  }

  // Apply timeout if provided
  if (options.timeout) {
    wrappedMethod = withTimeout(wrappedMethod, options.timeout, options);
  }

  // Apply retry or basic error handling
  if (options.enableRetry && options.retryable !== false) {
    wrappedMethod = withRetry(wrappedMethod, options);
  } else {
    wrappedMethod = withErrorHandling(wrappedMethod, options);
  }

  return wrappedMethod;
}

/**
 * Create a batch operation wrapper
 */
export function createBatchOperation<T, R>(
  operation: (item: T) => Promise<R>,
  options: ServiceMethodOptions & {
    batchSize?: number;
    continueOnError?: boolean;
  }
) {
  return async (items: T[]): Promise<R[]> => {
    const results: R[] = [];
    const batchSize = options.batchSize || 10;
    const continueOnError = options.continueOnError !== false;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item, index) => {
        try {
          return await operation(item);
        } catch (error) {
          const itemContext = `${options.context}[${i + index}]`;
          errorService.handleError(error, itemContext, {
            context: options.errorContext,
            fallbackMessage: `Failed to process item ${i + index}`
          });
          
          if (!continueOnError) {
            throw error;
          }
          
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
    }

    return results;
  };
}

/**
 * Create a service class decorator
 */
export function ServiceClass(className: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function <T extends { new (...args: any[]): Record<string, unknown> }>(constructor: T) {
    return class extends constructor {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) {
        super(...args);
        debugLog(`Initialized service: ${className}`);
      }
    };
  };
}

/**
 * Create a method decorator for service methods
 */
export function ServiceMethod(options: Omit<ServiceMethodOptions, 'context'> & {
  methodName: string;
  enableRetry?: boolean;
  timeout?: number;
}) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const context = `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = createServiceMethod(originalMethod, {
      ...options,
      context
    });
    
    return descriptor;
  };
}
