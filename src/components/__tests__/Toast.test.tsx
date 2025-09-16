import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Toast } from '@/shared/components/ui/Toast';
import { ToastProvider } from '@/context/ToastContext.tsx';
import { useToast } from '@/hooks/useToast';

// Mock Math.random for consistent ID generation
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn(() => 0.5);
global.Math = mockMath;

describe('Toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render with default props', () => {
    const mockOnClose = jest.fn();
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('should render with different types', () => {
    const mockOnClose = jest.fn();
    
    const { rerender } = render(<Toast message="Success message" type="success" onClose={mockOnClose} />);
    expect(screen.getByText('Success message').closest('div')?.parentElement).toHaveClass('bg-green-500', 'text-white');

    rerender(<Toast message="Error message" type="error" onClose={mockOnClose} />);
    expect(screen.getByText('Error message').closest('div')?.parentElement).toHaveClass('bg-red-500', 'text-white');

    rerender(<Toast message="Warning message" type="warning" onClose={mockOnClose} />);
    expect(screen.getByText('Warning message').closest('div')?.parentElement).toHaveClass('bg-yellow-500', 'text-black');

    rerender(<Toast message="Info message" type="info" onClose={mockOnClose} />);
    expect(screen.getByText('Info message').closest('div')?.parentElement).toHaveClass('bg-blue-500', 'text-white');
  });

  it('should auto-close after duration', async () => {
    const mockOnClose = jest.fn();
    render(<Toast message="Test message" duration={1000} onClose={mockOnClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
    
    // Wait for the additional 300ms delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
    
    // Wait for the additional 300ms delay
    act(() => {
      jest.advanceTimersByTime(300);
    });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not render when isVisible is false', () => {
    const mockOnClose = jest.fn();
    const { rerender } = render(<Toast message="Test message" onClose={mockOnClose} />);
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Simulate the toast being hidden
    rerender(<Toast message="Test message" onClose={mockOnClose} />);
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should have correct positioning and styling', () => {
    const mockOnClose = jest.fn();
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const toast = screen.getByText('Test message').closest('div')?.parentElement;
    expect(toast).toHaveClass('fixed', 'top-4', 'right-4', 'z-50', 'px-4', 'py-2', 'rounded-lg', 'shadow-lg', 'transition-all', 'duration-300');
  });

  it('should have correct close button styling', () => {
    const mockOnClose = jest.fn();
    render(<Toast message="Test message" onClose={mockOnClose} />);
    
    const closeButton = screen.getByText('×');
    expect(closeButton).toHaveClass('ml-2', 'text-white', 'hover:text-gray-200');
  });
});

describe('ToastProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should provide toast context', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return <button onClick={() => showToast('Test message')}>Show Toast</button>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText('Show Toast')).toBeInTheDocument();
  });

  it('should show toast when showToast is called', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return <button onClick={() => showToast('Test message', 'success')}>Show Toast</button>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should show multiple toasts', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return (
        <div>
          <button onClick={() => showToast('First toast')}>Show First</button>
          <button onClick={() => showToast('Second toast')}>Show Second</button>
        </div>
      );
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show First'));
    fireEvent.click(screen.getByText('Show Second'));

    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });

  it('should remove toast when onClose is called', async () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return <button onClick={() => showToast('Test message')}>Show Toast</button>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('should auto-remove toast after duration', async () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return <button onClick={() => showToast('Test message')}>Show Toast</button>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('should have correct container styling', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return <button onClick={() => showToast('Test message')}>Show Toast</button>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Show Toast'));

    const container = screen.getByText('Test message').closest('div')?.parentElement;
    expect(container).toHaveClass('fixed', 'top-4', 'right-4', 'z-50');
  });
});

describe('useToast', () => {
  it('should throw error when used outside ToastProvider', () => {
    const TestComponent = () => {
      useToast();
      return <div>Test</div>;
    };

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    expect(() => render(<TestComponent />)).toThrow('useToast must be used within a ToastProvider');

    consoleSpy.mockRestore();
  });

  it('should return showToast function when used within ToastProvider', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      expect(typeof showToast).toBe('function');
      return <div>Test</div>;
    };

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
  });
});
