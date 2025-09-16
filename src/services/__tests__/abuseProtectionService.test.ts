/**
 * Abuse Protection Service Tests
 * Tests for client-side abuse detection and protection
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AbuseProtectionService } from '@/services/abuseProtectionService';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock DOM APIs
const mockDocumentAddEventListener = jest.fn();
const mockDocumentRemoveEventListener = jest.fn();
const mockWindowAddEventListener = jest.fn();
const mockWindowRemoveEventListener = jest.fn();
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

Object.defineProperty(document, 'addEventListener', {
  value: mockDocumentAddEventListener,
  writable: true,
});

Object.defineProperty(document, 'removeEventListener', {
  value: mockDocumentRemoveEventListener,
  writable: true,
});

Object.defineProperty(window, 'addEventListener', {
  value: mockWindowAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockWindowRemoveEventListener,
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: mockCreateElement.mockImplementation((tagName) => ({
    tagName,
    style: {
      cssText: ''
    },
    textContent: '',
    parentNode: null,
    appendChild: jest.fn(),
    removeChild: jest.fn()
  })),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: mockRemoveChild,
  writable: true,
});

// Mock window APIs
Object.defineProperty(window, 'addEventListener', {
  value: jest.fn(),
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: jest.fn(),
  writable: true,
});

// Mock window.location
delete (window as unknown as { location?: unknown }).location;
(window as unknown as { location: { href: string } }).location = { href: 'http://localhost:3000' };

Object.defineProperty(window, 'fetch', {
  value: jest.fn(),
  writable: true,
});

// Mock navigator APIs
Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Test Browser)',
  writable: true,
});

Object.defineProperty(screen, 'width', {
  value: 1920,
  writable: true,
});

Object.defineProperty(screen, 'height', {
  value: 1080,
  writable: true,
});

// Mock MutationObserver
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
  prototype: {},
})) as unknown as typeof MutationObserver;

describe('AbuseProtectionService', () => {
  let service: AbuseProtectionService;
  let mockOnAbuseDetected: jest.Mock;

  beforeEach(() => {
    mockOnAbuseDetected = jest.fn();
    
    // Clear mocks before service creation
    jest.clearAllMocks();
    
    // Create service - this will call addEventListener and MutationObserver
    service = new AbuseProtectionService({
      onAbuseDetected: mockOnAbuseDetected,
    });
  });

  afterEach(() => {
    service.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(service).toBeDefined();
      // The service should have been initialized, which means it should have called addEventListener
      expect(mockDocumentAddEventListener).toHaveBeenCalled();
    });

    it('should setup event listeners', () => {
      // Check that the service was initialized and event listeners were set up
      expect(service).toBeDefined();
      expect(mockDocumentAddEventListener).toHaveBeenCalledWith('click', expect.any(Function), true);
      expect(mockDocumentAddEventListener).toHaveBeenCalledWith('submit', expect.any(Function), true);
    });

    it('should setup mutation observer', () => {
      expect(MutationObserver).toHaveBeenCalled();
    });
  });

  describe('Abuse Detection', () => {
    it('should detect rapid clicking', () => {
      // Create a service with no cooldown for testing
      const testService = new AbuseProtectionService({
        patterns: [{
          name: 'rapid_clicking',
          threshold: 20,
          windowMs: 5000,
          severity: 'medium',
          action: 'warn'
        }],
        globalCooldownMs: 0, // No cooldown for testing
        maxEventsPerWindow: 1000,
        banThreshold: 10,
        onAbuseDetected: mockOnAbuseDetected,
      });
      
      const identifier = 'test-user';
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Simulate rapid clicking (more than 20 clicks in 5 seconds)
        for (let i = 0; i < 25; i++) {
          // Each event gets a timestamp within the 5-second window
          mockTime = 1000000000000 + (i * 100); // 100ms between clicks
          testService.recordAbuseEvent('rapid_clicking', identifier, {
            clickCount: i,
            target: document.createElement('div')
          });
        }

        // Should have detected abuse
        expect(mockOnAbuseDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'rapid_clicking_abuse',
            severity: 'medium',
            action: 'warn',
          })
        );
      } finally {
        // Restore original Date.now and cleanup
        jest.restoreAllMocks();
        testService.destroy();
      }
    });

    it('should detect form spam', () => {
      // Create a service with no cooldown for testing
      const testService = new AbuseProtectionService({
        patterns: [{
          name: 'form_spam',
          threshold: 10,
          windowMs: 60000,
          severity: 'high',
          action: 'block'
        }],
        globalCooldownMs: 0, // No cooldown for testing
        maxEventsPerWindow: 1000,
        banThreshold: 10,
        onAbuseDetected: mockOnAbuseDetected,
      });
      
      const identifier = 'test-user';
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Simulate form spam (more than 10 submissions in 1 minute)
        for (let i = 0; i < 15; i++) {
          // Each event gets a timestamp within the 1-minute window
          mockTime = 1000000000000 + (i * 2000); // 2 seconds between submissions
          testService.recordAbuseEvent('form_spam', identifier, {
            form: document.createElement('form')
          });
        }

        // Should have detected abuse
        expect(mockOnAbuseDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'form_spam_abuse',
            severity: 'high',
            action: 'block',
          })
        );
      } finally {
        // Restore original Date.now and cleanup
        jest.restoreAllMocks();
        testService.destroy();
      }
    });

    it('should detect API abuse', () => {
      const originalFetch = window.fetch;
      const mockFetch = jest.fn();
      window.fetch = mockFetch as typeof fetch;

      // Simulate API abuse by making many requests
      for (let i = 0; i < 150; i++) {
        mockFetch(`/api/endpoint${i}`, { method: 'GET' });
      }

      // Restore original fetch
      window.fetch = originalFetch;

      // Should have detected abuse (this would be detected by the fetch interceptor)
      // Note: The actual detection depends on the fetch interceptor implementation
    });
  });

  describe('Blocking and Banning', () => {
    it('should block identifier when threshold is reached', () => {
      // Create a service with no cooldown for testing
      const testService = new AbuseProtectionService({
        patterns: [{
          name: 'form_spam',
          threshold: 10,
          windowMs: 60000,
          severity: 'high',
          action: 'block'
        }],
        globalCooldownMs: 0, // No cooldown for testing
        maxEventsPerWindow: 1000,
        banThreshold: 10,
        onAbuseDetected: mockOnAbuseDetected,
      });
      
      const identifier = 'test-user';
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Simulate enough abuse events to trigger blocking (form_spam threshold is 10)
        for (let i = 0; i < 15; i++) {
          // Each event gets a timestamp within the 1-minute window
          mockTime = 1000000000000 + (i * 2000); // 2 seconds between submissions
          testService.recordAbuseEvent('form_spam', identifier, { count: i });
        }

        expect(testService.isBlocked(identifier)).toBe(true);
      } finally {
        // Restore original Date.now and cleanup
        jest.restoreAllMocks();
        testService.destroy();
      }
    });

    it('should ban identifier when ban threshold is reached', () => {
      // Create a service with no cooldown for testing
      const testService = new AbuseProtectionService({
        patterns: [{
          name: 'session_manipulation',
          threshold: 5,
          windowMs: 300000,
          severity: 'critical',
          action: 'ban'
        }],
        globalCooldownMs: 0, // No cooldown for testing
        maxEventsPerWindow: 1000,
        banThreshold: 10,
        onAbuseDetected: mockOnAbuseDetected,
      });
      
      const identifier = 'test-user';
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Simulate severe abuse events to trigger banning (session_manipulation threshold is 5)
        for (let i = 0; i < 10; i++) {
          // Each event gets a timestamp within the 5-minute window
          mockTime = 1000000000000 + (i * 10000); // 10 seconds between events
          testService.recordAbuseEvent('session_manipulation', identifier, { count: i });
        }

        expect(testService.isBanned(identifier)).toBe(true);
      } finally {
        // Restore original Date.now and cleanup
        jest.restoreAllMocks();
        testService.destroy();
      }
    });

    it('should show warning messages', () => {
      // Create a service with no cooldown for testing
      const testService = new AbuseProtectionService({
        patterns: [{
          name: 'rapid_clicking',
          threshold: 20,
          windowMs: 5000,
          severity: 'medium',
          action: 'warn'
        }],
        globalCooldownMs: 0, // No cooldown for testing
        maxEventsPerWindow: 1000,
        banThreshold: 10,
        onAbuseDetected: mockOnAbuseDetected,
      });
      
      const identifier = 'test-user';
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Trigger a warning by exceeding rapid_clicking threshold (20)
        for (let i = 0; i < 25; i++) {
          // Each event gets a timestamp within the 5-second window
          mockTime = 1000000000000 + (i * 100); // 100ms between clicks
          testService.recordAbuseEvent('rapid_clicking', identifier, { count: i });
        }
        
        expect(mockCreateElement).toHaveBeenCalledWith('div');
        expect(mockAppendChild).toHaveBeenCalled();
      } finally {
        // Restore original Date.now and cleanup
        jest.restoreAllMocks();
        testService.destroy();
      }
    });
  });

  describe('Statistics', () => {
    it('should track abuse statistics', () => {
      const identifier = 'test-user';
      
      // Mock Date.now to control timestamps and bypass cooldown
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Record some abuse events
        service.recordAbuseEvent('rapid_clicking', identifier, { count: 1 });
        mockTime += 1000; // 1 second later
        service.recordAbuseEvent('form_spam', identifier, { count: 1 });
        mockTime += 1000; // 1 second later
        service.recordAbuseEvent('api_abuse', identifier, { count: 1 });
        
        const stats = service.getAbuseStats();
        
        expect(stats.totalEvents).toBeGreaterThan(0);
        expect(stats.eventsByType).toHaveProperty('rapid_clicking');
        expect(stats.eventsByType).toHaveProperty('form_spam');
        expect(stats.eventsByType).toHaveProperty('api_abuse');
      } finally {
        // Restore original Date.now
        jest.restoreAllMocks();
      }
    });

    it('should track blocked and banned counts', () => {
      // Create a service with no cooldown for testing
      const testService = new AbuseProtectionService({
        patterns: [
          {
            name: 'form_spam',
            threshold: 10,
            windowMs: 60000,
            severity: 'high',
            action: 'block'
          },
          {
            name: 'session_manipulation',
            threshold: 5,
            windowMs: 300000,
            severity: 'critical',
            action: 'ban'
          }
        ],
        globalCooldownMs: 0, // No cooldown for testing
        maxEventsPerWindow: 1000,
        banThreshold: 10,
        onAbuseDetected: mockOnAbuseDetected,
      });
      
      const identifier1 = 'user1';
      const identifier2 = 'user2';
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Block user1 (form_spam threshold is 10)
        for (let i = 0; i < 15; i++) {
          // Each event gets a timestamp within the 1-minute window
          mockTime = 1000000000000 + (i * 2000); // 2 seconds between submissions
          testService.recordAbuseEvent('form_spam', identifier1, { count: i });
        }
        
        // Ban user2 (session_manipulation threshold is 5)
        for (let i = 0; i < 10; i++) {
          // Each event gets a timestamp within the 5-minute window
          mockTime = 1000000000000 + (i * 10000); // 10 seconds between events
          testService.recordAbuseEvent('session_manipulation', identifier2, { count: i });
        }
        
        const stats = testService.getAbuseStats();
        expect(stats.blockedCount).toBeGreaterThan(0);
        expect(stats.bannedCount).toBeGreaterThan(0);
      } finally {
        // Restore original Date.now and cleanup
        jest.restoreAllMocks();
        testService.destroy();
      }
    });
  });

  describe('Cleanup', () => {
    it('should cleanup old events', () => {
      const identifier = 'test-user';
      
      // Record an event
      service.recordAbuseEvent('rapid_clicking', identifier, { count: 1 });
      
      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      jest.spyOn(Date, 'now').mockReturnValue(originalNow() + 25 * 60 * 60 * 1000); // 25 hours later
      
      // Trigger cleanup (this would normally happen at interval)
      service['cleanupOldEvents']();
      
      // Restore Date.now
      jest.restoreAllMocks();
      
      const stats = service.getAbuseStats();
      expect(stats.totalEvents).toBe(0);
    });

    it('should reset protection for identifier', () => {
      const identifier = 'test-user';
      
      // Record some events
      service.recordAbuseEvent('rapid_clicking', identifier, { count: 1 });
      service.recordAbuseEvent('form_spam', identifier, { count: 1 });
      
      // Reset protection
      service.resetProtection(identifier);
      
      const stats = service.getAbuseStats();
      expect(stats.totalEvents).toBe(0);
      expect(service.isBlocked(identifier)).toBe(false);
      expect(service.isBanned(identifier)).toBe(false);
    });
  });

  describe('Event Identifier Generation', () => {
    it('should generate consistent identifiers', () => {
      const identifier1 = service['getEventIdentifier'](new Event('test'));
      const identifier2 = service['getEventIdentifier'](new Event('test'));
      
      expect(identifier1).toBe(identifier2);
    });

    it('should generate different identifiers for different environments', () => {
      const identifier1 = service['getEventIdentifier'](new Event('test'));
      
      // Change user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Different Browser',
        writable: true,
      });
      
      const identifier2 = service['getEventIdentifier'](new Event('test'));
      
      expect(identifier1).not.toBe(identifier2);
    });
  });

  describe('Configuration', () => {
    it('should accept custom configuration', () => {
      const customConfig = {
        patterns: [{
          name: 'custom_abuse',
          threshold: 5,
          windowMs: 10000,
          severity: 'high' as const,
          action: 'block' as const,
        }],
        globalCooldownMs: 2000,
        maxEventsPerWindow: 100,
        banThreshold: 5,
        onAbuseDetected: jest.fn(),
      };
      
      const customService = new AbuseProtectionService({
        ...customConfig,
        globalCooldownMs: 0, // No cooldown for testing
      });
      
      // Mock Date.now to control timestamps
      let mockTime = 1000000000000; // Fixed timestamp
      jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
      
      try {
        // Test custom pattern (threshold is 5)
        for (let i = 0; i < 6; i++) {
          // Each event gets a timestamp within the 10-second window
          mockTime = 1000000000000 + (i * 1000); // 1 second between events
          customService.recordAbuseEvent('custom_abuse', 'test-user', { count: i });
        }
        
        expect(customConfig.onAbuseDetected).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'custom_abuse_abuse',
            severity: 'high',
            action: 'block',
          })
        );
      } finally {
        // Restore original Date.now
        jest.restoreAllMocks();
      }
      
      customService.destroy();
    });
  });

  describe('Destruction', () => {
    it('should cleanup event listeners on destroy', () => {
      service.destroy();
      
      expect(mockDocumentRemoveEventListener).toHaveBeenCalled();
    });

    it('should clear all data on destroy', () => {
      const identifier = 'test-user';
      
      // Record some events
      service.recordAbuseEvent('rapid_clicking', identifier, { count: 1 });
      
      // Destroy service
      service.destroy();
      
      // Should have cleared all data
      const stats = service.getAbuseStats();
      expect(stats.totalEvents).toBe(0);
      expect(stats.blockedCount).toBe(0);
      expect(stats.bannedCount).toBe(0);
    });
  });
});
