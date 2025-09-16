import { useState, useEffect, useCallback } from 'react';
import { realtimeStatusService } from '@/services/realtimeStatusService';
import { useApp } from '@/hooks/useApp';
import type { Therapist, Room, Session } from '@/types';
import { debugLog } from '@/config/environment';

/**
 * Hook for managing real-time status synchronization across devices
 * This ensures all devices see the same operational status (timers, room occupancy, etc.)
 */
export function useRealtimeStatus() {
  const { dispatch, state } = useApp();
  const [isConnected, setIsConnected] = useState(false);

  // Update therapist status in database and local state
  const updateTherapistStatus = useCallback(async (
    therapistId: string, 
    status: Therapist['status'],
    currentSessionId?: string
  ) => {
    try {
      // Update database first (single source of truth)
      await realtimeStatusService.updateTherapistStatus(therapistId, status, currentSessionId);
      
      // Update local state for immediate UI response
      dispatch({
        type: 'UPDATE_THERAPIST_STATUS',
        payload: { therapistId, status, currentSessionId }
      });
      
      debugLog('useRealtimeStatus: Therapist status updated:', therapistId, status);
    } catch (error) {
      console.error('Failed to update therapist status:', error);
      throw error;
    }
  }, [dispatch]);

  // Update room status in database and local state
  const updateRoomStatus = useCallback(async (
    roomId: string, 
    status: Room['status'],
    currentSessionId?: string
  ) => {
    try {
      // Update database first (single source of truth)
      await realtimeStatusService.updateRoomStatus(roomId, status, currentSessionId);
      
      // Update local state for immediate UI response
      dispatch({
        type: 'UPDATE_ROOM_STATUS',
        payload: { roomId, status, currentSessionId }
      });
      
      debugLog('useRealtimeStatus: Room status updated:', roomId, status);
    } catch (error) {
      console.error('Failed to update room status:', error);
      throw error;
    }
  }, [dispatch]);

  // Update session status in database and local state
  const updateSessionStatus = useCallback(async (
    sessionId: string,
    status: Session['status'],
    sessionStartTime?: Date,
    isInPrepPhase?: boolean
  ) => {
    try {
      // Update database first (single source of truth)
      await realtimeStatusService.updateSessionStatus(sessionId, status, sessionStartTime, isInPrepPhase);
      
      // Update local state for immediate UI response
      dispatch({
        type: 'UPDATE_SESSION_STATUS',
        payload: { sessionId, status, sessionStartTime, isInPrepPhase }
      });
      
      debugLog('useRealtimeStatus: Session status updated:', sessionId, status);
    } catch (error) {
      console.error('Failed to update session status:', error);
      throw error;
    }
  }, [dispatch]);

  // Set up real-time subscriptions
  useEffect(() => {
    debugLog('useRealtimeStatus: Setting up real-time subscriptions');
    setIsConnected(true);

    // Subscribe to therapist status changes
    const unsubscribeTherapists = realtimeStatusService.subscribeToTherapistStatus(
      (therapists: Therapist[]) => {
        debugLog('useRealtimeStatus: Received therapist status update:', therapists.length, 'therapists');
        dispatch({
          type: 'LOAD_THERAPISTS',
          payload: therapists
        });
      }
    );

    // Subscribe to room status changes
    const unsubscribeRooms = realtimeStatusService.subscribeToRoomStatus(
      (rooms: Room[]) => {
        debugLog('useRealtimeStatus: Received room status update:', rooms.length, 'rooms');
        dispatch({
          type: 'LOAD_ROOMS',
          payload: rooms
        });
      }
    );

    // Subscribe to session status changes
    const unsubscribeSessions = realtimeStatusService.subscribeToSessionStatus(
      (sessions: Session[]) => {
        debugLog('useRealtimeStatus: Received session status update:', sessions.length, 'sessions');
        dispatch({
          type: 'LOAD_SESSIONS',
          payload: sessions
        });
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      debugLog('useRealtimeStatus: Cleaning up real-time subscriptions');
      unsubscribeTherapists();
      unsubscribeRooms();
      unsubscribeSessions();
      setIsConnected(false);
    };
  }, [dispatch]);

  return {
    isConnected,
    updateTherapistStatus,
    updateRoomStatus,
    updateSessionStatus
  };
}
