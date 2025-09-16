import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { rosterService } from '@/services/rosterService';
import { sessionService } from '@/services/sessionService';
import { roomService } from '@/services/roomService';

export function useSessionCompletion() {
  const { dispatch, state } = useApp();

  const completeSession = useCallback(async (sessionId: string) => {
    // Find the session to complete
    const session = state.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    
    // Calculate actual end time (current time) - NO TRY/CATCH AROUND THIS
    const actualEndTime = new Date();
    const sessionStartTime = new Date(session.startTime);
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

    // Update session status and actual end time in Supabase (async, don't wait)
    
    // Update therapist stats FIRST, then session status
    const service = session.service;
    const ladyPayout = service.ladyPayout;
    
    // Update therapist stats in parallel with session update
    const therapistUpdates = session.therapistIds.map(async (therapistId) => {
      const therapist = state.todayRoster.find(t => t.id === therapistId);
      if (therapist) {
        const individualPayout = session.therapistIds.length > 1 
          ? ladyPayout / session.therapistIds.length 
          : ladyPayout;
        
        const newEarnings = therapist.totalEarnings + individualPayout;
        const newSessions = therapist.totalSessions + 1;
        
        return Promise.race([
          rosterService.updateTherapistStats(therapistId, newEarnings, newSessions),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Stats timeout')), 3000))
        ]);
      }
    });

    // Run all updates in parallel
    Promise.all([
      // Update session status
      sessionService.updateSessionPartial(sessionId, {
        status: 'completed',
        actualEndTime: actualEndTime.toISOString(),
        actualDuration: actualDuration
      }),
      // Update therapist stats
      ...therapistUpdates,
      // Mark room as available
      roomService.markRoomAvailable(session.roomId)
    ]).catch((error) => {
      console.error('Failed to update session completion in database:', error);
      // Local state was already updated, so UI is still correct
    });
    return {
      actualEndTime,
      actualDuration,
      isEarlyCompletion
    };
  }, [dispatch, state]);

  return { completeSession };
}
