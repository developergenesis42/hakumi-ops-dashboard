/**
 * Rate Limit Monitor Component
 * Provides real-time monitoring and management of rate limiting
 */

import React, { useState, useEffect, useCallback } from 'react';
import { rateLimiterManager } from '@/features/services/rateLimiterService';
import { abuseProtection } from '@/features/services/abuseProtectionService';
import { useRateLimitMonitor } from '@/features/hooks/useRateLimit';
import { logger } from '@/features/utils/logger';

interface RateLimitMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'manager' | 'staff';
}

interface RateLimitStatus {
  name: string;
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  algorithm: string;
  windowMs: number;
  maxRequests: number;
}

interface AbuseStats {
  totalEvents: number;
  blockedCount: number;
  bannedCount: number;
  eventsByType: Record<string, number>;
}

export const RateLimitMonitor: React.FC<RateLimitMonitorProps> = ({
  isOpen,
  onClose,
  userRole = 'staff'
}) => {
  const [rateLimitStatuses, setRateLimitStatuses] = useState<RateLimitStatus[]>([]);
  const [abuseStats, setAbuseStats] = useState<AbuseStats | null>(null);
  // Limiter selection functionality can be added here in the future
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { resetAllLimits } = useRateLimitMonitor();

  // Refresh rate limit statuses
  const refreshRateLimits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const allStatuses = rateLimiterManager.getStatusAll('current-user');
      const statusArray: RateLimitStatus[] = [];
      
      for (const [name, status] of Object.entries(allStatuses)) {
        if (status) {
          statusArray.push({
            name,
            allowed: status.allowed,
            remaining: status.remaining,
            resetTime: status.resetTime,
            retryAfter: status.retryAfter,
            algorithm: 'Unknown', // Would need to get from config
            windowMs: 60000, // Would need to get from config
            maxRequests: status.remaining + (status.allowed ? 0 : 1)
          });
        }
      }
      
      setRateLimitStatuses(statusArray);
      
      // Get abuse protection stats
      const stats = abuseProtection.getAbuseStats();
      setAbuseStats(stats);
      
      logger.info('Rate limit statuses refreshed', { count: statusArray.length });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh rate limits';
      setError(errorMessage);
      logger.error('Failed to refresh rate limits', { error: err });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reset specific rate limiter
  const resetRateLimiter = useCallback(async (limiterName: string) => {
    try {
      rateLimiterManager.reset(limiterName, 'current-user');
      await refreshRateLimits();
      logger.info('Rate limiter reset', { limiterName });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset rate limiter';
      setError(errorMessage);
      logger.error('Failed to reset rate limiter', { limiterName, error: err });
    }
  }, [refreshRateLimits]);

  // Reset all rate limiters
  const resetAllRateLimiters = useCallback(async () => {
    try {
      resetAllLimits();
      await refreshRateLimits();
      logger.info('All rate limiters reset');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset all rate limiters';
      setError(errorMessage);
      logger.error('Failed to reset all rate limiters', { error: err });
    }
  }, [resetAllLimits, refreshRateLimits]);

  // Reset abuse protection
  const resetAbuseProtection = useCallback(() => {
    try {
      abuseProtection.resetProtection();
      setAbuseStats(abuseProtection.getAbuseStats());
      logger.info('Abuse protection reset');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset abuse protection';
      setError(errorMessage);
      logger.error('Failed to reset abuse protection', { error: err });
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      refreshRateLimits();
    }
  }, [isOpen, refreshRateLimits]);

  // Auto-refresh
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    
    const interval = setInterval(refreshRateLimits, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, refreshRateLimits]);

  // Format time remaining
  const formatTimeRemaining = (timestamp: number): string => {
    const now = Date.now();
    const remaining = Math.max(0, timestamp - now);
    
    if (remaining === 0) return 'Ready';
    
    const seconds = Math.ceil(remaining / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Get status color
  const getStatusColor = (remaining: number, maxRequests: number): string => {
    const percentage = (remaining / maxRequests) * 100;
    
    if (percentage > 50) return 'text-green-600';
    if (percentage > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Check if user can manage rate limits
  const canManageRateLimits = userRole === 'admin' || userRole === 'manager';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Rate Limiting Monitor
          </h2>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rate Limiting Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Rate Limiting Status</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={refreshRateLimits}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                  {canManageRateLimits && (
                    <button
                      onClick={resetAllRateLimiters}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reset All
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {rateLimitStatuses.map((status) => (
                  <div
                    key={status.name}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {status.name.replace(/_/g, ' ')}
                      </h4>
                      {canManageRateLimits && (
                        <button
                          onClick={() => resetRateLimiter(status.name)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Remaining:</span>
                        <span className={`ml-2 font-medium ${getStatusColor(status.remaining, status.maxRequests)}`}>
                          {status.remaining} / {status.maxRequests}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reset in:</span>
                        <span className="ml-2 font-medium">
                          {formatTimeRemaining(status.resetTime)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            status.remaining / status.maxRequests > 0.5
                              ? 'bg-green-500'
                              : status.remaining / status.maxRequests > 0.2
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{
                            width: `${(status.remaining / status.maxRequests) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Abuse Protection Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Abuse Protection</h3>
                {canManageRateLimits && (
                  <button
                    onClick={resetAbuseProtection}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reset Protection
                  </button>
                )}
              </div>

              {abuseStats && (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {abuseStats.totalEvents}
                      </div>
                      <div className="text-sm text-blue-800">Total Events</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {abuseStats.blockedCount}
                      </div>
                      <div className="text-sm text-yellow-800">Blocked</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {abuseStats.bannedCount}
                      </div>
                      <div className="text-sm text-red-800">Banned</div>
                    </div>
                  </div>

                  {/* Events by Type */}
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Events by Type</h4>
                    <div className="space-y-2">
                      {Object.entries(abuseStats.eventsByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Information */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">System Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">User Role:</span>
                <span className="ml-2 font-medium capitalize">{userRole}</span>
              </div>
              <div>
                <span className="text-gray-600">Management Access:</span>
                <span className="ml-2 font-medium">
                  {canManageRateLimits ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Environment:</span>
                <span className="ml-2 font-medium">
                  {import.meta.env.VITE_APP_ENV || 'development'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>
                <span className="ml-2 font-medium">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitMonitor;
