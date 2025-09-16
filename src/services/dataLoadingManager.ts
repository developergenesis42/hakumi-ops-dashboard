import { debugLog } from '@/config/environment';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress: number;
  loadedItems: string[];
  totalItems: number;
}

export interface DataLoadingConfig {
  id: string;
  dependencies?: string[];
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface DataLoadingOperation {
  id: string;
  config: DataLoadingConfig;
  operation: () => Promise<unknown>;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export class DataLoadingManager {
  private loadingStates = new Map<string, LoadingState>();
  private operations = new Map<string, DataLoadingOperation>();
  private subscribers = new Set<(states: Map<string, LoadingState>) => void>();
  // private isProcessing = false; // Not currently used
  private operationQueue: string[] = [];

  constructor() {
    this.loadingStates.set('global', {
      isLoading: false,
      error: null,
      progress: 0,
      loadedItems: [],
      totalItems: 0
    });
  }

  /**
   * Register a data loading operation
   */
  registerOperation(operation: DataLoadingOperation): void {
    this.operations.set(operation.id, operation);
    
    // Initialize loading state
    this.loadingStates.set(operation.id, {
      isLoading: false,
      error: null,
      progress: 0,
      loadedItems: [],
      totalItems: 1
    });

    debugLog(`DataLoadingManager: Registered operation ${operation.id}`);
  }

  /**
   * Execute a data loading operation
   */
  async executeOperation(operationId: string): Promise<unknown> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    // Check if dependencies are satisfied
    if (!this.areDependenciesSatisfied(operation.config.dependencies || [])) {
      debugLog(`DataLoadingManager: Dependencies not satisfied for ${operationId}, queuing`);
      this.queueOperation(operationId);
      return;
    }

    return this.runOperation(operation);
  }

  /**
   * Execute multiple operations in parallel
   */
  async executeOperations(operationIds: string[]): Promise<Map<string, unknown>> {
    const results = new Map<string, unknown>();
    
    // Filter operations that can run (dependencies satisfied)
    const runnableOperations = operationIds.filter(id => 
      this.areDependenciesSatisfied(this.operations.get(id)?.config.dependencies || [])
    );

    if (runnableOperations.length === 0) {
      debugLog('DataLoadingManager: No operations can run, all have unsatisfied dependencies');
      return results;
    }

    // Update global loading state
    this.updateGlobalLoadingState(true, null, 0, [], runnableOperations.length);

    try {
      const promises = runnableOperations.map(async (id) => {
        const result = await this.runOperation(this.operations.get(id)!);
        results.set(id, result);
        return { id, result };
      });

      await Promise.allSettled(promises);
      
      // Update global loading state
      this.updateGlobalLoadingState(false, null, 100, runnableOperations, runnableOperations.length);
      
      debugLog(`DataLoadingManager: Completed ${runnableOperations.length} operations`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateGlobalLoadingState(false, errorMessage, 0, [], runnableOperations.length);
      throw error;
    }

    return results;
  }

  /**
   * Get loading state for an operation
   */
  getLoadingState(operationId: string): LoadingState | undefined {
    return this.loadingStates.get(operationId);
  }

  /**
   * Get global loading state
   */
  getGlobalLoadingState(): LoadingState {
    return this.loadingStates.get('global')!;
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(callback: (states: Map<string, LoadingState>) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Check if all operations are complete
   */
  isAllComplete(): boolean {
    const globalState = this.getGlobalLoadingState();
    return !globalState.isLoading && globalState.error === null;
  }

  /**
   * Reset all loading states
   */
  reset(): void {
    this.loadingStates.clear();
    this.operations.clear();
    this.operationQueue = [];
    // this.isProcessing = false; // Not currently used
    
    this.loadingStates.set('global', {
      isLoading: false,
      error: null,
      progress: 0,
      loadedItems: [],
      totalItems: 0
    });

    this.notifySubscribers();
  }

  private async runOperation(operation: DataLoadingOperation): Promise<unknown> {
    const { id, config, operation: op, onSuccess, onError } = operation;
    
    debugLog(`DataLoadingManager: Starting operation ${id}`);
    
    // Update loading state
    this.updateLoadingState(id, true, null, 0, [], 1);
    
    const retryCount = config.retryCount || 3;
    const retryDelay = config.retryDelay || 1000;
    const timeout = config.timeout || 30000;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Operation ${id} timed out`)), timeout);
        });

        // Execute operation with timeout
        const result = await Promise.race([op(), timeoutPromise]);
        
        // Update loading state
        this.updateLoadingState(id, false, null, 100, [id], 1);
        
        // Call success callback
        onSuccess?.(result);
        
        debugLog(`DataLoadingManager: Operation ${id} completed successfully`);
        return result;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt === retryCount) {
          // Final attempt failed
          this.updateLoadingState(id, false, errorMessage, 0, [], 1);
          onError?.(error as Error);
          throw error;
        }
        
        // Wait before retry
        debugLog(`DataLoadingManager: Operation ${id} failed (attempt ${attempt + 1}/${retryCount + 1}), retrying in ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }
  }

  private areDependenciesSatisfied(dependencies: string[]): boolean {
    return dependencies.every(depId => {
      const depState = this.loadingStates.get(depId);
      return depState && !depState.isLoading && depState.error === null;
    });
  }

  private queueOperation(operationId: string): void {
    if (!this.operationQueue.includes(operationId)) {
      this.operationQueue.push(operationId);
    }
  }

  private updateLoadingState(
    operationId: string, 
    isLoading: boolean, 
    error: string | null, 
    progress: number, 
    loadedItems: string[], 
    totalItems: number
  ): void {
    this.loadingStates.set(operationId, {
      isLoading,
      error,
      progress,
      loadedItems,
      totalItems
    });
    
    this.notifySubscribers();
  }

  private updateGlobalLoadingState(
    isLoading: boolean, 
    error: string | null, 
    progress: number, 
    loadedItems: string[], 
    totalItems: number
  ): void {
    this.updateLoadingState('global', isLoading, error, progress, loadedItems, totalItems);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(new Map(this.loadingStates));
      } catch (error) {
        console.error('Error in loading state subscriber:', error);
      }
    });
  }
}

// Singleton instance
export const dataLoadingManager = new DataLoadingManager();
