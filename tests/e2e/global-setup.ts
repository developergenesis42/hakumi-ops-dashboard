import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Starting E2E test suite setup...');
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for dev server to be ready
    console.log('⏳ Waiting for development server...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Verify the app loads
    await page.waitForSelector('text=🧪 Test Admin Login', { timeout: 30000 });
    console.log('✅ Development server is ready');
    
    // Optional: Set up test data or perform any global setup
    console.log('📊 Setting up test environment...');
    
    // Clear any existing test data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    console.log('🧹 Cleared existing test data');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ E2E test suite setup completed');
}

export default globalSetup;
