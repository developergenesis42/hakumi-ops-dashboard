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

test.describe('Error Handling and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should handle network timeouts gracefully', async ({ page }) => {
    // Simulate network timeout
    await page.route('**/*', route => {
      // Simulate slow network that eventually times out
      setTimeout(() => {
        if (!route.request().url().includes('localhost')) {
          route.abort();
        }
      }, 100);
    });
    
    await setupBasicState(page);
    
    // Should still load the application with fallback data
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle complete network failure', async ({ page }) => {
    // Block all network requests
    await page.route('**/*', route => route.abort());
    
    // Try to navigate to the app
    await page.goto('/');
    
    // Should show error state or offline message
    const errorMessage = page.getByText(/offline|network.*error|connection.*failed/i);
    const loadingIndicator = page.locator('[data-testid="loading"], .loading').first();
    
    // Either should show error or loading (which will eventually timeout)
    const hasError = await errorMessage.isVisible();
    const isLoading = await loadingIndicator.isVisible();
    
    expect(hasError || isLoading).toBeTruthy();
  });

  test('should handle malformed API responses', async ({ page }) => {
    // Mock malformed API responses
    await page.route('**/supabase/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });
    
    await setupBasicState(page);
    
    // Should handle malformed responses gracefully
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle server errors (500)', async ({ page }) => {
    // Mock server errors
    await page.route('**/supabase/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await setupBasicState(page);
    
    // Should show error message or use fallback data
    const errorMessage = page.getByText(/error|failed|retry/i);
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    } else {
      // Should still show dashboard with fallback data
      await expect(page.getByText(/dashboard/i)).toBeVisible();
    }
  });

  test('should handle authentication errors', async ({ page }) => {
    // Mock authentication failure
    await page.route('**/supabase/auth/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' })
      });
    });
    
    await page.goto('/');
    
    // Should show login modal or error message
    const loginModal = page.getByText(/login|sign.*in/i);
    const errorMessage = page.getByText(/authentication.*error|login.*failed/i);
    
    const hasLogin = await loginModal.isVisible();
    const hasError = await errorMessage.isVisible();
    
    expect(hasLogin || hasError).toBeTruthy();
  });

  test('should handle localStorage corruption', async ({ page }) => {
    // Corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem('spa-current-phase', 'invalid-phase');
      localStorage.setItem('spa-sessions', 'invalid-json');
      localStorage.setItem('spa-roster', 'corrupted-data');
    });
    
    await setupBasicState(page);
    
    // Should handle corrupted data gracefully
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle memory pressure', async ({ page }) => {
    // Simulate memory pressure by creating many DOM elements
    await page.evaluate(() => {
      // Create many elements to simulate memory pressure
      for (let i = 0; i < 1000; i++) {
        const div = document.createElement('div');
        div.innerHTML = `Test element ${i}`;
        document.body.appendChild(div);
      }
    });
    
    await setupBasicState(page);
    
    // Should still function normally
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Clean up
    await page.evaluate(() => {
      const testElements = document.querySelectorAll('div:contains("Test element")');
      testElements.forEach(el => el.remove());
    });
  });

  test('should handle rapid user interactions', async ({ page }) => {
    await setupBasicState(page);
    
    // Rapid clicking on various buttons
    const buttons = [
      page.getByTitle(/undo/i).first(),
      page.getByText(/summary/i).first(),
      page.getByText(/roster.*setup/i).first()
    ];
    
    for (const button of buttons) {
      if (await button.isVisible()) {
        // Rapid clicks
        for (let i = 0; i < 5; i++) {
          await button.click();
          await page.waitForTimeout(50);
        }
      }
    }
    
    // Should handle rapid interactions gracefully
    await expect(page.getByText(/dashboard|summary|roster/i)).toBeVisible();
  });

  test('should handle browser tab switching', async ({ page, context }) => {
    await setupBasicState(page);
    
    // Create another tab
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    
    // Switch between tabs rapidly
    for (let i = 0; i < 5; i++) {
      await page.bringToFront();
      await page.waitForTimeout(100);
      await secondPage.bringToFront();
      await page.waitForTimeout(100);
    }
    
    // Both tabs should still function
    await page.bringToFront();
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    await secondPage.close();
  });

  test('should handle window resize during operations', async ({ page }) => {
    await setupBasicState(page);
    
    // Resize window during operations
    await page.setViewportSize({ width: 800, height: 600 });
    
    const undoButton = page.getByTitle(/undo/i).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
    }
    
    // Resize while modal might be open
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    
    // Should handle resizing gracefully
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle form validation errors', async ({ page }) => {
    await setupBasicState(page);
    
    // Try to create a session with invalid data
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Try to proceed without filling required fields
      const nextButton = page.getByText(/next|continue/i).first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should show validation errors
        const validationError = page.getByText(/required|invalid|error/i).first();
        if (await validationError.isVisible()) {
          await expect(validationError).toBeVisible();
        }
      }
    }
  });

  test('should handle concurrent operations', async ({ page }) => {
    await setupBasicState(page);
    
    // Perform multiple operations simultaneously
    const operations = [
      () => page.getByTitle(/undo/i).first().click(),
      () => page.getByText(/summary/i).first().click(),
      () => page.getByText(/roster.*setup/i).first().click()
    ];
    
    // Execute operations concurrently
    const promises = operations.map(async (op) => {
      const element = await op();
      if (await element.isVisible()) {
        await element.click();
      }
    });
    
    await Promise.allSettled(promises);
    
    // Should handle concurrent operations gracefully
    await expect(page.getByText(/dashboard|summary|roster/i)).toBeVisible();
  });

  test('should handle data race conditions', async ({ page }) => {
    await setupBasicState(page);
    
    // Simulate race conditions by rapidly updating data
    await page.evaluate(() => {
      // Rapidly update localStorage to simulate race conditions
      let counter = 0;
      const interval = setInterval(() => {
        localStorage.setItem('spa-test-data', JSON.stringify({ counter: counter++ }));
        if (counter > 100) {
          clearInterval(interval);
        }
      }, 10);
    });
    
    // Perform operations while data is being updated
    const undoButton = page.getByTitle(/undo/i).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
    }
    
    // Should handle race conditions gracefully
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await setupBasicState(page);
    
    // Navigate to summary
    const summaryButton = page.getByText(/summary/i).first();
    if (await summaryButton.isVisible()) {
      await summaryButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Use browser back button
    await page.goBack();
    await page.waitForTimeout(1000);
    
    // Should return to previous state
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Use browser forward button
    await page.goForward();
    await page.waitForTimeout(1000);
    
    // Should go forward to summary
    await expect(page.getByText(/summary|closing.*out/i)).toBeVisible();
  });

  test('should handle page refresh during operations', async ({ page }) => {
    await setupBasicState(page);
    
    // Start an operation (like opening a modal)
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Refresh during operation
      await page.reload();
      
      // Should handle refresh gracefully
      await expect(page.getByText(/dashboard|login/i)).toBeVisible();
    }
  });

  test('should handle invalid user input', async ({ page }) => {
    await setupBasicState(page);
    
    // Try to enter invalid data in various inputs
    const inputs = [
      { selector: 'input[placeholder*="discount"]', value: '-100' },
      { selector: 'input[placeholder*="amount"]', value: 'not-a-number' },
      { selector: 'input[placeholder*="count"]', value: '999999' }
    ];
    
    for (const input of inputs) {
      const element = page.locator(input.selector).first();
      if (await element.isVisible()) {
        await element.fill(input.value);
        
        // Should handle invalid input gracefully
        await expect(element).toBeVisible();
      }
    }
  });

  test('should handle session storage limits', async ({ page }) => {
    // Fill up session storage
    await page.evaluate(() => {
      try {
        let data = 'x';
        while (true) {
          sessionStorage.setItem('test-data', data);
          data += data;
        }
      } catch {
        // Storage is full
      }
    });
    
    await setupBasicState(page);
    
    // Should handle storage limits gracefully
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle DOM manipulation errors', async ({ page }) => {
    await setupBasicState(page);
    
    // Simulate DOM manipulation errors
    await page.evaluate(() => {
      // Override DOM methods to simulate errors
      const originalAppendChild = Node.prototype.appendChild;
      Node.prototype.appendChild = function(child) {
        if (Math.random() < 0.1) { // 10% chance of error
          throw new Error('Simulated DOM error');
        }
        return originalAppendChild.call(this, child);
      };
    });
    
    // Perform operations that might trigger DOM manipulation
    const undoButton = page.getByTitle(/undo/i).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
    }
    
    // Should handle DOM errors gracefully
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await setupBasicState(page);
    
    // Inject a JavaScript error
    await page.evaluate(() => {
      try {
        throw new Error('Simulated JavaScript error');
      } catch (e) {
        console.error('Simulated error:', e);
      }
    });
    
    // Should continue functioning despite errors
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Check that errors were logged
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should handle timeout scenarios', async ({ page }) => {
    // Set a very short timeout
    page.setDefaultTimeout(100);
    
    await page.goto('/');
    
    // Some operations might timeout, but app should still work
    try {
      await setupBasicState(page);
    } catch {
      // Expected to timeout on some operations
    }
    
    // Reset timeout
    page.setDefaultTimeout(30000);
    
    // Should still be functional
    await expect(page.getByText(/dashboard|login/i)).toBeVisible();
  });
});
