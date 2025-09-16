import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/useApp';

interface GlobalHeaderProps {
  children?: React.ReactNode;
}

export function GlobalHeader({ children }: GlobalHeaderProps) {
  const { state, dispatch } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dateString = currentTime.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const timeString = currentTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    second: '2-digit',
    hour12: true 
  });



  const handlePhaseChange = (phase: string) => {
    dispatch({ type: 'SET_PHASE', payload: phase as 'roster-setup' | 'daily-operations' | 'closing-out' | 'total-stats' });
  };


  return (
    <header className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-[9999] w-full">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center h-24 px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="flex items-center">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                HAKUMI NURU MASSAGE
              </h1>
            </div>
          </div>

          {/* Spacer to push time/date to center */}
          <div className="flex-1 ml-16"></div>

          {/* Time/Date Display - Center */}
          <div className="text-center px-16">
            <div 
              className="text-lg font-semibold text-green-400"
              style={{
                color: '#4ade80', // green-400
                textShadow: '0 0 6px rgba(74, 222, 128, 0.5)',
                filter: 'drop-shadow(0 0 3px rgba(74, 222, 128, 0.3))'
              }}
            >
              {dateString} • {timeString}
            </div>
          </div>

          {/* Spacer to push navigation to right */}
          <div className="flex-1 mr-16"></div>

          {/* Navigation and User Menu - Right */}
          <div className="flex items-center space-x-16">
            {/* Navigation */}
            <nav className="flex items-center space-x-8">
              <button
                onClick={() => handlePhaseChange('roster-setup')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.currentPhase === 'roster-setup'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Roster
              </button>
              <button
                onClick={() => handlePhaseChange('daily-operations')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.currentPhase === 'daily-operations'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handlePhaseChange('closing-out')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.currentPhase === 'closing-out'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Closing
              </button>
              <button
                onClick={() => handlePhaseChange('total-stats')}
                className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  state.currentPhase === 'total-stats'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Stats
              </button>
            </nav>

          </div>
        </div>
      </div>


      {/* Page-specific content */}
      {children}
    </header>
  );
}

export default GlobalHeader;
