import { useState, useEffect, useCallback } from 'react';
import type { Session } from '@/types';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';

interface TimerState {
  isActive: boolean;
  sessionTimeRemaining: number; // in seconds
  totalSessionDuration: number; // in seconds
}

export function useSessionTimer(session?: Session) {
  const { completeSession } = useSessionCompletion();
  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    sessionTimeRemaining: 0,
    totalSessionDuration: 0,
  });

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getDisplayText = useCallback((): string => {
    if (!timerState.isActive) return '';
    return formatTime(timerState.sessionTimeRemaining);
  }, [timerState, formatTime]);

  const getDisplayColor = useCallback((): string => {
    if (!timerState.isActive) return 'text-gray-600';
    // Red if less than 5 minutes remaining, green otherwise
    return timerState.sessionTimeRemaining <= 300 ? 'text-red-600' : 'text-green-600';
  }, [timerState]);

  useEffect(() => {
    if (!session || session.status !== 'in_progress') {
      setTimerState({
        isActive: false,
        sessionTimeRemaining: 0,
        totalSessionDuration: 0,
      });
      return;
    }

    // If session is in prep phase, don't start timer yet
    if (session.isInPrepPhase || !session.sessionStartTime) {
      setTimerState({
        isActive: false,
        sessionTimeRemaining: 0,
        totalSessionDuration: 0,
      });
      return;
    }

    const now = new Date();
    const sessionStartTime = session.sessionStartTime ? new Date(session.sessionStartTime) : null;
    const sessionDuration = session.service.duration * 60; // Convert minutes to seconds
    
    // Calculate session time remaining
    if (!sessionStartTime || isNaN(sessionStartTime.getTime())) {
      setTimerState({
        isActive: false,
        sessionTimeRemaining: 0,
        totalSessionDuration: 0,
      });
      return;
    }
    
    const sessionElapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
    const sessionRemaining = Math.max(0, sessionDuration - sessionElapsed);

    setTimerState({
      isActive: true,
      sessionTimeRemaining: sessionRemaining,
      totalSessionDuration: sessionDuration,
    });
  }, [session]);

  useEffect(() => {
    if (!timerState.isActive || !session) return;

    const interval = setInterval(() => {
      setTimerState(prev => {
        const newSessionRemaining = Math.max(0, prev.sessionTimeRemaining - 1);
        
        // Auto-complete session when timer reaches 0
        if (newSessionRemaining === 0 && session.status === 'in_progress') {
          completeSession(session.id).catch(error => {
            console.error('Failed to auto-complete session:', error);
          });
        }
        
        return {
          ...prev,
          sessionTimeRemaining: newSessionRemaining,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isActive, session, completeSession]);

  return {
    timerState,
    getDisplayText,
    getDisplayColor,
    formatTime,
  };
}