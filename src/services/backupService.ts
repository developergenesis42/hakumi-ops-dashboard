/**
 * Backup Service
 * Database backup and restore functionality
 */

import { performanceMonitoring } from '@/config/monitoring';
import supabase from '@/utils/supabase';
import type { Session, WalkOut, Service, Room } from '@/types';

// Backup data types
interface BackupTables {
  users?: UserProfile[];
  sessions?: Session[];
  rosters?: RosterData[];
  walkOuts?: WalkOut[];
  services?: Service[];
  rooms?: Room[];
}

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

interface RosterData {
  id: string;
  date: string;
  therapist_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface BackupData {
  id: string;
  timestamp: Date;
  size: number;
  tables: BackupTables;
  metadata: {
    version: string;
    userCount: number;
    sessionCount: number;
    totalRecords: number;
  };
}

export interface BackupOptions {
  includeUsers: boolean;
  includeSessions: boolean;
  includeRosters: boolean;
  includeWalkOuts: boolean;
  includeServices: boolean;
  includeRooms: boolean;
  compress: boolean;
  [key: string]: unknown;
}

export interface RestoreOptions {
  overwriteExisting: boolean;
  validateData: boolean;
  [key: string]: unknown;
  createBackup: boolean;
}

/**
 * Default backup options
 */
const defaultBackupOptions: BackupOptions = {
  includeUsers: true,
  includeSessions: true,
  includeRosters: true,
  includeWalkOuts: true,
  includeServices: true,
  includeRooms: true,
  compress: true,
};

/**
 * Default restore options
 */
const defaultRestoreOptions: RestoreOptions = {
  overwriteExisting: false,
  validateData: true,
  createBackup: true,
};

/**
 * Backup service implementation
 */
export const backupService = {
  /**
   * Create a full database backup
   */
  createBackup: async (options: Partial<BackupOptions> = {}): Promise<BackupData> => {
    const startTime = performance.now();
    const finalOptions = { ...defaultBackupOptions, ...options };
    
    try {
      performanceMonitoring.trackUserAction('backup-create-start', 'BackupService', finalOptions);
      
      const backupId = `backup-${Date.now()}`;
      const timestamp = new Date();
      const backupData: {
        id: string;
        timestamp: string;
        version: string;
        tables: {
          users?: unknown[];
          sessions?: unknown[];
          rosters?: unknown[];
          walkOuts?: unknown[];
          services?: unknown[];
          rooms?: unknown[];
        };
        metadata: {
          version: string;
          userCount: number;
          sessionCount: number;
          totalRecords: number;
        };
      } = {
        id: backupId,
        timestamp: timestamp.toISOString(),
        version: '1.0.0',
        tables: {},
        metadata: {
          version: '1.0.0',
          userCount: 0,
          sessionCount: 0,
          totalRecords: 0,
        },
      };

      // Backup users
      if (finalOptions.includeUsers) {
        const { data: users, error: usersError } = await supabase
          .from('user_profiles')
          .select('*');
        
        if (usersError) throw usersError;
        
        backupData.tables.users = users;
        backupData.metadata.userCount = users?.length || 0;
      }

      // Backup sessions
      if (finalOptions.includeSessions) {
        const { data: sessions, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
            *,
            services (
              id,
              category,
              room_type,
              duration,
              price,
              lady_payout,
              shop_revenue,
              description
            )
          `);
        
        if (sessionsError) throw sessionsError;
        
        backupData.tables.sessions = sessions;
        backupData.metadata.sessionCount = sessions?.length || 0;
      }

      // Backup rosters
      if (finalOptions.includeRosters) {
        const { data: rosters, error: rostersError } = await supabase
          .from('daily_rosters')
          .select('*');
        
        if (rostersError) throw rostersError;
        
        backupData.tables.rosters = rosters;
      }

      // Backup walk-outs
      if (finalOptions.includeWalkOuts) {
        const { data: walkOuts, error: walkOutsError } = await supabase
          .from('walk_outs')
          .select('*');
        
        if (walkOutsError) throw walkOutsError;
        
        backupData.tables.walkOuts = walkOuts;
      }

      // Backup services
      if (finalOptions.includeServices) {
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*');
        
        if (servicesError) throw servicesError;
        
        backupData.tables.services = services;
      }

      // Backup rooms
      if (finalOptions.includeRooms) {
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('*');
        
        if (roomsError) throw roomsError;
        
        backupData.tables.rooms = rooms;
      }

      // Calculate total records
      backupData.metadata.totalRecords = Object.values(backupData.tables)
        .reduce((total: number, table: unknown) => total + (Array.isArray(table) ? table.length : 0), 0);

      // Convert to JSON string
      const jsonData = JSON.stringify(backupData, null, 2);
      
      // Compress if requested
      let finalData = jsonData;
      if (finalOptions.compress) {
        // In a real implementation, you would use a compression library like pako
        // For now, we'll just simulate compression
        finalData = btoa(jsonData); // Base64 encoding as a simple compression simulation
      }

      // Create backup file
      const blob = new Blob([finalData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `spa-backup-${backupId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const backupResult: BackupData = {
        id: backupId,
        timestamp,
        size: blob.size,
        tables: backupData.tables as BackupTables,
        metadata: backupData.metadata,
      };

      performanceMonitoring.trackUserAction('backup-create-success', 'BackupService', {
        backupId,
        size: blob.size,
        recordCount: backupData.metadata.totalRecords,
      });
      performanceMonitoring.trackTiming('backup-create', startTime);

      return backupResult;
    } catch (error) {
      performanceMonitoring.trackUserAction('backup-create-error', 'BackupService', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      performanceMonitoring.trackTiming('backup-create', startTime);
      throw error;
    }
  },

  /**
   * Restore database from backup file
   */
  restoreFromFile: async (
    file: File,
    options: Partial<RestoreOptions> = {}
  ): Promise<{ success: boolean; message: string; restoredTables: string[] }> => {
    const startTime = performance.now();
    const finalOptions = { ...defaultRestoreOptions, ...options };
    
    try {
      performanceMonitoring.trackUserAction('backup-restore-start', 'BackupService', finalOptions);
      
      // Read file content
      const fileContent = await file.text();
      
      // Parse backup data
      let backupData: {
        id: string;
        timestamp: string;
        tables: BackupTables;
        metadata?: {
          totalRecords: number;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
      try {
        // Try to parse as JSON first
        backupData = JSON.parse(fileContent);
      } catch {
        // If that fails, try base64 decoding (for compressed backups)
        try {
          const decodedContent = atob(fileContent);
          backupData = JSON.parse(decodedContent);
        } catch {
          throw new Error('Invalid backup file format');
        }
      }

      // Validate backup data structure
      if (!backupData.id || !backupData.timestamp || !backupData.tables) {
        throw new Error('Invalid backup file: missing required fields');
      }

      // Create backup before restore if requested
      if (finalOptions.createBackup) {
        await backupService.createBackup({
          includeUsers: true,
          includeSessions: true,
          includeRosters: true,
          includeWalkOuts: true,
          includeServices: true,
          includeRooms: true,
        });
      }

      const restoredTables: string[] = [];

      // Restore users
      if (backupData.tables.users && Array.isArray(backupData.tables.users)) {
        if (finalOptions.overwriteExisting) {
          // Clear existing users (except current user)
          const { error: deleteError } = await supabase
            .from('user_profiles')
            .delete()
            .neq('id', 'current-user-id'); // In real app, get current user ID
          
          if (deleteError) throw deleteError;
        }

        const { error: usersError } = await supabase
          .from('user_profiles')
          .upsert(backupData.tables.users as UserProfile[]);
        
        if (usersError) throw usersError;
        restoredTables.push('users');
      }

      // Restore services
      if (backupData.tables.services && Array.isArray(backupData.tables.services)) {
        if (finalOptions.overwriteExisting) {
          const { error: deleteError } = await supabase
            .from('services')
            .delete();
          
          if (deleteError) throw deleteError;
        }

        const { error: servicesError } = await supabase
          .from('services')
          .upsert(backupData.tables.services as Service[]);
        
        if (servicesError) throw servicesError;
        restoredTables.push('services');
      }

      // Restore rooms
      if (backupData.tables.rooms && Array.isArray(backupData.tables.rooms)) {
        if (finalOptions.overwriteExisting) {
          const { error: deleteError } = await supabase
            .from('rooms')
            .delete();
          
          if (deleteError) throw deleteError;
        }

        const { error: roomsError } = await supabase
          .from('rooms')
          .upsert(backupData.tables.rooms as Room[]);
        
        if (roomsError) throw roomsError;
        restoredTables.push('rooms');
      }

      // Restore rosters
      if (backupData.tables.rosters && Array.isArray(backupData.tables.rosters)) {
        if (finalOptions.overwriteExisting) {
          const { error: deleteError } = await supabase
            .from('daily_rosters')
            .delete();
          
          if (deleteError) throw deleteError;
        }

        const { error: rostersError } = await supabase
          .from('daily_rosters')
          .upsert(backupData.tables.rosters as RosterData[]);
        
        if (rostersError) throw rostersError;
        restoredTables.push('rosters');
      }

      // Restore sessions
      if (backupData.tables.sessions && Array.isArray(backupData.tables.sessions)) {
        if (finalOptions.overwriteExisting) {
          const { error: deleteError } = await supabase
            .from('sessions')
            .delete();
          
          if (deleteError) throw deleteError;
        }

        const { error: sessionsError } = await supabase
          .from('sessions')
          .upsert(backupData.tables.sessions as Session[]);
        
        if (sessionsError) throw sessionsError;
        restoredTables.push('sessions');
      }

      // Restore walk-outs
      if (backupData.tables.walkOuts && Array.isArray(backupData.tables.walkOuts)) {
        if (finalOptions.overwriteExisting) {
          const { error: deleteError } = await supabase
            .from('walk_outs')
            .delete();
          
          if (deleteError) throw deleteError;
        }

        const { error: walkOutsError } = await supabase
          .from('walk_outs')
          .upsert(backupData.tables.walkOuts as WalkOut[]);
        
        if (walkOutsError) throw walkOutsError;
        restoredTables.push('walkOuts');
      }

      performanceMonitoring.trackUserAction('backup-restore-success', 'BackupService', {
        restoredTables,
        recordCount: backupData.metadata?.totalRecords || 0,
      });
      performanceMonitoring.trackTiming('backup-restore', startTime);

      return {
        success: true,
        message: `Successfully restored ${restoredTables.length} tables with ${backupData.metadata?.totalRecords || 0} records`,
        restoredTables,
      };
    } catch (error) {
      performanceMonitoring.trackUserAction('backup-restore-error', 'BackupService', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      performanceMonitoring.trackTiming('backup-restore', startTime);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Restore failed',
        restoredTables: [],
      };
    }
  },

  /**
   * Validate backup file
   */
  validateBackupFile: async (file: File): Promise<{ valid: boolean; message: string; metadata?: Record<string, unknown> }> => {
    try {
      const fileContent = await file.text();
      
      let backupData: Record<string, unknown>;
      try {
        backupData = JSON.parse(fileContent);
      } catch {
        try {
          const decodedContent = atob(fileContent);
          backupData = JSON.parse(decodedContent);
        } catch {
          return {
            valid: false,
            message: 'Invalid file format. Please select a valid backup file.',
          };
        }
      }

      // Validate structure
      if (!backupData.id || !backupData.timestamp || !backupData.tables) {
        return {
          valid: false,
          message: 'Invalid backup file: missing required fields.',
        };
      }

      // Validate timestamp
      const backupDate = new Date(backupData.timestamp as string);
      if (isNaN(backupDate.getTime())) {
        return {
          valid: false,
          message: 'Invalid backup file: invalid timestamp.',
        };
      }

      return {
        valid: true,
        message: 'Backup file is valid.',
        metadata: {
          id: backupData.id,
          timestamp: backupDate,
          version: backupData.version || '1.0.0',
          tables: Object.keys(backupData.tables),
          recordCount: (backupData.metadata as { totalRecords?: number })?.totalRecords || 0,
        },
      };
    } catch {
      return {
        valid: false,
        message: 'Failed to validate backup file.',
      };
    }
  },

  /**
   * Get backup history (from localStorage for demo)
   */
  getBackupHistory: (): BackupData[] => {
    try {
      const history = localStorage.getItem('spa-backup-history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  },

  /**
   * Save backup to history
   */
  saveBackupToHistory: (backup: BackupData): void => {
    try {
      const history = backupService.getBackupHistory();
      history.unshift(backup);
      
      // Keep only last 10 backups
      const limitedHistory = history.slice(0, 10);
      localStorage.setItem('spa-backup-history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Failed to save backup to history:', error);
    }
  },

  /**
   * Clear backup history
   */
  clearBackupHistory: (): void => {
    localStorage.removeItem('spa-backup-history');
  },
};
