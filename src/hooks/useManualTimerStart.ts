import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { sessionService } from '@/services/sessionService';
import { roomService } from '@/services/roomService';
import { debugLog } from '@/config/environment';

export function useManualTimerStart() {
  const { dispatch, state } = useApp();

  const startSessionTimer = useCallback(async (sessionId: string) => {
    try {
      debugLog('🕐 Starting session timer manually for session:', sessionId);
      
      // Find the session to get details for printing
      const session = state.sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Update local state immediately for responsive UI
      dispatch({ 
        type: 'START_SESSION_TIMER', 
        payload: sessionId 
      });

      // Receipt is already printed when session was created
      debugLog('✅ Session timer started for session:', sessionId);

      // Update database asynchronously
      try {
        await sessionService.updateSessionPartial(sessionId, {
          sessionStartTime: new Date(),
          isInPrepPhase: false
        });
        
        // Mark room as occupied in database
        await roomService.markRoomOccupied(session.roomId, sessionId);
        
        debugLog('✅ Session timer started in database and room marked as occupied');
      } catch (error) {
        console.warn('Failed to update session timer in database:', error);
        // Local state was already updated, so UI is still correct
      }
    } catch (error) {
      console.error('Failed to start session timer:', error);
      throw error;
    }
  }, [dispatch, state]);

  return { startSessionTimer };
}
