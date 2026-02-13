# Vendor Portal Testing Guide

## Overview

This guide provides comprehensive information about testing the vendor portal implementation, including configuration, utilities, and best practices.

## Test Configuration

### Vitest Configuration

The project uses Vitest as the test runner with the following configuration:

**Location**: `frontend/vitest.config.ts`

**Key Features**:
- **Environment**: jsdom (for React component testing)
- **Global APIs**: Enabled (describe, it, expect, etc.)
- **Coverage**: v8 provider with HTML, JSON, and LCOV reports
- **Timeout**: 30 seconds for integration tests
- **Parallel Execution**: Up to 4 threads
- **Mock Reset**: Automatic mock cleanup between tests

### Test Setup

**Location**: `frontend/src/__tests__/setup.ts`

**Polyfills Provided**:
- `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`
- `scrollIntoView`
- `ResizeObserver`
- `IntersectionObserver`
- `matchMedia`
- `getComputedStyle`
- `localStorage` and `sessionStorage`

## Test Utilities

### Vendor Test Utilities

**Location**: `frontend/src/__tests__/utils/vendorTestUtils.tsx`

#### Mock Data

```typescript
import {
  mockVendorUser,
  mockVendorToken,
  mockQuote,
  mockVendorStats,
  mockQuoteMessage,
} from '@/__tests__/utils';
```

#### Custom Render Function

```typescript
import { renderWithProviders } from '@/__tests__/utils';

// Render with all required providers
const { getByText, queryByText } = renderWithProviders(
  <YourComponent />,
  {
    initialRoute: '/vendor/dashboard',
    queryClient: createTestQueryClient(),
    vendorAuthValue: { user: mockVendorUser, token: mockVendorToken },
  }
);
```

#### API Mocking

```typescript
import { mockApiResponse, mockApiError } from '@/__tests__/utils';

// Mock successful API response
vi.mock('@/services/api/vendorApi', () => ({
  getQuotes: vi.fn(() => mockApiResponse({ data: [mockQuote] })),
}));

// Mock API error
vi.mock('@/services/api/vendorApi', () => ({
  getQuotes: vi.fn(() => mockApiError('Failed to fetch quotes', 500)),
}));
```

#### Test Data Generators

```typescript
import { generators } from '@/__tests__/utils';

const uuid = generators.uuid();
const quoteNumber = generators.quoteNumber(); // Q-2024-0001
const orderNumber = generators.orderNumber(); // ORD-2024-0001
const email = generators.email(); // test-abc123@example.com
const phone = generators.phone(); // +1234567890
const companyName = generators.companyName(); // Global Solutions
```

#### Helper Functions

```typescript
import {
  waitForLoadingToFinish,
  waitForElement,
  waitForElementToDisappear,
  getFormErrors,
  hasFormErrors,
  changeInput,
  submitForm,
} from '@/__tests__/utils';

// Wait for loading states
await waitForLoadingToFinish();

// Wait for specific element
await waitForElement('[data-testid="quote-card"]');

// Check form errors
const errors = getFormErrors();
expect(hasFormErrors()).toBe(true);

// Simulate form input
const input = screen.getByLabelText('Email');
await changeInput(input, 'vendor@test.com');

// Submit form
const form = screen.getByRole('form');
await submitForm(form);
```

## Running Tests

### All Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test -- --watch
```

### UI Mode

```bash
npm run test:ui
```

### Coverage Report

```bash
npm run test:coverage
```

### Specific Test File

```bash
npm run test -- src/__tests__/unit/pages/vendor/VendorDashboard.test.tsx
```

### Specific Test Pattern

```bash
npm run test -- --grep "VendorDashboard"
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, mockVendorUser, screen } from '@/__tests__/utils';
import VendorDashboard from '@/pages/vendor/VendorDashboard';

describe('VendorDashboard', () => {
  it('should render dashboard with vendor name', () => {
    renderWithProviders(<VendorDashboard />, {
      vendorAuthValue: { user: mockVendorUser, token: 'test-token' },
    });

    expect(screen.getByText(mockVendorUser.vendor.company_name)).toBeInTheDocument();
  });

  it('should display statistics cards', async () => {
    renderWithProviders(<VendorDashboard />);

    await waitForLoadingToFinish();

    expect(screen.getByText('Total Quotes')).toBeInTheDocument();
    expect(screen.getByText('Pending Quotes')).toBeInTheDocument();
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, mockApiResponse, mockQuote } from '@/__tests__/utils';
import VendorQuoteList from '@/pages/vendor/VendorQuoteList';
import * as vendorApi from '@/services/api/vendorApi';

describe('VendorQuoteList Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and display quotes', async () => {
    const getQuotesSpy = vi.spyOn(vendorApi, 'getQuotes')
      .mockResolvedValue(mockApiResponse({
        data: [mockQuote],
        meta: { total: 1, current_page: 1 },
      }));

    const { getByText } = renderWithProviders(<VendorQuoteList />);

    await waitForLoadingToFinish();

    expect(getQuotesSpy).toHaveBeenCalledTimes(1);
    expect(getByText(mockQuote.quote_number)).toBeInTheDocument();
  });
});
```

### Component Test with User Interaction

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/utils';
import QuoteResponseForm from '@/components/vendor/QuoteResponseForm';

describe('QuoteResponseForm', () => {
  it('should handle accept quote submission', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <QuoteResponseForm quoteId="123" onSubmit={onSubmit} />
    );

    // Click accept button
    const acceptButton = screen.getByText('Accept Quote');
    await user.click(acceptButton);

    // Fill in delivery days
    const deliveryInput = screen.getByLabelText('Estimated Delivery Days');
    await user.type(deliveryInput, '7');

    // Submit form
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith({
      type: 'accept',
      estimated_delivery_days: 7,
    });
  });
});
```

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', () => { ... });

// ✅ Good
it('should display error message when login fails', () => { ... });
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update quote status', async () => {
  // Arrange
  const mockQuote = createMockQuote({ status: 'sent' });
  renderWithProviders(<QuoteCard quote={mockQuote} />);

  // Act
  const acceptButton = screen.getByText('Accept');
  await userEvent.click(acceptButton);

  // Assert
  expect(screen.getByText('Accepted')).toBeInTheDocument();
});
```

### 3. Clean Up After Tests

```typescript
import { afterEach, vi } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});
```

### 4. Use Testing Library Queries Properly

```typescript
// ❌ Avoid querySelector
const button = container.querySelector('.submit-button');

// ✅ Use semantic queries
const button = screen.getByRole('button', { name: /submit/i });
```

### 5. Test User Behavior, Not Implementation

```typescript
// ❌ Testing implementation details
expect(component.state.isLoading).toBe(false);

// ✅ Testing user-visible behavior
expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
```

### 6. Mock External Dependencies

```typescript
// Mock API calls
vi.mock('@/services/api/vendorApi', () => ({
  getQuotes: vi.fn(),
  acceptQuote: vi.fn(),
}));

// Mock router
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => vi.fn(),
}));
```

### 7. Use Async Utilities

```typescript
import { waitFor, screen } from '@testing-library/react';

// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});
```

## Coverage Goals

### Target Coverage

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **E2E Tests**: Critical user flows

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html
```

### Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: `coverage/index.html` (interactive browser view)
- **JSON**: `coverage/coverage-final.json` (for CI/CD)
- **LCOV**: `coverage/lcov.info` (for code coverage tools)
- **Text**: Console output (summary)

## Debugging Tests

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test", "--", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Debug in Browser

```bash
npm run test:ui
```

Then open `http://localhost:51205` in your browser.

### Console Logging

```typescript
import { screen, debug } from '@testing-library/react';

// Print entire DOM
debug();

// Print specific element
debug(screen.getByRole('button'));
```

## Common Issues

### Issue: "Cannot find module"

**Solution**: Check import paths and ensure files exist.

```typescript
// Use @ alias for src imports
import { VendorDashboard } from '@/pages/vendor/VendorDashboard';
```

### Issue: "Element not found"

**Solution**: Use `waitFor` for async elements.

```typescript
await waitFor(() => {
  expect(screen.getByText('Quote Details')).toBeInTheDocument();
});
```

### Issue: "Act warnings"

**Solution**: Wrap state updates in `act()` or use `waitFor`.

```typescript
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### Issue: "Mock not working"

**Solution**: Ensure mocks are defined before imports.

```typescript
// ✅ Mock before import
vi.mock('@/services/api/vendorApi');
import { getQuotes } from '@/services/api/vendorApi';

// ❌ Import before mock
import { getQuotes } from '@/services/api/vendorApi';
vi.mock('@/services/api/vendorApi');
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test

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
        run: npm install
      
      - name: Run tests
        run: npm run test:run
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)

## Support

For questions or issues:
1. Check this guide first
2. Review existing tests for examples
3. Check Vitest/Testing Library documentation
4. Ask the development team

---

**Last Updated**: February 11, 2026
**Maintainer**: Development Team
