# Quote Management E2E Tests

## Overview

Comprehensive end-to-end tests for the Quote Management Workflow using Playwright. These tests validate the complete user journey from quote creation through acceptance/rejection, including duplicate prevention and order status integration.

## Test Coverage

### 1. Quote Creation Flow
- ✅ Create new quote from order detail page
- ✅ Validate required fields in quote form
- ✅ Submit quote with vendor, amount, items, and terms
- ✅ Verify quote appears in list after creation

### 2. Edit Existing Quote Flow (Duplicate Prevention)
- ✅ Open existing quote in edit mode when creating quote for same order
- ✅ Update existing quote successfully
- ✅ Verify form pre-population with existing data
- ✅ Verify "Update" button instead of "Create" button

### 3. Quote Acceptance Flow
- ✅ Accept quote and update order status
- ✅ Prevent accepting expired quotes
- ✅ Auto-reject other quotes when accepting one
- ✅ Verify order status advances to "customer_quote"

### 4. Quote Rejection Flow
- ✅ Reject quote with valid reason (minimum 10 characters)
- ✅ Validate minimum rejection reason length
- ✅ Update order status when all quotes rejected
- ✅ Show rejection history in quote timeline

### 5. Duplicate Prevention
- ✅ Prevent creating duplicate quotes for same order and vendor
- ✅ Allow creating quote for different vendor on same order
- ✅ Ignore rejected quotes when checking for duplicates
- ✅ Show loading state while checking for duplicates

### 6. Quote List and Filtering
- ✅ Display quotes list with all columns
- ✅ Filter quotes by status
- ✅ Search quotes by order or vendor
- ✅ Navigate to quote detail from list
- ✅ Show quote count badge in navigation

### 7. Quote Notifications and Dashboard Widget
- ✅ Display pending quotes in dashboard widget
- ✅ Navigate from dashboard widget to quote detail

### 8. Quote Counter Offer Flow
- ✅ Create counter offer for a quote
- ✅ Show current price and new price comparison
- ✅ Update quote status to "countered"

## Test Statistics

- **Total Tests**: 23 test scenarios
- **Browsers**: 5 (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
- **Total Test Executions**: 115 (23 tests × 5 browsers)
- **Test File**: `quote-management.spec.ts`

## Running Tests

### Run All Quote Management Tests
```bash
cd frontend
npx playwright test quote-management
```

### Run Specific Test Suite
```bash
# Quote Creation Flow only
npx playwright test quote-management -g "Quote Creation Flow"

# Quote Acceptance Flow only
npx playwright test quote-management -g "Quote Acceptance Flow"

# Duplicate Prevention only
npx playwright test quote-management -g "Duplicate Prevention"
```

### Run on Specific Browser
```bash
# Chromium only
npx playwright test quote-management --project=chromium

# Firefox only
npx playwright test quote-management --project=firefox

# Mobile Chrome only
npx playwright test quote-management --project="Mobile Chrome"
```

### Run in UI Mode (Interactive)
```bash
npx playwright test quote-management --ui
```

### Run in Debug Mode
```bash
npx playwright test quote-management --debug
```

### Run with Headed Browser (See the browser)
```bash
npx playwright test quote-management --headed
```

## View Test Results

### HTML Report
```bash
npx playwright show-report
```

### JSON Report
```bash
cat test-results/results.json
```

### JUnit Report (for CI/CD)
```bash
cat test-results/results.xml
```

## Prerequisites

### 1. Backend API Running
```bash
cd backend
php artisan serve
# Should be running on http://localhost:8000
```

### 2. Frontend Dev Server Running
```bash
cd frontend
npm run dev
# Should be running on http://localhost:8080
```

### 3. Test Data Seeded
Ensure the database has:
- Test tenant configured
- Orders in various statuses (vendor_sourcing, customer_quote, etc.)
- Vendors configured
- Existing quotes (draft, open, sent, rejected, accepted)
- Test user: `admin@etchinx.com` / `DemoAdmin2024!`

### 4. Database Migrations
```bash
cd backend
php artisan migrate:fresh --seed
```

## Test Data Requirements

### Orders
- At least 5 orders in different statuses
- Orders with single quotes
- Orders with multiple quotes
- Orders with no quotes

### Quotes
- Draft quotes (editable)
- Open quotes (can be accepted/rejected)
- Sent quotes (awaiting vendor response)
- Rejected quotes (for duplicate check testing)
- Accepted quotes (read-only)
- Expired quotes (for validation testing)

### Vendors
- At least 3 vendors configured
- Vendors with existing quotes
- Vendors without quotes

## Test Patterns

### 1. Conditional Testing
Tests handle scenarios where data may or may not exist:
```typescript
if (await element.count() > 0) {
  // Perform test actions
}
```

### 2. Wait Strategies
```typescript
// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for specific element
await expect(element).toBeVisible({ timeout: 5000 });

// Wait for UI updates
await page.waitForTimeout(1000);
```

### 3. Flexible Selectors
```typescript
// Prefer data-testid
page.locator('[data-testid="quote-item"]')

// Use role-based selectors
page.getByRole('button', { name: /accept/i })

// Text-based with regex
page.getByText(/quote created successfully/i)

// Fallback with .or()
element.or(fallbackElement)
```

### 4. User Flow Simulation
```typescript
test('should complete workflow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@etchinx.com');
  await page.fill('[name="password"]', 'DemoAdmin2024!');
  await page.click('button[type="submit"]');
  
  // 2. Navigate
  await page.click('text=Orders');
  
  // 3. Interact
  await page.click('[data-testid="order-item"]');
  
  // 4. Verify
  await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/);
});
```

## Debugging Failed Tests

### 1. View Screenshots
Failed tests automatically capture screenshots:
```bash
ls test-results/*/test-failed-*.png
```

### 2. View Videos
Failed tests record videos:
```bash
ls test-results/*/video.webm
```

### 3. View Traces
View detailed trace of failed test:
```bash
npx playwright show-trace test-results/*/trace.zip
```

### 4. Run Single Test in Debug Mode
```bash
npx playwright test quote-management -g "should accept a quote" --debug
```

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    cd frontend
    npx playwright test quote-management
    
- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

### GitLab CI Example
```yaml
e2e-tests:
  script:
    - cd frontend
    - npx playwright test quote-management
  artifacts:
    when: always
    paths:
      - frontend/playwright-report/
      - frontend/test-results/
```

## Performance Considerations

### Test Execution Time
- **Single Browser**: ~5-10 minutes
- **All Browsers (5)**: ~15-30 minutes (parallel execution)
- **CI Environment**: Add 2x time for slower machines

### Optimization Tips
1. Run critical tests first
2. Use `--workers=4` for parallel execution
3. Skip visual tests in CI (use `--grep-invert visual`)
4. Cache Playwright browsers in CI

## Maintenance

### Updating Tests
When UI changes:
1. Update selectors in test file
2. Update expected text/labels
3. Re-run tests to verify
4. Update this README if test coverage changes

### Adding New Tests
1. Follow existing test patterns
2. Use descriptive test names
3. Add to appropriate test suite
4. Update this README with new coverage

## Troubleshooting

### Tests Fail with "Element not found"
- Check if backend API is running
- Verify test data exists in database
- Check if selectors match actual UI
- Increase timeout for slow operations

### Tests Fail with "Timeout"
- Increase global timeout in `playwright.config.ts`
- Check network speed
- Verify backend is responding quickly
- Use `waitForLoadState('networkidle')`

### Tests Pass Locally but Fail in CI
- Check CI environment has sufficient resources
- Verify database seeding in CI
- Check for timing issues (add waits)
- Review CI logs for specific errors

## Best Practices

1. ✅ **Always login before each test** (use `beforeEach`)
2. ✅ **Use data-testid for stable selectors**
3. ✅ **Handle conditional scenarios** (data may not exist)
4. ✅ **Wait for network idle** before assertions
5. ✅ **Use descriptive test names**
6. ✅ **Test user flows, not implementation details**
7. ✅ **Keep tests independent** (no test depends on another)
8. ✅ **Clean up test data** (if creating new records)

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Quote Management Architecture](../../../docs/DEVELOPMENT/QUOTE_MANAGEMENT_ARCHITECTURE.md)
- [Quote Management User Guide](../../../docs/USER_DOCUMENTATION/TENANTS/QUOTE_MANAGEMENT_GUIDE.md)
- [Task 4.4 Completion Summary](../../../.kiro/specs/quote-management-workflow/TASK_4.4_COMPLETION_SUMMARY.md)

## Support

For issues or questions:
1. Check this README first
2. Review test output and screenshots
3. Check Playwright documentation
4. Review related documentation above
5. Contact development team

---

**Last Updated**: 2026-02-02  
**Test Coverage**: 23 scenarios across 8 test suites  
**Status**: ✅ All tests implemented and ready to run
