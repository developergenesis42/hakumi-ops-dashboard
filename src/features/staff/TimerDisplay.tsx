import React from 'react';
import type { Therapist, Session } from '@/types';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useAttendance } from '@/hooks/useAttendance';
import { useApp } from '@/hooks/useApp';
import FeatureErrorBoundary from '@/components/FeatureErrorBoundary';

interface TimerDisplayProps {
  therapist: Therapist;
  rooms?: Array<{ id: string; name: string; number?: string }>;
  completedSessions?: number;
}

function TimerDisplay({ therapist, rooms = [], completedSessions = 0 }: TimerDisplayProps) {
  const { state } = useApp();
  const { getTherapistWorkingHours, formatWorkingHours } = useAttendance();

  // Get the current session - handle both string ID and Session object cases
  const currentSession = React.useMemo(() => {
    if (!therapist.currentSession) return null;
    
    // If it's a string, look up the session from state
    if (typeof therapist.currentSession === 'string') {
      return state.sessions.find(s => s.id === therapist.currentSession) || null;
    }
    
    // If it's already a Session object, return it
    return therapist.currentSession as Session;
  }, [therapist.currentSession, state.sessions]);

  const { getDisplayText, getDisplayColor } = useSessionTimer(currentSession || undefined);

  const timerColor = React.useMemo(() => {
    if (therapist.status === 'in-session' && currentSession && currentSession.service) {
      const startTime = currentSession.sessionStartTime || currentSession.startTime;
      const startTimeDate = startTime ? new Date(startTime) : null;
      
      if (!startTimeDate || isNaN(startTimeDate.getTime())) {
        return '#4b5563'; // gray-600 if invalid date
      }
      
      // Additional safety check before calling getTime()
      if (typeof startTimeDate.getTime !== 'function') {
        return '#4b5563'; // gray-600 if not a valid Date object
      }
      
      const timeRemaining = currentSession.service.duration * 60 - Math.floor((new Date().getTime() - startTimeDate.getTime()) / 1000);
      return timeRemaining <= 300 ? '#dc2626' : '#16a34a'; // red-600 or green-600
    }
    if (therapist.status === 'available') return '#059669'; // emerald-600
    if (therapist.status === 'departed') return '#dc2626'; // red-600
    return '#4b5563'; // gray-600
  }, [therapist.status, currentSession]);

  const timerText = React.useMemo(() => {
    if (therapist.status === 'in-session' && currentSession) {
      // Check if session is in prep phase
      if (currentSession.isInPrepPhase) {
        return 'Ready to Start Timer';
      }
      return getDisplayText() || 'Session Active';
    }
    if (therapist.status === 'available') return '00:00';
    if (therapist.status === 'departed') return 'Leave Work';
    return 'Ready';
  }, [therapist.status, currentSession, getDisplayText]);

  const shouldShowWorkingHours = React.useMemo(() => 
    ['available', 'in-session', 'departed'].includes(therapist.status), 
    [therapist.status]
  );

  const workingHours = React.useMemo(() => {
    if (!shouldShowWorkingHours) return null;
    return formatWorkingHours(getTherapistWorkingHours(therapist.id));
  }, [shouldShowWorkingHours, formatWorkingHours, getTherapistWorkingHours, therapist.id]);

  // Calculate session end time for display
  const sessionEndTime = React.useMemo(() => {
    if (therapist.status === 'in-session' && currentSession && currentSession.service) {
      // Use sessionStartTime if timer has started, otherwise use scheduled startTime
      const startTime = currentSession.sessionStartTime || currentSession.startTime;
      const startTimeDate = startTime ? new Date(startTime) : null;
      
      if (startTimeDate && !isNaN(startTimeDate.getTime()) && typeof startTimeDate.getTime === 'function') {
        const endTime = new Date(startTimeDate.getTime() + currentSession.service.duration * 60000);
        return endTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
    }
    return null;
  }, [therapist.status, currentSession]);

  // Don't calculate end time during prep phase - only show when timer starts
  const prepPhaseEndTime = React.useMemo(() => {
    // Don't show end time during prep phase - wait until timer starts
    return null;
  }, []);

  // Get room information for display
  const roomInfo = React.useMemo(() => {
    if (therapist.status === 'in-session' && currentSession && currentSession.roomId) {
      const roomId = currentSession.roomId;
      const room = rooms.find(r => r.id === roomId);
      if (room) {
        return {
          roomId: room.id,
          roomName: room.name,
          roomNumber: room.number || room.name
        };
      }
    }
    return null;
  }, [therapist.status, currentSession, rooms]);

  return (
    <FeatureErrorBoundary featureName={`Timer Display - ${therapist.name}`}>
      <div className="mb-3">
        <div 
          className={`w-full px-3 py-2 bg-white border border-gray-300 rounded text-center font-mono text-lg font-semibold ${getDisplayColor()}`}
          style={{ color: timerColor }}
        >
          {timerText}
        </div>
        
        {/* Room Display */}
        {roomInfo && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 mb-1">Room</div>
            <div className="text-sm font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200">
              {roomInfo.roomNumber}
            </div>
          </div>
        )}
        
        {/* Session End Time Display */}
        {(sessionEndTime || prepPhaseEndTime) && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 mb-1">Ends at</div>
            <div className="text-sm font-mono text-gray-700 font-semibold">
              {sessionEndTime || prepPhaseEndTime}
            </div>
          </div>
        )}
        
        {/* Working Hours Display */}
        {shouldShowWorkingHours && workingHours && (
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-500 mb-1">Working Hours</div>
            <div className="text-sm font-mono text-gray-700">
              {workingHours}
            </div>
          </div>
        )}
        
        {/* Completed Sessions Dots */}
        <div className="mt-3 text-center">
          <div className="text-xs text-gray-500 mb-2">completed rooms</div>
          {completedSessions > 0 ? (
            <>
              <div className="flex justify-center flex-wrap gap-1">
                {Array.from({ length: completedSessions }, (_, index) => (
                  <div
                    key={index}
                    className="w-2 h-2 bg-green-500 rounded-full"
                    title={`Room ${index + 1}`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {completedSessions} room{completedSessions !== 1 ? 's' : ''}
              </div>
            </>
          ) : (
            <div className="text-xs text-gray-400">
              0 rooms
            </div>
          )}
        </div>
      </div>
    </FeatureErrorBoundary>
  );
}

export default React.memo(TimerDisplay);
