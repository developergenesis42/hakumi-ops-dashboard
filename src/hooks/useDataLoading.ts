import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { dataLoadingManager, type LoadingState } from '@/services/dataLoadingManager';
import { debugLog } from '@/config/environment';

export interface UseDataLoadingOptions {
  operationIds: string[];
  autoExecute?: boolean;
  onComplete?: (results: Map<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export interface UseDataLoadingReturn {
  loadingStates: Map<string, LoadingState>;
  globalLoadingState: LoadingState;
  isAnyLoading: boolean;
  isAllComplete: boolean;
  hasError: boolean;
  executeOperations: (operationIds?: string[]) => Promise<Map<string, unknown>>;
  retryOperation: (operationId: string) => Promise<unknown>;
  clearErrors: () => void;
}

/**
 * Hook for managing data loading operations
 */
export function useDataLoading(options: UseDataLoadingOptions): UseDataLoadingReturn {
  const { operationIds, autoExecute = true, onComplete, onError } = options;
  
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());
  const [globalLoadingState, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: 0,
    loadedItems: [],
    totalItems: 0
  });

  // Execute operations
  const executeOperations = useCallback(async (ids: string[] = operationIds): Promise<Map<string, unknown>> => {
    try {
      debugLog('useDataLoading: Executing operations:', ids);
      const results = await dataLoadingManager.executeOperations(ids);
      onComplete?.(results);
      return results;
    } catch (error) {
      logger.error('useDataLoading: Execution failed:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [operationIds, onComplete, onError]);

  // Subscribe to loading state changes
  useEffect(() => {
    const unsubscribe = dataLoadingManager.subscribe((states) => {
      setLoadingStates(new Map(states));
      
      const globalState = states.get('global');
      if (globalState) {
        setGlobalLoadingState(globalState);
      }
    });

    return unsubscribe;
  }, []);

  // Auto-execute operations when dependencies are ready
  useEffect(() => {
    if (autoExecute && operationIds.length > 0) {
      debugLog('useDataLoading: Auto-executing operations:', operationIds);
      executeOperations(operationIds).catch(error => {
        logger.error('Auto-execution failed:', error);
        onError?.(error);
      });
    }
  }, [autoExecute, executeOperations, onError, operationIds]);

  // Retry a specific operation
  const retryOperation = useCallback(async (operationId: string): Promise<unknown> => {
    try {
      debugLog('useDataLoading: Retrying operation:', operationId);
      const result = await dataLoadingManager.executeOperation(operationId);
      return result;
    } catch (error) {
      logger.error('useDataLoading: Retry failed:', error);
      onError?.(error as Error);
      throw error;
    }
  }, [onError]);

  // Clear errors
  const clearErrors = useCallback(() => {
    // This would need to be implemented in the data loading manager
    debugLog('useDataLoading: Clearing errors');
  }, []);

  // Derived state
  const isAnyLoading = Array.from(loadingStates.values()).some(state => state.isLoading);
  const isAllComplete = dataLoadingManager.isAllComplete();
  const hasError = Array.from(loadingStates.values()).some(state => state.error !== null);

  return {
    loadingStates,
    globalLoadingState,
    isAnyLoading,
    isAllComplete,
    hasError,
    executeOperations,
    retryOperation,
    clearErrors
  };
}

/**
 * Hook for a single data loading operation
 */
export function useSingleDataLoading(operationId: string, autoExecute = true) {
  const { loadingStates, executeOperations, retryOperation, clearErrors } = useDataLoading({
    operationIds: [operationId],
    autoExecute
  });

  const loadingState = loadingStates.get(operationId) || {
    isLoading: false,
    error: null,
    progress: 0,
    loadedItems: [],
    totalItems: 0
  };

  const execute = useCallback(() => {
    return executeOperations([operationId]);
  }, [executeOperations, operationId]);

  return {
    ...loadingState,
    execute,
    retry: () => retryOperation(operationId),
    clearErrors
  };
}

/**
 * Hook for monitoring all data loading operations
 */
export function useDataLoadingMonitor() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());
  const [globalLoadingState, setGlobalLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    progress: 0,
    loadedItems: [],
    totalItems: 0
  });

  useEffect(() => {
    const unsubscribe = dataLoadingManager.subscribe((states) => {
      setLoadingStates(new Map(states));
      
      const globalState = states.get('global');
      if (globalState) {
        setGlobalLoadingState(globalState);
      }
    });

    return unsubscribe;
  }, []);

  const isAnyLoading = Array.from(loadingStates.values()).some(state => state.isLoading);
  const isAllComplete = dataLoadingManager.isAllComplete();
  const hasError = Array.from(loadingStates.values()).some(state => state.error !== null);
  const errorCount = Array.from(loadingStates.values()).filter(state => state.error !== null).length;
  const completedCount = Array.from(loadingStates.values()).filter(state => !state.isLoading && state.error === null).length;
  const totalCount = loadingStates.size;

  return {
    loadingStates,
    globalLoadingState,
    isAnyLoading,
    isAllComplete,
    hasError,
    errorCount,
    completedCount,
    totalCount,
    progress: totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  };
}
