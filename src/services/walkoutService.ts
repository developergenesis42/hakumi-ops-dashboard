import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type { WalkOut } from '@/types';

export class WalkoutService {
  private static instance: WalkoutService;

  static getInstance(): WalkoutService {
    if (!WalkoutService.instance) {
      WalkoutService.instance = new WalkoutService();
    }
    return WalkoutService.instance;
  }

  static async createWalkOut(walkOut: Omit<WalkOut, 'id'>): Promise<WalkOut> {
    const instance = WalkoutService.getInstance();
    return instance.addWalkOut(walkOut as WalkOut);
  }

  static async loadTodayWalkOuts(): Promise<WalkOut[]> {
    const instance = WalkoutService.getInstance();
    return instance.getWalkOuts();
  }

  static clearTodayWalkOutsFromLocalStorage(): void {
    try {
      localStorage.removeItem('todayWalkOuts');
      logger.info('Cleared today walk outs from localStorage');
    } catch (error) {
      logger.error('Failed to clear today walk outs from localStorage', error);
    }
  }

  async addWalkOut(walkOut: WalkOut): Promise<WalkOut> {
    try {
      const { data, error } = await supabase
        .from('walk_outs')
        .insert({
          session_id: walkOut.sessionId,
          therapist_ids: walkOut.therapistIds,
          service_id: walkOut.service?.id,
          total_amount: walkOut.totalAmount,
          timestamp: walkOut.timestamp.toISOString(),
          count: walkOut.count,
          reason: walkOut.reason,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Walk out added successfully', { walkOutId: data.id });
      return {
        ...walkOut,
        id: data.id,
      };
    } catch (error) {
      logger.error('Failed to add walk out', error);
      throw error;
    }
  }

  async getWalkOuts(): Promise<WalkOut[]> {
    try {
      const { data, error } = await supabase
        .from('walk_outs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data?.map(walkOut => ({
        ...walkOut,
        timestamp: new Date(walkOut.timestamp),
      })) || [];
    } catch (error) {
      logger.error('Failed to fetch walk outs', error);
      throw error;
    }
  }
}

export const walkoutService = WalkoutService.getInstance();