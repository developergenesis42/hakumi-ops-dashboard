import { supabase, type Database } from '@/lib/supabase';
import type { Therapist, Room, Service, Session, WalkOut, WalkOutReason, DailyStats, Expense } from '@/types';

// Type aliases for easier use
type TherapistRow = Database['public']['Tables']['therapists']['Row'];
type TherapistInsert = Database['public']['Tables']['therapists']['Insert'];
// type TherapistUpdate = Database['public']['Tables']['therapists']['Update'];

type RoomRow = Database['public']['Tables']['rooms']['Row'];
// type RoomInsert = Database['public']['Tables']['rooms']['Insert'];
// type RoomUpdate = Database['public']['Tables']['rooms']['Update'];

type ServiceRow = Database['public']['Tables']['services']['Row'];
// type ServiceInsert = Database['public']['Tables']['services']['Insert'];
// type ServiceUpdate = Database['public']['Tables']['services']['Update'];

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

type WalkOutRow = Database['public']['Tables']['walk_outs']['Row'];
type WalkOutInsert = Database['public']['Tables']['walk_outs']['Insert'];
// type WalkOutUpdate = Database['public']['Tables']['walk_outs']['Update'];

type DailyStatsRow = Database['public']['Tables']['daily_stats']['Row'];
type DailyStatsInsert = Database['public']['Tables']['daily_stats']['Insert'];
// type DailyStatsUpdate = Database['public']['Tables']['daily_stats']['Update'];

type ExpenseRow = Database['public']['Tables']['expenses']['Row'];
type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

// Helper functions to convert between app types and database types
const convertTherapistFromDB = (row: TherapistRow): Therapist => ({
  id: row.id,
  name: row.name,
  status: row.status,
  totalEarnings: row.total_earnings,
  totalSessions: row.total_sessions,
  expenses: [], // Initialize empty expenses array
});

const convertTherapistToDB = (therapist: Partial<Therapist>): Partial<TherapistInsert> => ({
  id: therapist.id,
  name: therapist.name,
  status: therapist.status,
  total_earnings: therapist.totalEarnings,
  total_sessions: therapist.totalSessions,
});

const convertRoomFromDB = (row: RoomRow): Room => ({
  id: row.id,
  name: row.name,
  type: row.type,
  status: row.status,
});

const convertServiceFromDB = (row: ServiceRow): Service => ({
  id: row.id,
  category: row.category,
  roomType: row.room_type,
  duration: row.duration,
  price: row.price,
  ladyPayout: row.lady_payout,
  shopRevenue: row.shop_revenue,
  description: row.description,
});

const convertSessionFromDB = (row: SessionRow, service: Service): Session => ({
  id: row.id,
  therapistIds: row.therapist_ids,
  service,
  roomId: row.room_id,
  startTime: new Date(row.start_time),
  endTime: new Date(row.end_time),
  discount: row.discount,
  totalPrice: row.total_price,
  status: row.status,
  prepStartTime: row.prep_start_time ? new Date(row.prep_start_time) : undefined,
  sessionStartTime: row.session_start_time ? new Date(row.session_start_time) : undefined,
  isInPrepPhase: row.is_in_prep_phase,
});

const convertWalkOutFromDB = (row: WalkOutRow, service: Service | null): WalkOut => ({
  id: row.id,
  sessionId: row.session_id,
  therapistIds: row.therapist_ids,
  service,
  totalAmount: row.total_amount,
  timestamp: new Date(row.timestamp),
  count: row.count,
  reason: (row.reason || 'No Rooms') as WalkOutReason,
});

const convertDailyStatsFromDB = (row: DailyStatsRow): DailyStats => ({
  totalSlips: row.total_slips,
  totalRevenue: row.total_revenue,
  totalPayouts: row.total_payouts,
  totalDiscounts: row.total_discounts,
  shopRevenue: row.shop_revenue,
  walkOutCount: row.walk_out_count,
  completedSessions: (row as DailyStatsRow & { completed_sessions?: number }).completed_sessions || 0,
});

const convertExpenseFromDB = (row: ExpenseRow): Expense => ({
  id: row.id,
  therapistId: row.therapist_id,
  type: row.type,
  amount: row.amount,
  description: row.description || '',
  timestamp: new Date(row.timestamp)
});

// Supabase Service Class
export class SupabaseService {
  // Therapists
  static async getTherapists(): Promise<Therapist[]> {
    const { data, error } = await supabase
      .from('therapists')
      .select('*')
      .order('name');

    if (error) throw error;
    return data.map(convertTherapistFromDB);
  }

  static async updateTherapist(id: string, updates: Partial<Therapist>): Promise<Therapist> {
    const dbUpdates = convertTherapistToDB(updates);
    const { data, error } = await supabase
      .from('therapists')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return convertTherapistFromDB(data);
  }

  // Rooms
  static async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('name');

    if (error) throw error;
    return data.map(convertRoomFromDB);
  }

  static async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms')
      .update({
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return convertRoomFromDB(data);
  }

  // Services
  static async getServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('duration', { ascending: true });

    if (error) throw error;
    return data.map(convertServiceFromDB);
  }

  // Sessions
  static async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        services (*)
      `)
      .order('start_time', { ascending: false });

    if (error) throw error;
    return data.map(row => convertSessionFromDB(row, convertServiceFromDB(row.services)));
  }

  static async createSession(session: Omit<Session, 'id'>): Promise<Session> {
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', session.service.id)
      .single();

    if (serviceError) throw serviceError;

    const sessionInsert: SessionInsert = {
      therapist_ids: session.therapistIds,
      service_id: session.service.id,
      room_id: session.roomId,
      start_time: session.startTime.toISOString(),
      end_time: session.endTime.toISOString(),
      discount: session.discount,
      total_price: session.totalPrice,
      status: session.status,
      prep_start_time: session.prepStartTime?.toISOString(),
      session_start_time: session.sessionStartTime?.toISOString(),
      is_in_prep_phase: session.isInPrepPhase,
    };

    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionInsert)
      .select()
      .single();

    if (error) throw error;
    return convertSessionFromDB(data, convertServiceFromDB(serviceData));
  }

  static async updateSession(id: string, updates: Partial<Session>): Promise<Session> {
    const updateData: Partial<SessionUpdate> = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
    if (updates.prepStartTime) updateData.prep_start_time = updates.prepStartTime.toISOString();
    if (updates.sessionStartTime) updateData.session_start_time = updates.sessionStartTime.toISOString();
    if (updates.isInPrepPhase !== undefined) updateData.is_in_prep_phase = updates.isInPrepPhase;

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        services (*)
      `)
      .single();

    if (error) throw error;
    return convertSessionFromDB(data, convertServiceFromDB(data.services));
  }

  // Walk Outs
  static async getWalkOuts(): Promise<WalkOut[]> {
    const { data, error } = await supabase
      .from('walk_outs')
      .select(`
        *,
        services (*)
      `)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data.map(row => convertWalkOutFromDB(row, row.services ? convertServiceFromDB(row.services) : null));
  }

  static async deleteAllWalkOuts(): Promise<void> {
    const { error } = await supabase
      .from('walk_outs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This deletes all records
    
    if (error) throw error;
  }

  static async createWalkOut(walkOut: Omit<WalkOut, 'id'>): Promise<WalkOut> {
    const walkOutInsert: WalkOutInsert = {
      session_id: walkOut.sessionId || '', // Use empty string instead of null
      therapist_ids: walkOut.therapistIds,
      service_id: walkOut.service?.id || '', // Use empty string instead of null
      total_amount: walkOut.totalAmount,
      timestamp: walkOut.timestamp.toISOString(),
      count: walkOut.count,
      reason: walkOut.reason,
    };

    const { data, error } = await supabase
      .from('walk_outs')
      .insert(walkOutInsert)
      .select(`
        *,
        services (*)
      `)
      .single();

    if (error) {
      console.error('❌ Walkout creation error:', error);
      throw error;
    }
    
    return convertWalkOutFromDB(data, data.services ? convertServiceFromDB(data.services) : null);
  }

  // Daily Stats
  static async getDailyStats(date: string): Promise<DailyStats | null> {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data ? convertDailyStatsFromDB(data) : null;
  }

  static async upsertDailyStats(date: string, stats: DailyStats): Promise<DailyStats> {
    const statsInsert: DailyStatsInsert = {
      date,
      total_slips: stats.totalSlips,
      total_revenue: stats.totalRevenue,
      total_payouts: stats.totalPayouts,
      total_discounts: stats.totalDiscounts,
      shop_revenue: stats.shopRevenue,
      walk_out_count: stats.walkOutCount,
    };

    const { data, error } = await supabase
      .from('daily_stats')
      .upsert(statsInsert, { onConflict: 'date' })
      .select()
      .single();

    if (error) throw error;
    return convertDailyStatsFromDB(data);
  }

  // Real-time subscriptions
  static subscribeToTherapists(callback: (therapists: Therapist[]) => void) {
    return supabase
      .channel('therapists')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'therapists' },
        async () => {
          const therapists = await this.getTherapists();
          callback(therapists);
        }
      )
      .subscribe();
  }

  static subscribeToSessions(callback: (sessions: Session[]) => void) {
    return supabase
      .channel('sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async () => {
          const sessions = await this.getSessions();
          callback(sessions);
        }
      )
      .subscribe();
  }

  static subscribeToRooms(callback: (rooms: Room[]) => void) {
    return supabase
      .channel('rooms')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        async () => {
          const rooms = await this.getRooms();
          callback(rooms);
        }
      )
      .subscribe();
  }

  // Expenses
  static async getExpensesByTherapistAndDate(therapistId: string, date: string = new Date().toISOString().split('T')[0]): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('therapist_id', therapistId)
      .eq('date', date)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ? data.map(convertExpenseFromDB) : [];
  }

  static async createExpense(expense: Omit<Expense, 'id'>): Promise<Expense> {
    const expenseInsert: ExpenseInsert = {
      therapist_id: expense.therapistId,
      type: expense.type,
      amount: expense.amount,
      description: expense.description || undefined,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseInsert])
      .select('*')
      .single();

    if (error) throw error;
    return convertExpenseFromDB(data);
  }

  static async updateExpense(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
    const updateData: ExpenseUpdate = {};
    
    if (updates.type) updateData.type = updates.type;
    if (updates.amount !== undefined) updateData.amount = updates.amount;
    if (updates.description !== undefined) updateData.description = updates.description;

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', expenseId)
      .select('*')
      .single();

    if (error) throw error;
    return convertExpenseFromDB(data);
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  }

  static subscribeToExpenses(callback: (expenses: Expense[]) => void, therapistId?: string) {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: true });

    if (therapistId) {
      query = query.eq('therapist_id', therapistId);
    }

    return supabase
      .channel('expenses')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        async () => {
          const { data, error } = await query;
          if (error) {
            console.error('Failed to fetch expenses in real-time:', error);
            return;
          }
          const expenses = data ? data.map(convertExpenseFromDB) : [];
          callback(expenses);
        }
      )
      .subscribe();
  }
}
