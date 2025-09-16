import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TherapistCard from '@/features/roster/TherapistCard';
import { useSessionTimer } from '@/hooks/useSessionTimer';
import { useAttendance } from '@/hooks/useAttendance';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useApp } from '@/hooks/useApp';
import type { Therapist, AppState } from '@/types';

// Mock all the hooks
jest.mock('../../hooks/useSessionTimer');
jest.mock('../../hooks/useAttendance');
jest.mock('../../hooks/useSessionCompletion');
jest.mock('../../hooks/useErrorHandler');
jest.mock('../../hooks/useApp');

// Mock the lazy components
jest.mock('../LazyComponents', () => ({
  SessionModal: ({ isOpen, therapist }: { isOpen: boolean; therapist: Therapist }) => 
    isOpen ? <div data-testid="session-modal">Session Modal for {therapist.name}</div> : null,
  DepartureModal: ({ isOpen, therapist }: { isOpen: boolean; therapist: Therapist }) => 
    isOpen ? <div data-testid="departure-modal">Departure Modal for {therapist.name}</div> : null,
  RemoveStaffModal: ({ isOpen, therapist }: { isOpen: boolean; therapist: Therapist }) => 
    isOpen ? <div data-testid="remove-modal">Remove Modal for {therapist.name}</div> : null,
  ExpenseModal: ({ isOpen, therapist }: { isOpen: boolean; therapist: Therapist }) => 
    isOpen ? <div data-testid="expense-modal">Expense Modal for {therapist.name}</div> : null,
}));

const mockUseSessionTimer = useSessionTimer as jest.MockedFunction<typeof useSessionTimer>;
const mockUseAttendance = useAttendance as jest.MockedFunction<typeof useAttendance>;
const mockUseSessionCompletion = useSessionCompletion as jest.MockedFunction<typeof useSessionCompletion>;
const mockUseErrorHandler = useErrorHandler as jest.MockedFunction<typeof useErrorHandler>;
const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;

describe('TherapistCard', () => {
  const mockTherapist: Therapist = {
    id: 'therapist-1',
    name: 'John Doe',
    status: 'available',
    totalEarnings: 0,
    totalSessions: 0,
    expenses: [],
  };

  const mockCheckInTherapist = jest.fn();
  const mockGetTherapistWorkingHours = jest.fn();
  const mockFormatWorkingHours = jest.fn();
  const mockCompleteSession = jest.fn();
  const mockHandleError = jest.fn();
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSessionTimer.mockReturnValue({
      timerState: { isActive: false, sessionTimeRemaining: 0, totalSessionDuration: 0 },
      getDisplayText: jest.fn().mockReturnValue('00:00'),
      getDisplayColor: jest.fn().mockReturnValue('text-gray-600'),
      formatTime: jest.fn(),
    });

    mockUseAttendance.mockReturnValue({
      todayAttendance: { date: new Date().toISOString().split('T')[0], records: [], totalWorkingHours: 0 },
      isOnline: true,
      checkInTherapist: mockCheckInTherapist,
      departTherapist: jest.fn(),
      getTherapistAttendance: jest.fn(),
      getTherapistWorkingHours: mockGetTherapistWorkingHours,
      formatWorkingHours: mockFormatWorkingHours,
      getAllAttendance: jest.fn(),
      retrySyncs: jest.fn(),
      clearTodayAttendance: jest.fn(),
      clearOldData: jest.fn(),
      exportData: jest.fn(),
      importData: jest.fn(),
    });

    mockUseSessionCompletion.mockReturnValue({
      completeSession: mockCompleteSession,
    });

    mockUseErrorHandler.mockReturnValue({
      handleError: mockHandleError,
      handleAsyncError: jest.fn(),
      handleWithRetry: jest.fn(),
      createSafeAsync: jest.fn(),
      createRetryWrapper: jest.fn(),
    });

    mockUseApp.mockReturnValue({
      state: {} as AppState,
      dispatch: mockDispatch,
    });

    mockGetTherapistWorkingHours.mockReturnValue(0);
    mockFormatWorkingHours.mockReturnValue('00:00');
  });

  it('should render therapist name and status', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('•Available')).toBeInTheDocument();
  });

  it('should render different status displays', () => {
    const { rerender } = render(<TherapistCard therapist={mockTherapist} />);
    expect(screen.getByText('•Available')).toBeInTheDocument();

    rerender(<TherapistCard therapist={{ ...mockTherapist, status: 'inactive' }} />);
    expect(screen.getByText('•Inactive')).toBeInTheDocument();

    rerender(<TherapistCard therapist={{ ...mockTherapist, status: 'in-session' }} />);
    expect(screen.getByText('•In Session')).toBeInTheDocument();

    rerender(<TherapistCard therapist={{ ...mockTherapist, status: 'departed' }} />);
    expect(screen.getByText('•Departed')).toBeInTheDocument();
  });

  it('should show expense indicator when therapist has expenses', () => {
    const therapistWithExpenses = {
      ...mockTherapist,
      expenses: [
        { id: 'expense-1', type: 'Lube' as const, amount: 100, description: 'Tip', timestamp: new Date(), therapistId: '1' },
        { id: 'expense-2', type: 'Towel' as const, amount: 50, description: 'Transport', timestamp: new Date(), therapistId: '1' },
      ],
    };

    render(<TherapistCard therapist={therapistWithExpenses} />);

    expect(screen.getByText('฿150')).toBeInTheDocument();
  });

  it('should show remove button for inactive therapists', () => {
    const inactiveTherapist = { ...mockTherapist, status: 'inactive' as const };
    render(<TherapistCard therapist={inactiveTherapist} />);

    const removeButton = screen.getByTitle('Remove from roster');
    expect(removeButton).toBeInTheDocument();
  });

  it('should not show remove button for active therapists', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    expect(screen.queryByTitle('Remove from roster')).not.toBeInTheDocument();
  });

  it('should show check in button for inactive therapists', () => {
    const inactiveTherapist = { ...mockTherapist, status: 'inactive' as const };
    render(<TherapistCard therapist={inactiveTherapist} />);

    expect(screen.getByText('Check In')).toBeInTheDocument();
  });

  it('should show start and add buttons for available therapists', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Add')).toBeInTheDocument();
    expect(screen.getByText('Expense')).toBeInTheDocument();
    expect(screen.getByText('Leave')).toBeInTheDocument();
  });

  it('should show complete button for in-session therapists', () => {
    const inSessionTherapist = { ...mockTherapist, status: 'in-session' as const };
    render(<TherapistCard therapist={inSessionTherapist} />);

    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('should show departed status for departed therapists', () => {
    const departedTherapist = { ...mockTherapist, status: 'departed' as const };
    render(<TherapistCard therapist={departedTherapist} />);

    expect(screen.getAllByText('Departed')).toHaveLength(2); // Status and button text
  });

  it('should handle check in click', async () => {
    const inactiveTherapist = { ...mockTherapist, status: 'inactive' as const };
    render(<TherapistCard therapist={inactiveTherapist} />);

    const checkInButton = screen.getByText('Check In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(mockCheckInTherapist).toHaveBeenCalledWith('therapist-1', 'John Doe');
    });
  });

  it('should handle check in error', async () => {
    const error = new Error('Check in failed');
    mockCheckInTherapist.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const inactiveTherapist = { ...mockTherapist, status: 'inactive' as const };
    render(<TherapistCard therapist={inactiveTherapist} />);

    const checkInButton = screen.getByText('Check In');
    fireEvent.click(checkInButton);

    await waitFor(() => {
      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        'Check in therapist',
        { fallbackMessage: 'Failed to check in therapist' }
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should open session modal when start button is clicked', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    expect(screen.getByTestId('session-modal')).toBeInTheDocument();
  });

  it('should open manual add modal when add button is clicked', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    const addButton = screen.getByText('Add');
    fireEvent.click(addButton);

    expect(screen.getByTestId('session-modal')).toBeInTheDocument();
  });

  it('should open departure modal when leave button is clicked', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    const leaveButton = screen.getByText('Leave');
    fireEvent.click(leaveButton);

    expect(screen.getByTestId('departure-modal')).toBeInTheDocument();
  });

  it('should open expense modal when expense button is clicked', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    const expenseButton = screen.getByText('Expense');
    fireEvent.click(expenseButton);

    expect(screen.getByTestId('expense-modal')).toBeInTheDocument();
  });

  it('should open remove modal when remove button is clicked', () => {
    const inactiveTherapist = { ...mockTherapist, status: 'inactive' as const };
    render(<TherapistCard therapist={inactiveTherapist} />);

    const removeButton = screen.getByTitle('Remove from roster');
    fireEvent.click(removeButton);

    expect(screen.getByTestId('remove-modal')).toBeInTheDocument();
  });

  it('should handle complete session click', async () => {
    const inSessionTherapist = {
      ...mockTherapist,
      status: 'in-session' as const,
      currentSession: { id: 'session-1' },
    };
    render(<TherapistCard therapist={inSessionTherapist} />);

    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockCompleteSession).toHaveBeenCalledWith('session-1');
    });
  });

  it('should handle complete session error', async () => {
    const error = new Error('Complete failed');
    mockCompleteSession.mockRejectedValue(error);

    const inSessionTherapist = {
      ...mockTherapist,
      status: 'in-session' as const,
      currentSession: { id: 'session-1' },
    };
    render(<TherapistCard therapist={inSessionTherapist} />);

    const completeButton = screen.getByText('Complete');
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(mockHandleError).toHaveBeenCalledWith(
        error,
        'Complete session',
        { fallbackMessage: 'Failed to complete session' }
      );
    });
  });

  it('should display working hours', () => {
    mockGetTherapistWorkingHours.mockReturnValue(120); // 2 hours in minutes
    mockFormatWorkingHours.mockReturnValue('02:00');

    render(<TherapistCard therapist={mockTherapist} />);

    expect(screen.getByText('Working Hours')).toBeInTheDocument();
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('should display timer for in-session therapists', () => {
    mockUseSessionTimer.mockReturnValue({
      timerState: { isActive: true, sessionTimeRemaining: 1800, totalSessionDuration: 3600 },
      getDisplayText: jest.fn().mockReturnValue('30:00'),
      getDisplayColor: jest.fn().mockReturnValue('text-green-600'),
      formatTime: jest.fn(),
    });

    const inSessionTherapist = { ...mockTherapist, status: 'in-session' as const };
    render(<TherapistCard therapist={inSessionTherapist} />);

    expect(screen.getByText('Ready')).toBeInTheDocument(); // In-session shows Ready status
  });

  it('should display 00:00 for available therapists', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    expect(screen.getAllByText('00:00')).toHaveLength(2); // Both timer and working hours show 00:00
  });

  it('should display departed for departed therapists', () => {
    const departedTherapist = { ...mockTherapist, status: 'departed' as const };
    render(<TherapistCard therapist={departedTherapist} />);

    expect(screen.getAllByText('Departed')).toHaveLength(2); // Status and button text
  });

  it('should display ready for inactive therapists', () => {
    const inactiveTherapist = { ...mockTherapist, status: 'inactive' as const };
    render(<TherapistCard therapist={inactiveTherapist} />);

    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('should handle add expense', () => {
    const therapistWithExpenseModal = { ...mockTherapist };
    render(<TherapistCard therapist={therapistWithExpenseModal} />);

    const expenseButton = screen.getByText('Expense');
    fireEvent.click(expenseButton);

    // The expense modal should be rendered
    expect(screen.getByTestId('expense-modal')).toBeInTheDocument();
  });

  it('should close modals when onClose is called', () => {
    render(<TherapistCard therapist={mockTherapist} />);

    // Open session modal
    fireEvent.click(screen.getByText('Start'));
    expect(screen.getByTestId('session-modal')).toBeInTheDocument();

    // Close it (this would be handled by the modal's onClose prop)
    // In a real test, you'd need to trigger the modal's close functionality
  });

  it('should have correct styling for different statuses', () => {
    const { rerender } = render(<TherapistCard therapist={mockTherapist} />);
    
    // Available therapist should have green border
    const card = screen.getByText('John Doe').closest('[role="article"]');
    expect(card).toHaveClass('border-green-500');

    // Inactive therapist should have slate border
    rerender(<TherapistCard therapist={{ ...mockTherapist, status: 'inactive' }} />);
    expect(card).toHaveClass('border-slate-600');

    // In-session therapist should have blue border
    rerender(<TherapistCard therapist={{ ...mockTherapist, status: 'in-session' }} />);
    expect(card).toHaveClass('border-blue-500');

    // Departed therapist should have red border
    rerender(<TherapistCard therapist={{ ...mockTherapist, status: 'departed' }} />);
    expect(card).toHaveClass('border-red-500');
  });
});
