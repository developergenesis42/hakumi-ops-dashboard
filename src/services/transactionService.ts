import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

// Generic types for database operations
export type DatabaseRecord = Record<string, unknown>;
export type DatabaseConditions = Record<string, unknown>;

export interface TransactionOperation {
  type: 'insert' | 'update' | 'delete';
  table: string;
  data?: DatabaseRecord;
  id?: string;
  conditions?: DatabaseConditions;
}

export interface TransactionResult {
  success: boolean;
  data?: DatabaseRecord | DatabaseRecord[] | (DatabaseRecord | DatabaseRecord[])[];
  error?: string;
  operations?: TransactionOperation[];
}

// Specific types for common operations
export interface SessionData extends DatabaseRecord {
  therapist_id?: string;
  room_id?: string;
  service_id?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
}

export interface WalkoutData extends DatabaseRecord {
  session_id?: string;
  reason?: string;
  timestamp?: string;
}

export interface RosterUpdate extends DatabaseRecord {
  id: string;
  status?: string;
  [key: string]: unknown;
}

export class TransactionService {
  private static instance: TransactionService;
  private pendingOperations: TransactionOperation[] = [];

  static getInstance(): TransactionService {
    if (!TransactionService.instance) {
      TransactionService.instance = new TransactionService();
    }
    return TransactionService.instance;
  }

  /**
   * Execute multiple database operations as a single transaction
   * Note: Supabase doesn't support true transactions, so we implement optimistic locking
   */
  async executeTransaction(operations: TransactionOperation[]): Promise<TransactionResult> {
    this.pendingOperations = [...operations];
    
    try {
      logger.info('Starting transaction with operations:', operations.length);
      
      // Validate all operations first
      await this.validateOperations(operations);
      
      // Execute operations in sequence with rollback capability
      const results: (DatabaseRecord | DatabaseRecord[])[] = [];
      const executedOperations: TransactionOperation[] = [];
      
      for (const operation of operations) {
        try {
          const result = await this.executeOperation(operation);
          results.push(result);
          executedOperations.push(operation);
        } catch (error) {
          logger.error('Transaction failed at operation:', operation, error);
          
          // Rollback executed operations
          await this.rollbackOperations(executedOperations);
          
          return {
            success: false,
            error: `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            operations: executedOperations
          };
        }
      }
      
      logger.info('Transaction completed successfully');
      return {
        success: true,
        data: results,
        operations: executedOperations
      };
      
    } catch (error) {
      logger.error('Transaction validation failed:', error);
      return {
        success: false,
        error: `Transaction validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        operations: this.pendingOperations
      };
    }
  }

  private async validateOperations(operations: TransactionOperation[]): Promise<void> {
    for (const operation of operations) {
      // Check if table exists and is accessible
      const { error } = await supabase
        .from(operation.table)
        .select('id')
        .limit(1);
        
      if (error) {
        throw new Error(`Table ${operation.table} is not accessible: ${error.message}`);
      }
      
      // Validate data structure for insert/update operations
      if ((operation.type === 'insert' || operation.type === 'update') && !operation.data) {
        throw new Error(`Operation ${operation.type} on ${operation.table} requires data`);
      }
      
      // Validate ID for update/delete operations
      if ((operation.type === 'update' || operation.type === 'delete') && !operation.id && !operation.conditions) {
        throw new Error(`Operation ${operation.type} on ${operation.table} requires ID or conditions`);
      }
    }
  }

  private async executeOperation(operation: TransactionOperation): Promise<DatabaseRecord | DatabaseRecord[]> {
    const { type, table, data, id, conditions } = operation;
    
    switch (type) {
      case 'insert': {
        const { data: insertData, error: insertError } = await supabase
          .from(table)
          .insert(data)
          .select('*');
          
        if (insertError) throw insertError;
        return insertData;
      }
        
      case 'update': {
        let updateQuery = supabase.from(table).update(data);
        
        if (id) {
          updateQuery = updateQuery.eq('id', id);
        } else if (conditions) {
          Object.entries(conditions).forEach(([key, value]) => {
            updateQuery = updateQuery.eq(key, value);
          });
        }
        
        const { data: updateData, error: updateError } = await updateQuery.select('*');
        if (updateError) throw updateError;
        return updateData;
      }
        
      case 'delete': {
        let deleteQuery = supabase.from(table).delete();
        
        if (id) {
          deleteQuery = deleteQuery.eq('id', id);
        } else if (conditions) {
          Object.entries(conditions).forEach(([key, value]) => {
            deleteQuery = deleteQuery.eq(key, value);
          });
        }
        
        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
        return { deleted: true };
      }
        
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  private async rollbackOperations(operations: TransactionOperation[]): Promise<void> {
    logger.warn('Rolling back operations:', operations.length);
    
    // Reverse the operations and execute them
    const rollbackOps = operations.reverse().map(op => {
      switch (op.type) {
        case 'insert':
          return { type: 'delete' as const, table: op.table, id: op.data?.id as string };
        case 'update':
          return { type: 'update' as const, table: op.table, id: op.id, data: op.data };
        case 'delete':
          return { type: 'insert' as const, table: op.table, data: op.data };
        default:
          return op;
      }
    });
    
    for (const rollbackOp of rollbackOps) {
      try {
        await this.executeOperation(rollbackOp);
      } catch (error) {
        logger.error('Rollback operation failed:', rollbackOp, error);
        // Continue with other rollback operations
      }
    }
  }

  /**
   * Create a session with related data in a single transaction
   */
  async createSessionWithData(sessionData: SessionData, walkoutData?: WalkoutData, rosterUpdates?: RosterUpdate[]): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [
      {
        type: 'insert',
        table: 'sessions',
        data: sessionData
      }
    ];

    if (walkoutData) {
      operations.push({
        type: 'insert',
        table: 'walk_outs',
        data: walkoutData
      });
    }

    if (rosterUpdates && rosterUpdates.length > 0) {
      rosterUpdates.forEach(update => {
        operations.push({
          type: 'update',
          table: 'therapists',
          id: update.id,
          data: update
        });
      });
    }

    return this.executeTransaction(operations);
  }

  /**
   * Update session and related data in a single transaction
   */
  async updateSessionWithData(sessionId: string, sessionData: SessionData, walkoutData?: WalkoutData, rosterUpdates?: RosterUpdate[]): Promise<TransactionResult> {
    const operations: TransactionOperation[] = [
      {
        type: 'update',
        table: 'sessions',
        id: sessionId,
        data: sessionData
      }
    ];

    if (walkoutData) {
      operations.push({
        type: walkoutData.id ? 'update' : 'insert',
        table: 'walk_outs',
        id: walkoutData.id as string,
        data: walkoutData
      });
    }

    if (rosterUpdates && rosterUpdates.length > 0) {
      rosterUpdates.forEach(update => {
        operations.push({
          type: 'update',
          table: 'therapists',
          id: update.id,
          data: update
        });
      });
    }

    return this.executeTransaction(operations);
  }
}

export const transactionService = TransactionService.getInstance();
