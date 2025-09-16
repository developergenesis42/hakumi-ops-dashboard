import { useEffect, useRef } from 'react';
import { useExpiredSessionCheck } from '@/hooks/useExpiredSessionCheck';

export function SessionExpirationChecker() {
  const { checkExpiredSessions } = useExpiredSessionCheck();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Periodic check for expired sessions (every 30 seconds)
  useEffect(() => {
    // Clear any existing interval to prevent duplicates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      try {
        checkExpiredSessions();
      } catch (error) {
        console.error('Error in expired session check:', error);
      }
    }, 30000); // Check every 30 seconds

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [checkExpiredSessions]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
