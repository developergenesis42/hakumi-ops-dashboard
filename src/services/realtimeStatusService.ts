import { supabase } from '@/lib/supabase';
import { debugLog } from '@/config/environment';
import type { Therapist, Room, Session } from '@/types';

/**
 * Service for managing real-time status synchronization across devices
 * This ensures all devices see the same operational status (timers, room occupancy, etc.)
 */
export class RealtimeStatusService {
  private static instance: RealtimeStatusService;
  private subscriptions: Map<string, any> = new Map();

  static getInstance(): RealtimeStatusService {
    if (!RealtimeStatusService.instance) {
      RealtimeStatusService.instance = new RealtimeStatusService();
    }
    return RealtimeStatusService.instance;
  }

  /**
   * Update therapist status in database (single source of truth)
   */
  async updateTherapistStatus(
    therapistId: string, 
    status: Therapist['status'],
    currentSessionId?: string
  ): Promise<void> {
    try {
      debugLog('RealtimeStatusService: Updating therapist status:', therapistId, status);
      
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // If therapist is in session, we don't store the session ID in therapist table
      // The session table already has the therapist_ids relationship
      
      const { error } = await supabase
        .from('therapists')
        .update(updates)
        .eq('id', therapistId);

      if (error) {
        console.error('Failed to update therapist status:', error);
        throw error;
      }

      debugLog('RealtimeStatusService: Therapist status updated successfully');
    } catch (error) {
      console.error('RealtimeStatusService: Error updating therapist status:', error);
      throw error;
    }
  }

  /**
   * Update room status in database (single source of truth)
   */
  async updateRoomStatus(
    roomId: string, 
    status: Room['status'],
    currentSessionId?: string
  ): Promise<void> {
    try {
      debugLog('RealtimeStatusService: Updating room status:', roomId, status);
      
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', roomId);

      if (error) {
        console.error('Failed to update room status:', error);
        throw error;
      }

      debugLog('RealtimeStatusService: Room status updated successfully');
    } catch (error) {
      console.error('RealtimeStatusService: Error updating room status:', error);
      throw error;
    }
  }

  /**
   * Update session status in database (single source of truth)
   */
  async updateSessionStatus(
    sessionId: string,
    status: Session['status'],
    sessionStartTime?: Date,
    isInPrepPhase?: boolean
  ): Promise<void> {
    try {
      debugLog('RealtimeStatusService: Updating session status:', sessionId, status);
      
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (sessionStartTime) {
        updates.session_start_time = sessionStartTime.toISOString();
      }

      if (isInPrepPhase !== undefined) {
        updates.is_in_prep_phase = isInPrepPhase;
      }

      const { error } = await supabase
        .from('sessions')
        .update(updates)
        .eq('id', sessionId);

      if (error) {
        console.error('Failed to update session status:', error);
        throw error;
      }

      debugLog('RealtimeStatusService: Session status updated successfully');
    } catch (error) {
      console.error('RealtimeStatusService: Error updating session status:', error);
      throw error;
    }
  }

  /**
   * Subscribe to therapist status changes
   */
  subscribeToTherapistStatus(
    callback: (therapists: Therapist[]) => void
  ): () => void {
    debugLog('RealtimeStatusService: Subscribing to therapist status changes');
    
    const channel = supabase
      .channel('therapist-status-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'therapists' },
        async () => {
          try {
            const { data, error } = await supabase
              .from('therapists')
              .select('*')
              .order('name');

            if (error) {
              console.error('Failed to fetch therapists in real-time callback:', error);
              return;
            }

            const therapists: Therapist[] = data.map(row => ({
              id: row.id,
              name: row.name,
              status: row.status,
              totalEarnings: row.total_earnings,
              totalSessions: row.total_sessions,
              checkInTime: row.check_in_time,
              departureTime: row.departure_time,
              expenses: [] // Will be loaded separately
            }));

            callback(therapists);
          } catch (error) {
            console.error('Error in therapist status callback:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('therapist-status', channel);
    return () => this.unsubscribe('therapist-status');
  }

  /**
   * Subscribe to room status changes
   */
  subscribeToRoomStatus(
    callback: (rooms: Room[]) => void
  ): () => void {
    debugLog('RealtimeStatusService: Subscribing to room status changes');
    
    const channel = supabase
      .channel('room-status-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        async () => {
          try {
            const { data, error } = await supabase
              .from('rooms')
              .select('*')
              .order('name');

            if (error) {
              console.error('Failed to fetch rooms in real-time callback:', error);
              return;
            }

            const rooms: Room[] = data.map(row => ({
              id: row.id,
              name: row.name,
              type: row.type,
              status: row.status
            }));

            callback(rooms);
          } catch (error) {
            console.error('Error in room status callback:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('room-status', channel);
    return () => this.unsubscribe('room-status');
  }

  /**
   * Subscribe to session status changes
   */
  subscribeToSessionStatus(
    callback: (sessions: Session[]) => void
  ): () => void {
    debugLog('RealtimeStatusService: Subscribing to session status changes');
    
    const channel = supabase
      .channel('session-status-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async () => {
          try {
            const { data, error } = await supabase
              .from('sessions')
              .select(`
                *,
                services (*)
              `)
              .order('start_time', { ascending: false });

            if (error) {
              console.error('Failed to fetch sessions in real-time callback:', error);
              return;
            }

            const sessions: Session[] = data.map(row => {
              const service = {
                id: row.services.id,
                category: row.services.category,
                roomType: row.services.room_type,
                duration: row.services.duration,
                price: row.services.price,
                ladyPayout: row.services.lady_payout,
                shopRevenue: row.services.shop_revenue,
                description: row.services.description,
              };

              return {
                id: row.id,
                therapistIds: row.therapist_ids,
                roomId: row.room_id,
                service,
                startTime: row.start_time,
                endTime: row.end_time,
                actualEndTime: row.actual_end_time,
                status: row.status,
                totalPrice: row.total_price,
                discount: row.discount,
                actualDuration: row.actual_duration,
                sessionStartTime: row.session_start_time,
                prepStartTime: row.prep_start_time,
                isInPrepPhase: row.is_in_prep_phase
              };
            });

            callback(sessions);
          } catch (error) {
            console.error('Error in session status callback:', error);
          }
        }
      )
      .subscribe();

    this.subscriptions.set('session-status', channel);
    return () => this.unsubscribe('session-status');
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
      debugLog('RealtimeStatusService: Unsubscribed from', channelName);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    debugLog('RealtimeStatusService: Cleaning up all subscriptions');
    for (const [channelName, channel] of this.subscriptions) {
      supabase.removeChannel(channel);
    }
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const realtimeStatusService = RealtimeStatusService.getInstance();
