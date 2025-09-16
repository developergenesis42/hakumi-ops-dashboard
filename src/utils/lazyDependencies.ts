/**
 * Lazy Dependencies
 * Lazy load heavy dependencies to reduce initial bundle size
 */

// Lazy load PDF generation dependencies
export const lazyLoadPDFDependencies = async () => {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  
  return { jsPDF, html2canvas };
};

// Lazy load monitoring dependencies
export const lazyLoadMonitoringDependencies = async () => {
  const [Sentry] = await Promise.all([
    import('@sentry/react')
  ]);
  
  return { Sentry };
};

// Lazy load print service
export const lazyLoadPrintService = async () => {
  const { printNodeService } = await import('@/services/printNodeService');
  return printNodeService;
};

// Lazy load monitoring utilities
export const lazyLoadMonitoringUtils = async () => {
  const { initializeMonitoring, performanceMonitoring, errorTracking } = await import('@/config/monitoring');
  return { initializeMonitoring, performanceMonitoring, errorTracking };
};
