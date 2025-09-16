/**
 * Lazy Components
 * Code-split components for better performance and smaller initial bundle
 */

import React, { Suspense, lazy } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import type { Therapist, Expense } from '@/types';

// Type definitions for component props
interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
  isManualAdd?: boolean;
}


interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
}

interface RemoveStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapist: Therapist;
  onAddExpense: (therapistId: string, expense: Expense) => void;
}


interface WalkOutTableProps {
  // WalkOutTable doesn't take any props
  [key: string]: never;
}


interface UndoWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  actionDescription: string;
}

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Loading...</p>
    </div>
  </div>
);

// Error boundary for lazy components
const LazyErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Failed to load component</div>
          <p className="text-sm text-gray-600">Please refresh the page to try again.</p>
        </div>
      </div>
    }>
      {children}
    </ErrorBoundary>
  );
};

// Lazy load main phase components
const LazyRosterSetup = lazy(() => import('@/features/roster/RosterSetup'));
const LazyMainDashboard = lazy(() => import('@/features/dashboard/MainDashboard'));
const LazyClosingOut = lazy(() => import('@/features/reports/ClosingOut'));

// Lazy load modal components
const LazySessionModal = lazy(() => import('@/shared/components/modals/SessionModal'));
// Removed AuthModal - no authentication needed
const LazyAddStaffModal = lazy(() => import('@/shared/components/modals/AddStaffModal'));
const LazyDepartureModal = lazy(() => import('@/shared/components/modals/DepartureModal'));
const LazyRemoveStaffModal = lazy(() => import('@/shared/components/modals/RemoveStaffModal'));



// Lazy load utility components
const LazyExpenseModal = lazy(() => import('@/shared/components/modals/ExpenseModal'));
const LazyWalkOutTable = lazy(() => import('@/features/reports/WalkOutTable'));
const LazyUndoWarningModal = lazy(() => import('@/shared/components/modals/UndoWarningModal'));

// Wrapper components with lazy loading
export const RosterSetup = () => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <LazyRosterSetup />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const MainDashboard = () => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <LazyMainDashboard />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const ClosingOut = () => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <LazyClosingOut />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const SessionModal = (props: SessionModalProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>}>
        <LazySessionModal {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};


export const AddStaffModal = (props: AddStaffModalProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>}>
        <LazyAddStaffModal {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const DepartureModal = (props: DepartureModalProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>}>
        <LazyDepartureModal {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const RemoveStaffModal = (props: RemoveStaffModalProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>}>
        <LazyRemoveStaffModal {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

export const ExpenseModal = (props: ExpenseModalProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>}>
        <LazyExpenseModal {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};


export const WalkOutTable = (props: WalkOutTableProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded"></div>}>
        <LazyWalkOutTable {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};


export const UndoWarningModal = (props: UndoWarningModalProps) => {
  return (
    <LazyErrorBoundary>
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>}>
        <LazyUndoWarningModal {...props} />
      </Suspense>
    </LazyErrorBoundary>
  );
};

// Export lazy components for direct use
export {
  LazyRosterSetup,
  LazyMainDashboard,
  LazyClosingOut,
  LazySessionModal,
  LazyAddStaffModal,
  LazyDepartureModal,
  LazyRemoveStaffModal,
  LazyWalkOutTable,
  LazyUndoWarningModal,
};