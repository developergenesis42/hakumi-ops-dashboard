/**
 * Security configuration for the SPA Operations Dashboard
 */

export const securityConfig = {
  // CSRF Protection
  csrf: {
    enabled: import.meta.env.VITE_CSRF_PROTECTION !== 'false',
    tokenLifetime: 30 * 60 * 1000, // 30 minutes
    refreshInterval: 25 * 60 * 1000, // 25 minutes (before expiry)
  },

  // Input Validation
  validation: {
    enabled: true,
    sanitizeInputs: true,
    maxStringLength: 1000,
    maxNumberValue: 999999.99,
  },

  // Logging
  logging: {
    enabled: import.meta.env.MODE === 'development' || import.meta.env.VITE_DEBUG_MODE === 'true',
    level: import.meta.env.MODE === 'development' ? 'debug' : 'error',
  },

  // Rate Limiting (for future implementation)
  rateLimiting: {
    enabled: false, // Not implemented yet
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },

  // Content Security Policy (for future implementation)
  csp: {
    enabled: false, // Not implemented yet
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://*.supabase.co'],
    },
  },
};

/**
 * Check if security feature is enabled
 */
export function isSecurityFeatureEnabled(feature: keyof typeof securityConfig): boolean {
  return securityConfig[feature].enabled;
}

/**
 * Get security configuration for a specific feature
 */
export function getSecurityConfig<T extends keyof typeof securityConfig>(
  feature: T
): typeof securityConfig[T] {
  return securityConfig[feature];
}
