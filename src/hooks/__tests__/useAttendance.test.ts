import { renderHook, act } from '@testing-library/react';
import { useAttendance } from '@/hooks/useAttendance';
import { useApp } from '@/hooks/useApp';
import { attendanceService } from '@/services/attendanceService';
import type { AppState } from '@/types';

// Mock dependencies
jest.mock('../useApp');
jest.mock('../../services/attendanceService');

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockAttendanceService = attendanceService as jest.Mocked<typeof attendanceService>;

describe('useAttendance', () => {
  const mockDispatch = jest.fn();
  const mockTodayAttendance = {
    date: '2024-01-01',
    records: [
      {
        therapistId: 'therapist-1',
        therapistName: 'John Doe',
        checkInTime: new Date('2024-01-01T09:00:00Z'),
        departureTime: undefined,
        workingHours: 0,
        synced: true,
      },
    ],
    totalWorkingHours: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApp.mockReturnValue({
      state: {
        currentPhase: 'daily-operations',
        therapists: [],
        todayRoster: [],
        rooms: [],
        services: [],
        sessions: [],
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
    mockAttendanceService.getTodayAttendance.mockReturnValue(mockTodayAttendance);
    mockAttendanceService.checkInTherapist.mockResolvedValue(undefined);
    mockAttendanceService.departTherapist.mockResolvedValue(undefined);
    mockAttendanceService.retryFailedSyncs.mockResolvedValue(undefined);
    mockAttendanceService.getAllAttendance.mockReturnValue([mockTodayAttendance]);
    mockAttendanceService.clearTodayAttendance.mockReturnValue(undefined);
    mockAttendanceService.clearOldData.mockReturnValue(undefined);
    mockAttendanceService.exportAttendanceData.mockReturnValue('{"data": []}');
    mockAttendanceService.importAttendanceData.mockReturnValue(undefined);

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should initialize with today attendance and online status', () => {
    const { result } = renderHook(() => useAttendance());

    expect(result.current.todayAttendance).toEqual(mockTodayAttendance);
    expect(result.current.isOnline).toBe(true);
  });

  it('should handle offline status', () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useAttendance());

    expect(result.current.isOnline).toBe(false);
  });

  it('should add online/offline event listeners', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useAttendance());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should retry failed syncs when coming back online', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const { unmount } = renderHook(() => useAttendance());

    // Get the online event handler that was registered
    const onlineCall = addEventListenerSpy.mock.calls.find(call => call[0] === 'online');
    expect(onlineCall).toBeDefined();
    
    const onlineHandler = onlineCall![1] as () => void;

    // Simulate going offline then online
    act(() => {
      onlineHandler();
    });

    expect(mockAttendanceService.retryFailedSyncs).toHaveBeenCalled();
    
    unmount();
    addEventListenerSpy.mockRestore();
  });

  it('should check in therapist successfully', async () => {
    const { result } = renderHook(() => useAttendance());

    await act(async () => {
      await result.current.checkInTherapist('therapist-2', 'Jane Doe');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'CHECK_IN_THERAPIST',
      payload: 'therapist-2',
    });
    expect(mockAttendanceService.checkInTherapist).toHaveBeenCalledWith('therapist-2', 'Jane Doe');
    expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
  });

  it('should handle check in error', async () => {
    const error = new Error('Check in failed');
    mockAttendanceService.checkInTherapist.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useAttendance());

    await expect(
      act(async () => {
        await result.current.checkInTherapist('therapist-2', 'Jane Doe');
      })
    ).rejects.toThrow('Check in failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to check in therapist:', error);
    consoleErrorSpy.mockRestore();
  });

  it('should depart therapist successfully', async () => {
    const { result } = renderHook(() => useAttendance());

    await act(async () => {
      await result.current.departTherapist('therapist-1', 'John Doe');
    });

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'DEPART_THERAPIST',
      payload: 'therapist-1',
    });
    expect(mockAttendanceService.departTherapist).toHaveBeenCalledWith('therapist-1', 'John Doe');
    expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
  });

  it('should handle depart error', async () => {
    const error = new Error('Depart failed');
    mockAttendanceService.departTherapist.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useAttendance());

    await expect(
      act(async () => {
        await result.current.departTherapist('therapist-1', 'John Doe');
      })
    ).rejects.toThrow('Depart failed');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to depart therapist:', error);
    consoleErrorSpy.mockRestore();
  });

  it('should get therapist attendance record', () => {
    const { result } = renderHook(() => useAttendance());

    const record = result.current.getTherapistAttendance('therapist-1');

    expect(record).toEqual(mockTodayAttendance.records[0]);
  });

  it('should return undefined for non-existent therapist', () => {
    const { result } = renderHook(() => useAttendance());

    const record = result.current.getTherapistAttendance('non-existent');

    expect(record).toBeUndefined();
  });

  it('should calculate working hours for departed therapist', () => {
    const departedRecord = {
      ...mockTodayAttendance.records[0],
      departureTime: new Date('2024-01-01T17:00:00Z'),
      workingHours: 480, // 8 hours in minutes
      synced: true,
    };

    mockAttendanceService.getTodayAttendance.mockReturnValue({
      ...mockTodayAttendance,
      records: [departedRecord],
    });

    const { result } = renderHook(() => useAttendance());

    const workingHours = result.current.getTherapistWorkingHours('therapist-1');

    expect(workingHours).toBe(480);
  });

  it('should calculate working hours for active therapist', () => {
    const { result } = renderHook(() => useAttendance());

    // Mock current time to be 2 hours after check-in
    const mockNow = new Date('2024-01-01T11:00:00Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    const workingHours = result.current.getTherapistWorkingHours('therapist-1');

    expect(workingHours).toBe(120); // 2 hours in minutes

    jest.useRealTimers();
  });

  it('should return 0 working hours for non-existent therapist', () => {
    const { result } = renderHook(() => useAttendance());

    const workingHours = result.current.getTherapistWorkingHours('non-existent');

    expect(workingHours).toBe(0);
  });

  it('should format working hours correctly', () => {
    const { result } = renderHook(() => useAttendance());

    expect(result.current.formatWorkingHours(0)).toBe('00:00');
    expect(result.current.formatWorkingHours(59)).toBe('00:59');
    expect(result.current.formatWorkingHours(60)).toBe('01:00');
    expect(result.current.formatWorkingHours(125)).toBe('02:05');
    expect(result.current.formatWorkingHours(1440)).toBe('24:00');
  });

  it('should get all attendance records', () => {
    const { result } = renderHook(() => useAttendance());

    const allAttendance = result.current.getAllAttendance();

    expect(allAttendance).toEqual([mockTodayAttendance]);
    expect(mockAttendanceService.getAllAttendance).toHaveBeenCalled();
  });

  it('should retry syncs', async () => {
    const { result } = renderHook(() => useAttendance());

    await act(async () => {
      await result.current.retrySyncs();
    });

    expect(mockAttendanceService.retryFailedSyncs).toHaveBeenCalled();
    expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
  });

  it('should clear today attendance', () => {
    const { result } = renderHook(() => useAttendance());

    act(() => {
      result.current.clearTodayAttendance();
    });

    expect(mockAttendanceService.clearTodayAttendance).toHaveBeenCalled();
    expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
  });

  it('should clear old data', () => {
    const { result } = renderHook(() => useAttendance());

    act(() => {
      result.current.clearOldData();
    });

    expect(mockAttendanceService.clearOldData).toHaveBeenCalled();
  });

  it('should export data', () => {
    const { result } = renderHook(() => useAttendance());

    const exportedData = result.current.exportData();

    expect(exportedData).toBe('{"data": []}');
    expect(mockAttendanceService.exportAttendanceData).toHaveBeenCalled();
  });

  it('should import data', () => {
    const { result } = renderHook(() => useAttendance());
    const jsonData = '{"data": [{"id": "1"}]}';

    act(() => {
      result.current.importData(jsonData);
    });

    expect(mockAttendanceService.importAttendanceData).toHaveBeenCalledWith(jsonData);
    expect(mockAttendanceService.getTodayAttendance).toHaveBeenCalled();
  });
});
