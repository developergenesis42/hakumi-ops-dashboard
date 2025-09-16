/**
 * Closing Stats Section Component
 * Displays the main statistics cards for closing out
 */

import React from 'react';
import type { ClosingStats } from '@/hooks/useClosingStats';

interface ClosingStatsSectionProps {
  stats: ClosingStats;
}

const ClosingStatsSection: React.FC<ClosingStatsSectionProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Revenue */}
      <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 rounded-xl p-4 border border-emerald-500/20 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-300">Revenue</span>
        </div>
        <div className="text-2xl font-bold text-emerald-400 mb-1">฿{stats.totalRevenue.toLocaleString()}</div>
        <div className="text-xs text-slate-400">Target: ฿200,000</div>
      </div>

      {/* Sessions */}
      <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/10 rounded-xl p-4 border border-blue-500/20 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-300">Rooms</span>
        </div>
        <div className="text-2xl font-bold text-blue-400 mb-1">{stats.totalSlips}/50</div>
        <div className="text-xs text-slate-400">Target: 50 rooms</div>
      </div>

      {/* Session Payouts */}
      <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/10 rounded-xl p-4 border border-amber-500/20 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-300">Session Payouts</span>
        </div>
        <div className="text-2xl font-bold text-amber-400 mb-1">฿{stats.totalPayouts.toLocaleString()}</div>
        <div className="text-xs text-slate-400">Target: ฿60,000</div>
      </div>

      {/* Individual Payouts */}
      <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/10 rounded-xl p-4 border border-purple-500/20 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-300">Individual Payouts</span>
        </div>
        <div className="text-2xl font-bold text-purple-400 mb-1">฿{stats.totalAllPayouts.toLocaleString()}</div>
        <div className="text-xs text-slate-400">After expenses</div>
      </div>
    </div>
  );
};

export default ClosingStatsSection;
