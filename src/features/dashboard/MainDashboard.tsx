import { useState, memo, useMemo, useCallback } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useUndoWithWarning } from '@/hooks/useUndoWithWarning';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useRosterManagement } from '@/hooks/useRosterManagement';
import SidePanel from '@/shared/components/layout/SidePanel';
import { UndoWarningModal } from '@/shared/components/LazyComponents';
import ExpensesSummaryModal from '@/shared/components/modals/ExpensesSummaryModal';
import FeatureErrorBoundary from '@/components/FeatureErrorBoundary';
import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import { DashboardStats } from '@/features/dashboard/DashboardStats';
import { TherapistGrid } from '@/features/dashboard/TherapistGrid';

function MainDashboard() {
  const { loading: supabaseLoading } = useSupabaseData();
  
  // Hooks for dashboard functionality
  const {
    canUndo,
    lastActionModifiesDatabase,
    lastActionDescription,
    handleUndo,
    isWarningModalOpen,
    handleCloseWarning,
    handleConfirmUndo
  } = useUndoWithWarning();
  
  const stats = useDashboardStats();
  const { sortedRoster } = useRosterManagement();

  // Memoize expensive calculations - stats are already memoized in the hook
  // Only create a new object if the values actually change
  const memoizedStats = useMemo(() => ({
    totalSlips: stats.totalSlips,
    totalRevenue: stats.totalRevenue,
    totalPayouts: stats.totalPayouts,
    totalDiscounts: stats.totalDiscounts,
    shopRevenue: stats.shopRevenue,
    totalExpenses: stats.totalExpenses,
  }), [stats.totalSlips, stats.totalRevenue, stats.totalPayouts, stats.totalDiscounts, stats.shopRevenue, stats.totalExpenses]);

  // sortedRoster is already memoized in the hook, no need to re-memoize
  // const memoizedRoster = useMemo(() => sortedRoster, [sortedRoster]);
  
  // State for modals
  const [isExpensesModalOpen, setIsExpensesModalOpen] = useState(false);
  
  // Optimized event handlers using useCallback for better performance
  const handleOpenExpensesModal = useCallback(() => {
    setIsExpensesModalOpen(true);
  }, []);
  
  const handleCloseExpensesModal = useCallback(() => {
    setIsExpensesModalOpen(false);
  }, []);

  if (supabaseLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }


  return (
    <div className="min-h-[calc(100vh-6rem)] bg-black flex font-mono-force">
      {/* Main Dashboard Content */}
      <div className="flex-1 p-6">
        <FeatureErrorBoundary featureName="Dashboard Header">
          <DashboardHeader
            onUndo={handleUndo}
            canUndo={canUndo}
            lastActionModifiesDatabase={lastActionModifiesDatabase}
            lastActionDescription={lastActionDescription}
          />
        </FeatureErrorBoundary>
        
        <FeatureErrorBoundary featureName="Dashboard Stats">
          <DashboardStats
            totalSlips={memoizedStats.totalSlips}
            totalRevenue={memoizedStats.totalRevenue}
            totalPayouts={memoizedStats.totalPayouts}
            totalDiscounts={memoizedStats.totalDiscounts}
            shopRevenue={memoizedStats.shopRevenue}
            totalExpenses={memoizedStats.totalExpenses}
            onOpenExpensesModal={handleOpenExpensesModal}
          />
        </FeatureErrorBoundary>
        
        <FeatureErrorBoundary featureName="Therapist Grid">
          <TherapistGrid therapists={sortedRoster} />
        </FeatureErrorBoundary>
      </div>
      
      {/* Side Panel */}
      <FeatureErrorBoundary featureName="Side Panel">
        <SidePanel />
      </FeatureErrorBoundary>
      
      {/* Modals */}
      {isWarningModalOpen && (
        <FeatureErrorBoundary featureName="Undo Warning Modal">
          <UndoWarningModal
            isOpen={isWarningModalOpen}
            onClose={handleCloseWarning}
            onConfirm={handleConfirmUndo}
            actionDescription={lastActionDescription}
          />
        </FeatureErrorBoundary>
      )}
      
      {isExpensesModalOpen && (
        <FeatureErrorBoundary featureName="Expenses Summary Modal">
          <ExpensesSummaryModal
            isOpen={isExpensesModalOpen}
            onClose={handleCloseExpensesModal}
            therapists={sortedRoster}
          />
        </FeatureErrorBoundary>
      )}
    </div>
  );
}

export default memo(MainDashboard);
