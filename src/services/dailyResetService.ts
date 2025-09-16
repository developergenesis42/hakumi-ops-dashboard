import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export class DailyResetService {
  private static instance: DailyResetService;

  static getInstance(): DailyResetService {
    if (!DailyResetService.instance) {
      DailyResetService.instance = new DailyResetService();
    }
    return DailyResetService.instance;
  }

  async resetDailyData(): Promise<void> {
    try {
      logger.info('Starting daily reset process');

      // Reset therapist statuses
      const { error: therapistError } = await supabase
        .from('therapists')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .neq('status', 'inactive');

      if (therapistError) throw therapistError;

      // Reset room statuses
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ 
          status: 'available',
          updated_at: new Date().toISOString()
        })
        .neq('status', 'available');

      if (roomError) throw roomError;

      logger.info('Daily reset completed successfully');
    } catch (error) {
      logger.error('Daily reset failed', error);
      throw error;
    }
  }

  async archiveDailyData(): Promise<void> {
    try {
      logger.info('Starting daily data archival');

      // Archive completed sessions
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ 
          archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('status', 'completed')
        .is('archived', null);

      if (sessionError) throw sessionError;

      logger.info('Daily data archival completed');
    } catch (error) {
      logger.error('Daily data archival failed', error);
      throw error;
    }
  }

}

export const dailyResetService = DailyResetService.getInstance();