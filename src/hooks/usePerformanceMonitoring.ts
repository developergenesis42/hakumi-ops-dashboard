/**
 * Performance Monitoring Hook
 * React hook for tracking performance metrics and user interactions
 */

import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitoring, errorTracking } from '@/config/monitoring';

export interface PerformanceMetrics {
  componentRenderTime: number;
  apiCallTime: number;
  userInteractionTime: number;
  memoryUsage?: number;
}

export interface UsePerformanceMonitoringOptions {
  componentName: string;
  trackRenders?: boolean;
  trackApiCalls?: boolean;
  trackUserInteractions?: boolean;
  trackMemoryUsage?: boolean;
}

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions) => {
  const {
    componentName,
    trackRenders = true,
    trackApiCalls = true,
    trackUserInteractions = true,
    trackMemoryUsage = false,
  } = options;

  const renderStartTime = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics>({
    componentRenderTime: 0,
    apiCallTime: 0,
    userInteractionTime: 0,
  });

  // Track component render time
  useEffect(() => {
    if (!trackRenders) return;
    
    const startTime = performance.now();
    renderStartTime.current = startTime;
    const currentMetrics = metrics.current;
    
    return () => {
      const renderTime = performance.now() - startTime;
      currentMetrics.componentRenderTime = renderTime;
      
      performanceMonitoring.trackTiming(`${componentName}-render`, startTime);
      
      // Log slow renders
      if (renderTime > 100) {
        performanceMonitoring.trackUserAction('slow-render', componentName, {
          renderTime,
          threshold: 100,
        });
      }
    };
  }, [componentName, trackRenders]);

  // Track memory usage
  useEffect(() => {
    if (!trackMemoryUsage || !('memory' in performance)) return;
    
    const checkMemory = () => {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (memory) {
        metrics.current.memoryUsage = memory.usedJSHeapSize;
        
        // Log high memory usage
        if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          performanceMonitoring.trackUserAction('high-memory-usage', componentName, {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            jsHeapSizeLimit: memory.jsHeapSizeLimit,
          });
        }
      }
    };

    const interval = setInterval(checkMemory, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [componentName, trackMemoryUsage]);

  // Track API calls
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string,
    method: string = 'GET'
  ): Promise<T> => {
    if (!trackApiCalls) {
      return apiCall();
    }

    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      metrics.current.apiCallTime = duration;
      performanceMonitoring.trackApiCall(endpoint, method, duration, 200);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const status = (error as { status?: number })?.status || 500;
      
      performanceMonitoring.trackApiCall(endpoint, method, duration, status);
      errorTracking.captureError(error as Error, {
        component: componentName,
        endpoint,
        method,
        duration,
      });
      
      throw error;
    }
  }, [componentName, trackApiCalls]);

  // Track user interactions
  const trackUserInteraction = useCallback((
    action: string,
    data?: Record<string, unknown>
  ) => {
    if (!trackUserInteractions) return;

    const startTime = performance.now();
    
    performanceMonitoring.trackUserAction(action, componentName, {
      ...data,
      timestamp: startTime,
    });

    return () => {
      const duration = performance.now() - startTime;
      metrics.current.userInteractionTime = duration;
      
      // Log slow interactions
      if (duration > 500) {
        performanceMonitoring.trackUserAction('slow-interaction', componentName, {
          action,
          duration,
          threshold: 500,
        });
      }
    };
  }, [componentName, trackUserInteractions]);

  // Track component mount/unmount
  useEffect(() => {
    performanceMonitoring.trackUserAction('component-mounted', componentName);
    
    // Capture the current metrics at effect time to avoid stale closure
    const currentMetrics = { ...metrics.current };
    
    return () => {
      performanceMonitoring.trackUserAction('component-unmounted', componentName, {
        metrics: currentMetrics,
      });
    };
  }, [componentName]);

  return {
    trackApiCall,
    trackUserInteraction,
    metrics: metrics.current,
  };
};

/**
 * Hook for tracking Web Vitals
 */
export const useWebVitals = () => {
  useEffect(() => {
    // Only track Web Vitals in production or when explicitly enabled
    if (import.meta.env.MODE !== 'production' && !import.meta.env.VITE_ENABLE_WEB_VITALS) {
      return;
    }

    // Web-vitals integration disabled due to version compatibility
    // import('web-vitals').then((webVitals) => {
    //   if (webVitals.getCLS) webVitals.getCLS(performanceMonitoring.trackWebVitals);
    //   if (webVitals.getFID) webVitals.getFID(performanceMonitoring.trackWebVitals);
    //   if (webVitals.getFCP) webVitals.getFCP(performanceMonitoring.trackWebVitals);
    //   if (webVitals.getLCP) webVitals.getLCP(performanceMonitoring.trackWebVitals);
    //   if (webVitals.getTTFB) webVitals.getTTFB(performanceMonitoring.trackWebVitals);
    // }).catch((error) => {
    //   console.warn('Failed to load web-vitals:', error);
    // });
  }, []);
};

/**
 * Hook for tracking route changes
 */
export const useRouteTracking = (routeName: string) => {
  useEffect(() => {
    performanceMonitoring.trackUserAction('route-enter', routeName);
    
    return () => {
      performanceMonitoring.trackUserAction('route-exit', routeName);
    };
  }, [routeName]);
};


/**
 * Hook for tracking data operations
 */
export const useDataTracking = (dataType: string) => {
  const trackDataOperation = useCallback((
    operation: 'create' | 'read' | 'update' | 'delete',
    data?: Record<string, unknown>
  ) => {
    performanceMonitoring.trackUserAction(`data-${operation}`, dataType, data);
  }, [dataType]);

  return { trackDataOperation };
};