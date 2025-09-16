import type { Session } from '@/types';

export interface SessionState {
  sessions: Session[];
}

export interface SessionAction {
  type: 'START_SESSION' | 'COMPLETE_SESSION' | 'UPDATE_SESSION' | 'MANUAL_ADD_SESSION' | 'LOAD_SESSIONS' | 'START_SESSION_TIMER' | 'UPDATE_SESSION_STATUS';
  payload?: Session | 
            string | 
            { sessionId: string; actualEndTime?: string; actualDuration?: number } |
            { sessionId: string; updates: Partial<Session> } |
            Session[] |
            { sessionId: string; status: Session['status']; sessionStartTime?: Date; isInPrepPhase?: boolean };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'START_SESSION': {
      const prepStartTime = new Date();
      const sessionPayload = action.payload as Session;
      
      // Calculate proper end time based on service duration
      const sessionEndTime = new Date(prepStartTime.getTime() + sessionPayload.service.duration * 60 * 1000);
      
      // Validate therapist IDs are valid UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validTherapistIds = sessionPayload.therapistIds.filter(id => uuidRegex.test(id));
      
      if (validTherapistIds.length === 0) {
        console.error('❌ No valid therapist IDs found in session:', sessionPayload.therapistIds);
        // Return current state without adding invalid session
        return state;
      }
      
      // Session starts in prep phase - NO auto timer start
      const newSession: Session = {
        ...sessionPayload,
        therapistIds: validTherapistIds, // Use only valid therapist IDs
        startTime: prepStartTime, // Will be updated when timer actually starts
        endTime: sessionEndTime, // Calculate proper end time based on service duration
        prepStartTime: prepStartTime,
        isInPrepPhase: true,
        status: 'scheduled' as const,
        sessionStartTime: undefined // No session start time until manually started
      };

      return {
        ...state,
        sessions: [...state.sessions, newSession]
      };
    }

    case 'COMPLETE_SESSION': {
      // Handle both old format (string) and new format (object with timing data)
      const sessionId = typeof action.payload === 'string' ? action.payload : (action.payload as { sessionId: string; actualEndTime?: string; actualDuration?: number }).sessionId;
      const timingData = typeof action.payload === 'object' ? action.payload as { sessionId: string; actualEndTime?: string; actualDuration?: number } : { sessionId: '', actualEndTime: undefined, actualDuration: undefined };
      
      const updatedSessions = state.sessions.map(s => {
        if (s.id === sessionId) {
          return { 
            ...s, 
            status: 'completed' as const,
            actualEndTime: timingData.actualEndTime ? new Date(timingData.actualEndTime) : undefined,
            actualDuration: timingData.actualDuration
          };
        }
        return s;
      });

      return {
        ...state,
        sessions: updatedSessions
      };
    }

    case 'START_SESSION_TIMER': {
      const sessionId = action.payload as string;
      const now = new Date();
      // Use exact time for timer start - no rounding to preserve accurate duration
      
      const updatedSessions = state.sessions.map(s => {
        if (s.id === sessionId) {
          const sessionEndTime = new Date(now.getTime() + s.service.duration * 60000);
          return {
            ...s,
            startTime: now,
            endTime: sessionEndTime,
            sessionStartTime: now,
            isInPrepPhase: false,
            status: 'in_progress' as const
          };
        }
        return s;
      });

      return {
        ...state,
        sessions: updatedSessions
      };
    }

    case 'UPDATE_SESSION': {
      const updatePayload = action.payload as { sessionId: string; updates: Partial<Session> };
      const updatedSessions = state.sessions.map(session => 
        session.id === updatePayload.sessionId 
          ? { ...session, ...updatePayload.updates }
          : session
      );
      
      return {
        ...state,
        sessions: updatedSessions
      };
    }

    case 'MANUAL_ADD_SESSION': {
      const manualSession: Session = action.payload as Session;
      // The session already has the correct times and status from the modal
      // No need to override them here

      return {
        ...state,
        sessions: [...state.sessions, manualSession]
      };
    }

    case 'LOAD_SESSIONS': {
      const newSessions = action.payload as Session[];
      
      // Merge with existing sessions to avoid duplicates
      // Keep existing sessions that aren't in the new payload, and add/update new ones
      const existingSessions = state.sessions.filter(existing => 
        !newSessions.some(newSession => newSession.id === existing.id)
      );
      
      // Combine existing sessions with new/updated sessions
      const mergedSessions = [...existingSessions, ...newSessions];
      
      // Sort by creation time for consistency
      mergedSessions.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      return {
        ...state,
        sessions: mergedSessions
      };
    }

    case 'UPDATE_SESSION_STATUS': {
      const payload = action.payload as { sessionId: string; status: Session['status']; sessionStartTime?: Date; isInPrepPhase?: boolean };
      if (!payload || !payload.sessionId || !payload.status) {
        return state;
      }

      const updatedSessions = state.sessions.map(session => 
        session.id === payload.sessionId 
          ? { 
              ...session, 
              status: payload.status,
              sessionStartTime: payload.sessionStartTime || session.sessionStartTime,
              isInPrepPhase: payload.isInPrepPhase !== undefined ? payload.isInPrepPhase : session.isInPrepPhase
            }
          : session
      );

      return {
        ...state,
        sessions: updatedSessions
      };
    }

    default:
      return state;
  }
}