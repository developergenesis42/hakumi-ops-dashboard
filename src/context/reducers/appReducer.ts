import type { AppState, AppAction } from '@/types';

export interface AppStateSlice {
  currentPhase: AppState['currentPhase'];
  history: AppState['history'];
  undoStack: AppState['undoStack'];
}

export interface AppActionSlice {
  type: 'SET_PHASE' | 'START_DAY' | 'CLOSE_OUT_DAY' | 'RESET_DAY' | 'GLOBAL_RESET' | 
        'UNDO_LAST_ACTION' | 'UNDO_ACTION' | 'LOAD_SUPABASE_DATA';
  payload?: AppState['currentPhase'] | { state: AppState } | { therapists: unknown[]; rooms: unknown[]; services: unknown[] };
}

// Helper function to determine if an action modifies the database
const getActionInfo = (action: AppAction): { modifiesDatabase: boolean; description: string } => {
  const databaseActions = [
    'ADD_TO_ROSTER',
    'REMOVE_FROM_ROSTER', 
    'CLEAR_ROSTER',
    'START_SESSION',
    'COMPLETE_SESSION',
    'MANUAL_ADD_SESSION',
    'DEPART_THERAPIST',
    'CHECK_IN_THERAPIST',
    'ADD_WALK_OUT',
    'UPDATE_THERAPIST_STATUS',
    'UPDATE_THERAPIST_STATS',
    'UPDATE_SESSION'
  ];

  const modifiesDatabase = databaseActions.includes(action.type);
  
  let description = '';
  switch (action.type) {
    case 'ADD_TO_ROSTER':
      description = `Add therapist to roster`;
      break;
    case 'REMOVE_FROM_ROSTER':
      description = `Remove therapist from roster`;
      break;
    case 'CLEAR_ROSTER':
      description = `Clear roster`;
      break;
    case 'START_SESSION':
      description = `Start session`;
      break;
    case 'COMPLETE_SESSION':
      description = `Complete session`;
      break;
    case 'MANUAL_ADD_SESSION':
      description = `Add manual session`;
      break;
    case 'DEPART_THERAPIST':
      description = `Mark therapist as departed`;
      break;
    case 'CHECK_IN_THERAPIST':
      description = `Check in therapist`;
      break;
    case 'ADD_WALK_OUT':
      description = `Add walk-out incident`;
      break;
    case 'UPDATE_THERAPIST_STATUS':
      description = `Update therapist status`;
      break;
    case 'UPDATE_THERAPIST_STATS':
      description = `Update therapist stats`;
      break;
    case 'UPDATE_SESSION':
      description = `Update session details`;
      break;
    default:
      description = action.type.replace(/_/g, ' ').toLowerCase();
  }

  return { modifiesDatabase, description };
};

export function appReducer(state: AppStateSlice, action: AppActionSlice): AppStateSlice {
  switch (action.type) {
    case 'SET_PHASE': {
      return { ...state, currentPhase: action.payload as AppState['currentPhase'] };
    }

    case 'START_DAY': {
      return {
        ...state,
        currentPhase: 'daily-operations',
        history: [...state.history, {
          action: action as AppAction,
          timestamp: new Date(),
          description: 'Started day',
          stateSnapshot: { currentPhase: 'daily-operations' }
        }]
      };
    }

    case 'CLOSE_OUT_DAY': {
      return {
        ...state,
        currentPhase: 'closing-out',
        history: [...state.history, {
          action: action as AppAction,
          timestamp: new Date(),
          description: 'Ended day - moved to summary view',
          stateSnapshot: { currentPhase: 'closing-out' }
        }]
      };
    }

    case 'RESET_DAY': {
      return {
        ...state,
        currentPhase: 'roster-setup',
        history: []
      };
    }

    case 'GLOBAL_RESET': {
      return {
        ...state,
        currentPhase: 'roster-setup',
        history: [],
        undoStack: []
      };
    }

    case 'UNDO_LAST_ACTION': {
      if (state.undoStack.length > 0) {
        return {
          ...state,
          undoStack: state.undoStack.slice(1) // Remove the first item
        };
      }
      return state;
    }

    case 'UNDO_ACTION': {
      return (action.payload as { state: AppState }).state;
    }

    default:
      return state;
  }
}

// Helper function to update undo stack for actions that modify state
export function updateUndoStack(
  currentState: AppState, 
  action: AppAction, 
  _newState: AppState // eslint-disable-line @typescript-eslint/no-unused-vars
): AppState['undoStack'] {
  const shouldUpdateUndoStack = !['UNDO_ACTION', 'RESET_DAY', 'GLOBAL_RESET'].includes(action.type);
  
  if (!shouldUpdateUndoStack) {
    return currentState.undoStack;
  }

  const actionInfo = getActionInfo(action);
  
  return [{
    action: action,
    timestamp: new Date(),
    description: actionInfo.description
  }, ...currentState.undoStack].slice(0, 10); // Keep last 10 states
}

// Helper function to add history entry
export function addHistoryEntry(
  currentHistory: string[], 
  action: AppAction, 
  additionalInfo?: string,
  state?: AppState
): string[] {
  let entry = '';
  
  switch (action.type) {
    case 'ADD_TO_ROSTER':
      entry = `Added ${action.payload.name} to roster`;
      break;
    case 'REMOVE_FROM_ROSTER': {
      const therapistToRemove = state?.todayRoster?.find((t: { id: string; name: string }) => t.id === action.payload);
      entry = `Removed ${therapistToRemove?.name || 'therapist'} from roster`;
      break;
    }
    case 'CLEAR_ROSTER':
      entry = 'Cleared all therapists from roster';
      break;
    case 'START_SESSION':
      entry = `Started session with ${action.payload.therapistIds.length} therapist(s)`;
      break;
    case 'COMPLETE_SESSION':
      entry = 'Completed session';
      break;
    case 'MANUAL_ADD_SESSION':
      entry = 'Manually added session';
      break;
    case 'CHECK_IN_THERAPIST': {
      const checkedInTherapist = state?.todayRoster?.find((t: { id: string; name: string }) => t.id === action.payload);
      entry = `Checked in ${checkedInTherapist?.name || 'therapist'} at ${new Date().toLocaleTimeString()}`;
      break;
    }
    case 'DEPART_THERAPIST': {
      const departedTherapist = state?.todayRoster?.find((t: { id: string; name: string; totalEarnings?: number; expenses?: Array<{ amount: number }> }) => t.id === action.payload);
      const payout = departedTherapist?.totalEarnings || 0;
      const totalExpenses = departedTherapist?.expenses?.reduce((sum: number, expense: { amount: number }) => sum + expense.amount, 0) || 0;
      const netPayout = payout - totalExpenses;
      const expenseText = totalExpenses > 0 ? ` (expenses: ฿${totalExpenses.toLocaleString()})` : '';
      entry = `Departed ${departedTherapist?.name || 'therapist'} at ${new Date().toLocaleTimeString()} with net payout ฿${netPayout.toLocaleString()}${expenseText}`;
      break;
    }
    case 'ADD_WALK_OUT':
      entry = `Added walk-out: ${action.payload.reason}`;
      break;
    case 'ADD_EXPENSE': {
      const therapistWithExpense = state?.todayRoster?.find((t: { id: string; name: string }) => t.id === action.payload.therapistId);
      entry = `Added ${action.payload.expense.type} expense of ฿${action.payload.expense.amount} for ${therapistWithExpense?.name || 'therapist'}`;
      break;
    }
    case 'REMOVE_EXPENSE': {
      const therapistWithoutExpense = state?.todayRoster?.find((t: { id: string; name: string }) => t.id === action.payload.therapistId);
      entry = `Removed expense for ${therapistWithoutExpense?.name || 'therapist'}`;
      break;
    }
    default:
      entry = action.type.replace(/_/g, ' ').toLowerCase();
  }

  if (additionalInfo) {
    entry += ` - ${additionalInfo}`;
  }

  return [...currentHistory, entry];
}
