import React, { useState } from 'react';
import { useStats } from '@/hooks/useStats';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  className?: string;
}

function StatCard({ title, value, subtitle, trend, icon, className = '' }: StatCardProps) {
  const trendColor = trend !== undefined 
    ? trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
    : '';

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className={`mt-2 text-sm ${trendColor}`}>
          {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

interface MonthlySelectorProps {
  currentYear: number;
  currentMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

function MonthlySelector({ currentYear, currentMonth, onYearChange, onMonthChange }: MonthlySelectorProps) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePreviousMonth = () => {
    if (currentMonth === 1) {
      onYearChange(currentYear - 1);
      onMonthChange(12);
    } else {
      onMonthChange(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      onYearChange(currentYear + 1);
      onMonthChange(1);
    } else {
      onMonthChange(currentMonth + 1);
    }
  };

  return (
    <div className="flex items-center space-x-4 mb-6">
      <button
        onClick={handlePreviousMonth}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-semibold text-white">
          {months[currentMonth - 1]} {currentYear}
        </h2>
      </div>
      
      <button
        onClick={handleNextMonth}
        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export default function TotalStats() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  
  const { loading, error, monthlyStats, loadMonthlyStats } = useStats();

  // Load stats for selected month
  React.useEffect(() => {
    loadMonthlyStats(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, loadMonthlyStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-black flex font-mono-force">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-white text-xl">Loading stats...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-black flex font-mono-force">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-red-500 text-xl">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!monthlyStats) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-black flex font-mono-force">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-white text-xl">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-black flex font-mono-force">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Debug: Test spacing - hidden but maintains layout */}
          <div className="h-4 mb-4 invisible"></div>

        {/* Month Selector */}
        <MonthlySelector
          currentYear={selectedYear}
          currentMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Sessions"
            value={formatNumber(monthlyStats.totalSessions)}
            subtitle={`${monthlyStats.completedSessions} completed`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>}
          />
          
          <StatCard
            title="Total Revenue"
            value={formatCurrency(monthlyStats.totalRevenue)}
            subtitle={`${formatCurrency(monthlyStats.shopRevenue)} shop revenue`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>}
          />
          
          <StatCard
            title="Total Payouts"
            value={formatCurrency(monthlyStats.totalPayouts)}
            subtitle="Therapist earnings"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>}
          />
          
          <StatCard
            title="Walk Outs"
            value={formatNumber(monthlyStats.totalWalkOuts)}
            subtitle={`${((monthlyStats.totalWalkOuts / monthlyStats.totalSessions) * 100).toFixed(1)}% rate`}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>}
          />
        </div>

        {/* Service Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Service Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Single Sessions</span>
                <span className="text-white font-medium">{monthlyStats.serviceBreakdown.single}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Double Sessions</span>
                <span className="text-white font-medium">{monthlyStats.serviceBreakdown.double}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Couple Sessions</span>
                <span className="text-white font-medium">{monthlyStats.serviceBreakdown.couple}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Room Utilization</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Shower Rooms</span>
                <span className="text-white font-medium">{monthlyStats.roomUtilization.shower}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">VIP Jacuzzi</span>
                <span className="text-white font-medium">{monthlyStats.roomUtilization.vipJacuzzi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Large Showers</span>
                <span className="text-white font-medium">{monthlyStats.roomUtilization.doubleBedShower}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Large Showers</span>
                <span className="text-white font-medium">{monthlyStats.roomUtilization.singleBedShower}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Walkout Reasons */}
        {Object.keys(monthlyStats.walkOutReasons).length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Walkout Reasons</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(monthlyStats.walkOutReasons).map(([reason, count]) => (
                <div key={reason} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">{reason}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Therapist Performance */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Therapist Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{monthlyStats.therapistStats.totalTherapists}</p>
              <p className="text-gray-400">Total Therapists</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {monthlyStats.therapistStats.averageSessionsPerTherapist.toFixed(1)}
              </p>
              <p className="text-gray-400">Avg Sessions/Therapist</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{monthlyStats.therapistStats.topPerformer.name}</p>
              <p className="text-gray-400">
                Top Performer ({monthlyStats.therapistStats.topPerformer.sessions} sessions)
              </p>
            </div>
          </div>
        </div>

        {/* Daily Breakdown */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Date</th>
                  <th className="text-left py-2 text-gray-400">Day</th>
                  <th className="text-right py-2 text-gray-400">Sessions</th>
                  <th className="text-right py-2 text-gray-400">Revenue</th>
                  <th className="text-right py-2 text-gray-400">Payouts</th>
                  <th className="text-right py-2 text-gray-400">Walk Outs</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.dailyBreakdown.map((day) => (
                  <tr key={day.date} className="border-b border-gray-700">
                    <td className="py-2 text-gray-300">{day.date}</td>
                    <td className="py-2 text-gray-300">{day.dayOfWeek}</td>
                    <td className="py-2 text-right text-white">{day.totalSessions}</td>
                    <td className="py-2 text-right text-white">{formatCurrency(day.totalRevenue)}</td>
                    <td className="py-2 text-right text-white">{formatCurrency(day.totalPayouts)}</td>
                    <td className="py-2 text-right text-white">{day.walkOuts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
