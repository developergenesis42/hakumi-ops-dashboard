import { useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useSupabaseData } from '@/hooks/useSupabaseData';

/**
 * DataSync component - syncs data from SupabaseDataContext to AppContext
 * This ensures that therapists, rooms, and services loaded from Supabase
 * are available in the main app state
 */
export default function DataSync() {
  const { dispatch } = useApp();
  const { therapists, rooms, services, loading, error } = useSupabaseData();

  // Sync therapists data
  useEffect(() => {
    if (therapists.length > 0) {
      console.log('DataSync: Loading therapists into app state:', therapists.length);
      dispatch({ 
        type: 'LOAD_SUPABASE_DATA', 
        payload: { therapists } 
      });
    }
  }, [therapists, dispatch]);

  // Sync rooms data
  useEffect(() => {
    if (rooms.length > 0) {
      console.log('DataSync: Loading rooms into app state:', rooms.length);
      dispatch({ 
        type: 'LOAD_ROOMS', 
        payload: rooms 
      });
    }
  }, [rooms, dispatch]);

  // Sync services data
  useEffect(() => {
    if (services.length > 0) {
      console.log('DataSync: Loading services into app state:', services.length);
      dispatch({ 
        type: 'LOAD_SERVICES', 
        payload: services 
      });
    }
  }, [services, dispatch]);

  // Log loading and error states
  useEffect(() => {
    if (loading) {
      console.log('DataSync: Loading data from Supabase...');
    }
    if (error) {
      console.error('DataSync: Error loading data:', error);
    }
  }, [loading, error]);

  // This component doesn't render anything
  return null;
}
