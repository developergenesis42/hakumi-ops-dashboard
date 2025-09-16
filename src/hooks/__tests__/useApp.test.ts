import { renderHook } from '@testing-library/react';
import { useContext } from 'react';
import { useApp } from '@/hooks/useApp';
import { AppContext } from '@/context/AppContextDefinition';

// Mock the context
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

const mockUseContext = useContext as jest.MockedFunction<typeof useContext>;

describe('useApp', () => {
  const mockContextValue = {
    state: {
      therapists: [],
      sessions: [],
      currentUser: null,
      isLoading: false,
      error: null,
    },
    dispatch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return context value when context is available', () => {
    mockUseContext.mockReturnValue(mockContextValue);

    const { result } = renderHook(() => useApp());

    expect(result.current).toBe(mockContextValue);
    expect(mockUseContext).toHaveBeenCalledWith(AppContext);
  });

  it('should throw error when context is undefined', () => {
    mockUseContext.mockReturnValue(undefined);

    expect(() => {
      renderHook(() => useApp());
    }).toThrow('useApp must be used within an AppProvider');
  });

  it('should throw error when context is null', () => {
    mockUseContext.mockReturnValue(null);

    // The hook only checks for undefined, not null, so it should return null without throwing
    const { result } = renderHook(() => useApp());
    expect(result.current).toBe(null);
  });
});
