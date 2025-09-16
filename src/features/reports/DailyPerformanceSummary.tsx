import { formatCurrency } from '@/utils/helpers';
import type { ClosingStats } from '@/hooks/useClosingStats';

interface DailyPerformanceSummaryProps {
  stats: ClosingStats;
}

export default function DailyPerformanceSummary({ stats }: DailyPerformanceSummaryProps) {
  // Calculate completion rates and trends (mock data for demonstration)
  const revenueTarget = 150000; // ฿150,000
  const sessionsTarget = 20;
  const revenueProgress = Math.min((stats.totalRevenue / revenueTarget) * 100, 100);
  const sessionsProgress = Math.min((stats.totalSlips / sessionsTarget) * 100, 100);
  
  // Mock trend indicators (in real app, these would come from historical data)
  const revenueTrend = stats.totalRevenue > 120000 ? 'up' : 'down'; // ฿120,000 threshold
  const sessionsTrend = stats.totalSlips > 15 ? 'up' : 'down';

  return (
    <div className="space-y-4">
      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-300">Revenue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${revenueTrend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {revenueTrend === 'up' ? '↗' : '↘'}
              </span>
            </div>
          </div>
          <div className="text-xl font-bold text-green-400 mb-2">{formatCurrency(stats.totalRevenue)}</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${revenueProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{revenueProgress.toFixed(0)}% of target</div>
        </div>

        {/* Sessions Card */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-300">Rooms</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${sessionsTrend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {sessionsTrend === 'up' ? '↗' : '↘'}
              </span>
            </div>
          </div>
          <div className="text-xl font-bold text-blue-400 mb-2">{stats.totalSlips}</div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-400 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${sessionsProgress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-400 mt-1">{sessionsProgress.toFixed(0)}% of target</div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-300 mb-1">Payouts</div>
          <div className="text-lg font-bold text-yellow-400">{formatCurrency(stats.totalAllPayouts)}</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-300 mb-1">Discounts</div>
          <div className="text-lg font-bold text-red-400">-{formatCurrency(stats.totalDiscounts)}</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-300 mb-1">Walk-Outs</div>
          <div className="text-lg font-bold text-orange-400">{stats.walkOutCount}</div>
        </div>
        
        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
          <div className="text-sm text-gray-300 mb-1">Shop Revenue</div>
          <div className="text-lg font-bold text-green-400">{formatCurrency(stats.shopRevenue)}</div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-700/30 rounded-lg p-4">
        <div className="text-sm font-medium text-gray-300 mb-3">Revenue Breakdown</div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Gross Shop Revenue</span>
            <span className="text-sm text-white">{formatCurrency(stats.grossShopRevenue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Lady Purchases</span>
            <span className="text-sm text-white">{formatCurrency(stats.totalExpenses)}</span>
          </div>
          <div className="border-t border-gray-600 pt-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">Total Shop Revenue</span>
            <span className="text-sm font-bold text-green-400">{formatCurrency(stats.shopRevenue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
