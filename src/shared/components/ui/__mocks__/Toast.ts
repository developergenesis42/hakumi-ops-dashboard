// Mock Toast component for tests
import React from 'react';

export const useToast = jest.fn(() => ({
  addToast: jest.fn(),
  removeToast: jest.fn(),
  clearToasts: jest.fn(),
}));

export const ToastProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="toast-provider">{children}</div>
);

export const Toast = ({ message, type, onClose }: { message: string; type: string; onClose: () => void }) => (
  <div data-testid="toast" data-type={type}>
    {message}
    <button onClick={onClose}>Close</button>
  </div>
);

export default {
  useToast,
  ToastProvider,
  Toast,
};
