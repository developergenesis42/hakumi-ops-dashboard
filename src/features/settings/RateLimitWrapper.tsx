/**
 * Rate Limit Component Wrapper
 * React component wrapper for rate limiting protection
 */

import React from 'react';
import { rateLimiterManager } from '@/features/services/rateLimiterService';
import { isRateLimitingInitialized } from '@/features/utils/rateLimitIntegration';

interface RateLimitWrapperProps {
  limiterName: string;
  identifier?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component wrapper for rate limiting
 */
export function RateLimitWrapper({
  limiterName,
  identifier = 'component',
  children,
  fallback
}: RateLimitWrapperProps): React.ReactElement {
  const [isAllowed, setIsAllowed] = React.useState(true);
  const [remaining, setRemaining] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkRateLimit = async () => {
      try {
        if (isRateLimitingInitialized()) {
          const result = await rateLimiterManager.check(limiterName, identifier);
          setIsAllowed(result.allowed);
          setRemaining(result.remaining);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rate limit check failed');
      }
    };

    checkRateLimit();
  }, [limiterName, identifier]);

  if (!isAllowed) {
    if (fallback) {
      return fallback as React.ReactElement;
    }
    
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="flex">
          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Rate Limit Exceeded
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Please wait {remaining > 0 ? `${remaining} requests` : 'a moment'} before trying again.
            </p>
          </div>
        </div>
      </div>
    ) as React.ReactElement;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    ) as React.ReactElement;
  }

  return <>{children}</>;
}

// HOC moved to withRateLimit.tsx

