import { render } from '@testing-library/react';
import { AppProvider } from '@/context/AppContext';
import { SupabaseDataProvider } from '@/context/SupabaseDataContext';
import DataSync from '@/components/DataSync';
import { useApp } from '@/hooks/useApp';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Mock the hooks
jest.mock('@/hooks/useApp');
jest.mock('@/hooks/useSupabaseData');

const mockUseApp = useApp as jest.MockedFunction<typeof useApp>;
const mockUseSupabaseData = useSupabaseData as jest.MockedFunction<typeof useSupabaseData>;

// Test component to verify state changes
function TestComponent() {
  const { state } = useApp();
  return (
    <div>
      <div data-testid="therapists-count">{state.therapists.length}</div>
      <div data-testid="rooms-count">{state.rooms.length}</div>
      <div data-testid="services-count">{state.services.length}</div>
    </div>
  );
}

describe('DataSync Component', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useApp hook
    mockUseApp.mockReturnValue({
      state: {
        currentPhase: 'roster-setup',
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
      },
      dispatch: mockDispatch,
    });
  });

  it('should sync therapists data when available', () => {
    const mockTherapists = [
      { id: '1', name: 'Alice Johnson', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
      { id: '2', name: 'Bob Smith', status: 'available', totalEarnings: 0, totalSessions: 0, expenses: [] },
    ];

    // Mock useSupabaseData hook
    mockUseSupabaseData.mockReturnValue({
      therapists: mockTherapists,
      rooms: [],
      services: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <SupabaseDataProvider>
        <AppProvider>
          <DataSync />
          <TestComponent />
        </AppProvider>
      </SupabaseDataProvider>
    );

    // Verify that LOAD_SUPABASE_DATA action was dispatched
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'LOAD_SUPABASE_DATA',
      payload: { therapists: mockTherapists },
    });
  });

  it('should sync rooms data when available', () => {
    const mockRooms = [
      { id: '1', name: 'Room 1', type: 'Shower', status: 'available' },
      { id: '2', name: 'Room 2', type: 'VIP Jacuzzi', status: 'available' },
    ];

    // Mock useSupabaseData hook
    mockUseSupabaseData.mockReturnValue({
      therapists: [],
      rooms: mockRooms,
      services: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <SupabaseDataProvider>
        <AppProvider>
          <DataSync />
          <TestComponent />
        </AppProvider>
      </SupabaseDataProvider>
    );

    // Verify that LOAD_ROOMS action was dispatched
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'LOAD_ROOMS',
      payload: mockRooms,
    });
  });

  it('should sync services data when available', () => {
    const mockServices = [
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
    ];

    // Mock useSupabaseData hook
    mockUseSupabaseData.mockReturnValue({
      therapists: [],
      rooms: [],
      services: mockServices,
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <SupabaseDataProvider>
        <AppProvider>
          <DataSync />
          <TestComponent />
        </AppProvider>
      </SupabaseDataProvider>
    );

    // Verify that LOAD_SERVICES action was dispatched
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'LOAD_SERVICES',
      payload: mockServices,
    });
  });

  it('should not dispatch actions when data is empty', () => {
    // Mock useSupabaseData hook with empty data
    mockUseSupabaseData.mockReturnValue({
      therapists: [],
      rooms: [],
      services: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(
      <SupabaseDataProvider>
        <AppProvider>
          <DataSync />
          <TestComponent />
        </AppProvider>
      </SupabaseDataProvider>
    );

    // Verify that no actions were dispatched
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should handle loading state', () => {
    // Mock useSupabaseData hook with loading state
    mockUseSupabaseData.mockReturnValue({
      therapists: [],
      rooms: [],
      services: [],
      loading: true,
      error: null,
      refetch: jest.fn(),
    });

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    render(
      <SupabaseDataProvider>
        <AppProvider>
          <DataSync />
          <TestComponent />
        </AppProvider>
      </SupabaseDataProvider>
    );

    // Verify that loading message was logged
    expect(consoleSpy).toHaveBeenCalledWith('DataSync: Loading data from Supabase...');

    consoleSpy.mockRestore();
  });

  it('should handle error state', () => {
    const mockError = 'Connection failed';

    // Mock useSupabaseData hook with error state
    mockUseSupabaseData.mockReturnValue({
      therapists: [],
      rooms: [],
      services: [],
      loading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <SupabaseDataProvider>
        <AppProvider>
          <DataSync />
          <TestComponent />
        </AppProvider>
      </SupabaseDataProvider>
    );

    // Verify that error message was logged
    expect(consoleSpy).toHaveBeenCalledWith('DataSync: Error loading data:', mockError);

    consoleSpy.mockRestore();
  });
});
