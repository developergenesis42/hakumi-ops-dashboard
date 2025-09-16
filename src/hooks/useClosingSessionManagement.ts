import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useTherapistStatus } from '@/hooks/useTherapistStatus';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { sessionService } from '@/services/sessionService';
import { WalkoutService } from '@/services/walkoutService';
import { roomService } from '@/services/roomService';
import { useAttendance } from '@/hooks/useAttendance';
import type { Session, Therapist } from '@/types';
import { debugLog } from '@/config/environment';

export function useClosingSessionManagement() {
  const { state, dispatch } = useApp();
  const { departTherapist } = useTherapistStatus();
  const { printReceipt } = usePrintReceipt();
  const { clearTodayAttendance } = useAttendance();
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const activeSessions = state.sessions.filter(s => s.status === 'in_progress');
  const remainingTherapists = state.todayRoster.filter(t => t.status === 'available');

  // Handler for editing a completed session
  const handleEditSession = (session: Session) => {
    setEditingSession(session);
  };

  // Handler for reprinting a session receipt
  const handleReprintSession = async (session: Session) => {
    try {
      // Get therapists and room for the session
      const therapists = session.therapistIds.map(id => 
        state.todayRoster.find(t => t.id === id)
      ).filter(Boolean) as Therapist[];
      
      const room = state.rooms.find(r => r.id === session.roomId);
      
      if (!room) {
        alert('Room not found for this session');
        return;
      }

      if (therapists.length === 0) {
        alert('Therapists not found for this session');
        return;
      }

      await printReceipt(session, therapists, room);
    } catch (error) {
      console.error('Failed to reprint session:', error);
      alert('Failed to reprint receipt. Please try again.');
    }
  };

  // Handler for updating a session
  const handleUpdateSession = async (updatedSession: Session) => {
    try {
      // Update session in the database
      await sessionService.updateSession(updatedSession);
      
      // Update session in local state
      dispatch({
        type: 'UPDATE_SESSION',
        payload: {
          sessionId: updatedSession.id,
          updates: updatedSession
        }
      });
      
      setEditingSession(null);
      alert('Session updated successfully!');
    } catch (error) {
      console.error('Failed to update session:', error);
      alert('Failed to update session. Please try again.');
    }
  };

  const handleDepartAll = async (totalPayouts: number) => {
    if (activeSessions.length > 0) {
      alert(`Warning: There are ${activeSessions.length} active sessions. Please complete all sessions before departing therapists.`);
      return;
    }

    if (confirm(`Depart all remaining ${remainingTherapists.length} therapists? Total payouts: $${totalPayouts.toFixed(2)}`)) {
      try {
        // Depart all therapists with Supabase persistence
        await Promise.all(remainingTherapists.map(therapist => departTherapist(therapist.id)));
      } catch (error) {
        console.error('Failed to depart some therapists:', error);
        // Still update local state even if some Supabase calls fail
        remainingTherapists.forEach(therapist => {
          dispatch({ type: 'DEPART_THERAPIST', payload: therapist.id });
        });
      }
    }
  };

  const handleResetDay = async () => {
    if (confirm('Are you sure you want to reset the dashboard for a new day? This will clear the current day\'s operational data but preserve all session history for analytics.')) {
      try {
        debugLog('🔄 Starting reset day process...');
        
        // Note: We're NOT deleting session data from database to preserve historical analytics
        debugLog('📊 Preserving session data in database for historical analysis...');
        
        // Only clear operational data that's specific to today's dashboard state
        debugLog('🗑️ Clearing today\'s operational data from localStorage...');
        
        // Clear walkouts from localStorage (but keep in database)
        WalkoutService.clearTodayWalkOutsFromLocalStorage();
        debugLog('✅ Walkouts cleared from localStorage');
        
        // Clear all localStorage data
        debugLog('🗑️ Clearing localStorage data...');
        localStorage.removeItem('todayRoster');
        localStorage.removeItem('spa-current-phase');
        
        // Clear attendance data
        debugLog('🗑️ Clearing attendance data...');
        clearTodayAttendance();
        debugLog('✅ Attendance data cleared');
        
        // Reset all rooms to available in database
        debugLog('🏠 Resetting all rooms to available...');
        try {
          await roomService.resetAllRooms();
          debugLog('✅ All rooms reset to available in database');
        } catch (roomError) {
          console.error('Failed to reset rooms in database:', roomError);
          // Don't fail the entire reset if room reset fails
        }
        
        // Clear any other spa-related localStorage keys
        const today = new Date().toDateString();
        localStorage.removeItem(`walkouts_${today}`);
        localStorage.removeItem('spa-attendance');
        localStorage.removeItem('spa-attendance-sync-queue');
        debugLog('✅ All localStorage keys cleared');
        
        // Dispatch the reset action to clear in-memory state
        debugLog('🔄 Dispatching RESET_DAY action...');
        dispatch({ type: 'RESET_DAY' });
        debugLog('✅ RESET_DAY action dispatched');
        
        // Navigate back to roster setup
        debugLog('🔄 Setting phase to roster-setup...');
        dispatch({ type: 'SET_PHASE', payload: 'roster-setup' });
        debugLog('✅ Phase set to roster-setup');
        
        debugLog('🎉 Day reset completed successfully - session data preserved for analytics');
        alert('Dashboard reset completed! All session data has been preserved in the database for historical analysis.');
      } catch (error) {
        console.error('❌ Failed to reset day:', error);
        alert(`Failed to reset day: ${error instanceof Error ? error.message : String(error)}. Please try again.`);
      }
    }
  };

  return {
    activeSessions,
    remainingTherapists,
    editingSession,
    setEditingSession,
    handleEditSession,
    handleReprintSession,
    handleUpdateSession,
    handleDepartAll,
    handleResetDay
  };
}
