// Mock environment configuration for tests
export const env = {
  supabase: {
    url: 'http://localhost:54321',
    anonKey: 'test-key',
  },
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retryAttempts: 3,
  },
  app: {
    name: 'SPA Operations Dashboard Test',
    version: '1.0.0',
    environment: 'test' as const,
    debug: false,
  },
  features: {
    enableAnalytics: false,
    enableDebugMode: false,
    enableExperimentalFeatures: false,
    enableOfflineMode: false,
  },
  security: {
    enableCSRF: true,
    sessionTimeout: 3600000,
    maxLoginAttempts: 5,
  },
  performance: {
    enableServiceWorker: false,
    enableCaching: false,
    cacheTimeout: 300000,
  },
};

// Export individual config sections for convenience
export const { supabase, app, api, features, security, performance } = env;

export const getEnvironmentVariable = (varName: string): string | undefined => {
  return process.env[varName];
};

export const isDevelopment = false;
export const isProduction = false;
export const isStaging = false;
export const isTest = true;

// Feature flag helpers
export const isFeatureEnabled = (feature: keyof typeof features): boolean => {
  return features[feature];
};

// Debug helper - matches the actual implementation
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
