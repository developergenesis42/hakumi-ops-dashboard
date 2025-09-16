import React from 'react';
import { useRateLimit } from '@/shared/hooks/useRateLimit';

/**
 * Higher-order component for rate limiting
 */
export function withRateLimit<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { limiterName: string; identifier?: string }
) {
  return function RateLimitedComponent(props: P) {
    const { isAllowed, retryAfter, check } = useRateLimit(options);
    
    if (!isAllowed) {
      return (
        <div className="rate-limited">
          <p>Rate limited. Please wait {retryAfter} seconds.</p>
          <button onClick={check}>Retry</button>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
}