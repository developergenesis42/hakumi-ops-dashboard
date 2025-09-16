import * as React from 'react';
const { memo } = React;
import type { Therapist } from '@/types';

interface RosterHeaderProps {
  todayRoster: Therapist[];
  totalTherapists: number;
  onAddAll: () => void;
  onClearAll: () => void;
  onShowHistory?: () => void;
  isClearing?: boolean;
  isAddingAll?: boolean;
}

/**
 * Enhanced header component for the roster setup page
 * Displays consolidated stats, quick actions, and navigation
 */
const RosterHeader = memo(function RosterHeader({ 
  todayRoster, 
  totalTherapists, 
  onAddAll, 
  onClearAll,
  onShowHistory,
  isClearing = false,
  isAddingAll = false
}: RosterHeaderProps) {
  const selectedCount = todayRoster.length;
  const availableCount = totalTherapists - selectedCount;

  return (
    <div className="mb-8 pt-4">
      {/* Main Header Row */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {/* Time/Date moved to floating component */}
        </div>
        
      </div>

      {/* Simplified Quick Actions */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          {/* Simple Status */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{selectedCount}</div>
              <div className="text-xs text-gray-300">Selected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{availableCount}</div>
              <div className="text-xs text-gray-300">Available</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            {onShowHistory && (
              <button
                onClick={onShowHistory}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                title="View roster history"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </button>
            )}
            
            <button
              onClick={onAddAll}
              disabled={availableCount === 0 || isAddingAll}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
              title="Add all available therapists"
            >
              {isAddingAll ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              {isAddingAll ? 'Adding...' : 'Add All'}
            </button>
            
            <button
              onClick={onClearAll}
              disabled={selectedCount === 0 || isClearing}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
              title="Clear all selected therapists"
            >
              {isClearing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              {isClearing ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default React.memo(RosterHeader);
