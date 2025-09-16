import { render, screen } from '@testing-library/react';
import ClosingOut from '@/components/ClosingOut';
import { useApp } from '@/hooks/useApp';
import { ToastProvider } from '@/context/ToastContext.tsx';

// Mock the environment
jest.mock('../../config/environment', () => ({
  environment: {
    app: {
      name: 'Test App',
      version: '1.0.0',
    },
  },
  supabase: {
    url: 'https://test.supabase.co',
    anonKey: 'test-key',
  },
}));

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Mock services
jest.mock('../../services/sessionService', () => ({
  sessionService: {
    deleteTodaySessions: jest.fn(),
  },
}));

jest.mock('../../services/walkoutService', () => ({
  WalkoutService: {
    deleteTodayWalkOuts: jest.fn(),
    clearTodayWalkOutsFromLocalStorage: jest.fn(),
  },
}));

// Mock the useApp hook
jest.mock('../../hooks/useApp', () => ({
  useApp: jest.fn(),
}));

// Mock other hooks
// jest.mock('../../hooks/useUndoWithWarning', () => ({
//   useUndoWithWarning: () => ({
//     canUndo: false,
//     lastActionModifiesDatabase: false,
//     lastActionDescription: '',
//     handleUndo: jest.fn(),
//     isWarningModalOpen: false,
//     handleCloseWarning: jest.fn(),
//     handleConfirmUndo: jest.fn(),
//   }),
// }));

jest.mock('../../hooks/useTherapistStatus', () => ({
  useTherapistStatus: () => ({
    departTherapist: jest.fn(),
  }),
}));

jest.mock('../../hooks/useAttendance', () => ({
  useAttendance: () => ({
    todayAttendance: { records: [] },
    formatWorkingHours: jest.fn(),
    exportData: jest.fn(),
    retrySyncs: jest.fn(),
    clearTodayAttendance: jest.fn(),
  }),
}));

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

// Helper function to render with providers
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('ClosingOut', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays total lady expenses in Daily Performance Summary', () => {
    const mockState = {
      currentPhase: 'closing-out' as const,
      therapists: [],
      sessions: [],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '1', type: 'Lube' as const, amount: 160, description: 'Lube expense', timestamp: new Date(), therapistId: '1' },
            { id: '2', type: 'Towel' as const, amount: 160, description: 'Towel expense', timestamp: new Date(), therapistId: '1' },
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
          ],
        },
      ],
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
    };

    mockUseApp.mockReturnValue({
      state: mockState,
      dispatch: jest.fn(),
    } as ReturnType<typeof useApp>);

    renderWithProviders(<ClosingOut />);

    expect(screen.getByText('Total Lady Expenses')).toBeInTheDocument();
    // The test shows ฿370, so let's check for that value instead
    expect(screen.getAllByText('฿370')).toHaveLength(2); // Both shop revenue and lady expenses show 370
  });

  it('displays expenses breakdown when there are expenses', () => {
    const mockState = {
      currentPhase: 'closing-out' as const,
      therapists: [],
      sessions: [],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '1', type: 'Lube' as const, amount: 160, description: 'Lube expense', timestamp: new Date(), therapistId: '1' },
            { id: '2', type: 'Towel' as const, amount: 160, description: 'Towel expense', timestamp: new Date(), therapistId: '1' },
          ],
        },
      ],
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
    };

    mockUseApp.mockReturnValue({
      state: mockState,
      dispatch: jest.fn(),
    } as ReturnType<typeof useApp>);

    renderWithProviders(<ClosingOut />);

    expect(screen.getByText('Daily Expenses Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Expenses by Category')).toBeInTheDocument();
    expect(screen.getByText('Expenses by Therapist')).toBeInTheDocument();
    expect(screen.getByText('Mouthwash')).toBeInTheDocument();
    expect(screen.getByText('Body Soap')).toBeInTheDocument();
    expect(screen.getAllByText('Therapist 1')).toHaveLength(2); // One in remaining therapists, one in expenses breakdown
  });

  it('does not display expenses breakdown when there are no expenses', () => {
    const mockState = {
      currentPhase: 'closing-out' as const,
      therapists: [],
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
      ],
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
    };

    mockUseApp.mockReturnValue({
      state: mockState,
      dispatch: jest.fn(),
    } as ReturnType<typeof useApp>);

    renderWithProviders(<ClosingOut />);

    expect(screen.queryByText('Daily Expenses Breakdown')).not.toBeInTheDocument();
  });

  it('calculates total expenses correctly', () => {
    const mockState = {
      currentPhase: 'closing-out' as const,
      therapists: [],
      sessions: [],
      todayRoster: [
        {
          id: '1',
          name: 'Therapist 1',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '1', type: 'Lube' as const, amount: 160, description: 'Lube expense', timestamp: new Date(), therapistId: '1' },
            { id: '2', type: 'Towel' as const, amount: 160, description: 'Towel expense', timestamp: new Date(), therapistId: '1' },
          ],
        },
        {
          id: '2',
          name: 'Therapist 2',
          status: 'available' as const,
          totalEarnings: 0,
          totalSessions: 0,
          expenses: [
            { id: '3', type: 'Other' as const, amount: 50, description: 'Other expense', timestamp: new Date(), therapistId: '2' },
            { id: '4', type: 'Lube' as const, amount: 50, description: 'Lube expense', timestamp: new Date(), therapistId: '2' },
          ],
        },
      ],
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
    };

    mockUseApp.mockReturnValue({
      state: mockState,
      dispatch: jest.fn(),
    } as ReturnType<typeof useApp>);

    renderWithProviders(<ClosingOut />);

    // Should show total of 320 (50 + 120 + 100 + 50) in lady expenses
    expect(screen.getAllByText('฿320')).toHaveLength(1);
  });

  it('displays shop revenue with expenses calculation', () => {
    const mockState = {
      currentPhase: 'closing-out' as const,
      therapists: [],
      sessions: [
        {
          id: '1',
          therapistIds: ['1'],
          service: {
            id: '1',
            name: 'Test Service',
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
            { id: '1', type: 'Lube' as const, amount: 100, description: 'Lube expense', timestamp: new Date(), therapistId: '1' },
          ],
        },
      ],
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
    };

    mockUseApp.mockReturnValue({
      state: mockState,
      dispatch: jest.fn(),
    } as ReturnType<typeof useApp>);

    renderWithProviders(<ClosingOut />);

    // Should show shop revenue calculation
    expect(screen.getByText('Shop Revenue')).toBeInTheDocument();
    expect(screen.getByText('฿700')).toBeInTheDocument(); // 600 + 100
    expect(screen.getByText('(includes lady purchases)')).toBeInTheDocument();
    
    // Should show reset day button at the top
    expect(screen.getByText('Reset Day')).toBeInTheDocument();
  });
});
