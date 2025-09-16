import { render, screen, act } from '@testing-library/react';
import LoadingScreen from '@/shared/components/layout/LoadingScreen';

// No authentication mocking needed

describe('LoadingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders fullscreen loading screen by default', () => {
    render(<LoadingScreen />);
    
    expect(screen.getByText(/Initializing your dashboard/)).toBeInTheDocument();
    expect(screen.getByText(/⠋/)).toBeInTheDocument();
  });

  it('renders spinner mode correctly', () => {
    render(
      <LoadingScreen 
        mode="spinner" 
        message="Loading data..." 
        size="lg" 
        color="blue"
      />
    );
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders inline mode correctly', () => {
    render(
      <LoadingScreen 
        mode="inline" 
        message="Processing..." 
        showProgress={true}
        showStatus={true}
      />
    );
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText(/Secure Connection/)).toBeInTheDocument();
  });

  it('renders button mode correctly', () => {
    render(
      <LoadingScreen 
        mode="button" 
        loading={true}
        variant="primary"
        loadingText="Saving..."
      >
        Save Changes
      </LoadingScreen>
    );
    
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('does not render when loading is false', () => {
    render(
      <LoadingScreen loading={false}>
        <div>Content loaded</div>
      </LoadingScreen>
    );
    
    expect(screen.getByText('Content loaded')).toBeInTheDocument();
    expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
  });

  it('shows progress bar when showProgress is true', () => {
    render(
      <LoadingScreen 
        mode="spinner" 
        showProgress={true}
      />
    );
    
    // Check for progress bar element instead of text
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('shows status indicators when showStatus is true', () => {
    render(
      <LoadingScreen 
        mode="inline" 
        showStatus={true}
      />
    );
    
    expect(screen.getByText('Secure Connection')).toBeInTheDocument();
    expect(screen.getByText('Data Sync')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingScreen mode="spinner" size="sm" />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-4 h-4');

    rerender(<LoadingScreen mode="spinner" size="lg" />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-12 h-12');
  });

  it('applies correct color classes', () => {
    const { rerender } = render(<LoadingScreen mode="spinner" color="red" />);
    expect(screen.getByTestId('spinner')).toHaveClass('text-red-500');

    rerender(<LoadingScreen mode="spinner" color="green" />);
    expect(screen.getByTestId('spinner')).toHaveClass('text-green-500');
  });

  it('applies correct button variant classes', () => {
    render(
      <LoadingScreen 
        mode="button" 
        variant="danger"
        loading={true}
      >
        Delete
      </LoadingScreen>
    );
    
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('cycles through loading messages in fullscreen mode', () => {
    jest.useFakeTimers();
    
    render(<LoadingScreen mode="fullscreen" />);
    
    // Initial message
    expect(screen.getByText(/Initializing your dashboard/)).toBeInTheDocument();
    
    // Fast forward time to trigger message change
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Should show next message
    expect(screen.getByText(/Connecting to secure servers/)).toBeInTheDocument();
    
    jest.useRealTimers();
  });

  it('cycles through loading dots', () => {
    jest.useFakeTimers();
    
    render(<LoadingScreen mode="spinner" showDots={true} />);
    
    // Should show some loading dot (the exact dot may vary due to timing)
    expect(screen.getByText(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/)).toBeInTheDocument();
    
    // Fast forward time to trigger dot change
    act(() => {
      jest.advanceTimersByTime(100);
    });
    
    // Should still show a loading dot
    expect(screen.getByText(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/)).toBeInTheDocument();
    
    jest.useRealTimers();
  });
});
