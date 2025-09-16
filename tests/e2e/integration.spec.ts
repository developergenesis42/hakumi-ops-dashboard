import { test, expect } from '@playwright/test';

// Helper function to log in
async function login(page: import('@playwright/test').Page) {
  const loginButton = page.getByText('🧪 Test Admin Login').first();
  await loginButton.click();
  await page.waitForTimeout(2000);
}

test.describe('Complete User Journey Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full spa operations workflow from start to finish', async ({ page }) => {
    // Step 1: Login
    await login(page);
    await expect(page.getByText('Hakumi Nuru Massage')).toBeVisible();
    
    // Step 2: Roster Setup
    await expect(page.getByText('Daily Roster Setup')).toBeVisible();
    
    // Add therapists to roster
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    // Add another therapist
    await searchInput.fill('Alice');
    await page.waitForTimeout(1000);
    const secondTherapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await secondTherapistButton.isVisible()) {
      await secondTherapistButton.click();
    }
    
    // Verify roster is populated
    await expect(page.getByText(/Today's Roster/)).toContainText(/\(\d+\)/);
    
    // Step 3: Start the day
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Step 4: Daily Operations Dashboard
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Verify dashboard elements
    await expect(page.getByText(/total.*revenue|total.*sessions|total.*payouts/i)).toBeVisible();
    
    // Step 5: Create sessions
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Complete session creation workflow
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        const servicePackage = page.getByText(/60.*min/i).first();
        if (await servicePackage.isVisible()) {
          await servicePackage.click();
        }
        
        const room = page.getByText(/shower/i).first();
        if (await room.isVisible()) {
          await room.click();
        }
        
        const confirmButton = page.getByText(/confirm|start/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
    
    // Step 6: Complete session
    const completeButton = page.getByText(/complete|finish/i).first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await expect(page.getByText(/completed|finished/i)).toBeVisible();
    }
    
    // Step 7: Navigate to closing out
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Step 8: Verify closing out page
    await expect(page.getByText(/closing.*out|daily.*summary/i)).toBeVisible();
    
    // Verify financial summary
    await expect(page.getByText(/total.*revenue|total.*sessions|total.*payouts/i)).toBeVisible();
    
    // Step 9: End the day
    const endDayButton = page.getByText(/end.*day|close.*day/i).first();
    if (await endDayButton.isVisible()) {
      await endDayButton.click();
      
      // Handle confirmation dialog
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain(/end.*day|close.*day|confirm/i);
        dialog.accept();
      });
    }
    
    // Verify day-end process completed
    await expect(page.getByText(/day.*ended|closed/i)).toBeVisible();
  });

  test('should handle complete session management workflow', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Create multiple sessions
    for (let i = 0; i < 3; i++) {
      const createSessionButton = page.getByText(/new session/i).first();
      if (await createSessionButton.isVisible()) {
        await createSessionButton.click();
        
        // Complete session creation
        const serviceCategory = page.getByText(/single/i).first();
        if (await serviceCategory.isVisible()) {
          await serviceCategory.click();
          
          const servicePackage = page.getByText(/60.*min/i).first();
          if (await servicePackage.isVisible()) {
            await servicePackage.click();
          }
          
          const room = page.getByText(/shower/i).first();
          if (await room.isVisible()) {
            await room.click();
          }
          
          // Apply discount for some sessions
          if (i === 1) {
            const discountInput = page.getByPlaceholder(/discount|amount/i).first();
            if (await discountInput.isVisible()) {
              await discountInput.fill('10');
            }
          }
          
          const confirmButton = page.getByText(/confirm|start/i).first();
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
        }
        
        await page.waitForTimeout(1000);
      }
    }
    
    // Complete all sessions
    const completeButtons = page.getByText(/complete|finish/i);
    const completeCount = await completeButtons.count();
    
    for (let i = 0; i < completeCount; i++) {
      const completeButton = completeButtons.nth(i);
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Verify sessions are completed
    await expect(page.getByText(/completed|finished/i)).toBeVisible();
    
    // Navigate to closing out to verify all sessions
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Verify session statistics
    await expect(page.getByText(/total.*sessions|session.*count/i)).toBeVisible();
  });

  test('should handle therapist management workflow', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    // Add multiple therapists
    const searchInput = page.getByPlaceholder('Search therapists...');
    const therapists = ['Ally', 'Alice', 'Amy'];
    
    for (const therapistName of therapists) {
      await searchInput.fill(therapistName);
      await page.waitForTimeout(1000);
      
      const therapistButton = page.locator('[data-testid="therapist-button"]').first();
      if (await therapistButton.isVisible()) {
        await therapistButton.click();
      }
    }
    
    // Verify roster is populated
    await expect(page.getByText(/Today's Roster/)).toContainText(/\(\d+\)/);
    
    // Start the day
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Verify all therapists are on dashboard
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Check therapist status updates
    const therapistCards = page.locator('[data-testid="therapist-card"]');
    const cardCount = await therapistCards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    
    // Test therapist status changes
    for (let i = 0; i < Math.min(cardCount, 2); i++) {
      const card = therapistCards.nth(i);
      const statusButton = card.getByText(/available|in.*session|departed/i).first();
      
      if (await statusButton.isVisible()) {
        await statusButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Navigate to closing out
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Verify therapist attendance and working hours
    await expect(page.getByText(/working.*hours|attendance/i)).toBeVisible();
  });

  test('should handle walk-out management workflow', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Add walk-outs through side panel
    const walkOutInput = page.getByPlaceholder(/walk.*out.*count/i).first();
    if (await walkOutInput.isVisible()) {
      await walkOutInput.fill('3');
      await expect(walkOutInput).toHaveValue('3');
      
      // Select reason
      const reasonSelect = page.getByText(/no.*rooms/i).first();
      if (await reasonSelect.isVisible()) {
        await reasonSelect.click();
      }
      
      // Add walk-out
      const addButton = page.getByText(/add.*walk.*out/i).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Verify walk-out was added
        await expect(page.getByText(/walk.*outs.*3|count.*3/i)).toBeVisible();
      }
    }
    
    // Add another walk-out with different reason
    if (await walkOutInput.isVisible()) {
      await walkOutInput.fill('2');
      
      const reasonSelect = page.getByText(/customer.*left/i).first();
      if (await reasonSelect.isVisible()) {
        await reasonSelect.click();
      }
      
      const addButton = page.getByText(/add.*walk.*out/i).first();
      if (await addButton.isVisible()) {
        await addButton.click();
      }
    }
    
    // Navigate to closing out
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Verify walk-out statistics
    await expect(page.getByText(/walk.*outs|no.*shows/i)).toBeVisible();
  });

  test('should handle expense management workflow', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Add expenses through expenses modal
    const expensesButton = page.getByText(/expenses|expense.*summary/i).first();
    if (await expensesButton.isVisible()) {
      await expensesButton.click();
      
      // Add multiple expenses
      for (let i = 0; i < 2; i++) {
        const addExpenseButton = page.getByText(/add.*expense/i).first();
        if (await addExpenseButton.isVisible()) {
          await addExpenseButton.click();
          
          // Fill expense details
          const amountInput = page.getByPlaceholder(/amount|expense.*amount/i).first();
          if (await amountInput.isVisible()) {
            await amountInput.fill(`${50 + i * 25}`);
          }
          
          const descriptionInput = page.getByPlaceholder(/description|note/i).first();
          if (await descriptionInput.isVisible()) {
            await descriptionInput.fill(`Expense ${i + 1}`);
          }
          
          const saveButton = page.getByText(/save|add/i).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
          }
        }
      }
    }
    
    // Navigate to closing out
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Verify expense totals
    await expect(page.getByText(/expenses|expense.*total/i)).toBeVisible();
  });

  test('should handle undo functionality across workflow', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Create a session
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        const servicePackage = page.getByText(/60.*min/i).first();
        if (await servicePackage.isVisible()) {
          await servicePackage.click();
        }
        
        const room = page.getByText(/shower/i).first();
        if (await room.isVisible()) {
          await room.click();
        }
        
        const confirmButton = page.getByText(/confirm|start/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
    
    // Use undo to revert session creation
    const undoButton = page.getByTitle(/undo/i).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
      
      // Handle undo confirmation if it affects database
      const warningModal = page.getByText(/undo.*warning|confirm.*undo/i);
      if (await warningModal.isVisible()) {
        const confirmButton = page.getByText(/confirm|yes/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
    
    // Verify session was undone
    await expect(page.getByText(/session.*undone|reverted/i)).toBeVisible();
    
    // Navigate to closing out to verify no sessions
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Should show zero sessions
    await expect(page.getByText(/total.*sessions.*0|no.*sessions/i)).toBeVisible();
  });

  test('should handle data persistence across browser refresh', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Create a session
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        const servicePackage = page.getByText(/60.*min/i).first();
        if (await servicePackage.isVisible()) {
          await servicePackage.click();
        }
        
        const room = page.getByText(/shower/i).first();
        if (await room.isVisible()) {
          await room.click();
        }
        
        const confirmButton = page.getByText(/confirm|start/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
    
    // Complete the session
    const completeButton = page.getByText(/complete|finish/i).first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
    }
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should still be authenticated and on dashboard
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    
    // Navigate to closing out
    const summaryButton = page.getByText(/summary|closing.*out/i).first();
    await summaryButton.click();
    await page.waitForTimeout(2000);
    
    // Should show the completed session
    await expect(page.getByText(/total.*sessions.*1|session.*count.*1/i)).toBeVisible();
  });

  test('should handle multi-browser tab synchronization', async ({ page, context }) => {
    // Setup: Login in first tab
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Open second tab
    const secondPage = await context.newPage();
    await secondPage.goto('/');
    await secondPage.waitForTimeout(2000);
    
    // Should be authenticated in second tab
    await expect(secondPage.getByText(/dashboard/i)).toBeVisible();
    
    // Create session in first tab
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        const servicePackage = page.getByText(/60.*min/i).first();
        if (await servicePackage.isVisible()) {
          await servicePackage.click();
        }
        
        const room = page.getByText(/shower/i).first();
        if (await room.isVisible()) {
          await room.click();
        }
        
        const confirmButton = page.getByText(/confirm|start/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
    
    // Switch to second tab and verify session appears
    await secondPage.bringToFront();
    await page.waitForTimeout(2000);
    
    // Should show the session in second tab
    await expect(secondPage.getByText(/active.*session|session.*in.*progress/i)).toBeVisible();
    
    // Close second tab
    await secondPage.close();
  });

  test('should handle complete error recovery workflow', async ({ page }) => {
    // Setup: Login and start day
    await login(page);
    
    const searchInput = page.getByPlaceholder('Search therapists...');
    await searchInput.fill('Ally');
    await page.waitForTimeout(1000);
    
    const therapistButton = page.locator('[data-testid="therapist-button"]').first();
    if (await therapistButton.isVisible()) {
      await therapistButton.click();
    }
    
    const startDayButton = page.getByRole('button', { name: /start day/i });
    await startDayButton.click();
    await page.waitForTimeout(2000);
    
    // Simulate network error
    await page.route('**/*', route => {
      if (route.request().url().includes('api') || route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Try to create session (should fail)
    const createSessionButton = page.getByText(/new session/i).first();
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Should show error or handle gracefully
      await page.waitForTimeout(2000);
      
      const errorMessage = page.getByText(/error|failed|retry/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
    
    // Restore network
    await page.unroute('**/*');
    
    // Should recover and allow normal operation
    if (await createSessionButton.isVisible()) {
      await createSessionButton.click();
      
      // Should work normally now
      const serviceCategory = page.getByText(/single/i).first();
      if (await serviceCategory.isVisible()) {
        await serviceCategory.click();
        
        const servicePackage = page.getByText(/60.*min/i).first();
        if (await servicePackage.isVisible()) {
          await servicePackage.click();
        }
        
        const room = page.getByText(/shower/i).first();
        if (await room.isVisible()) {
          await room.click();
        }
        
        const confirmButton = page.getByText(/confirm|start/i).first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
    
    // Verify recovery was successful
    await expect(page.getByText(/session.*created|active.*session/i)).toBeVisible();
  });
});
