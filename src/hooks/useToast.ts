import { useContext } from 'react';
import { ToastContext } from '@/context/ToastContext.tsx';

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  // Create a showToast function that wraps addToast
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    context.addToast({ message, type });
  };
  
  return {
    showToast,
    toasts: context.toasts,
    removeToast: context.removeToast,
    clearToasts: context.clearToasts
  };
}