import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import { rosterService } from '@/services/rosterService';

export function useSessionCompletion() {
  const { dispatch, state } = useApp();
  const { updateSessionStatus, updateRoomStatus, updateTherapistStatus } = useRealtimeStatus();

  const completeSession = useCallback(async (sessionId: string) => {
    // Find the session to complete
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Calculate actual end time (current time) - NO TRY/CATCH AROUND THIS
    const actualEndTime = new Date();
    const sessionStartTime = session.startTime ? new Date(session.startTime) : new Date();
    const actualDuration = Math.floor((actualEndTime.getTime() - sessionStartTime.getTime()) / 60000); // minutes
    const scheduledDuration = session.service.duration;
    const isEarlyCompletion = actualDuration < scheduledDuration;

    // Update local state FIRST for immediate UI response
    dispatch({ 
      type: 'COMPLETE_SESSION', 
      payload: { 
        sessionId, 
        actualEndTime: actualEndTime.toISOString(),
        actualDuration 
      } 
    });

    // Update real-time status in database (single source of truth)
    try {
      // Update session status
      await updateSessionStatus(sessionId, 'completed');
      
      // Update room status
      if (session.roomId) {
        await updateRoomStatus(session.roomId, 'available');
      }
      
      // Update therapist status
      for (const therapistId of session.therapistIds) {
        await updateTherapistStatus(therapistId, 'available');
      }
      
      // Update therapist stats in parallel
      const service = session.service;
      const ladyPayout = service.ladyPayout;
      
      const therapistUpdates = session.therapistIds.map(async (therapistId) => {
        const therapist = state.todayRoster.find(t => t.id === therapistId);
        if (therapist) {
          const individualPayout = session.therapistIds.length > 1 
            ? ladyPayout / session.therapistIds.length 
            : ladyPayout;
          
          const newEarnings = (therapist.totalEarnings || 0) + individualPayout;
          const newSessions = (therapist.totalSessions || 0) + 1;
          
          return Promise.race([
            rosterService.updateTherapistStats(therapistId, newEarnings, newSessions),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Stats timeout')), 3000))
          ]);
        }
      });

      // Run therapist stats updates in parallel
      Promise.all(therapistUpdates).catch((error) => {
        console.error('Failed to update therapist stats:', error);
      });
      
    } catch (error) {
      console.error('Failed to update session completion in database:', error);
      // Local state was already updated, so UI is still correct
    }
    return {
      actualEndTime,
      actualDuration,
      isEarlyCompletion
    };
  }, [dispatch, state, updateSessionStatus, updateRoomStatus, updateTherapistStatus]);

  return { completeSession };
}
