// Prop validation utilities
import React from 'react';

export interface CommonValidators {
  required: (value: unknown) => boolean;
  string: (value: unknown) => boolean;
  number: (value: unknown) => boolean;
  array: (value: unknown) => boolean;
  object: (value: unknown) => boolean;
  nonEmptyString: (value: unknown) => boolean;
  isReactNode: (value: unknown) => boolean;
}

export const CommonValidators: CommonValidators = {
  required: (value) => value !== undefined && value !== null && value !== '',
  string: (value) => typeof value === 'string',
  number: (value) => typeof value === 'number' && !isNaN(value),
  array: (value) => Array.isArray(value),
  object: (value) => typeof value === 'object' && value !== null && !Array.isArray(value),
  nonEmptyString: (value) => typeof value === 'string' && value.length > 0,
  isReactNode: (value) => React.isValidElement(value) || typeof value === 'string' || typeof value === 'number',
};

export function withPropValidation<P extends object>(
  Component: React.ComponentType<P>,
  validators: Partial<Record<keyof P, (value: unknown) => boolean>>,
  componentName?: string
) {
  return React.forwardRef<React.ElementRef<typeof Component>, P>((props, ref) => {
    // Validate props in development
    if (process.env.NODE_ENV === 'development') {
      for (const [propName, validator] of Object.entries(validators)) {
        if (validator && typeof validator === 'function' && !validator((props as Record<string, unknown>)[propName])) {
          console.warn(`Invalid prop ${propName} for component ${componentName || Component.displayName || Component.name}`);
        }
      }
    }

    return React.createElement(Component, { ...props, ref } as P & { ref?: React.Ref<React.ElementRef<typeof Component>> });
  });
}