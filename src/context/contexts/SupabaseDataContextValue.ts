import { createContext } from 'react';
import type { Therapist, Room, Service, Session } from '@/types';

export interface SupabaseDataContextType {
  therapists: Therapist[];
  rooms: Room[];
  services: Service[];
  sessions: Session[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const SupabaseDataContext = createContext<SupabaseDataContextType | undefined>(undefined);
