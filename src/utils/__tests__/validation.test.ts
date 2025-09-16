import {
  validateField,
  validateFields,
  validateTherapist,
  validateSession,
  ValidationRule,
} from '@/utils/validation';

describe('validation utilities', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      const rules: ValidationRule = { required: true };
      
      expect(validateField('', rules, 'name')).toEqual({
        isValid: false,
        errors: ['name is required'],
      });
      
      expect(validateField(null, rules, 'name')).toEqual({
        isValid: false,
        errors: ['name is required'],
      });
      
      expect(validateField(undefined, rules, 'name')).toEqual({
        isValid: false,
        errors: ['name is required'],
      });
      
      expect(validateField('John', rules, 'name')).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should validate string length constraints', () => {
      const rules: ValidationRule = { minLength: 3, maxLength: 10 };
      
      expect(validateField('ab', rules, 'name')).toEqual({
        isValid: false,
        errors: ['name must be at least 3 characters'],
      });
      
      expect(validateField('abcdefghijk', rules, 'name')).toEqual({
        isValid: false,
        errors: ['name must be no more than 10 characters'],
      });
      
      expect(validateField('abc', rules, 'name')).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should validate regex patterns', () => {
      const rules: ValidationRule = { pattern: /^[A-Za-z\s]+$/ };
      
      expect(validateField('John123', rules, 'name')).toEqual({
        isValid: false,
        errors: ['name format is invalid'],
      });
      
      expect(validateField('John Doe', rules, 'name')).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should validate numeric constraints', () => {
      const rules: ValidationRule = { min: 0, max: 100 };
      
      expect(validateField(-1, rules, 'price')).toEqual({
        isValid: false,
        errors: ['price must be at least 0'],
      });
      
      expect(validateField(101, rules, 'price')).toEqual({
        isValid: false,
        errors: ['price must be no more than 100'],
      });
      
      expect(validateField(50, rules, 'price')).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should validate custom rules', () => {
      const rules: ValidationRule = {
        custom: (value: unknown) => {
          if (typeof value === 'string' && value.includes('test')) {
            return 'Value cannot contain "test"';
          }
          return null;
        },
      };
      
      expect(validateField('test value', rules, 'field')).toEqual({
        isValid: false,
        errors: ['Value cannot contain "test"'],
      });
      
      expect(validateField('valid value', rules, 'field')).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should skip validations for empty non-required fields', () => {
      const rules: ValidationRule = { minLength: 3, pattern: /^[A-Z]+$/ };
      
      expect(validateField('', rules, 'optional')).toEqual({
        isValid: true,
        errors: [],
      });
      
      expect(validateField(null, rules, 'optional')).toEqual({
        isValid: true,
        errors: [],
      });
    });

    it('should combine multiple validation errors', () => {
      const rules: ValidationRule = {
        required: true,
        minLength: 5,
        maxLength: 10,
        pattern: /^[A-Z]+$/,
      };
      
      expect(validateField('ab', rules, 'field')).toEqual({
        isValid: false,
        errors: [
          'field must be at least 5 characters',
          'field format is invalid',
        ],
      });
    });
  });

  describe('validateFields', () => {
    it('should validate multiple fields', () => {
      const fieldData = {
        name: { value: 'John', rules: { required: true, minLength: 2 } },
        email: { value: 'invalid-email', rules: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } },
        age: { value: 25, rules: { min: 18, max: 65 } },
      };
      
      const result = validateFields(fieldData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email format is invalid');
      expect(result.errors).not.toContain('name is required');
      expect(result.errors).not.toContain('age must be at least 18');
    });

    it('should return valid result when all fields are valid', () => {
      const fieldData = {
        name: { value: 'John Doe', rules: { required: true, minLength: 2 } },
        email: { value: 'john@example.com', rules: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } },
        age: { value: 25, rules: { min: 18, max: 65 } },
      };
      
      const result = validateFields(fieldData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateTherapist', () => {
    it('should validate therapist data', () => {
      const validData = {
        id: '1',
        name: 'John Doe',
        status: 'available',
        currentSession: null,
      };
      
      const result = validateTherapist(validData);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid therapist data', () => {
      const invalidData = {
        id: '1',
        name: '', // Required field empty
        status: 'available',
        currentSession: null,
      };
      
      const result = validateTherapist(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('name is required');
    });
  });

  describe('validateSession', () => {
    it('should validate session data', () => {
      const validData = {
        id: '1',
        therapistIds: ['1', '2'],
        service: { id: 'service-1', name: 'Test Service' },
        roomId: 'room-1',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour later
        discount: 0,
        totalPrice: 100,
        status: 'active' as const,
      };
      
      const result = validateSession(validData);
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid session data', () => {
      const invalidData = {
        id: '1',
        therapistIds: [], // Empty array
        serviceId: '',
        roomId: '',
        startTime: new Date(),
        endTime: new Date(Date.now() - 3600000), // End time before start time
        discount: -10, // Negative discount
        totalPrice: -50, // Negative price
        status: 'active' as const,
      };
      
      const result = validateSession(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });


  describe('edge cases', () => {
    it('should handle undefined rules gracefully', () => {
      const result = validateField('test', {} as ValidationRule, 'field');
      expect(result.isValid).toBe(true);
    });

    it('should handle null values in custom validators', () => {
      const rules: ValidationRule = {
        required: true,
        custom: (value: unknown) => {
          if (value === null) return 'Value cannot be null';
          return null;
        },
      };
      
      const result = validateField(null, rules, 'field');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('field is required');
    });

    it('should handle empty string patterns', () => {
      const rules: ValidationRule = { pattern: /^$/ };
      
      expect(validateField('', rules, 'field')).toEqual({
        isValid: true,
        errors: [],
      });
      
      expect(validateField('a', rules, 'field')).toEqual({
        isValid: false,
        errors: ['field format is invalid'],
      });
    });
  });
});
