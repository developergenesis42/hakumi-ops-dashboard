import React from 'react';
import { cn } from '@/utils/helpers';
import { withPropValidation, CommonValidators } from '@/utils/propValidation';

/**
 * Props for the IconButton component
 */
interface IconButtonProps {
  /** Click handler function */
  onClick: () => void;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'ghost';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Tooltip text */
  title?: string;
  /** ARIA label for accessibility */
  'aria-label'?: string;
  /** ARIA described by for accessibility */
  'aria-describedby'?: string;
}

function IconButtonComponent({
  onClick,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  title,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-gray-300 hover:text-white hover:bg-gray-700 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  return (
    <button
      onClick={onClick}
      className={classes}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel || title}
      aria-describedby={ariaDescribedBy}
    >
      <span className={iconSizeClasses[size]}>
        {icon}
      </span>
    </button>
  );
}

// Validation schema for IconButton
const iconButtonSchema = {
  onClick: { required: true, type: 'function' as const },
  icon: { required: true, validator: CommonValidators.isReactNode },
  variant: { type: 'string' as const },
  size: { type: 'string' as const },
  disabled: { type: 'boolean' as const },
  className: { type: 'string' as const },
  title: { type: 'string' as const },
  'aria-label': { type: 'string' as const },
  'aria-describedby': { type: 'string' as const }
};

// Export with prop validation
export const IconButton = withPropValidation(
  IconButtonComponent as unknown as React.ComponentType<Record<string, unknown>>,
  iconButtonSchema,
  'IconButton'
) as unknown as React.ComponentType<IconButtonProps>;

export default IconButton;
