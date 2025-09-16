import { type ReactNode } from 'react';
import { useSpaData } from '@/hooks/useSpaData';
import { SupabaseDataContext, type SupabaseDataContextType } from '@/context/contexts/SupabaseDataContextValue';

export { SupabaseDataContext, type SupabaseDataContextType };

export function SupabaseDataProvider({ children }: { children: ReactNode }) {
  const spaData = useSpaData();

  return (
    <SupabaseDataContext.Provider value={spaData}>
      {children}
    </SupabaseDataContext.Provider>
  );
}
