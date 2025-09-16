// Mock monitoring for tests
export const performanceMonitoring = {
  startTiming: jest.fn(),
  endTiming: jest.fn(),
  recordMetric: jest.fn(),
  trackEvent: jest.fn(),
  trackUserAction: jest.fn(),
};

export const errorTracking = {
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  captureError: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setContext: jest.fn(),
};

export const analytics = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  group: jest.fn(),
  alias: jest.fn(),
};

export default {
  performanceMonitoring,
  errorTracking,
  analytics,
};
