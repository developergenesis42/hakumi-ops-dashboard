import { memo, useState, useCallback } from 'react';
import type { Therapist } from '@/types';
import { debugLog } from '@/config/environment';


interface RosterListProps {
  todayRoster: Therapist[];
  onRemoveTherapist: (therapistId: string) => void;
  onBulkRemove?: (therapistIds: string[]) => void;
  enableBulkSelection?: boolean;
}

/**
 * List component displaying selected therapists for today's roster
 * Handles empty state and therapist removal functionality
 */
const RosterList = memo(function RosterList({ 
  todayRoster, 
  onRemoveTherapist, 
  onBulkRemove,
  enableBulkSelection = true
}: RosterListProps) {
  const [selectedTherapists, setSelectedTherapists] = useState<Set<string>>(new Set());
  const [isBulkMode, setIsBulkMode] = useState(false);


  // Bulk selection handlers
  const handleSelectTherapist = useCallback((therapistId: string, selected: boolean) => {
    setSelectedTherapists(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(therapistId);
      } else {
        newSet.delete(therapistId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTherapists.size === todayRoster.length) {
      setSelectedTherapists(new Set());
    } else {
      setSelectedTherapists(new Set(todayRoster.map(t => t.id)));
    }
  }, [selectedTherapists.size, todayRoster]);

  const handleBulkRemove = useCallback(() => {
    if (selectedTherapists.size === 0 || !onBulkRemove) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedTherapists.size} therapist${selectedTherapists.size !== 1 ? 's' : ''} from the roster?`
    );
    
    if (confirmed) {
      onBulkRemove(Array.from(selectedTherapists));
      setSelectedTherapists(new Set());
      setIsBulkMode(false);
    }
  }, [selectedTherapists, onBulkRemove]);

  const toggleBulkMode = useCallback(() => {
    setIsBulkMode(prev => {
      if (prev) {
        setSelectedTherapists(new Set());
      }
      return !prev;
    });
  }, []);
  if (todayRoster.length === 0) {
    return (
      <div className="h-96 overflow-y-auto bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-6 border border-gray-600">
        <div className="text-center py-12">
          {/* Enhanced Empty State Visual */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            {/* Floating animation elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          </div>
          
          {/* Enhanced Empty State Content */}
          <h3 className="text-xl font-semibold text-white mb-2">Ready to Build Your Team?</h3>
          <p className="text-gray-300 text-sm mb-4 max-w-md mx-auto">
            No therapists have been added to today's roster yet. Get started by searching and selecting your team members.
          </p>
          
          {/* Actionable Guidance */}
          <div className="bg-gray-800/50 rounded-lg p-4 max-w-sm mx-auto border border-gray-600">
            <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quick Start Guide
            </h4>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <span>Type therapist names in the search bar above</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <span>Click on names to add them to your roster</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <span>Use "Add All" to quickly select everyone</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <span>Drag therapists to reorder your roster</span>
              </div>
            </div>
          </div>
          
          {/* Pro Tip */}
          <div className="mt-4 text-xs text-gray-400 italic">
            💡 Pro tip: You can also use the "Add All" button in the header for quick setup
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 overflow-y-auto bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl border border-gray-600">
      {/* Bulk Selection Header */}
      {enableBulkSelection && todayRoster.length > 0 && (
        <div className="p-4 border-b border-gray-600 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleBulkMode}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  isBulkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {isBulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
              </button>
              
              {isBulkMode && (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 rounded-lg text-sm font-medium bg-gray-600 text-gray-300 hover:bg-gray-500 transition-colors"
                  >
                    {selectedTherapists.size === todayRoster.length ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  {selectedTherapists.size > 0 && (
                    <button
                      onClick={handleBulkRemove}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Remove Selected ({selectedTherapists.size})
                    </button>
                  )}
                </>
              )}
            </div>
            
            {isBulkMode && (
              <div className="text-sm text-gray-400">
                {selectedTherapists.size} of {todayRoster.length} selected
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="p-4 space-y-3">
        {todayRoster
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((therapist) => (
            <div
              key={therapist.id}
              className="group relative bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg border border-gray-500 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 overflow-hidden"
            >
                {/* Simplified Card Content */}
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Bulk Selection Checkbox */}
                      {enableBulkSelection && isBulkMode && (
                        <input
                          type="checkbox"
                          checked={selectedTherapists.has(therapist.id)}
                          onChange={(e) => handleSelectTherapist(therapist.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                      )}
                      
                      
                      {/* Simple Avatar */}
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {therapist.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Therapist Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-semibold text-sm truncate">{therapist.name}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            therapist.status === 'available' ? 'bg-green-500/20 text-green-400' :
                            therapist.status === 'in-session' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {therapist.status === 'in-session' ? 'Working Now' :
                             therapist.status === 'departed' ? 'Leave Work' :
                             therapist.status === 'inactive' ? 'Inactive' :
                             'Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        debugLog('Removing therapist:', therapist.name, therapist.id);
                        onRemoveTherapist(therapist.id);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg cursor-pointer z-50"
                      title="Remove from roster"
                      style={{ zIndex: 9999 }}
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
      </div>
    </div>
  );
});

export default memo(RosterList);
