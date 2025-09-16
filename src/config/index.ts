/**
 * Configuration Index
 * Centralized export of all configuration modules
 */

// Environment configuration
export * from './environment';

// Feature flags configuration
export * from './feature-flags';

// Re-export constants from the existing constants file
export * from '@/constants';

// Configuration types
export type { EnvironmentConfig } from './environment';
export type { FeatureFlags } from './feature-flags';

// Import configurations statically
import { env } from '@/config/environment';
import { featureFlags } from '@/config/feature-flags';

// Configuration validation
export const validateConfiguration = () => {
  const errors: string[] = [];
  
  // Validate environment variables
  if (!env.supabase.url) errors.push('Supabase URL is required');
  if (!env.supabase.anonKey) errors.push('Supabase anon key is required');
  
  // Validate feature flags
  if (!featureFlags) errors.push('Feature flags configuration is missing');
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
};

// Configuration initialization
export const initializeConfiguration = () => {
  try {
    validateConfiguration();
    console.log('✅ Configuration initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Configuration initialization failed:', error);
    return false;
  }
};
