import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { Therapist } from '@/types';

export class RosterService {
  private static instance: RosterService;

  static getInstance(): RosterService {
    if (!RosterService.instance) {
      RosterService.instance = new RosterService();
    }
    return RosterService.instance;
  }

  async getTherapists(): Promise<Therapist[]> {
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .order('name');

      if (error) throw error;

      logger.info('Therapists fetched successfully', { count: data?.length });
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch therapists', error);
      throw error;
    }
  }

  async updateTherapistStats(therapistId: string, earnings: number, sessions: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('therapists')
        .update({ 
          total_earnings: earnings,
          total_sessions: sessions,
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId);

      if (error) throw error;

      logger.info('Therapist stats updated', { therapistId, earnings, sessions });
    } catch (error) {
      logger.error('Failed to update therapist stats', error);
      throw error;
    }
  }

  async updateTherapistStatus(therapistId: string, status: string, currentSessionId?: string): Promise<void> {
    try {
      const updateData: Record<string, unknown> = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (currentSessionId) {
        updateData.current_session_id = currentSessionId;
      }

      const { error } = await supabase
        .from('therapists')
        .update(updateData)
        .eq('id', therapistId);

      if (error) throw error;

      logger.info('Therapist status updated', { therapistId, status, currentSessionId });
    } catch (error) {
      logger.error('Failed to update therapist status', error);
      throw error;
    }
  }

  async getTodayRoster(): Promise<Therapist[]> {
    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .eq('status', 'available')
        .or('status.eq.in-session,status.eq.departed')
        .order('name');

      if (error) throw error;

      logger.info('Today roster fetched successfully', { count: data?.length });
      return data || [];
    } catch (error) {
      logger.error('Failed to fetch today roster', error);
      throw error;
    }
  }

  async addToTodayRoster(therapistId: string): Promise<Therapist> {
    try {
      const { data, error } = await supabase
        .from('therapists')
        .update({ 
          status: 'available',
          check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Therapist added to today roster', { therapistId });
      return data;
    } catch (error) {
      logger.error('Failed to add therapist to today roster', error);
      throw error;
    }
  }

  async removeFromTodayRoster(therapistId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('therapists')
        .update({ 
          status: 'inactive',
          departure_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId);

      if (error) throw error;

      logger.info('Therapist removed from today roster', { therapistId });
    } catch (error) {
      logger.error('Failed to remove therapist from today roster', error);
      throw error;
    }
  }

  async clearTodayRoster(): Promise<void> {
    try {
      const { error } = await supabase
        .from('therapists')
        .update({ 
          status: 'inactive',
          check_in_time: null,
          departure_time: null,
          updated_at: new Date().toISOString()
        })
        .neq('status', 'inactive');

      if (error) throw error;

      logger.info('Today roster cleared');
    } catch (error) {
      logger.error('Failed to clear today roster', error);
      throw error;
    }
  }

  async updateCheckInTime(therapistId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('therapists')
        .update({ 
          check_in_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId);

      if (error) throw error;

      logger.info('Therapist check-in time updated', { therapistId });
    } catch (error) {
      logger.error('Failed to update check-in time', error);
      throw error;
    }
  }

  async updateDepartureTime(therapistId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('therapists')
        .update({ 
          departure_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', therapistId);

      if (error) throw error;

      logger.info('Therapist departure time updated', { therapistId });
    } catch (error) {
      logger.error('Failed to update departure time', error);
      throw error;
    }
  }

  async clearAllTodayData(): Promise<void> {
    try {
      // Reset all therapists to inactive
      const { error: therapistsError } = await supabase
        .from('therapists')
        .update({ 
          status: 'inactive',
          check_in_time: null,
          departure_time: null,
          updated_at: new Date().toISOString()
        });

      if (therapistsError) throw therapistsError;

      // Clear all sessions for today
      const today = new Date().toISOString().split('T')[0];
      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .gte('start_time', today)
        .lt('start_time', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString());

      if (sessionsError) throw sessionsError;

      logger.info('All today data cleared');
    } catch (error) {
      logger.error('Failed to clear all today data', error);
      throw error;
    }
  }
}

export const rosterService = RosterService.getInstance();