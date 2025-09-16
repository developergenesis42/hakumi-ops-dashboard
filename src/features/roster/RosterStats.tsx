import { memo } from 'react';

interface RosterStatsProps {
  totalTherapists: number; // This now represents remaining available therapists
  selectedTherapists: number;
}

/**
 * Statistics display component for roster information
 * Shows remaining available therapists count, today's roster count, and utilization percentage
 */
const RosterStats = memo(function RosterStats({ 
  totalTherapists, 
  selectedTherapists
}: RosterStatsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Left Side: Global Roster */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Global Roster ({totalTherapists})</h2>
        </div>

        {/* Right Side: Today's Roster */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-white">Today's Roster ({selectedTherapists})</h2>
        </div>
      </div>
    </div>
  );
});

export default RosterStats;
