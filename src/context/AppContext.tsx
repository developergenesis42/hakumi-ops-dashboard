import React, { createContext, useReducer, ReactNode } from 'react';
import { combinedAppReducer } from '@/context/reducers/combineReducers';
import type { AppState, AppAction } from '@/types';

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const initialState: AppState = {
    currentPhase: 'roster-setup',
    therapists: [],
    todayRoster: [],
    rooms: [],
    services: [],
    sessions: [],
    walkOuts: [],
    dailyStats: {
      totalSlips: 0,
      totalRevenue: 0,
      totalPayouts: 0,
      totalDiscounts: 0,
      shopRevenue: 0,
      walkOutCount: 0,
      completedSessions: 0,
    },
    history: [],
    undoStack: [],
  };

  const [state, dispatch] = useReducer(combinedAppReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext };