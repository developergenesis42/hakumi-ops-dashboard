import { useCallback } from 'react';
import { useApp } from '@/hooks/useApp';
import { sessionService } from '@/services/sessionService';
import type { Session } from '@/types';

export function useSessionPersistence() {
  const { dispatch } = useApp();

  const createSession = useCallback(async (session: Session) => {
    // Update local state immediately for optimistic UI
    dispatch({ 
      type: 'START_SESSION', 
      payload: session 
    });
    
    // Save to Supabase in background
    const savedSession = await sessionService.createSession(session);
    
    return savedSession;
  }, [dispatch]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>) => {
    try {
      // Convert actualEndTime to string if it exists
      const sessionUpdate = {
        ...updates,
        actualEndTime: updates.actualEndTime ? updates.actualEndTime.toISOString() : undefined
      };
      
      // Update in Supabase first
      const updatedSession = await sessionService.updateSessionPartial(sessionId, sessionUpdate);
      
      // Then update local state
      dispatch({ 
        type: 'UPDATE_SESSION', 
        payload: { sessionId, updates: updatedSession } 
      });
      
      return updatedSession;
    } catch (error) {
      // Still update local state even if Supabase fails
      dispatch({ 
        type: 'UPDATE_SESSION', 
        payload: { sessionId, updates } 
      });
      throw error;
    }
  }, [dispatch]);

  const completeSession = useCallback(async (sessionId: string) => {
    try {
      // Update status in Supabase first
      await sessionService.updateSessionPartial(sessionId, { status: 'completed' });
      
      // Then update local state
      dispatch({ 
        type: 'COMPLETE_SESSION', 
        payload: sessionId 
      });
    } catch (error) {
      // Still update local state even if Supabase fails
      dispatch({ 
        type: 'COMPLETE_SESSION', 
        payload: sessionId 
      });
      throw error;
    }
  }, [dispatch]);

  return {
    createSession,
    updateSession,
    completeSession
  };
}
