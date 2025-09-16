import React, { createContext } from 'react';
import type { AppState, AppAction } from '@/types';

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

// Create context
export const AppContext = createContext<AppContextType | undefined>(undefined);
