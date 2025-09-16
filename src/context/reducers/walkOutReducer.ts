import type { WalkOut } from '@/types';
import { generateId } from '@/utils/helpers';

export interface WalkOutState {
  walkOuts: WalkOut[];
}

export interface WalkOutAction {
  type: 'ADD_WALK_OUT' | 'LOAD_WALK_OUTS' | 'RESET_DAY' | 'GLOBAL_RESET';
  payload?: WalkOut | WalkOut[];
}

export function walkOutReducer(state: WalkOutState, action: WalkOutAction): WalkOutState {
  switch (action.type) {
    case 'ADD_WALK_OUT': {
      const walkOutPayload = action.payload as WalkOut;
      const newWalkOut: WalkOut = {
        ...walkOutPayload,
        id: walkOutPayload.id || generateId()
      };

      return {
        ...state,
        walkOuts: [...state.walkOuts, newWalkOut]
      };
    }

    case 'LOAD_WALK_OUTS': {
      return {
        ...state,
        walkOuts: action.payload as WalkOut[]
      };
    }

    case 'RESET_DAY': {
      return {
        ...state,
        walkOuts: []
      };
    }

    case 'GLOBAL_RESET': {
      return {
        ...state,
        walkOuts: []
      };
    }

    default:
      return state;
  }
}