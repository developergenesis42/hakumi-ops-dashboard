import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import supabase from '@/utils/supabase';
import type { Therapist, Room, Service } from '@/types';
import { useLoadingState } from '@/hooks/useLoadingState';
import { debugLog } from '@/config/environment';

export function useSpaData() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const { loading, setLoading } = useLoadingState(true, 2000);
  const hasAttemptedFetch = useRef(false);

  // Test Supabase connection
  const testConnection = async () => {
    try {
      debugLog('useSpaData: Testing Supabase connection...');
      const { error } = await supabase
        .from('therapists')
        .select('count')
        .limit(1);
      
      if (error) {
        debugLog('useSpaData: Connection test failed:', error);
        throw error;
      }
      
      debugLog('useSpaData: Connection test successful');
      return true;
    } catch (err) {
      debugLog('useSpaData: Connection test error:', err);
      return false;
    }
  };

  // Fetch therapists
  const fetchTherapists = async () => {
    try {
      debugLog('useSpaData: Fetching therapists...');
      const { data, error } = await supabase
        .from('therapists')
        .select('*')
        .order('name');

      if (error) {
        console.error('useSpaData: Therapists fetch error:', error);
        throw error;
      }
      
      debugLog('useSpaData: Therapists data received:', data?.length || 0, 'items');
      
      // Convert database format to app format
      const formattedTherapists: Therapist[] = data.map(row => ({
        id: row.id,
        name: row.name,
        status: row.status,
        totalEarnings: row.total_earnings,
        totalSessions: row.total_sessions,
        expenses: [], // Initialize empty expenses array
      }));
      
      setTherapists(formattedTherapists);
      debugLog('useSpaData: Therapists set successfully');
    } catch (err) {
      console.error('useSpaData: Error fetching therapists:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch therapists');
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Convert database format to app format
      const formattedRooms: Room[] = data.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        status: row.status,
      }));
      
      setRooms(formattedRooms);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
    }
  };

  // Fetch services
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true })
        .order('duration', { ascending: true });

      if (error) throw error;
      
      // Convert database format to app format
      const formattedServices: Service[] = data.map(row => ({
        id: row.id,
        category: row.category,
        roomType: row.room_type,
        duration: row.duration,
        price: row.price,
        ladyPayout: row.lady_payout,
        shopRevenue: row.shop_revenue,
        description: row.description,
      }));
      
      setServices(formattedServices);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch services');
    }
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching || hasAttemptedFetch.current) {
      debugLog('useSpaData: Already fetching or attempted, skipping...');
      return;
    }

    debugLog('useSpaData: Starting to fetch all data');
    hasAttemptedFetch.current = true;
    setIsFetching(true);
    setLoading(true);
    setError(null);
    
    try {
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error('Supabase connection failed');
      }

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Data fetch timeout')), 3000);
      });

      await Promise.race([
        Promise.all([
          fetchTherapists(),
          fetchRooms(),
          fetchServices()
        ]),
        timeoutPromise
      ]);
      
      debugLog('useSpaData: Successfully fetched all data');
    } catch (err) {
      console.error('useSpaData: Error fetching spa data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      
      // If it's a timeout or connection error, set empty data to allow app to continue
      if (errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        debugLog('useSpaData: Setting empty data due to connection issues');
        setTherapists([]);
        setRooms([]);
        setServices([]);
      }
    } finally {
      debugLog('useSpaData: Setting loading to false');
      setLoading(false);
      setIsFetching(false);
    }
  }, [isFetching, setLoading]);

  useEffect(() => {
    // Only fetch if we haven't fetched yet and we're not currently fetching
    if (!isFetching && !hasAttemptedFetch.current && therapists.length === 0 && rooms.length === 0 && services.length === 0) {
      debugLog('useSpaData: Triggering fetchAllData');
      fetchAllData();
    }
  }, [isFetching, therapists.length, rooms.length, services.length, fetchAllData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (loading || !hasAttemptedFetch.current) return;

    debugLog('useSpaData: Setting up real-time subscriptions');

    // Subscribe to therapists changes
    const therapistsChannel = supabase
      .channel('therapists-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'therapists' },
        async () => {
          debugLog('useSpaData: Therapists table changed, refetching...');
          await fetchTherapists();
        }
      )
      .subscribe();

    // Subscribe to rooms changes
    const roomsChannel = supabase
      .channel('rooms-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        async () => {
          debugLog('useSpaData: Rooms table changed, refetching...');
          await fetchRooms();
        }
      )
      .subscribe();

    // Subscribe to services changes
    const servicesChannel = supabase
      .channel('services-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'services' },
        async () => {
          debugLog('useSpaData: Services table changed, refetching...');
          await fetchServices();
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      debugLog('useSpaData: Cleaning up real-time subscriptions');
      supabase.removeChannel(therapistsChannel);
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, [loading]);

  return useMemo(() => ({
    therapists,
    rooms,
    services,
    loading,
    error,
    refetch: fetchAllData,
  }), [therapists, rooms, services, loading, error, fetchAllData]);
}
