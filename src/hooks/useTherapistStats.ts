import { useMemo } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useApp } from '@/hooks/useApp';
import type { Therapist } from '@/types';

/**
 * Hook to calculate current day's stats for therapists based on sessions
 */
export function useTherapistStats() {
  const { sessions: supabaseSessions } = useSupabaseData();
  const { state } = useApp();

  return useMemo(() => {
    // Use sessions from Supabase (which includes all completed sessions from all devices)
    // Fallback to local state if Supabase sessions are not loaded yet
    const allSessions = supabaseSessions.length > 0 ? supabaseSessions : state.sessions;
    
    // Get today's date for filtering
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    // Filter sessions for today
    const todaySessions = allSessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= todayStart && sessionDate < todayEnd;
    });
    
    // Calculate stats for each therapist
    const therapistStats = new Map<string, { sessions: number; earnings: number }>();
    
    todaySessions.forEach(session => {
      if (session.status === 'completed') {
        const individualPayout = session.therapistIds.length > 1 
          ? session.service.ladyPayout / session.therapistIds.length 
          : session.service.ladyPayout;
        
        session.therapistIds.forEach(therapistId => {
          const current = therapistStats.get(therapistId) || { sessions: 0, earnings: 0 };
          therapistStats.set(therapistId, {
            sessions: current.sessions + 1,
            earnings: current.earnings + individualPayout
          });
        });
      }
    });
    
    // Create enhanced therapist objects with today's stats
    const enhancedTherapists = state.todayRoster.map(therapist => {
      const todayStats = therapistStats.get(therapist.id) || { sessions: 0, earnings: 0 };
      
      return {
        ...therapist,
        // Add today's completed sessions to the display
        todaySessions: todayStats.sessions,
        todayEarnings: todayStats.earnings,
        // Keep original totals for reference
        totalSessions: therapist.totalSessions,
        totalEarnings: therapist.totalEarnings
      };
    });
    
    return {
      enhancedTherapists,
      todaySessionsCount: todaySessions.length,
      todayCompletedSessions: todaySessions.filter(s => s.status === 'completed').length
    };
  }, [supabaseSessions, state.sessions, state.todayRoster]);
}
