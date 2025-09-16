import React from 'react';
import { cn } from '@/utils/helpers';

interface ActionButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function ActionButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  className = '',
  fullWidth = false,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: ActionButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group text-center';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-green-400/40 border border-green-300 hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-gray-500/30 border border-gray-400 hover:scale-[1.02] active:scale-[0.98]',
    success: 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white shadow-lg hover:shadow-green-400/40 border border-green-300 hover:scale-[1.02] active:scale-[0.98]',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white shadow-lg hover:shadow-yellow-500/30 border border-yellow-400 hover:scale-[1.02] active:scale-[0.98]',
    error: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-red-500/30 border border-red-400 hover:scale-[1.02] active:scale-[0.98]',
    ghost: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg border border-gray-400 hover:scale-[1.02] active:scale-[0.98]'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-3 py-3 text-sm h-10',
    lg: 'px-4 py-4 text-base h-14'
  };

  const widthClasses = fullWidth ? 'flex-1 w-full' : '';

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClasses,
    className
  );

  const buttonStyle = {
    background: variant === 'primary' ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)' :
                 variant === 'secondary' ? 'linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(75, 85, 99, 0.3) 100%)' :
                 variant === 'success' ? 'linear-gradient(135deg, rgba(74, 222, 128, 0.3) 0%, rgba(34, 197, 94, 0.3) 100%)' :
                 variant === 'warning' ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.3) 0%, rgba(202, 138, 4, 0.3) 100%)' :
                 variant === 'error' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.3) 100%)' :
                 'linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(75, 85, 99, 0.3) 100%)',
    boxShadow: variant === 'primary' ? '0 4px 14px 0 rgba(74, 222, 128, 0.1), 0 0 0 1px rgba(74, 222, 128, 0.1)' :
               variant === 'secondary' ? '0 4px 14px 0 rgba(107, 114, 128, 0.1), 0 0 0 1px rgba(107, 114, 128, 0.1)' :
               variant === 'success' ? '0 4px 14px 0 rgba(74, 222, 128, 0.1), 0 0 0 1px rgba(74, 222, 128, 0.1)' :
               variant === 'warning' ? '0 4px 14px 0 rgba(234, 179, 8, 0.1), 0 0 0 1px rgba(234, 179, 8, 0.1)' :
               variant === 'error' ? '0 4px 14px 0 rgba(239, 68, 68, 0.1), 0 0 0 1px rgba(239, 68, 68, 0.1)' :
               '0 4px 14px 0 rgba(107, 114, 128, 0.1), 0 0 0 1px rgba(107, 114, 128, 0.1)',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
  };

  return (
    <button
      onClick={onClick}
      className={classes}
      disabled={disabled}
      style={buttonStyle}
      aria-label={ariaLabel || (typeof children === 'string' ? children : 'Action button')}
      aria-describedby={ariaDescribedBy}
    >
      <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden text-center">
        <div className="flex items-center justify-center gap-2">
          {icon && (
            <span className="flex items-center justify-center">
              {icon}
            </span>
          )}
          <span className="flex items-center justify-center">{children}</span>
        </div>
      </div>
      
      {/* Ripple effect overlay */}
      <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
    </button>
  );
}

export default ActionButton;