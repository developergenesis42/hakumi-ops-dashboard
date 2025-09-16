import { useCallback, useRef, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { rosterService } from '@/services/rosterService';
import { sessionService } from '@/services/sessionService';
import { roomService } from '@/services/roomService';
import { isSessionCompleted } from '@/utils/helpers';

export function useExpiredSessionCheck() {
  const { dispatch, state } = useApp();
  
  // Use refs to maintain stable references and avoid recreating the function
  const stateRef = useRef(state);
  const dispatchRef = useRef(dispatch);
  
  // Update refs when state changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  const checkExpiredSessions = useCallback(async () => {
    // Use refs to get current values without causing dependency changes
    const currentState = stateRef.current;
    const currentDispatch = dispatchRef.current;
    
    // Only check 'in_progress' sessions for expiration
    // 'scheduled' sessions should not auto-expire - they need manual timer start
    const activeSessions = currentState.sessions.filter(session => session.status === 'in_progress');
    const expiredSessions = activeSessions.filter(session => isSessionCompleted(session));
    
    for (const session of expiredSessions) {
      try {
        // Update therapist stats FIRST
        const service = session.service;
        const ladyPayout = service.ladyPayout;
        
        const therapistUpdates = session.therapistIds.map(async (therapistId) => {
          const therapist = currentState.todayRoster.find(t => t.id === therapistId);
          if (therapist) {
            const individualPayout = session.therapistIds.length > 1 
              ? ladyPayout / session.therapistIds.length 
              : ladyPayout;
            
            const newEarnings = therapist.totalEarnings + individualPayout;
            const newSessions = therapist.totalSessions + 1;
            
            return rosterService.updateTherapistStats(therapistId, newEarnings, newSessions);
          }
        });

        // Run all updates in parallel
        await Promise.all([
          // Update session status
          sessionService.updateSessionPartial(session.id, { status: 'completed' }),
          // Update therapist stats
          ...therapistUpdates,
          // Mark room as available
          roomService.markRoomAvailable(session.roomId)
        ]);

        // Update local state
        currentDispatch({ type: 'COMPLETE_SESSION', payload: session.id });
      } catch (error) {
        console.error('Failed to auto-complete expired session:', error);
        // Still update local state even if Supabase fails
        currentDispatch({ type: 'COMPLETE_SESSION', payload: session.id });
      }
    }
  }, []); // Empty dependency array - function never changes

  return { checkExpiredSessions };
}
