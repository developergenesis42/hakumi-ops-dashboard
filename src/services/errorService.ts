/**
 * Centralized Error Handling Service
 * Provides consistent error handling, logging, and recovery mechanisms
 */

import { AppError, ErrorCode, ErrorSeverity, ErrorContext, ErrorHandlerOptions, RetryOptions, DEFAULT_RETRY_OPTIONS, isAppError, isRetryableError, getRetryDelay } from '@/types/errors';
import { logger } from '@/utils/logger';
import { errorTracking } from '@/config/monitoring';
import { debugLog } from '@/config/environment';

export interface ErrorServiceConfig {
  enableRetry: boolean;
  enableErrorTracking: boolean;
  enableUserNotifications: boolean;
  defaultRetryOptions: RetryOptions;
}

export class ErrorService {
  private static instance: ErrorService;
  private config: ErrorServiceConfig;

  private constructor(config: Partial<ErrorServiceConfig> = {}) {
    this.config = {
      enableRetry: true,
      enableErrorTracking: true,
      enableUserNotifications: true,
      defaultRetryOptions: DEFAULT_RETRY_OPTIONS,
      ...config
    };
  }

  static getInstance(config?: Partial<ErrorServiceConfig>): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService(config);
    }
    return ErrorService.instance;
  }

  /**
   * Handle an error with standardized processing
   */
  handleError(
    error: unknown,
    context: string,
    options: ErrorHandlerOptions = {}
  ): void {
    const appError = this.normalizeError(error, context, options.context);
    
    // Log the error
    if (options.logError !== false) {
      this.logError(appError, context);
    }

    // Track error for monitoring
    if (this.config.enableErrorTracking) {
      this.trackError(appError, context);
    }

    // Show user notification
    if (options.showToast !== false && this.config.enableUserNotifications) {
      this.showUserNotification(appError, options.fallbackMessage);
    }
  }

  /**
   * Handle async operations with automatic error handling
   */
  async handleAsync<T>(
    asyncFn: () => Promise<T>,
    context: string,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handleError(error, context, options);
      return null;
    }
  }

  /**
   * Execute async operation with retry logic
   */
  async executeWithRetry<T>(
    asyncFn: () => Promise<T>,
    context: string,
    retryOptions: RetryOptions = this.config.defaultRetryOptions,
    errorOptions: ErrorHandlerOptions = {}
  ): Promise<T | null> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry if error is not retryable
        if (!isRetryableError(error)) {
          debugLog(`[${context}] Non-retryable error on attempt ${attempt}:`, error);
          break;
        }

        // Don't retry on last attempt
        if (attempt === retryOptions.maxAttempts) {
          debugLog(`[${context}] Max retry attempts (${retryOptions.maxAttempts}) reached`);
          break;
        }

        // Calculate delay and wait
        const delay = getRetryDelay(attempt, retryOptions);
        debugLog(`[${context}] Retrying in ${delay}ms (attempt ${attempt + 1}/${retryOptions.maxAttempts})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Handle final error
    this.handleError(lastError, context, {
      ...errorOptions,
      fallbackMessage: `Operation failed after ${retryOptions.maxAttempts} attempts`
    });

    return null;
  }

  /**
   * Create a safe async wrapper that never throws
   */
  createSafeAsync<T>(
    asyncFn: () => Promise<T>,
    context: string,
    options: ErrorHandlerOptions = {}
  ): () => Promise<T | null> {
    return async () => {
      return await this.handleAsync(asyncFn, context, options);
    };
  }

  /**
   * Create a retry wrapper for async operations
   */
  createRetryWrapper<T>(
    asyncFn: () => Promise<T>,
    context: string,
    retryOptions: RetryOptions = this.config.defaultRetryOptions,
    errorOptions: ErrorHandlerOptions = {}
  ): () => Promise<T | null> {
    return async () => {
      return await this.executeWithRetry(asyncFn, context, retryOptions, errorOptions);
    };
  }

  /**
   * Normalize any error to AppError
   */
  private normalizeError(
    error: unknown,
    context: string,
    errorContext?: ErrorContext
  ): AppError {
    if (isAppError(error)) {
      return error;
    }

    if (error instanceof Error) {
      return AppError.fromError(error, undefined, {
        ...errorContext,
        component: context
      });
    }

    return new AppError(
      typeof error === 'string' ? error : 'Unknown error occurred',
      ErrorCode.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM,
      {
        ...errorContext,
        component: context
      }
    );
  }

  /**
   * Log error with appropriate level based on severity
   */
  private logError(error: AppError, context: string): void {
    const logData = {
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      retryable: error.retryable
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`[${context}] Critical error:`, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`[${context}] High severity error:`, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`[${context}] Medium severity error:`, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info(`[${context}] Low severity error:`, logData);
        break;
    }
  }

  /**
   * Track error for monitoring and analytics
   */
  private trackError(error: AppError, context: string): void {
    try {
      errorTracking.captureError(error, {
        component: context,
        errorCode: error.code,
        severity: error.severity,
        retryable: error.retryable,
        context: error.context
      });
    } catch (trackingError) {
      // Don't let tracking errors break the app
      debugLog('Failed to track error:', trackingError);
    }
  }

  /**
   * Show user-friendly error notification
   */
  private showUserNotification(error: AppError, fallbackMessage?: string): void {
    // This would integrate with your toast system
    // For now, we'll use console.warn as a placeholder
    const message = fallbackMessage || this.getUserFriendlyMessage(error);
    
    if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
      console.error(`[User Notification] ${message}`);
    } else {
      console.warn(`[User Notification] ${message}`);
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        return 'Network connection failed. Please check your internet connection and try again.';
      case ErrorCode.TIMEOUT_ERROR:
        return 'The request timed out. Please try again.';
      case ErrorCode.UNAUTHORIZED:
        return 'You are not authorized to perform this action.';
      case ErrorCode.SESSION_EXPIRED:
        return 'Your session has expired. Please log in again.';
      case ErrorCode.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorCode.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorCode.DATABASE_ERROR:
        return 'A database error occurred. Please try again later.';
      case ErrorCode.EXTERNAL_SERVICE_ERROR:
        return 'An external service is temporarily unavailable. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();
