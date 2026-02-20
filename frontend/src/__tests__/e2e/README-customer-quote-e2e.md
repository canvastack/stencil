# Customer Quote Workflow - E2E Tests

Comprehensive end-to-end tests for the Customer Quote & Approval Workflow using Playwright.

## Overview

These E2E tests validate the complete customer quote workflow from both admin and customer perspectives, ensuring all user interactions work correctly in a real browser environment.

## Test Files

### 1. `customer-quote-workflow.spec.ts` - Admin Perspective
Tests admin-facing functionality for managing customer quotes.

**Test Scenarios:**
- ✅ Admin creates and sends customer quote
- ✅ Admin views pending approvals
- ✅ Admin approves pending quote
- ✅ Admin rejects pending quote
- ✅ Admin generates quotation document
- ✅ Admin views negotiation history
- ✅ Admin responds to counter offer
- ✅ Admin configures approval settings

**Key Features Tested:**
- Quote creation form validation
- Quote sending workflow
- Approval/rejection workflow
- Document generation
- Negotiation management
- Settings configuration

### 2. `customer-quote-customer-portal.spec.ts` - Customer Perspective
Tests customer-facing functionality for viewing and responding to quotes.

**Test Scenarios:**
- ✅ Customer views quote via token link
- ✅ Customer accepts quote successfully
- ✅ Customer submits counter offer
- ✅ Customer cannot exceed max negotiation rounds
- ✅ Customer rejects quote with reason
- ✅ Customer cannot interact with expired quote
- ✅ Customer views pricing breakdown
- ✅ Customer downloads quotation PDF
- ✅ Customer views negotiation history
- ✅ Customer receives admin counter offer
- ✅ Invalid token error handling
- ✅ Mobile responsive design

**Key Features Tested:**
- Public quote access via token
- Quote acceptance flow
- Counter offer submission
- Quote rejection
- Pricing transparency
- Document download
- Mobile responsiveness
- Error handling

### 3. `customer-quote-complete-workflow.spec.ts` - Complete Workflows
Tests end-to-end workflows from quote creation to completion.

**Test Scenarios:**
- ✅ Complete workflow: Create → Send → Accept → Approve → Document
- ✅ Complete workflow with negotiation: Counter offer → Admin accepts
- ✅ Complete workflow with rejection: Customer rejects quote
- ✅ Workflow with multiple negotiation rounds (3 rounds)

**Key Features Tested:**
- Full quote lifecycle
- Auto-approval vs manual approval
- Multi-round negotiation
- Quote rejection impact
- Order status updates
- Payment instruction generation

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Run All E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run with UI mode (interactive)
npx playwright test --ui
```

### Run Specific Test Files

```bash
# Admin workflow tests
npx playwright test customer-quote-workflow.spec.ts

# Customer portal tests
npx playwright test customer-quote-customer-portal.spec.ts

# Complete workflow tests
npx playwright test customer-quote-complete-workflow.spec.ts
```

### Run Specific Tests

```bash
# Run by test name
npx playwright test -g "Admin creates and sends customer quote"

# Run by describe block
npx playwright test -g "Customer Quote Workflow - Admin"
```

### Debug Tests

```bash
# Run in debug mode
npx playwright test --debug

# Run specific test in debug mode
npx playwright test -g "Customer accepts quote" --debug

# Generate trace
npx playwright test --trace on
```

## Test Configuration

### Playwright Config

Tests use the project's `playwright.config.ts` configuration:

```typescript
{
  testDir: './src/__tests__/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 12'] } },
  ],
}
```

### Test Data

Tests use predefined test data:

```typescript
const ADMIN_CREDENTIALS = {
  email: 'admin@test-tenant.com',
  password: 'password123',
};

const TEST_CUSTOMER = {
  name: 'E2E Test Customer',
  email: 'e2e-customer@test.com',
  phone: '+62812345678',
};
```

**Note:** Ensure test database is seeded with this data before running tests.

## Test Patterns

### Page Object Pattern

Tests use helper functions for common actions:

```typescript
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
  await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}
```

### Data-TestId Selectors

Tests use `data-testid` attributes for stable selectors:

```typescript
await expect(page.locator('[data-testid="quote-number"]')).toBeVisible();
await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');
```

### Context Isolation

Tests use separate browser contexts to simulate different users:

```typescript
// Admin context
await loginAsAdmin(page);

// Customer context (separate browser context)
const customerContext = await page.context().browser()!.newContext();
const customerPage = await customerContext.newPage();
await customerPage.goto(`/quotes/${token}`);
```

## Test Coverage

### Functional Coverage

- ✅ Quote creation and validation
- ✅ Quote sending and email generation
- ✅ Customer quote viewing (public access)
- ✅ Quote acceptance (auto and manual approval)
- ✅ Counter offer submission and response
- ✅ Multi-round negotiation (up to 3 rounds)
- ✅ Quote rejection handling
- ✅ Document generation (PDF)
- ✅ Document download
- ✅ Quote expiration handling
- ✅ Approval settings configuration
- ✅ Order status updates
- ✅ Payment instruction generation

### UI/UX Coverage

- ✅ Form validation
- ✅ Success/error messages
- ✅ Loading states
- ✅ Modal interactions
- ✅ Button states (enabled/disabled)
- ✅ Mobile responsiveness
- ✅ Pricing breakdown display
- ✅ Negotiation history timeline

### Error Handling Coverage

- ✅ Invalid token handling
- ✅ Expired quote handling
- ✅ Max negotiation rounds exceeded
- ✅ Form validation errors
- ✅ Network error handling

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Failing Locally

1. **Ensure backend is running:**
   ```bash
   cd backend
   php artisan serve
   ```

2. **Ensure frontend is running:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Ensure test database is seeded:**
   ```bash
   cd backend
   php artisan migrate:fresh --seed
   ```

4. **Clear browser cache:**
   ```bash
   npx playwright clean
   ```

### Timeout Issues

If tests timeout, increase timeout in test:

```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ... test code
});
```

### Flaky Tests

If tests are flaky:

1. Add explicit waits:
   ```typescript
   await page.waitForSelector('[data-testid="element"]');
   await page.waitForLoadState('networkidle');
   ```

2. Use retry logic:
   ```typescript
   await expect(async () => {
     await page.reload();
     await expect(page.locator('[data-testid="element"]')).toBeVisible();
   }).toPass({ timeout: 10000 });
   ```

3. Increase retries in config:
   ```typescript
   retries: 3
   ```

## Best Practices

### 1. Use Data-TestId Attributes

```tsx
// Component
<button data-testid="accept-quote-button">Accept Quote</button>

// Test
await page.click('[data-testid="accept-quote-button"]');
```

### 2. Wait for Network Idle

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Use Explicit Assertions

```typescript
// Good
await expect(page.locator('[data-testid="status"]')).toContainText('Accepted');

// Avoid
const text = await page.locator('[data-testid="status"]').textContent();
expect(text).toBe('Accepted');
```

### 4. Clean Up Resources

```typescript
test.afterEach(async ({ context }) => {
  await context.close();
});
```

### 5. Use Descriptive Test Names

```typescript
// Good
test('Admin approves pending quote with approval notes', async ({ page }) => {
  // ...
});

// Avoid
test('test1', async ({ page }) => {
  // ...
});
```

## Related Documentation

- [Requirements](/.kiro/specs/customer-quote-workflow/requirements.md)
- [Tasks](/.kiro/specs/customer-quote-workflow/tasks.md)
- [Integration Tests](/backend/tests/Integration/CustomerQuoteWorkflowTest.php)
- [Playwright Documentation](https://playwright.dev/)

## Maintenance

### Adding New Tests

1. Create test in appropriate file
2. Use existing helper functions
3. Follow naming conventions
4. Add data-testid attributes to components
5. Update this README

### Updating Tests

1. Update test when UI changes
2. Update selectors if needed
3. Update test data if schema changes
4. Run tests locally before committing
5. Update documentation

## Support

For issues or questions:
- Check [Playwright Documentation](https://playwright.dev/)
- Review existing tests for patterns
- Check CI/CD logs for failures
- Contact development team

---

**Last Updated:** 2026-02-19
**Test Count:** 25+ test scenarios
**Coverage:** Admin + Customer + Complete Workflows
