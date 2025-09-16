import React, { createContext, useContext, ReactNode } from 'react';
import { useCSRFProtection } from '@/utils/csrf';

interface CSRFContextType {
  getCSRFToken: () => string;
  validateCSRFToken: (token: string) => boolean;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

interface CSRFProviderProps {
  children: ReactNode;
}

export const CSRFProvider: React.FC<CSRFProviderProps> = ({ children }) => {
  const csrfUtils = useCSRFProtection();

  return React.createElement(
    CSRFContext.Provider,
    { value: csrfUtils },
    children
  );
};

export const useCSRFContext = (): CSRFContextType => {
  const context = useContext(CSRFContext);
  if (!context) {
    throw new Error('useCSRFContext must be used within a CSRFProvider');
  }
  return context;
};

export type { CSRFContextType };