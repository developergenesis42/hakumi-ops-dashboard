import { useRealtimeUpdates } from '@/features/hooks/useRealtimeUpdates';

/**
 * Component to handle real-time synchronization
 * Must be rendered inside AppProvider context
 */
export default function RealtimeSync() {
  // Set up real-time subscriptions
  useRealtimeUpdates();
  
  // This component doesn't render anything, it just sets up subscriptions
  return null;
}
