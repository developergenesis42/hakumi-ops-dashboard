import type { Room, Session } from '@/types';

export interface RoomState {
  rooms: Room[];
}

export interface RoomAction {
  type: 'START_SESSION' | 'START_SESSION_TIMER' | 'COMPLETE_SESSION' | 'LOAD_SESSIONS' | 'LOAD_SUPABASE_DATA' | 'LOAD_ROOMS' | 'RESET_DAY' | 'GLOBAL_RESET';
  payload?: Session | 
            string | 
            { sessionId: string } | 
            Session[] | 
            { rooms: Room[] } |
            Room[];
}

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'START_SESSION': {
      // Room stays available during prep phase - will be occupied when timer starts
      return state;
    }

    case 'START_SESSION_TIMER': {
      // This will be handled in the combined reducer with access to session data
      return state;
    }

    case 'COMPLETE_SESSION': {
      const sessionId = typeof action.payload === 'string' ? action.payload : (action.payload as { sessionId: string }).sessionId;
      const completedSession = state.rooms.find(r => r.currentSession?.id === sessionId);
      if (!completedSession) return state;

      const roomsAfterSession = state.rooms.map(r => {
        if (r.currentSession?.id === sessionId) {
          return { ...r, status: 'available' as const, currentSession: undefined };
        }
        return r;
      });

      return {
        ...state,
        rooms: roomsAfterSession
      };
    }

    case 'LOAD_SESSIONS': {
      const loadedSessions = action.payload as Session[];
      
      // Update room status based on active sessions - this is critical for persistence
      const updatedRooms = state.rooms.map(room => {
        // Find active session for this room
        const activeSession = loadedSessions.find((session: Session) => 
          session.status === 'in_progress' && 
          session.roomId === room.id
        );
        
        if (activeSession) {
          return {
            ...room,
            status: 'occupied' as const,
            currentSession: activeSession
          };
        } else {
          return {
            ...room,
            status: 'available' as const,
            currentSession: undefined
          };
        }
      });

      return {
        ...state,
        rooms: updatedRooms
      };
    }

    case 'LOAD_ROOMS': {
      const roomsPayload = action.payload as Room[];
      return {
        ...state,
        rooms: roomsPayload
      };
    }

    case 'LOAD_SUPABASE_DATA': {
      // Don't override room status if there are active sessions
      const hasActiveSessions = state.rooms.some(room => room.currentSession);
      
      let updatedRooms = (action.payload as { rooms: Room[] }).rooms;
      if (hasActiveSessions) {
        // Preserve room status for rooms with active sessions
        updatedRooms = (action.payload as { rooms: Room[] }).rooms.map((room: Room) => {
          const activeSession = state.rooms.find(r => 
            r.currentSession && r.id === room.id
          );
          
          if (activeSession?.currentSession) {
            return {
              ...room,
              status: 'occupied' as const,
              currentSession: activeSession.currentSession
            };
          }
          
          return room;
        });
      }

      return {
        ...state,
        rooms: updatedRooms
      };
    }

    case 'RESET_DAY': {
      return {
        ...state,
        rooms: state.rooms.map(room => ({ ...room, status: 'available', currentSession: undefined }))
      };
    }

    case 'GLOBAL_RESET': {
      return {
        ...state,
        rooms: state.rooms.map(room => ({ ...room, status: 'available' }))
      };
    }

    default:
      return state;
  }
}