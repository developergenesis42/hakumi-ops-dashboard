import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { debugLog } from '@/config/environment';

export function useManualTimerStart() {
  const { dispatch, state } = useApp();
  const { updateSessionStatus, updateRoomStatus, updateTherapistStatus } = useRealtimeStatus();

  const startSessionTimer = useCallback(async (sessionId: string) => {
    try {
      debugLog('🕐 Starting session timer manually for session:', sessionId);
      
      // Find the session to get details for printing
      const session = state.sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      const now = new Date();
      
      // Update local state immediately for responsive UI
      dispatch({ 
        type: 'START_SESSION_TIMER', 
        payload: sessionId 
      });

      // Update real-time status in database (single source of truth)
      try {
        // Update session status
        await updateSessionStatus(sessionId, 'in_progress', now, false);
        
        // Update room status
        if (session.roomId) {
          await updateRoomStatus(session.roomId, 'occupied', sessionId);
        }
        
        // Update therapist status
        for (const therapistId of session.therapistIds) {
          await updateTherapistStatus(therapistId, 'in-session', sessionId);
        }
        
        debugLog('✅ Session timer started and status updated in database');
      } catch (error) {
        console.warn('Failed to update session timer in database:', error);
        // Local state was already updated, so UI is still correct
      }
    } catch (error) {
      console.error('Failed to start session timer:', error);
      throw error;
    }
  }, [dispatch, state, updateSessionStatus, updateRoomStatus, updateTherapistStatus]);

  return { startSessionTimer };
}
