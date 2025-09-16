import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { errorService } from '@/services/errorService';
import { AppError, ErrorContext, ErrorHandlerOptions, RetryOptions, DEFAULT_RETRY_OPTIONS } from '@/types/errors';

export interface EnhancedErrorHandlerOptions extends ErrorHandlerOptions {
  context?: ErrorContext;
  retryable?: boolean;
  onRetry?: () => Promise<void>;
}

export function useErrorHandler() {
  const { showToast } = useToast();

  const handleError = useCallback((
    error: unknown,
    context: string,
    options: EnhancedErrorHandlerOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      context: errorContext
    } = options;

    // Use the centralized error service
    errorService.handleError(error, context, {
      showToast: shouldShowToast,
      logError,
      fallbackMessage,
      context: errorContext
    });

    // Also show toast for user feedback (if enabled)
    if (shouldShowToast) {
      let message = fallbackMessage;
      
      if (error instanceof AppError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }

      showToast(message, 'error');
    }
  }, [showToast]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context: string,
    options: EnhancedErrorHandlerOptions = {}
  ): Promise<T | null> => {
    return await errorService.handleAsync(asyncFn, context, options);
  }, []);

  const handleWithRetry = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context: string,
    retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS,
    errorOptions: EnhancedErrorHandlerOptions = {}
  ): Promise<T | null> => {
    return await errorService.executeWithRetry(asyncFn, context, retryOptions, errorOptions);
  }, []);

  const createSafeAsync = useCallback(<T>(
    asyncFn: () => Promise<T>,
    context: string,
    options: EnhancedErrorHandlerOptions = {}
  ) => {
    return errorService.createSafeAsync(asyncFn, context, options);
  }, []);

  const createRetryWrapper = useCallback(<T>(
    asyncFn: () => Promise<T>,
    context: string,
    retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS,
    errorOptions: EnhancedErrorHandlerOptions = {}
  ) => {
    return errorService.createRetryWrapper(asyncFn, context, retryOptions, errorOptions);
  }, []);

  return {
    handleError,
    handleAsyncError,
    handleWithRetry,
    createSafeAsync,
    createRetryWrapper
  };
}
