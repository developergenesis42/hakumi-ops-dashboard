import type { AppState, AppAction, Service } from '@/types';
import { sessionReducer } from '@/context/reducers/sessionReducer';
import { therapistReducer } from '@/context/reducers/therapistReducer';
import { roomReducer } from '@/context/reducers/roomReducer';
import { walkOutReducer } from '@/context/reducers/walkOutReducer';
import { statsReducer, calculateSessionCompletionStats, calculateDepartureStats, calculateCloseOutStats } from '@/context/reducers/statsReducer';
import { appReducer, updateUndoStack, addHistoryEntry } from '@/context/reducers/appReducer';

// Type for the combined state
export interface CombinedState {
  sessions: AppState['sessions'];
  therapists: AppState['therapists'];
  todayRoster: AppState['todayRoster'];
  rooms: AppState['rooms'];
  walkOuts: AppState['walkOuts'];
  dailyStats: AppState['dailyStats'];
  currentPhase: AppState['currentPhase'];
  history: AppState['history'];
  undoStack: AppState['undoStack'];
  services: AppState['services'];
}

// Helper function to extract state slices for individual reducers
function extractStateSlices(state: AppState) {
  return {
    sessionState: { sessions: state.sessions },
    therapistState: { therapists: state.therapists, todayRoster: state.todayRoster },
    roomState: { rooms: state.rooms },
    walkOutState: { walkOuts: state.walkOuts },
    statsState: { dailyStats: state.dailyStats },
    appState: { 
      currentPhase: state.currentPhase, 
      history: state.history, 
      undoStack: state.undoStack 
    }
  };
}

// Helper function to combine state slices back into full state
function combineStateSlices(
  sessionState: { sessions: AppState['sessions'] },
  therapistState: { therapists: AppState['therapists']; todayRoster: AppState['todayRoster'] },
  roomState: { rooms: AppState['rooms'] },
  walkOutState: { walkOuts: AppState['walkOuts'] },
  statsState: { dailyStats: AppState['dailyStats'] },
  appState: { currentPhase: AppState['currentPhase']; history: AppState['history']; undoStack: AppState['undoStack'] },
  originalState: AppState
): AppState {
  return {
    ...originalState,
    sessions: sessionState.sessions,
    therapists: therapistState.therapists,
    todayRoster: therapistState.todayRoster,
    rooms: roomState.rooms,
    walkOuts: walkOutState.walkOuts,
    dailyStats: statsState.dailyStats,
    currentPhase: appState.currentPhase,
    history: appState.history,
    undoStack: appState.undoStack
  };
}

export function combinedAppReducer(state: AppState, action: AppAction): AppState {
  // Handle undo action first
  if (action.type === 'UNDO_ACTION') {
    return action.payload.state;
  }

  // Handle reset day
  if (action.type === 'RESET_DAY') {
    const { sessionState, therapistState, roomState, walkOutState, statsState, appState } = extractStateSlices(state);
    
    const newSessionState = sessionReducer(sessionState, { type: 'LOAD_SESSIONS', payload: [] });
    const newTherapistState = therapistReducer(therapistState, { type: 'CLEAR_ROSTER' });
    const newRoomState = roomReducer(roomState, { type: 'RESET_DAY' });
    const newWalkOutState = walkOutReducer(walkOutState, { type: 'RESET_DAY' });
    const newStatsState = statsReducer(statsState, { type: 'RESET_DAY' });
    const newAppState = appReducer(appState, { type: 'RESET_DAY' });

    return combineStateSlices(
      newSessionState,
      newTherapistState,
      newRoomState,
      newWalkOutState,
      newStatsState,
      newAppState,
      state
    );
  }

  // Handle global reset
  if (action.type === 'GLOBAL_RESET') {
    const { sessionState, therapistState, roomState, walkOutState, statsState, appState } = extractStateSlices(state);
    
    const newSessionState = sessionReducer(sessionState, { type: 'LOAD_SESSIONS', payload: [] });
    const newTherapistState = therapistReducer(therapistState, { type: 'CLEAR_ROSTER' });
    const newRoomState = roomReducer(roomState, { type: 'GLOBAL_RESET' });
    const newWalkOutState = walkOutReducer(walkOutState, { type: 'GLOBAL_RESET' });
    const newStatsState = statsReducer(statsState, { type: 'GLOBAL_RESET' });
    const newAppState = appReducer(appState, { type: 'GLOBAL_RESET' });

    return combineStateSlices(
      newSessionState,
      newTherapistState,
      newRoomState,
      newWalkOutState,
      newStatsState,
      newAppState,
      state
    );
  }

  // Extract current state slices
  const { sessionState, therapistState, roomState, walkOutState, statsState, appState } = extractStateSlices(state);

  // Run each reducer with the appropriate action
  let newSessionState = sessionState;
  let newTherapistState = therapistState;
  let newRoomState = roomState;
  let newWalkOutState = walkOutState;
  let newStatsState = statsState;
  let newAppState = appState;

  // Handle actions that affect multiple reducers
  if (action.type === 'START_SESSION') {
    newSessionState = sessionReducer(sessionState, action);
    newTherapistState = therapistReducer(therapistState, action);
    // Room stays available during prep phase - no room state change
    newStatsState = statsReducer(statsState, action);
  } else if (action.type === 'START_SESSION_TIMER') {
    newSessionState = sessionReducer(sessionState, action);
    
    // Update therapist currentSession to reflect the updated session
    const sessionId = action.payload as string;
    const updatedSession = newSessionState.sessions.find(s => s.id === sessionId);
    
    if (updatedSession) {
      newTherapistState = {
        ...therapistState,
        todayRoster: therapistState.todayRoster.map(t => {
          if (updatedSession.therapistIds.includes(t.id)) {
            return {
              ...t,
              currentSession: updatedSession
            };
          }
          return t;
        })
      };

      // Mark room as occupied when timer starts (service begins)
      newRoomState = {
        ...roomState,
        rooms: roomState.rooms.map(r => {
          if (r.id === updatedSession.roomId) {
            return { ...r, status: 'occupied' as const, currentSession: updatedSession };
          }
          return r;
        })
      };
    }
  } else if (action.type === 'COMPLETE_SESSION') {
    newSessionState = sessionReducer(sessionState, action);
    newRoomState = roomReducer(roomState, action);
    
    // Calculate stats for session completion
    const completedSession = state.sessions.find(s => s.id === (typeof action.payload === 'string' ? action.payload : action.payload.sessionId));
    if (completedSession) {
      newStatsState = {
        ...statsState,
        dailyStats: calculateSessionCompletionStats(statsState.dailyStats, completedSession.service, completedSession.therapistIds.length)
      };
      
      // Update therapist state with session completion data
      const service = completedSession.service;
      const ladyPayout = service.ladyPayout;

      const therapistsAfterSession = state.todayRoster.map(t => {
        if (completedSession.therapistIds.includes(t.id)) {
          const individualPayout = completedSession.therapistIds.length > 1 
            ? ladyPayout / completedSession.therapistIds.length 
            : ladyPayout;
          return {
            ...t,
            status: 'available' as const,
            currentSession: undefined,
            totalEarnings: t.totalEarnings + individualPayout,
            totalSessions: t.totalSessions + 1
          };
        }
        return t;
      });
      
      newTherapistState = {
        ...therapistState,
        todayRoster: therapistsAfterSession
      };
    } else {
      newTherapistState = therapistState;
    }
  } else if (action.type === 'MANUAL_ADD_SESSION') {
    newSessionState = sessionReducer(sessionState, action);
    newTherapistState = therapistReducer(therapistState, action);
    newStatsState = statsReducer(statsState, action);
  } else if (action.type === 'DEPART_THERAPIST') {
    newTherapistState = therapistReducer(therapistState, action);
    
    // Calculate stats for departure
    const departedTherapist = state.todayRoster.find(t => t.id === action.payload);
    if (departedTherapist) {
      newStatsState = {
        ...statsState,
        dailyStats: calculateDepartureStats(statsState.dailyStats, departedTherapist)
      };
    }
  } else if (action.type === 'CLOSE_OUT_DAY') {
    newAppState = appReducer(appState, action);
    
    // Calculate stats for close out
    const remainingTherapists = state.todayRoster.filter(t => t.status === 'available');
    newStatsState = {
      ...statsState,
      dailyStats: calculateCloseOutStats(statsState.dailyStats, remainingTherapists)
    };
  } else if (action.type === 'LOAD_SESSIONS') {
    newSessionState = sessionReducer(sessionState, action);
    newTherapistState = therapistReducer(therapistState, action);
    newRoomState = roomReducer(roomState, action);
  } else if (action.type === 'LOAD_SUPABASE_DATA') {
    newTherapistState = therapistReducer(therapistState, action);
    newRoomState = roomReducer(roomState, action);
    // Services are handled directly in the final return statement
  } else {
    // Handle single-domain actions
    switch (action.type) {
      case 'UPDATE_SESSION':
        newSessionState = sessionReducer(sessionState, action);
        break;
      case 'ADD_TO_ROSTER':
      case 'REMOVE_FROM_ROSTER':
      case 'CLEAR_ROSTER':
      case 'CHECK_IN_THERAPIST':
      case 'UPDATE_THERAPIST_STATUS':
      case 'UPDATE_THERAPIST_STATS':
      case 'ADD_EXPENSE':
      case 'REMOVE_EXPENSE':
      case 'LOAD_TODAY_ROSTER':
        newTherapistState = therapistReducer(therapistState, action);
        break;
      case 'ADD_WALK_OUT':
        newWalkOutState = walkOutReducer(walkOutState, action);
        newStatsState = statsReducer(statsState, action);
        break;
      case 'LOAD_WALK_OUTS':
        newWalkOutState = walkOutReducer(walkOutState, action);
        break;
      case 'LOAD_SERVICES':
        // Services are handled directly in the state since there's no separate service reducer
        // We'll update the services in the final return statement
        break;
      case 'LOAD_ROOMS':
        newRoomState = roomReducer(roomState, action);
        break;
      case 'SET_PHASE':
      case 'START_DAY':
      case 'UNDO_LAST_ACTION':
        newAppState = appReducer(appState, action);
        break;
    }
  }

  // Combine the new state slices
  const newState = combineStateSlices(
    newSessionState,
    newTherapistState,
    newRoomState,
    newWalkOutState,
    newStatsState,
    newAppState,
    state
  );

  // Check if state actually changed - use a more efficient comparison
  // Compare only the essential parts that matter for state changes
  const stateChanged = (
    state.currentPhase !== newState.currentPhase ||
    state.therapists.length !== newState.therapists.length ||
    state.todayRoster.length !== newState.todayRoster.length ||
    state.sessions.length !== newState.sessions.length ||
    state.walkOuts.length !== newState.walkOuts.length ||
    state.dailyStats.totalSlips !== newState.dailyStats.totalSlips ||
    state.dailyStats.totalRevenue !== newState.dailyStats.totalRevenue ||
    state.dailyStats.totalPayouts !== newState.dailyStats.totalPayouts ||
    state.dailyStats.totalDiscounts !== newState.dailyStats.totalDiscounts ||
    state.dailyStats.shopRevenue !== newState.dailyStats.shopRevenue ||
    state.history.length !== newState.history.length ||
    state.undoStack.length !== newState.undoStack.length
  );
  
  // Update undo stack and history
  // Only add to undo stack if state actually changed or it's an unknown action
  const isUnknownAction = !['SET_PHASE', 'LOAD_SUPABASE_DATA', 'LOAD_TODAY_ROSTER', 'LOAD_SESSIONS', 'LOAD_WALK_OUTS', 
                           'ADD_TO_ROSTER', 'REMOVE_FROM_ROSTER', 'CLEAR_ROSTER', 'UPDATE_THERAPIST_STATUS', 
                           'UPDATE_THERAPIST_STATS', 'START_DAY', 'START_SESSION', 'UPDATE_SESSION', 
                           'COMPLETE_SESSION', 'MANUAL_ADD_SESSION', 'DEPART_THERAPIST', 'CHECK_IN_THERAPIST', 
                           'ADD_WALK_OUT', 'ADD_EXPENSE', 'REMOVE_EXPENSE', 'CLOSE_OUT_DAY', 'RESET_DAY', 
                           'GLOBAL_RESET', 'UNDO_LAST_ACTION', 'UNDO_ACTION'].includes(action.type);
  const shouldUpdateUndoStack = stateChanged || isUnknownAction;
  const updatedUndoStack = shouldUpdateUndoStack ? updateUndoStack(state, action, newState) : state.undoStack;
  const updatedHistory = stateChanged ? addHistoryEntry(newState.history, action, undefined, state) : newState.history;

  // Handle services directly if LOAD_SERVICES or LOAD_SUPABASE_DATA action
  const updatedServices = (action.type === 'LOAD_SERVICES' || action.type === 'LOAD_SUPABASE_DATA')
    ? (action.type === 'LOAD_SERVICES' 
        ? (action.payload as Service[])
        : (action.payload as { therapists: unknown[]; rooms: unknown[]; services: Service[] }).services)
    : newState.services;

  return {
    ...newState,
    services: updatedServices,
    undoStack: updatedUndoStack,
    history: updatedHistory
  };
}
