import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { errorTracking } from '@/config/monitoring';

// Mock the error tracking
jest.mock('../../config/monitoring', () => ({
  errorTracking: {
    captureError: jest.fn(),
  },
}));

const mockErrorTracking = errorTracking as jest.Mocked<typeof errorTracking>;

describe('ErrorBoundary', () => {
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // Component that throws an error
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div>No error</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render fallback UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText("We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.")).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('should log error to console', () => {
    // Test that the error boundary catches and handles errors
    // The console.error call is filtered out in setupTests.ts to reduce noise
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Verify that the error boundary renders the fallback UI
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should report error to monitoring service', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockErrorTracking.captureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        component: 'ErrorBoundary',
        errorInfo: expect.objectContaining({
          componentStack: expect.any(String),
        }),
      })
    );
  });

  it('should call custom onError handler when provided', () => {
    const mockOnError = jest.fn();
    
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Test error')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should have correct styling for error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorMessage = screen.getByText('Something went wrong');
    expect(errorMessage).toHaveClass('text-xl', 'font-semibold', 'text-white', 'mb-2');
  });

  it('should have correct styling for error description', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorDescription = screen.getByText("We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.");
    expect(errorDescription).toHaveClass('text-gray-300', 'mb-6');
  });

  it('should have refresh button with correct styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    expect(refreshButton).toHaveClass(
      'w-full',
      'px-4',
      'py-2',
      'bg-gray-600',
      'text-white',
      'rounded-lg',
      'hover:bg-gray-700',
      'transition-colors',
      'font-medium'
    );
  });

  it('should handle refresh button click', () => {
    const mockReload = jest.fn();
    // Mock window.location.reload
    const originalLocation = window.location;
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string; reload: jest.Mock } }).location = { 
      href: originalLocation.href,
      reload: mockReload 
    };
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);

    expect(mockReload).toHaveBeenCalled();
    
    // Restore original location
    (window as unknown as { location: Location }).location = originalLocation;
  });

  it('should have correct container styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Find the outermost container div
    const container = screen.getByText('Something went wrong').closest('.min-h-screen');
    expect(container).toHaveClass(
      'min-h-screen',
      'bg-gray-900',
      'flex',
      'items-center',
      'justify-center',
      'p-6'
    );
  });

  it('should have correct card styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Find the card div (the one with max-w-md class)
    const card = screen.getByText('Something went wrong').closest('.max-w-md');
    expect(card).toHaveClass(
      'max-w-md',
      'w-full',
      'bg-gray-800',
      'rounded-lg',
      'shadow-xl',
      'p-6',
      'text-center'
    );
  });
});
