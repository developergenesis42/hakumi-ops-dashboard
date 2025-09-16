import type { AppState, AppAction } from '@/types';
import { debugLog } from '@/config/environment';

// Extended action type with performance tracking properties
type PerformanceTrackedAction = AppAction & {
  __perfStartTime?: number;
  __memoryBefore?: number;
  __memoryAfter?: number;
};

export interface PerformanceMetrics {
  actionType: string;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  callCount: number;
  lastCall: Date;
}

export interface PerformanceConfig {
  enabled: boolean;
  slowActionThreshold: number; // ms
  trackMemoryUsage: boolean;
  trackRerenderCount: boolean;
  maxMetricsHistory: number;
}

export class PerformanceMiddleware {
  private config: PerformanceConfig;
  private metrics = new Map<string, PerformanceMetrics>();
  private actionTimings: Array<{ action: string; duration: number; timestamp: Date }> = [];
  private rerenderCount = 0;
  private lastStateRef: AppState | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: true,
      slowActionThreshold: 16, // 16ms for 60fps
      trackMemoryUsage: false,
      trackRerenderCount: true,
      maxMetricsHistory: 1000,
      ...config
    };
  }

  /**
   * Before middleware - start performance tracking
   */
  before(_state: AppState, action: AppAction): AppState | null {
    if (!this.config.enabled) return null;

    const startTime = performance.now();
    const trackedAction = action as PerformanceTrackedAction;
    trackedAction.__perfStartTime = startTime;

    // Track memory usage if enabled
    if (this.config.trackMemoryUsage && 'memory' in performance) {
      trackedAction.__memoryBefore = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
    }

    return null;
  }

  /**
   * After middleware - record performance metrics
   */
  after(state: AppState, action: AppAction): AppState | null {
    if (!this.config.enabled) return null;

    const endTime = performance.now();
    const trackedAction = action as PerformanceTrackedAction;
    const startTime = trackedAction.__perfStartTime || endTime;
    const duration = endTime - startTime;

    // Record timing
    this.recordActionTiming(action.type, duration);

    // Check for slow actions
    if (duration > this.config.slowActionThreshold) {
      this.reportSlowAction(action.type, duration);
    }

    // Track memory usage
    if (this.config.trackMemoryUsage && 'memory' in performance) {
      const memoryAfter = (performance as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0;
      const memoryBefore = trackedAction.__memoryBefore || 0;
      const memoryDelta = memoryAfter - memoryBefore;
      
      if (Math.abs(memoryDelta) > 1024 * 1024) { // 1MB threshold
        debugLog(`🧠 Memory change: ${action.type} used ${(memoryDelta / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    // Track rerender count
    if (this.config.trackRerenderCount) {
      this.trackRerender(state);
    }

    return null;
  }

  /**
   * Get performance metrics for a specific action type
   */
  getMetrics(actionType: string): PerformanceMetrics | undefined {
    return this.metrics.get(actionType);
  }

  /**
   * Get all performance metrics
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalActions: number;
    averageDuration: number;
    slowestAction: { action: string; duration: number };
    fastestAction: { action: string; duration: number };
    slowActionsCount: number;
    rerenderCount: number;
  } {
    const allDurations = this.actionTimings.map(timing => timing.duration);
    const totalActions = allDurations.length;
    const averageDuration = totalActions > 0 ? allDurations.reduce((sum, duration) => sum + duration, 0) / totalActions : 0;
    
    const slowActionsCount = allDurations.filter(duration => duration > this.config.slowActionThreshold).length;
    
    const slowestTiming = this.actionTimings.reduce((slowest, timing) => 
      timing.duration > slowest.duration ? timing : slowest, 
      { action: 'none', duration: 0, timestamp: new Date() }
    );
    
    const fastestTiming = this.actionTimings.reduce((fastest, timing) => 
      timing.duration < fastest.duration ? timing : fastest, 
      { action: 'none', duration: Infinity, timestamp: new Date() }
    );

    return {
      totalActions,
      averageDuration,
      slowestAction: { action: slowestTiming.action, duration: slowestTiming.duration },
      fastestAction: { action: fastestTiming.action, duration: fastestTiming.duration },
      slowActionsCount,
      rerenderCount: this.rerenderCount
    };
  }

  /**
   * Get recent action timings
   */
  getRecentTimings(count: number = 50): Array<{ action: string; duration: number; timestamp: Date }> {
    return this.actionTimings.slice(-count);
  }

  /**
   * Clear all performance data
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.actionTimings = [];
    this.rerenderCount = 0;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage(): {
    used: number;
    total: number;
    limit: number;
  } | null {
    if (!this.config.trackMemoryUsage || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (!memory) {
      return null;
    }
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    };
  }

  private recordActionTiming(actionType: string, duration: number): void {
    const now = new Date();
    
    // Add to timing history
    this.actionTimings.push({
      action: actionType,
      duration,
      timestamp: now
    });

    // Keep only recent timings
    if (this.actionTimings.length > this.config.maxMetricsHistory) {
      this.actionTimings.shift();
    }

    // Update metrics
    const existingMetrics = this.metrics.get(actionType);
    if (existingMetrics) {
      const newCallCount = existingMetrics.callCount + 1;
      const newAverageDuration = (existingMetrics.averageDuration * existingMetrics.callCount + duration) / newCallCount;
      
      this.metrics.set(actionType, {
        actionType,
        averageDuration: newAverageDuration,
        minDuration: Math.min(existingMetrics.minDuration, duration),
        maxDuration: Math.max(existingMetrics.maxDuration, duration),
        callCount: newCallCount,
        lastCall: now
      });
    } else {
      this.metrics.set(actionType, {
        actionType,
        averageDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        callCount: 1,
        lastCall: now
      });
    }
  }

  private reportSlowAction(actionType: string, duration: number): void {
    debugLog(`🐌 Slow action detected: ${actionType} took ${duration.toFixed(2)}ms (threshold: ${this.config.slowActionThreshold}ms)`);
  }

  private trackRerender(state: AppState): void {
    if (this.lastStateRef === null) {
      this.lastStateRef = state;
      return;
    }

    // Simple rerender detection - compare state references
    if (this.lastStateRef !== state) {
      this.rerenderCount++;
      this.lastStateRef = state;
    }
  }
}

// Create default instance
export const performanceMiddleware = new PerformanceMiddleware({
  enabled: process.env.NODE_ENV === 'development',
  slowActionThreshold: 16,
  trackMemoryUsage: true,
  trackRerenderCount: true,
  maxMetricsHistory: 500
});
