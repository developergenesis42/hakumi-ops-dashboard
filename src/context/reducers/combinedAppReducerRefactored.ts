import type { AppState, AppAction } from '@/types';
import { stateCoordinator } from '@/context/stateCoordinator';
import { stateLoggingMiddleware } from '@/context/middleware/stateLoggingMiddleware';
import { performanceMiddleware } from '@/context/middleware/performanceMiddleware';

/**
 * Refactored combined app reducer that uses the state coordinator
 * and middleware for better performance and debugging
 */
export function combinedAppReducerRefactored(state: AppState, action: AppAction): AppState {
  // Add middleware to the state coordinator if not already added
  if (!stateCoordinator['middlewares'].includes(stateLoggingMiddleware)) {
    stateCoordinator.addMiddleware(stateLoggingMiddleware);
  }
  
  if (!stateCoordinator['middlewares'].includes(performanceMiddleware)) {
    stateCoordinator.addMiddleware(performanceMiddleware);
  }

  // Process the state update through the coordinator
  return stateCoordinator.processStateUpdate(state, action);
}

// Re-export for backward compatibility
export { combinedAppReducerRefactored as combinedAppReducer };
