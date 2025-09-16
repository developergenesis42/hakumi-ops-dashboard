/**
 * Rate Limiting Configuration
 * Centralized configuration for all rate limiting policies
 */

import { RateLimitAlgorithm } from '@/services/rateLimiterService';

// Environment-based rate limiting configuration
export interface RateLimitEnvironmentConfig {
  development: RateLimitConfig;
  production: RateLimitConfig;
  testing: RateLimitConfig;
}

// Rate limit configuration for different environments
export interface RateLimitConfig {
  // Authentication rate limits
  auth: {
    login: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    refresh: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    passwordReset: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
  };
  
  // API rate limits
  api: {
    general: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    sensitive: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    bulk: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
  };
  
  // Business logic rate limits
  business: {
    sessionCreate: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    dataExport: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    realtimeSubscribe: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    expenseAdd: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
  };
  
  // Client-side protection
  client: {
    rapidClicking: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    formSubmission: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
    navigation: {
      windowMs: number;
      maxRequests: number;
      algorithm: RateLimitAlgorithm;
    };
  };
}

// Development configuration (more permissive)
const developmentConfig: RateLimitConfig = {
  auth: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10, // 10 attempts
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    refresh: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 refresh attempts
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 reset attempts
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    }
  },
  api: {
    general: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200, // 200 requests
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    },
    sensitive: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 requests
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    bulk: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 bulk operations
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    }
  },
  business: {
    sessionCreate: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 sessions
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    },
    dataExport: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 exports
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    realtimeSubscribe: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 subscriptions
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    expenseAdd: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 expense additions
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    }
  },
  client: {
    rapidClicking: {
      windowMs: 5 * 1000, // 5 seconds
      maxRequests: 30, // 30 clicks
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    formSubmission: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 form submissions
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    navigation: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 navigation events
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    }
  }
};

// Production configuration (more restrictive)
const productionConfig: RateLimitConfig = {
  auth: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    refresh: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 refresh attempts
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 reset attempts
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    }
  },
  api: {
    general: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    },
    sensitive: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 requests
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    bulk: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 bulk operations
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    }
  },
  business: {
    sessionCreate: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 sessions
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    },
    dataExport: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5, // 5 exports
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    realtimeSubscribe: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 subscriptions
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    expenseAdd: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 expense additions
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    }
  },
  client: {
    rapidClicking: {
      windowMs: 5 * 1000, // 5 seconds
      maxRequests: 20, // 20 clicks
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    formSubmission: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 form submissions
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    navigation: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50, // 50 navigation events
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    }
  }
};

// Testing configuration (very permissive)
const testingConfig: RateLimitConfig = {
  auth: {
    login: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 attempts
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    refresh: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 1000, // 1000 refresh attempts
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    passwordReset: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 reset attempts
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    }
  },
  api: {
    general: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 requests
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    },
    sensitive: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 requests
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    bulk: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 bulk operations
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    }
  },
  business: {
    sessionCreate: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 sessions
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    },
    dataExport: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 exports
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    realtimeSubscribe: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 subscriptions
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    expenseAdd: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 expense additions
      algorithm: RateLimitAlgorithm.TOKEN_BUCKET
    }
  },
  client: {
    rapidClicking: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 clicks
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    },
    formSubmission: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 form submissions
      algorithm: RateLimitAlgorithm.FIXED_WINDOW
    },
    navigation: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000, // 10000 navigation events
      algorithm: RateLimitAlgorithm.SLIDING_WINDOW
    }
  }
};

// Environment configuration mapping
export const rateLimitConfigs: RateLimitEnvironmentConfig = {
  development: developmentConfig,
  production: productionConfig,
  testing: testingConfig
};

// Get current environment configuration
export function getCurrentRateLimitConfig(): RateLimitConfig {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return rateLimitConfigs[env as keyof RateLimitEnvironmentConfig] || developmentConfig;
}

// Convert configuration to rate limiter format
export function configToRateLimiterConfig(
  config: { windowMs: number; maxRequests: number; algorithm: RateLimitAlgorithm },
  name: string,
  onLimitReached?: (key: string, limit: number) => void
) {
  return {
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
    algorithm: config.algorithm,
    keyGenerator: (identifier: string) => `${name}:${identifier}`,
    onLimitReached: onLimitReached || ((key: string) => {
      console.warn(`Rate limit exceeded for ${name}:`, key);
    })
  };
}

// Rate limiting policies for different user roles
export interface RoleBasedRateLimits {
  admin: {
    multiplier: number; // Multiplier for admin users
    bypassLimits?: string[]; // Limits that admins can bypass
  };
  manager: {
    multiplier: number;
    bypassLimits?: string[];
  };
  staff: {
    multiplier: number;
    bypassLimits?: string[];
  };
  anonymous: {
    multiplier: number;
    bypassLimits?: string[];
  };
}

export const roleBasedLimits: RoleBasedRateLimits = {
  admin: {
    multiplier: 2.0, // Admins get 2x the normal limits
    bypassLimits: ['dataExport'] // Admins can bypass data export limits
  },
  manager: {
    multiplier: 1.5, // Managers get 1.5x the normal limits
    bypassLimits: []
  },
  staff: {
    multiplier: 1.0, // Staff get normal limits
    bypassLimits: []
  },
  anonymous: {
    multiplier: 0.5, // Anonymous users get 0.5x the normal limits
    bypassLimits: []
  }
};

// Dynamic rate limiting based on system load
export interface SystemLoadConfig {
  low: {
    multiplier: number;
    description: string;
  };
  medium: {
    multiplier: number;
    description: string;
  };
  high: {
    multiplier: number;
    description: string;
  };
  critical: {
    multiplier: number;
    description: string;
  };
}

export const systemLoadConfig: SystemLoadConfig = {
  low: {
    multiplier: 1.0,
    description: 'Normal operation'
  },
  medium: {
    multiplier: 0.8,
    description: 'Slightly reduced limits'
  },
  high: {
    multiplier: 0.6,
    description: 'Reduced limits due to high load'
  },
  critical: {
    multiplier: 0.3,
    description: 'Severely reduced limits due to critical load'
  }
};

// Rate limiting monitoring configuration
export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metricsInterval: number; // milliseconds
  alertThresholds: {
    warning: number; // percentage of limit
    critical: number; // percentage of limit
  };
  reportingEndpoint?: string;
}

export const monitoringConfig: MonitoringConfig = {
  enabled: true,
  logLevel: 'warn',
  metricsInterval: 60000, // 1 minute
  alertThresholds: {
    warning: 80, // Alert when 80% of limit is reached
    critical: 95 // Alert when 95% of limit is reached
  }
};

// Feature flags for rate limiting
export interface RateLimitFeatureFlags {
  enabled: boolean;
  bypassInDevelopment: boolean;
  enableMonitoring: boolean;
  enableAlerts: boolean;
  enableAbuseProtection: boolean;
  enableClientSideLimiting: boolean;
  enableServerSideLimiting: boolean;
}

export const rateLimitFeatureFlags: RateLimitFeatureFlags = {
  enabled: import.meta.env.VITE_ENABLE_RATE_LIMITING !== 'false',
  bypassInDevelopment: import.meta.env.VITE_BYPASS_RATE_LIMITS_DEV === 'true',
  enableMonitoring: import.meta.env.VITE_ENABLE_RATE_LIMIT_MONITORING !== 'false',
  enableAlerts: import.meta.env.VITE_ENABLE_RATE_LIMIT_ALERTS === 'true',
  enableAbuseProtection: import.meta.env.VITE_ENABLE_ABUSE_PROTECTION !== 'false',
  enableClientSideLimiting: import.meta.env.VITE_ENABLE_CLIENT_RATE_LIMITING !== 'false',
  enableServerSideLimiting: import.meta.env.VITE_ENABLE_SERVER_RATE_LIMITING !== 'false'
};

// Utility functions
export function getRateLimitForRole(role: keyof RoleBasedRateLimits): number {
  return roleBasedLimits[role]?.multiplier || 1.0;
}

export function getRateLimitForSystemLoad(load: keyof SystemLoadConfig): number {
  return systemLoadConfig[load]?.multiplier || 1.0;
}

export function shouldBypassRateLimit(role: keyof RoleBasedRateLimits, limitName: string): boolean {
  const roleConfig = roleBasedLimits[role];
  return roleConfig?.bypassLimits?.includes(limitName) || false;
}

export function isRateLimitingEnabled(): boolean {
  return rateLimitFeatureFlags.enabled;
}

export function shouldBypassInDevelopment(): boolean {
  return rateLimitFeatureFlags.bypassInDevelopment && 
         import.meta.env.VITE_APP_ENV === 'development';
}
