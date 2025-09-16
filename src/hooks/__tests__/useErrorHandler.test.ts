import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useToast } from '@/hooks/useToast';
import { errorService } from '@/services/errorService';

// Mock the useToast hook
jest.mock('../../components/ui/Toast', () => ({
  useToast: jest.fn(),
}));

// Mock the error service
jest.mock('../../services/errorService', () => ({
  errorService: {
    handleError: jest.fn(),
    handleAsync: jest.fn(),
  },
}));

const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('useErrorHandler', () => {
  const mockShowToast = jest.fn();
  const mockErrorService = {
    handleError: jest.fn(),
    handleAsync: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });
    // Get the mocked error service
    Object.assign(errorService, mockErrorService);
    
    // Set up default mock behavior
    mockErrorService.handleAsync.mockImplementation(async (fn, _context, options) => {
      try {
        return await fn();
      } catch (error) {
        // Simulate the error handling behavior
        if (options?.showToast !== false) {
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          mockShowToast(errorMessage, 'error');
        }
        return null;
      }
    });
  });

  describe('handleError', () => {
    it('should handle Error objects with default options', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error message');
      const context = 'test-context';

      act(() => {
        result.current.handleError(error, context);
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(error, context, expect.any(Object));
      expect(mockShowToast).toHaveBeenCalledWith('Test error message', 'error');
    });

    it('should handle string errors', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = 'String error message';
      const context = 'test-context';

      act(() => {
        result.current.handleError(error, context);
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(error, context, expect.any(Object));
      expect(mockShowToast).toHaveBeenCalledWith('String error message', 'error');
    });

    it('should handle unknown errors with fallback message', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = { some: 'object' };
      const context = 'test-context';

      act(() => {
        result.current.handleError(error, context);
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(error, context, expect.any(Object));
      expect(mockShowToast).toHaveBeenCalledWith('An unexpected error occurred', 'error');
    });

    it('should use custom fallback message', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = { some: 'object' };
      const context = 'test-context';
      const options = { fallbackMessage: 'Custom error message' };

      act(() => {
        result.current.handleError(error, context, options);
      });

      expect(mockShowToast).toHaveBeenCalledWith('Custom error message', 'error');
    });

    it('should not show toast when showToast is false', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');
      const context = 'test-context';
      const options = { showToast: false };

      act(() => {
        result.current.handleError(error, context, options);
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(error, context, expect.any(Object));
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('should not log error when logError is false', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');
      const context = 'test-context';
      const options = { logError: false };

      act(() => {
        result.current.handleError(error, context, options);
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(error, context, expect.objectContaining({ logError: false }));
      expect(mockShowToast).toHaveBeenCalledWith('Test error', 'error');
    });

    it('should handle both showToast and logError as false', () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Test error');
      const context = 'test-context';
      const options = { showToast: false, logError: false };

      act(() => {
        result.current.handleError(error, context, options);
      });

      expect(mockErrorService.handleError).toHaveBeenCalledWith(error, context, expect.objectContaining({ logError: false }));
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });

  describe('handleAsyncError', () => {
    it('should return result when async function succeeds', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const asyncFn = jest.fn().mockResolvedValue('success');
      const context = 'test-context';

      let asyncResult;
      await act(async () => {
        asyncResult = await result.current.handleAsyncError(asyncFn, context);
      });

      expect(asyncResult).toBe('success');
      expect(asyncFn).toHaveBeenCalled();
      expect(mockErrorService.handleAsync).toHaveBeenCalledWith(asyncFn, context, expect.any(Object));
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('should handle error and return null when async function fails', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const context = 'test-context';

      let asyncResult;
      await act(async () => {
        asyncResult = await result.current.handleAsyncError(asyncFn, context);
      });

      expect(asyncResult).toBeNull();
      expect(asyncFn).toHaveBeenCalled();
      expect(mockErrorService.handleAsync).toHaveBeenCalledWith(asyncFn, context, expect.any(Object));
      expect(mockShowToast).toHaveBeenCalledWith('Async error', 'error');
    });

    it('should pass options to handleError', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const context = 'test-context';
      const options = { showToast: false, logError: false };

      let asyncResult;
      await act(async () => {
        asyncResult = await result.current.handleAsyncError(asyncFn, context, options);
      });

      expect(asyncResult).toBeNull();
      expect(mockErrorService.handleAsync).toHaveBeenCalledWith(asyncFn, context, expect.objectContaining({ logError: false }));
      expect(mockShowToast).not.toHaveBeenCalled();
    });
  });
});
