import { useState, useCallback } from 'react';
import { ValidationRule, validateField } from '@/utils/validation';

export const useFieldValidation = (fieldName: string, initialRules: ValidationRule = {}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [rules, setRules] = useState(initialRules);
  const [value, setValue] = useState<unknown>('');
  const [touched, setTouched] = useState(false);

  const validate = useCallback((val: unknown): boolean => {
    const result = validateField(val, rules, fieldName);
    setErrors(result.errors);
    return result.isValid;
  }, [rules, fieldName]);

  const validateCurrent = useCallback((): boolean => {
    return validate(value);
  }, [validate, value]);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const setFieldRules = useCallback((fieldRules: ValidationRule) => {
    setRules(fieldRules);
  }, []);

  const setTouchedCallback = useCallback(() => {
    setTouched(true);
  }, []);

  const error = errors.length > 0 ? errors[0] : null;

  return {
    errors,
    error,
    value,
    setValue,
    touched,
    setTouched: setTouchedCallback,
    validate: validateCurrent,
    clearErrors,
    setFieldRules,
    isValid: errors.length === 0
  };
};