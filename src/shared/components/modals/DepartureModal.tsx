import { useState } from 'react';
import type { Therapist } from '@/types';
import { useAttendance } from '@/hooks/useAttendance';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { formatCurrency, calculatePayout } from '@/utils/helpers';
import { withPropValidation } from '@/utils/propValidation';

/**
 * Props for the DepartureModal component
 */
interface DepartureModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when closing the modal */
  onClose: () => void;
  /** Therapist object for departure confirmation */
  therapist: Therapist;
  /** ARIA label for accessibility */
  'aria-label'?: string;
}

function DepartureModalComponent({ isOpen, onClose, therapist, 'aria-label': ariaLabel }: DepartureModalProps) {
  const { departTherapist, getTherapistWorkingHours, formatWorkingHours } = useAttendance();
  const { printDepartureSummary, isPrintNodeConfigured } = usePrintReceipt();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  // Calculate expenses and net payout
  const totalExpenses = therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netPayout = calculatePayout(therapist.totalEarnings, totalExpenses);

  const handleConfirmDeparture = async () => {
    setIsConfirming(true);
    try {
      await departTherapist(therapist.id, therapist.name);
      // Close modal immediately after local state update
      onClose();
    } catch (error) {
      console.error('Failed to depart therapist:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handlePrintSummary = async () => {
    if (!therapist.checkInTime) {
      console.error('No check-in time found for therapist');
      return;
    }

    setIsPrinting(true);
    try {
      const checkInTime = new Date(therapist.checkInTime);
      const departureTime = new Date();
      const workingHours = getTherapistWorkingHours(therapist.id);
      
      await printDepartureSummary(
        therapist,
        checkInTime,
        departureTime,
        workingHours,
        totalExpenses,
        netPayout
      );
    } catch (error) {
      console.error('Failed to print departure summary:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || `Departure confirmation for ${therapist.name}`}
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl modal-content">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Leave Work Confirmation</h2>
          <p className="text-gray-600">Confirm leave work for {therapist.name}</p>
        </div>

        {/* Working Hours & Payout Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">Working Hours Today</div>
            <div className="text-2xl font-bold text-blue-600 mb-4">
              {formatWorkingHours(getTherapistWorkingHours(therapist.id))}
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm text-gray-600 mb-2">Total Earnings for Today</div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {formatCurrency(therapist.totalEarnings)}
              </div>
              <div className="text-sm text-gray-500">
                {therapist.totalSessions} session{therapist.totalSessions !== 1 ? 's' : ''} completed
              </div>
              
              {/* Expense Breakdown */}
              {totalExpenses > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-600 mb-2 font-medium">Daily Expenses</div>
                  <div className="space-y-1">
                    {therapist.expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between text-sm">
                        <span className="text-red-600">{expense.type}:</span>
                        <span className="text-red-600 font-medium">-{formatCurrency(expense.amount)}</span>
                      </div>
                    ))}
                    <div className="border-t border-red-300 pt-1 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="text-red-600">Total Expenses:</span>
                        <span className="text-red-600">-{formatCurrency(totalExpenses)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Net Payout */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-600 mb-2 font-medium">Final Payout</div>
                <div className="text-2xl font-bold text-blue-800">
                  {formatCurrency(netPayout)}
                </div>
                {totalExpenses > 0 && (
                  <div className="text-xs text-blue-600 mt-1">
                    After deducting {formatCurrency(totalExpenses)} in expenses
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session Details */}
        {therapist.totalSessions > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sessions Completed:</span>
                <span className="font-medium text-gray-900">{therapist.totalSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Working Hours:</span>
                <span className="font-medium text-gray-900">
                  {formatWorkingHours(getTherapistWorkingHours(therapist.id))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Average per Session:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(therapist.totalEarnings / therapist.totalSessions)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-medium text-gray-900">
                  {getTherapistWorkingHours(therapist.id) > 0 
                    ? formatCurrency((therapist.totalEarnings / getTherapistWorkingHours(therapist.id)) * 60)
                    : '$0.00'
                  }/hour
                </span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900">Total Earnings:</span>
                  <span className="text-green-600">{formatCurrency(therapist.totalEarnings)}</span>
                </div>
                {totalExpenses > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Less Expenses:</span>
                    <span>-{formatCurrency(totalExpenses)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2 mt-2">
                  <span className="text-gray-900">Net Payout:</span>
                  <span className="text-blue-600">{formatCurrency(netPayout)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Print Summary Button */}
          {isPrintNodeConfigured && (
            <button
              onClick={handlePrintSummary}
              disabled={isPrinting || isConfirming}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPrinting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Printing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Summary
                </>
              )}
            </button>
          )}
          
          {/* Main Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isConfirming || isPrinting}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeparture}
              disabled={isConfirming || isPrinting}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
            >
              {isConfirming ? 'Processing...' : 'Confirm Leave Work'}
            </button>
          </div>
        </div>

        {/* Cash Payment Reminder */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-yellow-800 font-medium">
              Remember to pay {formatCurrency(netPayout)} in cash
              {totalExpenses > 0 && (
                <span className="text-yellow-700">
                  {' '}(after deducting {formatCurrency(totalExpenses)} in expenses)
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Validation schema for DepartureModal
const departureModalSchema = {
  isOpen: { required: true, type: 'boolean' as const },
  onClose: { required: true, type: 'function' as const },
  therapist: { 
    required: true, 
    type: 'object' as const,
    validator: (value: unknown): boolean => !!(value && typeof value === 'object' && value !== null && 'id' in value && 'name' in value)
  },
  'aria-label': { type: 'string' as const }
};

// Export with prop validation
const DepartureModal = withPropValidation(
  DepartureModalComponent as unknown as React.ComponentType<Record<string, unknown>>,
  departureModalSchema,
  'DepartureModal'
) as unknown as React.ComponentType<DepartureModalProps>;

export default DepartureModal;
