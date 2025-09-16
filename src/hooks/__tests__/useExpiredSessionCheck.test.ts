import { renderHook, act } from '@testing-library/react';
import { useExpiredSessionCheck } from '@/hooks/useExpiredSessionCheck';
import { useApp } from '@/hooks/useApp';
import type { AppState } from '@/types';
import { rosterService } from '@/services/rosterService';
import { sessionService } from '@/services/sessionService';
import { isSessionCompleted } from '@/utils/helpers';
import type { Session, Therapist } from '@/types';

// Mock dependencies
jest.mock('../useApp');
jest.mock('../../services/rosterService');
jest.mock('../../services/sessionService');
jest.mock('../../utils/helpers');

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockRosterService = rosterService as jest.Mocked<typeof rosterService>;
const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;
const mockIsSessionCompleted = isSessionCompleted as jest.MockedFunction<typeof isSessionCompleted>;

describe('useExpiredSessionCheck', () => {
  const mockDispatch = jest.fn();
  const mockSessions: Session[] = [
    {
      id: 'session-1',
      therapistIds: ['therapist-1'],
      service: {
        id: 'service-1',
        category: 'Single',
        roomType: 'Shower',
        description: 'Massage',
        duration: 60,
        price: 100,
        ladyPayout: 50,
        shopRevenue: 50,
      },
      status: 'scheduled',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T11:00:00Z'),
      roomId: 'room-1',
      discount: 0,
      totalPrice: 100,
    },
    {
      id: 'session-2',
      therapistIds: ['therapist-2'],
      service: {
        id: 'service-2',
        category: 'Single',
        roomType: 'Shower',
        description: 'Facial',
        duration: 30,
        price: 80,
        ladyPayout: 40,
        shopRevenue: 40,
      },
      status: 'scheduled',
      startTime: new Date('2024-01-01T11:00:00Z'),
      endTime: new Date('2024-01-01T11:30:00Z'),
      roomId: 'room-2',
      discount: 0,
      totalPrice: 80,
    },
  ];

  const mockTherapists: Therapist[] = [
    {
      id: 'therapist-1',
      name: 'John Doe',
      status: 'in-session',
      totalEarnings: 100,
      totalSessions: 5,
      expenses: [],
    },
    {
      id: 'therapist-2',
      name: 'Jane Smith',
      status: 'in-session',
      totalEarnings: 200,
      totalSessions: 10,
      expenses: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue({
      state: {
        sessions: mockSessions,
        todayRoster: mockTherapists,
      } as AppState,
      dispatch: mockDispatch,
    });
    mockSessionService.updateSessionPartial.mockResolvedValue(mockSessions[0]);
    mockRosterService.updateTherapistStats.mockResolvedValue(undefined);
  });

  it('should check for expired sessions and complete them', async () => {
    // Mock that session-1 is expired
    mockIsSessionCompleted.mockImplementation((session) => session.id === 'session-1');

    const { result } = renderHook(() => useExpiredSessionCheck());

    await act(async () => {
      await result.current.checkExpiredSessions();
    });

    // Should update session status
    expect(mockSessionService.updateSessionPartial).toHaveBeenCalledWith('session-1', {
      status: 'completed',
    });

    // Should update therapist stats
    expect(mockRosterService.updateTherapistStats).toHaveBeenCalledWith(
      'therapist-1',
      150, // 100 + 50
      6 // 5 + 1
    );

    // Should dispatch completion
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'COMPLETE_SESSION',
      payload: 'session-1',
    });
  });

  it('should handle multiple therapists in a session', async () => {
    const multiTherapistSession: Session = {
      id: 'session-3',
      therapistIds: ['therapist-1', 'therapist-2'],
      service: {
        id: 'service-3',
        category: 'Double',
        roomType: 'Double Bed Shower (large)',
        description: 'Double Massage',
        duration: 90,
        price: 200,
        ladyPayout: 100,
        shopRevenue: 100,
      },
      status: 'scheduled',
      startTime: new Date('2024-01-01T12:00:00Z'),
      endTime: new Date('2024-01-01T13:30:00Z'),
      roomId: 'room-3',
      discount: 0,
      totalPrice: 200,
    };

    mockUseApp.mockReturnValue({
      state: {
        sessions: [multiTherapistSession],
        todayRoster: mockTherapists,
      } as AppState,
      dispatch: mockDispatch,
    });

    mockIsSessionCompleted.mockImplementation((session) => session.id === 'session-3');

    const { result } = renderHook(() => useExpiredSessionCheck());

    await act(async () => {
      await result.current.checkExpiredSessions();
    });

    // Should update both therapists with split payout
    expect(mockRosterService.updateTherapistStats).toHaveBeenCalledWith(
      'therapist-1',
      150, // 100 + 50 (half of 100)
      6 // 5 + 1
    );
    expect(mockRosterService.updateTherapistStats).toHaveBeenCalledWith(
      'therapist-2',
      250, // 200 + 50 (half of 100)
      11 // 10 + 1
    );
  });

  it('should handle session service update error gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockIsSessionCompleted.mockImplementation((session) => session.id === 'session-1');
    mockSessionService.updateSessionPartial.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useExpiredSessionCheck());

    await act(async () => {
      await result.current.checkExpiredSessions();
    });

    // Should still dispatch completion even if service update fails
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'COMPLETE_SESSION',
      payload: 'session-1',
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to auto-complete expired session:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle missing therapist in roster', async () => {
    mockIsSessionCompleted.mockImplementation((session) => session.id === 'session-1');

    // Remove therapist from roster
    mockUseApp.mockReturnValue({
      state: {
        currentPhase: 'daily-operations',
        therapists: [],
        sessions: mockSessions,
        todayRoster: [], // Empty roster
        rooms: [],
        services: [],
        walkOuts: [],
        dailyStats: {
          totalSlips: 0,
          totalRevenue: 0,
          totalPayouts: 0,
          totalDiscounts: 0,
          shopRevenue: 0,
          walkOutCount: 0,
          completedSessions: 0,
        },
        history: [],
        undoStack: [],
      } as AppState,
      dispatch: mockDispatch,
    });

    const { result } = renderHook(() => useExpiredSessionCheck());

    await act(async () => {
      await result.current.checkExpiredSessions();
    });

    // Should still update session status
    expect(mockSessionService.updateSessionPartial).toHaveBeenCalledWith('session-1', {
      status: 'completed',
    });

    // Should not try to update therapist stats
    expect(mockRosterService.updateTherapistStats).not.toHaveBeenCalled();

    // Should still dispatch completion
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'COMPLETE_SESSION',
      payload: 'session-1',
    });
  });

  it('should not process non-expired sessions', async () => {
    // Mock that no sessions are expired
    mockIsSessionCompleted.mockReturnValue(false);

    const { result } = renderHook(() => useExpiredSessionCheck());

    await act(async () => {
      await result.current.checkExpiredSessions();
    });

    // Should not update any sessions
    expect(mockSessionService.updateSessionPartial).not.toHaveBeenCalled();
    expect(mockRosterService.updateTherapistStats).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should process only active sessions', async () => {
    const mixedSessions: Session[] = [
      ...mockSessions,
      {
        id: 'session-3',
        therapistIds: ['therapist-3'],
        service: {
          id: 'service-3',
          category: 'Single',
          roomType: 'Shower',
          description: 'Completed Massage',
          duration: 60,
          price: 100,
          ladyPayout: 50,
          shopRevenue: 50,
        },
        status: 'completed', // Not active
        startTime: new Date('2024-01-01T09:00:00Z'),
        endTime: new Date('2024-01-01T10:00:00Z'),
        roomId: 'room-3',
        discount: 0,
        totalPrice: 100,
      },
    ];

    mockUseApp.mockReturnValue({
      state: {
        sessions: mixedSessions,
        todayRoster: mockTherapists,
      } as AppState,
      dispatch: mockDispatch,
    });

    // Mock that all sessions are expired
    mockIsSessionCompleted.mockReturnValue(true);

    const { result } = renderHook(() => useExpiredSessionCheck());

    await act(async () => {
      await result.current.checkExpiredSessions();
    });

    // Should only process active sessions (session-1 and session-2)
    expect(mockSessionService.updateSessionPartial).toHaveBeenCalledTimes(2);
    expect(mockSessionService.updateSessionPartial).toHaveBeenCalledWith('session-1', {
      status: 'completed',
    });
    expect(mockSessionService.updateSessionPartial).toHaveBeenCalledWith('session-2', {
      status: 'completed',
    });
    expect(mockSessionService.updateSessionPartial).not.toHaveBeenCalledWith('session-3', expect.anything());
  });
});
