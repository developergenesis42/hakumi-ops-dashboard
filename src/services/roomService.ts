import supabase from '@/utils/supabase';
import { Room } from '@/types';

/**
 * Room Service for database operations
 */
export const roomService = {
  /**
   * Get all rooms
   */
  getRooms: async (): Promise<Room[]> => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
      currentSession: undefined, // Will be set by session logic
    }));
  },

  /**
   * Update room status
   */
  updateRoomStatus: async (roomId: string, status: 'available' | 'occupied'): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to update room status:', error);
      throw error;
    }

    console.log(`✅ Room ${roomId} status updated to ${status}`);
  },

  /**
   * Mark room as occupied with current session
   */
  markRoomOccupied: async (roomId: string, sessionId: string): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ 
        status: 'occupied',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to mark room as occupied:', error);
      throw error;
    }

    console.log(`✅ Room ${roomId} marked as occupied for session ${sessionId}`);
  },

  /**
   * Mark room as available
   */
  markRoomAvailable: async (roomId: string): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ 
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to mark room as available:', error);
      throw error;
    }

    console.log(`✅ Room ${roomId} marked as available`);
  },

  /**
   * Reset all rooms to available (for day reset)
   */
  resetAllRooms: async (): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ 
        status: 'available',
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to reset all rooms:', error);
      throw error;
    }

    console.log('✅ All rooms reset to available');
  }
};
