import supabase from '@/utils/supabase';

export async function testSupabaseConnection() {
  try {
    // Test basic connection
    const { error } = await supabase
      .from('therapists')
      .select('count')
      .limit(1);
    
    if (error) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Test sessions table specifically
export async function testSessionsTable() {
  try {
    const { error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    if (error) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

// Test sessions table structure and permissions
export async function testSessionsTableStructure() {
  try {
    // Test if we can select from the table
    const { error: selectError } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (selectError) {
      return false;
    }
    
    // Test if we can insert a test record (then delete it)
    const testSession = {
      id: '00000000-0000-0000-0000-000000000000',
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
      return false;
    }
    
    // Clean up test record
    if (insertData && insertData.length > 0) {
      await supabase
        .from('sessions')
        .delete()
        .eq('id', testSession.id);
    }
    
    return true;
  } catch {
    return false;
  }
}
