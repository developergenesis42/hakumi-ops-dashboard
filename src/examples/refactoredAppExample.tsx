import { AppProviderRefactored } from '@/context/AppContextRefactored';
import { useDataLoading, useDataLoadingMonitor } from '@/hooks/useDataLoading';
import { useApp } from '@/hooks/useApp';
// import { createAppSelectors } from '@/utils/stateNormalization';
import { stateLoggingMiddleware } from '@/context/middleware/stateLoggingMiddleware';
import { performanceMiddleware } from '@/context/middleware/performanceMiddleware';

/**
 * Example component showing how to use the refactored architecture
 */
export function RefactoredAppExample() {
  return (
    <AppProviderRefactored>
      <DataLoadingExample />
      <StateManagementExample />
      <PerformanceMonitoringExample />
    </AppProviderRefactored>
  );
}

/**
 * Example of using the data loading system
 */
function DataLoadingExample() {
  const { isAnyLoading, isAllComplete, hasError, executeOperations } = useDataLoading({
    operationIds: ['supabase-data', 'sessions', 'walkouts', 'roster'],
    autoExecute: true,
    onComplete: (results) => {
      console.log('Data loading completed:', results);
    },
    onError: (error) => {
      console.error('Data loading failed:', error);
    }
  });

  return (
    <div>
      <h3>Data Loading Status</h3>
      <p>Loading: {isAnyLoading ? 'Yes' : 'No'}</p>
      <p>Complete: {isAllComplete ? 'Yes' : 'No'}</p>
      <p>Error: {hasError ? 'Yes' : 'No'}</p>
      <button onClick={() => executeOperations()}>
        Retry Loading
      </button>
    </div>
  );
}

/**
 * Example of using the state management system
 */
function StateManagementExample() {
  const { state, dispatch } = useApp();
  
  // Create selectors for normalized state
  // const selectors = createAppSelectors({
  //   therapists: { byId: {}, allIds: [] },
  //   sessions: { byId: {}, allIds: [] },
  //   rooms: { byId: {}, allIds: [] },
  //   services: { byId: {}, allIds: [] },
  //   walkOuts: { byId: {}, allIds: [] },
  //   todayRoster: []
  // });

  const handleStartSession = () => {
    // Example of dispatching an action
    dispatch({
      type: 'START_SESSION',
      payload: {
        id: 'session-1',
        therapistIds: ['therapist-1'],
        roomId: 'room-1',
        service: {
          id: 'service-1',
          category: 'Single',
          roomType: 'Shower',
          duration: 60,
          price: 100,
          ladyPayout: 50,
          shopRevenue: 50,
          description: 'Massage'
        },
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        discount: 0,
        totalPrice: 100,
        status: 'scheduled'
      }
    });
  };

  return (
    <div>
      <h3>State Management</h3>
      <p>Sessions: {state.sessions.length}</p>
      <p>Therapists: {state.therapists.length}</p>
      <p>Rooms: {state.rooms.length}</p>
      <button onClick={handleStartSession}>
        Start Session
      </button>
    </div>
  );
}

/**
 * Example of using performance monitoring
 */
function PerformanceMonitoringExample() {
  const { errorCount, completedCount, totalCount, progress } = useDataLoadingMonitor();

  const getPerformanceStats = () => {
    const stats = performanceMiddleware.getPerformanceSummary();
    console.log('Performance Stats:', stats);
  };

  const getMemoryUsage = () => {
    const memory = performanceMiddleware.getMemoryUsage();
    console.log('Memory Usage:', memory);
  };

  const getRecentLogs = () => {
    const logs = stateLoggingMiddleware.getRecentLogs(10);
    console.log('Recent Logs:', logs);
  };

  return (
    <div>
      <h3>Performance Monitoring</h3>
      <p>Loading Progress: {progress.toFixed(1)}%</p>
      <p>Completed: {completedCount}/{totalCount}</p>
      <p>Errors: {errorCount}</p>
      <button onClick={getPerformanceStats}>
        Get Performance Stats
      </button>
      <button onClick={getMemoryUsage}>
        Get Memory Usage
      </button>
      <button onClick={getRecentLogs}>
        Get Recent Logs
      </button>
    </div>
  );
}

// DataSyncExample function removed as it was unused
