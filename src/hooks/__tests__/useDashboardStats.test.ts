import { renderHook } from '@testing-library/react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useApp } from '@/hooks/useApp';
import type { AppState } from '@/types';

// Mock the useApp hook
jest.mock('../useApp', () => ({
  useApp: jest.fn(),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

describe('useDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate total expenses correctly', () => {
    const mockState = {
      sessions: [],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '1', type: 'Lube' as const, amount: 160, timestamp: new Date(), therapistId: '1' },
            { id: '2', type: 'Towel' as const, amount: 160, timestamp: new Date(), therapistId: '1' },
          ],
        },
        {
          id: '2',
          name: 'Therapist 2',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '3', type: 'Other' as const, amount: 50, timestamp: new Date(), therapistId: '2' },
            { id: '4', type: 'Condom 12' as const, amount: 180, timestamp: new Date(), therapistId: '2' },
          ],
        },
        {
          id: '3',
          name: 'Therapist 3',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [], // No expenses
        },
      ],
    };

    mockUseApp.mockReturnValue({
      state: {
        ...mockState,
        currentPhase: 'daily-operations',
        therapists: [],
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
      dispatch: jest.fn(),
    } as { state: AppState; dispatch: jest.Mock });

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.totalExpenses).toBe(550); // 160 + 160 + 50 + 180
  });

  it('should return 0 when no therapists have expenses', () => {
    const mockState = {
      sessions: [],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [],
        },
        {
          id: '2',
          name: 'Therapist 2',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [],
        },
      ],
    };

    mockUseApp.mockReturnValue({
      state: {
        ...mockState,
        currentPhase: 'daily-operations',
        therapists: [],
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
      dispatch: jest.fn(),
    } as { state: AppState; dispatch: jest.Mock });

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.totalExpenses).toBe(0);
  });

  it('should return 0 when no therapists in roster', () => {
    const mockState = {
      sessions: [],
      todayRoster: [],
    };

    mockUseApp.mockReturnValue({
      state: {
        ...mockState,
        currentPhase: 'daily-operations',
        therapists: [],
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
      dispatch: jest.fn(),
    } as { state: AppState; dispatch: jest.Mock });

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.totalExpenses).toBe(0);
  });

  it('should include totalExpenses in the returned stats', () => {
    const mockState = {
      sessions: [],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '1', type: 'Lube' as const, amount: 160, timestamp: new Date(), therapistId: '1' },
          ],
        },
      ],
    };

    mockUseApp.mockReturnValue({
      state: {
        ...mockState,
        currentPhase: 'daily-operations',
        therapists: [],
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
      dispatch: jest.fn(),
    } as { state: AppState; dispatch: jest.Mock });

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current).toHaveProperty('totalExpenses');
    expect(result.current.totalExpenses).toBe(160);
  });

  it('should add expenses to shop revenue', () => {
    const mockState = {
      sessions: [
        {
          id: '1',
          therapistIds: ['1'],
          service: {
            id: '1',
            category: 'Single' as const,
            roomType: 'Shower' as const,
            duration: 60,
            price: 1000,
            ladyPayout: 400,
            shopRevenue: 600,
            description: 'Test service',
          },
          roomId: '1',
          startTime: new Date(),
          endTime: new Date(),
          discount: 0,
          totalPrice: 1000,
          status: 'completed' as const,
        },
      ],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '1', type: 'Lube' as const, amount: 160, timestamp: new Date(), therapistId: '1' },
          ],
        },
      ],
    };

    mockUseApp.mockReturnValue({
      state: {
        ...mockState,
        currentPhase: 'daily-operations',
        therapists: [],
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
      dispatch: jest.fn(),
    } as { state: AppState; dispatch: jest.Mock });

    const { result } = renderHook(() => useDashboardStats());

    // Shop revenue should be 600 (gross) + 160 (lady purchases) = 760
    expect(result.current.shopRevenue).toBe(760);
    expect(result.current.totalExpenses).toBe(160);
  });
});
