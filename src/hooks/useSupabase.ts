import { useState, useEffect, useCallback } from 'react';
import { SupabaseService } from '@/services/supabaseService';
import type { Therapist, Room, Service, Session, WalkOut, DailyStats } from '@/types';

export function useSupabase() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try to fetch a simple query to test connection
        await SupabaseService.getTherapists();
        setIsConnected(true);
      } catch (err) {
        console.error('Supabase connection failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect to database');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    SupabaseService,
  };
}

// Hook for real-time data with Supabase
export function useSupabaseRealtime<T>(
  fetchFunction: () => Promise<T[]>,
  tableName: string
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error(`Error fetching ${tableName}:`, err);
      setError(err instanceof Error ? err.message : `Failed to fetch ${tableName}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, tableName]);

  useEffect(() => {
    fetchData();

    // Set up real-time subscription based on table name
    let subscription: { unsubscribe: () => void } | null = null;
    
    switch (tableName) {
      case 'therapists':
        subscription = SupabaseService.subscribeToTherapists((therapists: Therapist[]) => {
          setData(therapists as T[]);
        });
        break;
      case 'sessions':
        subscription = SupabaseService.subscribeToSessions((sessions: Session[]) => {
          setData(sessions as T[]);
        });
        break;
      case 'rooms':
        subscription = SupabaseService.subscribeToRooms((rooms: Room[]) => {
          setData(rooms as T[]);
        });
        break;
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchData, tableName]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

// Specific hooks for each data type
export function useTherapists() {
  return useSupabaseRealtime<Therapist>(
    SupabaseService.getTherapists,
    'therapists'
  );
}

export function useRooms() {
  return useSupabaseRealtime<Room>(
    SupabaseService.getRooms,
    'rooms'
  );
}

export function useServices() {
  const [data, setData] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setError(null);
        const services = await SupabaseService.getServices();
        setData(services);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch services');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  return { data, isLoading, error };
}

export function useSessions() {
  return useSupabaseRealtime<Session>(
    SupabaseService.getSessions,
    'sessions'
  );
}

export function useWalkOuts() {
  const [data, setData] = useState<WalkOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWalkOuts = async () => {
      try {
        setError(null);
        const walkOuts = await SupabaseService.getWalkOuts();
        setData(walkOuts);
      } catch (err) {
        console.error('Error fetching walk outs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch walk outs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWalkOuts();
  }, []);

  return { data, isLoading, error };
}

export function useDailyStats(date: string) {
  const [data, setData] = useState<DailyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyStats = async () => {
      try {
        setError(null);
        const stats = await SupabaseService.getDailyStats(date);
        setData(stats);
      } catch (err) {
        console.error('Error fetching daily stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch daily stats');
      } finally {
        setIsLoading(false);
      }
    };

    if (date) {
      fetchDailyStats();
    }
  }, [date]);

  return { data, isLoading, error };
}
