/**
 * Environment Configuration
 * Centralized management of environment variables with validation and defaults
 */

export interface EnvironmentConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    anonKey: string;
  };
  
  // Application Configuration
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
  };
  
  // API Configuration
  api: {
    timeout: number;
    retryAttempts: number;
    baseUrl?: string;
  };
  
  // Feature Flags
  features: {
    enableAnalytics: boolean;
    enableDebugMode: boolean;
    enableExperimentalFeatures: boolean;
    enableOfflineMode: boolean;
  };
  
  // Security Configuration
  security: {
    enableCSRF: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  
  // Performance Configuration
  performance: {
    enableServiceWorker: boolean;
    enableCaching: boolean;
    cacheTimeout: number;
  };
}

/**
 * Validates and loads environment variables
 */
function loadEnvironmentConfig(): EnvironmentConfig {
  const requiredEnvVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  // Validate required environment variables
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file.'
    );
  }

  // Validate optional environment variables
  const optionalEnvVars = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    VITE_API_TIMEOUT: import.meta.env.VITE_API_TIMEOUT,
    VITE_API_RETRY_ATTEMPTS: import.meta.env.VITE_API_RETRY_ATTEMPTS,
    VITE_SESSION_TIMEOUT: import.meta.env.VITE_SESSION_TIMEOUT,
    VITE_MAX_LOGIN_ATTEMPTS: import.meta.env.VITE_MAX_LOGIN_ATTEMPTS,
    VITE_CACHE_TIMEOUT: import.meta.env.VITE_CACHE_TIMEOUT,
  };

  // Validate URL format for API base URL
  if (optionalEnvVars.VITE_API_BASE_URL) {
    try {
      new URL(optionalEnvVars.VITE_API_BASE_URL);
    } catch {
      throw new Error(
        'Invalid VITE_API_BASE_URL format. Must be a valid URL (e.g., https://api.example.com).'
      );
    }
  }

  // Validate numeric values
  const numericVars = [
    { key: 'VITE_API_TIMEOUT', value: optionalEnvVars.VITE_API_TIMEOUT, min: 1000, max: 300000 },
    { key: 'VITE_API_RETRY_ATTEMPTS', value: optionalEnvVars.VITE_API_RETRY_ATTEMPTS, min: 0, max: 10 },
    { key: 'VITE_SESSION_TIMEOUT', value: optionalEnvVars.VITE_SESSION_TIMEOUT, min: 60000, max: 86400000 },
    { key: 'VITE_MAX_LOGIN_ATTEMPTS', value: optionalEnvVars.VITE_MAX_LOGIN_ATTEMPTS, min: 1, max: 20 },
    { key: 'VITE_CACHE_TIMEOUT', value: optionalEnvVars.VITE_CACHE_TIMEOUT, min: 1000, max: 3600000 },
  ];

  for (const { key, value, min, max } of numericVars) {
    if (value) {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < min || numValue > max) {
        throw new Error(
          `Invalid ${key} value: ${value}. Must be a number between ${min} and ${max}.`
        );
      }
    }
  }

  // Validate boolean values
  const booleanVars = [
    'VITE_DEBUG',
    'VITE_ENABLE_ANALYTICS',
    'VITE_DEBUG_MODE',
    'VITE_EXPERIMENTAL_FEATURES',
    'VITE_OFFLINE_MODE',
    'VITE_ENABLE_CSRF',
    'VITE_ENABLE_SW',
    'VITE_ENABLE_CACHING',
  ];

  for (const varName of booleanVars) {
    const value = import.meta.env[varName];
    if (value && !['true', 'false'].includes(value.toLowerCase())) {
      throw new Error(
        `Invalid ${varName} value: ${value}. Must be 'true' or 'false'.`
      );
    }
  }

  const environment = (import.meta.env.VITE_APP_ENV || 'development') as 'development' | 'staging' | 'production';
  const isDevelopment = environment === 'development';

  return {
    supabase: {
      url: requiredEnvVars.VITE_SUPABASE_URL!,
      anonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY!,
    },
    
    app: {
      name: import.meta.env.VITE_APP_NAME || 'SPA Operations Dashboard',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment,
      debug: isDevelopment || import.meta.env.VITE_DEBUG === 'true',
    },
    
    api: {
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'),
      retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
      baseUrl: import.meta.env.VITE_API_BASE_URL,
    },
    
    features: {
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableDebugMode: isDevelopment || import.meta.env.VITE_DEBUG_MODE === 'true',
      enableExperimentalFeatures: import.meta.env.VITE_EXPERIMENTAL_FEATURES === 'true',
      enableOfflineMode: import.meta.env.VITE_OFFLINE_MODE === 'true',
    },
    
    security: {
      enableCSRF: import.meta.env.VITE_ENABLE_CSRF !== 'false',
      sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'), // 1 hour
      maxLoginAttempts: parseInt(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS || '5'),
    },
    
    performance: {
      enableServiceWorker: import.meta.env.VITE_ENABLE_SW === 'true',
      enableCaching: import.meta.env.VITE_ENABLE_CACHING !== 'false',
      cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TIMEOUT || '300000'), // 5 minutes
    },
  };
}

// Export the validated configuration
export const env = loadEnvironmentConfig();

// Export individual config sections for convenience
export const { supabase, app, api, features, security, performance } = env;

// Environment-specific helpers
export const isDevelopment = app.environment === 'development';
export const isProduction = app.environment === 'production';
export const isStaging = app.environment === 'staging';

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof typeof features): boolean => {
  return features[feature];
};

// Debug helper
export const debugLog = (...args: unknown[]) => {
  if (app.debug) {
    console.log(`[${app.name}]`, ...args);
  }
};

// Error logging helper
export const logError = (error: Error, context?: string) => {
  if (app.debug) {
    console.error(`[${app.name}] Error${context ? ` in ${context}` : ''}:`, error);
  }
};
