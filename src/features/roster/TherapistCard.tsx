import React from 'react';
import type { Therapist } from '@/types';
import { SessionModal, DepartureModal, RemoveStaffModal, ExpenseModal } from '@/shared/components/modals';
import { useTherapistSessionManagement } from '@/hooks/useTherapistSessionManagement';
import { useApp } from '@/hooks/useApp';
import TimerDisplay from '@/features/staff/TimerDisplay';
import RemoveButton from '@/features/staff/RemoveButton';
import { TherapistActions } from '@/features/staff/TherapistActions';
import { useStableReference } from '@/utils/memoization';
import { StatusBadge } from '@/features/roster/ui';
import { cn } from '@/utils/helpers';
import { withPropValidation } from '@/utils/propValidation';
import FeatureErrorBoundary from '@/components/FeatureErrorBoundary';

/**
 * Props for the TherapistCard component
 */
interface TherapistCardProps {
  /** Therapist object to display */
  therapist: Therapist;
  /** Additional CSS classes */
  className?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

function TherapistCardComponent({ therapist, className = '', 'aria-label': ariaLabel }: TherapistCardProps) {
  // Use stable reference to prevent unnecessary re-renders
  const stableTherapist = useStableReference(therapist);
  
  // Get rooms data from app context
  const { state } = useApp();
  
  const {
    isSessionModalOpen,
    isManualAddModalOpen,
    isDepartureModalOpen,
    isRemoveModalOpen,
    isExpenseModalOpen,
    setIsSessionModalOpen,
    setIsManualAddModalOpen,
    setIsDepartureModalOpen,
    setIsRemoveModalOpen,
    setIsExpenseModalOpen,
    handleStartSession,
    handleStartTimer,
    handleManualAdd,
    handleCheckIn,
    handleCompleteSession,
    handleDepart,
    handleRemove,
    handleExpense,
    handleAddExpense,
  } = useTherapistSessionManagement(stableTherapist);

  const getCardStyles = () => {
    const baseStyles = 'rounded-lg p-4 border-2 bg-slate-800';
    const statusStyles = {
      inactive: 'border-slate-600',
      available: 'border-green-500',
      'in-session': 'border-blue-500',
      departed: 'border-red-500'
    };
    return cn(baseStyles, statusStyles[therapist.status] || 'border-red-500');
  };

  const totalExpenses = therapist.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  return (
    <FeatureErrorBoundary featureName={`Therapist Card - ${therapist.name}`}>
      <div 
        className={cn(getCardStyles(), className)}
        role="article"
        aria-label={ariaLabel || `Therapist card for ${therapist.name}`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold text-slate-100">{therapist.name}</h3>
          <div className="flex items-center space-x-2">
            <FeatureErrorBoundary featureName="Status Badge">
              <StatusBadge 
                status={therapist.status} 
                showExpenses={totalExpenses > 0}
                totalExpenses={totalExpenses}
              />
            </FeatureErrorBoundary>
            {therapist.status === 'inactive' && (
              <FeatureErrorBoundary featureName="Remove Button">
                <RemoveButton onRemove={handleRemove} />
              </FeatureErrorBoundary>
            )}
          </div>
        </div>

        {/* Timer Display */}
        <FeatureErrorBoundary featureName="Timer Display">
          <TimerDisplay 
            therapist={therapist} 
            rooms={state.rooms} 
            completedSessions={therapist.totalSessions}
          />
        </FeatureErrorBoundary>

        {/* Action Buttons */}
        <FeatureErrorBoundary featureName="Therapist Actions">
          <TherapistActions
            therapist={therapist}
            onStartSession={handleStartSession}
            onStartTimer={handleStartTimer}
            onManualAdd={handleManualAdd}
            onCheckIn={handleCheckIn}
            onCompleteSession={handleCompleteSession}
            onDepart={handleDepart}
            onExpense={handleExpense}
          />
        </FeatureErrorBoundary>
      </div>

      {/* Session Modal */}
      <FeatureErrorBoundary featureName="Session Modal">
        <SessionModal
          isOpen={isSessionModalOpen}
          onClose={() => setIsSessionModalOpen(false)}
          therapist={therapist}
        />
      </FeatureErrorBoundary>

      {/* Manual Add Modal */}
      <FeatureErrorBoundary featureName="Manual Add Modal">
        <SessionModal
          isOpen={isManualAddModalOpen}
          onClose={() => setIsManualAddModalOpen(false)}
          therapist={therapist}
          isManualAdd={true}
        />
      </FeatureErrorBoundary>

      {/* Departure Modal */}
      <FeatureErrorBoundary featureName="Departure Modal">
        <DepartureModal
          isOpen={isDepartureModalOpen}
          onClose={() => setIsDepartureModalOpen(false)}
          therapist={therapist}
        />
      </FeatureErrorBoundary>

      {/* Remove Staff Modal */}
      <FeatureErrorBoundary featureName="Remove Staff Modal">
        <RemoveStaffModal
          isOpen={isRemoveModalOpen}
          onClose={() => setIsRemoveModalOpen(false)}
          therapist={therapist}
        />
      </FeatureErrorBoundary>

      {/* Expense Modal */}
      <FeatureErrorBoundary featureName="Expense Modal">
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          therapist={therapist}
          onAddExpense={handleAddExpense}
        />
      </FeatureErrorBoundary>
    </FeatureErrorBoundary>
  );
}

// Validation schema for TherapistCard
const therapistCardSchema = {
  therapist: (value: unknown): boolean => !!(value && typeof value === 'object' && value !== null && 'id' in value && 'name' in value && 'status' in value),
  className: (value: unknown): boolean => typeof value === 'string',
  'aria-label': (value: unknown): boolean => typeof value === 'string'
};

// Export with prop validation
const TherapistCard = withPropValidation(
  TherapistCardComponent as unknown as React.ComponentType<Record<string, unknown>>,
  therapistCardSchema,
  'TherapistCard'
) as unknown as React.ComponentType<TherapistCardProps>;

export default React.memo(TherapistCard);
