import supabase from '@/utils/supabase';

export interface ValidationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export class DatabaseValidator {
  static async validateSessionsTable(): Promise<ValidationResult> {
    try {
      // Test 1: Check if table exists and is accessible
      const { data: countData, error: countError } = await supabase
        .from('sessions')
        .select('count', { count: 'exact' });
      
      if (countError) {
        return {
          success: false,
          message: 'Sessions table is not accessible',
          details: {
            error: countError,
            possibleCauses: [
              'Table does not exist',
              'Row Level Security (RLS) is blocking access',
              'Insufficient permissions',
              'Database connection issues'
            ]
          }
        };
      }
      
      // Test 2: Check table structure by trying to select all columns
      const { error: structureError } = await supabase
        .from('sessions')
        .select('*')
        .limit(1);
      
      if (structureError) {
        return {
          success: false,
          message: 'Sessions table structure issue',
          details: {
            error: structureError,
            possibleCauses: [
              'Missing required columns',
              'Column type mismatches',
              'Foreign key constraint issues'
            ]
          }
        };
      }
      
      // Test 3: Check if we can insert a test record
      const testSession = {
        id: 'test-validation-' + Date.now(),
        therapist_ids: ['00000000-0000-0000-0000-000000000000'],
        service_id: '00000000-0000-0000-0000-000000000000',
        room_id: '00000000-0000-0000-0000-000000000000',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        discount: 0,
        total_price: 0,
        status: 'active',
        session_start_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('sessions')
        .insert([testSession])
        .select('*');
      
      if (insertError) {
        return {
          success: false,
          message: 'Cannot insert into sessions table',
          details: {
            error: insertError,
            testData: testSession,
            possibleCauses: [
              'Foreign key constraints (service_id, room_id, therapist_ids)',
              'Data type validation errors',
              'RLS policies blocking inserts',
              'Missing required fields'
            ]
          }
        };
      }
      
      // Clean up test record
      if (insertData && insertData.length > 0) {
        await supabase
          .from('sessions')
          .delete()
          .eq('id', testSession.id);
      }
      
      return {
        success: true,
        message: 'Sessions table validation passed',
        details: {
          recordCount: countData?.[0]?.count || 0,
          canSelect: true,
          canInsert: true,
          canDelete: true
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: 'Database validation failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      };
    }
  }
  
  static async validateDependencies(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    // Check therapists table
    try {
      const { error } = await supabase
        .from('therapists')
        .select('id')
        .limit(1);
      
      results.push({
        success: !error,
        message: error ? 'Therapists table issue' : 'Therapists table OK',
        details: error as unknown as Record<string, unknown>
      });
    } catch (error) {
      results.push({
        success: false,
        message: 'Therapists table validation failed',
        details: error as unknown as Record<string, unknown>
      });
    }
    
    // Check services table
    try {
      const { error } = await supabase
        .from('services')
        .select('id')
        .limit(1);
      
      results.push({
        success: !error,
        message: error ? 'Services table issue' : 'Services table OK',
        details: error as unknown as Record<string, unknown>
      });
    } catch (error) {
      results.push({
        success: false,
        message: 'Services table validation failed',
        details: error as unknown as Record<string, unknown>
      });
    }
    
    // Check rooms table
    try {
      const { error } = await supabase
        .from('rooms')
        .select('id')
        .limit(1);
      
      results.push({
        success: !error,
        message: error ? 'Rooms table issue' : 'Rooms table OK',
        details: error as unknown as Record<string, unknown>
      });
    } catch (error) {
      results.push({
        success: false,
        message: 'Rooms table validation failed',
        details: error as unknown as Record<string, unknown>
      });
    }
    
    return results;
  }
  
  static async runFullValidation(): Promise<{
    sessionsTable: ValidationResult;
    dependencies: ValidationResult[];
    overall: boolean;
  }> {
    const sessionsTable = await this.validateSessionsTable();
    const dependencies = await this.validateDependencies();
    
    const overall = sessionsTable.success && dependencies.every(dep => dep.success);
    
    return {
      sessionsTable,
      dependencies,
      overall
    };
  }
}
