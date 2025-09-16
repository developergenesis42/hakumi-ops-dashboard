import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  // Display modes
  mode?: 'fullscreen' | 'inline' | 'button' | 'spinner';
  
  // Size options
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Color themes
  color?: 'primary' | 'secondary' | 'white' | 'gray' | 'green' | 'blue' | 'red' | 'orange';
  
  // Content
  message?: string;
  showProgress?: boolean;
  showDots?: boolean;
  showStatus?: boolean;
  
  // Fullscreen specific
  showBackground?: boolean;
  showParticles?: boolean;
  showFloatingElements?: boolean;
  showDebugInfo?: boolean;
  
  // Button specific
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  
  // Styling
  className?: string;
  
  // Loading state
  loading?: boolean;
  
  // Children (for button mode)
  children?: React.ReactNode;
}

const loadingMessages = [
  'Initializing your dashboard...',
  'Connecting to secure servers...',
  'Loading therapist data...',
  'Setting up room configurations...',
  'Preparing service catalog...',
  'Almost ready...',
  'Finalizing setup...',
  'Welcome to Hakumi Nuru Massage!'
];

const loadingDots = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const statusIndicators = [
  { label: 'Secure Connection', status: 'connected' },
  { label: 'Data Sync', status: 'syncing' },
  { label: 'Authentication', status: 'verified' }
];

export default function LoadingScreen({
  mode = 'fullscreen',
  size = 'md',
  color = 'primary',
  message,
  showProgress = false,
  showDots = true,
  showStatus = false,
  showBackground = true,
  showParticles = true,
  showFloatingElements = true,
  showDebugInfo = false,
  loadingText = 'Loading...',
  variant = 'primary',
  className = '',
  loading = true,
  children
}: LoadingScreenProps) {
  // Simplified loading state - no authentication required
  const [isInitialized] = useState(true);
  const [isAuthenticated] = useState(true);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentDot, setCurrentDot] = useState(0);
  const [progress, setProgress] = useState(0);

  // Use the explicitly passed loading prop, don't fall back to auth loading
  // This prevents conflicts with the parent component's loading logic
  const isLoading = loading;

  // Cycle through messages for fullscreen mode
  useEffect(() => {
    if (mode === 'fullscreen') {
      const messageInterval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);

      return () => clearInterval(messageInterval);
    }
  }, [mode]);

  // Cycle through dots
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setCurrentDot((prev) => (prev + 1) % loadingDots.length);
    }, 100);

    return () => clearInterval(dotInterval);
  }, []);

  // Simulate progress
  useEffect(() => {
    if (showProgress) {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + Math.random() * 10;
        });
      }, 200);

      return () => clearInterval(progressInterval);
    }
  }, [showProgress]);

  // Don't render if not loading
  if (!isLoading) {
    return children || null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Color classes
  const colorClasses = {
    primary: 'text-blue-500',
    secondary: 'text-gray-500',
    white: 'text-white',
    gray: 'text-gray-400',
    green: 'text-green-500',
    blue: 'text-blue-500',
    red: 'text-red-500',
    orange: 'text-orange-500'
  };

  // Button variant classes
  const buttonVariantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  // Spinner component
  const Spinner = () => (
    <div data-testid="spinner" className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin`}>
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );

  // Dots component
  const Dots = () => (
    <span className={`${colorClasses[color]} text-2xl animate-pulse`}>
      {loadingDots[currentDot]}
    </span>
  );

  // Progress bar component
  const ProgressBar = () => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );

  // Status indicators component
  const StatusIndicators = () => (
    <div className="space-y-2">
      {statusIndicators.map((indicator, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-300">{indicator.label}</span>
        </div>
      ))}
    </div>
  );

  // Button mode
  if (mode === 'button') {
    return (
      <button
        disabled={isLoading}
        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${buttonVariantClasses[variant]} ${className}`}
      >
        {isLoading && <Spinner />}
        {isLoading ? loadingText : children}
      </button>
    );
  }

  // Spinner mode
  if (mode === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
        <Spinner />
        <div className="flex items-center gap-2">
          {message && (
            <span className={`text-sm ${colorClasses[color]}`}>{message}</span>
          )}
          {showDots && <Dots />}
        </div>
        {showProgress && <ProgressBar />}
      </div>
    );
  }

  // Inline mode
  if (mode === 'inline') {
    return (
      <div className={`flex items-center gap-3 p-4 ${className}`}>
        <Spinner />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`font-medium ${colorClasses[color]}`}>
              {message || 'Loading...'}
            </span>
            {showDots && <Dots />}
          </div>
          {showProgress && <ProgressBar />}
          {showStatus && <StatusIndicators />}
        </div>
      </div>
    );
  }

  // Fullscreen mode (default)
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${showBackground ? 'bg-black' : 'bg-transparent'} ${className}`}>
      {/* Animated background particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-500 rounded-full animate-float opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Floating elements */}
      {showFloatingElements && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-blue-500/10 rounded-full animate-bounce-slow" />
          <div className="absolute top-3/4 right-1/4 w-12 h-12 bg-green-500/10 rounded-full animate-bounce-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-orange-500/10 rounded-full animate-bounce-slow" style={{ animationDelay: '2s' }} />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Multi-layered spinner */}
        <div className="relative mb-8">
          <div className="w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-green-500/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            <div className="absolute inset-4 border-4 border-orange-500/40 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-6 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full animate-ping" />
            </div>
          </div>
        </div>

        {/* Loading message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === 'fullscreen' ? loadingMessages[currentMessage] : (message || 'Loading...')}
          </h2>
          {showDots && (
            <div className="text-4xl text-blue-400 animate-pulse">
              {loadingDots[currentDot]}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="mb-6">
            <ProgressBar />
            <div className="text-sm text-gray-400 mt-2">
              {Math.round(progress)}% Complete
            </div>
          </div>
        )}

        {/* Status indicators */}
        {showStatus && (
          <div className="mb-6">
            <StatusIndicators />
          </div>
        )}

        {/* Debug info (development only) */}
        {showDebugInfo && process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg text-left text-xs text-gray-400">
            <div className="font-bold mb-2">Debug Info:</div>
            <div>Loading: {isLoading ? 'true' : 'false'}</div>
            <div>Initialized: {isInitialized ? 'true' : 'false'}</div>
            <div>Authenticated: {isAuthenticated ? 'true' : 'false'}</div>
            <div>Message Index: {currentMessage}</div>
            <div>Progress: {Math.round(progress)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}
