/**
 * Rate-Limited Supabase Service
 * Wraps Supabase calls with rate limiting to protect against abuse
 */

import { SupabaseClient, AuthResponse } from '@supabase/supabase-js';
import { rateLimiterManager, RATE_LIMIT_CONFIGS } from '@/services/rateLimiterService';
import { logger } from '@/utils/logger';
import type { Database } from '@/lib/supabase';
import type { Therapist, Room, Service, Session, WalkOut, WalkOutReason, DailyStats } from '@/types';

// Generic database record types
export type DatabaseRecord = Record<string, unknown>;
export type DatabaseInsert = Record<string, unknown>;
export type DatabaseUpdate = Record<string, unknown>;

// Database response types are defined but not currently used
// They can be uncommented when needed for specific database operations
/*
interface DailyStatsDBResponse {
  total_slips: number;
  total_revenue: number;
  total_payouts: number;
  total_discounts: number;
  shop_revenue: number;
  walk_out_count: number;
  completed_sessions: number;
}

interface TherapistDBResponse {
  id: string;
  name: string;
  status: string;
  total_earnings: number;
  total_sessions: number;
  created_at: string;
  updated_at: string;
}

interface RoomDBResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SessionDBResponse {
  id: string;
  therapist_ids: string[];
  service_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  discount: number;
  total_price: number;
  status: string;
  prep_start_time?: string;
  session_start_time?: string;
  is_in_prep_phase?: boolean;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    category: string;
    room_type: string;
    duration: number;
    price: number;
    lady_payout: number;
    shop_revenue: number;
    description: string;
  };
}

interface WalkOutDBResponse {
  id: string;
  session_id: string;
  therapist_ids: string[];
  service_id: string;
  total_amount: number;
  timestamp: string;
  count?: number;
  reason: string;
  created_at: string;
  updated_at: string;
  services?: {
    id: string;
    category: string;
    room_type: string;
    duration: number;
    price: number;
    lady_payout: number;
    shop_revenue: number;
    description: string;
  };
}
*/

// Rate limit error class
export class RateLimitError extends Error {
  public readonly statusCode: number = 429;
  public readonly retryAfter?: number;
  public readonly limiterName: string;

  constructor(message: string, limiterName: string, retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
    this.limiterName = limiterName;
    this.retryAfter = retryAfter;
  }
}

// Rate limited operation configuration
interface RateLimitedOperation {
  limiterName: keyof typeof RATE_LIMIT_CONFIGS;
  identifier?: string;
  skipRateLimit?: boolean;
}

// Enhanced Supabase service with rate limiting
export class RateLimitedSupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
    this.initializeRateLimiters();
  }

  /**
   * Initialize rate limiters for this service
   */
  private initializeRateLimiters(): void {
    // Ensure rate limiters are initialized
    if (rateLimiterManager.getStatusAll('test').auth_login === null) {
      Object.entries(RATE_LIMIT_CONFIGS).forEach(([name, config]) => {
        rateLimiterManager.addLimiter(name, config);
      });
    }
  }

  /**
   * Check rate limit before operation
   */
  private async checkRateLimit(operation: RateLimitedOperation, userIdentifier?: string): Promise<void> {
    if (operation.skipRateLimit) {
      return;
    }

    const identifier = operation.identifier || userIdentifier || 'anonymous';
    
    try {
      const result = await rateLimiterManager.check(operation.limiterName, identifier);
      
      if (!result.allowed) {
        logger.warn('Rate limit exceeded', {
          operation: operation.limiterName,
          identifier,
          remaining: result.remaining,
          retryAfter: result.retryAfter
        });
        
        throw new RateLimitError(
          `Rate limit exceeded for ${operation.limiterName}`,
          operation.limiterName,
          result.retryAfter
        );
      }

      logger.debug('Rate limit check passed', {
        operation: operation.limiterName,
        identifier,
        remaining: result.remaining
      });
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }
      
      logger.error('Rate limit check failed', {
        operation: operation.limiterName,
        identifier,
        error
      });
      
      // Don't block on rate limit check failures, but log them
    }
  }

  /**
   * Get current user identifier for rate limiting
   */
  private async getCurrentUserIdentifier(): Promise<string> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.id || 'anonymous';
    } catch (error) {
      logger.warn('Failed to get current user for rate limiting', { error });
      return 'anonymous';
    }
  }

  // ==================== THERAPIST OPERATIONS ====================

  /**
   * Get therapists with rate limiting
   */
  async getTherapists(options: RateLimitedOperation = { limiterName: 'API_GENERAL' }): Promise<Therapist[]> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('therapists')
      .select('*')
      .order('name');

    if (error) {
      logger.error('Failed to get therapists', { error, userIdentifier });
      throw error;
    }

    if (!data) {
      return [];
    }

    // Convert database format to app format
    return data.map((row: Database['public']['Tables']['therapists']['Row']) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      totalEarnings: row.total_earnings,
      totalSessions: row.total_sessions,
      expenses: [], // Initialize empty expenses array
    }));
  }

  /**
   * Update therapist with rate limiting
   */
  async updateTherapist(
    id: string, 
    updates: Partial<Therapist>,
    options: RateLimitedOperation = { limiterName: 'API_SENSITIVE' }
  ): Promise<Therapist> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const dbUpdates = {
      status: updates.status,
      total_earnings: updates.totalEarnings,
      total_sessions: updates.totalSessions,
    };

    const { data, error } = await this.supabase
      .from('therapists')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update therapist', { id, error, userIdentifier });
      throw error;
    }

    const therapistData = data as Database['public']['Tables']['therapists']['Row'];
    return {
      id: therapistData.id,
      name: therapistData.name,
      status: therapistData.status as Therapist['status'],
      totalEarnings: therapistData.total_earnings,
      totalSessions: therapistData.total_sessions,
      expenses: [],
    };
  }

  // ==================== ROOM OPERATIONS ====================

  /**
   * Get rooms with rate limiting
   */
  async getRooms(options: RateLimitedOperation = { limiterName: 'API_GENERAL' }): Promise<Room[]> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('rooms')
      .select('*')
      .order('name');

    if (error) {
      logger.error('Failed to get rooms', { error, userIdentifier });
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row: Database['public']['Tables']['rooms']['Row']) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.status,
    }));
  }

  /**
   * Update room with rate limiting
   */
  async updateRoom(
    id: string, 
    updates: Partial<Room>,
    options: RateLimitedOperation = { limiterName: 'API_SENSITIVE' }
  ): Promise<Room> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('rooms')
      .update({
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update room', { id, error, userIdentifier });
      throw error;
    }

    const roomData = data as Database['public']['Tables']['rooms']['Row'];
    return {
      id: roomData.id,
      name: roomData.name,
      type: roomData.type as Room['type'],
      status: roomData.status as Room['status'],
    };
  }

  // ==================== SERVICE OPERATIONS ====================

  /**
   * Get services with rate limiting
   */
  async getServices(options: RateLimitedOperation = { limiterName: 'API_GENERAL' }): Promise<Service[]> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('services')
      .select('*')
      .order('category', { ascending: true })
      .order('duration', { ascending: true });

    if (error) {
      logger.error('Failed to get services', { error, userIdentifier });
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row: Database['public']['Tables']['services']['Row']) => ({
      id: row.id,
      category: row.category,
      roomType: row.room_type,
      duration: row.duration,
      price: row.price,
      ladyPayout: row.lady_payout,
      shopRevenue: row.shop_revenue,
      description: row.description,
    }));
  }

  // ==================== SESSION OPERATIONS ====================

  /**
   * Get sessions with rate limiting
   */
  async getSessions(options: RateLimitedOperation = { limiterName: 'API_GENERAL' }): Promise<Session[]> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('sessions')
      .select(`
        *,
        services (*)
      `)
      .order('start_time', { ascending: false });

    if (error) {
      logger.error('Failed to get sessions', { error, userIdentifier });
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row: Database['public']['Tables']['sessions']['Row'] & { services: Database['public']['Tables']['services']['Row'] }) => {
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
        service: service as Service,
        roomId: row.room_id,
        startTime: new Date(row.start_time),
        endTime: new Date(row.end_time),
        discount: row.discount,
        totalPrice: row.total_price,
        status: row.status,
        prepStartTime: row.prep_start_time ? new Date(row.prep_start_time) : undefined,
        sessionStartTime: row.session_start_time ? new Date(row.session_start_time) : undefined,
        isInPrepPhase: row.is_in_prep_phase,
      };
    });
  }

  /**
   * Create session with rate limiting
   */
  async createSession(
    session: Omit<Session, 'id'>,
    options: RateLimitedOperation = { limiterName: 'SESSION_CREATE' }
  ): Promise<Session> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);


    const sessionInsert = {
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

    const { data, error } = await this.supabase
      .from('sessions')
      .insert(sessionInsert)
      .select(`
        *,
        services (*)
      `)
      .single();

    if (error) {
      logger.error('Failed to create session', { sessionInsert, error, userIdentifier });
      throw error;
    }

    const sessionData = data as Database['public']['Tables']['sessions']['Row'] & { services: Database['public']['Tables']['services']['Row'] };
    const service = {
      id: sessionData.services?.id || '',
      category: (sessionData.services?.category as Service['category']) || 'Single',
      roomType: (sessionData.services?.room_type as Service['roomType']) || 'Shower',
      duration: sessionData.services?.duration || 0,
      price: sessionData.services?.price || 0,
      ladyPayout: sessionData.services?.lady_payout || 0,
      shopRevenue: sessionData.services?.shop_revenue || 0,
      description: sessionData.services?.description || '',
    };

    return {
      id: sessionData.id,
      therapistIds: sessionData.therapist_ids,
      service: service as Service,
      roomId: sessionData.room_id,
      startTime: new Date(sessionData.start_time),
      endTime: new Date(sessionData.end_time),
      discount: sessionData.discount,
      totalPrice: sessionData.total_price,
      status: sessionData.status as Session['status'],
      prepStartTime: sessionData.prep_start_time ? new Date(sessionData.prep_start_time) : undefined,
      sessionStartTime: sessionData.session_start_time ? new Date(sessionData.session_start_time) : undefined,
      isInPrepPhase: sessionData.is_in_prep_phase,
    };
  }

  /**
   * Update session with rate limiting
   */
  async updateSession(
    id: string, 
    updates: Partial<Session>,
    options: RateLimitedOperation = { limiterName: 'API_SENSITIVE' }
  ): Promise<Session> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const updateData: Partial<Database['public']['Tables']['sessions']['Update']> = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.endTime) updateData.end_time = updates.endTime.toISOString();
    if (updates.prepStartTime) updateData.prep_start_time = updates.prepStartTime.toISOString();
    if (updates.sessionStartTime) updateData.session_start_time = updates.sessionStartTime.toISOString();
    if (updates.isInPrepPhase !== undefined) updateData.is_in_prep_phase = updates.isInPrepPhase;

    const { data, error } = await this.supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        services (*)
      `)
      .single();

    if (error) {
      logger.error('Failed to update session', { id, updateData, error, userIdentifier });
      throw error;
    }

    const sessionData = data as Database['public']['Tables']['sessions']['Row'] & { services: Database['public']['Tables']['services']['Row'] };
    const service = {
      id: sessionData.services?.id || '',
      category: (sessionData.services?.category as Service['category']) || 'Single',
      roomType: (sessionData.services?.room_type as Service['roomType']) || 'Shower',
      duration: sessionData.services?.duration || 0,
      price: sessionData.services?.price || 0,
      ladyPayout: sessionData.services?.lady_payout || 0,
      shopRevenue: sessionData.services?.shop_revenue || 0,
      description: sessionData.services?.description || '',
    };

    return {
      id: sessionData.id,
      therapistIds: sessionData.therapist_ids,
      service: service as Service,
      roomId: sessionData.room_id,
      startTime: new Date(sessionData.start_time),
      endTime: new Date(sessionData.end_time),
      discount: sessionData.discount,
      totalPrice: sessionData.total_price,
      status: sessionData.status as Session['status'],
      prepStartTime: sessionData.prep_start_time ? new Date(sessionData.prep_start_time) : undefined,
      sessionStartTime: sessionData.session_start_time ? new Date(sessionData.session_start_time) : undefined,
      isInPrepPhase: sessionData.is_in_prep_phase,
    };
  }

  // ==================== WALK-OUT OPERATIONS ====================

  /**
   * Get walk-outs with rate limiting
   */
  async getWalkOuts(options: RateLimitedOperation = { limiterName: 'API_GENERAL' }): Promise<WalkOut[]> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('walk_outs')
      .select(`
        *,
        services (*)
      `)
      .order('timestamp', { ascending: false });

    if (error) {
      logger.error('Failed to get walk-outs', { error, userIdentifier });
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map((row: Database['public']['Tables']['walk_outs']['Row'] & { services: Database['public']['Tables']['services']['Row'] | null }) => {
      const service = row.services ? {
        id: row.services.id,
        category: row.services.category,
        roomType: row.services.room_type,
        duration: row.services.duration,
        price: row.services.price,
        ladyPayout: row.services.lady_payout,
        shopRevenue: row.services.shop_revenue,
        description: row.services.description,
      } : null;

      return {
        id: row.id,
        sessionId: row.session_id,
        therapistIds: row.therapist_ids,
        service: service as Service,
        totalAmount: row.total_amount,
        timestamp: new Date(row.timestamp),
        count: row.count,
        reason: (row.reason || 'No Rooms') as WalkOutReason,
      };
    });
  }

  /**
   * Create walk-out with rate limiting
   */
  async createWalkOut(
    walkOut: Omit<WalkOut, 'id'>,
    options: RateLimitedOperation = { limiterName: 'API_SENSITIVE' }
  ): Promise<WalkOut> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const walkOutInsert = {
      session_id: walkOut.sessionId,
      therapist_ids: walkOut.therapistIds,
      service_id: walkOut.service?.id || '',
      total_amount: walkOut.totalAmount,
      timestamp: walkOut.timestamp.toISOString(),
      count: walkOut.count,
      reason: walkOut.reason,
    };

    const { data, error } = await this.supabase
      .from('walk_outs')
      .insert(walkOutInsert)
      .select(`
        *,
        services (*)
      `)
      .single();

    if (error) {
      logger.error('Failed to create walk-out', { walkOutInsert, error, userIdentifier });
      throw error;
    }

    const walkOutData = data as Database['public']['Tables']['walk_outs']['Row'] & { services: Database['public']['Tables']['services']['Row'] | null };
    const service = walkOutData.services ? {
      id: walkOutData.services.id,
      category: walkOutData.services.category as Service['category'],
      roomType: walkOutData.services.room_type as Service['roomType'],
      duration: walkOutData.services.duration,
      price: walkOutData.services.price,
      ladyPayout: walkOutData.services.lady_payout,
      shopRevenue: walkOutData.services.shop_revenue,
      description: walkOutData.services.description,
    } as Service : null;

    return {
      id: walkOutData.id,
      sessionId: walkOutData.session_id,
      therapistIds: walkOutData.therapist_ids,
      service,
      totalAmount: walkOutData.total_amount,
      timestamp: new Date(walkOutData.timestamp),
      count: walkOutData.count,
      reason: (walkOutData.reason || 'No Rooms') as WalkOutReason,
    };
  }

  // ==================== DAILY STATS OPERATIONS ====================

  /**
   * Get daily stats with rate limiting
   */
  async getDailyStats(
    date: string,
    options: RateLimitedOperation = { limiterName: 'API_GENERAL' }
  ): Promise<DailyStats | null> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase
      .from('daily_stats')
      .select('*')
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to get daily stats', { date, error, userIdentifier });
      throw error;
    }

    if (!data) {
      return null;
    }

    const statsData = data as Database['public']['Tables']['daily_stats']['Row'];
    return {
      totalSlips: statsData.total_slips,
      totalRevenue: statsData.total_revenue,
      totalPayouts: statsData.total_payouts,
      totalDiscounts: statsData.total_discounts,
      shopRevenue: statsData.shop_revenue,
      walkOutCount: statsData.walk_out_count,
      completedSessions: statsData.completed_sessions || 0,
    };
  }

  /**
   * Upsert daily stats with rate limiting
   */
  async upsertDailyStats(
    date: string,
    stats: DailyStats,
    options: RateLimitedOperation = { limiterName: 'API_SENSITIVE' }
  ): Promise<DailyStats> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const statsInsert = {
      date,
      total_slips: stats.totalSlips,
      total_revenue: stats.totalRevenue,
      total_payouts: stats.totalPayouts,
      total_discounts: stats.totalDiscounts,
      shop_revenue: stats.shopRevenue,
      walk_out_count: stats.walkOutCount,
    };

    const { data, error } = await this.supabase
      .from('daily_stats')
      .upsert(statsInsert, { onConflict: 'date' })
      .select()
      .single();

    if (error) {
      logger.error('Failed to upsert daily stats', { date, statsInsert, error, userIdentifier });
      throw error;
    }

    const statsData = data as Database['public']['Tables']['daily_stats']['Row'];
    return {
      totalSlips: statsData.total_slips,
      totalRevenue: statsData.total_revenue,
      totalPayouts: statsData.total_payouts,
      totalDiscounts: statsData.total_discounts,
      shopRevenue: statsData.shop_revenue,
      walkOutCount: statsData.walk_out_count,
      completedSessions: statsData.completed_sessions || 0,
    };
  }

  // ==================== AUTHENTICATION OPERATIONS ====================

  /**
   * Sign in with rate limiting
   */
  async signIn(
    email: string,
    password: string,
    options: RateLimitedOperation = { limiterName: 'AUTH_LOGIN', identifier: email }
  ): Promise<AuthResponse> {
    await this.checkRateLimit(options);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error('Authentication failed', { email, error });
      throw error;
    }

    logger.info('User signed in successfully', { userId: data.user?.id, email });
    return data;
  }

  /**
   * Sign out with rate limiting
   */
  async signOut(options: RateLimitedOperation = { limiterName: 'API_GENERAL' }): Promise<{ error: Error | null }> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { error } = await this.supabase.auth.signOut();

    if (error) {
      logger.error('Sign out failed', { error, userIdentifier });
      throw error;
    }

    logger.info('User signed out successfully', { userIdentifier });
    return { error: null };
  }

  /**
   * Refresh session with rate limiting
   */
  async refreshSession(options: RateLimitedOperation = { limiterName: 'AUTH_REFRESH' }): Promise<AuthResponse> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    await this.checkRateLimit(options, userIdentifier);

    const { data, error } = await this.supabase.auth.refreshSession();

    if (error) {
      logger.error('Session refresh failed', { error, userIdentifier });
      throw error;
    }

    return data;
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to real-time updates with rate limiting
   */
  subscribeToTherapists(
    callback: (therapists: Therapist[]) => void,
    options: RateLimitedOperation = { limiterName: 'REALTIME_SUBSCRIBE' }
  ) {
    // Check rate limit before subscribing
    this.checkRateLimit(options).catch(error => {
      logger.error('Rate limit check failed for real-time subscription', { error });
    });

    return this.supabase
      .channel('therapists')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'therapists' },
        async () => {
          try {
            const therapists = await this.getTherapists({ limiterName: 'API_GENERAL', skipRateLimit: true });
            callback(therapists);
          } catch (error) {
            logger.error('Failed to get therapists in real-time callback', { error });
          }
        }
      )
      .subscribe();
  }

  subscribeToSessions(
    callback: (sessions: Session[]) => void,
    options: RateLimitedOperation = { limiterName: 'REALTIME_SUBSCRIBE' }
  ) {
    // Check rate limit before subscribing
    this.checkRateLimit(options).catch(error => {
      logger.error('Rate limit check failed for real-time subscription', { error });
    });

    return this.supabase
      .channel('sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        async () => {
          try {
            const sessions = await this.getSessions({ limiterName: 'API_GENERAL', skipRateLimit: true });
            callback(sessions);
          } catch (error) {
            logger.error('Failed to get sessions in real-time callback', { error });
          }
        }
      )
      .subscribe();
  }

  subscribeToRooms(
    callback: (rooms: Room[]) => void,
    options: RateLimitedOperation = { limiterName: 'REALTIME_SUBSCRIBE' }
  ) {
    // Check rate limit before subscribing
    this.checkRateLimit(options).catch(error => {
      logger.error('Rate limit check failed for real-time subscription', { error });
    });

    return this.supabase
      .channel('rooms')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        async () => {
          try {
            const rooms = await this.getRooms({ limiterName: 'API_GENERAL', skipRateLimit: true });
            callback(rooms);
          } catch (error) {
            logger.error('Failed to get rooms in real-time callback', { error });
          }
        }
      )
      .subscribe();
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get rate limit status for current user
   */
  async getRateLimitStatus(): Promise<Record<string, unknown>> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    return rateLimiterManager.getStatusAll(userIdentifier);
  }

  /**
   * Reset rate limits for current user (admin only)
   */
  async resetRateLimits(limiterName?: string): Promise<void> {
    const userIdentifier = await this.getCurrentUserIdentifier();
    
    if (limiterName) {
      rateLimiterManager.reset(limiterName, userIdentifier);
    } else {
      // Reset all rate limiters
      Object.keys(RATE_LIMIT_CONFIGS).forEach(name => {
        rateLimiterManager.reset(name, userIdentifier);
      });
    }
    
    logger.info('Rate limits reset', { userIdentifier, limiterName });
  }
}
