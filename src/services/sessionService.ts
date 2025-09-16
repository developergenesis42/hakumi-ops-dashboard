import supabase from '@/utils/supabase';
import { logger } from '@/utils/logger';
import type { Session } from '@/types';
import { debugLog } from '@/config/environment';
import { dataValidationService } from '@/services/dataValidationService';
import { dataSyncService } from '@/services/dataSyncService';
import { roomService } from '@/services/roomService';

// Type for session updates with string actualEndTime for database operations
export type SessionUpdate = Omit<Partial<Session>, 'actualEndTime'> & { 
  actualEndTime?: string; 
  actualDuration?: number;
  isInPrepPhase?: boolean;
};

// Database record types
export type SessionDatabaseRecord = Record<string, unknown>;
export type ServiceDatabaseRecord = Record<string, unknown>;

// Service object structure from database
interface ServiceFromDB {
  id: string;
  category: string;
  room_type: string;
  duration: number;
  price: number;
  lady_payout: number;
  shop_revenue: number;
  description: string;
}

// Database error structure
interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Convert Session to database format (snake_case)
const formatSessionForDB = (session: Session) => {
  const baseData = {
    id: session.id,
    therapist_ids: session.therapistIds,
    service_id: session.service.id,
    room_id: session.roomId,
    start_time: session.startTime.toISOString(),
    end_time: session.endTime.toISOString(),
    discount: session.discount,
    total_price: session.totalPrice,
    status: session.status,
    prep_start_time: session.prepStartTime?.toISOString() || null,
    session_start_time: session.sessionStartTime?.toISOString() || null,
    is_in_prep_phase: session.isInPrepPhase || false
    // Note: created_at and updated_at are handled by database defaults
  };

  // Only include actual timing fields if they have values (for updates)
  if (session.actualEndTime) {
    (baseData as SessionDatabaseRecord).actual_end_time = session.actualEndTime.toISOString();
  }
  if (session.actualDuration !== undefined && session.actualDuration !== null) {
    (baseData as SessionDatabaseRecord).actual_duration = session.actualDuration;
  }

  return baseData;
};

// Convert database format to Session (camelCase)
const formatSessionFromDB = (data: SessionDatabaseRecord, service: ServiceDatabaseRecord): Session => {
  const startTime = new Date(data.start_time as string);
  const sessionStartTime = data.session_start_time ? new Date(data.session_start_time as string) : startTime;
  
  return {
    id: data.id as string,
    therapistIds: data.therapist_ids as string[],
    service: service as ServiceFromDB,
    roomId: data.room_id as string,
    startTime: startTime,
    endTime: new Date(data.end_time as string),
    discount: data.discount as number,
    totalPrice: data.total_price as number,
    status: data.status as Session['status'],
    sessionStartTime: sessionStartTime
  };
};

export const sessionService = {
  // Create a new session
  createSession: async (session: Session): Promise<Session> => {
    // Validate session data before creating
    const validation = dataValidationService.validateSession(session);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Session validation failed: ${errorMessages}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        debugLog(`Session validation warning: ${warning.field} - ${warning.message}`);
      });
    }

    const sessionData = formatSessionForDB(session);
    debugLog('Creating session with data:', sessionData);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase insert timeout after 10 seconds')), 10000);
    });
    
    // Create the insert promise
    const insertPromise = supabase
      .from('sessions')
      .insert([sessionData])
      .select('*');

    // Race between insert and timeout
    const result = await Promise.race([insertPromise, timeoutPromise]);
    const { data, error } = result as { data: SessionDatabaseRecord[] | null; error: Error | null };

    if (error) {
      logger.error('❌ Session creation failed:', {
        error,
        sessionData,
        errorCode: (error as DatabaseError).code,
        errorMessage: error.message,
        errorDetails: (error as DatabaseError).details,
        hint: (error as DatabaseError).hint
      });
      
      // Provide more specific error messages based on error codes
      if ((error as DatabaseError).code === '23503') {
        throw new Error(`Foreign key constraint violation: Referenced therapist, service, or room does not exist. Check that all IDs are valid UUIDs from the database.`);
      } else if ((error as DatabaseError).code === '23514') {
        throw new Error(`Check constraint violation: Session data does not meet database requirements. Check therapist IDs, time constraints, or price values.`);
      } else if ((error as DatabaseError).code === '42501') {
        throw new Error(`Permission denied: Insufficient privileges to create sessions. Check database permissions.`);
      } else if ((error as DatabaseError).code === 'PGRST301') {
        throw new Error(`Row Level Security violation: Session creation blocked by security policy.`);
      } else {
        throw new Error(`Database error (${(error as DatabaseError).code}): ${error.message}`);
      }
    }

    if (!data || data.length === 0) {
      throw new Error('No session data returned from database');
    }

    // Mark room as occupied
    try {
      await roomService.markRoomOccupied(session.roomId, session.id);
    } catch (roomError) {
      logger.error('Failed to update room status:', roomError);
      // Don't throw here - session was created successfully, room status is secondary
    }

    // Add to sync queue for offline support
    dataSyncService.addToSyncQueue('sessions', [session], 'create');

    return session;
  },

  // Update an existing session
  updateSession: async (session: Session): Promise<Session> => {
    // Validate session data before updating
    const validation = dataValidationService.validateSession(session);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => `${e.field}: ${e.message}`).join(', ');
      throw new Error(`Session validation failed: ${errorMessages}`);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        debugLog(`Session validation warning: ${warning.field} - ${warning.message}`);
      });
    }

    const sessionData = formatSessionForDB(session);
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase update timeout after 10 seconds')), 10000);
    });
    
    // Create the update promise
    const updatePromise = supabase
      .from('sessions')
      .update(sessionData)
      .eq('id', session.id)
      .select(`
        *,
        services (
          id,
          category,
          room_type,
          duration,
          price,
          lady_payout,
          shop_revenue,
          description
        )
      `);

    // Race between update and timeout
    const result = await Promise.race([updatePromise, timeoutPromise]);
    const { data, error } = result as { data: SessionDatabaseRecord[] | null; error: Error | null };

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No session data returned');
    }

    const dbSession = data[0];
    const service = {
      id: (dbSession.services as ServiceFromDB).id,
      category: (dbSession.services as ServiceFromDB).category,
      roomType: (dbSession.services as ServiceFromDB).room_type,
      duration: (dbSession.services as ServiceFromDB).duration,
      price: (dbSession.services as ServiceFromDB).price,
      ladyPayout: (dbSession.services as ServiceFromDB).lady_payout,
      shopRevenue: (dbSession.services as ServiceFromDB).shop_revenue,
      description: (dbSession.services as ServiceFromDB).description
    };

    const updatedSession = formatSessionFromDB(dbSession, service);

    // Handle room status updates based on session status
    if (session.status === 'completed') {
      try {
        await roomService.markRoomAvailable(updatedSession.roomId);
      } catch (roomError) {
        logger.error('Failed to update room status to available:', roomError);
        // Don't throw here - session was updated successfully, room status is secondary
      }
    }
    
    // Add to sync queue for offline support
    dataSyncService.addToSyncQueue('sessions', [updatedSession], 'update');
    
    return updatedSession;
  },

  // Backward-compatible update method for partial updates
  updateSessionPartial: async (sessionId: string, updates: SessionUpdate): Promise<Session> => {
    const updateData: SessionDatabaseRecord = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.sessionStartTime) updateData.session_start_time = updates.sessionStartTime.toISOString();
    if (updates.actualEndTime) updateData.actual_end_time = updates.actualEndTime;
    if (updates.actualDuration) updateData.actual_duration = updates.actualDuration;
    if (updates.isInPrepPhase !== undefined) updateData.is_in_prep_phase = updates.isInPrepPhase;
    
    // Note: updated_at is handled by database trigger, don't set manually

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Supabase update timeout after 10 seconds')), 10000);
    });
    const updatePromise = supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select(`
        *,
        services (
          id,
          category,
          room_type,
          duration,
          price,
          lady_payout,
          shop_revenue,
          description
        )
      `);

    debugLog('Updating session with data:', { sessionId, updateData });

    // Race between update and timeout
    const result = await Promise.race([updatePromise, timeoutPromise]);
    const { data, error } = result as { data: SessionDatabaseRecord[] | null; error: Error | null };

    if (error) {
      logger.error('❌ Session update failed:', {
        error,
        sessionId,
        updateData,
        errorCode: (error as DatabaseError).code,
        errorMessage: error.message,
        errorDetails: (error as DatabaseError).details
      });
      throw error;
    }

    if (!data || data.length === 0) {
      logger.error('❌ No session data returned after update:', {
        sessionId,
        updateData,
        data,
        error
      });
      
      // Check if the session exists at all
      const { data: existingSession, error: checkError } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', sessionId)
        .single();
      
      if (checkError || !existingSession) {
        throw new Error(`Session with ID ${sessionId} does not exist in database`);
      } else {
        throw new Error(`Session exists but update returned no data. This might be a database constraint issue.`);
      }
    }

    const dbSession = data[0];
    const service = {
      id: (dbSession.services as ServiceFromDB).id,
      category: (dbSession.services as ServiceFromDB).category,
      roomType: (dbSession.services as ServiceFromDB).room_type,
      duration: (dbSession.services as ServiceFromDB).duration,
      price: (dbSession.services as ServiceFromDB).price,
      ladyPayout: (dbSession.services as ServiceFromDB).lady_payout,
      shopRevenue: (dbSession.services as ServiceFromDB).shop_revenue,
      description: (dbSession.services as ServiceFromDB).description
    };

    const updatedSession = formatSessionFromDB(dbSession, service);

    // Handle room status updates based on session status
    if (updates.status === 'completed') {
      try {
        await roomService.markRoomAvailable(updatedSession.roomId);
      } catch (roomError) {
        logger.error('Failed to update room status to available:', roomError);
        // Don't throw here - session was updated successfully, room status is secondary
      }
    }

    return updatedSession;
  },

  // Get all sessions for today
  getTodaySessions: async (): Promise<Session[]> => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        services (
          id,
          category,
          room_type,
          duration,
          price,
          lady_payout,
          shop_revenue,
          description
        )
      `)
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(dbSession => {
      const service = {
        id: dbSession.services.id,
        category: dbSession.services.category,
        roomType: dbSession.services.room_type,
        duration: dbSession.services.duration,
        price: dbSession.services.price,
        ladyPayout: dbSession.services.lady_payout,
        shopRevenue: dbSession.services.shop_revenue,
        description: dbSession.services.description
      };
      return formatSessionFromDB(dbSession, service);
    });
  },

  // Delete all sessions for today (for reset day functionality)
  deleteTodaySessions: async (): Promise<void> => {
    debugLog('🗑️ sessionService.deleteTodaySessions: Starting...');
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    debugLog('🗑️ sessionService.deleteTodaySessions: Date range:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    debugLog('🗑️ sessionService.deleteTodaySessions: Executing Supabase query...');
    const { error } = await supabase
      .from('sessions')
      .delete()
      .gte('start_time', startOfDay.toISOString())
      .lt('start_time', endOfDay.toISOString());

    debugLog('🗑️ sessionService.deleteTodaySessions: Supabase query completed');

    if (error) {
      logger.error('🗑️ sessionService.deleteTodaySessions: Supabase error:', error);
      throw error;
    }

    debugLog('✅ sessionService.deleteTodaySessions: Successfully completed');
  }
};
