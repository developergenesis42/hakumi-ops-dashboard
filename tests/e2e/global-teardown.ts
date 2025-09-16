import { chromium } from '@playwright/test';

async function globalTeardown() {
  console.log('🧹 Starting E2E test suite teardown...');
  
  // Launch browser for cleanup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to app and clean up test data
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Clear all test data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🧹 Cleared all test data');
    
    // Optional: Generate test summary
    console.log('📊 Test suite execution completed');
    
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Don't throw error in teardown to avoid masking test failures
  } finally {
    await browser.close();
  }
  
  console.log('✅ E2E test suite teardown completed');
}

export default globalTeardown;
