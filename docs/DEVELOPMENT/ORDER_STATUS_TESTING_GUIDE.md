# Order Status Workflow Testing Guide

## Overview

This document provides comprehensive testing guidelines for the Order Status Workflow UX components. The testing strategy covers unit tests, integration tests, accessibility tests, and end-to-end tests to ensure reliability, usability, and maintainability.

## Testing Architecture

### Testing Stack

- **Unit Testing**: Vitest + React Testing Library
- **Integration Testing**: React Testing Library + MSW (Mock Service Worker)
- **E2E Testing**: Playwright
- **Accessibility Testing**: @testing-library/jest-dom + axe-core
- **Visual Regression**: Playwright + Chromatic
- **Performance Testing**: Lighthouse CI

### Test Structure

```
frontend/src/components/orders/__tests__/
├── unit/
│   ├── EnhancedOrderDetailHeader.test.tsx
│   ├── ActionableStageModal.test.tsx
│   ├── StatusActionPanel.test.tsx
│   └── WhatsNextGuidanceSystem.test.tsx
├── integration/
│   ├── OrderStatusWorkflow.test.tsx
│   ├── StatusChangeConfirmationIntegration.test.tsx
│   └── TimelineInteraction.test.tsx
├── accessibility/
│   ├── accessibility.test.tsx
│   ├── keyboard-navigation.test.tsx
│   └── screen-reader.test.tsx
├── performance/
│   ├── component-performance.test.tsx
│   └── bundle-size.test.tsx
└── e2e/
    ├── order-status-workflow.spec.ts
    ├── mobile-responsive.spec.ts
    └── cross-browser.spec.ts
```

## Unit Testing

### Component Testing Patterns

#### Basic Component Rendering

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EnhancedOrderDetailHeader } from '../EnhancedOrderDetailHeader';
import { createMockOrder } from '@/test/factories/orderFactory';

describe('EnhancedOrderDetailHeader', () => {
  const mockOrder = createMockOrder({
    status: OrderStatus.Pending,
    order_number: 'ORD-2024-001',
    total_amount: 150000
  });

  it('renders order information correctly', () => {
    render(<EnhancedOrderDetailHeader order={mockOrder} />);
    
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Rp 150.000')).toBeInTheDocument();
    expect(screen.getByText('Menunggu Review')).toBeInTheDocument();
  });

  it('displays status badge with correct color', () => {
    render(<EnhancedOrderDetailHeader order={mockOrder} />);
    
    const statusBadge = screen.getByRole('status');
    expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('shows loading skeleton when isLoading is true', () => {
    render(<EnhancedOrderDetailHeader order={mockOrder} isLoading={true} />);
    
    expect(screen.getAllByTestId('skeleton')).toHaveLength(8); // 4 metric cards + header elements
  });
});
```

#### User Interaction Testing

```typescript
import userEvent from '@testing-library/user-event';

describe('ActionableStageModal Interactions', () => {
  it('opens stage advancement modal when advance button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnAdvance = vi.fn();
    
    render(
      <ActionableStageModal
        isOpen={true}
        stage={BusinessStage.PENDING}
        currentStatus={OrderStatus.Pending}
        onAdvance={mockOnAdvance}
      />
    );

    const advanceButton = screen.getByRole('button', { name: /advance to next stage/i });
    await user.click(advanceButton);

    expect(screen.getByText('Stage Advancement')).toBeInTheDocument();
  });

  it('validates required fields before allowing advancement', async () => {
    const user = userEvent.setup();
    
    render(<StageAdvancementModal isOpen={true} />);

    const confirmButton = screen.getByRole('button', { name: /confirm advancement/i });
    await user.click(confirmButton);

    expect(screen.getByText('Notes are required')).toBeInTheDocument();
    expect(confirmButton).toBeDisabled();
  });
});
```

#### State Management Testing

```typescript
describe('StatusActionPanel State Management', () => {
  it('updates available transitions when status changes', () => {
    const { rerender } = render(
      <StatusActionPanel currentStatus={OrderStatus.Pending} />
    );

    expect(screen.getByText('Start Vendor Sourcing')).toBeInTheDocument();

    rerender(<StatusActionPanel currentStatus={OrderStatus.VendorSourcing} />);

    expect(screen.getByText('Begin Vendor Negotiation')).toBeInTheDocument();
    expect(screen.queryByText('Start Vendor Sourcing')).not.toBeInTheDocument();
  });

  it('filters actions based on user permissions', () => {
    render(
      <StatusActionPanel 
        currentStatus={OrderStatus.Pending}
        userPermissions={['orders.view']} // No update permission
      />
    );

    expect(screen.queryByText('Advance Stage')).not.toBeInTheDocument();
    expect(screen.getByText('View Timeline')).toBeInTheDocument();
  });
});
```

### Mock Data and Factories

#### Order Factory

```typescript
// test/factories/orderFactory.ts
import { faker } from '@faker-js/faker';
import { Order, OrderStatus } from '@/types/order';

export const createMockOrder = (overrides: Partial<Order> = {}): Order => ({
  id: faker.string.uuid(),
  order_number: faker.string.alphanumeric(10).toUpperCase(),
  status: OrderStatus.Pending,
  payment_status: 'unpaid',
  total_amount: faker.number.int({ min: 50000, max: 500000 }),
  customer: {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number()
  },
  items: [
    {
      product_id: faker.string.uuid(),
      product_name: 'Custom Etching Plate',
      quantity: faker.number.int({ min: 1, max: 5 }),
      specifications: {
        material: 'stainless_steel',
        dimensions: '10x15cm',
        text_content: faker.lorem.sentence()
      },
      pricing: {
        unit_price: 75000,
        total_price: 150000
      }
    }
  ],
  timeline: [],
  created_at: faker.date.recent().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides
});

export const createMockTimeline = (length: number = 5) => {
  return Array.from({ length }, (_, index) => ({
    id: faker.string.uuid(),
    stage: Object.values(BusinessStage)[index % Object.values(BusinessStage).length],
    timestamp: faker.date.recent().toISOString(),
    actor: faker.person.fullName(),
    notes: faker.lorem.sentence(),
    metadata: {
      synthetic: false,
      category: 'user_action'
    }
  }));
};
```

## Integration Testing

### API Integration Testing

```typescript
import { server } from '@/test/mocks/server';
import { rest } from 'msw';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdvanceOrderStage } from '@/hooks/useOrders';
import { createQueryWrapper } from '@/test/utils/queryWrapper';

describe('Order Status API Integration', () => {
  it('successfully advances order stage', async () => {
    server.use(
      rest.post('/api/orders/:orderId/advance', (req, res, ctx) => {
        return res(
          ctx.json({
            success: true,
            data: {
              id: req.params.orderId,
              status: 'vendor_negotiation',
              stage: 'vendor_negotiation'
            }
          })
        );
      })
    );

    const { result } = renderHook(() => useAdvanceOrderStage(), {
      wrapper: createQueryWrapper()
    });

    await act(async () => {
      await result.current.mutateAsync({
        orderId: 'test-order-1',
        toStage: BusinessStage.VENDOR_NEGOTIATION,
        notes: 'Starting negotiation process'
      });
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.post('/api/orders/:orderId/advance', (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            error: {
              code: 'INVALID_STAGE_TRANSITION',
              message: 'Cannot advance to this stage'
            }
          })
        );
      })
    );

    const { result } = renderHook(() => useAdvanceOrderStage(), {
      wrapper: createQueryWrapper()
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          orderId: 'test-order-1',
          toStage: BusinessStage.COMPLETED,
          notes: 'Invalid advancement'
        });
      } catch (error) {
        expect(error.code).toBe('INVALID_STAGE_TRANSITION');
      }
    });
  });
});
```

### Component Integration Testing

```typescript
describe('Order Status Workflow Integration', () => {
  it('completes full status update workflow', async () => {
    const user = userEvent.setup();
    const mockOrder = createMockOrder({ status: OrderStatus.Pending });

    render(
      <QueryClientProvider client={queryClient}>
        <OrderDetailPage orderId={mockOrder.id} />
      </QueryClientProvider>
    );

    // Click on status action panel
    const advanceButton = screen.getByRole('button', { name: /advance stage/i });
    await user.click(advanceButton);

    // Fill advancement modal
    const notesInput = screen.getByLabelText(/notes/i);
    await user.type(notesInput, 'Starting vendor sourcing process');

    const confirmButton = screen.getByRole('button', { name: /confirm advancement/i });
    await user.click(confirmButton);

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/stage advanced successfully/i)).toBeInTheDocument();
    });

    // Verify UI updates
    expect(screen.getByText('Pencarian Vendor')).toBeInTheDocument();
  });
});
```

## Accessibility Testing

### WCAG Compliance Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility Compliance', () => {
  it('EnhancedOrderDetailHeader has no accessibility violations', async () => {
    const { container } = render(
      <EnhancedOrderDetailHeader order={mockOrder} />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ActionableStageModal is accessible with screen readers', async () => {
    render(
      <ActionableStageModal
        isOpen={true}
        stage={BusinessStage.PENDING}
        currentStatus={OrderStatus.Pending}
      />
    );

    // Check ARIA labels
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');

    // Check focus management
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /close/i }));
  });
});
```

### Keyboard Navigation Testing

```typescript
describe('Keyboard Navigation', () => {
  it('supports full keyboard navigation in StatusActionPanel', async () => {
    const user = userEvent.setup();
    
    render(<StatusActionPanel currentStatus={OrderStatus.Pending} />);

    // Tab through interactive elements
    await user.tab();
    expect(screen.getByRole('button', { name: /advance stage/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /add note/i })).toHaveFocus();

    // Test Enter key activation
    await user.keyboard('{Enter}');
    expect(screen.getByText('Add Note')).toBeInTheDocument();
  });

  it('traps focus within modal dialogs', async () => {
    const user = userEvent.setup();
    
    render(
      <ActionableStageModal
        isOpen={true}
        stage={BusinessStage.PENDING}
        currentStatus={OrderStatus.Pending}
      />
    );

    const firstButton = screen.getByRole('button', { name: /close/i });
    const lastButton = screen.getByRole('button', { name: /confirm/i });

    // Focus should start on first element
    expect(firstButton).toHaveFocus();

    // Tab to last element
    await user.tab();
    await user.tab();
    expect(lastButton).toHaveFocus();

    // Tab should wrap to first element
    await user.tab();
    expect(firstButton).toHaveFocus();
  });
});
```

### Screen Reader Testing

```typescript
describe('Screen Reader Support', () => {
  it('announces status changes to screen readers', async () => {
    const { rerender } = render(
      <EnhancedOrderDetailHeader order={mockOrder} />
    );

    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-label', 'Current order status: Menunggu Review');

    // Simulate status change
    const updatedOrder = { ...mockOrder, status: OrderStatus.VendorSourcing };
    rerender(<EnhancedOrderDetailHeader order={updatedOrder} />);

    expect(statusElement).toHaveAttribute('aria-label', 'Current order status: Pencarian Vendor');
  });

  it('provides descriptive labels for interactive elements', () => {
    render(<StatusActionPanel currentStatus={OrderStatus.Pending} />);

    const advanceButton = screen.getByRole('button', { name: /advance stage/i });
    expect(advanceButton).toHaveAttribute('aria-describedby');
    
    const description = document.getElementById(advanceButton.getAttribute('aria-describedby'));
    expect(description).toHaveTextContent(/advance order to next stage/i);
  });
});
```

## Performance Testing

### Component Performance

```typescript
import { renderPerformance } from '@/test/utils/performanceUtils';

describe('Component Performance', () => {
  it('EnhancedOrderDetailHeader renders within performance budget', async () => {
    const metrics = await renderPerformance(() => 
      render(<EnhancedOrderDetailHeader order={mockOrder} />)
    );

    expect(metrics.renderTime).toBeLessThan(100); // 100ms budget
    expect(metrics.memoryUsage).toBeLessThan(5 * 1024 * 1024); // 5MB budget
  });

  it('handles large timeline datasets efficiently', async () => {
    const largeTimeline = createMockTimeline(1000);
    const mockOrderWithLargeTimeline = {
      ...mockOrder,
      timeline: largeTimeline
    };

    const startTime = performance.now();
    render(<EnhancedTimelineTab timeline={largeTimeline} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(200); // 200ms budget for large datasets
  });
});
```

### Bundle Size Testing

```typescript
describe('Bundle Size', () => {
  it('core components stay within size budget', async () => {
    const bundleAnalysis = await analyzeBundleSize([
      'EnhancedOrderDetailHeader',
      'ActionableStageModal',
      'StatusActionPanel'
    ]);

    expect(bundleAnalysis.gzippedSize).toBeLessThan(85 * 1024); // 85KB budget
    expect(bundleAnalysis.dependencies.length).toBeLessThan(20); // Dependency limit
  });
});
```

## End-to-End Testing

### Playwright E2E Tests

```typescript
// e2e/order-status-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Order Status Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/orders/test-order-1');
    await page.waitForLoadState('networkidle');
  });

  test('completes order status advancement workflow', async ({ page }) => {
    // Verify initial state
    await expect(page.getByText('Menunggu Review')).toBeVisible();

    // Click advance button
    await page.getByRole('button', { name: /advance stage/i }).click();

    // Fill advancement form
    await page.getByLabel(/notes/i).fill('Starting vendor sourcing process');
    await page.getByRole('button', { name: /confirm advancement/i }).click();

    // Verify success
    await expect(page.getByText(/stage advanced successfully/i)).toBeVisible();
    await expect(page.getByText('Pencarian Vendor')).toBeVisible();
  });

  test('handles validation errors gracefully', async ({ page }) => {
    await page.getByRole('button', { name: /advance stage/i }).click();
    
    // Try to confirm without required fields
    await page.getByRole('button', { name: /confirm advancement/i }).click();

    await expect(page.getByText('Notes are required')).toBeVisible();
    await expect(page.getByRole('button', { name: /confirm advancement/i })).toBeDisabled();
  });
});
```

### Mobile Responsive Testing

```typescript
test.describe('Mobile Responsiveness', () => {
  test('order header adapts to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/admin/orders/test-order-1');

    // Verify mobile layout
    const header = page.getByRole('region', { name: /order detail header/i });
    await expect(header).toBeVisible();

    // Check metric cards stack vertically
    const metricCards = page.getByRole('article');
    const firstCard = metricCards.first();
    const secondCard = metricCards.nth(1);

    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();

    expect(secondCardBox.y).toBeGreaterThan(firstCardBox.y + firstCardBox.height);
  });

  test('modal dialogs are touch-friendly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/orders/test-order-1');

    await page.getByRole('button', { name: /advance stage/i }).click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check button sizes are touch-friendly (minimum 44px)
    const buttons = modal.getByRole('button');
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });
});
```

## Visual Regression Testing

### Chromatic Integration

```typescript
// .storybook/main.ts
export default {
  stories: ['../src/components/orders/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@chromatic-com/storybook'],
};

// EnhancedOrderDetailHeader.stories.tsx
export default {
  title: 'Orders/EnhancedOrderDetailHeader',
  component: EnhancedOrderDetailHeader,
  parameters: {
    chromatic: { 
      viewports: [320, 768, 1200],
      delay: 300 // Wait for animations
    }
  }
};

export const Default = {
  args: {
    order: createMockOrder()
  }
};

export const Loading = {
  args: {
    order: createMockOrder(),
    isLoading: true
  }
};

export const DarkMode = {
  args: {
    order: createMockOrder()
  },
  parameters: {
    backgrounds: { default: 'dark' }
  }
};
```

## Test Utilities and Helpers

### Query Client Wrapper

```typescript
// test/utils/queryWrapper.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

export const createQueryWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

### Custom Render Function

```typescript
// test/utils/customRender.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createQueryWrapper } from './queryWrapper';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const QueryWrapper = createQueryWrapper();
  
  return (
    <BrowserRouter>
      <QueryWrapper>
        {children}
      </QueryWrapper>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Order Status Components

on:
  push:
    paths:
      - 'frontend/src/components/orders/**'
      - 'frontend/src/utils/**'
  pull_request:
    paths:
      - 'frontend/src/components/orders/**'
      - 'frontend/src/utils/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:accessibility
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Test Coverage Requirements

### Coverage Targets

- **Unit Tests**: 90% line coverage, 85% branch coverage
- **Integration Tests**: 80% critical path coverage
- **Accessibility Tests**: 100% component coverage
- **E2E Tests**: 100% user workflow coverage

### Coverage Reporting

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 90,
        statements: 90
      },
      include: ['src/components/orders/**'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.stories.{ts,tsx}',
        '**/types.ts'
      ]
    }
  }
});
```

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to group related functionality
2. **Clear Test Names**: Use descriptive test names that explain the expected behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases
4. **Single Responsibility**: Each test should verify one specific behavior

### Mock Strategy

1. **Mock External Dependencies**: Mock API calls, external libraries, and complex utilities
2. **Avoid Over-Mocking**: Don't mock components being tested or simple utilities
3. **Use Factories**: Create reusable mock data factories for consistent test data
4. **Reset Mocks**: Clean up mocks between tests to avoid interference

### Performance Testing

1. **Set Budgets**: Define performance budgets for render time and memory usage
2. **Test Large Datasets**: Verify performance with realistic data volumes
3. **Monitor Bundle Size**: Track component bundle size to prevent bloat
4. **Profile Regularly**: Use browser dev tools to identify performance bottlenecks

This comprehensive testing guide ensures that the Order Status Workflow components are thoroughly tested, reliable, and maintainable. The multi-layered testing approach provides confidence in the system's functionality, accessibility, and performance.