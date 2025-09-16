/**
 * Accessible Form Field Component
 * WCAG 2.1 AA compliant form field with proper labeling and error handling
 */

import React, { forwardRef, useCallback, useRef, useState } from 'react';

export interface AccessibleFormFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onValidationChange?: (isValid: boolean) => void;
}

const AccessibleFormField = forwardRef<HTMLInputElement, AccessibleFormFieldProps>(
  (
    {
      label,
      error,
      hint,
      required = false,
      variant = 'default',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      id,
      onValidationChange,
      onChange,
      onBlur,
      ...props
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [, setIsFocused] = useState(false);
    const [, setHasValue] = useState(false);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Generate unique IDs
    const fieldId = React.useId();
    const inputId = id || `input-${fieldId}`;
    const labelId = `label-${fieldId}`;
    const hintId = `hint-${fieldId}`;
    const errorId = `error-${fieldId}`;

    // Handle input change
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setHasValue(value.length > 0);
        
        // Validate and notify parent
        const isValid = !error && (required ? value.length > 0 : true);
        onValidationChange?.(isValid);

        onChange?.(event);
      },
      [error, required, onValidationChange, onChange]
    );

    // Handle focus
    const handleFocus = useCallback(() => {
      setIsFocused(true);
    }, []);

    // Handle blur
    const handleBlur = useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(false);
        onBlur?.(event);
      },
      [onBlur]
    );

    // Build class names
    const baseClasses = [
      'block w-full rounded-md border-0',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'min-h-[44px]', // WCAG minimum touch target size
    ];

    const variantClasses = {
      default: [
        'bg-white border border-gray-300',
        'focus:ring-indigo-500 focus:border-indigo-500',
        'placeholder:text-gray-400',
      ],
      filled: [
        'bg-gray-50 border border-gray-200',
        'focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white',
        'placeholder:text-gray-500',
      ],
      outlined: [
        'bg-transparent border-2 border-gray-300',
        'focus:ring-indigo-500 focus:border-indigo-500',
        'placeholder:text-gray-400',
      ],
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const stateClasses = error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : '';

    const widthClasses = fullWidth ? 'w-full' : '';

    const allClasses = [
      ...baseClasses,
      ...variantClasses[variant],
      ...sizeClasses[size],
      stateClasses,
      widthClasses,
      className,
    ].join(' ');

    // Build ARIA attributes
    const ariaAttributes: Record<string, string> = {
      id: inputId,
      'aria-labelledby': labelId,
    };

    if (hint) {
      ariaAttributes['aria-describedby'] = hintId;
    }

    if (error) {
      ariaAttributes['aria-describedby'] = `${hintId} ${errorId}`;
      ariaAttributes['aria-invalid'] = 'true';
    }

    if (required) {
      ariaAttributes['aria-required'] = 'true';
    }

    return (
      <div className={`space-y-1 ${fullWidth ? 'w-full' : ''}`}>
        {/* Label */}
        <label
          id={labelId}
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {leftIcon}
              </span>
            </div>
          )}

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            className={`${allClasses} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...ariaAttributes}
            {...props}
          />

          {/* Right icon */}
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400" aria-hidden="true">
                {rightIcon}
              </span>
            </div>
          )}
        </div>

        {/* Hint */}
        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500">
            {hint}
          </p>
        )}

        {/* Error message */}
        {error && (
          <div
            id={errorId}
            className="text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    );
  }
);

AccessibleFormField.displayName = 'AccessibleFormField';

export default AccessibleFormField;
