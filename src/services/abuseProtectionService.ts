/**
 * Abuse Protection Service
 * Protects against various types of client-side abuse and suspicious activity
 */

import { logger } from '@/utils/logger';

// Abuse detection patterns
interface AbusePattern {
  name: string;
  threshold: number;
  windowMs: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'log' | 'warn' | 'block' | 'ban';
}

// Abuse event
interface AbuseEvent {
  type: string;
  timestamp: number;
  identifier: string;
  details: Record<string, unknown>;
  severity: string;
  action: string;
  reason?: string;
}

// Abuse protection configuration
interface AbuseProtectionConfig {
  patterns: AbusePattern[];
  globalCooldownMs: number;
  maxEventsPerWindow: number;
  banThreshold: number;
  onAbuseDetected: (event: AbuseEvent) => void;
}

// Default abuse patterns
const DEFAULT_ABUSE_PATTERNS: AbusePattern[] = [
  // Rapid clicking/button mashing
  {
    name: 'rapid_clicking',
    threshold: 20,
    windowMs: 5000, // 5 seconds
    severity: 'medium',
    action: 'warn'
  },
  
  // Excessive form submissions
  {
    name: 'form_spam',
    threshold: 10,
    windowMs: 60000, // 1 minute
    severity: 'high',
    action: 'block'
  },
  
  // Suspicious navigation patterns
  {
    name: 'navigation_abuse',
    threshold: 50,
    windowMs: 60000, // 1 minute
    severity: 'medium',
    action: 'warn'
  },
  
  // API call abuse
  {
    name: 'api_abuse',
    threshold: 100,
    windowMs: 60000, // 1 minute
    severity: 'high',
    action: 'block'
  },
  
  // Session manipulation attempts
  {
    name: 'session_manipulation',
    threshold: 5,
    windowMs: 300000, // 5 minutes
    severity: 'critical',
    action: 'ban'
  },
  
  // Input validation bypass attempts
  {
    name: 'validation_bypass',
    threshold: 10,
    windowMs: 300000, // 5 minutes
    severity: 'high',
    action: 'block'
  },
  
  // DOM manipulation attempts
  {
    name: 'dom_manipulation',
    threshold: 20,
    windowMs: 60000, // 1 minute
    severity: 'medium',
    action: 'warn'
  }
];

// Abuse protection service class
export class AbuseProtectionService {
  private config: AbuseProtectionConfig;
  private eventHistory: Map<string, AbuseEvent[]> = new Map();
  private blockedIdentifiers: Set<string> = new Set();
  private bannedIdentifiers: Set<string> = new Set();
  private cooldowns: Map<string, number> = new Map();
  private eventListeners: (() => void)[] = [];

  constructor(config?: Partial<AbuseProtectionConfig>) {
    this.config = {
      patterns: DEFAULT_ABUSE_PATTERNS,
      globalCooldownMs: 1000, // 1 second global cooldown
      maxEventsPerWindow: 1000,
      banThreshold: 10,
      onAbuseDetected: (event) => {
        logger.warn('Abuse detected', event);
      },
      ...config
    };

    this.initializeProtection();
    logger.info('Abuse protection service initialized');
  }

  /**
   * Initialize protection mechanisms
   */
  private initializeProtection(): void {
    this.setupEventListeners();
    this.setupPeriodicCleanup();
  }

  /**
   * Setup event listeners for abuse detection
   */
  private setupEventListeners(): void {
    // Monitor rapid clicking
    let clickCount = 0;
    let clickWindow = Date.now();
    
    const clickHandler = (event: MouseEvent) => {
      const now = Date.now();
      const identifier = this.getEventIdentifier(event);
      
      if (now - clickWindow > 5000) {
        clickCount = 0;
        clickWindow = now;
      }
      
      clickCount++;
      
      if (clickCount > 20) {
        this.recordAbuseEvent('rapid_clicking', identifier, {
          clickCount,
          target: event.target,
          timestamp: now
        });
      }
    };

    // Monitor form submissions
    const formHandler = (event: SubmitEvent) => {
      const identifier = this.getEventIdentifier(event);
      this.recordAbuseEvent('form_spam', identifier, {
        form: event.target,
        timestamp: Date.now()
      });
    };

    // Monitor navigation changes
    const navigationHandler = () => {
      const identifier = this.getCurrentIdentifier();
      this.recordAbuseEvent('navigation_abuse', identifier, {
        url: window.location.href,
        timestamp: Date.now()
      });
    };

    // Monitor API calls (if fetch is available)
    if (typeof fetch !== 'undefined') {
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const identifier = this.getCurrentIdentifier();
        this.recordAbuseEvent('api_abuse', identifier, {
          url: args[0],
          method: args[1]?.method || 'GET',
          timestamp: Date.now()
        });
        
        return originalFetch.apply(window, args);
      };
    }

    // Monitor DOM modifications
    const observer = new MutationObserver((mutations) => {
      const identifier = this.getCurrentIdentifier();
      this.recordAbuseEvent('dom_manipulation', identifier, {
        mutationCount: mutations.length,
        timestamp: Date.now()
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Add event listeners
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('submit', formHandler, true);
    window.addEventListener('popstate', navigationHandler);
    window.addEventListener('hashchange', navigationHandler);

    // Store cleanup functions
    this.eventListeners.push(() => {
      document.removeEventListener('click', clickHandler, true);
      document.removeEventListener('submit', formHandler, true);
      window.removeEventListener('popstate', navigationHandler);
      window.removeEventListener('hashchange', navigationHandler);
      observer.disconnect();
    });
  }

  /**
   * Setup periodic cleanup
   */
  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60000); // Cleanup every minute
  }

  /**
   * Record abuse event
   */
  recordAbuseEvent(type: string, identifier: string, details: Record<string, unknown>): void {
    // Check if identifier is banned
    if (this.bannedIdentifiers.has(identifier)) {
      return;
    }

    // Check global cooldown
    const now = Date.now();
    const lastEvent = this.cooldowns.get(identifier);
    if (lastEvent && now - lastEvent < this.config.globalCooldownMs) {
      return;
    }

    // Record event
    const event: AbuseEvent = {
      type,
      timestamp: now,
      identifier,
      details,
      severity: 'low',
      action: 'log'
    };

    // Store event
    if (!this.eventHistory.has(identifier)) {
      this.eventHistory.set(identifier, []);
    }
    
    const events = this.eventHistory.get(identifier)!;
    events.push(event);

    // Check for abuse patterns
    this.checkAbusePatterns(identifier, events);

    // Update cooldown
    this.cooldowns.set(identifier, now);
  }

  /**
   * Check for abuse patterns
   */
  private checkAbusePatterns(identifier: string, events: AbuseEvent[]): void {
    const now = Date.now();

    for (const pattern of this.config.patterns) {
      const recentEvents = events.filter(
        e => e.type === pattern.name && 
             now - e.timestamp <= pattern.windowMs
      );

      if (recentEvents.length >= pattern.threshold) {
        // Abuse pattern detected
        const abuseEvent: AbuseEvent = {
          type: `${pattern.name}_abuse`,
          timestamp: now,
          identifier,
          details: {
            pattern: pattern.name,
            eventCount: recentEvents.length,
            threshold: pattern.threshold,
            windowMs: pattern.windowMs
          },
          severity: pattern.severity,
          action: pattern.action
        };

        this.handleAbuseAction(abuseEvent);
      }
    }

    // Check for ban threshold
    const abuseEvents = events.filter(e => e.action === 'block' || e.action === 'ban');
    if (abuseEvents.length >= this.config.banThreshold) {
      // Create a synthetic event for the ban
      const banEvent: AbuseEvent = {
        type: 'ban_threshold_exceeded',
        identifier,
        action: 'ban',
        timestamp: Date.now(),
        details: { reason: 'Exceeded ban threshold' },
        severity: 'high',
        reason: 'Exceeded ban threshold'
      };
      this.banIdentifier(identifier, banEvent);
    }
  }

  /**
   * Handle abuse action
   */
  private handleAbuseAction(event: AbuseEvent): void {
    switch (event.action) {
      case 'warn':
        this.warnIdentifier(event.identifier, event);
        break;
      case 'block':
        this.blockIdentifier(event.identifier, event);
        break;
      case 'ban':
        this.banIdentifier(event.identifier, event);
        break;
    }

    this.config.onAbuseDetected(event);
  }

  /**
   * Warn identifier
   */
  private warnIdentifier(identifier: string, event: AbuseEvent): void {
    logger.warn('Abuse warning issued', { identifier, event });
    
    // Show warning to user
    this.showUserWarning('Suspicious activity detected. Please slow down your interactions.');
  }

  /**
   * Block identifier
   */
  private blockIdentifier(identifier: string, event: AbuseEvent): void {
    this.blockedIdentifiers.add(identifier);
    logger.warn('Identifier blocked for abuse', { identifier, event });
    
    // Show blocking message
    this.showUserWarning('Your access has been temporarily restricted due to suspicious activity.');
    
    // Set temporary block (unblock after 5 minutes)
    setTimeout(() => {
      this.blockedIdentifiers.delete(identifier);
      logger.info('Identifier unblocked', { identifier });
    }, 5 * 60 * 1000);
  }

  /**
   * Ban identifier
   */
  private banIdentifier(identifier: string, event: AbuseEvent): void {
    this.bannedIdentifiers.add(identifier);
    logger.error('Identifier banned for severe abuse', { identifier, event });
    
    // Show ban message
    this.showUserWarning('Your access has been permanently restricted due to severe abuse.');
    
    // Clear all data for this identifier
    this.clearIdentifierData(identifier);
  }

  /**
   * Show warning to user
   */
  private showUserWarning(message: string): void {
    // Create warning element
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 10000;
      max-width: 400px;
      font-family: Arial, sans-serif;
    `;
    warning.textContent = message;

    document.body.appendChild(warning);

    // Remove after 10 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.parentNode.removeChild(warning);
      }
    }, 10000);
  }

  /**
   * Clear data for identifier
   */
  private clearIdentifierData(identifier: string): void {
    this.eventHistory.delete(identifier);
    this.cooldowns.delete(identifier);
    
    // Clear local storage if this is the current user
    if (identifier === this.getCurrentIdentifier()) {
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  /**
   * Get event identifier
   */
  private getEventIdentifier(_event?: Event): string { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Try to get user identifier from various sources
    const userAgent = navigator.userAgent;
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Create a fingerprint
    const fingerprint = btoa(`${userAgent}-${screenSize}-${timezone}`).substring(0, 16);
    
    return fingerprint;
  }

  /**
   * Get current identifier
   */
  private getCurrentIdentifier(): string {
    // Try to get from auth context or create fingerprint
    return this.getEventIdentifier(new Event('dummy'));
  }

  /**
   * Check if identifier is blocked
   */
  isBlocked(identifier?: string): boolean {
    const id = identifier || this.getCurrentIdentifier();
    return this.blockedIdentifiers.has(id) || this.bannedIdentifiers.has(id);
  }

  /**
   * Check if identifier is banned
   */
  isBanned(identifier?: string): boolean {
    const id = identifier || this.getCurrentIdentifier();
    return this.bannedIdentifiers.has(id);
  }

  /**
   * Get abuse statistics
   */
  getAbuseStats(): {
    totalEvents: number;
    blockedCount: number;
    bannedCount: number;
    eventsByType: Record<string, number>;
  } {
    let totalEvents = 0;
    const eventsByType: Record<string, number> = {};

    for (const events of this.eventHistory.values()) {
      totalEvents += events.length;
      
      for (const event of events) {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      }
    }

    return {
      totalEvents,
      blockedCount: this.blockedIdentifiers.size,
      bannedCount: this.bannedIdentifiers.size,
      eventsByType
    };
  }

  /**
   * Cleanup old events
   */
  private cleanupOldEvents(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [identifier, events] of this.eventHistory.entries()) {
      const recentEvents = events.filter(e => now - e.timestamp <= maxAge);
      
      if (recentEvents.length === 0) {
        this.eventHistory.delete(identifier);
      } else {
        this.eventHistory.set(identifier, recentEvents);
      }
    }

    // Cleanup old cooldowns
    for (const [identifier, timestamp] of this.cooldowns.entries()) {
      if (now - timestamp > maxAge) {
        this.cooldowns.delete(identifier);
      }
    }
  }

  /**
   * Reset protection for identifier
   */
  resetProtection(identifier?: string): void {
    const id = identifier || this.getCurrentIdentifier();
    
    this.eventHistory.delete(id);
    this.cooldowns.delete(id);
    this.blockedIdentifiers.delete(id);
    this.bannedIdentifiers.delete(id);
    
    logger.info('Protection reset for identifier', { identifier: id });
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.eventListeners.forEach(cleanup => cleanup());
    this.eventListeners = [];
    this.eventHistory.clear();
    this.blockedIdentifiers.clear();
    this.bannedIdentifiers.clear();
    this.cooldowns.clear();
    
    logger.info('Abuse protection service destroyed');
  }
}

// Global abuse protection instance
export const abuseProtection = new AbuseProtectionService({
  onAbuseDetected: (event) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Abuse detected:', event);
    }
    
    // In production, you might want to send this to a monitoring service
    logger.error('Abuse detected', event);
  }
});

// Utility functions
export function isAbuseProtected(): boolean {
  return !abuseProtection.isBlocked();
}

export function checkAbuseProtection(): void {
  if (abuseProtection.isBanned()) {
    throw new Error('Access denied due to abuse protection');
  }
  
  if (abuseProtection.isBlocked()) {
    throw new Error('Access temporarily restricted due to abuse protection');
  }
}

// React hook for abuse protection
export function useAbuseProtection() {
  return {
    isBlocked: () => abuseProtection.isBlocked(),
    isBanned: () => abuseProtection.isBanned(),
    getStats: () => abuseProtection.getAbuseStats(),
    reset: () => abuseProtection.resetProtection(),
    checkProtection: checkAbuseProtection
  };
}
