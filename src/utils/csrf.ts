// CSRF protection utilities
export const useCSRFProtection = () => {
  const getCSRFToken = () => {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    return token || '';
  };

  const validateCSRFToken = (token: string) => {
    const expectedToken = getCSRFToken();
    return token === expectedToken && token.length > 0;
  };

  return {
    getCSRFToken,
    validateCSRFToken,
  };
};