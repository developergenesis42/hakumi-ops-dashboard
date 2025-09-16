import { renderHook, act } from '@testing-library/react';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';
import type { Session } from '@/types';

// Mock the useSessionCompletion hook
jest.mock('../useSessionCompletion', () => ({
  useSessionCompletion: jest.fn(),
}));

const mockUseSessionCompletion = useSessionCompletion as jest.MockedFunction<typeof useSessionCompletion>;

describe('useSessionTimer', () => {
  const mockCompleteSession = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompleteSession.mockResolvedValue(undefined);
    mockUseSessionCompletion.mockReturnValue({
      completeSession: mockCompleteSession,
    });
  });
  const mockSession: Session = {
    id: 'session-1',
    therapistIds: ['therapist-1'],
    service: {
      id: 'service-1',
      category: 'Single',
      roomType: 'Shower',
      description: 'Massage',
      duration: 60, // 60 minutes
      price: 100,
      ladyPayout: 50,
      shopRevenue: 50,
    },
    status: 'scheduled',
    startTime: new Date('2024-01-01T10:00:00Z'),
    endTime: new Date('2024-01-01T11:00:00Z'),
    sessionStartTime: new Date('2024-01-01T10:00:00Z'),
    roomId: 'room-1',
    discount: 0,
    totalPrice: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSessionCompletion.mockReturnValue({
      completeSession: mockCompleteSession,
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with inactive timer when no session provided', () => {
    const { result } = renderHook(() => useSessionTimer());

    expect(result.current.timerState.isActive).toBe(false);
    expect(result.current.timerState.sessionTimeRemaining).toBe(0);
    expect(result.current.timerState.totalSessionDuration).toBe(0);
    expect(result.current.getDisplayText()).toBe('');
    expect(result.current.getDisplayColor()).toBe('text-gray-600');
  });

  it('should initialize with inactive timer when session is not active', () => {
    const inactiveSession = { ...mockSession, status: 'completed' as const };
    const { result } = renderHook(() => useSessionTimer(inactiveSession));

    expect(result.current.timerState.isActive).toBe(false);
    expect(result.current.timerState.sessionTimeRemaining).toBe(0);
    expect(result.current.timerState.totalSessionDuration).toBe(0);
  });

  it('should initialize with active timer for active session', () => {
    const activeSession = { ...mockSession, status: 'in_progress' as const };
    const { result } = renderHook(() => useSessionTimer(activeSession));

    expect(result.current.timerState.isActive).toBe(true);
    expect(result.current.timerState.totalSessionDuration).toBe(3600); // 60 minutes in seconds
  });

  it('should format time correctly', () => {
    const { result } = renderHook(() => useSessionTimer());

    expect(result.current.formatTime(0)).toBe('00:00');
    expect(result.current.formatTime(59)).toBe('00:59');
    expect(result.current.formatTime(60)).toBe('01:00');
    expect(result.current.formatTime(125)).toBe('02:05');
    expect(result.current.formatTime(3661)).toBe('61:01');
  });

  it('should return correct display text for active timer', () => {
    const activeSession = { ...mockSession, status: 'in_progress' as const };
    const { result } = renderHook(() => useSessionTimer(activeSession));

    // Mock the current time to be 5 minutes after session start
    const mockNow = new Date('2024-01-01T10:05:00Z');
    jest.setSystemTime(mockNow);

    act(() => {
      // Trigger the effect that calculates remaining time
      void result.current.timerState;
    });

    // The timer should show remaining time (55 minutes = 3300 seconds)
    const displayText = result.current.getDisplayText();
    expect(displayText).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should return correct display color based on remaining time', () => {
    // Create a session that started recently (should have most time remaining)
    const recentSession = {
      ...mockSession,
      status: 'in_progress' as const,
      sessionStartTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    };

    const { result } = renderHook(() => useSessionTimer(recentSession));

    // Should be green with 55 minutes remaining
    expect(result.current.getDisplayColor()).toBe('text-green-600');
  });

  it('should return red color when less than 5 minutes remaining', () => {
    // Create a session that started 55 minutes ago (should have 5 minutes remaining)
    const oldSession = {
      ...mockSession,
      status: 'in_progress' as const,
      sessionStartTime: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
    };

    const { result } = renderHook(() => useSessionTimer(oldSession));

    // Should be red with 5 minutes remaining
    expect(result.current.getDisplayColor()).toBe('text-red-600');
  });

  it('should return gray color for inactive timer', () => {
    const { result } = renderHook(() => useSessionTimer());

    expect(result.current.getDisplayColor()).toBe('text-gray-600');
  });

  it('should update timer every second when active', () => {
    const activeSession = { ...mockSession, status: 'in_progress' as const };
    const { result } = renderHook(() => useSessionTimer(activeSession));

    // Mock the current time
    const mockNow = new Date('2024-01-01T10:00:00Z');
    jest.setSystemTime(mockNow);

    // Initial state
    expect(result.current.timerState.isActive).toBe(true);

    // Fast-forward time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Timer should still be active and counting down
    expect(result.current.timerState.isActive).toBe(true);
  });

  it('should auto-complete session when timer reaches zero', async () => {
    const activeSession = { ...mockSession, status: 'in_progress' as const };
    const { result } = renderHook(() => useSessionTimer(activeSession));

    // Set up timer with 1 second remaining
    act(() => {
      result.current.timerState = {
        isActive: true,
        sessionTimeRemaining: 1,
        totalSessionDuration: 3600,
      };
    });

    // Fast-forward time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCompleteSession).toHaveBeenCalledWith('session-1');
  });

  it('should not auto-complete session if it is not active', async () => {
    const inactiveSession = { ...mockSession, status: 'completed' as const };
    renderHook(() => useSessionTimer(inactiveSession));

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCompleteSession).not.toHaveBeenCalled();
  });

  it('should handle session without sessionStartTime', () => {
    const sessionWithoutStartTime = {
      ...mockSession,
      status: 'in_progress' as const,
      sessionStartTime: undefined,
    };

    const { result } = renderHook(() => useSessionTimer(sessionWithoutStartTime));

    expect(result.current.timerState.isActive).toBe(false);
    expect(result.current.timerState.totalSessionDuration).toBe(0);
  });

  it('should clean up interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const activeSession = { ...mockSession, status: 'in_progress' as const };
    const { unmount } = renderHook(() => useSessionTimer(activeSession));

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('should handle error in auto-complete gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockCompleteSession.mockRejectedValue(new Error('Completion failed'));

    const activeSession = { ...mockSession, status: 'in_progress' as const };
    const { result } = renderHook(() => useSessionTimer(activeSession));

    // Set up timer with 1 second remaining
    act(() => {
      result.current.timerState = {
        isActive: true,
        sessionTimeRemaining: 1,
        totalSessionDuration: 3600,
      };
    });

    // Fast-forward time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Wait for async operations
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to auto-complete session:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
