import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { rosterService } from '@/services/rosterService';
import { debugLog } from '@/config/environment';
// import type { Therapist } from '@/types';

export function useTherapistStatus() {
  const { dispatch } = useApp();

  const checkInTherapist = useCallback(async (therapistId: string) => {
    debugLog('🔄 checkInTherapist called with ID:', therapistId);
    try {
      // Update check-in time and status in Supabase
      debugLog('📡 Calling rosterService.updateCheckInTime...');
      await rosterService.updateCheckInTime(therapistId);
      debugLog('✅ Supabase update successful');
      
      // Update local state
      debugLog('🔄 Dispatching CHECK_IN_THERAPIST action...');
      dispatch({
        type: 'CHECK_IN_THERAPIST',
        payload: therapistId
      });
      debugLog('✅ Local state updated successfully');
    } catch (error) {
      console.error('❌ Supabase update failed:', error);
      // Still update local state even if Supabase fails
      debugLog('🔄 Updating local state despite Supabase failure...');
      dispatch({
        type: 'CHECK_IN_THERAPIST',
        payload: therapistId
      });
      debugLog('✅ Local state updated despite Supabase failure');
      // Don't throw error - local state was updated successfully
    }
  }, [dispatch]);

  const departTherapist = useCallback(async (therapistId: string) => {
    // Update local state FIRST for immediate UI response
    dispatch({
      type: 'DEPART_THERAPIST',
      payload: therapistId
    });

    // Update departure time and status in Supabase (async, don't wait)
    Promise.race([
      rosterService.updateDepartureTime(therapistId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase departure timeout')), 5000))
    ]).catch(() => {
      // Local state was already updated, so UI is still correct
    });
  }, [dispatch]);

  const updateTherapistStats = useCallback(async (therapistId: string, earnings: number, sessions: number) => {
    try {
      // Update stats in Supabase
      await rosterService.updateTherapistStats(therapistId, earnings, sessions);
      
      // Update local state
      dispatch({
        type: 'UPDATE_THERAPIST_STATS',
        payload: { therapistId, earnings, sessions }
      });
    } catch {
      // Still update local state even if Supabase fails
      dispatch({
        type: 'UPDATE_THERAPIST_STATS',
        payload: { therapistId, earnings, sessions }
      });
      // Don't throw error - local state was updated successfully
    }
  }, [dispatch]);

  return { checkInTherapist, departTherapist, updateTherapistStats };
}
