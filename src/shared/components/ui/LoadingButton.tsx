import React from 'react';
import Button from '@/shared/components/ui/Button';

interface LoadingButtonProps {
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  className?: string;
}

export default function LoadingButton({ 
  loading = false, 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary',
  className = ''
}: LoadingButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </Button>
  );
}