# Testing Setup and Configuration

This document describes the testing infrastructure, polyfills, and best practices for the CanvaStencil frontend.

## Overview

The frontend uses **Vitest** as the test runner with **React Testing Library** for component testing. JSDOM is used as the test environment to simulate browser APIs.

## Test Setup File

**Location**: `src/__tests__/setup.ts`

This file provides:
- JSDOM polyfills for modern browser APIs
- Test utilities and helpers
- Global test configuration

### Polyfills Included

#### 1. Pointer Capture APIs
Required by Radix UI components (Select, Dialog, etc.)

```typescript
Element.prototype.hasPointerCapture
Element.prototype.setPointerCapture
Element.prototype.releasePointerCapture
```

#### 2. Scroll APIs
Required by scroll-based components

```typescript
Element.prototype.scrollIntoView
```

#### 3. Observer APIs
Required by responsive and lazy-loading components

```typescript
ResizeObserver
IntersectionObserver
```

#### 4. Media Query APIs
Required by responsive components

```typescript
window.matchMedia
```

#### 5. Storage APIs
Mock implementations for testing

```typescript
window.localStorage
window.sessionStorage
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- QuoteFormErrorProperty
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Structure

```
frontend/src/__tests__/
├── setup.ts                    # Global test setup and polyfills
├── unit/                       # Unit tests
│   ├── components/            # Component tests
│   │   └── quotes/           # Quote-related component tests
│   ├── hooks/                # Custom hook tests
│   └── utils/                # Utility function tests
├── integration/               # Integration tests
└── e2e/                      # End-to-end tests (Playwright)
```

## Writing Tests

### Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Property-Based Tests

Property-based tests verify that properties hold true for many random inputs:

```typescript
it('Property: Error messages are user-friendly', () => {
  // Run multiple iterations with random inputs
  for (let i = 0; i < 10; i++) {
    const randomError = generateRandomError();
    const result = parseError(randomError);
    
    // Property: Result should always be user-friendly
    expect(result.message).not.toContain('stack trace');
    expect(result.message.length).toBeGreaterThan(0);
  }
});
```

### Testing with Providers

When testing components that need context providers:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Clean up after tests with `afterEach`

### 2. Avoid Implementation Details
- Test behavior, not implementation
- Use accessible queries (getByRole, getByLabelText)
- Avoid testing internal state

### 3. Property-Based Testing
- Use for testing invariants and properties
- Run multiple iterations with random inputs
- Focus on logic, not UI rendering

### 4. Mock External Dependencies
- Mock API calls
- Mock browser APIs not available in JSDOM
- Use `vi.fn()` for function mocks

### 5. Async Testing
- Use `waitFor` for async operations
- Use `findBy` queries for elements that appear asynchronously
- Set appropriate timeouts

## Common Issues and Solutions

### Issue: `hasPointerCapture is not a function`
**Solution**: Already fixed by polyfills in `setup.ts`

### Issue: `ResizeObserver is not defined`
**Solution**: Already fixed by polyfills in `setup.ts`

### Issue: Test timeout
**Solution**: 
- Increase timeout in `waitFor`
- Check if async operations are completing
- Verify mocks are set up correctly

### Issue: Component not rendering
**Solution**:
- Check if required providers are wrapped
- Verify props are passed correctly
- Check console for errors

## Test Coverage

Current coverage targets:
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

View coverage report:
```bash
npm test -- --coverage
open coverage/index.html
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment checks

## Related Documentation

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Troubleshooting

### Tests fail locally but pass in CI
- Check Node.js version matches CI
- Clear node_modules and reinstall
- Check for environment-specific issues

### Tests are slow
- Use `--run` flag to disable watch mode
- Reduce number of iterations in property tests
- Mock expensive operations

### Memory leaks in tests
- Ensure cleanup in `afterEach`
- Unmount components after tests
- Clear mocks with `vi.clearAllMocks()`

## Future Improvements

- [ ] Add visual regression testing
- [ ] Implement E2E test suite with Playwright
- [ ] Add performance testing
- [ ] Improve test coverage to 90%
- [ ] Add mutation testing
