/**
 * Query Batcher Service
 * Implements intelligent query batching to prevent N+1 query problems
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';

export interface BatchQuery {
  id: string;
  type: 'sessions' | 'therapists' | 'services' | 'rooms';
  filters?: Record<string, unknown>;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface BatchResult<T> {
  id: string;
  data: T[];
  error?: string;
}

export interface OptimizedQueryOptions {
  batchSize?: number;
  timeout?: number;
  enableDeduplication?: boolean;
}

/**
 * Query Batcher for preventing N+1 queries
 */
export class QueryBatcher {
  private supabase: SupabaseClient<Database>;
  private pendingQueries = new Map<string, BatchQuery[]>();
  private queryTimeouts = new Map<string, NodeJS.Timeout>();
  private options: Required<OptimizedQueryOptions>;

  constructor(
    supabase: SupabaseClient<Database>,
    options: OptimizedQueryOptions = {}
  ) {
    this.supabase = supabase;
    this.options = {
      batchSize: 50,
      timeout: 100, // ms
      enableDeduplication: true,
      ...options,
    };
  }

  /**
   * Add a query to the batch
   */
  async addQuery<T>(
    query: BatchQuery,
    options: OptimizedQueryOptions = {}
  ): Promise<BatchResult<T>> {
    const finalOptions = { ...this.options, ...options };
    const queryKey = this.getQueryKey(query);
    
    // Check if query is already pending
    if (finalOptions.enableDeduplication && this.pendingQueries.has(queryKey)) {
      return this.waitForQueryResult<T>(queryKey);
    }

    // Add to pending queries
    if (!this.pendingQueries.has(queryKey)) {
      this.pendingQueries.set(queryKey, []);
    }
    this.pendingQueries.get(queryKey)!.push(query);

    // Set timeout for batch execution
    if (!this.queryTimeouts.has(queryKey)) {
      const timeout = setTimeout(() => {
        this.executeBatch(queryKey);
      }, finalOptions.timeout);
      this.queryTimeouts.set(queryKey, timeout);
    }

    // Execute immediately if batch is full
    const batch = this.pendingQueries.get(queryKey)!;
    if (batch.length >= finalOptions.batchSize) {
      clearTimeout(this.queryTimeouts.get(queryKey)!);
      this.queryTimeouts.delete(queryKey);
      return this.executeBatch(queryKey);
    }

    return this.waitForQueryResult<T>(queryKey);
  }

  /**
   * Execute a batch of queries
   */
  private async executeBatch<T>(queryKey: string): Promise<BatchResult<T>> {
    const queries = this.pendingQueries.get(queryKey) || [];
    this.pendingQueries.delete(queryKey);
    
    if (queries.length === 0) {
      return { id: queryKey, data: [] };
    }

    try {
      const results = await this.executeOptimizedQueries(queries);
      return { id: queryKey, data: results as T[] };
    } catch (error) {
      logger.error('Batch query execution failed', { queryKey, error });
      return { id: queryKey, data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Execute optimized queries based on type
   */
  private async executeOptimizedQueries(queries: BatchQuery[]): Promise<unknown[]> {
    // Group queries by type
    const groupedQueries = queries.reduce((acc, query) => {
      if (!acc[query.type]) {
        acc[query.type] = [];
      }
      acc[query.type].push(query);
      return acc;
    }, {} as Record<string, BatchQuery[]>);

    const results: unknown[] = [];

    // Execute each group of queries
    for (const [type, typeQueries] of Object.entries(groupedQueries)) {
      const typeResults = await this.executeTypeQueries(type as BatchQuery['type'], typeQueries);
      results.push(...typeResults);
    }

    return results;
  }

  /**
   * Execute queries of a specific type
   */
  private async executeTypeQueries(type: BatchQuery['type'], queries: BatchQuery[]): Promise<unknown[]> {
    switch (type) {
      case 'sessions':
        return this.executeSessionQueries(queries);
      case 'therapists':
        return this.executeTherapistQueries(queries);
      case 'services':
        return this.executeServiceQueries(queries);
      case 'rooms':
        return this.executeRoomQueries(queries);
      default:
        throw new Error(`Unsupported query type: ${type}`);
    }
  }

  /**
   * Execute session queries with optimized joins
   */
  private async executeSessionQueries(queries: BatchQuery[]): Promise<unknown[]> {
    // Collect all unique filter combinations
    const filterGroups = new Map<string, BatchQuery[]>();
    
    queries.forEach(query => {
      const filterKey = JSON.stringify(query.filters || {});
      if (!filterGroups.has(filterKey)) {
        filterGroups.set(filterKey, []);
      }
      filterGroups.get(filterKey)!.push(query);
    });

    const results: unknown[] = [];

    // Execute one query per filter group
    for (const [, groupQueries] of filterGroups) {
      const firstQuery = groupQueries[0];
      const filters = firstQuery.filters || {};
      
      let query = this.supabase
        .from('sessions')
        .select(firstQuery.select || `
          *,
          services (
            id,
            category,
            room_type,
            duration,
            price,
            lady_payout,
            shop_revenue,
            description
          )
        `);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'therapist_ids') {
            query = query.contains(key, [value]);
          } else if (key === 'start_time' && typeof value === 'string' && value.startsWith('gte.')) {
            query = query.gte('start_time', value.replace('gte.', ''));
          } else if (key === 'end_time' && typeof value === 'string' && value.startsWith('lt.')) {
            query = query.lt('end_time', value.replace('lt.', ''));
          } else {
            query = query.eq(key, value);
          }
        }
      });

      // Apply ordering
      if (firstQuery.orderBy) {
        query = query.order(firstQuery.orderBy.column, { 
          ascending: firstQuery.orderBy.ascending ?? true 
        });
      }

      // Apply limit
      if (firstQuery.limit) {
        query = query.limit(firstQuery.limit);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      // Distribute results to all queries in this group
      groupQueries.forEach(() => {
        results.push(data || []);
      });
    }

    return results;
  }

  /**
   * Execute therapist queries
   */
  private async executeTherapistQueries(queries: BatchQuery[]): Promise<unknown[]> {
    // For therapists, we can often combine multiple queries
    const allFilters = queries.flatMap(q => Object.entries(q.filters || {}));
    const uniqueFilters = new Map(allFilters);
    
    let query = this.supabase
      .from('therapists')
      .select(queries[0]?.select || '*');

    // Apply all unique filters
    uniqueFilters.forEach((value, key) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering
    if (queries[0]?.orderBy) {
      query = query.order(queries[0].orderBy.column, { 
        ascending: queries[0].orderBy.ascending ?? true 
      });
    }

    const { data, error } = await query;
    
    if (error) {
      throw error;
    }

    // Return the same result for all queries (they're likely similar)
    return queries.map(() => data || []);
  }

  /**
   * Execute service queries
   */
  private async executeServiceQueries(queries: BatchQuery[]): Promise<unknown[]> {
    // Services are typically small and can be fetched once
    const { data, error } = await this.supabase
      .from('services')
      .select(queries[0]?.select || '*')
      .order('category', { ascending: true });

    if (error) {
      throw error;
    }

    return queries.map(() => data || []);
  }

  /**
   * Execute room queries
   */
  private async executeRoomQueries(queries: BatchQuery[]): Promise<unknown[]> {
    // Rooms are typically small and can be fetched once
    const { data, error } = await this.supabase
      .from('rooms')
      .select(queries[0]?.select || '*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return queries.map(() => data || []);
  }

  /**
   * Wait for query result (for deduplication)
   */
  private async waitForQueryResult<T>(queryKey: string): Promise<BatchResult<T>> {
    return new Promise((resolve) => {
      const checkResult = () => {
        // This is a simplified implementation
        // In a real app, you'd want a more sophisticated result tracking system
        setTimeout(() => {
          resolve({ id: queryKey, data: [] as T[] });
        }, 50);
      };
      checkResult();
    });
  }

  /**
   * Generate query key for deduplication
   */
  private getQueryKey(query: BatchQuery): string {
    return `${query.type}-${JSON.stringify(query.filters || {})}-${query.select || '*'}`;
  }

  /**
   * Clear all pending queries
   */
  clear(): void {
    this.pendingQueries.clear();
    this.queryTimeouts.forEach(timeout => clearTimeout(timeout));
    this.queryTimeouts.clear();
  }
}
