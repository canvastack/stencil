# Playwright E2E Testing Guide

This directory contains end-to-end (E2E) tests for the vendor portal using Playwright.

## Overview

Playwright is configured to test the vendor portal across multiple browsers and devices:
- **Desktop Browsers**: Chrome, Firefox, Safari
- **Mobile Devices**: Pixel 5 (Android), iPhone 12 (iOS)
- **Tablet Devices**: iPad Pro

## Configuration

The Playwright configuration is located at `frontend/playwright.config.ts` and includes:

### Browser Configuration
- **Chromium**: Desktop Chrome with web security disabled for testing
- **Firefox**: Desktop Firefox with custom user preferences
- **WebKit**: Desktop Safari
- **Mobile Chrome**: Pixel 5 emulation
- **Mobile Safari**: iPhone 12 emulation
- **Tablet**: iPad Pro emulation

### Test Settings
- **Base URL**: `http://localhost:5173` (configurable via `PLAYWRIGHT_BASE_URL`)
- **Timeout**: 60 seconds per test
- **Action Timeout**: 15 seconds per action
- **Navigation Timeout**: 30 seconds
- **Retries**: 2 retries on CI, 0 locally
- **Parallel Execution**: Enabled (1 worker on CI, unlimited locally)

### Screenshots & Videos
- **Screenshots**: Captured on failure (full page)
- **Videos**: Recorded on failure (1280x720)
- **Traces**: Collected on first retry (CI) or on failure (local)

### Reporters
- **HTML**: Visual test report (`playwright-report/`)
- **JSON**: Machine-readable results (`test-results/results.json`)
- **JUnit**: CI integration (`test-results/results.xml`)
- **List**: Console output

## Test Fixtures

Custom fixtures are available in `fixtures.ts`:

### Authentication Fixtures
```typescript
import { test, expect } from './fixtures';

test('my test', async ({ authenticatedVendorPage }) => {
  // Page is already logged in as vendor
  await authenticatedVendorPage.goto('/vendor/dashboard');
});
```

### Available Fixtures
- `authenticatedVendorPage`: Page with vendor authentication
- `authenticatedVendorContext`: Browser context with vendor authentication
- `loginAsVendor`: Helper to login as vendor
- `logout`: Helper to logout
- `clearAuth`: Helper to clear authentication
- `waitForNavigation`: Helper to wait for URL changes
- `takeScreenshot`: Helper to take custom screenshots

### Test Credentials
```typescript
import { TEST_CREDENTIALS } from './fixtures';

// Vendor credentials
TEST_CREDENTIALS.vendor.email // 'active-vendor@test.com'
TEST_CREDENTIALS.vendor.password // 'Test@VendorP4ss2026!'
```

### Test URLs
```typescript
import { TEST_URLS } from './fixtures';

await page.goto(TEST_URLS.vendorLogin);
await page.goto(TEST_URLS.vendorDashboard);
```

### Common Assertions
```typescript
import { assertions } from './fixtures';

await assertions.hasVendorNavigation(page);
await assertions.isVendorDashboard(page);
await assertions.isAuthenticated(page);
await assertions.hasErrorMessage(page, /invalid credentials/i);
```

### Common Interactions
```typescript
import { interactions } from './fixtures';

await interactions.fillField(page, /email/i, 'test@example.com');
await interactions.clickButton(page, /submit/i);
await interactions.waitForLoading(page);
```

### API Mocking
```typescript
import { apiMocks } from './fixtures';

await apiMocks.mockLoginSuccess(page);
await apiMocks.mockLoginFailure(page);
await apiMocks.mockQuotesList(page, [/* quotes */]);
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run specific test file
```bash
npx playwright test vendor-auth.spec.ts
```

### Run tests matching pattern
```bash
npx playwright test --grep "login"
```

### Run tests in UI mode (interactive)
```bash
npx playwright test --ui
```

## Writing Tests

### Basic Test Structure
```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/vendor/login');
    await expect(page).toHaveURL(/\/vendor\/login/);
  });
});
```

### Using Authenticated Fixture
```typescript
import { test, expect } from './fixtures';

test('should access dashboard', async ({ authenticatedVendorPage }) => {
  // Already logged in
  await authenticatedVendorPage.goto('/vendor/dashboard');
  await expect(authenticatedVendorPage).toHaveURL(/\/vendor\/dashboard/);
});
```

### Manual Login
```typescript
import { test, expect, TEST_CREDENTIALS } from './fixtures';

test('should login manually', async ({ page, loginAsVendor }) => {
  await loginAsVendor(page);
  await expect(page).toHaveURL(/\/vendor\/dashboard/);
});
```

### Testing Responsive Design
```typescript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/vendor/login');
  // Test mobile-specific behavior
});
```

### Taking Screenshots
```typescript
test('should take screenshot', async ({ page, takeScreenshot }) => {
  await page.goto('/vendor/dashboard');
  await takeScreenshot(page, 'dashboard-view');
});
```

## Best Practices

### 1. Use Semantic Selectors
```typescript
// Good - semantic selectors
await page.getByRole('button', { name: /login/i });
await page.getByLabel(/email/i);
await page.getByPlaceholder(/password/i);

// Avoid - brittle selectors
await page.locator('#submit-btn');
await page.locator('.form-input');
```

### 2. Wait for Elements
```typescript
// Good - explicit waits
await page.waitForSelector('h1');
await expect(page.getByText('Dashboard')).toBeVisible();

// Avoid - arbitrary timeouts
await page.waitForTimeout(5000);
```

### 3. Use Fixtures for Common Setup
```typescript
// Good - use fixtures
test('my test', async ({ authenticatedVendorPage }) => {
  // Already authenticated
});

// Avoid - manual setup in every test
test('my test', async ({ page }) => {
  await page.goto('/vendor/login');
  await page.fill('[name="email"]', 'test@example.com');
  // ... login logic
});
```

### 4. Test User Flows, Not Implementation
```typescript
// Good - test user behavior
test('should allow vendor to accept quote', async ({ authenticatedVendorPage }) => {
  await authenticatedVendorPage.goto('/vendor/quotes');
  await authenticatedVendorPage.getByText('Q-12345').click();
  await authenticatedVendorPage.getByRole('button', { name: /accept/i }).click();
  await expect(authenticatedVendorPage.getByText(/accepted/i)).toBeVisible();
});

// Avoid - testing implementation details
test('should call acceptQuote API', async ({ page }) => {
  // Don't test API calls directly in E2E tests
});
```

### 5. Clean Up After Tests
```typescript
test.afterEach(async ({ page }) => {
  // Clean up test data if needed
  await page.evaluate(() => localStorage.clear());
});
```

## Debugging

### View Test Report
```bash
npx playwright show-report
```

### View Trace
```bash
npx playwright show-trace test-results/trace.zip
```

### Generate Code
```bash
npx playwright codegen http://localhost:5173
```

### Inspector
```bash
npx playwright test --debug
```

## CI/CD Integration

The configuration is optimized for CI environments:
- Retries enabled (2 attempts)
- Single worker for stability
- Traces collected on first retry
- Screenshots and videos on failure
- Multiple report formats (HTML, JSON, JUnit)

### GitHub Actions Example
```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Flaky Tests
- Add explicit waits for dynamic content
- Use `waitForLoadState('networkidle')`
- Increase action timeout

### Browser Not Found
```bash
npx playwright install
```

### Port Already in Use
- Change port in `playwright.config.ts`
- Kill existing dev server process

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Debugging Guide](https://playwright.dev/docs/debug)
