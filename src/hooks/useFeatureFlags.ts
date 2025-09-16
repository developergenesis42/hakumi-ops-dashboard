/**
 * Feature Flags Hook
 * React hook for accessing feature flags in components
 */

import { useMemo } from 'react';
import { 
  featureFlags, 
  isUIFeatureEnabled, 
  isBusinessFeatureEnabled, 
  isPerformanceFeatureEnabled, 
  isIntegrationFeatureEnabled, 
  isExperimentalFeatureEnabled,
  isFeatureFlagEnabled 
} from '@/config/feature-flags';

export interface UseFeatureFlagsReturn {
  flags: typeof featureFlags;
  isEnabled: typeof isFeatureFlagEnabled;
  ui: typeof isUIFeatureEnabled;
  business: typeof isBusinessFeatureEnabled;
  performance: typeof isPerformanceFeatureEnabled;
  integrations: typeof isIntegrationFeatureEnabled;
  experimental: typeof isExperimentalFeatureEnabled;
}

/**
 * Hook to access feature flags in React components
 * @returns Feature flags object and helper functions
 */
export const useFeatureFlags = (): UseFeatureFlagsReturn => {
  return useMemo(() => ({
    flags: featureFlags,
    isEnabled: isFeatureFlagEnabled,
    ui: isUIFeatureEnabled,
    business: isBusinessFeatureEnabled,
    performance: isPerformanceFeatureEnabled,
    integrations: isIntegrationFeatureEnabled,
    experimental: isExperimentalFeatureEnabled,
  }), []);
};

/**
 * Hook for UI feature flags specifically
 */
export const useUIFeatureFlags = () => {
  return useMemo(() => ({
    enableDarkMode: isUIFeatureEnabled('enableDarkMode'),
    enableAnimations: isUIFeatureEnabled('enableAnimations'),
    enableKeyboardShortcuts: isUIFeatureEnabled('enableKeyboardShortcuts'),
    enableAdvancedSearch: isUIFeatureEnabled('enableAdvancedSearch'),
    enableBulkOperations: isUIFeatureEnabled('enableBulkOperations'),
  }), []);
};

/**
 * Hook for business feature flags specifically
 */
export const useBusinessFeatureFlags = () => {
  return useMemo(() => ({
    enableMultiTherapistSessions: isBusinessFeatureEnabled('enableMultiTherapistSessions'),
    enableAdvancedPricing: isBusinessFeatureEnabled('enableAdvancedPricing'),
    enableInventoryManagement: isBusinessFeatureEnabled('enableInventoryManagement'),
    enableCustomerManagement: isBusinessFeatureEnabled('enableCustomerManagement'),
    enableReporting: isBusinessFeatureEnabled('enableReporting'),
  }), []);
};

/**
 * Hook for performance feature flags specifically
 */
export const usePerformanceFeatureFlags = () => {
  return useMemo(() => ({
    enableVirtualScrolling: isPerformanceFeatureEnabled('enableVirtualScrolling'),
    enableLazyLoading: isPerformanceFeatureEnabled('enableLazyLoading'),
    enableDataCaching: isPerformanceFeatureEnabled('enableDataCaching'),
    enableOptimisticUpdates: isPerformanceFeatureEnabled('enableOptimisticUpdates'),
  }), []);
};

/**
 * Hook for experimental feature flags specifically
 */
export const useExperimentalFeatureFlags = () => {
  return useMemo(() => ({
    enableAITranslations: isExperimentalFeatureEnabled('enableAITranslations'),
    enableVoiceCommands: isExperimentalFeatureEnabled('enableVoiceCommands'),
    enableARMode: isExperimentalFeatureEnabled('enableARMode'),
    enableBlockchainPayments: isExperimentalFeatureEnabled('enableBlockchainPayments'),
  }), []);
};
