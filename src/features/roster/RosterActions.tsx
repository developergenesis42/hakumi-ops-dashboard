import { memo } from 'react';
import { ActionGroup } from '@/shared/components/ui/ActionGroup';

interface RosterActionsProps {
  hasTherapists: boolean;
  onClearRoster: () => void;
  onStartDay: () => void;
  isClearing?: boolean;
  isStarting?: boolean;
}

/**
 * Action buttons component for roster management
 * Handles clear roster and start day functionality with enhanced UI
 */
const RosterActions = memo(function RosterActions({ 
  hasTherapists, 
  onClearRoster, 
  onStartDay,
  isClearing = false,
  isStarting = false
}: RosterActionsProps) {

  const clearIcon = (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  const startIcon = (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  const loadingSpinner = (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  const handleStartDayClick = () => {
    if (isStarting) return;
    onStartDay();
  };



  return (
    <div className="mt-6 space-y-4">

      <ActionGroup layout="vertical" size="lg" className="space-y-4">
        {hasTherapists && (
          <ActionGroup.Item
            onClick={onClearRoster}
            variant="error"
            icon={isClearing ? loadingSpinner : clearIcon}
            fullWidth
            disabled={isClearing}
            className="min-h-[56px] sm:min-h-[60px]"
          >
            <div className="flex flex-col items-center text-center">
              <span className="font-semibold text-base sm:text-lg leading-tight">
                {isClearing ? 'Clearing Roster...' : 'Clear All'}
              </span>
              <span className="text-xs opacity-75 mt-0.5 leading-tight">
                {isClearing ? 'Please wait...' : 'Remove all therapists'}
              </span>
            </div>
          </ActionGroup.Item>
        )}
        
        {/* Enhanced Start Day Button */}
        <div className="relative">
          <ActionGroup.Item
            onClick={handleStartDayClick}
            variant="primary"
            icon={isStarting ? loadingSpinner : startIcon}
            fullWidth
            disabled={!hasTherapists || isStarting}
            className="relative overflow-hidden group min-h-[56px] sm:min-h-[60px]"
            aria-label={isStarting ? 'Starting the day, please wait' : hasTherapists ? 'Start the day with current roster' : 'Add therapists to roster before starting day'}
          >
            <div className="flex flex-col items-center text-center">
              {isStarting ? (
                <span className="animate-pulse font-semibold text-base sm:text-lg leading-tight">
                  Starting Day...
                </span>
              ) : (
                <>
                  <span className="font-bold text-base sm:text-lg leading-tight">
                    Start Day
                  </span>
                  <span className="text-xs opacity-90 mt-0.5 leading-tight">
                    {hasTherapists ? 'Ready to begin' : 'Add therapists first'}
                  </span>
                </>
              )}
            </div>
            
            {/* Animated background effect */}
            {!isStarting && hasTherapists && (
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </ActionGroup.Item>
          
          {/* Status indicator */}
          {hasTherapists && (
            <div 
              className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 flex items-center justify-center"
              aria-label="Roster is ready"
            >
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          
        </div>
      </ActionGroup>
    </div>
  );
});

export default memo(RosterActions);