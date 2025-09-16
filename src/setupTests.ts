import '@testing-library/jest-dom';
import React from 'react';
import { render } from '@testing-library/react';
import { ToastProvider } from '@/context/ToastContext.tsx';

// Mock process.env for test environment (import.meta.env will be transformed to process.env)
process.env.VITE_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QtcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTYzNTUyMDB9.test-key';
process.env.VITE_CSRF_PROTECTION = 'true';
process.env.VITE_API_BASE_URL = 'http://localhost:3000';
process.env.VITE_API_TIMEOUT = '30000';
process.env.VITE_API_RETRY_ATTEMPTS = '3';
process.env.VITE_SESSION_TIMEOUT = '3600000';
process.env.VITE_MAX_LOGIN_ATTEMPTS = '5';
process.env.VITE_CACHE_TIMEOUT = '300000';
process.env.VITE_ENABLE_SW = 'false';
process.env.VITE_ENABLE_CACHING = 'false';
process.env.VITE_APP_ENV = 'test';
process.env.VITE_APP_NAME = 'SPA Operations Dashboard Test';
process.env.VITE_APP_VERSION = '1.0.0';
process.env.VITE_DEBUG = 'false';
process.env.VITE_ENABLE_ANALYTICS = 'false';
process.env.VITE_DEBUG_MODE = 'false';
process.env.VITE_EXPERIMENTAL_FEATURES = 'false';
process.env.VITE_OFFLINE_MODE = 'false';
process.env.VITE_ENABLE_CSRF = 'true';
process.env.MODE = 'test';

// Mock window.confirm and window.alert
Object.defineProperty(window, 'confirm', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'alert', {
  value: jest.fn(),
  writable: true,
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Only filter specific React warnings, let test mocks handle console.error
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('ErrorBoundary caught an error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = '';
  thresholds = [];
} as IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as ResizeObserver;

// Custom render function that includes ToastProvider
const customRender = (ui: React.ReactElement, options = {}) => {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => 
      React.createElement(ToastProvider, { children }, children),
    ...options,
  });
};

// Export custom render
export { customRender as render };
