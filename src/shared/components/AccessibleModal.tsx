/**
 * Accessible Modal Component
 * WCAG 2.1 AA compliant modal with proper focus management and ARIA attributes
 */

import React, { useEffect, useRef, useCallback, ReactNode } from 'react';
import { focusManagement, ariaUtils, keyboardNavigation } from '@/utils/accessibility';
import AccessibleButton from '@/shared/components/AccessibleButton';

export interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}

const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  ariaLabel,
  ariaDescribedBy,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const cleanupFocusTrapRef = useRef<(() => void) | null>(null);

  // Generate unique IDs for ARIA attributes
  const modalId = React.useMemo(() => ariaUtils.generateId('modal'), []);
  const titleId = React.useMemo(() => ariaUtils.generateId('modal-title'), []);
  const contentId = React.useMemo(() => ariaUtils.generateId('modal-content'), []);

  // Handle escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === keyboardNavigation.KEYS.ESCAPE) {
        onClose();
      }
    },
    [closeOnEscape, onClose]
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  // Setup modal when opened
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = focusManagement.saveFocus();

      // Add escape key listener
      document.addEventListener('keydown', handleKeyDown);

      // Announce modal opening
      ariaUtils.announce(`Modal opened: ${title}`, 'assertive');

      // Setup focus trap after a short delay to ensure modal is rendered
      const timer = setTimeout(() => {
        if (modalRef.current) {
          cleanupFocusTrapRef.current = focusManagement.trapFocus(modalRef.current);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      // Cleanup focus trap
      if (cleanupFocusTrapRef.current) {
        cleanupFocusTrapRef.current();
        cleanupFocusTrapRef.current = null;
      }

      // Restore previous focus
      if (previousFocusRef.current) {
        focusManagement.restoreFocus(previousFocusRef.current);
        previousFocusRef.current = null;
      }

      // Announce modal closing
      ariaUtils.announce('Modal closed', 'polite');
    }
  }, [isOpen, title, handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // Build ARIA attributes
  const modalAriaAttributes: Record<string, string> = {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': titleId,
  };

  if (ariaLabel) {
    modalAriaAttributes['aria-label'] = ariaLabel;
  }

  if (ariaDescribedBy) {
    modalAriaAttributes['aria-describedby'] = ariaDescribedBy;
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            relative bg-white rounded-lg shadow-xl
            w-full ${sizeClasses[size]}
            transform transition-all duration-300
            ${className}
          `}
          {...modalAriaAttributes}
          id={modalId}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h2>
            
            {showCloseButton && (
              <AccessibleButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                ariaLabel="Close modal"
                className="ml-4"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </AccessibleButton>
            )}
          </div>

          {/* Content */}
          <div
            id={contentId}
            className="p-6"
            role="document"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessibleModal;
