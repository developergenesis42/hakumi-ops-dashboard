/**
 * Accessible Button Component
 * WCAG 2.1 AA compliant button with proper ARIA attributes and keyboard support
 */

import React, { forwardRef, useCallback, useRef, useEffect } from 'react';
import { ariaUtils, keyboardNavigation, motionAccessibility } from '@/utils/accessibility';

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  announceOnClick?: boolean;
  announceMessage?: string;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      ariaLabel,
      ariaDescribedBy,
      announceOnClick = false,
      announceMessage,
      className = '',
      disabled,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isPressed, setIsPressed] = React.useState(false);

    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current!);

    // Generate unique ID for ARIA attributes
    const buttonId = React.useMemo(() => ariaUtils.generateId('button'), []);

    // Handle click with accessibility features
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (loading || disabled) return;

        // Announce click if requested
        if (announceOnClick && announceMessage) {
          ariaUtils.announce(announceMessage);
        }

        // Handle visual feedback
        setIsPressed(true);
        setTimeout(() => setIsPressed(false), 150);

        onClick?.(event);
      },
      [loading, disabled, announceOnClick, announceMessage, onClick]
    );

    // Handle keyboard interactions
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLButtonElement>) => {
        // Handle Enter and Space keys
        if (event.key === keyboardNavigation.KEYS.ENTER || event.key === keyboardNavigation.KEYS.SPACE) {
          event.preventDefault();
          if (!loading && !disabled) {
            // For keyboard activation, call handleClick with a minimal event
            handleClick(event as unknown as React.MouseEvent<HTMLButtonElement>);
          }
        }

        onKeyDown?.(event);
      },
      [handleClick, loading, disabled, onKeyDown]
    );

    // Apply reduced motion preferences
    useEffect(() => {
      if (buttonRef.current) {
        motionAccessibility.applyReducedMotion(buttonRef.current);
      }
    }, []);

    // Build class names
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-md',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'min-h-[44px]', // WCAG minimum touch target size
    ];

    const variantClasses = {
      primary: [
        'bg-indigo-600 text-white',
        'hover:bg-indigo-700',
        'focus:ring-indigo-500',
        'active:bg-indigo-800',
      ],
      secondary: [
        'bg-gray-200 text-gray-900',
        'hover:bg-gray-300',
        'focus:ring-gray-500',
        'active:bg-gray-400',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'active:bg-red-800',
      ],
      ghost: [
        'bg-transparent text-gray-700',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'active:bg-gray-200',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg min-h-[52px]',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const pressedClasses = isPressed ? 'scale-95' : '';

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      widthClasses,
      pressedClasses,
      className,
    ].join(' ');

    // Build ARIA attributes
    const ariaAttributes: Record<string, string | boolean> = {
      id: buttonId,
    };

    if (ariaLabel) {
      ariaAttributes['aria-label'] = ariaLabel;
    }

    if (ariaDescribedBy) {
      ariaAttributes['aria-describedby'] = ariaDescribedBy;
    }

    if (loading) {
      ariaAttributes['aria-busy'] = true;
      ariaAttributes['aria-disabled'] = true;
    }

    // Render loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
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
    );

    return (
      <button
        ref={buttonRef}
        type="button"
        className={allClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...ariaAttributes}
        {...props}
      >
        {loading && <LoadingSpinner />}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="mr-2" aria-hidden="true">
            {icon}
          </span>
        )}
        
        {children && (
          <span className={loading ? 'opacity-0' : ''}>
            {children}
          </span>
        )}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="ml-2" aria-hidden="true">
            {icon}
          </span>
        )}
        
        {loading && (
          <span className="sr-only">Loading...</span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
