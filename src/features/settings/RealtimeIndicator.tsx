import { useState, useEffect } from 'react';
import { debugLog } from '@/features/config/environment';

interface RealtimeIndicatorProps {
  className?: string;
}

export default function RealtimeIndicator({ className = '' }: RealtimeIndicatorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Simulate connection status (in a real app, you'd check actual connection)
    const checkConnection = () => {
      setIsConnected(true);
      setLastUpdate(new Date());
      debugLog('RealtimeIndicator: Connection status updated');
    };

    // Check connection immediately
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-xs text-gray-500 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>Live</span>
      </div>
      {lastUpdate && (
        <span className="text-gray-400">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
