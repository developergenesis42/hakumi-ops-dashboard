import { renderHook, act } from '@testing-library/react';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { printNodeService } from '@/services/printNodeService';
import { useToast } from '@/hooks/useToast';
import type { Session, Therapist, Room } from '@/types';

// Mock dependencies
jest.mock('../../services/printNodeService');
jest.mock('../useToast');

const mockPrintNodeService = printNodeService as jest.Mocked<typeof printNodeService>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('usePrintReceipt', () => {
  const mockShowToast = jest.fn();
  const mockSession: Session = {
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
    status: 'completed',
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    roomId: 'room-1',
    discount: 0,
    totalPrice: 100,
  };

  const mockTherapists: Therapist[] = [
    {
      id: 'therapist-1',
      name: 'Jane Smith',
      status: 'available',
      totalEarnings: 0,
      totalSessions: 0,
      expenses: [],
    },
  ];

  const mockRoom: Room = {
    id: 'room-1',
    name: 'Room 1',
    type: 'Shower',
    status: 'available',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });
    mockPrintNodeService.isConfigured.mockReturnValue(true);
    mockPrintNodeService.printReceipt.mockResolvedValue(true);
    mockPrintNodeService.testConnection.mockResolvedValue(true);
  });

  it('should initialize with correct configuration status', () => {
    const { result } = renderHook(() => usePrintReceipt());

    expect(result.current.isPrintNodeConfigured).toBe(true);
    expect(mockPrintNodeService.isConfigured).toHaveBeenCalled();
  });

  it('should print receipt successfully for single service', async () => {
    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.printReceipt(mockSession, mockTherapists, mockRoom);
    });

    expect(mockPrintNodeService.printReceipt).toHaveBeenCalledWith(
      mockSession,
      mockTherapists,
      mockRoom
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      '2 receipt copies sent to printer successfully!',
      'success'
    );
  });

  it('should print receipt successfully for double service', async () => {
    const doubleSession: Session = {
      ...mockSession,
      service: {
        ...mockSession.service,
        category: 'Double',
      },
    };

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.printReceipt(doubleSession, mockTherapists, mockRoom);
    });

    expect(mockPrintNodeService.printReceipt).toHaveBeenCalledWith(
      doubleSession,
      mockTherapists,
      mockRoom
    );
    expect(mockShowToast).toHaveBeenCalledWith(
      '4 receipt copies sent to printer successfully!',
      'success'
    );
  });

  it('should show warning when PrintNode is not configured', async () => {
    mockPrintNodeService.isConfigured.mockReturnValue(false);

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.printReceipt(mockSession, mockTherapists, mockRoom);
    });

    expect(mockPrintNodeService.printReceipt).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      'PrintNode not configured. Please check your settings.',
      'warning'
    );
  });

  it('should handle print error', async () => {
    const error = new Error('Print failed');
    mockPrintNodeService.printReceipt.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.printReceipt(mockSession, mockTherapists, mockRoom);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Print receipt error:', error);
    expect(mockShowToast).toHaveBeenCalledWith(
      'Failed to print receipt: Print failed',
      'error'
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle unknown print error', async () => {
    mockPrintNodeService.printReceipt.mockRejectedValue('Unknown error');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.printReceipt(mockSession, mockTherapists, mockRoom);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Print receipt error:', 'Unknown error');
    expect(mockShowToast).toHaveBeenCalledWith(
      'Failed to print receipt: Unknown error',
      'error'
    );

    consoleErrorSpy.mockRestore();
  });

  it('should test print connection successfully', async () => {
    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.testPrintConnection();
    });

    expect(mockPrintNodeService.testConnection).toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      'PrintNode connection test successful!',
      'success'
    );
  });

  it('should show warning when testing connection without configuration', async () => {
    mockPrintNodeService.isConfigured.mockReturnValue(false);

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.testPrintConnection();
    });

    expect(mockPrintNodeService.testConnection).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith(
      'PrintNode not configured. Please check your settings.',
      'warning'
    );
  });

  it('should handle connection test error', async () => {
    const error = new Error('Connection failed');
    mockPrintNodeService.testConnection.mockRejectedValue(error);
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.testPrintConnection();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('PrintNode connection test error:', error);
    expect(mockShowToast).toHaveBeenCalledWith(
      'PrintNode connection test failed: Connection failed',
      'error'
    );

    consoleErrorSpy.mockRestore();
  });

  it('should handle unknown connection test error', async () => {
    mockPrintNodeService.testConnection.mockRejectedValue('Unknown error');
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => usePrintReceipt());

    await act(async () => {
      await result.current.testPrintConnection();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('PrintNode connection test error:', 'Unknown error');
    expect(mockShowToast).toHaveBeenCalledWith(
      'PrintNode connection test failed: Unknown error',
      'error'
    );

    consoleErrorSpy.mockRestore();
  });
});
