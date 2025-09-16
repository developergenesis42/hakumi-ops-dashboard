import * as React from 'react';

/**
 * Custom hook to manage loading states with automatic timeout and visibility handling
 * Prevents infinite loading states when switching tabs or windows
 */
export function useLoadingState(initialLoading = false, timeoutMs = 5000) {
  const [loading, setLoading] = React.useState(initialLoading);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = React.useRef(true);

  // Handle visibility changes (disabled to prevent auth flashing)
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
      // Don't automatically set loading to false on visibility change
      // This was causing the login page to flash
    };

    const handleWindowFocus = () => {
      // Don't automatically set loading to false on window focus
      // This was causing the login page to flash
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // Set loading with automatic timeout
  const setLoadingWithTimeout = React.useCallback((newLoading: boolean) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setLoading(newLoading);

    // If setting to true, set up timeout
    if (newLoading) {
      timeoutRef.current = setTimeout(() => {
        console.warn('Loading timeout reached, forcing loading to false');
        setLoading(false);
        setIsInitialized(true);
      }, timeoutMs);
    } else {
      // If setting to false, mark as initialized
      setIsInitialized(true);
    }
  }, [timeoutMs]);

  // Set up timeout for initial loading state
  React.useEffect(() => {
    if (initialLoading && !isInitialized) {
      timeoutRef.current = setTimeout(() => {
        console.warn('Loading timeout reached, forcing loading to false');
        setLoading(false);
        setIsInitialized(true);
      }, timeoutMs);
    }
  }, [initialLoading, isInitialized, timeoutMs]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
    isInitialized,
    setLoading: setLoadingWithTimeout,
    setIsInitialized,
  };
}