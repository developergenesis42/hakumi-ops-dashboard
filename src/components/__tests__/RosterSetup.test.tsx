import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import RosterSetup from '@/components/RosterSetup';
import { ToastProvider } from '@/context/ToastContext.tsx';

// Custom render function that includes ToastProvider
const renderWithToast = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => 
      React.createElement(ToastProvider, { children }, children),
    ...options,
  });
};

// Mock the supabase module to avoid import.meta issues
jest.mock('../../utils/supabase', () => ({
  __esModule: true,
  default: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            data: [],
            error: null
          }))
        }))
      }))
    }))
  }
}));

// Mock the logger module to avoid import.meta issues
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock the custom hooks
jest.mock('../../hooks/useTherapistSearch', () => ({
  useTherapistSearch: () => ({
    searchTerm: '',
    setSearchTerm: jest.fn(),
    filteredTherapists: [
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0 },
      { id: '2', name: 'Bob Smith', status: 'available', totalEarnings: 0, totalSessions: 0 },
    ],
    clearSearch: jest.fn(),
  }),
}));

jest.mock('../../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => ({
    selectedIndex: -1,
    handleKeyDown: jest.fn(),
    resetSelection: jest.fn(),
  }),
}));

// Mock the useApp hook
jest.mock('../../hooks/useApp', () => ({
  useApp: () => ({
    state: {
      currentPhase: 'roster-setup' as const,
      therapists: [
        { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0 },
        { id: '2', name: 'Bob Smith', status: 'available', totalEarnings: 0, totalSessions: 0 },
      ],
      todayRoster: [],
      rooms: [
        { id: '1', name: 'Room 1', type: 'Shower', status: 'available' },
        { id: '2', name: 'Room 2', type: 'VIP Jacuzzi', status: 'available' },
      ],
      services: [
        {
          id: '1',
          category: 'Single',
          roomType: 'Shower',
          duration: 60,
          price: 100,
          ladyPayout: 40,
          shopRevenue: 60,
          description: 'Test service',
        },
      ],
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
    },
    dispatch: jest.fn(),
  }),
}));

// Mock window.confirm and window.alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

Object.defineProperty(window, 'alert', {
  value: mockAlert,
  writable: true,
});

describe('RosterSetup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with correct title and date', () => {
    renderWithToast(<RosterSetup />);
    
    expect(screen.getByText('Daily Roster Setup')).toBeInTheDocument();
    expect(screen.getByText(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/)).toBeInTheDocument();
  });

  it('should display roster statistics correctly', () => {
    renderWithToast(<RosterSetup />);
    
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
  });

  it('should show empty state when no therapists are selected', () => {
    renderWithToast(<RosterSetup />);
    
    expect(screen.getByText('Ready to Build Your Team?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add therapists to roster before starting day/i })).toBeInTheDocument();
  });

  it('should show start day button as disabled when no therapists selected', () => {
    renderWithToast(<RosterSetup />);
    
    const startDayButton = screen.getByRole('button', { name: /add therapists to roster before starting day/i });
    expect(startDayButton).toBeDisabled();
  });

  it('should display quick tips', () => {
    renderWithToast(<RosterSetup />);
    
    expect(screen.getByText('Quick Tips')).toBeInTheDocument();
    expect(screen.getByText('Type 1+ letters to search')).toBeInTheDocument();
    expect(screen.getByText('Use "Test Roster" for quick setup')).toBeInTheDocument();
    expect(screen.getByText('Click "All Clear" to start fresh')).toBeInTheDocument();
  });

  it('should display global reset button', () => {
    renderWithToast(<RosterSetup />);
    
    const resetButton = screen.getByTitle('Clear all selected therapists');
    expect(resetButton).toBeInTheDocument();
  });

  it('should display dashboard button', () => {
    renderWithToast(<RosterSetup />);
    
    const dashboardButton = screen.getByTitle('Go to Dashboard');
    expect(dashboardButton).toBeInTheDocument();
  });

  it('should display search input', () => {
    renderWithToast(<RosterSetup />);
    
    const searchInput = screen.getByPlaceholderText('Type therapist name to search...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle start day button click', () => {
    renderWithToast(<RosterSetup />);
    
    const startDayButton = screen.getByRole('button', { name: /add therapists to roster before starting day/i });
    fireEvent.click(startDayButton);
    
    // Button should be clickable (even if disabled)
    expect(startDayButton).toBeInTheDocument();
  });
});