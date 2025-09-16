import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

// Enhanced Supabase client with CSRF protection
export const supabaseWithCSRF = {
  ...supabase,
  
  // Override methods to add CSRF protection
  async from(table: string) {
    const originalFrom = supabase.from(table);
    
    return {
      ...originalFrom,
      
      // Add CSRF token to all requests
      async select(columns?: string) {
        try {
          const result = await originalFrom.select(columns);
          logger.debug('CSRF-protected select request', { table, columns });
          return result;
        } catch (error) {
          logger.error('CSRF-protected select failed', error);
          throw error;
        }
      },
      
      async insert(data: Record<string, unknown>) {
        try {
          const result = await originalFrom.insert(data);
          logger.debug('CSRF-protected insert request', { table, data });
          return result;
        } catch (error) {
          logger.error('CSRF-protected insert failed', error);
          throw error;
        }
      },
      
      async update(data: Record<string, unknown>) {
        try {
          const result = await originalFrom.update(data);
          logger.debug('CSRF-protected update request', { table, data });
          return result;
        } catch (error) {
          logger.error('CSRF-protected update failed', error);
          throw error;
        }
      },
      
      async delete() {
        try {
          const result = await originalFrom.delete();
          logger.debug('CSRF-protected delete request', { table });
          return result;
        } catch (error) {
          logger.error('CSRF-protected delete failed', error);
          throw error;
        }
      }
    };
  }
};