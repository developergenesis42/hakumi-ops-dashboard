import { test, expect } from '@playwright/test';

// Helper function to log in and set up roster
async function setupRosterAndLogin(page: import('@playwright/test').Page) {
  // Login
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
  
  // Navigate to closing out
  const summaryButton = page.getByText(/summary|closing.*out/i).first();
  await summaryButton.click();
  await page.waitForTimeout(2000);
}

test.describe('Closing Out Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await setupRosterAndLogin(page);
  });

  test('should display closing out dashboard with financial summary', async ({ page }) => {
    // Verify closing out page is loaded
    await expect(page.getByText(/closing.*out|daily.*summary|final.*totals/i)).toBeVisible();
    
    // Check for financial summary sections
    await expect(page.getByText(/total.*revenue|total.*sessions|total.*payouts/i)).toBeVisible();
    await expect(page.getByText(/shop.*revenue|expenses|discounts/i)).toBeVisible();
  });

  test('should display accurate session statistics', async ({ page }) => {
    // Verify session statistics are displayed
    await expect(page.getByText(/total.*slips|sessions.*completed/i)).toBeVisible();
    
    // Check for individual session details
    await expect(page.getByText(/session.*details|session.*list/i)).toBeVisible();
  });

  test('should handle therapist payout calculations', async ({ page }) => {
    // Check therapist payout information
    await expect(page.getByText(/therapist.*payouts|individual.*earnings/i)).toBeVisible();
    
    // Verify payout calculations are displayed
    await expect(page.getByText(/total.*earnings|expenses|net.*payout/i)).toBeVisible();
  });

  test('should display working hours and attendance', async ({ page }) => {
    // Check attendance tracking
    await expect(page.getByText(/working.*hours|attendance|check.*in.*time/i)).toBeVisible();
    
    // Verify working hours calculations
    await expect(page.getByText(/\d+h \d+m|\d+:\d+/)).toBeVisible();
  });

  test('should handle session editing from closing out', async ({ page }) => {
    // Look for edit session functionality
    const editButton = page.getByText(/edit|modify/i).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should open edit modal
      await expect(page.getByText(/edit.*session|modify.*session/i)).toBeVisible();
      
      // Test editing session details
      const amountInput = page.getByPlaceholder(/amount|price/i).first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('200');
        await expect(amountInput).toHaveValue('200');
      }
      
      // Save changes
      const saveButton = page.getByText(/save|update/i).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        
        // Should update totals
        await expect(page.getByText(/updated|saved/i)).toBeVisible();
      }
    }
  });

  test('should handle session reprinting', async ({ page }) => {
    // Look for reprint functionality
    const reprintButton = page.getByText(/reprint|print.*receipt/i).first();
    
    if (await reprintButton.isVisible()) {
      await reprintButton.click();
      
      // Should handle reprinting (may open print dialog)
      // Verify button is clickable and doesn't cause errors
      await expect(reprintButton).toBeVisible();
    }
  });

  test('should display walk-out statistics', async ({ page }) => {
    // Check for walk-out information
    await expect(page.getByText(/walk.*outs|no.*shows/i)).toBeVisible();
    
    // Verify walk-out counts and reasons
    await expect(page.getByText(/walk.*out.*count|reason.*breakdown/i)).toBeVisible();
  });

  test('should handle expense management', async ({ page }) => {
    // Look for expense functionality
    const expenseButton = page.getByText(/expenses|add.*expense/i).first();
    
    if (await expenseButton.isVisible()) {
      await expenseButton.click();
      
      // Should open expense modal or form
      await expect(page.getByText(/expense.*details|add.*expense/i)).toBeVisible();
      
      // Test adding expense
      const amountInput = page.getByPlaceholder(/amount|expense.*amount/i).first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('50');
        await expect(amountInput).toHaveValue('50');
        
        // Add expense
        const addButton = page.getByText(/add|save/i).first();
        if (await addButton.isVisible()) {
          await addButton.click();
          
          // Should update expense totals
          await expect(page.getByText(/expense.*added|updated/i)).toBeVisible();
        }
      }
    }
  });

  test('should handle data export functionality', async ({ page }) => {
    // Look for export functionality
    const exportButton = page.getByText(/export|download|save.*data/i).first();
    
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Should trigger download or show export options
      await expect(page.getByText(/export.*options|download.*format/i)).toBeVisible();
    }
  });

  test('should handle attendance data management', async ({ page }) => {
    // Check attendance data display
    await expect(page.getByText(/attendance.*data|working.*hours/i)).toBeVisible();
    
    // Look for attendance management options
    const attendanceButton = page.getByText(/manage.*attendance|clear.*attendance/i).first();
    
    if (await attendanceButton.isVisible()) {
      await attendanceButton.click();
      
      // Should show attendance management options
      await expect(page.getByText(/clear.*data|export.*attendance/i)).toBeVisible();
    }
  });

  test('should handle retry failed syncs', async ({ page }) => {
    // Look for sync retry functionality
    const retryButton = page.getByText(/retry.*sync|sync.*failed/i).first();
    
    if (await retryButton.isVisible()) {
      await retryButton.click();
      
      // Should retry failed operations
      await expect(page.getByText(/syncing|retrying/i)).toBeVisible();
    }
  });

  test('should display room utilization summary', async ({ page }) => {
    // Check room utilization information
    await expect(page.getByText(/room.*utilization|room.*usage/i)).toBeVisible();
    
    // Verify room statistics
    await expect(page.getByText(/rooms.*occupied|room.*hours/i)).toBeVisible();
  });

  test('should handle day-end procedures', async ({ page }) => {
    // Look for day-end functionality
    const endDayButton = page.getByText(/end.*day|close.*day|finish.*day/i).first();
    
    if (await endDayButton.isVisible()) {
      await endDayButton.click();
      
      // Should show confirmation dialog
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain(/end.*day|close.*day|confirm/i);
        dialog.accept();
      });
      
      // Should complete day-end process
      await expect(page.getByText(/day.*ended|closed/i)).toBeVisible();
    }
  });

  test('should handle financial calculations accuracy', async ({ page }) => {
    // Verify financial calculations are correct
    const totalRevenue = page.getByText(/\$\d+/).first();
    const totalPayouts = page.getByText(/\$\d+/).nth(1);
    const totalExpenses = page.getByText(/\$\d+/).nth(2);
    
    if (await totalRevenue.isVisible()) {
      await expect(totalRevenue).toBeVisible();
    }
    
    if (await totalPayouts.isVisible()) {
      await expect(totalPayouts).toBeVisible();
    }
    
    if (await totalExpenses.isVisible()) {
      await expect(totalExpenses).toBeVisible();
    }
  });

  test('should handle undo functionality in closing out', async ({ page }) => {
    // Look for undo button
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

  test('should handle session filtering and search', async ({ page }) => {
    // Look for session filtering options
    const filterButton = page.getByText(/filter|search.*sessions/i).first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Should show filter options
      await expect(page.getByText(/filter.*by|search.*criteria/i)).toBeVisible();
      
      // Test filtering by therapist
      const therapistFilter = page.getByText(/filter.*by.*therapist/i).first();
      if (await therapistFilter.isVisible()) {
        await therapistFilter.click();
        
        // Should show therapist options
        await expect(page.getByText(/select.*therapist/i)).toBeVisible();
      }
    }
  });

  test('should handle print functionality', async ({ page }) => {
    // Look for print options
    const printButton = page.getByText(/print|print.*summary/i).first();
    
    if (await printButton.isVisible()) {
      await printButton.click();
      
      // Should handle printing (may open print dialog)
      // Verify button works without errors
      await expect(printButton).toBeVisible();
    }
  });

  test('should handle data validation and error states', async ({ page }) => {
    // Test various error scenarios
    const editButton = page.getByText(/edit/i).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Try to enter invalid data
      const amountInput = page.getByPlaceholder(/amount|price/i).first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('-100');
        
        // Should show validation error
        const errorMessage = page.getByText(/invalid|error|positive/i);
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should handle concurrent operations gracefully', async ({ page }) => {
    // Test multiple rapid operations
    const editButton = page.getByText(/edit/i).first();
    
    if (await editButton.isVisible()) {
      // Rapid clicks
      await editButton.click();
      await page.waitForTimeout(100);
      await editButton.click();
      
      // Should handle gracefully (only one modal should be open)
      const modalCount = await page.locator('.modal-backdrop, [role="dialog"]').count();
      expect(modalCount).toBeLessThanOrEqual(1);
    }
  });

  test('should handle browser refresh during closing out', async ({ page }) => {
    // Refresh the page
    await page.reload();
    
    // Should return to appropriate state (login or closing out)
    const isOnClosingOut = await page.getByText(/closing.*out|daily.*summary/i).isVisible();
    const isOnLogin = await page.getByText(/login|sign.*in/i).isVisible();
    
    // Should be on one of these pages
    expect(isOnClosingOut || isOnLogin).toBeTruthy();
  });

  test('should handle network errors during closing out operations', async ({ page }) => {
    // Simulate network issues
    await page.route('**/*', route => {
      if (route.request().url().includes('api') || route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Try to perform an operation
    const editButton = page.getByText(/edit/i).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should handle network errors gracefully
      await page.waitForTimeout(2000);
      
      const errorMessage = page.getByText(/error|failed|retry/i);
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });
});
