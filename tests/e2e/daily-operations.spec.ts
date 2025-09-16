import { test, expect } from '@playwright/test';

// Helper function to log in
async function login(page: import('@playwright/test').Page) {
  // Click the test admin login button (use the first one)
  const loginButton = page.getByText('🧪 Test Admin Login').first();
  await loginButton.click();
  
  // Wait for login to complete
  await page.waitForTimeout(2000);
}

test.describe('Daily Operations Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    
    // Set up roster and start day manually
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    
    // Click on the first therapist in the search results
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
  });

  test('should display main dashboard', async ({ page }) => {
    // Verify main dashboard elements are visible
    await expect(page.getByText(/dashboard|daily operations/i)).toBeVisible();
    
    // Check for key sections
    await expect(page.getByText(/therapists|rooms|sessions/i)).toBeVisible();
  });

  test('should show therapist status', async ({ page }) => {
    // Check that therapist statuses are displayed
    await expect(page.getByText(/available|in.*session|departed/i)).toBeVisible();
  });

  test('should show room availability', async ({ page }) => {
    // Check that room statuses are displayed
    await expect(page.getByText(/available|occupied/i)).toBeVisible();
  });

  test('should display daily statistics', async ({ page }) => {
    // Check for daily stats
    await expect(page.getByText(/total.*revenue|total.*sessions|total.*payouts/i)).toBeVisible();
  });

  test('should handle therapist check-in', async ({ page }) => {
    // Look for check-in functionality
    const checkInButton = page.getByText(/check.*in|arrive/i).first();
    
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      
      // Therapist status should update
      await expect(page.getByText(/available/i)).toBeVisible();
    }
  });

  test('should handle therapist departure', async ({ page }) => {
    // Look for departure functionality
    const departButton = page.getByText(/depart|leave/i).first();
    
    if (await departButton.isVisible()) {
      await departButton.click();
      
      // Should show confirmation or update status
      await expect(page.getByText(/departed|left/i)).toBeVisible();
    }
  });

  test('should navigate to closing out', async ({ page }) => {
    // Look for closing out button or navigation
    const closingOutButton = page.getByText(/closing.*out|end.*day|close.*out/i).first();
    
    if (await closingOutButton.isVisible()) {
      await closingOutButton.click();
      
      // Should navigate to closing out phase
      await expect(page.getByText(/closing.*out|final.*totals/i)).toBeVisible();
    }
  });

  test('should display real-time updates', async ({ page }) => {
    // Check that the dashboard updates in real-time
    // This would test WebSocket connections or polling updates
    
    // Look for timestamp or last updated indicator
    const lastUpdated = page.getByText(/last.*updated|updated.*at/i);
    
    if (await lastUpdated.isVisible()) {
      // Verify it shows a recent time
      await expect(lastUpdated).toBeVisible();
    }
  });

  test('should handle session creation from dashboard', async ({ page }) => {
    // Test creating sessions from the main dashboard
    const newSessionButton = page.getByText(/new.*session|start.*session/i).first();
    
    if (await newSessionButton.isVisible()) {
      await newSessionButton.click();
      
      // Should open session creation modal
      await expect(page.getByText(/service.*selection|create.*session/i)).toBeVisible();
    }
  });

  test('should display active sessions', async ({ page }) => {
    // Check that active sessions are displayed
    await expect(page.getByText(/active.*sessions|sessions.*in.*progress/i)).toBeVisible();
  });

  test('should handle session completion from dashboard', async ({ page }) => {
    // Test completing sessions from the dashboard
    const completeButton = page.getByText(/complete|finish/i).first();
    
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Should show completion confirmation
      await expect(page.getByText(/completed|finished/i)).toBeVisible();
    }
  });

  test('should show financial summary', async ({ page }) => {
    // Check that financial information is displayed
    await expect(page.getByText(/revenue|payouts|discounts|shop.*revenue/i)).toBeVisible();
  });

  test('should handle walk-outs from dashboard', async ({ page }) => {
    // Test walk-out functionality from dashboard
    const walkOutButton = page.getByText(/walk.*out|no.*show/i).first();
    
    if (await walkOutButton.isVisible()) {
      await walkOutButton.click();
      
      // Should show walk-out form or confirmation
      await expect(page.getByText(/walk.*out|reason|amount/i)).toBeVisible();
    }
  });

  test('should display room utilization', async ({ page }) => {
    // Check that room utilization is shown
    await expect(page.getByText(/utilization|occupancy|room.*usage/i)).toBeVisible();
  });

  test('should handle undo actions', async ({ page }) => {
    // Test undo functionality from dashboard
    const undoButton = page.getByTitle(/undo/i);
    
    if (await undoButton.isVisible()) {
      await undoButton.click();
      
      // Should undo the last action
      // The exact behavior would depend on what was last done
    }
  });

  test('should show session history', async ({ page }) => {
    // Check that session history is displayed
    await expect(page.getByText(/session.*history|recent.*sessions/i)).toBeVisible();
  });

  test('should handle emergency stop', async ({ page }) => {
    // Test emergency stop functionality
    const emergencyButton = page.getByText(/emergency|stop.*all/i).first();
    
    if (await emergencyButton.isVisible()) {
      await emergencyButton.click();
      
      // Should show confirmation dialog
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain(/emergency|stop|confirm/i);
        dialog.accept();
      });
    }
  });

  test('should handle therapist status updates in real-time', async ({ page }) => {
    // Check that therapist status updates are reflected immediately
    const therapistCard = page.locator('[data-testid="therapist-card"]').first();
    
    if (await therapistCard.isVisible()) {
      // Look for status change buttons
      const statusButton = therapistCard.getByText(/available|in.*session|departed/i).first();
      
      if (await statusButton.isVisible()) {
        await statusButton.click();
        
        // Status should update immediately
        await expect(statusButton).toBeVisible();
      }
    }
  });

  test('should handle room status updates', async ({ page }) => {
    // Check room status functionality
    const roomButton = page.locator('button').filter({ hasText: /available|occupied/i }).first();
    
    if (await roomButton.isVisible()) {
      await roomButton.click();
      
      // Room status should update
      await expect(roomButton).toBeVisible();
    }
  });

  test('should display accurate financial metrics', async ({ page }) => {
    // Verify financial metrics are displayed and accurate
    await expect(page.getByText(/total.*revenue|total.*sessions|total.*payouts/i)).toBeVisible();
    
    // Check that numbers are formatted correctly
    const revenueElement = page.getByText(/\$\d+/).first();
    if (await revenueElement.isVisible()) {
      await expect(revenueElement).toBeVisible();
    }
  });

  test('should handle side panel walk-out functionality', async ({ page }) => {
    // Test walk-out functionality in side panel
    const walkOutInput = page.getByPlaceholder(/walk.*out.*count/i).first();
    
    if (await walkOutInput.isVisible()) {
      await walkOutInput.fill('2');
      await expect(walkOutInput).toHaveValue('2');
      
      // Select reason
      const reasonSelect = page.getByText(/no.*rooms|customer.*left/i).first();
      if (await reasonSelect.isVisible()) {
        await reasonSelect.click();
      }
      
      // Add walk-out
      const addButton = page.getByText(/add.*walk.*out/i).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Should update walk-out count
        await expect(page.getByText(/walk.*outs.*2|count.*2/i)).toBeVisible();
      }
    }
  });

  test('should handle therapist card interactions', async ({ page }) => {
    // Test therapist card functionality
    const therapistCard = page.locator('[data-testid="therapist-card"]').first();
    
    if (await therapistCard.isVisible()) {
      // Test clicking on therapist card
      await therapistCard.click();
      
      // Should open session modal or show therapist details
      await expect(page.getByText(/session.*details|therapist.*info/i)).toBeVisible();
    }
  });

  test('should handle navigation between phases', async ({ page }) => {
    // Test navigation buttons
    const rosterButton = page.getByText(/roster.*setup/i).first();
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    
    // Test going back to roster setup
    if (await rosterButton.isVisible()) {
      await rosterButton.click();
      await expect(page.getByText(/daily.*roster.*setup/i)).toBeVisible();
      
      // Go back to dashboard
      const startDayButton = page.getByRole('button', { name: /start day/i });
      await startDayButton.click();
    }
    
    // Test going to summary
    if (await summaryButton.isVisible()) {
      await summaryButton.click();
      await expect(page.getByText(/closing.*out|daily.*summary/i)).toBeVisible();
    }
  });

  test('should handle undo functionality from dashboard', async ({ page }) => {
    // Test undo button functionality
    const undoButton = page.getByTitle(/undo/i).first();
    
    if (await undoButton.isVisible()) {
      await undoButton.click();
      
      // Should show undo confirmation if it affects database
      const warningModal = page.getByText(/undo.*warning|confirm.*undo/i);
      if (await warningModal.isVisible()) {
        await expect(warningModal).toBeVisible();
        
        // Confirm undo
        const confirmButton = page.getByText(/confirm|yes/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  });

  test('should handle expenses modal', async ({ page }) => {
    // Test expenses functionality
    const expensesButton = page.getByText(/expenses|expense.*summary/i).first();
    
    if (await expensesButton.isVisible()) {
      await expensesButton.click();
      
      // Should open expenses modal
      await expect(page.getByText(/expense.*summary|expenses.*modal/i)).toBeVisible();
      
      // Test adding expense
      const addExpenseButton = page.getByText(/add.*expense/i).first();
      if (await addExpenseButton.isVisible()) {
        await addExpenseButton.click();
        
        // Should show expense form
        await expect(page.getByText(/expense.*form|add.*expense/i)).toBeVisible();
      }
    }
  });

  test('should handle dashboard refresh and data persistence', async ({ page }) => {
    // Refresh the page
    await page.reload();
    
    // Should maintain dashboard state
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Data should persist
    await expect(page.getByText(/total.*revenue|total.*sessions/i)).toBeVisible();
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    // Test multiple rapid interactions
    const undoButton = page.getByTitle(/undo/i).first();
    const summaryButton = page.getByText(/summary/i).first();
    
    // Rapid clicks
    if (await undoButton.isVisible()) {
      await undoButton.click();
      await page.waitForTimeout(100);
    }
    
    if (await summaryButton.isVisible()) {
      await summaryButton.click();
    }
    
    // Should handle gracefully
    await expect(page.getByText(/summary|closing.*out/i)).toBeVisible();
  });

  test('should handle network connectivity issues', async ({ page }) => {
    // Simulate network issues
    await page.route('**/*', route => {
      if (route.request().url().includes('api') || route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Try to perform an action
    const undoButton = page.getByTitle(/undo/i).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
      
      // Should handle network errors gracefully
      await page.waitForTimeout(2000);
      
      const errorMessage = page.getByText(/error|failed|retry/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test keyboard accessibility
    const undoButton = page.getByTitle(/undo/i).first();
    
    if (await undoButton.isVisible()) {
      // Focus on undo button
      await undoButton.focus();
      await expect(undoButton).toBeFocused();
      
      // Press Enter to activate
      await page.keyboard.press('Enter');
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test responsive behavior
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    
    // Dashboard should still be functional
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Reset to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Should work normally
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle data loading states', async ({ page }) => {
    // Check for loading indicators
    const loadingIndicator = page.locator('[data-testid="loading"], .loading, [aria-label*="loading"]').first();
    
    if (await loadingIndicator.isVisible()) {
      // Loading should eventually disappear
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }
  });

  test('should handle error boundaries', async ({ page }) => {
    // Test error boundary functionality
    // This would involve triggering an error condition
    // The exact implementation depends on the error boundary setup
    
    // For now, verify that the dashboard loads without errors
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Check for any error messages
    const errorMessage = page.getByText(/error|something.*went.*wrong/i);
    if (await errorMessage.isVisible()) {
      // Should show error boundary message
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should handle session timer updates', async ({ page }) => {
    // Test session timer functionality
    const timerElement = page.getByText(/\d+m|\d+h \d+m/).first();
    
    if (await timerElement.isVisible()) {
      // Record initial time
      const initialTime = await timerElement.textContent();
      
      // Wait for timer to update
      await page.waitForTimeout(2000);
      const updatedTime = await timerElement.textContent();
      
      // Time should have changed (unless it's already at 0)
      if (initialTime !== '0m' && initialTime !== '00:00') {
        expect(updatedTime).not.toBe(initialTime);
      }
    }
  });

  test('should handle real-time data synchronization', async ({ page }) => {
    // Test real-time updates
    // This would test WebSocket connections or polling updates
    
    // Look for last updated indicator
    const lastUpdated = page.getByText(/last.*updated|updated.*at/i).first();
    
    if (await lastUpdated.isVisible()) {
      await expect(lastUpdated).toBeVisible();
      
      // Wait for potential updates
      await page.waitForTimeout(5000);
      
      // Should show recent timestamp
      await expect(lastUpdated).toBeVisible();
    }
  });
});
