/**
 * Attendance Service
 * Handles check-in/departure with local storage backup and database sync
 */

import { rosterService } from '@/services/rosterService';
import { debugLog } from '@/config/environment';
// import type { Therapist } from '@/types';

export interface AttendanceRecord {
  therapistId: string;
  therapistName: string;
  checkInTime: Date;
  departureTime?: Date;
  workingHours?: number; // in minutes
  synced: boolean; // whether this record has been synced to database
}

export interface DailyAttendance {
  date: string; // YYYY-MM-DD format
  records: AttendanceRecord[];
  totalWorkingHours: number;
}

class AttendanceService {
  private readonly STORAGE_KEY = 'spa-attendance';
  private readonly SYNC_QUEUE_KEY = 'spa-attendance-sync-queue';

  /**
   * Check in a therapist with local storage backup
   */
  async checkInTherapist(therapistId: string, therapistName: string): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Create attendance record
    const record: AttendanceRecord = {
      therapistId,
      therapistName,
      checkInTime: now,
      synced: false
    };

    // Save to local storage immediately
    this.saveAttendanceRecord(today, record);

    // Try to sync to database (non-blocking)
    this.syncToDatabase(therapistId, 'checkin', now).catch(error => {
      console.warn('Failed to sync check-in to database:', error);
      // Add to sync queue for later retry
      this.addToSyncQueue('checkin', therapistId, now);
    });

    debugLog(`✅ ${therapistName} checked in at ${now.toLocaleTimeString()}`);
  }

  /**
   * Depart a therapist with local storage backup
   */
  async departTherapist(therapistId: string, therapistName: string): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get existing record
    const dailyAttendance = this.getDailyAttendance(today);
    const recordIndex = dailyAttendance.records.findIndex(r => r.therapistId === therapistId);
    
    if (recordIndex === -1) {
      throw new Error('No check-in record found for this therapist');
    }

    // Update record with departure time
    const record = dailyAttendance.records[recordIndex];
    record.departureTime = now;
    record.workingHours = this.calculateWorkingHours(record.checkInTime, now);
    record.synced = false;

    // Update local storage
    this.saveDailyAttendance(today, dailyAttendance);

    // Try to sync to database (non-blocking)
    this.syncToDatabase(therapistId, 'departure', now).catch(error => {
      console.warn('Failed to sync departure to database:', error);
      // Add to sync queue for later retry
      this.addToSyncQueue('departure', therapistId, now);
    });

    debugLog(`✅ ${therapistName} departed at ${now.toLocaleTimeString()} (${record.workingHours} minutes worked)`);
  }

  /**
   * Get today's attendance records
   */
  getTodayAttendance(): DailyAttendance {
    const today = new Date().toISOString().split('T')[0];
    return this.getDailyAttendance(today);
  }

  /**
   * Get attendance for a specific date
   */
  getDailyAttendance(date: string): DailyAttendance {
    const stored = localStorage.getItem(`${this.STORAGE_KEY}-${date}`);
    
    if (stored) {
      const data = JSON.parse(stored);
      // Convert date strings back to Date objects
      data.records = data.records.map((record: { checkInTime: string; departureTime?: string; [key: string]: unknown }) => ({
        ...record,
        checkInTime: new Date(record.checkInTime),
        departureTime: record.departureTime ? new Date(record.departureTime) : undefined
      }));
      return data;
    }

    return {
      date,
      records: [],
      totalWorkingHours: 0
    };
  }

  /**
   * Get all attendance records (for historical view)
   */
  getAllAttendance(): DailyAttendance[] {
    const records: DailyAttendance[] = [];
    
    // Get all stored dates
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.STORAGE_KEY}-`)) {
        const date = key.replace(`${this.STORAGE_KEY}-`, '');
        records.push(this.getDailyAttendance(date));
      }
    }

    return records.sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Calculate working hours between two dates
   */
  private calculateWorkingHours(checkIn: Date, departure: Date): number {
    const diffMs = departure.getTime() - checkIn.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Save attendance record to local storage
   */
  private saveAttendanceRecord(date: string, record: AttendanceRecord): void {
    const dailyAttendance = this.getDailyAttendance(date);
    
    // Check if therapist already has a record for today
    const existingIndex = dailyAttendance.records.findIndex(r => r.therapistId === record.therapistId);
    
    if (existingIndex >= 0) {
      // Update existing record
      dailyAttendance.records[existingIndex] = record;
    } else {
      // Add new record
      dailyAttendance.records.push(record);
    }

    // Recalculate total working hours
    dailyAttendance.totalWorkingHours = dailyAttendance.records.reduce((total, r) => {
      return total + (r.workingHours || 0);
    }, 0);

    this.saveDailyAttendance(date, dailyAttendance);
  }

  /**
   * Save daily attendance to local storage
   */
  private saveDailyAttendance(date: string, dailyAttendance: DailyAttendance): void {
    localStorage.setItem(`${this.STORAGE_KEY}-${date}`, JSON.stringify(dailyAttendance));
  }

  /**
   * Sync attendance data to database
   */
  private async syncToDatabase(therapistId: string, action: 'checkin' | 'departure', _timestamp: Date): Promise<void> { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (action === 'checkin') {
      await rosterService.updateCheckInTime(therapistId);
    } else {
      await rosterService.updateDepartureTime(therapistId);
    }
    debugLog(`✅ Synced ${action} to database for therapist ${therapistId}`);
  }

  /**
   * Add failed sync to retry queue
   */
  private addToSyncQueue(action: 'checkin' | 'departure', therapistId: string, timestamp: Date): void {
    const queue = this.getSyncQueue();
    queue.push({
      action,
      therapistId,
      timestamp: timestamp.toISOString(),
      retryCount: 0
    });
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Get sync queue
   */
  private getSyncQueue(): Array<{
    action: 'checkin' | 'departure';
    therapistId: string;
    timestamp: string;
    retryCount: number;
  }> {
    const stored = localStorage.getItem(this.SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Retry failed syncs
   */
  async retryFailedSyncs(): Promise<void> {
    const queue = this.getSyncQueue();
    const successful: number[] = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      
      try {
        await this.syncToDatabase(item.therapistId, item.action, new Date(item.timestamp));
        successful.push(i);
        debugLog(`✅ Retried and synced ${item.action} for therapist ${item.therapistId}`);
      } catch {
        item.retryCount++;
        if (item.retryCount >= 3) {
          console.error(`❌ Failed to sync ${item.action} for therapist ${item.therapistId} after 3 retries`);
          successful.push(i); // Remove from queue after max retries
        }
      }
    }

    // Remove successful items from queue
    const remaining = queue.filter((_, index) => !successful.includes(index));
    localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remaining));
  }

  /**
   * Clear today's attendance data (for reset day functionality)
   */
  clearTodayAttendance(): void {
    const today = new Date().toISOString().split('T')[0];
    const todayKey = `${this.STORAGE_KEY}-${today}`;
    localStorage.removeItem(todayKey);
    debugLog(`🗑️ Cleared today's attendance data for ${today}`);
  }

  /**
   * Clear old attendance data (older than 30 days)
   */
  clearOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${this.STORAGE_KEY}-`)) {
        const dateStr = key.replace(`${this.STORAGE_KEY}-`, '');
        const date = new Date(dateStr);
        
        if (date < thirtyDaysAgo) {
          localStorage.removeItem(key);
          debugLog(`🗑️ Cleared old attendance data for ${dateStr}`);
        }
      }
    }
  }

  /**
   * Export attendance data for backup
   */
  exportAttendanceData(): string {
    const allData = this.getAllAttendance();
    return JSON.stringify(allData, null, 2);
  }

  /**
   * Import attendance data from backup
   */
  importAttendanceData(jsonData: string): void {
    try {
      const data: DailyAttendance[] = JSON.parse(jsonData);
      
      data.forEach(dailyAttendance => {
        this.saveDailyAttendance(dailyAttendance.date, dailyAttendance);
      });
      
      debugLog(`✅ Imported attendance data for ${data.length} days`);
    } catch {
      throw new Error('Invalid attendance data format');
    }
  }
}

export const attendanceService = new AttendanceService();
