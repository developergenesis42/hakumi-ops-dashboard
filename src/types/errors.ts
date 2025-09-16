/**
 * Standardized Error Types and Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

export const ErrorCode = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  CONSTRAINT_ERROR: 'CONSTRAINT_ERROR',
  
  // Business logic errors
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_STATE: 'INVALID_STATE',
  
  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_ERROR: 'API_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const;

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity];

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  context?: ErrorContext;
  retryable?: boolean;
  retryAfter?: number; // milliseconds
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext,
    retryable: boolean = false,
    retryAfter?: number
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.timestamp = new Date();
  }

  static fromError(error: Error, code?: ErrorCode, context?: ErrorContext): AppError {
    return new AppError(
      error.message,
      code || ErrorCode.UNKNOWN_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      false
    );
  }

  static networkError(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      ErrorCode.NETWORK_ERROR,
      ErrorSeverity.HIGH,
      context,
      true,
      5000 // 5 seconds
    );
  }

  static validationError(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      ErrorCode.VALIDATION_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      false
    );
  }

  static notFoundError(resource: string, context?: ErrorContext): AppError {
    return new AppError(
      `${resource} not found`,
      ErrorCode.NOT_FOUND,
      ErrorSeverity.MEDIUM,
      context,
      false
    );
  }

  static unauthorizedError(message: string = 'Unauthorized access', context?: ErrorContext): AppError {
    return new AppError(
      message,
      ErrorCode.UNAUTHORIZED,
      ErrorSeverity.HIGH,
      context,
      false
    );
  }

  static businessError(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      ErrorCode.BUSINESS_ERROR,
      ErrorSeverity.MEDIUM,
      context,
      false
    );
  }

  static databaseError(message: string, context?: ErrorContext): AppError {
    return new AppError(
      message,
      ErrorCode.DATABASE_ERROR,
      ErrorSeverity.HIGH,
      context,
      true,
      3000 // 3 seconds
    );
  }

  static externalServiceError(service: string, message: string, context?: ErrorContext): AppError {
    return new AppError(
      `${service} error: ${message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorSeverity.HIGH,
      context,
      true,
      10000 // 10 seconds
    );
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      retryAfter: this.retryAfter
    };
  }
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  context?: ErrorContext;
  retryable?: boolean;
  onRetry?: () => Promise<void>;
}

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isRetryableError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.retryable;
  }
  
  // Check for common retryable error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('temporary') ||
      message.includes('unavailable')
    );
  }
  
  return false;
}

export function getRetryDelay(attempt: number, options: RetryOptions = DEFAULT_RETRY_OPTIONS): number {
  const delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1);
  return Math.min(delay, options.maxDelay);
}
