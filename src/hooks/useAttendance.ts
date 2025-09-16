/**
 * Attendance Hook
 * Manages check-in/departure with local storage backup and database sync
 */

import { useState, useEffect, useCallback } from 'react';
import { attendanceService, type AttendanceRecord, type DailyAttendance } from '@/services/attendanceService';
import { useApp } from '@/hooks/useApp';
import { debugLog } from '@/config/environment';

export function useAttendance() {
  const { dispatch } = useApp();
  const [todayAttendance, setTodayAttendance] = useState<DailyAttendance>(attendanceService.getTodayAttendance());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Retry failed syncs when coming back online
      attendanceService.retryFailedSyncs();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update today's attendance when it changes
  useEffect(() => {
    setTodayAttendance(attendanceService.getTodayAttendance());
  }, []);

  /**
   * Check in a therapist
   */
  const checkInTherapist = useCallback(async (therapistId: string, therapistName: string) => {
    try {
      // Update local state first for immediate UI response
      dispatch({
        type: 'CHECK_IN_THERAPIST',
        payload: therapistId
      });

      // Save to attendance service (with local storage backup)
      await attendanceService.checkInTherapist(therapistId, therapistName);

      // Update local attendance state
      setTodayAttendance(attendanceService.getTodayAttendance());

      debugLog(`✅ ${therapistName} checked in successfully`);
    } catch (error) {
      console.error('Failed to check in therapist:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Depart a therapist
   */
  const departTherapist = useCallback(async (therapistId: string, therapistName: string) => {
    try {
      // Update local state first for immediate UI response
      dispatch({
        type: 'DEPART_THERAPIST',
        payload: therapistId
      });

      // Save to attendance service (with local storage backup)
      await attendanceService.departTherapist(therapistId, therapistName);

      // Update local attendance state
      setTodayAttendance(attendanceService.getTodayAttendance());

      debugLog(`✅ ${therapistName} departed successfully`);
    } catch (error) {
      console.error('Failed to depart therapist:', error);
      throw error;
    }
  }, [dispatch]);

  /**
   * Get attendance record for a specific therapist
   */
  const getTherapistAttendance = useCallback((therapistId: string): AttendanceRecord | undefined => {
    return todayAttendance.records.find(record => record.therapistId === therapistId);
  }, [todayAttendance]);

  /**
   * Get working hours for a therapist
   */
  const getTherapistWorkingHours = useCallback((therapistId: string): number => {
    const record = getTherapistAttendance(therapistId);
    if (!record) return 0;

    if (record.departureTime) {
      // Therapist has departed, return stored working hours
      return record.workingHours || 0;
    } else {
      // Therapist is still working, calculate current working hours
      const now = new Date();
      const diffMs = now.getTime() - record.checkInTime.getTime();
      return Math.round(diffMs / (1000 * 60)); // Convert to minutes
    }
  }, [getTherapistAttendance]);

  /**
   * Format working hours as HH:MM
   */
  const formatWorkingHours = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Get all attendance records
   */
  const getAllAttendance = useCallback((): DailyAttendance[] => {
    return attendanceService.getAllAttendance();
  }, []);

  /**
   * Retry failed syncs
   */
  const retrySyncs = useCallback(async (): Promise<void> => {
    await attendanceService.retryFailedSyncs();
    setTodayAttendance(attendanceService.getTodayAttendance());
  }, []);

  /**
   * Clear today's attendance data (for reset day functionality)
   */
  const clearTodayAttendance = useCallback((): void => {
    attendanceService.clearTodayAttendance();
    setTodayAttendance(attendanceService.getTodayAttendance());
  }, []);

  /**
   * Clear old data
   */
  const clearOldData = useCallback((): void => {
    attendanceService.clearOldData();
  }, []);

  /**
   * Export attendance data
   */
  const exportData = useCallback((): string => {
    return attendanceService.exportAttendanceData();
  }, []);

  /**
   * Import attendance data
   */
  const importData = useCallback((jsonData: string): void => {
    attendanceService.importAttendanceData(jsonData);
    setTodayAttendance(attendanceService.getTodayAttendance());
  }, []);

  return {
    // State
    todayAttendance,
    isOnline,
    
    // Actions
    checkInTherapist,
    departTherapist,
    
    // Getters
    getTherapistAttendance,
    getTherapistWorkingHours,
    formatWorkingHours,
    getAllAttendance,
    
    // Utilities
    retrySyncs,
    clearTodayAttendance,
    clearOldData,
    exportData,
    importData
  };
}
