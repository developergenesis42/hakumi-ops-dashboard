/**
 * CSRF Protection Provider Component
 * Provides CSRF protection context to the entire application
 */

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useCSRFProtection } from '@/shared/utils/csrf';
import { useCSRF } from '@/shared/hooks/useCSRF';
import { CSRFContext, CSRFContextType } from '@/shared/context/CSRFContext';

interface CSRFProviderProps {
  children: ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
  const { getToken, validateToken, isEnabled } = useCSRFProtection();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const newToken = await getToken();
      setToken(newToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get CSRF token');
      console.error('CSRF token refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isEnabled, getToken]);

  // Initialize CSRF token on mount
  useEffect(() => {
    refreshToken();
  }, [isEnabled, refreshToken]);

  // Refresh token every 25 minutes (before 30-minute expiry)
  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      refreshToken();
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(interval);
  }, [isEnabled, refreshToken]);

  const contextValue: CSRFContextType = {
    isEnabled,
    token,
    isLoading,
    error,
    refreshToken,
    validateToken
  };

  return (
    <CSRFContext.Provider value={contextValue}>
      {children}
    </CSRFContext.Provider>
  );
}


/**
 * CSRF Protection Status Component
 * Shows CSRF protection status in development mode
 */
export function CSRFStatus() {
  const { isEnabled, isLoading, error, token } = useCSRF();

  // Only show in development mode
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded text-xs">
      <div>CSRF: {isEnabled ? 'Enabled' : 'Disabled'}</div>
      {isLoading && <div>Loading token...</div>}
      {error && <div className="text-red-400">Error: {error}</div>}
      {token && <div>Token: {token.substring(0, 8)}...</div>}
    </div>
  );
}

