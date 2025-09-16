/**
 * Rate Limiting Hook for Client-Side Protection
 * Provides rate limiting functionality for React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { rateLimiterManager, RateLimitResult } from '@/services/rateLimiterService';
import { RateLimitError } from '@/services/rateLimitedSupabaseService';
import { logger } from '@/utils/logger';

// Rate limit hook options
interface UseRateLimitOptions {
  limiterName: string;
  identifier?: string;
  onLimitReached?: (result: RateLimitResult) => void;
  autoRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

// Rate limit hook return type
interface UseRateLimitReturn {
  isAllowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  isLoading: boolean;
  error: string | null;
  execute: <T>(operation: () => Promise<T>) => Promise<T>;
  check: () => Promise<RateLimitResult>;
  reset: () => void;
  status: RateLimitResult | null;
}

/**
 * Hook for rate limiting operations
 */
export function useRateLimit(options: UseRateLimitOptions): UseRateLimitReturn {
  const {
    limiterName,
    identifier = 'default',
    onLimitReached,
    autoRetry = false,
    retryDelay = 1000,
    maxRetries = 3
  } = options;

  const [status, setStatus] = useState<RateLimitResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check rate limit status
  const check = useCallback(async (): Promise<RateLimitResult> => {
    try {
      const result = await rateLimiterManager.check(limiterName, identifier);
      setStatus(result);
      setError(null);
      
      if (!result.allowed && onLimitReached) {
        onLimitReached(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Rate limit check failed';
      setError(errorMessage);
      logger.error('Rate limit check failed', { limiterName, identifier, error: err });
      
      // Return a default result on error
      return {
        allowed: true,
        remaining: 0,
        resetTime: Date.now() + 60000
      };
    }
  }, [limiterName, identifier, onLimitReached]);

  // Execute operation with rate limiting
  const execute = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await check();
      
      if (!result.allowed) {
        if (autoRetry && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          
          logger.info('Rate limit exceeded, retrying', {
            limiterName,
            identifier,
            retryCount: retryCountRef.current,
            retryAfter: result.retryAfter
          });
          
          // Wait before retry
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, retryDelay * retryCountRef.current);
          });
          
          return execute(operation);
        } else {
          const error = new RateLimitError(
            `Rate limit exceeded for ${limiterName}`,
            limiterName,
            result.retryAfter
          );
          setError(error.message);
          throw error;
        }
      }
      
      // Reset retry count on success
      retryCountRef.current = 0;
      
      // Execute the operation
      const result_data = await operation();
      
      // Re-check rate limit after operation
      await check();
      
      return result_data;
    } catch (err) {
      if (err instanceof RateLimitError) {
        throw err;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      logger.error('Operation failed in rate limited hook', { limiterName, identifier, error: err });
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [check, autoRetry, retryDelay, maxRetries, identifier, limiterName]);

  // Reset rate limit
  const reset = useCallback(() => {
    rateLimiterManager.reset(limiterName, identifier);
    setStatus(null);
    setError(null);
    retryCountRef.current = 0;
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    logger.info('Rate limit reset', { limiterName, identifier });
  }, [limiterName, identifier]);

  // Initial status check
  useEffect(() => {
    check();
  }, [check]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAllowed: status?.allowed ?? true,
    remaining: status?.remaining ?? 0,
    resetTime: status?.resetTime ?? 0,
    retryAfter: status?.retryAfter,
    isLoading,
    error,
    execute,
    check,
    reset,
    status
  };
}


// Hook for API rate limiting
export function useApiRateLimit(operation: string = 'API_GENERAL') {
  return useRateLimit({
    limiterName: operation,
    onLimitReached: (result) => {
      logger.warn('API rate limit exceeded', { 
        operation, 
        remaining: result.remaining,
        retryAfter: result.retryAfter 
      });
    }
  });
}

// Hook for session creation rate limiting
export function useSessionRateLimit() {
  return useRateLimit({
    limiterName: 'SESSION_CREATE',
    onLimitReached: (result) => {
      logger.warn('Session creation rate limit exceeded', { 
        remaining: result.remaining,
        retryAfter: result.retryAfter 
      });
    }
  });
}

// Hook for data export rate limiting
export function useDataExportRateLimit() {
  return useRateLimit({
    limiterName: 'DATA_EXPORT',
    onLimitReached: (result) => {
      logger.warn('Data export rate limit exceeded', { 
        remaining: result.remaining,
        retryAfter: result.retryAfter 
      });
    }
  });
}

// Hook for real-time subscription rate limiting
export function useRealtimeRateLimit() {
  return useRateLimit({
    limiterName: 'REALTIME_SUBSCRIBE',
    onLimitReached: (result) => {
      logger.warn('Real-time subscription rate limit exceeded', { 
        remaining: result.remaining,
        retryAfter: result.retryAfter 
      });
    }
  });
}

// Hook for monitoring rate limit status
export function useRateLimitMonitor() {
  const [statuses, setStatuses] = useState<Record<string, RateLimitResult | null>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refreshStatuses = useCallback(async () => {
    setIsLoading(true);
    try {
      const allStatuses = rateLimiterManager.getStatusAll('current-user');
      setStatuses(allStatuses);
    } catch (error) {
      logger.error('Failed to get rate limit statuses', { error });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetAllLimits = useCallback(() => {
    Object.keys(statuses).forEach(limiterName => {
      rateLimiterManager.reset(limiterName, 'current-user');
    });
    refreshStatuses();
    logger.info('All rate limits reset');
  }, [statuses, refreshStatuses]);

  useEffect(() => {
    refreshStatuses();
    
    // Refresh status every 30 seconds
    const interval = setInterval(refreshStatuses, 30000);
    
    return () => clearInterval(interval);
  }, [refreshStatuses]);

  return {
    statuses,
    isLoading,
    refreshStatuses,
    resetAllLimits
  };
}
