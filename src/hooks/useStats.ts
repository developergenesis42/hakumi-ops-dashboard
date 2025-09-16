import { useState, useEffect, useCallback } from 'react';
import { StatsService } from '@/services/statsService';
import type { MonthlyStats, StatsOverview } from '@/types/stats';

export function useStats() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statsOverview, setStatsOverview] = useState<StatsOverview | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);

  const loadStatsOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const overview = await StatsService.getStatsOverview();
      setStatsOverview(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats overview');
      console.error('Error loading stats overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMonthlyStats = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const stats = await StatsService.getMonthlyStats(year, month);
      setMonthlyStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monthly stats');
      console.error('Error loading monthly stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshStats = useCallback(() => {
    if (statsOverview) {
      loadStatsOverview();
    }
    if (monthlyStats) {
      const date = new Date(monthlyStats.month + '-01');
      loadMonthlyStats(date.getFullYear(), date.getMonth() + 1);
    }
  }, [statsOverview, monthlyStats, loadStatsOverview, loadMonthlyStats]);

  // Auto-load current month stats on mount
  useEffect(() => {
    const now = new Date();
    loadMonthlyStats(now.getFullYear(), now.getMonth() + 1);
  }, [loadMonthlyStats]);

  return {
    loading,
    error,
    statsOverview,
    monthlyStats,
    loadStatsOverview,
    loadMonthlyStats,
    refreshStats,
  };
}

export function useMonthlyStats(year: number, month: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MonthlyStats | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const monthlyStats = await StatsService.getMonthlyStats(year, month);
      setStats(monthlyStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monthly stats');
      console.error('Error loading monthly stats:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    loading,
    error,
    stats,
    refresh: loadStats,
  };
}
