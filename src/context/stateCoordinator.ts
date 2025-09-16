import type { AppState, AppAction, Therapist, Session, Room, DailyStats, WalkOut, Service, UndoStackItem } from '@/types';
import { sessionReducer } from '@/context/reducers/sessionReducer';
import { therapistReducer } from '@/context/reducers/therapistReducer';
import { roomReducer } from '@/context/reducers/roomReducer';
import { walkOutReducer } from '@/context/reducers/walkOutReducer';
import { statsReducer } from '@/context/reducers/statsReducer';
import { appReducer } from '@/context/reducers/appReducer';
import { debugLog } from '@/config/environment';

export interface StateMiddleware {
  before?: (state: AppState, action: AppAction) => AppState | null;
  after?: (state: AppState, action: AppAction) => AppState | null;
}

export interface StateValidationRule {
  name: string;
  validate: (state: AppState) => boolean;
  message: string;
}

export class StateCoordinator {
  private middlewares: StateMiddleware[] = [];
  private validationRules: StateValidationRule[] = [];
  private stateHistory: AppState[] = [];
  private maxHistorySize = 50;

  constructor() {
    this.setupDefaultValidationRules();
  }

  /**
   * Add middleware to the state coordinator
   */
  addMiddleware(middleware: StateMiddleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Add validation rule
   */
  addValidationRule(rule: StateValidationRule): void {
    this.validationRules.push(rule);
  }

  /**
   * Process state update through all middlewares and reducers
   */
  processStateUpdate(state: AppState, action: AppAction): AppState {
    debugLog(`StateCoordinator: Processing action ${action.type}`);
    
    // Store current state in history
    this.addToHistory(state);
    
    let newState = state;
    
    // Run before middlewares
    for (const middleware of this.middlewares) {
      if (middleware.before) {
        const result = middleware.before(newState, action);
        if (result !== null) {
          newState = result;
        }
      }
    }

    // Process action through appropriate reducers
    newState = this.processAction(newState, action);

    // Run after middlewares
    for (const middleware of this.middlewares) {
      if (middleware.after) {
        const result = middleware.after(newState, action);
        if (result !== null) {
          newState = result;
        }
      }
    }

    // Validate new state
    const validationResult = this.validateState(newState);
    if (!validationResult.isValid) {
      console.error('State validation failed:', validationResult.errors);
      // Return original state if validation fails
      return state;
    }

    debugLog(`StateCoordinator: Action ${action.type} processed successfully`);
    return newState;
  }

  /**
   * Get state history for debugging
   */
  getStateHistory(): AppState[] {
    return [...this.stateHistory];
  }

  /**
   * Clear state history
   */
  clearHistory(): void {
    this.stateHistory = [];
  }

  private processAction(state: AppState, action: AppAction): AppState {
    // Handle special actions first
    if (action.type === 'UNDO_ACTION') {
      return action.payload.state;
    }

    // Extract state slices
    const sessionState = { sessions: state.sessions };
    const therapistState = { therapists: state.therapists, todayRoster: state.todayRoster };
    const roomState = { rooms: state.rooms };
    const walkOutState = { walkOuts: state.walkOuts };
    const statsState = { dailyStats: state.dailyStats };
    const appState = { 
      currentPhase: state.currentPhase, 
      history: state.history, 
      undoStack: state.undoStack 
    };

    // Process through individual reducers
    let newSessionState = sessionState;
    let newTherapistState = therapistState;
    const newRoomState = roomState;
    let newWalkOutState = walkOutState;
    let newStatsState = statsState;
    let newAppState = appState;

    // Handle cross-domain actions
    if (this.isCrossDomainAction(action)) {
      const result = this.processCrossDomainAction(state, action);
      return result;
    }

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
        // Services are handled directly in the final return
        break;
      case 'SET_PHASE':
      case 'START_DAY':
      case 'UNDO_LAST_ACTION':
        newAppState = appReducer(appState, action);
        break;
      default:
        debugLog(`StateCoordinator: Unknown action type ${action.type}`);
        return state;
    }

    // Combine state slices
    return this.combineStateSlices(
      newSessionState,
      newTherapistState,
      newRoomState,
      newWalkOutState,
      newStatsState,
      newAppState,
      state,
      action
    );
  }

  private isCrossDomainAction(action: AppAction): boolean {
    const crossDomainActions = [
      'START_SESSION',
      'START_SESSION_TIMER',
      'COMPLETE_SESSION',
      'MANUAL_ADD_SESSION',
      'DEPART_THERAPIST',
      'CLOSE_OUT_DAY',
      'LOAD_SESSIONS',
      'LOAD_SUPABASE_DATA',
      'RESET_DAY',
      'GLOBAL_RESET'
    ];
    return crossDomainActions.includes(action.type);
  }

  private processCrossDomainAction(state: AppState, action: AppAction): AppState {
    // This will be implemented with specific logic for each cross-domain action
    // For now, delegate to the original combinedAppReducer logic
    return this.processComplexAction(state, action);
  }

  private processComplexAction(state: AppState, action: AppAction): AppState {
    // Extract state slices
    const sessionState = { sessions: state.sessions };
    const therapistState = { therapists: state.therapists, todayRoster: state.todayRoster };
    const roomState = { rooms: state.rooms };
    const walkOutState = { walkOuts: state.walkOuts };
    const statsState = { dailyStats: state.dailyStats };
    const appState = { 
      currentPhase: state.currentPhase, 
      history: state.history, 
      undoStack: state.undoStack 
    };

    let newSessionState = sessionState;
    let newTherapistState = therapistState;
    let newRoomState = roomState;
    const newWalkOutState = walkOutState;
    let newStatsState = statsState;
    let newAppState = appState;

    // Handle specific cross-domain actions
    switch (action.type) {
      case 'START_SESSION':
        newSessionState = sessionReducer(sessionState, action);
        newTherapistState = therapistReducer(therapistState, action);
        newStatsState = statsReducer(statsState, action);
        break;
      case 'START_SESSION_TIMER': {
        newSessionState = sessionReducer(sessionState, action);
        // Update therapist and room state based on session
        const sessionId = action.payload as string;
        const updatedSession = newSessionState.sessions.find(s => s.id === sessionId);
        
        if (updatedSession) {
          newTherapistState = this.updateTherapistStateForSession(therapistState, updatedSession);
          newRoomState = this.updateRoomStateForSession(roomState, updatedSession);
        }
        break;
      }
      case 'COMPLETE_SESSION': {
        newSessionState = sessionReducer(sessionState, action);
        newRoomState = roomReducer(roomState, action);
        // Update stats and therapist state
        const completedSession = state.sessions.find(s => s.id === (typeof action.payload === 'string' ? action.payload : action.payload.sessionId));
        if (completedSession) {
          newStatsState = this.updateStatsForSessionCompletion(statsState);
          newTherapistState = this.updateTherapistStateForSessionCompletion(therapistState);
        }
        break;
      }
      case 'MANUAL_ADD_SESSION':
        newSessionState = sessionReducer(sessionState, action);
        newTherapistState = therapistReducer(therapistState, action);
        newStatsState = statsReducer(statsState, action);
        break;
      case 'DEPART_THERAPIST': {
        newTherapistState = therapistReducer(therapistState, action);
        const departedTherapist = state.todayRoster.find(t => t.id === action.payload);
        if (departedTherapist) {
          newStatsState = this.updateStatsForDeparture(statsState);
        }
        break;
      }
      case 'CLOSE_OUT_DAY': {
        newAppState = appReducer(appState, action);
        newStatsState = this.updateStatsForCloseOut(statsState);
        break;
      }
      case 'LOAD_SESSIONS':
        newSessionState = sessionReducer(sessionState, action);
        newTherapistState = therapistReducer(therapistState, action);
        newRoomState = roomReducer(roomState, action);
        break;
      case 'LOAD_SUPABASE_DATA':
        newTherapistState = therapistReducer(therapistState, action);
        newRoomState = roomReducer(roomState, action);
        break;
      case 'RESET_DAY':
      case 'GLOBAL_RESET':
        return this.handleResetAction(state, action);
      default:
        return state;
    }

    return this.combineStateSlices(
      newSessionState,
      newTherapistState,
      newRoomState,
      newWalkOutState,
      newStatsState,
      newAppState,
      state,
      action
    );
  }

  private updateTherapistStateForSession(therapistState: { therapists: Therapist[]; todayRoster: Therapist[] }, session: Session): { therapists: Therapist[]; todayRoster: Therapist[] } {
    return {
      ...therapistState,
      todayRoster: therapistState.todayRoster.map((t: Therapist) => {
        if (session.therapistIds.includes(t.id)) {
          return { ...t, currentSession: session };
        }
        return t;
      })
    };
  }

  private updateRoomStateForSession(roomState: { rooms: Room[] }, session: Session): { rooms: Room[] } {
    return {
      ...roomState,
      rooms: roomState.rooms.map((r: Room) => {
        if (r.id === session.roomId) {
          return { ...r, status: 'occupied', currentSession: session };
        }
        return r;
      })
    };
  }

  private updateStatsForSessionCompletion(statsState: { dailyStats: DailyStats }): { dailyStats: DailyStats } {
    // This would use the actual stats calculation logic
    return statsState;
  }

  private updateTherapistStateForSessionCompletion(therapistState: { therapists: Therapist[]; todayRoster: Therapist[] }): { therapists: Therapist[]; todayRoster: Therapist[] } {
    // This would use the actual therapist update logic
    return therapistState;
  }

  private updateStatsForDeparture(statsState: { dailyStats: DailyStats }): { dailyStats: DailyStats } {
    // This would use the actual stats calculation logic
    return statsState;
  }

  private updateStatsForCloseOut(statsState: { dailyStats: DailyStats }): { dailyStats: DailyStats } {
    // This would use the actual stats calculation logic
    return statsState;
  }

  private handleResetAction(state: AppState, action: AppAction): AppState {
    // Handle reset actions
    const sessionState = { sessions: [] };
    const therapistState = { therapists: state.therapists, todayRoster: [] };
    const roomState = { rooms: state.rooms.map(r => ({ ...r, status: 'available' as const, currentSession: undefined })) };
    const walkOutState = { walkOuts: [] };
    const statsState = { dailyStats: { totalSlips: 0, totalRevenue: 0, totalPayouts: 0, totalDiscounts: 0, shopRevenue: 0, walkOutCount: 0, completedSessions: 0 } };
    const appState = { 
      currentPhase: state.currentPhase, 
      history: [], 
      undoStack: [] 
    };

    return this.combineStateSlices(
      sessionState,
      therapistState,
      roomState,
      walkOutState,
      statsState,
      appState,
      state,
      action
    );
  }

  private combineStateSlices(
    sessionState: { sessions: Session[] },
    therapistState: { therapists: Therapist[]; todayRoster: Therapist[] },
    roomState: { rooms: Room[] },
    walkOutState: { walkOuts: WalkOut[] },
    statsState: { dailyStats: DailyStats },
    appState: { currentPhase: AppState['currentPhase']; history: string[]; undoStack: UndoStackItem[] },
    originalState: AppState,
    action: AppAction
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
      undoStack: appState.undoStack,
      services: action.type === 'LOAD_SERVICES' || action.type === 'LOAD_SUPABASE_DATA'
        ? (action.type === 'LOAD_SERVICES' 
            ? (action.payload as Service[])
            : (action.payload as { services: Service[] }).services)
        : originalState.services
    };
  }

  private validateState(state: AppState): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const rule of this.validationRules) {
      if (!rule.validate(state)) {
        errors.push(rule.message);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private addToHistory(state: AppState): void {
    this.stateHistory.push({ ...state });
    
    // Keep only the last maxHistorySize states
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }

  private setupDefaultValidationRules(): void {
    this.addValidationRule({
      name: 'sessionsHaveValidTherapistIds',
      validate: (state) => {
        return state.sessions.every(session => 
          session.therapistIds.every(id => 
            state.therapists.some(t => t.id === id)
          )
        );
      },
      message: 'Sessions contain invalid therapist IDs'
    });

    this.addValidationRule({
      name: 'sessionsHaveValidRoomIds',
      validate: (state) => {
        return state.sessions.every(session => 
          state.rooms.some(r => r.id === session.roomId)
        );
      },
      message: 'Sessions contain invalid room IDs'
    });

    this.addValidationRule({
      name: 'rosterTherapistsExistInMasterList',
      validate: (state) => {
        return state.todayRoster.every(rosterTherapist => 
          state.therapists.some(masterTherapist => masterTherapist.id === rosterTherapist.id)
        );
      },
      message: 'Roster contains therapists not in master list'
    });
  }
}

// Singleton instance
export const stateCoordinator = new StateCoordinator();
