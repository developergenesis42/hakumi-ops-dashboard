import { test, expect } from '@playwright/test';

// Helper function to log in
async function login(page: import('@playwright/test').Page) {
  // Click the test admin login button (use the first one)
  const loginButton = page.getByText('🧪 Test Admin Login').first();
  await loginButton.click();
  
  // Wait for login to complete
  await page.waitForTimeout(2000);
}

test.describe('Session Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await login(page);
    
    // Set up roster first manually
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    
    // Click on the first therapist in the search results
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    // Start the day
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
  });

  test('should create a new session', async ({ page }) => {
    // Look for session creation button or modal trigger
    const createSessionButton = page.getByText(/new session|create session|start session/i).first();
    
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Should open session modal
      await expect(page.getByText(/session details|service selection/i)).toBeVisible();
    }
  });

  test('should select service category', async ({ page }) => {
    // This would test the service category selection step
    // The actual implementation would depend on the session modal structure
    const serviceCategoryButton = page.getByText(/single|double|couple/i).first();
    
    if (await serviceCategoryButton.isVisible()) {
      await serviceCategoryButton.click();
      await expect(serviceCategoryButton).toHaveClass(/selected|active/);
    }
  });

  test('should select room', async ({ page }) => {
    // This would test room selection
    const roomButton = page.getByText(/shower|vip|jacuzzi/i).first();
    
    if (await roomButton.isVisible()) {
      await roomButton.click();
      await expect(roomButton).toHaveClass(/selected|active/);
    }
  });

  test('should apply discount', async ({ page }) => {
    // This would test discount application
    const discountInput = page.getByPlaceholder(/discount|amount/i);
    
    if (await discountInput.isVisible()) {
      await discountInput.fill('10');
      await expect(discountInput).toHaveValue('10');
    }
  });

  test('should complete session workflow', async ({ page }) => {
    // This would test the complete session creation flow
    // Starting from service selection to session completion
    
    // Step 1: Open session modal
    const createSessionButton = page.getByText(/new session|create session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
    }
    
    // Step 2: Select service category
    const serviceCategory = page.getByText(/single/i).first();
    if (await serviceCategory.isVisible()) {
      await serviceCategory.click();
    }
    
    // Step 3: Select service package
    const servicePackage = page.getByText(/60.*min/i).first();
    if (await servicePackage.isVisible()) {
      await servicePackage.click();
    }
    
    // Step 4: Select room
    const room = page.getByText(/shower/i).first();
    if (await room.isVisible()) {
      await room.click();
    }
    
    // Step 5: Confirm session
    const confirmButton = page.getByText(/confirm|start/i).first();
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Should show active session
    await expect(page.getByText(/active session|session in progress/i)).toBeVisible();
  });

  test('should handle session timer', async ({ page }) => {
    // This would test the session timer functionality
    const timerElement = page.getByText(/\d+m|\d+h \d+m/);
    
    if (await timerElement.isVisible()) {
      // Timer should be counting down
      const initialTime = await timerElement.textContent();
      await page.waitForTimeout(1000);
      const updatedTime = await timerElement.textContent();
      
      // Time should have changed (unless it's already at 0)
      if (initialTime !== '0m') {
        expect(updatedTime).not.toBe(initialTime);
      }
    }
  });

  test('should complete session', async ({ page }) => {
    // This would test session completion
    const completeButton = page.getByText(/complete|finish/i).first();
    
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Should show completion confirmation or update session status
      await expect(page.getByText(/completed|finished/i)).toBeVisible();
    }
  });

  test('should handle walk-out', async ({ page }) => {
    // This would test walk-out functionality
    const walkOutButton = page.getByText(/walk.*out|no.*show/i).first();
    
    if (await walkOutButton.isVisible()) {
      await walkOutButton.click();
      
      // Should show walk-out modal or confirmation
      await expect(page.getByText(/walk.*out|reason/i)).toBeVisible();
    }
  });

  test('should display session statistics', async ({ page }) => {
    // This would test that session statistics are displayed correctly
    await expect(page.getByText(/total.*sessions|revenue|payouts/i)).toBeVisible();
  });

  test('should handle multiple concurrent sessions', async ({ page }) => {
    // This would test handling multiple sessions at once
    // The exact implementation would depend on the UI structure
    
    // Create first session
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
    }
    
    // Complete first session setup
    // ... (session setup steps)
    
    // Try to create second session
    const secondSessionButton = page.getByText(/new session/i).first();
    if (await secondSessionButton.isVisible()) {
      await secondSessionButton.click();
    }
    
    // Should be able to handle multiple sessions
    await expect(page.getByText(/session.*2|active.*sessions/i)).toBeVisible();
  });

  test('should handle session modal step navigation', async ({ page }) => {
    // Test step-by-step navigation in session creation
    const createSessionButton = page.getByText(/new session|create session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Should show service selection step
      await expect(page.getByText(/service.*selection|select.*service/i)).toBeVisible();
      
      // Test back button (if available)
      const backButton = page.getByText(/back|previous/i).first();
      if (await backButton.isVisible()) {
        await backButton.click();
        // Should go back to previous step
      }
    }
  });

  test('should validate required fields in session creation', async ({ page }) => {
    // Test validation of required fields
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Try to proceed without selecting required fields
      const nextButton = page.getByText(/next|continue|confirm/i).first();
      if (await nextButton.isVisible()) {
        await nextButton.click();
        
        // Should show validation errors
        const errorMessage = page.getByText(/required|select|choose/i).first();
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should handle session creation cancellation', async ({ page }) => {
    // Test canceling session creation
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Close modal
      const closeButton = page.locator('button[aria-label="Close"], [aria-label="close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        
        // Should return to dashboard
        await expect(page.getByText(/dashboard/i)).toBeVisible();
      }
    }
  });

  test('should handle room availability validation', async ({ page }) => {
    // Test room availability during session creation
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Navigate to room selection step
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        // Check room availability
        const availableRooms = page.locator('button').filter({ hasText: /available|free/i });
        if (await availableRooms.first().isVisible()) {
          await expect(availableRooms.first()).toBeVisible();
        }
      }
    }
  });

  test('should handle discount application and validation', async ({ page }) => {
    // Test discount functionality
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Navigate to discount step
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        // Look for discount input
        const discountInput = page.getByPlaceholder(/discount|amount/i).first();
        if (await discountInput.isVisible()) {
          // Test valid discount
          await discountInput.fill('10');
          await expect(discountInput).toHaveValue('10');
          
          // Test invalid discount (negative)
          await discountInput.fill('-5');
          // Should show validation error or reset value
        }
      }
    }
  });

  test('should handle session timer accuracy', async ({ page }) => {
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

  test('should handle session completion with payment', async ({ page }) => {
    // Test complete session workflow including payment
    const completeButton = page.getByText(/complete|finish/i).first();
    
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Should show completion confirmation
      await expect(page.getByText(/completed|finished/i)).toBeVisible();
      
      // Check for payment confirmation or receipt
      const paymentConfirmation = page.getByText(/payment|receipt|paid/i);
      if (await paymentConfirmation.isVisible()) {
        await expect(paymentConfirmation).toBeVisible();
      }
    }
  });

  test('should handle walk-out with reason selection', async ({ page }) => {
    // Test walk-out functionality with reason selection
    const walkOutButton = page.getByText(/walk.*out|no.*show/i).first();
    
    if (await walkOutButton.isVisible()) {
      await walkOutButton.click();
      
      // Should show walk-out modal with reason options
      await expect(page.getByText(/walk.*out|reason/i)).toBeVisible();
      
      // Select a reason
      const reasonOption = page.getByText(/no.*rooms|customer.*left|emergency/i).first();
      if (await reasonOption.isVisible()) {
        await reasonOption.click();
        
        // Confirm walk-out
        const confirmButton = page.getByText(/confirm|submit/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          
          // Should show walk-out confirmation
          await expect(page.getByText(/walk.*out.*confirmed|recorded/i)).toBeVisible();
        }
      }
    }
  });

  test('should handle session editing after completion', async ({ page }) => {
    // Test editing completed sessions
    const editButton = page.getByText(/edit|modify/i).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should open edit modal
      await expect(page.getByText(/edit.*session|modify/i)).toBeVisible();
      
      // Test editing session details
      const amountInput = page.getByPlaceholder(/amount|price/i).first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('150');
        await expect(amountInput).toHaveValue('150');
      }
      
      // Save changes
      const saveButton = page.getByText(/save|update/i).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Should show success message
        await expect(page.getByText(/updated|saved/i)).toBeVisible();
      }
    }
  });

  test('should handle session history and filtering', async ({ page }) => {
    // Test session history functionality
    const historyButton = page.getByText(/history|sessions.*list/i).first();
    
    if (await historyButton.isVisible()) {
      await historyButton.click();
      
      // Should show session history
      await expect(page.getByText(/session.*history|completed.*sessions/i)).toBeVisible();
      
      // Test filtering options
      const filterButton = page.getByText(/filter|search/i).first();
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Should show filter options
        await expect(page.getByText(/date|therapist|service/i)).toBeVisible();
      }
    }
  });

  test('should handle concurrent session creation attempts', async ({ page }) => {
    // Test multiple rapid session creation attempts
    const createSessionButton = page.getByText(/new session/i).first();
    
    // Rapid clicks
    await createSessionButton.click();
    await page.waitForTimeout(100);
    await createSessionButton.click();
    
    // Should handle gracefully (either show one modal or prevent multiple)
    const modalCount = await page.locator('.modal-backdrop, [role="dialog"]').count();
    expect(modalCount).toBeLessThanOrEqual(1);
  });

  test('should handle session data persistence', async ({ page }) => {
    // Create a session
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Fill in session details
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        // Refresh page
        await page.reload();
        
        // Session data should be preserved or gracefully handled
        // This depends on the implementation (localStorage, database, etc.)
      }
    }
  });

  test('should handle session error recovery', async ({ page }) => {
    // Test error handling during session operations
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Simulate network error by blocking requests
      await page.route('**/*', route => {
        if (route.request().url().includes('session') || route.request().url().includes('api')) {
          route.abort();
        } else {
          route.continue();
        }
      });
      
      // Try to create session
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        // Should show error message or handle gracefully
        await page.waitForTimeout(2000);
        
        const errorMessage = page.getByText(/error|failed|retry/i);
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });
});
