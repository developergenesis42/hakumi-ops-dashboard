/**
 * Accessibility Checker Component
 * Real-time accessibility testing and reporting tool
 */

import React, { useState, useCallback } from 'react';
import { wcagCompliance } from '@/utils/accessibility';
import AccessibleButton from '@/shared/components/AccessibleButton';
import AccessibleModal from '@/shared/components/AccessibleModal';

export interface AccessibilityIssue {
  element: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
  suggestion: string;
}

export interface AccessibilityReport {
  passed: boolean;
  totalIssues: number;
  errors: number;
  warnings: number;
  issues: AccessibilityIssue[];
  score: number;
}

const AccessibilityChecker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Run accessibility scan
  const runScan = useCallback(async () => {
    setIsScanning(true);
    
    try {
      // Simulate scanning delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const issues: AccessibilityIssue[] = [];
      
      // Check all elements
      const allElements = document.querySelectorAll('*');
      
      allElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        
        // Skip script and style elements
        if (['script', 'style', 'meta', 'link'].includes(htmlElement.tagName.toLowerCase())) {
          return;
        }
        
        // Check text size
        if (htmlElement.textContent?.trim() && !wcagCompliance.checkTextSize(htmlElement)) {
          issues.push({
            element: `${htmlElement.tagName.toLowerCase()}${htmlElement.id ? `#${htmlElement.id}` : ''}`,
            issue: 'Text size below WCAG minimum (16px)',
            severity: 'warning',
            wcagLevel: 'AA',
            suggestion: 'Increase font size to at least 16px for body text',
          });
        }
        
        // Check interactive element size
        if (['button', 'a', 'input', 'select', 'textarea'].includes(htmlElement.tagName.toLowerCase())) {
          if (!wcagCompliance.checkInteractiveElementSize(htmlElement)) {
            issues.push({
              element: `${htmlElement.tagName.toLowerCase()}${htmlElement.id ? `#${htmlElement.id}` : ''}`,
              issue: 'Interactive element below minimum size (44x44px)',
              severity: 'error',
              wcagLevel: 'AA',
              suggestion: 'Increase element size to at least 44x44 pixels',
            });
          }
        }
        
        // Check for missing alt text on images
        if (htmlElement.tagName.toLowerCase() === 'img') {
          const img = htmlElement as HTMLImageElement;
          if (!img.alt && !img.getAttribute('aria-label')) {
            issues.push({
              element: `img${img.id ? `#${img.id}` : ''}`,
              issue: 'Image missing alternative text',
              severity: 'error',
              wcagLevel: 'A',
              suggestion: 'Add alt attribute or aria-label to describe the image',
            });
          }
        }
        
        // Check for missing form labels
        if (htmlElement.tagName.toLowerCase() === 'input') {
          const input = htmlElement as HTMLInputElement;
          if (!input.labels?.length && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
            issues.push({
              element: `input${input.id ? `#${input.id}` : ''}`,
              issue: 'Form input missing label',
              severity: 'error',
              wcagLevel: 'A',
              suggestion: 'Add a label element or aria-label attribute',
            });
          }
        }
        
        // Check for missing button text
        if (htmlElement.tagName.toLowerCase() === 'button') {
          if (!htmlElement.textContent?.trim() && !htmlElement.getAttribute('aria-label')) {
            issues.push({
              element: `button${htmlElement.id ? `#${htmlElement.id}` : ''}`,
              issue: 'Button missing accessible name',
              severity: 'error',
              wcagLevel: 'A',
              suggestion: 'Add text content or aria-label attribute',
            });
          }
        }
        
        // Check for missing heading hierarchy
        if (htmlElement.tagName.match(/^h[1-6]$/)) {
          const level = parseInt(htmlElement.tagName.charAt(1));
          const previousHeading = Array.from(allElements)
            .slice(0, index)
            .reverse()
            .find(el => el.tagName.match(/^h[1-6]$/));
          
          if (previousHeading) {
            const prevLevel = parseInt(previousHeading.tagName.charAt(1));
            if (level > prevLevel + 1) {
              issues.push({
                element: `${htmlElement.tagName.toLowerCase()}${htmlElement.id ? `#${htmlElement.id}` : ''}`,
                issue: 'Heading hierarchy skipped',
                severity: 'warning',
                wcagLevel: 'AA',
                suggestion: 'Use proper heading hierarchy (h1, h2, h3, etc.)',
              });
            }
          }
        }
      });
      
      // Calculate report
      const errors = issues.filter(issue => issue.severity === 'error').length;
      const warnings = issues.filter(issue => issue.severity === 'warning').length;
      const totalIssues = issues.length;
      const score = Math.max(0, 100 - (errors * 10) - (warnings * 5));
      
      const accessibilityReport: AccessibilityReport = {
        passed: totalIssues === 0,
        totalIssues,
        errors,
        warnings,
        issues,
        score,
      };
      
      setReport(accessibilityReport);
    } catch (error) {
      console.error('Accessibility scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Open checker and run scan
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    runScan();
  }, [runScan]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get WCAG level color
  const getWCAGLevelColor = (level: string) => {
    switch (level) {
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'AA':
        return 'bg-yellow-100 text-yellow-800';
      case 'AAA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <AccessibleButton
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        ariaLabel="Open accessibility checker"
        className="fixed bottom-4 left-4 z-40"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="ml-2 hidden sm:inline">A11y</span>
      </AccessibleButton>

      {/* Modal */}
      <AccessibleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Accessibility Checker"
        size="xl"
        ariaLabel="Accessibility testing results"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                WCAG 2.1 Compliance Report
              </h3>
              <p className="text-sm text-gray-500">
                Real-time accessibility testing results
              </p>
            </div>
            
            <div className="flex space-x-2">
              <AccessibleButton
                variant="secondary"
                size="sm"
                onClick={runScan}
                loading={isScanning}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning...' : 'Re-scan'}
              </AccessibleButton>
              
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </AccessibleButton>
            </div>
          </div>

          {/* Summary */}
          {report && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{report.score}</div>
                <div className="text-sm text-gray-500">Accessibility Score</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-red-600">{report.errors}</div>
                <div className="text-sm text-gray-500">Errors</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">{report.warnings}</div>
                <div className="text-sm text-gray-500">Warnings</div>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{report.totalIssues}</div>
                <div className="text-sm text-gray-500">Total Issues</div>
              </div>
            </div>
          )}

          {/* Issues List */}
          {report && showDetails && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">Issues Found</h4>
              
              {report.issues.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-4xl mb-2">✓</div>
                  <p className="text-gray-600">No accessibility issues found!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {report.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-sm">
                              {issue.element}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWCAGLevelColor(issue.wcagLevel)}`}>
                              WCAG {issue.wcagLevel}
                            </span>
                          </div>
                          
                          <p className="text-sm font-medium mb-1">
                            {issue.issue}
                          </p>
                          
                          <p className="text-sm opacity-75">
                            {issue.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-500">
              <p>
                This accessibility checker provides basic WCAG 2.1 compliance testing. 
                For comprehensive accessibility auditing, consider using professional tools 
                like axe-core, WAVE, or Lighthouse.
              </p>
            </div>
          </div>
        </div>
      </AccessibleModal>
    </>
  );
};

export default AccessibilityChecker;
