import React from 'react';
import { RateLimitWrapper } from '@/components/RateLimitWrapper';

/**
 * Higher-order component for rate limiting
 */
export function withRateLimit<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  limiterName: string,
  identifier?: string
) {
  return function RateLimitedComponent(props: P) {
    return (
      <RateLimitWrapper limiterName={limiterName} identifier={identifier}>
        <WrappedComponent {...props} />
      </RateLimitWrapper>
    );
  };
}
