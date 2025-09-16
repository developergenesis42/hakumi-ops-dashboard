// Validation utilities
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: unknown) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateField(value: unknown, rules: ValidationRule, fieldName: string): ValidationResult {
  const errors: string[] = [];

  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    errors.push(`${fieldName} is required`);
  }

  if (value && typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`);
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${fieldName} format is invalid`);
    }
  }

  if (value && typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${fieldName} must be at least ${rules.min}`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(`${fieldName} must be no more than ${rules.max}`);
    }
  }

  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push(customError);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateFields(fields: Record<string, { value: unknown; rules: ValidationRule }>): ValidationResult {
  const allErrors: string[] = [];
  let isValid = true;

  for (const [fieldName, { value, rules }] of Object.entries(fields)) {
    const result = validateField(value, rules, fieldName);
    if (!result.isValid) {
      isValid = false;
      allErrors.push(...result.errors);
    }
  }

  return {
    isValid,
    errors: allErrors
  };
}

export const ValidationRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  phone: { 
    pattern: /^[+]?[0-9\s\-()]{10,}$/ 
  },
  minLength: (min: number) => ({ minLength: min }),
  maxLength: (max: number) => ({ maxLength: max }),
  discount: {
    required: false,
    min: 0,
    custom: (value: unknown) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
      if (value && (isNaN(numValue) || numValue < 0)) {
        return 'Discount must be a positive number';
      }
      return null;
    }
  },
  searchTerm: {
    required: false,
    minLength: 1
  },
  walkOutCount: {
    required: true,
    min: 1,
    custom: (value: unknown) => {
      const numValue = typeof value === 'string' ? parseInt(value) : (typeof value === 'number' ? value : 0);
      if (isNaN(numValue) || numValue < 1) {
        return 'Walk out count must be at least 1';
      }
      return null;
    }
  }
};

export function validateTherapist(therapist: { name: unknown; status: unknown }): ValidationResult {
  return validateFields({
    name: { value: therapist.name, rules: { required: true, minLength: 2 } },
    status: { value: therapist.status, rules: { required: true } }
  });
}

export function validateSession(session: { 
  therapistIds: unknown; 
  service: unknown; 
  roomId: unknown; 
  startTime: unknown; 
  endTime: unknown; 
}): ValidationResult {
  return validateFields({
    therapistIds: { 
      value: session.therapistIds, 
      rules: { 
        required: true, 
        custom: (value) => Array.isArray(value) && value.length > 0 ? null : 'At least one therapist is required'
      } 
    },
    service: { value: session.service, rules: { required: true } },
    roomId: { value: session.roomId, rules: { required: true } },
    startTime: { value: session.startTime, rules: { required: true } },
    endTime: { value: session.endTime, rules: { required: true } }
  });
}