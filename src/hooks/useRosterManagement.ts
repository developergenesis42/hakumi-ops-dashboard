import { useMemo, useCallback } from 'react';
import { useApp } from '@/hooks/useApp';

export function useRosterManagement() {
  const { state, dispatch } = useApp();

  // Memoized sorted roster
  const sortedRoster = useMemo(() => {
    return state.todayRoster.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.todayRoster]);

  // Memoized roster statistics
  const rosterStats = useMemo(() => {
    const total = state.todayRoster.length;
    const available = state.todayRoster.filter(t => t.status === 'available').length;
    const inSession = state.todayRoster.filter(t => t.status === 'in-session').length;
    const departed = state.todayRoster.filter(t => t.status === 'departed').length;
    const inactive = state.todayRoster.filter(t => t.status === 'inactive').length;

    return {
      total,
      available,
      inSession,
      departed,
      inactive
    };
  }, [state.todayRoster]);

  const handleBackToRosterSetup = useCallback(() => {
    dispatch({ type: 'SET_PHASE', payload: 'roster-setup' });
  }, [dispatch]);

  return {
    sortedRoster,
    rosterStats,
    handleBackToRosterSetup
  };
}
