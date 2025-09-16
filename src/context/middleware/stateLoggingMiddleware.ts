import type { AppState, AppAction } from '@/types';
import { debugLog } from '@/config/environment';

// Extended action type with logging properties
type LoggingTrackedAction = AppAction & {
  payload?: unknown;
  __startTime?: number;
};

export interface StateLoggingConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logStateChanges: boolean;
  logActionDetails: boolean;
  logPerformance: boolean;
  maxLogEntries: number;
}

export class StateLoggingMiddleware {
  private config: StateLoggingConfig;
  private logEntries: Array<{
    timestamp: Date;
    action: AppAction;
    stateBefore: AppState;
    stateAfter: AppState;
    duration: number;
  }> = [];

  constructor(config: Partial<StateLoggingConfig> = {}) {
    this.config = {
      enabled: true,
      logLevel: 'debug',
      logStateChanges: true,
      logActionDetails: true,
      logPerformance: true,
      maxLogEntries: 100,
      ...config
    };
  }

  /**
   * Before middleware - log action details
   */
  before(_state: AppState, action: AppAction): AppState | null {
    if (!this.config.enabled) return null;

    const startTime = performance.now();
    
    if (this.config.logActionDetails) {
      const trackedAction = action as LoggingTrackedAction;
      debugLog(`🔄 Action: ${action.type}`, {
        payload: trackedAction.payload,
        timestamp: new Date().toISOString()
      });
    }

    // Store start time for performance measurement
    const trackedAction = action as LoggingTrackedAction;
    trackedAction.__startTime = startTime;

    return null;
  }

  /**
   * After middleware - log state changes and performance
   */
  after(state: AppState, action: AppAction): AppState | null {
    if (!this.config.enabled) return null;

    const endTime = performance.now();
    const trackedAction = action as LoggingTrackedAction;
    const startTime = trackedAction.__startTime || endTime;
    const duration = endTime - startTime;

    if (this.config.logStateChanges) {
      this.logStateChange(state, action, duration);
    }

    if (this.config.logPerformance && duration > 10) {
      debugLog(`⚠️ Slow state update: ${action.type} took ${duration.toFixed(2)}ms`);
    }

    return null;
  }

  /**
   * Get recent log entries
   */
  getRecentLogs(count: number = 10): Array<{
    timestamp: Date;
    action: AppAction;
    stateBefore: AppState;
    stateAfter: AppState;
    duration: number;
  }> {
    return this.logEntries.slice(-count);
  }

  /**
   * Clear log entries
   */
  clearLogs(): void {
    this.logEntries = [];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StateLoggingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    totalActions: number;
    averageDuration: number;
    slowestAction: { action: string; duration: number };
    fastestAction: { action: string; duration: number };
  } {
    if (this.logEntries.length === 0) {
      return {
        totalActions: 0,
        averageDuration: 0,
        slowestAction: { action: 'none', duration: 0 },
        fastestAction: { action: 'none', duration: 0 }
      };
    }

    const durations = this.logEntries.map(entry => entry.duration);
    const averageDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    
    const slowestEntry = this.logEntries.reduce((slowest, entry) => 
      entry.duration > slowest.duration ? entry : slowest
    );
    
    const fastestEntry = this.logEntries.reduce((fastest, entry) => 
      entry.duration < fastest.duration ? entry : fastest
    );

    return {
      totalActions: this.logEntries.length,
      averageDuration,
      slowestAction: { action: slowestEntry.action.type, duration: slowestEntry.duration },
      fastestAction: { action: fastestEntry.action.type, duration: fastestEntry.duration }
    };
  }

  private logStateChange(state: AppState, action: AppAction, duration: number): void {
    // Create a snapshot of the current state for logging
    const stateSnapshot = this.createStateSnapshot(state);
    
    // Add to log entries
    this.logEntries.push({
      timestamp: new Date(),
      action,
      stateBefore: stateSnapshot, // This would be the previous state
      stateAfter: stateSnapshot,
      duration
    });

    // Keep only the most recent entries
    if (this.logEntries.length > this.config.maxLogEntries) {
      this.logEntries.shift();
    }

    // Log state change details
    if (this.config.logLevel === 'debug') {
      debugLog(`📊 State updated by ${action.type}`, {
        duration: `${duration.toFixed(2)}ms`,
        sessionsCount: state.sessions.length,
        therapistsCount: state.therapists.length,
        todayRosterCount: state.todayRoster.length,
        roomsCount: state.rooms.length,
        walkOutsCount: state.walkOuts.length
      });
    }
  }

  private createStateSnapshot(state: AppState): AppState {
    // Create a deep copy of the state for logging
    return JSON.parse(JSON.stringify(state));
  }
}

// Create default instance
export const stateLoggingMiddleware = new StateLoggingMiddleware({
  enabled: process.env.NODE_ENV === 'development',
  logLevel: 'debug',
  logStateChanges: true,
  logActionDetails: true,
  logPerformance: true,
  maxLogEntries: 50
});
