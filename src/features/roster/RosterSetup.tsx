import { useState, useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { useRosterPersistence } from '@/hooks/useRosterPersistence';
import { useToast } from '@/hooks/useToast';
import type { Therapist } from '@/types';
import FeatureErrorBoundary from '@/components/FeatureErrorBoundary';
import RosterHeader from '@/features/roster/RosterHeader';
import RosterSearch from '@/features/roster/RosterSearch';
import RosterSidebar from '@/features/roster/RosterSidebar';
import RosterList from '@/features/roster/RosterList';
import RosterActions from '@/features/roster/RosterActions';
import RosterHistory from '@/features/roster/RosterHistory';

/**
 * Main RosterSetup component - optimized and modularized
 * Manages the daily roster setup workflow with improved performance
 */
export default function RosterSetup() {
  const { state, dispatch } = useApp();
  const { addToRoster, removeFromRoster, clearRoster } = useRosterPersistence();
  const { showToast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Memoized event handlers for better performance
  const handleAddToRoster = useCallback(async (therapist: Therapist) => {
    try {
      await addToRoster(therapist);
      showToast(`${therapist.name} added to roster`, 'success');
    } catch (error) {
      console.error('Failed to add therapist to roster:', error);
      showToast(`Failed to add ${therapist.name} to roster`, 'error');
    }
  }, [addToRoster, showToast]);

  const handleRemoveFromRoster = useCallback(async (therapistId: string) => {
    try {
      const therapist = state.todayRoster.find(t => t.id === therapistId);
      await removeFromRoster(therapistId);
      if (therapist) {
        showToast(`${therapist.name} removed from roster`, 'info');
      }
    } catch (error) {
      console.error('Failed to remove therapist from roster:', error);
      showToast('Failed to remove therapist from roster', 'error');
    }
  }, [removeFromRoster, state.todayRoster, showToast]);


  const handleStartDay = useCallback(async () => {
    if (state.todayRoster.length === 0) {
      showToast('Please add at least one therapist to the roster before starting the day.', 'warning');
      return;
    }
    
    setIsStarting(true);
    try {
      dispatch({ type: 'START_DAY' });
      showToast(`Day started with ${state.todayRoster.length} therapists!`, 'success');
    } catch (error) {
      console.error('Failed to start day:', error);
      showToast('Failed to start the day', 'error');
    } finally {
      setIsStarting(false);
    }
  }, [state.todayRoster.length, dispatch, showToast]);

  const handleClearRoster = useCallback(async () => {
    if (state.todayRoster.length === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to clear all ${state.todayRoster.length} therapists from today's roster? This action cannot be undone.`
    );
    
    if (confirmed) {
      setIsClearing(true);
      try {
        await clearRoster();
        showToast(`Cleared ${state.todayRoster.length} therapists from roster`, 'info');
      } catch (error) {
        console.error('Failed to clear roster:', error);
        showToast('Failed to clear roster', 'error');
      } finally {
        setIsClearing(false);
      }
    }
  }, [state.todayRoster.length, clearRoster, showToast]);

  // New handler for adding all therapists
  const handleAddAll = useCallback(async () => {
    const availableTherapists = state.therapists.filter(t => 
      !state.todayRoster.some(selected => selected.id === t.id)
    );
    
    if (availableTherapists.length === 0) {
      showToast('No available therapists to add', 'warning');
      return;
    }
    
    setIsAddingAll(true);
    try {
      // Add therapists one by one to show progress
      for (const therapist of availableTherapists) {
        await addToRoster(therapist);
      }
      showToast(`Added ${availableTherapists.length} therapists to roster`, 'success');
    } catch (error) {
      console.error('Failed to add all therapists:', error);
      showToast('Failed to add some therapists', 'error');
    } finally {
      setIsAddingAll(false);
    }
  }, [state.therapists, state.todayRoster, addToRoster, showToast]);




  // Handler for bulk removal of therapists
  const handleBulkRemove = useCallback(async (therapistIds: string[]) => {
    try {
      // Remove therapists one by one
      for (const therapistId of therapistIds) {
        await removeFromRoster(therapistId);
      }
      showToast(`Removed ${therapistIds.length} therapists from roster`, 'info');
    } catch (error) {
      console.error('Failed to remove therapists:', error);
      showToast('Failed to remove some therapists', 'error');
    }
  }, [removeFromRoster, showToast]);


  return (
    <div className="min-h-[calc(100vh-6rem)] bg-blue-500 flex font-mono-force">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Enhanced Header with Stats and Quick Actions */}
        <FeatureErrorBoundary featureName="Roster Header">
          <RosterHeader
            todayRoster={state.todayRoster}
            totalTherapists={state.therapists.length}
            onAddAll={handleAddAll}
            onClearAll={handleClearRoster}
            onShowHistory={() => setShowHistory(true)}
            isClearing={isClearing}
            isAddingAll={isAddingAll}
          />
        </FeatureErrorBoundary>

        {/* Search Section */}
        <FeatureErrorBoundary featureName="Roster Search">
          <RosterSearch
            therapists={state.therapists}
            excludeIds={state.todayRoster.map(t => t.id)}
            onSelectTherapist={handleAddToRoster}
          />
        </FeatureErrorBoundary>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left Side: Quick Tips */}
          <div className="lg:col-span-1">
            <FeatureErrorBoundary featureName="Roster Sidebar">
              <RosterSidebar
                todayRoster={state.todayRoster}
                totalTherapists={state.therapists.length}
              />
            </FeatureErrorBoundary>
          </div>
          
          {/* Right Side: Today's Roster List */}
          <div className="lg:col-span-2">
            <FeatureErrorBoundary featureName="Roster List">
              <RosterList
                todayRoster={state.todayRoster}
                onRemoveTherapist={handleRemoveFromRoster}
                onBulkRemove={handleBulkRemove}
                enableBulkSelection={true}
              />
            </FeatureErrorBoundary>
                
            {/* Action Buttons */}
            <FeatureErrorBoundary featureName="Roster Actions">
              <RosterActions
                hasTherapists={state.todayRoster.length > 0}
                onClearRoster={handleClearRoster}
                onStartDay={handleStartDay}
                isClearing={isClearing}
                isStarting={isStarting}
              />
            </FeatureErrorBoundary>
          </div>
        </div>

      </div>

      {/* Roster History Modal */}
      <FeatureErrorBoundary featureName="Roster History Modal">
        <RosterHistory
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
        />
      </FeatureErrorBoundary>
    </div>
  );
}

