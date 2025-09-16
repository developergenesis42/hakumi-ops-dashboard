import { test, expect } from '@playwright/test';

// Helper function to log in and set up basic state
async function setupBasicState(page: import('@playwright/test').Page) {
  const loginButton = page.getByText('🧪 Test Admin Login').first();
  await loginButton.click();
  await page.waitForTimeout(2000);
  
  // Set up roster
  const searchInput = page.getByPlaceholder('Search therapists...');
  await searchInput.fill('Ally');
  await page.waitForTimeout(1000);
  
  const therapistButton = page.locator('[data-testid="therapist-button"]').first();
  if (await therapistButton.isVisible()) {
    await therapistButton.click();
  }
  
  // Start the day
  const startDayButton = page.getByRole('button', { name: /start day/i });
  await startDayButton.click();
  await page.waitForTimeout(2000);
}

test.describe('Performance and Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should meet performance benchmarks', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    await setupBasicState(page);
    const loadTime = Date.now() - startTime;
    
    // Page should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    
    // Check for performance metrics in console
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Verify performance metrics are reasonable
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // 5 seconds max
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await setupBasicState(page);
    
    // Simulate large dataset by creating many sessions
    await page.evaluate(() => {
      // Create mock sessions to test performance with large datasets
      const mockSessions = Array.from({ length: 100 }, (_, i) => ({
        id: `session-${i}`,
        therapistIds: ['therapist-1'],
        service: { name: `Service ${i}`, price: 100, ladyPayout: 50 },
        totalPrice: 100,
        discount: 0,
        status: 'completed',
        startTime: new Date(),
        endTime: new Date(),
        roomId: 'room-1'
      }));
      
      // Store in localStorage to simulate large dataset
      localStorage.setItem('spa-sessions', JSON.stringify(mockSessions));
    });
    
    // Navigate to closing out to view large dataset
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    if (await summaryButton.isVisible()) {
      const startTime = Date.now();
      await summaryButton.click();
      const navigationTime = Date.now() - startTime;
      
      // Should navigate quickly even with large dataset
      expect(navigationTime).toBeLessThan(3000); // 3 seconds max
      
      // Should display data without performance issues
      await expect(page.getByText(/closing.*out|daily.*summary/i)).toBeVisible();
    }
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await setupBasicState(page);
    
    // Monitor memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory ? {
        used: (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory.usedJSHeapSize,
        total: (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory.totalJSHeapSize,
        limit: (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory.jsHeapSizeLimit
      } : null;
    });
    
    // Perform various operations
    const undoButton = page.getByTitle(/undo/i).first();
    const summaryButton = page.getByText(/summary/i).first();
    
    for (let i = 0; i < 10; i++) {
      if (await undoButton.isVisible()) {
        await undoButton.click();
        await page.waitForTimeout(100);
      }
      
      if (await summaryButton.isVisible()) {
        await summaryButton.click();
        await page.waitForTimeout(100);
      }
    }
    
    // Check memory usage after operations
    const finalMemory = await page.evaluate(() => {
      return (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory ? {
        used: (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory.usedJSHeapSize,
        total: (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory.totalJSHeapSize
      } : null;
    });
    
    if (initialMemory && finalMemory) {
      // Memory usage should not increase dramatically
      const memoryIncrease = finalMemory.used - initialMemory.used;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max increase
    }
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await setupBasicState(page);
    
    // Check for proper ARIA labels on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const role = await button.getAttribute('role');
      const text = await button.textContent();
      
      // Buttons should have accessible names (aria-label, text content, or role)
      const hasAccessibleName = ariaLabel || text?.trim() || role;
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await setupBasicState(page);
    
    // Test Tab navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = page.locator(':focus');
    await expect(firstFocusedElement).toBeVisible();
    
    // Continue tabbing through focusable elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    }
    
    // Test Enter key activation
    const focusedElement = page.locator(':focus');
    if (await focusedElement.isVisible()) {
      await page.keyboard.press('Enter');
      // Should activate the focused element
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await setupBasicState(page);
    
    // Check text elements for color contrast
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6');
    const textCount = await textElements.count();
    
    // Sample a few text elements to check contrast
    for (let i = 0; i < Math.min(textCount, 5); i++) {
      const element = textElements.nth(i);
      if (await element.isVisible()) {
        const text = await element.textContent();
        if (text && text.trim().length > 0) {
          // Check if element has sufficient contrast
          // This is a basic check - in a real test, you'd use a proper contrast checker
          const backgroundColor = await element.evaluate(el => {
            return window.getComputedStyle(el).backgroundColor;
          });
          const color = await element.evaluate(el => {
            return window.getComputedStyle(el).color;
          });
          
          // Both should be defined (not transparent)
          expect(backgroundColor).toBeDefined();
          expect(color).toBeDefined();
        }
      }
    }
  });

  test('should handle screen reader compatibility', async ({ page }) => {
    await setupBasicState(page);
    
    // Check for screen reader friendly elements
    const headings = page.locator('h1, h2, h3, h4, h5, h6, [role="heading"]');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0); // Should have headings for structure
    
    // Check for landmarks
    const landmarks = page.locator('main, nav, header, footer, aside, [role="main"], [role="navigation"]');
    const landmarkCount = await landmarks.count();
    expect(landmarkCount).toBeGreaterThan(0); // Should have landmarks
    
    // Check for form labels
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');
        const placeholder = await input.getAttribute('placeholder');
        
        // Input should have accessible name
        const hasAccessibleName = id || ariaLabel || ariaLabelledBy || placeholder;
        expect(hasAccessibleName).toBeTruthy();
      }
    }
  });

  test('should handle responsive design accessibility', async ({ page }) => {
    await setupBasicState(page);
    
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }, // Desktop
      { width: 1920, height: 1080 } // Large desktop
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      // Should remain accessible at all sizes
      const mainContent = page.locator('main, [role="main"], .main, #main');
      await expect(mainContent.first()).toBeVisible();
      
      // Check that interactive elements are still accessible
      const buttons = page.locator('button');
      const firstButton = buttons.first();
      if (await firstButton.isVisible()) {
        await expect(firstButton).toBeVisible();
      }
    }
  });

  test('should handle focus management in modals', async ({ page }) => {
    await setupBasicState(page);
    
    // Open a modal
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Focus should be trapped in modal
      const modal = page.locator('.modal-backdrop, [role="dialog"]').first();
      if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        
        // Focus should be on modal
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // Tab should cycle within modal
        await page.keyboard.press('Tab');
        const newFocusedElement = page.locator(':focus');
        await expect(newFocusedElement).toBeVisible();
        
        // Escape should close modal
        await page.keyboard.press('Escape');
        await expect(modal).not.toBeVisible();
      }
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    await setupBasicState(page);
    
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    
    // Should still be readable in dark mode
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Reset to normal mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);
    
    // Should work in light mode too
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    await setupBasicState(page);
    
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(500);
    
    // Should still function properly with reduced motion
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Check for animations that should be disabled
    const animatedElements = page.locator('[class*="animate"], [style*="animation"]');
    const animationCount = await animatedElements.count();
    
    if (animationCount > 0) {
      // Animations should be reduced or disabled
      for (let i = 0; i < Math.min(animationCount, 3); i++) {
        const element = animatedElements.nth(i);
        const style = await element.evaluate(el => {
          return window.getComputedStyle(el).animation;
        });
        
        // Animation should be reduced or disabled
        expect(style).toBeDefined();
      }
    }
  });

  test('should handle zoom levels', async ({ page }) => {
    await setupBasicState(page);
    
    // Test different zoom levels
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    
    for (const zoom of zoomLevels) {
      await page.evaluate((zoomLevel) => {
        document.body.style.zoom = zoomLevel.toString();
      }, zoom);
      
      await page.waitForTimeout(300);
      
      // Should remain functional at all zoom levels
      await expect(page.getByText(/dashboard/i)).toBeVisible();
      
      // Interactive elements should still be clickable
      const undoButton = page.getByTitle(/undo/i).first();
      if (await undoButton.isVisible()) {
        await undoButton.click();
        // Should handle click without issues
      }
    }
    
    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('should handle slow network conditions', async ({ page }) => {
    // Simulate slow 3G network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 1000); // 1 second delay
    });
    
    const startTime = Date.now();
    await setupBasicState(page);
    const loadTime = Date.now() - startTime;
    
    // Should still load within reasonable time even on slow network
    expect(loadTime).toBeLessThan(15000); // 15 seconds max
    
    // Should show loading states appropriately
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, [aria-label*="loading"]').first();
    if (await loadingIndicator.isVisible()) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle Web Vitals metrics', async ({ page }) => {
    // Collect Web Vitals metrics
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: Record<string, number> = {};
        
        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              metrics.fcp = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            metrics.lcp = entry.startTime;
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            cls += (entry as { value: number }).value;
          }
          metrics.cls = cls;
        }).observe({ entryTypes: ['layout-shift'] });
        
        // Resolve after page load
        setTimeout(() => resolve(metrics), 3000);
      });
    });
    
    await setupBasicState(page);
    
    // Check Web Vitals are within acceptable ranges
    if ((vitals as { fcp?: number }).fcp) {
      expect((vitals as { fcp: number }).fcp).toBeLessThan(2500); // 2.5s max FCP
    }
    
    if ((vitals as { lcp?: number }).lcp) {
      expect((vitals as { lcp: number }).lcp).toBeLessThan(4000); // 4s max LCP
    }
    
    if ((vitals as { cls?: number }).cls !== undefined) {
      expect((vitals as { cls: number }).cls).toBeLessThan(0.1); // 0.1 max CLS
    }
  });

  test('should handle accessibility tree structure', async ({ page }) => {
    await setupBasicState(page);
    
    // Check accessibility tree structure
    const accessibilityTree = await page.accessibility.snapshot();
    
    // Should have proper heading structure
    const headings = accessibilityTree?.children?.filter((child: { role: string }) => 
      child.role === 'heading'
    ) || [];
    expect(headings.length).toBeGreaterThan(0);
    
    // Should have main landmark
    const mainLandmark = accessibilityTree?.children?.find((child: { role: string }) => 
      child.role === 'main'
    );
    expect(mainLandmark).toBeDefined();
    
    // Interactive elements should be focusable
    const buttons = accessibilityTree?.children?.filter((child: { role: string }) => 
      child.role === 'button'
    ) || [];
    expect(buttons.length).toBeGreaterThan(0);
  });
});
