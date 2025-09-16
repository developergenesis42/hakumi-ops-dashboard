import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Login using test admin credentials
   */
  async login() {
    const loginButton = this.page.getByText('🧪 Test Admin Login').first();
    await loginButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Set up roster with specified therapists
   */
  async setupRoster(therapistNames: string[] = ['Ally']) {
    for (const name of therapistNames) {
      const searchInput = this.page.getByPlaceholder('Search therapists...');
      await searchInput.fill(name);
      await this.page.waitForTimeout(1000);
      
      const therapistButton = this.page.locator('[data-testid="therapist-button"]').first();
      if (await therapistButton.isVisible()) {
        await therapistButton.click();
      }
    }
  }

  /**
   * Start the day from roster setup
   */
  async startDay() {
    const startDayButton = this.page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Complete setup: login, roster, and start day
   */
  async completeSetup(therapistNames: string[] = ['Ally']) {
    await this.login();
    await this.setupRoster(therapistNames);
    await this.startDay();
  }

  /**
   * Create a session with specified parameters
   */
  async createSession(options: {
    serviceCategory?: string;
    servicePackage?: string;
    room?: string;
    discount?: number;
    therapist?: string;
  } = {}) {
    const {
      serviceCategory = 'single',
      servicePackage = '60.*min',
      room = 'shower',
      discount
    } = options;

    const createSessionButton = this.page.getByText(/new session|create session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Select service category
      const serviceCategoryButton = this.page.getByText(new RegExp(serviceCategory, 'i')).first();
      if (await serviceCategoryButton.isVisible()) {
        await serviceCategoryButton.click();
      }
      
      // Select service package
      const servicePackageButton = this.page.getByText(new RegExp(servicePackage, 'i')).first();
      if (await servicePackageButton.isVisible()) {
        await servicePackageButton.click();
      }
      
      // Select room
      const roomButton = this.page.getByText(new RegExp(room, 'i')).first();
      if (await roomButton.isVisible()) {
        await roomButton.click();
      }
      
      // Apply discount if specified
      if (discount !== undefined) {
        const discountInput = this.page.getByPlaceholder(/discount|amount/i).first();
        if (await discountInput.isVisible()) {
          await discountInput.fill(discount.toString());
        }
      }
      
      // Confirm session
      const confirmButton = this.page.getByText(/confirm|start/i).first();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
    }
  }

  /**
   * Complete a session
   */
  async completeSession() {
    const completeButton = this.page.getByText(/complete|finish/i).first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Navigate to closing out/summary page
   */
  async navigateToClosingOut() {
    const summaryButton = this.page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Navigate back to roster setup
   */
  async navigateToRosterSetup() {
    const rosterButton = this.page.getByText(/roster.*setup/i).first();
    await rosterButton.click();
    await this.page.waitForTimeout(2000);
  }

  /**
   * Add walk-out with specified parameters
   */
  async addWalkOut(options: {
    count: number;
    reason?: string;
  }) {
    const { count, reason = 'No Rooms' } = options;
    
    const walkOutInput = this.page.getByPlaceholder(/walk.*out.*count/i).first();
    if (await walkOutInput.isVisible()) {
      await walkOutInput.fill(count.toString());
      
      // Select reason
      const reasonSelect = this.page.getByText(new RegExp(reason, 'i')).first();
      if (await reasonSelect.isVisible()) {
        await reasonSelect.click();
      }
      
      // Add walk-out
      const addButton = this.page.getByText(/add.*walk.*out/i).first();
      if (await addButton.isVisible()) {
        await addButton.click();
      }
    }
  }

  /**
   * Use undo functionality
   */
  async undo() {
    const undoButton = this.page.getByTitle(/undo/i).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
      
      // Handle undo confirmation if needed
      const warningModal = this.page.getByText(/undo.*warning|confirm.*undo/i);
      if (await warningModal.isVisible()) {
        const confirmButton = this.page.getByText(/confirm|yes/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  }

  /**
   * Wait for element to be visible with timeout
   */
  async waitForElement(selector: string, timeout: number = 5000) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Wait for text to be visible
   */
  async waitForText(text: string | RegExp, timeout: number = 5000) {
    await this.page.waitForSelector(`text=${text}`, { timeout });
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get element count
   */
  async getElementCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Clear all application data
   */
  async clearData() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Simulate network conditions
   */
  async simulateNetwork(condition: 'online' | 'offline' | 'slow') {
    if (condition === 'offline') {
      await this.page.context().setOffline(true);
    } else if (condition === 'online') {
      await this.page.context().setOffline(false);
    } else if (condition === 'slow') {
      await this.page.route('**/*', route => {
        setTimeout(() => route.continue(), 1000);
      });
    }
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Check for console errors
   */
  async getConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
  }

  /**
   * Check accessibility
   */
  async checkAccessibility() {
    const accessibilityTree = await this.page.accessibility.snapshot();
    return {
      hasHeadings: accessibilityTree?.children?.filter((child: { role: string }) => 
        child.role === 'heading'
      ) || [],
      hasMainLandmark: accessibilityTree?.children?.find((child: { role: string }) => 
        child.role === 'main'
      ),
      hasButtons: accessibilityTree?.children?.filter((child: { role: string }) => 
        child.role === 'button'
      ) || []
    };
  }

  /**
   * Verify page title and basic elements
   */
  async verifyPageStructure() {
    await expect(this.page.getByText('Hakumi Nuru Massage')).toBeVisible();
    await expect(this.page.locator('main, [role="main"]')).toBeVisible();
  }

  /**
   * Handle dialog boxes
   */
  async handleDialog(action: 'accept' | 'dismiss' = 'accept') {
    this.page.on('dialog', dialog => {
      if (action === 'accept') {
        dialog.accept();
      } else {
        dialog.dismiss();
      }
    });
  }

  /**
   * Wait for network to be idle
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Type with delay to simulate human typing
   */
  async typeWithDelay(selector: string, text: string, delay: number = 100) {
    await this.page.locator(selector).type(text, { delay });
  }

  /**
   * Wait for animation to complete
   */
  async waitForAnimation(selector: string) {
    await this.page.locator(selector).waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500); // Additional buffer for animations
  }
}

/**
 * Factory function to create TestHelpers instance
 */
export function createTestHelpers(page: Page): TestHelpers {
  return new TestHelpers(page);
}

/**
 * Common test data
 */
export const testData = {
  therapists: ['Ally', 'Alice', 'Amy', 'Anna', 'Aria'],
  services: {
    single: ['60 min', '90 min', '120 min'],
    double: ['60 min', '90 min', '120 min'],
    couple: ['60 min', '90 min', '120 min']
  },
  rooms: {
    shower: ['Shower 1', 'Shower 2', 'Shower 3'],
    vip: ['VIP 1', 'VIP 2'],
    jacuzzi: ['Jacuzzi 1', 'Jacuzzi 2']
  },
  walkOutReasons: ['No Rooms', 'Customer Left', 'Emergency', 'Technical Issue'],
  discountRanges: [0, 10, 20, 30, 50]
};

/**
 * Common assertions
 */
export const assertions = {
  async shouldBeVisible(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeVisible();
  },

  async shouldNotBeVisible(page: Page, selector: string) {
    await expect(page.locator(selector)).not.toBeVisible();
  },

  async shouldHaveText(page: Page, selector: string, text: string | RegExp) {
    await expect(page.locator(selector)).toContainText(text);
  },

  async shouldHaveValue(page: Page, selector: string, value: string) {
    await expect(page.locator(selector)).toHaveValue(value);
  },

  async shouldBeEnabled(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeEnabled();
  },

  async shouldBeDisabled(page: Page, selector: string) {
    await expect(page.locator(selector)).toBeDisabled();
  }
};
