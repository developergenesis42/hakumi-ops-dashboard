import { debugLog } from '@/config/environment';
import type { DailyStats } from '@/types';

const COMPLETED_SESSIONS_KEY = 'spa-completed-sessions';

/**
 * Save completed sessions count to localStorage
 */
export function saveCompletedSessionsToLocalStorage(completedSessions: number): void {
  try {
    const today = new Date().toDateString();
    const key = `${COMPLETED_SESSIONS_KEY}_${today}`;
    localStorage.setItem(key, completedSessions.toString());
    debugLog('Saved completed sessions to localStorage:', completedSessions);
  } catch (error) {
    console.warn('Failed to save completed sessions to localStorage:', error);
  }
}

/**
 * Load completed sessions count from localStorage
 */
export function loadCompletedSessionsFromLocalStorage(): number {
  try {
    const today = new Date().toDateString();
    const key = `${COMPLETED_SESSIONS_KEY}_${today}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const count = parseInt(stored, 10);
      debugLog('Loaded completed sessions from localStorage:', count);
      return isNaN(count) ? 0 : count;
    }
    return 0;
  } catch (error) {
    console.warn('Failed to load completed sessions from localStorage:', error);
    return 0;
  }
}

/**
 * Save daily stats to localStorage (including completedSessions)
 */
export function saveDailyStatsToLocalStorage(dailyStats: DailyStats): void {
  try {
    const today = new Date().toDateString();
    const key = `spa-daily-stats_${today}`;
    localStorage.setItem(key, JSON.stringify(dailyStats));
    debugLog('Saved daily stats to localStorage:', dailyStats);
  } catch (error) {
    console.warn('Failed to save daily stats to localStorage:', error);
  }
}

/**
 * Load daily stats from localStorage (including completedSessions)
 */
export function loadDailyStatsFromLocalStorage(): DailyStats | null {
  try {
    const today = new Date().toDateString();
    const key = `spa-daily-stats_${today}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const stats = JSON.parse(stored);
      debugLog('Loaded daily stats from localStorage:', stats);
      return stats;
    }
    return null;
  } catch (error) {
    console.warn('Failed to load daily stats from localStorage:', error);
    return null;
  }
}

/**
 * Clear completed sessions data for a specific date
 */
export function clearCompletedSessionsForDate(date: string): void {
  try {
    const key = `${COMPLETED_SESSIONS_KEY}_${date}`;
    localStorage.removeItem(key);
    debugLog('Cleared completed sessions for date:', date);
  } catch (error) {
    console.warn('Failed to clear completed sessions for date:', error);
  }
}

/**
 * Clear all completed sessions data
 */
export function clearAllCompletedSessionsData(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(COMPLETED_SESSIONS_KEY)) {
        localStorage.removeItem(key);
      }
    });
    debugLog('Cleared all completed sessions data from localStorage');
  } catch (error) {
    console.warn('Failed to clear completed sessions data:', error);
  }
}
