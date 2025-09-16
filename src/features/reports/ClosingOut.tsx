import { useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { useUndoWithWarning } from '@/hooks/useUndoWithWarning';
import { useAttendance } from '@/hooks/useAttendance';
import { useClosingStats } from '@/hooks/useClosingStats';
import { useClosingSessionManagement } from '@/hooks/useClosingSessionManagement';
import { WalkOutTable } from '@/shared/components/LazyComponents';
import { UndoWarningModal } from '@/shared/components/LazyComponents';
import EditSessionModal from '@/shared/components/modals/EditSessionModal';
import FeatureErrorBoundary from '@/components/FeatureErrorBoundary';
import DailyPerformanceSummary from '@/features/reports/DailyPerformanceSummary';
import WorkingHoursSummary from '@/features/reports/WorkingHoursSummary';
import DailyExpensesBreakdown from '@/features/reports/DailyExpensesBreakdown';
import SessionHistory from '@/features/reports/SessionHistory';
import ActiveSessionsWarning from '@/features/reports/ActiveSessionsWarning';
import ClosingStatsSection from '@/features/reports/ClosingStatsSection';

export default function ClosingOut() {
  const { state } = useApp();
  const { canUndo, lastActionModifiesDatabase, lastActionDescription, handleUndo, isWarningModalOpen, handleCloseWarning, handleConfirmUndo } = useUndoWithWarning();
  
  const { todayAttendance, exportData, retrySyncs } = useAttendance();
  const stats = useClosingStats();
  const {
    activeSessions,
    remainingTherapists,
    editingSession,
    setEditingSession,
    handleEditSession,
    handleReprintSession,
    handleUpdateSession,
    handleDepartAll,
    handleResetDay
  } = useClosingSessionManagement();

  // State for collapsible sections
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Helper function for export data
  const handleExportData = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-[calc(100vh-6rem)] bg-black flex font-mono-force">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8 pt-4">
          <div className="flex justify-between items-center mb-6">
            <div>
              {/* Time/Date moved to floating component */}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className={`w-12 h-12 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                  lastActionModifiesDatabase 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title={lastActionModifiesDatabase ? "Undo last action (affects database)" : "Undo last action"}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Key Financial Metrics - Priority 1 */}
        <div className="bg-slate-800/60 rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-lg">
          <FeatureErrorBoundary featureName="Closing Stats Section">
            <ClosingStatsSection stats={stats} />
          </FeatureErrorBoundary>
        </div>

        {/* Session Overview - Priority 2 */}
        <div className="bg-slate-800/60 rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Room Overview</h3>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                Completed: {stats.totalSlips - activeSessions.length}
              </span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                Active: {activeSessions.length}
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${Math.min(((stats.totalSlips - activeSessions.length) / Math.max(stats.totalSlips, 1)) * 100, 100)}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-400">
                {Math.round(((stats.totalSlips - activeSessions.length) / Math.max(stats.totalSlips, 1)) * 100)}% Complete
              </span>
              <span className="text-sm text-slate-400">
                {stats.totalSlips - activeSessions.length} of {stats.totalSlips} rooms
              </span>
            </div>
          </div>
        </div>

        {/* Therapist Status Overview - Priority 3 */}
        <div className="bg-slate-800/60 rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-200">Remaining Therapists ({remainingTherapists.length})</h3>
            <button
              onClick={() => handleDepartAll(stats.remainingPayouts)}
              disabled={remainingTherapists.length === 0 || activeSessions.length > 0}
              className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Depart All
            </button>
          </div>
          
          {/* Therapist List */}
          <div className="flex flex-wrap gap-2">
            {remainingTherapists.length === 0 ? (
              <div className="text-slate-400 text-sm italic">All therapists have left work</div>
            ) : (
              remainingTherapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-xs">
                      {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <span className="text-slate-200 text-sm font-medium">{therapist.name}</span>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                    Available
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Therapist Payout Breakdown */}
        <div className="bg-slate-800/60 rounded-2xl p-6 mb-6 border border-slate-700/50 shadow-lg">
          <FeatureErrorBoundary featureName="Therapist Payout Breakdown">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Therapist Payout Breakdown</h3>
            <div className="space-y-3">
              {state.todayRoster.map((therapist) => {
                const totalExpenses = (therapist.expenses || []).reduce((sum, expense) => sum + expense.amount, 0);
                const individualPayout = Math.max(0, (therapist.totalEarnings || 0) - totalExpenses);
                const sessionPayouts = state.sessions
                  .filter(session => session.therapistIds.includes(therapist.id))
                  .reduce((sum, session) => sum + session.service.ladyPayout, 0);
                
                return (
                  <div key={therapist.id} className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-200">{therapist.name}</div>
                        <div className="text-sm text-slate-400">
                          {state.sessions.filter(s => s.therapistIds.includes(therapist.id)).length} sessions
                          {totalExpenses > 0 && (
                            <span className="text-red-400 ml-2">-฿{totalExpenses.toLocaleString()} expenses</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Session Payouts</div>
                      <div className="font-semibold text-amber-400">฿{sessionPayouts.toLocaleString()}</div>
                      <div className="text-sm text-slate-400">Individual Payout</div>
                      <div className="font-bold text-purple-400">฿{individualPayout.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary Row */}
              <div className="border-t border-slate-600 pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-200">Total Session Payouts:</span>
                  <span className="text-xl font-bold text-amber-400">฿{stats.totalPayouts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-slate-200">Total Individual Payouts:</span>
                  <span className="text-xl font-bold text-purple-400">฿{stats.totalAllPayouts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-slate-400">Difference (Expenses):</span>
                  <span className="text-sm font-medium text-red-400">
                    -฿{(stats.totalPayouts - stats.totalAllPayouts).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </FeatureErrorBoundary>
        </div>

        {/* Detailed Breakdown - Collapsible */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/50 shadow-lg mb-6">
          <button
            onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-700/30 transition-colors rounded-t-2xl"
          >
            <h3 className="text-lg font-semibold text-slate-200">Detailed Breakdown</h3>
            <svg 
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${showDetailedBreakdown ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDetailedBreakdown && (
            <div className="p-6 pt-0 space-y-6">
              {/* Performance Summary */}
              <div>
                <h4 className="text-md font-medium text-slate-300 mb-4">Performance Summary</h4>
                <FeatureErrorBoundary featureName="Daily Performance Summary">
                  <DailyPerformanceSummary stats={stats} />
                </FeatureErrorBoundary>
              </div>

              {/* Working Hours */}
              <div>
                <h4 className="text-md font-medium text-slate-300 mb-4">Working Hours</h4>
                <FeatureErrorBoundary featureName="Working Hours Summary">
                  <WorkingHoursSummary 
                    todayAttendance={todayAttendance}
                    todayRoster={state.todayRoster}
                    onRetrySyncs={retrySyncs}
                    onExportData={handleExportData}
                  />
                </FeatureErrorBoundary>
              </div>

              {/* Expenses */}
              <div>
                <h4 className="text-md font-medium text-slate-300 mb-4">Daily Expenses</h4>
                <FeatureErrorBoundary featureName="Daily Expenses Breakdown">
                  <DailyExpensesBreakdown 
                    todayRoster={state.todayRoster}
                    totalExpenses={stats.totalExpenses}
                  />
                </FeatureErrorBoundary>
              </div>

              {/* Session History */}
              <div>
                <h4 className="text-md font-medium text-slate-300 mb-4">Session History</h4>
                <FeatureErrorBoundary featureName="Session History">
                  <SessionHistory 
                    sessions={state.sessions}
                    todayRoster={state.todayRoster}
                    rooms={state.rooms}
                    onEditSession={handleEditSession}
                    onReprintSession={handleReprintSession}
                  />
                </FeatureErrorBoundary>
              </div>

              {/* Walk-Out History */}
              <div>
                <h4 className="text-md font-medium text-slate-300 mb-4">Walk-Out History</h4>
                <FeatureErrorBoundary featureName="Walk-Out Table">
                  <WalkOutTable />
                </FeatureErrorBoundary>
              </div>
            </div>
          )}
        </div>

        {/* Active Sessions Warning */}
        <FeatureErrorBoundary featureName="Active Sessions Warning">
          <ActiveSessionsWarning 
            activeSessions={activeSessions}
            todayRoster={state.todayRoster}
            rooms={state.rooms}
          />
        </FeatureErrorBoundary>

        {/* Export/Reset Actions - Priority 5 */}
        <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-3">
          <button
              onClick={handleResetDay}
              className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
              Reset Day
          </button>
          
          <button
              onClick={handleExportData}
              className="px-6 py-3 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
              Export Data
          </button>
        </div>
        </div>
      </div>
      
      {/* Undo Warning Modal */}
      <FeatureErrorBoundary featureName="Undo Warning Modal">
        <UndoWarningModal
          isOpen={isWarningModalOpen}
          onClose={handleCloseWarning}
          onConfirm={handleConfirmUndo}
          actionDescription={lastActionDescription}
        />
      </FeatureErrorBoundary>

      {/* Edit Session Modal */}
      <FeatureErrorBoundary featureName="Edit Session Modal">
        <EditSessionModal
          isOpen={editingSession !== null}
          onClose={() => setEditingSession(null)}
          session={editingSession}
          services={state.services}
          rooms={state.rooms}
          therapists={state.todayRoster}
          onUpdate={handleUpdateSession}
        />
      </FeatureErrorBoundary>
    </div>
  );
}
