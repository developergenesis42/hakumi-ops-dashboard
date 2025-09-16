/**
 * Rate Limiting Integration Utilities
 * Helper functions to integrate rate limiting throughout the application
 */

import React from 'react';
import { rateLimiterManager, initializeRateLimiters } from '@/services/rateLimiterService';
import { abuseProtection } from '@/services/abuseProtectionService';
import { getCurrentRateLimitConfig, isRateLimitingEnabled } from '@/config/rateLimiting';
import { logger } from '@/utils/logger';

// Integration status
interface RateLimitIntegrationStatus {
  initialized: boolean;
  rateLimitersActive: boolean;
  abuseProtectionActive: boolean;
  configLoaded: boolean;
  environment: string;
}

const integrationStatus = {
  initialized: false,
  rateLimitersActive: false,
  abuseProtectionActive: false,
  configLoaded: false,
  environment: import.meta.env.VITE_APP_ENV || 'development',
} as RateLimitIntegrationStatus;

/**
 * Initialize rate limiting system
 */
export function initializeRateLimitingSystem(): void {
  try {
    logger.info('Initializing rate limiting system...');

    // Check if rate limiting is enabled
    if (!isRateLimitingEnabled()) {
      logger.info('Rate limiting is disabled in configuration');
      return;
    }

    // Initialize rate limiters
    initializeRateLimiters();
    integrationStatus.rateLimitersActive = true;

    // Abuse protection is already initialized as a global instance
    integrationStatus.abuseProtectionActive = true;

    // Load configuration
    getCurrentRateLimitConfig();
    integrationStatus.configLoaded = true;

    integrationStatus.initialized = true;

    logger.info('Rate limiting system initialized successfully', {
      environment: integrationStatus.environment,
      configLoaded: integrationStatus.configLoaded,
      rateLimitersActive: integrationStatus.rateLimitersActive,
      abuseProtectionActive: integrationStatus.abuseProtectionActive,
    });
  } catch (error) {
    logger.error('Failed to initialize rate limiting system', { error });
    integrationStatus.initialized = false;
  }
}

/**
 * Get integration status
 */
export function getRateLimitIntegrationStatus(): RateLimitIntegrationStatus {
  return { ...integrationStatus };
}

/**
 * Check if rate limiting is properly initialized
 */
export function isRateLimitingInitialized(): boolean {
  return integrationStatus.initialized;
}

/**
 * Enhanced API call wrapper with rate limiting
 */
export async function rateLimitedApiCall<T>(
  operation: () => Promise<T>,
  limiterName: string = 'API_GENERAL',
  identifier?: string
): Promise<T> {
  if (!integrationStatus.initialized) {
    logger.warn('Rate limiting not initialized, proceeding without protection');
    return operation();
  }

  try {
    // Check abuse protection first
    if (abuseProtection.isBlocked(identifier)) {
      throw new Error('Access temporarily restricted due to suspicious activity');
    }

    if (abuseProtection.isBanned(identifier)) {
      throw new Error('Access permanently restricted due to severe abuse');
    }

    // Check rate limit
    const result = await rateLimiterManager.check(limiterName, identifier || 'default');
    
    if (!result.allowed) {
      logger.warn('Rate limit exceeded', {
        limiter: limiterName,
        identifier,
        remaining: result.remaining,
        retryAfter: result.retryAfter,
      });
      
      const error = new Error(`Rate limit exceeded for ${limiterName}`) as Error & {
        statusCode: number;
        retryAfter?: number;
      };
      error.statusCode = 429;
      error.retryAfter = result.retryAfter;
      throw error;
    }

    // Execute the operation
    const data = await operation();
    
    logger.debug('API call completed successfully', {
      limiter: limiterName,
      identifier,
      remaining: result.remaining,
    });
    
    return data;
  } catch (error) {
    logger.error('Rate limited API call failed', {
      limiter: limiterName,
      identifier,
      error,
    });
    throw error;
  }
}

/**
 * Enhanced authentication call wrapper
 */
export async function rateLimitedAuthCall<T>(
  operation: () => Promise<T>,
  email?: string
): Promise<T> {
  return rateLimitedApiCall(operation, 'AUTH_LOGIN', email);
}

/**
 * Enhanced session creation wrapper
 */
export async function rateLimitedSessionCall<T>(
  operation: () => Promise<T>,
  identifier?: string
): Promise<T> {
  return rateLimitedApiCall(operation, 'SESSION_CREATE', identifier);
}

/**
 * Enhanced data export wrapper
 */
export async function rateLimitedExportCall<T>(
  operation: () => Promise<T>,
  identifier?: string
): Promise<T> {
  return rateLimitedApiCall(operation, 'DATA_EXPORT', identifier);
}

/**
 * Component wrapper for rate limiting
 * Note: The actual implementation is in RateLimitWrapper.tsx
 */
export { withRateLimit } from '@/components/withRateLimit';

/**
 * Hook for rate limit status in components
 */
export function useRateLimitStatus(limiterName: string) {
  const [status, setStatus] = React.useState<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkStatus = React.useCallback(async () => {
    if (!integrationStatus.initialized) return;

    setLoading(true);
    setError(null);

    try {
      const result = await rateLimiterManager.check(limiterName, 'current-user');
      setStatus({
        allowed: result.allowed,
        remaining: result.remaining,
        resetTime: result.resetTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check rate limit');
    } finally {
      setLoading(false);
    }
  }, [limiterName]);

  React.useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    status,
    loading,
    error,
    checkStatus,
  };
}

/**
 * Utility to get rate limit headers for API responses
 */
export function getRateLimitHeaders(limiterName: string, identifier?: string) {
  if (!integrationStatus.initialized) return {};

  try {
    const status = rateLimiterManager.getStatusAll(identifier || 'current-user')[limiterName];
    
    if (!status) return {};

    return {
      'X-RateLimit-Limit': status.remaining + (status.allowed ? 0 : 1),
      'X-RateLimit-Remaining': status.remaining,
      'X-RateLimit-Reset': Math.ceil(status.resetTime / 1000),
      'X-RateLimit-Window': '60', // seconds
    };
  } catch (error) {
    logger.error('Failed to get rate limit headers', { limiterName, identifier, error });
    return {};
  }
}

/**
 * Utility to format rate limit error messages
 */
export function formatRateLimitError(error: Error & { statusCode?: number; retryAfter?: number }): string {
  if (error.statusCode === 429) {
    const retryAfter = error.retryAfter;
    if (retryAfter) {
      if (retryAfter < 60) {
        return `Rate limit exceeded. Please try again in ${retryAfter} seconds.`;
      } else {
        const minutes = Math.ceil(retryAfter / 60);
        return `Rate limit exceeded. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      }
    }
    return 'Rate limit exceeded. Please try again later.';
  }
  
  return error.message || 'An error occurred';
}

/**
 * Development helper to bypass rate limiting
 */
export function bypassRateLimitForDevelopment(): void {
  if (integrationStatus.environment === 'development') {
    logger.warn('Bypassing rate limiting for development');
    
    // Reset all rate limiters
    Object.keys(rateLimiterManager.getStatusAll('test')).forEach(name => {
      rateLimiterManager.reset(name, 'test');
    });
    
    // Reset abuse protection
    abuseProtection.resetProtection();
  }
}

/**
 * Production helper to get rate limit metrics
 */
export function getRateLimitMetrics() {
  if (integrationStatus.environment !== 'production') {
    logger.warn('Rate limit metrics only available in production');
    return null;
  }

  try {
    const rateLimitStatuses = rateLimiterManager.getStatusAll('metrics');
    const abuseStats = abuseProtection.getAbuseStats();

    return {
      timestamp: new Date().toISOString(),
      environment: integrationStatus.environment,
      rateLimiters: rateLimitStatuses,
      abuseProtection: abuseStats,
      integration: integrationStatus,
    };
  } catch (error) {
    logger.error('Failed to get rate limit metrics', { error });
    return null;
  }
}

// Auto-initialize rate limiting when this module is imported
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  initializeRateLimitingSystem();
}
