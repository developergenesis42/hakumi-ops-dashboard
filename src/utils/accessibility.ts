/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliance utilities and helpers
 */

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance of a color
   */
  getLuminance: (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = colorContrast.getLuminance(...color1);
    const lum2 = colorContrast.getLuminance(...color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * Check if contrast ratio meets WCAG AA standards
   */
  meetsWCAGAA: (color1: [number, number, number], color2: [number, number, number]): boolean => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    return ratio >= 4.5; // WCAG AA standard for normal text
  },

  /**
   * Check if contrast ratio meets WCAG AAA standards
   */
  meetsWCAGAAA: (color1: [number, number, number], color2: [number, number, number]): boolean => {
    const ratio = colorContrast.getContrastRatio(color1, color2);
    return ratio >= 7; // WCAG AAA standard for normal text
  },
};

/**
 * Keyboard navigation utilities
 */
export const keyboardNavigation = {
  /**
   * Standard keyboard navigation keys
   */
  KEYS: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
  },

  /**
   * Check if key is a navigation key
   */
  isNavigationKey: (key: string): boolean => {
    return Object.values(keyboardNavigation.KEYS).includes(key);
  },

  /**
   * Handle arrow key navigation for lists
   */
  handleArrowNavigation: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    orientation: 'horizontal' | 'vertical' = 'vertical'
  ): number | null => {
    const { ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END } = keyboardNavigation.KEYS;

    switch (event.key) {
      case orientation === 'vertical' ? ARROW_UP : ARROW_LEFT:
        event.preventDefault();
        return currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      
      case orientation === 'vertical' ? ARROW_DOWN : ARROW_RIGHT:
        event.preventDefault();
        return currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      
      case HOME:
        event.preventDefault();
        return 0;
      
      case END:
        event.preventDefault();
        return totalItems - 1;
      
      default:
        return null;
    }
  },
};

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   */
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = focusManagement.getFocusableElements(element);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === keyboardNavigation.KEYS.TAB) {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
  },

  /**
   * Restore focus to a previously focused element
   */
  restoreFocus: (element: HTMLElement | null): void => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  },

  /**
   * Save current focus for later restoration
   */
  saveFocus: (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  },
};

/**
 * ARIA utilities
 */
export const ariaUtils = {
  /**
   * Generate unique ID for ARIA attributes
   */
  generateId: (prefix: string = 'aria'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Set ARIA attributes on an element
   */
  setAriaAttributes: (element: HTMLElement, attributes: Record<string, string | boolean>): void => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        element.setAttribute(key, value.toString());
      } else {
        element.setAttribute(key, value);
      }
    });
  },

  /**
   * Announce message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Create ARIA live region for dynamic content
   */
  createLiveRegion: (priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    return liveRegion;
  },
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Hide element from screen readers
   */
  hideFromScreenReader: (element: HTMLElement): void => {
    element.setAttribute('aria-hidden', 'true');
  },

  /**
   * Show element to screen readers
   */
  showToScreenReader: (element: HTMLElement): void => {
    element.removeAttribute('aria-hidden');
  },

  /**
   * Check if element is hidden from screen readers
   */
  isHiddenFromScreenReader: (element: HTMLElement): boolean => {
    return element.getAttribute('aria-hidden') === 'true';
  },
};

/**
 * Form accessibility utilities
 */
export const formAccessibility = {
  /**
   * Associate label with form control
   */
  associateLabel: (label: HTMLLabelElement, control: HTMLElement): void => {
    const id = control.id || ariaUtils.generateId('form-control');
    control.id = id;
    label.setAttribute('for', id);
  },

  /**
   * Create accessible error message
   */
  createErrorMessage: (control: HTMLElement, message: string): HTMLElement => {
    const errorId = ariaUtils.generateId('error');
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'text-red-600 text-sm mt-1';
    errorElement.setAttribute('role', 'alert');
    errorElement.setAttribute('aria-live', 'polite');
    errorElement.textContent = message;

    control.setAttribute('aria-describedby', errorId);
    control.setAttribute('aria-invalid', 'true');

    return errorElement;
  },

  /**
   * Remove error message and restore control state
   */
  removeErrorMessage: (control: HTMLElement): void => {
    const errorId = control.getAttribute('aria-describedby');
    if (errorId) {
      const errorElement = document.getElementById(errorId);
      if (errorElement) {
        errorElement.remove();
      }
      control.removeAttribute('aria-describedby');
      control.removeAttribute('aria-invalid');
    }
  },
};

/**
 * Animation and motion utilities
 */
export const motionAccessibility = {
  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Apply reduced motion styles
   */
  applyReducedMotion: (element: HTMLElement): void => {
    if (motionAccessibility.prefersReducedMotion()) {
      element.style.animation = 'none';
      element.style.transition = 'none';
    }
  },

  /**
   * Create motion-safe animation
   */
  createMotionSafeAnimation: (element: HTMLElement, animation: string): void => {
    if (!motionAccessibility.prefersReducedMotion()) {
      element.style.animation = animation;
    }
  },
};

/**
 * WCAG compliance checker
 */
export const wcagCompliance = {
  /**
   * Check if text size meets WCAG standards
   */
  checkTextSize: (element: HTMLElement): boolean => {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseFloat(computedStyle.fontSize);
    return fontSize >= 16; // Minimum 16px for body text
  },

  /**
   * Check if interactive elements meet minimum size requirements
   */
  checkInteractiveElementSize: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // WCAG minimum touch target size
    return rect.width >= minSize && rect.height >= minSize;
  },

  /**
   * Validate ARIA attributes
   */
  validateAriaAttributes: (element: HTMLElement): string[] => {
    const errors: string[] = [];
    
    // Check for required ARIA attributes
    if (element.getAttribute('role') === 'button' && !element.getAttribute('aria-label') && !element.textContent?.trim()) {
      errors.push('Button without accessible name');
    }
    
    if (element.getAttribute('aria-expanded') && !element.getAttribute('aria-controls')) {
      errors.push('Element with aria-expanded should have aria-controls');
    }
    
    return errors;
  },
};

/**
 * Accessibility testing utilities
 */
export const accessibilityTesting = {
  /**
   * Run basic accessibility checks on an element
   */
  runBasicChecks: (element: HTMLElement): { passed: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    // Check text size
    if (!wcagCompliance.checkTextSize(element)) {
      issues.push('Text size below WCAG minimum');
    }
    
    // Check interactive element size
    if (['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase())) {
      if (!wcagCompliance.checkInteractiveElementSize(element)) {
        issues.push('Interactive element below minimum size');
      }
    }
    
    // Check ARIA attributes
    const ariaIssues = wcagCompliance.validateAriaAttributes(element);
    issues.push(...ariaIssues);
    
    return {
      passed: issues.length === 0,
      issues,
    };
  },

  /**
   * Generate accessibility report for a page
   */
  generateAccessibilityReport: (): { passed: boolean; issues: string[] } => {
    const allElements = document.querySelectorAll('*');
    const allIssues: string[] = [];
    
    allElements.forEach((element) => {
      const { issues } = accessibilityTesting.runBasicChecks(element as HTMLElement);
      allIssues.push(...issues);
    });
    
    return {
      passed: allIssues.length === 0,
      issues: [...new Set(allIssues)], // Remove duplicates
    };
  },
};
