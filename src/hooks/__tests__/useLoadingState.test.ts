import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from '@/hooks/useLoadingState';

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  value: 'visible',
});

describe('useLoadingState', () => {
  beforeEach(() => {
    // Reset visibility state before each test
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
    });
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLoadingState());
    
    expect(result.current.loading).toBe(false);
    expect(result.current.isInitialized).toBe(false);
  });

  it('should initialize with custom loading state', () => {
    const { result } = renderHook(() => useLoadingState(true));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.isInitialized).toBe(false);
  });

  it('should set loading to false and mark as initialized when setLoading(false) is called', () => {
    const { result } = renderHook(() => useLoadingState(true));
    
    act(() => {
      result.current.setLoading(false);
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.isInitialized).toBe(true);
  });

  it('should handle visibility change events', () => {
    const { result } = renderHook(() => useLoadingState(true, 1000));
    
    // Set as initialized first
    act(() => {
      result.current.setIsInitialized(true);
    });
    
    // Simulate tab becoming visible
    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    // Should set loading to false when tab becomes visible and initialized
    expect(result.current.loading).toBe(false);
  });

  it('should timeout loading state after specified time', (done) => {
    const { result } = renderHook(() => useLoadingState(true, 100));
    
    expect(result.current.loading).toBe(true);
    
    setTimeout(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.isInitialized).toBe(true);
      done();
    }, 150);
  });
});
