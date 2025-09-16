# E2E Test Suite - SPA Operations Dashboard

This directory contains comprehensive end-to-end tests for the SPA Operations Dashboard using Playwright.

## Test Structure

### Test Files

- **`authentication.spec.ts`** - Authentication workflows, login/logout, session management
- **`roster-setup.spec.ts`** - Roster setup functionality, therapist management, validation
- **`session-management.spec.ts`** - Session creation, completion, walk-outs, concurrent sessions
- **`daily-operations.spec.ts`** - Dashboard operations, real-time features, navigation
- **`closing-out.spec.ts`** - Day-end procedures, financial summaries, data export
- **`error-handling.spec.ts`** - Error scenarios, network failures, edge cases
- **`performance-accessibility.spec.ts`** - Performance metrics, accessibility compliance
- **`integration.spec.ts`** - Complete user journeys, cross-feature workflows

### Supporting Files

- **`global-setup.ts`** - Global test setup and environment preparation
- **`global-teardown.ts`** - Global cleanup and test data removal
- **`utils/test-helpers.ts`** - Reusable test utilities and helper functions

## Test Coverage

### Critical User Workflows

1. **Authentication Flow**
   - Login with test credentials
   - Session persistence
   - Logout functionality
   - Cross-tab authentication
   - Error handling

2. **Roster Setup**
   - Therapist search and selection
   - Roster validation
   - Day start procedures
   - Edge cases and error scenarios

3. **Session Management**
   - Session creation workflow
   - Service selection and room assignment
   - Discount application
   - Session completion
   - Walk-out handling
   - Concurrent sessions

4. **Daily Operations**
   - Dashboard real-time updates
   - Therapist status management
   - Room availability tracking
   - Financial metrics display
   - Navigation between phases

5. **Closing Out**
   - Financial summary calculations
   - Session history and editing
   - Expense management
   - Data export functionality
   - Day-end procedures

6. **Error Handling**
   - Network failures
   - Data corruption
   - Concurrent operations
   - Browser compatibility
   - Recovery scenarios

7. **Performance & Accessibility**
   - Page load performance
   - Memory usage optimization
   - ARIA compliance
   - Keyboard navigation
   - Screen reader compatibility
   - Responsive design

8. **Integration Scenarios**
   - Complete day workflow
   - Multi-user scenarios
   - Data persistence
   - Cross-browser compatibility

## Running Tests

### Prerequisites

```bash
# Install Playwright browsers
npm run test:e2e:install

# Install system dependencies (Linux only)
npm run test:e2e:install-deps
```

### Test Execution

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test suites
npm run test:e2e:auth
npm run test:e2e:roster
npm run test:e2e:sessions
npm run test:e2e:dashboard
npm run test:e2e:closing
npm run test:e2e:errors
npm run test:e2e:performance
npm run test:e2e:integration

# Run tests by category
npm run test:e2e:desktop    # Desktop browsers only
npm run test:e2e:mobile     # Mobile browsers only
npm run test:e2e:smoke      # Smoke tests only
npm run test:e2e:critical   # Critical path tests only

# Debug mode
npm run test:e2e:debug
```

### Test Reports

```bash
# View test report
npm run test:e2e:report
```

Reports are generated in:
- `playwright-report/` - HTML report
- `test-results/` - JSON and JUnit reports
- `test-results/screenshots/` - Failure screenshots
- `test-results/videos/` - Failure recordings

## Test Configuration

### Playwright Configuration

The test configuration is defined in `playwright.config.ts`:

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Reporter**: HTML, JSON, JUnit, List
- **Features**: Screenshots, videos, traces on failure
- **Timeouts**: 10s action timeout, 30s navigation timeout
- **Global Setup/Teardown**: Automatic environment management

### Test Environment

- **Base URL**: `http://localhost:5173`
- **Development Server**: Automatically started before tests
- **Test Data**: Automatically cleared between test runs
- **Authentication**: Uses test admin credentials

## Writing Tests

### Using Test Helpers

```typescript
import { createTestHelpers } from './utils/test-helpers';

test('example test', async ({ page }) => {
  const helpers = createTestHelpers(page);
  
  // Complete setup
  await helpers.completeSetup(['Ally', 'Alice']);
  
  // Create session
  await helpers.createSession({
    serviceCategory: 'single',
    servicePackage: '60.*min',
    room: 'shower',
    discount: 10
  });
  
  // Complete session
  await helpers.completeSession();
  
  // Navigate to closing out
  await helpers.navigateToClosingOut();
});
```

### Test Patterns

1. **Setup Pattern**
   ```typescript
   test.beforeEach(async ({ page }) => {
     await page.goto('/');
     // Setup code
   });
   ```

2. **Conditional Testing**
   ```typescript
   const element = page.locator('selector');
   if (await element.isVisible()) {
     await element.click();
   }
   ```

3. **Error Handling**
   ```typescript
   try {
     await page.waitForSelector('selector', { timeout: 5000 });
   } catch (error) {
     // Handle timeout gracefully
   }
   ```

4. **Data Cleanup**
   ```typescript
   test.afterEach(async ({ page }) => {
     await page.evaluate(() => {
       localStorage.clear();
       sessionStorage.clear();
     });
   });
   ```

## Best Practices

### Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names
- Keep tests independent and isolated
- Use appropriate timeouts for different operations

### Selectors

- Prefer semantic selectors (`data-testid`, roles, labels)
- Avoid brittle CSS selectors
- Use text content as fallback
- Handle dynamic content gracefully

### Assertions

- Use Playwright's built-in assertions
- Check for both positive and negative cases
- Verify state changes after actions
- Include accessibility checks

### Performance

- Use `waitForTimeout` sparingly
- Prefer `waitForSelector` and `waitForLoadState`
- Batch related operations
- Clean up resources after tests

## Debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

### Screenshots and Videos

- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- Traces are generated for debugging

### Console Logs

```typescript
// Listen to console messages
page.on('console', msg => console.log(msg.text()));

// Listen to page errors
page.on('pageerror', error => console.error(error.message));
```

### Network Monitoring

```typescript
// Monitor network requests
page.on('request', request => console.log(request.url()));
page.on('response', response => console.log(response.status()));
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    CI: true
```

### Test Reports

- JSON reports for CI integration
- JUnit reports for test result tracking
- HTML reports for detailed analysis

## Maintenance

### Regular Tasks

1. **Update selectors** when UI changes
2. **Review test coverage** for new features
3. **Optimize test performance** by removing flaky waits
4. **Update test data** as application evolves
5. **Monitor test stability** and fix flaky tests

### Test Data Management

- Use consistent test data across tests
- Clean up test data after each test
- Avoid hardcoded values where possible
- Use factories for complex test data

### Performance Monitoring

- Track test execution time
- Monitor resource usage
- Optimize slow tests
- Use parallel execution where appropriate

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout values
   - Check for slow operations
   - Verify element selectors

2. **Flaky tests**
   - Add proper waits
   - Use stable selectors
   - Handle dynamic content

3. **Authentication failures**
   - Check test credentials
   - Verify auth state cleanup
   - Handle session expiration

4. **Network issues**
   - Check development server
   - Verify API endpoints
   - Handle offline scenarios

### Getting Help

- Check Playwright documentation
- Review test logs and screenshots
- Use debug mode for step-by-step execution
- Consult team for application-specific issues
