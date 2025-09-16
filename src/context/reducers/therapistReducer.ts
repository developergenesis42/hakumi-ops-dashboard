import type { Therapist, Session, Expense } from '@/types';
import { debugLog } from '@/config/environment';

export interface TherapistState {
  therapists: Therapist[];
  todayRoster: Therapist[];
}

// Type guards for action payloads
function isTherapist(payload: unknown): payload is Therapist {
  return typeof payload === 'object' && payload !== null && 'id' in payload && 'name' in payload && 'status' in payload;
}

function isString(payload: unknown): payload is string {
  return typeof payload === 'string';
}

function isTherapistArray(payload: unknown): payload is Therapist[] {
  return Array.isArray(payload) && payload.every(isTherapist);
}

function isStatusUpdatePayload(payload: unknown): payload is { therapistId: string; status: Therapist['status']; currentSessionId?: string } {
  return typeof payload === 'object' && payload !== null && 'therapistId' in payload && 'status' in payload;
}

function isStatsUpdatePayload(payload: unknown): payload is { therapistId: string; earnings: number; sessions: number } {
  return typeof payload === 'object' && payload !== null && 'therapistId' in payload && 'earnings' in payload && 'sessions' in payload;
}

function isExpensePayload(payload: unknown): payload is { therapistId: string; expense: Expense } {
  return typeof payload === 'object' && payload !== null && 'therapistId' in payload && 'expense' in payload;
}

function isExpenseIdPayload(payload: unknown): payload is { therapistId: string; expenseId: string } {
  return typeof payload === 'object' && payload !== null && 'therapistId' in payload && 'expenseId' in payload;
}

function isTherapistDataPayload(payload: unknown): payload is { therapists: Therapist[] } {
  return typeof payload === 'object' && payload !== null && 'therapists' in payload && Array.isArray((payload as { therapists: unknown }).therapists);
}

function isSession(payload: unknown): payload is Session {
  return typeof payload === 'object' && payload !== null && 'id' in payload && 'therapistIds' in payload && 'service' in payload && 'status' in payload;
}

function isSessionArray(payload: unknown): payload is Session[] {
  return Array.isArray(payload) && payload.every(isSession);
}

export interface TherapistAction {
  type: 'ADD_TO_ROSTER' | 'REMOVE_FROM_ROSTER' | 'CLEAR_ROSTER' | 'CHECK_IN_THERAPIST' | 
        'DEPART_THERAPIST' | 'UPDATE_THERAPIST_STATUS' | 'UPDATE_THERAPIST_STATS' | 
        'ADD_EXPENSE' | 'REMOVE_EXPENSE' | 'LOAD_TODAY_ROSTER' | 'LOAD_SUPABASE_DATA' |
        'START_SESSION' | 'COMPLETE_SESSION' | 'MANUAL_ADD_SESSION' | 'LOAD_SESSIONS';
  payload?: Therapist | 
            string | 
            { therapistId: string; status: Therapist['status']; currentSessionId?: string } |
            { therapistId: string; earnings: number; sessions: number } |
            { therapistId: string; expense: Expense } |
            { therapistId: string; expenseId: string } |
            Therapist[] |
            { therapists: Therapist[] } |
            Session |
            Session[];
}

export function therapistReducer(state: TherapistState, action: TherapistAction): TherapistState {
  switch (action.type) {
    case 'ADD_TO_ROSTER': {
      if (!isTherapist(action.payload)) {
        debugLog('ADD_TO_ROSTER: Invalid payload type');
        return state;
      }
      
      const therapistToAdd = action.payload;
      debugLog('ADD_TO_ROSTER reducer called with:', therapistToAdd);
      debugLog('Current todayRoster length:', state.todayRoster.length);
      
      // Verify the therapist exists in the master list
      const masterTherapist = state.therapists.find(t => t.id === therapistToAdd.id);
      debugLog('Found master therapist:', masterTherapist);
      
      if (masterTherapist && !state.todayRoster.find(t => t.id === therapistToAdd.id)) {
        const updatedTherapist = { ...masterTherapist, status: 'inactive' as const };
        debugLog('Adding therapist to roster:', updatedTherapist);
        return {
          ...state,
          todayRoster: [...state.todayRoster, updatedTherapist]
        };
      }
      debugLog('Therapist not added - already exists or not found in master list');
      return state;
    }

    case 'REMOVE_FROM_ROSTER': {
      if (!isString(action.payload)) {
        debugLog('REMOVE_FROM_ROSTER: Invalid payload type');
        return state;
      }
      
      const therapistId = action.payload;
      const therapistToRemove = state.todayRoster.find(t => t.id === therapistId);
      debugLog('REMOVE_FROM_ROSTER reducer called with therapistId:', therapistId);
      debugLog('Therapist to remove:', therapistToRemove);
      debugLog('Current todayRoster length before removal:', state.todayRoster.length);
      
      const updatedRoster = state.todayRoster.filter(t => t.id !== therapistId);
      debugLog('Updated roster length after removal:', updatedRoster.length);
      
      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'CLEAR_ROSTER': {
      debugLog('CLEAR_ROSTER reducer called');
      debugLog('Current todayRoster length:', state.todayRoster.length);
      return {
        ...state,
        todayRoster: []
      };
    }

    case 'CHECK_IN_THERAPIST': {
      if (!isString(action.payload)) {
        debugLog('CHECK_IN_THERAPIST: Invalid payload type');
        return state;
      }
      
      const therapistId = action.payload;
      const checkedInTherapist = state.todayRoster.find(t => t.id === therapistId);
      if (!checkedInTherapist) return state;

      const checkInTime = new Date();
      const updatedRoster = state.todayRoster.map(therapist =>
        therapist.id === therapistId
          ? { ...therapist, status: 'available' as const, checkInTime }
          : therapist
      );

      // Update localStorage to persist the check-in status
      try {
        localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      } catch (error) {
        console.error('Failed to save roster to localStorage:', error);
      }

      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'DEPART_THERAPIST': {
      if (!isString(action.payload)) {
        debugLog('DEPART_THERAPIST: Invalid payload type');
        return state;
      }
      
      const therapistId = action.payload;
      const departedTherapist = state.todayRoster.find(t => t.id === therapistId);
      if (!departedTherapist) return state;

      const departureTime = new Date();
      
      // Mark therapist as departed instead of removing them
      const updatedRoster = state.todayRoster.map(therapist =>
        therapist.id === therapistId
          ? { ...therapist, status: 'departed' as const, departureTime }
          : therapist
      );

      // Update localStorage to persist the departure status
      try {
        localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      } catch (error) {
        console.error('Failed to save roster to localStorage:', error);
      }

      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'UPDATE_THERAPIST_STATUS': {
      if (!isStatusUpdatePayload(action.payload)) {
        debugLog('UPDATE_THERAPIST_STATUS: Invalid payload type');
        return state;
      }
      
      const statusPayload = action.payload;
      const updatedRoster = state.todayRoster.map(therapist => 
        therapist.id === statusPayload.therapistId 
          ? { 
              ...therapist, 
              status: statusPayload.status,
              currentSession: statusPayload.currentSessionId || undefined
            }
          : therapist
      );
      
      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'UPDATE_THERAPIST_STATS': {
      if (!isStatsUpdatePayload(action.payload)) {
        debugLog('UPDATE_THERAPIST_STATS: Invalid payload type');
        return state;
      }
      
      const statsPayload = action.payload;
      const updatedRoster = state.todayRoster.map(therapist => 
        therapist.id === statsPayload.therapistId 
          ? { 
              ...therapist, 
              totalEarnings: statsPayload.earnings,
              totalSessions: statsPayload.sessions
            }
          : therapist
      );
      
      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'ADD_EXPENSE': {
      if (!isExpensePayload(action.payload)) {
        debugLog('ADD_EXPENSE: Invalid payload type');
        return state;
      }
      
      const { therapistId, expense } = action.payload;
      const updatedRoster = state.todayRoster.map(therapist =>
        therapist.id === therapistId
          ? { ...therapist, expenses: [...(therapist.expenses || []), expense] }
          : therapist
      );

      // Save to Supabase asynchronously
      import('@/services/supabaseService').then(({ SupabaseService }) => {
        SupabaseService.createExpense({
          ...expense,
          therapistId
        }).catch((error: unknown) => {
          console.error('Failed to save expense to Supabase:', error);
        });
      });

      // Update localStorage to persist the expense
      try {
        localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      } catch (error) {
        console.error('Failed to save roster to localStorage:', error);
      }

      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'REMOVE_EXPENSE': {
      if (!isExpenseIdPayload(action.payload)) {
        debugLog('REMOVE_EXPENSE: Invalid payload type');
        return state;
      }
      
      const { therapistId, expenseId } = action.payload;
      const updatedRoster = state.todayRoster.map(therapist =>
        therapist.id === therapistId
          ? { ...therapist, expenses: (therapist.expenses || []).filter(expense => expense.id !== expenseId) }
          : therapist
      );

      // Delete from Supabase asynchronously
      import('@/services/supabaseService').then(({ SupabaseService }) => {
        SupabaseService.deleteExpense(expenseId).catch((error: unknown) => {
          console.error('Failed to delete expense from Supabase:', error);
        });
      });

      // Update localStorage to persist the expense removal
      try {
        localStorage.setItem('todayRoster', JSON.stringify(updatedRoster));
      } catch (error) {
        console.error('Failed to save roster to localStorage:', error);
      }

      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'LOAD_TODAY_ROSTER': {
      if (!isTherapistArray(action.payload)) {
        debugLog('LOAD_TODAY_ROSTER: Invalid payload type');
        return state;
      }
      
      // Ensure backward compatibility by adding expenses property if missing
      const rosterPayload = action.payload;
      const updatedRoster = rosterPayload.map((therapist: Therapist) => ({
        ...therapist,
        expenses: therapist.expenses || []
      }));
      
      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    case 'LOAD_SUPABASE_DATA': {
      if (!isTherapistDataPayload(action.payload)) {
        debugLog('LOAD_SUPABASE_DATA: Invalid payload type');
        return state;
      }
      
      // Ensure backward compatibility by adding expenses property if missing
      const dataPayload = action.payload;
      const updatedTherapists = dataPayload.therapists.map((therapist: Therapist) => ({
        ...therapist,
        expenses: therapist.expenses || []
      }));
      
      return {
        ...state,
        therapists: updatedTherapists
      };
    }

    case 'START_SESSION': {
      if (!isSession(action.payload)) {
        debugLog('START_SESSION: Invalid payload type');
        return state;
      }
      
      const newSession = action.payload;
      const updatedTherapists = state.todayRoster.map(t => {
        if (newSession.therapistIds.includes(t.id)) {
          // Set status to 'in-session' for scheduled sessions (prep phase)
          // This status will persist until timer starts or session is completed
          return { ...t, status: 'in-session' as const, currentSession: newSession };
        }
        return t;
      });

      return {
        ...state,
        todayRoster: updatedTherapists
      };
    }

    case 'COMPLETE_SESSION': {
      // Note: We need access to sessions data to complete the session
      // This will be handled by the main reducer that has access to all state
      return state;
    }

    case 'MANUAL_ADD_SESSION': {
      if (!isSession(action.payload)) {
        debugLog('MANUAL_ADD_SESSION: Invalid payload type');
        return state;
      }
      
      const sessionPayload = action.payload;
      const service = sessionPayload.service;
      const ladyPayout = service.ladyPayout;

      const therapistsAfterManual = state.todayRoster.map(t => {
        if (sessionPayload.therapistIds.includes(t.id)) {
          const individualPayout = sessionPayload.therapistIds.length > 1 
            ? ladyPayout / sessionPayload.therapistIds.length 
            : ladyPayout;
          return {
            ...t,
            totalEarnings: (t.totalEarnings || 0) + individualPayout,
            totalSessions: (t.totalSessions || 0) + 1
          };
        }
        return t;
      });

      return {
        ...state,
        todayRoster: therapistsAfterManual
      };
    }

    case 'LOAD_SESSIONS': {
      if (!isSessionArray(action.payload)) {
        debugLog('LOAD_SESSIONS: Invalid payload type');
        return state;
      }
      
      const loadedSessions = action.payload;
      
      // Update therapist currentSession fields based on loaded sessions
      const updatedRoster = state.todayRoster.map(therapist => {
        // Find active session for this therapist (both in_progress and scheduled)
        const activeSession = loadedSessions.find((session: Session) => 
          (session.status === 'in_progress' || session.status === 'scheduled') && 
          session.therapistIds.includes(therapist.id)
        );
        
        if (activeSession) {
          return {
            ...therapist,
            status: 'in-session' as const,
            currentSession: activeSession
          };
        }
        
        return therapist;
      });

      return {
        ...state,
        todayRoster: updatedRoster
      };
    }

    default:
      return state;
  }
}