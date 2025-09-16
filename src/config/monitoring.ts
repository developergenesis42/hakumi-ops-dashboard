// Monitoring and error tracking configuration
export const errorTracking = {
  logError: (error: Error, context?: Record<string, unknown>) => {
    console.error('Error tracked:', error, context);
    // In production, this would send to an error tracking service
  },
  
  captureError: (error: Error, context?: Record<string, unknown>) => {
    console.error('Error captured:', error, context);
    // In production, this would send to an error tracking service
  },
  
  logEvent: (event: string, properties?: Record<string, unknown>) => {
    console.log('Event tracked:', event, properties);
    // In production, this would send to an analytics service
  },
  
  setUser: (userId: string, properties?: Record<string, unknown>) => {
    console.log('User set:', userId, properties);
    // In production, this would set user context for error tracking
  },
};

export const performanceMonitoring = {
  measure: (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`Performance: ${name} took ${end - start} milliseconds`);
  },
  
  mark: (name: string) => {
    performance.mark(name);
  },
  
  measureBetween: (startMark: string, endMark: string, name: string) => {
    performance.measure(name, startMark, endMark);
  },
  
  trackTiming: (name: string, startTime: number) => {
    const endTime = performance.now();
    console.log(`Performance: ${name} took ${endTime - startTime} milliseconds`);
  },
  
  trackUserAction: (action: string, component: string, properties?: Record<string, unknown>) => {
    console.log(`User Action: ${action} in ${component}`, properties);
  },
};

export const initializeMonitoring = () => {
  console.log('Monitoring initialized');
};