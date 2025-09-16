import * as React from 'react';
import { useApp } from '@/hooks/useApp';
import { logger } from '@/utils/logger';
import type { Therapist } from '@/types';
import { debugLog } from '@/config/environment';
import { rosterService } from '@/services/rosterService';

export function useRosterPersistence() {
  const { dispatch } = useApp();

  const addToRoster = React.useCallback(async (therapist: Therapist) => {
    debugLog('Adding therapist to roster:', therapist);
    try {
      // Update local state first
      dispatch({ 
        type: 'ADD_TO_ROSTER', 
        payload: therapist 
      });
      debugLog('Dispatched ADD_TO_ROSTER action');
      
      // Save to database
      try {
        await rosterService.addToTodayRoster(therapist.id);
        debugLog('Saved to database');
      } catch (dbError) {
        logger.warn('Failed to save to database, continuing with local storage:', dbError);
      }
      
      // Save to local storage as backup
      const currentRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      const updatedRoster = [...currentRoster, therapist];
      localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      debugLog('Saved to local storage');
    } catch (error) {
      logger.error('Failed to add therapist to roster:', error);
    }
  }, [dispatch]);

  const removeFromRoster = React.useCallback(async (therapistId: string) => {
    debugLog('removeFromRoster called with therapistId:', therapistId);
    try {
      // Update local state first
      dispatch({ 
        type: 'REMOVE_FROM_ROSTER', 
        payload: therapistId 
      });
      debugLog('Dispatched REMOVE_FROM_ROSTER action');
      
      // Save to database
      try {
        await rosterService.removeFromTodayRoster(therapistId);
        debugLog('Removed from database');
      } catch (dbError) {
        logger.warn('Failed to remove from database, continuing with local storage:', dbError);
      }
      
      // Update local storage
      const currentRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      const updatedRoster = currentRoster.filter((t: Therapist) => t.id !== therapistId);
      localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      debugLog('Updated local storage');
    } catch (error) {
      logger.error('Failed to remove therapist from roster:', error);
    }
  }, [dispatch]);

  const clearRoster = React.useCallback(async () => {
    debugLog('Clearing roster...');
    try {
      // Update local state first
      dispatch({ 
        type: 'CLEAR_ROSTER' 
      });
      debugLog('Dispatched CLEAR_ROSTER action');
      
      // Clear database
      try {
        await rosterService.clearTodayRoster();
        debugLog('Cleared database');
      } catch (dbError) {
        logger.warn('Failed to clear database, continuing with local storage:', dbError);
      }
      
      // Clear local storage
      localStorage.setItem('todayRoster', JSON.stringify([]));
      debugLog('Cleared local storage');
    } catch (error) {
      logger.error('Failed to clear roster:', error);
      console.error('Error clearing roster:', error);
    }
  }, [dispatch]);

  const updateTherapistStatus = React.useCallback(async (therapistId: string, status: Therapist['status'], currentSessionId?: string) => {
    debugLog('Updating therapist status locally:', therapistId, status);
    try {
      // Update local state immediately
      dispatch({ 
        type: 'UPDATE_THERAPIST_STATUS', 
        payload: { therapistId, status, currentSessionId } 
      });
      debugLog('Updated therapist status in local state');
      
      // Update local storage
      const currentRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      const updatedRoster = currentRoster.map((t: Therapist) => 
        t.id === therapistId 
          ? { ...t, status, currentSession: currentSessionId ? { id: currentSessionId } : undefined }
          : t
      );
      localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      debugLog('Updated therapist status in local storage');
    } catch (error) {
      logger.error('Failed to update therapist status:', error);
      console.error('Error updating therapist status:', error);
    }
  }, [dispatch]);

  const updateCheckInTime = React.useCallback(async (therapistId: string) => {
    debugLog('Updating check-in time locally:', therapistId);
    try {
      // Update local state immediately
      dispatch({ 
        type: 'CHECK_IN_THERAPIST', 
        payload: therapistId 
      });
      debugLog('Updated check-in time in local state');
      
      // Update local storage
      const currentRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      const checkInTime = new Date();
      const updatedRoster = currentRoster.map((t: Therapist) => 
        t.id === therapistId 
          ? { ...t, status: 'available' as const, checkInTime }
          : t
      );
      localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      debugLog('Updated check-in time in local storage');
    } catch (error) {
      logger.error('Failed to update check-in time:', error);
      console.error('Error updating check-in time:', error);
    }
  }, [dispatch]);

  const updateDepartureTime = React.useCallback(async (therapistId: string) => {
    debugLog('Updating departure time locally:', therapistId);
    try {
      // Update local state immediately
      dispatch({ 
        type: 'DEPART_THERAPIST', 
        payload: therapistId 
      });
      debugLog('Updated departure time in local state');
      
      // Update local storage
      const currentRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      const departureTime = new Date();
      const updatedRoster = currentRoster.map((t: Therapist) => 
        t.id === therapistId 
          ? { ...t, status: 'departed' as const, departureTime }
          : t
      );
      localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      debugLog('Updated departure time in local storage');
    } catch (error) {
      logger.error('Failed to update departure time:', error);
      console.error('Error updating departure time:', error);
    }
  }, [dispatch]);

  const updateTherapistStats = React.useCallback(async (therapistId: string, earnings: number, sessions: number) => {
    debugLog('Updating therapist stats locally:', therapistId, earnings, sessions);
    try {
      // Update local state immediately
      dispatch({ 
        type: 'UPDATE_THERAPIST_STATS', 
        payload: { therapistId, earnings, sessions } 
      });
      debugLog('Updated therapist stats in local state');
      
      // Update local storage
      const currentRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      const updatedRoster = currentRoster.map((t: Therapist) => 
        t.id === therapistId 
          ? { ...t, totalEarnings: earnings, totalSessions: sessions }
          : t
      );
      localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      debugLog('Updated therapist stats in local storage');
    } catch (error) {
      logger.error('Failed to update therapist stats:', error);
      console.error('Error updating therapist stats:', error);
    }
  }, [dispatch]);

  const loadTodayRoster = React.useCallback(async () => {
    debugLog('Loading today roster from database...');
    try {
      // Try to load from database first
      const dbRoster = await rosterService.getTodayRoster();
      if (dbRoster.length > 0) {
        debugLog('Loaded roster from database:', dbRoster.length, 'therapists');
        dispatch({ 
          type: 'LOAD_TODAY_ROSTER', 
          payload: dbRoster 
        });
        
        // Update local storage with database data
        localStorage.setItem('todayRoster', JSON.stringify(dbRoster));
        return;
      }
      
      // Fallback to local storage if database is empty
      const localRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      if (localRoster.length > 0) {
        debugLog('Loaded roster from local storage:', localRoster.length, 'therapists');
        dispatch({ 
          type: 'LOAD_TODAY_ROSTER', 
          payload: localRoster 
        });
      } else {
        debugLog('No roster data found');
      }
    } catch (error) {
      logger.error('Failed to load today roster:', error);
      
      // Fallback to local storage
      const localRoster = JSON.parse(localStorage.getItem('todayRoster') || '[]');
      if (localRoster.length > 0) {
        debugLog('Fallback: Loaded roster from local storage:', localRoster.length, 'therapists');
        dispatch({ 
          type: 'LOAD_TODAY_ROSTER', 
          payload: localRoster 
        });
      }
    }
  }, [dispatch]);

  return {
    addToRoster,
    removeFromRoster,
    clearRoster,
    loadTodayRoster,
    updateTherapistStatus,
    updateTherapistStats,
    updateCheckInTime,
    updateDepartureTime
  };
}