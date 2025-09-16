/**
 * Feature Flags Configuration
 * Centralized management of feature flags for A/B testing and gradual rollouts
 */

import { isFeatureEnabled } from '@/config/environment';

export interface FeatureFlags {
  // UI/UX Features
  ui: {
    enableDarkMode: boolean;
    enableAnimations: boolean;
    enableKeyboardShortcuts: boolean;
    enableAdvancedSearch: boolean;
    enableBulkOperations: boolean;
  };
  
  // Business Logic Features
  business: {
    enableMultiTherapistSessions: boolean;
    enableAdvancedPricing: boolean;
    enableInventoryManagement: boolean;
    enableCustomerManagement: boolean;
    enableReporting: boolean;
  };
  
  // Performance Features
  performance: {
    enableVirtualScrolling: boolean;
    enableLazyLoading: boolean;
    enableDataCaching: boolean;
    enableOptimisticUpdates: boolean;
  };
  
  // Integration Features
  integrations: {
    enablePaymentGateway: boolean;
    enableSMSNotifications: boolean;
    enableEmailNotifications: boolean;
    enableThirdPartyAnalytics: boolean;
  };
  
  // Experimental Features
  experimental: {
    enableAITranslations: boolean;
    enableVoiceCommands: boolean;
    enableARMode: boolean;
    enableBlockchainPayments: boolean;
  };
}

/**
 * Default feature flags configuration
 */
const defaultFeatureFlags: FeatureFlags = {
  ui: {
    enableDarkMode: true,
    enableAnimations: true,
    enableKeyboardShortcuts: true,
    enableAdvancedSearch: false,
    enableBulkOperations: false,
  },
  
  business: {
    enableMultiTherapistSessions: true,
    enableAdvancedPricing: false,
    enableInventoryManagement: false,
    enableCustomerManagement: false,
    enableReporting: true,
  },
  
  performance: {
    enableVirtualScrolling: false,
    enableLazyLoading: true,
    enableDataCaching: true,
    enableOptimisticUpdates: true,
  },
  
  integrations: {
    enablePaymentGateway: false,
    enableSMSNotifications: false,
    enableEmailNotifications: false,
    enableThirdPartyAnalytics: false,
  },
  
  experimental: {
    enableAITranslations: false,
    enableVoiceCommands: false,
    enableARMode: false,
    enableBlockchainPayments: false,
  },
};

/**
 * Environment-specific feature flag overrides
 */
const environmentOverrides: Partial<FeatureFlags> = {
  // Development overrides
  ...(isFeatureEnabled('enableDebugMode') && {
    ui: {
      ...defaultFeatureFlags.ui,
      enableAdvancedSearch: true,
      enableBulkOperations: true,
    },
    business: {
      ...defaultFeatureFlags.business,
      enableAdvancedPricing: true,
      enableInventoryManagement: true,
      enableCustomerManagement: true,
    },
    experimental: {
      ...defaultFeatureFlags.experimental,
      enableAITranslations: true,
    },
  }),
  
  // Production overrides
  ...(isFeatureEnabled('enableExperimentalFeatures') && {
    experimental: {
      ...defaultFeatureFlags.experimental,
      enableVoiceCommands: true,
    },
  }),
};

/**
 * Merges default flags with environment overrides
 */
function mergeFeatureFlags(): FeatureFlags {
  return {
    ui: { ...defaultFeatureFlags.ui, ...environmentOverrides.ui },
    business: { ...defaultFeatureFlags.business, ...environmentOverrides.business },
    performance: { ...defaultFeatureFlags.performance, ...environmentOverrides.performance },
    integrations: { ...defaultFeatureFlags.integrations, ...environmentOverrides.integrations },
    experimental: { ...defaultFeatureFlags.experimental, ...environmentOverrides.experimental },
  };
}

// Export the merged feature flags
export const featureFlags = mergeFeatureFlags();

// Feature flag helper functions
export const isUIFeatureEnabled = (feature: keyof FeatureFlags['ui']): boolean => {
  return featureFlags.ui[feature];
};

export const isBusinessFeatureEnabled = (feature: keyof FeatureFlags['business']): boolean => {
  return featureFlags.business[feature];
};

export const isPerformanceFeatureEnabled = (feature: keyof FeatureFlags['performance']): boolean => {
  return featureFlags.performance[feature];
};

export const isIntegrationFeatureEnabled = (feature: keyof FeatureFlags['integrations']): boolean => {
  return featureFlags.integrations[feature];
};

export const isExperimentalFeatureEnabled = (feature: keyof FeatureFlags['experimental']): boolean => {
  return featureFlags.experimental[feature];
};

// Generic feature flag checker
export const isFeatureFlagEnabled = (category: keyof FeatureFlags, feature: string): boolean => {
  return (featureFlags[category] as Record<string, boolean>)[feature] === true;
};

// Feature flag context for React components
export const getFeatureFlagContext = () => ({
  flags: featureFlags,
  isEnabled: isFeatureFlagEnabled,
  ui: isUIFeatureEnabled,
  business: isBusinessFeatureEnabled,
  performance: isPerformanceFeatureEnabled,
  integrations: isIntegrationFeatureEnabled,
  experimental: isExperimentalFeatureEnabled,
});
