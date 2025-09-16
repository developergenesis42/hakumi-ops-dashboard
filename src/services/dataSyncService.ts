import { debugLog } from '@/config/environment';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflicts: ConflictItem[];
  errors: string[];
}

export interface ConflictItem {
  id: string;
  localData: unknown;
  remoteData: unknown;
  conflictType: 'update' | 'delete' | 'create';
  timestamp: Date;
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: unknown;
  timestamp: Date;
  retryCount: number;
}

export class DataSyncService {
  private syncQueue = new Map<string, SyncOperation>();
  private syncInProgress = false;
  private isOnline = true;
  private lastSyncTime: Date | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private conflictResolvers = new Map<string, (local: unknown, remote: unknown) => unknown>();

  constructor() {
    this.setupOnlineStatusListener();
    this.setupPeriodicSync();
  }

  /**
   * Add item to sync queue
   */
  addToSyncQueue(key: string, data: unknown, operation: 'create' | 'update' | 'delete' = 'update'): void {
    const syncItem: SyncOperation = {
      id: key,
      type: operation,
      table: this.extractTableFromKey(key),
      data,
      timestamp: new Date(),
      retryCount: 0
    };

    this.syncQueue.set(key, syncItem);
    debugLog('DataSyncService: Added item to sync queue:', key);
  }

  /**
   * Process all pending sync operations
   */
  async processSyncQueue(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.size === 0) {
      return {
        success: true,
        syncedItems: 0,
        conflicts: [],
        errors: []
      };
    }

    this.syncInProgress = true;
    const errors: string[] = [];
    const conflicts: ConflictItem[] = [];
    let syncedItems = 0;

    try {
      debugLog('DataSyncService: Processing sync queue:', this.syncQueue.size, 'items');

      for (const [key, syncItem] of this.syncQueue) {
        try {
          const result = await this.syncItem(syncItem);
          if (result.success) {
            syncedItems++;
            this.syncQueue.delete(key);
          } else if (result.conflict) {
            conflicts.push(result.conflict);
          } else {
            errors.push(result.error || 'Unknown sync error');
            syncItem.retryCount++;
            
            // Remove from queue after 3 failed attempts
            if (syncItem.retryCount >= 3) {
              this.syncQueue.delete(key);
              errors.push(`Max retries exceeded for ${key}`);
            }
          }
        } catch (error) {
          const errorMsg = `Failed to sync ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          debugLog('DataSyncService: Sync error:', errorMsg);
        }
      }

      // Update last sync time
      this.lastSyncTime = new Date();
      localStorage.setItem('lastSyncTime', this.lastSyncTime.toISOString());

      return {
        success: errors.length === 0,
        syncedItems,
        conflicts,
        errors
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Set up real-time synchronization for a table
   */
  setupRealtimeSync(tableName: string, onUpdate: (data: unknown) => void): () => void {
    debugLog(`DataSyncService: Setting up real-time sync for ${tableName}`);
    
    // This would integrate with Supabase real-time
    // For now, we'll simulate the setup
    const cleanup = () => {
      debugLog(`DataSyncService: Cleaning up real-time sync for ${tableName}`);
    };

    // Store the callback for potential future use
    void onUpdate;

    return cleanup;
  }

  /**
   * Register conflict resolver for a table
   */
  registerConflictResolver(tableName: string, resolver: (local: unknown, remote: unknown) => unknown): void {
    this.conflictResolvers.set(tableName, resolver);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    queueSize: number;
    lastSyncTime: Date | null;
    isProcessing: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queueSize: this.syncQueue.size,
      lastSyncTime: this.lastSyncTime,
      isProcessing: this.syncInProgress
    };
  }

  /**
   * Force sync all pending items
   */
  async forceSync(): Promise<SyncResult> {
    debugLog('DataSyncService: Force syncing all pending items');
    return this.processSyncQueue();
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue.clear();
    debugLog('DataSyncService: Cleared sync queue');
  }

  private async syncItem(syncItem: SyncOperation): Promise<{
    success: boolean;
    conflict?: ConflictItem;
    error?: string;
  }> {
    try {
      // Simulate sync operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check for conflicts (simplified)
      const hasConflict = Math.random() < 0.1; // 10% chance of conflict for demo
      
      if (hasConflict) {
        const conflict: ConflictItem = {
          id: syncItem.id,
          localData: syncItem.data,
          remoteData: { 
            ...(typeof syncItem.data === 'object' && syncItem.data !== null ? syncItem.data as Record<string, unknown> : {}), 
            updatedAt: new Date() 
          },
          conflictType: syncItem.type,
          timestamp: new Date()
        };
        
        return { success: false, conflict };
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractTableFromKey(key: string): string {
    // Extract table name from key (e.g., "sessions_123" -> "sessions")
    const parts = key.split('_');
    return parts[0];
  }

  private setupOnlineStatusListener(): void {
    const updateOnlineStatus = () => {
      this.isOnline = navigator.onLine;
      debugLog('DataSyncService: Online status changed:', this.isOnline);
      
      if (this.isOnline && this.syncQueue.size > 0) {
        // Process sync queue when coming back online
        this.processSyncQueue();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  private setupPeriodicSync(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.size > 0) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.syncQueue.clear();
  }
}

// Singleton instance
export const dataSyncService = new DataSyncService();