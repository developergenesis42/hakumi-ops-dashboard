import type { DailyStats, Therapist, Session, WalkOut } from '@/types';

export interface StatsState {
  dailyStats: DailyStats;
}

export interface StatsAction {
  type: 'START_SESSION' | 'COMPLETE_SESSION' | 'MANUAL_ADD_SESSION' | 'ADD_WALK_OUT' | 
        'DEPART_THERAPIST' | 'CLOSE_OUT_DAY' | 'RESET_DAY' | 'GLOBAL_RESET';
  payload?: Session | WalkOut | string;
}

export function statsReducer(state: StatsState, action: StatsAction): StatsState {
  switch (action.type) {
    case 'START_SESSION': {
      const sessionPayload = action.payload as Session;
      const updatedStats = {
        ...state.dailyStats,
        totalSlips: state.dailyStats.totalSlips + 1,
        totalRevenue: state.dailyStats.totalRevenue + sessionPayload.totalPrice,
        totalDiscounts: state.dailyStats.totalDiscounts + sessionPayload.discount
      };

      return {
        ...state,
        dailyStats: updatedStats
      };
    }

    case 'COMPLETE_SESSION': {
      // const _sessionId = typeof action.payload === 'string' ? action.payload : action.payload.sessionId;
      // Note: We need access to the session data to calculate payouts
      // This will be handled by the main reducer that has access to all state
      return state;
    }

    case 'MANUAL_ADD_SESSION': {
      const sessionPayload = action.payload as Session;
      const service = sessionPayload.service;
      const ladyPayout = service.ladyPayout;
      const shopRevenue = service.shopRevenue;

      const statsAfterManual = {
        ...state.dailyStats,
        totalSlips: state.dailyStats.totalSlips + 1,
        totalRevenue: state.dailyStats.totalRevenue + sessionPayload.totalPrice,
        totalPayouts: state.dailyStats.totalPayouts + ladyPayout,
        shopRevenue: state.dailyStats.shopRevenue + shopRevenue,
        totalDiscounts: state.dailyStats.totalDiscounts + sessionPayload.discount,
        completedSessions: state.dailyStats.completedSessions + 1
      };

      return {
        ...state,
        dailyStats: statsAfterManual
      };
    }

    case 'ADD_WALK_OUT': {
      const updatedStats = {
        ...state.dailyStats,
        walkOutCount: state.dailyStats.walkOutCount + 1
      };

      return {
        ...state,
        dailyStats: updatedStats
      };
    }

    case 'DEPART_THERAPIST': {
      // Note: We need access to therapist data to calculate net payout
      // This will be handled by the main reducer that has access to all state
      return state;
    }

    case 'CLOSE_OUT_DAY': {
      // Note: We need access to therapist data to calculate remaining payouts
      // This will be handled by the main reducer that has access to all state
      return state;
    }

    case 'RESET_DAY': {
      return {
        ...state,
        dailyStats: {
          totalSlips: 0,
          totalRevenue: 0,
          totalPayouts: 0,
          totalDiscounts: 0,
          shopRevenue: 0,
          walkOutCount: 0,
          completedSessions: 0
        }
      };
    }

    case 'GLOBAL_RESET': {
      return {
        ...state,
        dailyStats: {
          totalSlips: 0,
          totalRevenue: 0,
          totalPayouts: 0,
          totalDiscounts: 0,
          shopRevenue: 0,
          walkOutCount: 0,
          completedSessions: 0
        }
      };
    }

    default:
      return state;
  }
}

// Helper function to calculate stats that need access to multiple state slices
export function calculateSessionCompletionStats(
  currentStats: DailyStats, 
  service: { ladyPayout: number; shopRevenue: number }, 
  _therapistCount: number // eslint-disable-line @typescript-eslint/no-unused-vars
): DailyStats {
  const ladyPayout = service.ladyPayout;
  const shopRevenue = service.shopRevenue;

  return {
    ...currentStats,
    totalPayouts: currentStats.totalPayouts + ladyPayout,
    shopRevenue: currentStats.shopRevenue + shopRevenue,
    completedSessions: currentStats.completedSessions + 1,
  };
}

export function calculateDepartureStats(
  currentStats: DailyStats, 
  therapist: Therapist
): DailyStats {
  const payout = therapist.totalEarnings;
  const totalExpenses = therapist.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netPayout = payout - totalExpenses;

  return {
    ...currentStats,
    totalPayouts: currentStats.totalPayouts + netPayout
  };
}

export function calculateCloseOutStats(
  currentStats: DailyStats, 
  remainingTherapists: Therapist[]
): DailyStats {
  const totalPayouts = remainingTherapists.reduce((sum, t) => sum + (t.totalEarnings * 0.7), 0);
  
  return {
    ...currentStats,
    totalPayouts: currentStats.totalPayouts + totalPayouts
  };
}
