import { useContext } from 'react';
import { SupabaseDataContext, SupabaseDataContextType } from '@/context/SupabaseDataContext';

// Custom hook to use supabase data context
export const useSupabaseData = (): SupabaseDataContextType => {
  const context = useContext(SupabaseDataContext);
  if (context === undefined) {
    throw new Error('useSupabaseData must be used within a SupabaseDataProvider');
  }
  return context;
};