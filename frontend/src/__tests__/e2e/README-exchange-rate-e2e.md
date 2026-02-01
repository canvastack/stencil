# Exchange Rate System E2E Tests

This document describes the End-to-End (E2E) tests for the Dynamic Exchange Rate System, implementing task 22 from the specification.

## Test Files

- `exchange-rate-system.spec.ts` - Main E2E test suite covering all four test scenarios

## Test Scenarios

### 22.1 Manual Mode Workflow
**Requirements Validated**: 1.1, 1.2, 1.4, 1.5

**Test Flow**:
1. Admin navigates to exchange rate settings page
2. Admin selects manual mode
3. Admin enters a manual exchange rate (e.g., 15,500 IDR per USD)
4. Admin saves the rate
5. System verifies the rate is applied to currency conversions

**Key Assertions**:
- Manual mode selection is visually confirmed
- Manual rate form appears and accepts input
- Success notification is displayed after saving
- Rate is persisted and used in product/order conversions

### 22.2 Auto Mode with Failover
**Requirements Validated**: 1.3, 1.6, 4.1, 4.2

**Test Flow**:
1. Admin selects automatic mode
2. System displays quota dashboard and provider configuration
3. Test simulates quota exhaustion scenarios
4. System automatically switches to next available provider
5. Appropriate notifications are displayed

**Key Assertions**:
- Auto mode selection shows quota dashboard
- Provider configuration interface is accessible
- Provider switching logic is functional
- Notifications appear for quota warnings and provider switches

### 22.3 Quota Monitoring
**Requirements Validated**: 10.1, 10.2, 10.6

**Test Flow**:
1. Admin views quota monitoring dashboard
2. System displays quota status for all providers
3. Test verifies real-time quota updates
4. Color-coded status indicators are shown

**Key Assertions**:
- Quota information is displayed for each provider
- Progress bars or visual indicators show quota usage
- Next reset date is displayed
- Real-time updates work without page refresh

### 22.4 Audit Trail
**Requirements Validated**: 8.4, 8.5, 8.6

**Test Flow**:
1. Admin navigates to exchange rate history
2. System displays historical records in chronological order
3. Admin applies various filters (date range, provider, event type)
4. System shows filtered results correctly

**Key Assertions**:
- History records are displayed in reverse chronological order
- Date range filtering works correctly
- Provider filtering shows only relevant records
- Event type filtering (rate changes, provider switches, API requests)
- Pagination works if implemented
- Export functionality is accessible

## Prerequisites for Running Tests

### 1. Development Environment Setup
```bash
# Ensure both frontend and backend are running
cd backend
php artisan serve --port=8000

cd frontend
npm run dev
```

### 2. Database Setup
```bash
# Run migrations and seeders for exchange rate system
cd backend
php artisan migrate
php artisan db:seed --class=ExchangeRateProviderSeeder
php artisan db:seed --class=ExchangeRateSettingSeeder
```

### 3. Test User Setup
Ensure the test admin user exists:
- Email: `admin@etchinx.com`
- Password: `DemoAdmin2024!`

### 4. Backend API Endpoints
Verify these endpoints are implemented and accessible:
- `GET /api/tenant/settings/exchange-rate-settings`
- `PUT /api/tenant/settings/exchange-rate-settings`
- `GET /api/tenant/settings/exchange-rate-providers`
- `GET /api/tenant/settings/exchange-rate-providers/quota-status`
- `GET /api/tenant/settings/exchange-rate-history`

## Running the Tests

### Run All Exchange Rate E2E Tests
```bash
cd frontend
npm run e2e -- exchange-rate-system.spec.ts
```

### Run Specific Test Scenario
```bash
# Manual mode workflow only
npm run e2e -- exchange-rate-system.spec.ts -g "22.1 Manual mode workflow"

# Auto mode with failover only
npm run e2e -- exchange-rate-system.spec.ts -g "22.2 Auto mode with failover"

# Quota monitoring only
npm run e2e -- exchange-rate-system.spec.ts -g "22.3 Quota monitoring"

# Audit trail only
npm run e2e -- exchange-rate-system.spec.ts -g "22.4 Audit trail"
```

### Run with Different Browsers
```bash
# Run on specific browser
npm run e2e -- exchange-rate-system.spec.ts --project=chromium
npm run e2e -- exchange-rate-system.spec.ts --project=firefox
npm run e2e -- exchange-rate-system.spec.ts --project=webkit

# Run in headed mode (visible browser)
npm run e2e:headed -- exchange-rate-system.spec.ts
```

## Test Data Requirements

### Frontend Components Expected
The tests expect these components to exist with specific data attributes:

#### Exchange Rate Settings Page
- Route: `/admin/settings/exchange-rate`
- Tabs: "Rate Settings", "API Providers", "History"
- Mode selection buttons: "Manual Mode", "Automatic Mode"

#### Manual Rate Form
- Input: `[aria-label*="Manual Exchange Rate"]`
- Button: `[role="button"][name*="Save Rate"]`

#### Provider Configuration
- Provider cards: `[data-testid="provider-config"]`
- Enable toggles: `[data-testid="provider-enabled"]`
- Quota status: `[data-testid="quota-status"]`

#### Quota Dashboard
- Progress bars: `[data-testid="quota-progress"]`
- Warning indicators: `[data-testid="quota-warning"]`
- Reset date: `[data-testid="next-reset-date"]`

#### History Viewer
- History table: `[data-testid="history-table"]`
- History entries: `[data-testid="history-entry"]`
- Date filters: `[data-testid="date-range-filter"]`
- Provider filters: `[data-testid="provider-filter"]`
- Event type filters: `[data-testid="event-type-filter"]`

### Backend Data Expected
- At least one exchange rate setting record per tenant
- Default providers seeded (exchangerate-api.com, currencyapi.com, etc.)
- Some historical exchange rate records for testing filters
- Quota tracking records for testing dashboard

## Troubleshooting

### Common Issues

1. **Login Timeout**
   - Ensure backend is running on port 8000
   - Verify test credentials exist in database
   - Check if login page route is correct

2. **Page Not Found Errors**
   - Verify exchange rate settings route exists: `/admin/settings/exchange-rate`
   - Check if ExchangeRateSettings component is properly registered

3. **Element Not Found**
   - Verify component data-testid attributes match test expectations
   - Check if components are rendered conditionally based on data

4. **API Errors**
   - Ensure backend exchange rate endpoints are implemented
   - Verify tenant authentication is working
   - Check database migrations are run

### Debug Mode
Run tests with debug output:
```bash
DEBUG=pw:api npm run e2e -- exchange-rate-system.spec.ts
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots: `test-results/*/test-failed-*.png`
- Videos: `test-results/*/video.webm`
- Error context: `test-results/*/error-context.md`

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Exchange Rate E2E Tests
  run: |
    cd frontend
    npm run e2e -- exchange-rate-system.spec.ts --reporter=junit
  env:
    CI: true
```

### Test Reports
Tests generate multiple report formats:
- HTML: `playwright-report/index.html`
- JSON: `test-results/results.json`
- JUnit: `test-results/results.xml`

## Maintenance Notes

### Updating Tests
When exchange rate system components change:

1. Update data-testid attributes in components
2. Update corresponding selectors in test file
3. Verify test scenarios still match requirements
4. Update this documentation

### Adding New Test Scenarios
Follow the existing pattern:
1. Add new test case to `exchange-rate-system.spec.ts`
2. Use descriptive test names matching requirement numbers
3. Add appropriate assertions for the new functionality
4. Update this documentation with new scenario details

## Performance Considerations

### Test Execution Time
- Each test scenario should complete within 30 seconds
- Total suite should complete within 5 minutes
- Use appropriate timeouts for API calls and page loads

### Resource Usage
- Tests run in parallel by default (2 workers)
- Reduce workers in CI environment if needed
- Monitor memory usage for large test suites

## Security Considerations

### Test Data
- Use dedicated test credentials, not production data
- Ensure test database is isolated from production
- Clean up test data after test runs

### API Testing
- Tests should not affect production API quotas
- Use mock API responses for quota exhaustion scenarios
- Verify tenant isolation in multi-tenant tests