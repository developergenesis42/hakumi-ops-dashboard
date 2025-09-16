/**
 * Route-based Code Splitting
 * Organizes components by routes for better code splitting and performance
 */

import { Suspense, lazy } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Loading component
const RouteLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-sm text-gray-600">Loading route...</p>
    </div>
  </div>
);

// Lazy load route components
const LazyRosterSetupRoute = lazy(() => import('@/components/RosterSetup'));
const LazyMainDashboardRoute = lazy(() => import('@/components/MainDashboard'));
const LazyClosingOutRoute = lazy(() => import('@/components/ClosingOut'));
const LazyTodosPageRoute = lazy(() => import('@/components/TodosPage'));
const LazyTotalStatsRoute = lazy(() => import('@/components/TotalStats'));
const LazyAdminDashboardRoute = lazy(() => import('@/components/TotalStats')); // Using TotalStats as admin dashboard for now

// Route wrapper with error boundary and suspense
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};

// Route components
export const RosterSetupRoute = () => {
  return (
    <RouteWrapper>
      <LazyRosterSetupRoute />
    </RouteWrapper>
  );
};

export const MainDashboardRoute = () => {
  return (
    <RouteWrapper>
      <LazyMainDashboardRoute />
    </RouteWrapper>
  );
};

export const ClosingOutRoute = () => {
  return (
    <RouteWrapper>
      <LazyClosingOutRoute />
    </RouteWrapper>
  );
};


export const TodosPageRoute = () => {
  return (
    <RouteWrapper>
      <LazyTodosPageRoute />
    </RouteWrapper>
  );
};

export const TotalStatsRoute = () => {
  return (
    <RouteWrapper>
      <LazyTotalStatsRoute />
    </RouteWrapper>
  );
};

export const AdminDashboardRoute = () => {
  return (
    <RouteWrapper>
      <LazyAdminDashboardRoute />
    </RouteWrapper>
  );
};

