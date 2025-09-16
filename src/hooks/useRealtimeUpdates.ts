import { useEffect, useCallback } from 'react';
import supabase from '@/utils/supabase';
import { useApp } from '@/hooks/useApp';
import { debugLog } from '@/config/environment';
import { mergeSessionsWithConflictResolution, logSessionSyncStatus } from '@/utils/sessionSyncUtils';

/**
 * Hook to set up real-time subscriptions for live updates across devices
 */
export function useRealtimeUpdates() {
  const { dispatch, state } = useApp();

  // Subscribe to daily roster changes
  const subscribeToRoster = useCallback(() => {
    debugLog('useRealtimeUpdates: Setting up roster subscription');
    
    const rosterChannel = supabase
      .channel('daily-roster-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'daily_rosters' },
        async (payload) => {
          debugLog('useRealtimeUpdates: Daily roster changed:', payload.eventType);
          
          // Fetch updated roster data
          try {
            const { data, error } = await supabase
              .from('daily_rosters')
              .select(`
                *,
                therapists (*)
              `)
              .eq('date', new Date().toISOString().split('T')[0])
              .order('created_at', { ascending: true });

            if (error) {
              console.error('Failed to fetch updated roster:', error);
              return;
            }

            // Convert to app format
            const therapists = data.map(row => ({
              id: row.therapists.id,
              name: row.therapists.name,
              status: row.status,
              totalEarnings: row.total_earnings || 0,
              totalSessions: row.total_sessions || 0,
              checkInTime: row.check_in_time ? new Date(row.check_in_time) : undefined,
              departureTime: row.departure_time ? new Date(row.departure_time) : undefined,
              expenses: row.expenses || [],
              currentSession: row.current_session_id ? { id: row.current_session_id } : undefined,
            }));

            dispatch({
              type: 'LOAD_TODAY_ROSTER',
              payload: therapists
            });

            debugLog('useRealtimeUpdates: Roster updated with', therapists.length, 'therapists');
            console.log('🔄 Real-time roster update:', therapists);
          } catch (error) {
            console.error('Error updating roster from real-time:', error);
          }
        }
      )
      .subscribe();

    return rosterChannel;
  }, [dispatch]);

  // Subscribe to sessions changes
  const subscribeToSessions = useCallback(() => {
    debugLog('useRealtimeUpdates: Setting up sessions subscription');
    
    const sessionsChannel = supabase
      .channel('sessions-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sessions' },
        async (payload) => {
          debugLog('useRealtimeUpdates: Sessions changed:', payload.eventType);
          
          // Fetch updated sessions data
          try {
            const { data, error } = await supabase
              .from('sessions')
              .select(`
                *,
                services (*)
              `)
              .order('created_at', { ascending: true });

            if (error) {
              console.error('Failed to fetch updated sessions:', error);
              return;
            }

            // Convert to app format
            const sessions = data.map(row => ({
              id: row.id,
              therapistIds: row.therapist_ids,
              service: {
                id: row.services.id,
                category: row.services.category,
                roomType: row.services.room_type,
                duration: row.services.duration,
                price: row.services.price,
                ladyPayout: row.services.lady_payout,
                shopRevenue: row.services.shop_revenue,
                description: row.services.description,
              },
              roomId: row.room_id,
              startTime: new Date(row.start_time),
              endTime: new Date(row.end_time),
              status: row.status,
              totalPrice: row.total_price,
              discount: row.discount,
              sessionStartTime: row.session_start_time ? new Date(row.session_start_time) : undefined,
              prepStartTime: row.prep_start_time ? new Date(row.prep_start_time) : undefined,
              isInPrepPhase: row.is_in_prep_phase || false,
              actualEndTime: row.actual_end_time ? new Date(row.actual_end_time) : undefined,
              actualDuration: row.actual_duration,
            }));

            // Get current local sessions for conflict resolution
            const currentSessions = state.sessions || [];
            
            // Merge with conflict resolution
            const mergedSessions = mergeSessionsWithConflictResolution(
              currentSessions,
              sessions,
              'newest' // Use newest data when conflicts occur
            );
            
            // Log sync status for debugging
            logSessionSyncStatus(
              currentSessions.length,
              sessions.length,
              [], // Conflicts are handled internally by merge function
              mergedSessions.length
            );

            dispatch({
              type: 'LOAD_SESSIONS',
              payload: mergedSessions
            });

            debugLog('useRealtimeUpdates: Sessions updated with', mergedSessions.length, 'sessions (merged)');
          } catch (error) {
            console.error('Error updating sessions from real-time:', error);
          }
        }
      )
      .subscribe();

    return sessionsChannel;
  }, [dispatch, state.sessions]);

  // Subscribe to walkouts changes
  const subscribeToWalkouts = useCallback(() => {
    debugLog('useRealtimeUpdates: Setting up walkouts subscription');
    
    const walkoutsChannel = supabase
      .channel('walkouts-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'walk_outs' },
        async (payload) => {
          debugLog('useRealtimeUpdates: Walkouts changed:', payload.eventType);
          
          // Fetch updated walkouts data
          try {
            const { data, error } = await supabase
              .from('walk_outs')
              .select(`
                *,
                services (*)
              `)
              .gte('timestamp', new Date().toISOString().split('T')[0]) // Today's walkouts only
              .order('timestamp', { ascending: false });

            if (error) {
              console.error('Failed to fetch updated walkouts:', error);
              return;
            }

            // Convert to app format
            const walkouts = data.map(row => ({
              id: row.id,
              sessionId: row.session_id,
              therapistIds: row.therapist_ids,
              service: row.services ? {
                id: row.services.id,
                category: row.services.category,
                roomType: row.services.room_type,
                duration: row.services.duration,
                price: row.services.price,
                ladyPayout: row.services.lady_payout,
                shopRevenue: row.services.shop_revenue,
                description: row.services.description,
              } : null,
              totalAmount: row.total_amount,
              timestamp: new Date(row.timestamp),
              count: row.count,
              reason: row.reason,
            }));

            dispatch({
              type: 'LOAD_WALK_OUTS',
              payload: walkouts
            });

            debugLog('useRealtimeUpdates: Walkouts updated with', walkouts.length, 'walkouts');
            console.log('🔄 Real-time walkouts update:', walkouts);
          } catch (error) {
            console.error('Error updating walkouts from real-time:', error);
          }
        }
      )
      .subscribe();

    return walkoutsChannel;
  }, [dispatch]);

  // Subscribe to rooms changes
  const subscribeToRooms = useCallback(() => {
    debugLog('useRealtimeUpdates: Setting up rooms subscription');
    
    const roomsChannel = supabase
      .channel('rooms-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        async (payload) => {
          debugLog('useRealtimeUpdates: Rooms changed:', payload.eventType);
          
          // Fetch updated rooms data
          try {
            const { data, error } = await supabase
              .from('rooms')
              .select('*')
              .order('name', { ascending: true });

            if (error) {
              console.error('Failed to fetch updated rooms:', error);
              return;
            }

            // Convert to app format
            const rooms = data.map(row => ({
              id: row.id,
              name: row.name,
              type: row.type,
              status: row.status,
              currentSession: undefined, // Will be updated by session logic
            }));

            dispatch({
              type: 'LOAD_ROOMS',
              payload: rooms
            });

            debugLog('useRealtimeUpdates: Rooms updated with', rooms.length, 'rooms');
            console.log('🔄 Real-time rooms update:', rooms);
          } catch (error) {
            console.error('Error updating rooms from real-time:', error);
          }
        }
      )
      .subscribe();

    return roomsChannel;
  }, [dispatch]);

  // Subscribe to expenses changes
  const subscribeToExpenses = useCallback(() => {
    debugLog('useRealtimeUpdates: Setting up expenses subscription');
    
    const expensesChannel = supabase
      .channel('expenses-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'expenses' },
        async (payload) => {
          debugLog('useRealtimeUpdates: Expenses changed:', payload.eventType);
          
          // Fetch updated expenses data for today
          try {
            const { data, error } = await supabase
              .from('expenses')
              .select('*')
              .eq('date', new Date().toISOString().split('T')[0])
              .order('created_at', { ascending: true });

            if (error) {
              console.error('Failed to fetch updated expenses:', error);
              return;
            }

            // Convert to app format
            const expenses = data.map(row => ({
              id: row.id,
              therapistId: row.therapist_id,
              type: row.expense_type,
              amount: row.amount,
              description: row.description || '',
              timestamp: new Date(row.created_at)
            }));

            // Update therapist expenses in the roster
            const updatedRoster = state.todayRoster.map(therapist => {
              const therapistExpenses = expenses.filter(expense => expense.therapistId === therapist.id);
              return {
                ...therapist,
                expenses: therapistExpenses
              };
            });

            dispatch({
              type: 'LOAD_TODAY_ROSTER',
              payload: updatedRoster
            });

            debugLog('useRealtimeUpdates: Expenses updated with', expenses.length, 'expenses');
            console.log('🔄 Real-time expenses update:', expenses);
          } catch (error) {
            console.error('Error updating expenses from real-time:', error);
          }
        }
      )
      .subscribe();

    return expensesChannel;
  }, [dispatch, state.todayRoster]);

  // Set up all subscriptions
  useEffect(() => {
    debugLog('useRealtimeUpdates: Setting up real-time subscriptions');
    console.log('🚀 Setting up real-time subscriptions...');
    
    const rosterChannel = subscribeToRoster();
    const sessionsChannel = subscribeToSessions();
    const walkoutsChannel = subscribeToWalkouts();
    const roomsChannel = subscribeToRooms();
    const expensesChannel = subscribeToExpenses();

    console.log('✅ All real-time subscriptions set up:', {
      roster: !!rosterChannel,
      sessions: !!sessionsChannel,
      walkouts: !!walkoutsChannel,
      rooms: !!roomsChannel,
      expenses: !!expensesChannel
    });

    // Cleanup on unmount
    return () => {
      debugLog('useRealtimeUpdates: Cleaning up real-time subscriptions');
      console.log('🧹 Cleaning up real-time subscriptions...');
      supabase.removeChannel(rosterChannel);
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(walkoutsChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(expensesChannel);
    };
  }, [subscribeToRoster, subscribeToSessions, subscribeToWalkouts, subscribeToRooms, subscribeToExpenses]);

  return {
    subscribeToRoster,
    subscribeToSessions,
    subscribeToWalkouts,
    subscribeToRooms,
    subscribeToExpenses,
  };
}
