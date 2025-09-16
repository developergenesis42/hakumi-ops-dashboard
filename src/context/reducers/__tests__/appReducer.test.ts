import { appReducer } from '@/context/reducers/index';
import type { AppState, AppAction, Therapist, Room, Service, Session } from '@/types';
import { initialAppState } from '@/data/mockData';

// Mock data for testing
const mockTherapist: Therapist = {
  id: '1',
  name: 'Test Therapist',
  status: 'inactive',
  totalEarnings: 0,
  totalSessions: 0,
  expenses: []
};

const mockTherapist2: Therapist = {
  id: '2',
  name: 'Test Therapist 2',
  status: 'inactive',
  totalEarnings: 100,
  totalSessions: 5,
  expenses: []
};

const mockService: Service = {
  id: '1',
  name: 'Test Service',
  category: 'Single',
  roomType: 'Shower',
  duration: 60,
  price: 100,
  ladyPayout: 40,
  shopRevenue: 60,
  description: 'Test service',
};

const mockRoom: Room = {
  id: '1',
  name: 'Room 1',
  type: 'Shower',
  status: 'available',
};

const mockSession: Session = {
  id: '1',
  therapistIds: ['1'],
  service: mockService,
  roomId: '1',
  startTime: new Date('2024-01-01T10:00:00'),
  endTime: new Date('2024-01-01T11:00:00'),
  discount: 0,
  totalPrice: 100,
  status: 'scheduled',
};

describe('appReducer', () => {
  let initialState: AppState;

  beforeEach(() => {
    initialState = {
      ...initialAppState,
      therapists: [mockTherapist, mockTherapist2],
      rooms: [mockRoom],
      services: [mockService],
      todayRoster: [],
      sessions: [],
      walkOuts: [],
    };
  });

  describe('UNDO_ACTION', () => {
    it('should restore previous state', () => {
      const previousState = {
        ...initialState,
        todayRoster: [mockTherapist],
      };

      const action: AppAction = {
        type: 'UNDO_ACTION',
        payload: { state: previousState },
      };

      const result = appReducer(initialState, action);
      expect(result).toEqual(previousState);
    });
  });

  describe('RESET_DAY', () => {
    it('should reset daily data but keep master data', () => {
      const stateWithData = {
        ...initialState,
        todayRoster: [mockTherapist],
        sessions: [mockSession],
        walkOuts: [],
        rooms: [{ ...mockRoom, status: 'occupied' as const }],
      };

      const action: AppAction = {
        type: 'RESET_DAY',
      };

      const result = appReducer(stateWithData, action);

      expect(result.todayRoster).toEqual([]);
      expect(result.sessions).toEqual([]);
      expect(result.walkOuts).toEqual([]);
      expect(result.rooms[0].status).toBe('available');
      expect(result.therapists).toEqual([mockTherapist, mockTherapist2]); // Master data preserved
      expect(result.services).toEqual([mockService]); // Master data preserved
    });
  });

  describe('GLOBAL_RESET', () => {
    it('should reset everything except master data', () => {
      const stateWithData = {
        ...initialState,
        currentPhase: 'daily-operations' as const,
        todayRoster: [mockTherapist],
        sessions: [mockSession],
        walkOuts: [],
        undoStack: [{
          action: { type: 'TEST', payload: {} },
          timestamp: new Date(),
          description: 'test'
        }],
        history: [{
          action: { type: 'TEST', payload: {} },
          timestamp: new Date(),
          description: 'test action',
          stateSnapshot: {}
        }],
      };

      const action: AppAction = {
        type: 'GLOBAL_RESET',
      };

      const result = appReducer(stateWithData, action);

      expect(result.currentPhase).toBe('roster-setup');
      expect(result.todayRoster).toEqual([]);
      expect(result.sessions).toEqual([]);
      expect(result.walkOuts).toEqual([]);
      expect(result.undoStack).toEqual([]);
      expect(result.history).toEqual([]);
      expect(result.therapists).toEqual([mockTherapist, mockTherapist2]); // Master data preserved
      expect(result.services).toEqual([mockService]); // Master data preserved
      expect(result.rooms[0].status).toBe('available'); // Room status reset
    });
  });

  describe('START_SESSION', () => {
    it('should start a new session and update therapist and room status', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist],
        rooms: [mockRoom],
      };

      const action: AppAction = {
        type: 'START_SESSION',
        payload: {
          id: 'session-1',
          therapistIds: ['1'],
          service: mockService,
          roomId: '1',
          startTime: new Date('2024-01-01T10:00:00'),
          endTime: new Date('2024-01-01T11:00:00'),
          discount: 0,
          totalPrice: 100,
          status: 'scheduled',
        },
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe('session-1');
      expect(result.sessions[0].isInPrepPhase).toBe(true);
      expect(result.sessions[0].prepStartTime).toBeDefined();

      expect(result.todayRoster[0].status).toBe('in-session');
      expect(result.todayRoster[0].currentSession).toBeDefined();

      expect(result.rooms[0].status).toBe('occupied');
      expect(result.rooms[0].currentSession).toBeDefined();

      expect(result.dailyStats.totalSlips).toBe(1);
      expect(result.dailyStats.totalRevenue).toBe(100);
    });

    it('should handle multiple therapists in a session', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist, mockTherapist2],
        rooms: [mockRoom],
      };

      const action: AppAction = {
        type: 'START_SESSION',
        payload: {
          id: 'session-1',
          therapistIds: ['1', '2'],
          service: mockService,
          roomId: '1',
          startTime: new Date('2024-01-01T10:00:00'),
          endTime: new Date('2024-01-01T11:00:00'),
          discount: 0,
          totalPrice: 100,
          status: 'scheduled',
        },
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.todayRoster[0].status).toBe('in-session');
      expect(result.todayRoster[1].status).toBe('in-session');
      expect(result.todayRoster[0].currentSession).toBeDefined();
      expect(result.todayRoster[1].currentSession).toBeDefined();
    });
  });

  describe('COMPLETE_SESSION', () => {
    it('should complete a session and update earnings', () => {
      const stateWithSession = {
        ...initialState,
        todayRoster: [mockTherapist],
        sessions: [mockSession],
        rooms: [{ ...mockRoom, status: 'occupied' as const, currentSession: mockSession.id }],
      };

      const action: AppAction = {
        type: 'COMPLETE_SESSION',
        payload: '1',
      };

      const result = appReducer(stateWithSession, action);

      expect(result.sessions[0].status).toBe('completed');
      expect(result.todayRoster[0].status).toBe('available');
      expect(result.todayRoster[0].currentSession).toBeUndefined();
      expect(result.todayRoster[0].totalEarnings).toBe(40); // ladyPayout
      expect(result.todayRoster[0].totalSessions).toBe(1);

      expect(result.rooms[0].status).toBe('available');
      expect(result.rooms[0].currentSession).toBeUndefined();

      expect(result.dailyStats.totalPayouts).toBe(40);
      expect(result.dailyStats.shopRevenue).toBe(60);
      expect(result.walkOuts).toHaveLength(0);
    });

    it('should split earnings between multiple therapists', () => {
      const multiTherapistSession = {
        ...mockSession,
        therapistIds: ['1', '2'],
      };

      const stateWithSession = {
        ...initialState,
        todayRoster: [mockTherapist, mockTherapist2],
        sessions: [multiTherapistSession],
        rooms: [{ ...mockRoom, status: 'occupied' as const, currentSession: multiTherapistSession.id }],
      };

      const action: AppAction = {
        type: 'COMPLETE_SESSION',
        payload: '1',
      };

      const result = appReducer(stateWithSession, action);

      expect(result.todayRoster[0].totalEarnings).toBe(20); // 40/2
      expect(result.todayRoster[1].totalEarnings).toBe(120); // 100 + 20
      expect(result.todayRoster[0].totalSessions).toBe(1);
      expect(result.todayRoster[1].totalSessions).toBe(6); // 5 + 1
    });
  });

  describe('ADD_TO_ROSTER', () => {
    it('should add therapist to roster', () => {
      const action: AppAction = {
        type: 'ADD_TO_ROSTER',
        payload: mockTherapist,
      };

      const result = appReducer(initialState, action);

      expect(result.todayRoster).toHaveLength(1);
      expect(result.todayRoster[0]).toEqual({
        ...mockTherapist,
        status: 'inactive',
      });
      expect(result.history).toContain('Added Test Therapist to roster');
    });

    it('should not add therapist if already in roster', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist],
      };

      const action: AppAction = {
        type: 'ADD_TO_ROSTER',
        payload: mockTherapist,
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.todayRoster).toHaveLength(1);
    });

    it('should not add therapist if not in master list', () => {
      const unknownTherapist = {
        ...mockTherapist,
        id: 'unknown',
      };

      const action: AppAction = {
        type: 'ADD_TO_ROSTER',
        payload: unknownTherapist,
      };

      const result = appReducer(initialState, action);

      expect(result.todayRoster).toHaveLength(0);
    });
  });

  describe('REMOVE_FROM_ROSTER', () => {
    it('should remove therapist from roster', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist, mockTherapist2],
      };

      const action: AppAction = {
        type: 'REMOVE_FROM_ROSTER',
        payload: '1',
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.todayRoster).toHaveLength(1);
      expect(result.todayRoster[0].id).toBe('2');
      expect(result.history).toContain('Removed Test Therapist from roster');
    });
  });

  describe('CHECK_IN_THERAPIST', () => {
    it('should check in therapist', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist],
      };

      const action: AppAction = {
        type: 'CHECK_IN_THERAPIST',
        payload: '1',
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.todayRoster[0].status).toBe('available');
      expect(result.todayRoster[0].checkInTime).toBeDefined();
      expect(result.history[0]).toMatch(/Checked in Test Therapist at \d{1,2}:\d{2}:\d{2} (AM|PM)/);
    });

    it('should not check in non-existent therapist', () => {
      const action: AppAction = {
        type: 'CHECK_IN_THERAPIST',
        payload: '999',
      };

      const result = appReducer(initialState, action);

      expect(result).toStrictEqual(initialState);
    });
  });

  describe('DEPART_THERAPIST', () => {
    it('should mark therapist as departed and add payout', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [{ ...mockTherapist, totalEarnings: 100 }],
      };

      const action: AppAction = {
        type: 'DEPART_THERAPIST',
        payload: '1',
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.todayRoster[0].status).toBe('departed');
      expect(result.todayRoster[0].departureTime).toBeDefined();
      expect(result.dailyStats.totalPayouts).toBe(100);
      expect(result.history[0]).toMatch(/Departed Test Therapist at \d{1,2}:\d{2}:\d{2} (AM|PM) with net payout ฿100/);
    });
  });

  describe('MANUAL_ADD_SESSION', () => {
    it('should add manual session and update earnings', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist],
      };

      const action: AppAction = {
        type: 'MANUAL_ADD_SESSION',
        payload: {
          id: 'manual-1',
          therapistIds: ['1'],
          service: mockService,
          roomId: '1',
          startTime: new Date(),
          endTime: new Date(),
          discount: 10,
          totalPrice: 90,
          status: 'completed' as const,
        },
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].status).toBe('completed');
      expect(result.todayRoster[0].totalEarnings).toBe(40);
      expect(result.todayRoster[0].totalSessions).toBe(1);
      expect(result.dailyStats.totalSlips).toBe(1);
      expect(result.dailyStats.totalRevenue).toBe(90);
      expect(result.dailyStats.totalDiscounts).toBe(10);
    });
  });

  describe('LOAD_SUPABASE_DATA', () => {
    it('should load data from Supabase', () => {
      const supabaseData = {
        therapists: [mockTherapist],
        rooms: [mockRoom],
        services: [mockService],
      };

      const action: AppAction = {
        type: 'LOAD_SUPABASE_DATA',
        payload: supabaseData,
      };

      const result = appReducer(initialState, action);

      expect(result.therapists).toEqual([mockTherapist]);
      expect(result.rooms).toEqual([mockRoom]);
      expect(result.services).toEqual([mockService]);
    });

    it('should preserve room status when there are active sessions', () => {
      const stateWithActiveSession = {
        ...initialState,
        sessions: [{ ...mockSession, status: 'scheduled' as const }],
        rooms: [{ ...mockRoom, status: 'occupied' as const, currentSession: mockSession.id }],
      };

      const supabaseData = {
        therapists: [mockTherapist],
        rooms: [{ ...mockRoom, status: 'available' as const }],
        services: [mockService],
      };

      const action: AppAction = {
        type: 'LOAD_SUPABASE_DATA',
        payload: supabaseData,
      };

      const result = appReducer(stateWithActiveSession, action);

      expect(result.rooms[0].status).toBe('occupied');
      expect(result.rooms[0].currentSession).toBeDefined();
    });
  });

  describe('LOAD_SESSIONS', () => {
    it('should load sessions and update therapist/room status', () => {
      const stateWithRoster = {
        ...initialState,
        todayRoster: [mockTherapist],
      };

      const activeSession = {
        ...mockSession,
        status: 'scheduled' as const,
      };

      const action: AppAction = {
        type: 'LOAD_SESSIONS',
        payload: [activeSession],
      };

      const result = appReducer(stateWithRoster, action);

      expect(result.sessions).toEqual([activeSession]);
      expect(result.todayRoster[0].status).toBe('in-session');
      expect(result.todayRoster[0].currentSession).toBeDefined();
      expect(result.rooms[0].status).toBe('occupied');
      expect(result.rooms[0].currentSession).toBeDefined();
    });
  });

  describe('undo stack management', () => {
    it('should add to undo stack for most actions', () => {
      const action: AppAction = {
        type: 'ADD_TO_ROSTER',
        payload: mockTherapist,
      };

      const result = appReducer(initialState, action);

      expect(result.undoStack).toHaveLength(1);
      expect(result.undoStack[0].action.type).toBe('ADD_TO_ROSTER');
    });

    it('should not add to undo stack for undo actions', () => {
      const action: AppAction = {
        type: 'UNDO_ACTION',
        payload: { state: initialState },
      };

      const result = appReducer(initialState, action);

      expect(result.undoStack).toEqual(initialState.undoStack);
    });

    it('should limit undo stack to 10 items', () => {
      const stateWithFullUndoStack = {
        ...initialState,
        undoStack: Array(10).fill({
          action: { type: 'TEST', payload: {} },
          timestamp: new Date(),
          description: 'test',
        }),
      };

      const action: AppAction = {
        type: 'ADD_TO_ROSTER',
        payload: mockTherapist,
      };

      const result = appReducer(stateWithFullUndoStack, action);

      expect(result.undoStack).toHaveLength(10);
    });
  });

  describe('unknown actions', () => {
    it('should return state unchanged for unknown actions', () => {
      const action = {
        type: 'UNKNOWN_ACTION' as never,
        payload: 'test'
      };

      const result = appReducer(initialState, action);

      // The reducer adds to undo stack for unknown actions, so state is not exactly the same
      expect(result.undoStack).toHaveLength(1);
      expect(result.undoStack[0].action.type).toBe('UNKNOWN_ACTION');
    });
  });
});
