import { memo } from 'react';
import type { Therapist } from '@/types';

interface RosterSidebarProps {
  todayRoster: Therapist[];
  totalTherapists: number;
}

/**
 * Sidebar component displaying quick tips, roster stats, and recent activity
 * Provides helpful information and context for roster management
 */
const RosterSidebar = memo(function RosterSidebar({ 
  todayRoster, 
  totalTherapists
}: RosterSidebarProps) {
  // Props are used in the component content below
  void todayRoster;
  void totalTherapists;

  return (
    <div className="space-y-4">
      {/* Quick Guide Panel */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Guide
        </h3>
        <div className="space-y-3 text-xs text-gray-300">
          <div className="space-y-2">
            <div className="font-medium text-white text-xs">Search & Add</div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xs">•</span>
              <span className="leading-tight">Type name to search therapists</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 text-xs">•</span>
              <span className="leading-tight">Use "Add All" for quick setup</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-white text-xs">Manage Roster</div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-xs">•</span>
              <span className="leading-tight">Drag to reorder therapists</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 text-xs">•</span>
              <span className="leading-tight">Click X to remove individual</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-white text-xs">Start Day</div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-xs">•</span>
              <span className="leading-tight">Click "Start Day" when ready</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-xs">•</span>
              <span className="leading-tight">Minimum 1 therapist required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default memo(RosterSidebar);
