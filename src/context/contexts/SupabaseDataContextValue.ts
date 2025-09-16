import { createContext } from 'react';
import type { Therapist, Room, Service } from '@/types';

export interface SupabaseDataContextType {
  therapists: Therapist[];
  rooms: Room[];
  services: Service[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);
