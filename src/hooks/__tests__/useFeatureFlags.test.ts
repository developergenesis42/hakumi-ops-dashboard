import { renderHook } from '@testing-library/react';
import {
  useFeatureFlags,
  useUIFeatureFlags,
  useBusinessFeatureFlags,
  usePerformanceFeatureFlags,
  useExperimentalFeatureFlags,
} from '@/hooks/useFeatureFlags';
import {
  featureFlags,
  isFeatureFlagEnabled,
  isUIFeatureEnabled,
  isBusinessFeatureEnabled,
  isPerformanceFeatureEnabled,
  isIntegrationFeatureEnabled,
  isExperimentalFeatureEnabled,
} from '@/config/feature-flags';

// Mock the feature flags module
jest.mock('@/config/feature-flags', () => ({
  featureFlags: {
    enableDarkMode: true,
    enableAnimations: false,
    enableKeyboardShortcuts: true,
    enableAdvancedSearch: false,
    enableBulkOperations: true,
    enableMultiTherapistSessions: true,
    enableAdvancedPricing: false,
    enableInventoryManagement: true,
    enableCustomerManagement: false,
    enableReporting: true,
    enableVirtualScrolling: false,
    enableLazyLoading: true,
    enableDataCaching: true,
    enableOptimisticUpdates: false,
    enableAITranslations: false,
    enableVoiceCommands: true,
    enableARMode: false,
    enableBlockchainPayments: false,
  },
  isFeatureFlagEnabled: jest.fn(),
  isUIFeatureEnabled: jest.fn(),
  isBusinessFeatureEnabled: jest.fn(),
  isPerformanceFeatureEnabled: jest.fn(),
  isIntegrationFeatureEnabled: jest.fn(),
  isExperimentalFeatureEnabled: jest.fn(),
}));

// const mockIsFeatureFlagEnabled = isFeatureFlagEnabled as jest.MockedFunction<typeof isFeatureFlagEnabled>;
const mockIsUIFeatureEnabled = isUIFeatureEnabled as jest.MockedFunction<typeof isUIFeatureEnabled>;
const mockIsBusinessFeatureEnabled = isBusinessFeatureEnabled as jest.MockedFunction<typeof isBusinessFeatureEnabled>;
const mockIsPerformanceFeatureEnabled = isPerformanceFeatureEnabled as jest.MockedFunction<typeof isPerformanceFeatureEnabled>;
const mockIsExperimentalFeatureEnabled = isExperimentalFeatureEnabled as jest.MockedFunction<typeof isExperimentalFeatureEnabled>;

describe('useFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useFeatureFlags', () => {
    it('should return feature flags and helper functions', () => {
      const { result } = renderHook(() => useFeatureFlags());

      expect(result.current.flags).toBe(featureFlags);
      expect(result.current.isEnabled).toBe(isFeatureFlagEnabled);
      expect(result.current.ui).toBe(isUIFeatureEnabled);
      expect(result.current.business).toBe(isBusinessFeatureEnabled);
      expect(result.current.performance).toBe(isPerformanceFeatureEnabled);
      expect(result.current.integrations).toBe(isIntegrationFeatureEnabled);
      expect(result.current.experimental).toBe(isExperimentalFeatureEnabled);
    });

    it('should return the same object reference on re-renders', () => {
      const { result, rerender } = renderHook(() => useFeatureFlags());
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });

  describe('useUIFeatureFlags', () => {
    beforeEach(() => {
      mockIsUIFeatureEnabled.mockImplementation((flag) => {
        const uiFlags = {
          enableDarkMode: true,
          enableAnimations: false,
          enableKeyboardShortcuts: true,
          enableAdvancedSearch: false,
          enableBulkOperations: true,
        };
        return uiFlags[flag as keyof typeof uiFlags] || false;
      });
    });

    it('should return UI feature flags', () => {
      const { result } = renderHook(() => useUIFeatureFlags());

      expect(result.current.enableDarkMode).toBe(true);
      expect(result.current.enableAnimations).toBe(false);
      expect(result.current.enableKeyboardShortcuts).toBe(true);
      expect(result.current.enableAdvancedSearch).toBe(false);
      expect(result.current.enableBulkOperations).toBe(true);
    });

    it('should call isUIFeatureEnabled for each flag', () => {
      renderHook(() => useUIFeatureFlags());

      expect(mockIsUIFeatureEnabled).toHaveBeenCalledWith('enableDarkMode');
      expect(mockIsUIFeatureEnabled).toHaveBeenCalledWith('enableAnimations');
      expect(mockIsUIFeatureEnabled).toHaveBeenCalledWith('enableKeyboardShortcuts');
      expect(mockIsUIFeatureEnabled).toHaveBeenCalledWith('enableAdvancedSearch');
      expect(mockIsUIFeatureEnabled).toHaveBeenCalledWith('enableBulkOperations');
    });
  });

  describe('useBusinessFeatureFlags', () => {
    beforeEach(() => {
      mockIsBusinessFeatureEnabled.mockImplementation((flag) => {
        const businessFlags = {
          enableMultiTherapistSessions: true,
          enableAdvancedPricing: false,
          enableInventoryManagement: true,
          enableCustomerManagement: false,
          enableReporting: true,
        };
        return businessFlags[flag as keyof typeof businessFlags] || false;
      });
    });

    it('should return business feature flags', () => {
      const { result } = renderHook(() => useBusinessFeatureFlags());

      expect(result.current.enableMultiTherapistSessions).toBe(true);
      expect(result.current.enableAdvancedPricing).toBe(false);
      expect(result.current.enableInventoryManagement).toBe(true);
      expect(result.current.enableCustomerManagement).toBe(false);
      expect(result.current.enableReporting).toBe(true);
    });
  });

  describe('usePerformanceFeatureFlags', () => {
    beforeEach(() => {
      mockIsPerformanceFeatureEnabled.mockImplementation((flag) => {
        const performanceFlags = {
          enableVirtualScrolling: false,
          enableLazyLoading: true,
          enableDataCaching: true,
          enableOptimisticUpdates: false,
        };
        return performanceFlags[flag as keyof typeof performanceFlags] || false;
      });
    });

    it('should return performance feature flags', () => {
      const { result } = renderHook(() => usePerformanceFeatureFlags());

      expect(result.current.enableVirtualScrolling).toBe(false);
      expect(result.current.enableLazyLoading).toBe(true);
      expect(result.current.enableDataCaching).toBe(true);
      expect(result.current.enableOptimisticUpdates).toBe(false);
    });
  });

  describe('useExperimentalFeatureFlags', () => {
    beforeEach(() => {
      mockIsExperimentalFeatureEnabled.mockImplementation((flag) => {
        const experimentalFlags = {
          enableAITranslations: false,
          enableVoiceCommands: true,
          enableARMode: false,
          enableBlockchainPayments: false,
        };
        return experimentalFlags[flag as keyof typeof experimentalFlags] || false;
      });
    });

    it('should return experimental feature flags', () => {
      const { result } = renderHook(() => useExperimentalFeatureFlags());

      expect(result.current.enableAITranslations).toBe(false);
      expect(result.current.enableVoiceCommands).toBe(true);
      expect(result.current.enableARMode).toBe(false);
      expect(result.current.enableBlockchainPayments).toBe(false);
    });
  });
});
