# Order Status Workflow Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when working with the Order Status Workflow UX components. It covers component rendering issues, API integration problems, performance concerns, and deployment challenges.

## Common Issues and Solutions

### 1. Component Rendering Issues

#### Issue: Components Not Rendering

**Symptoms:**
- Blank screen or missing components
- Console errors about undefined props
- Components showing loading state indefinitely

**Possible Causes & Solutions:**

1. **Missing Required Props**
   ```typescript
   // ❌ Incorrect - missing required props
   <EnhancedOrderDetailHeader />
   
   // ✅ Correct - all required props provided
   <EnhancedOrderDetailHeader 
     order={orderData}
     isLoading={false}
   />
   ```

2. **Invalid Order Data Structure**
   ```typescript
   // Check if order data matches expected interface
   console.log('Order data:', order);
   
   // Verify required fields exist
   if (!order?.id || !order?.status) {
     console.error('Invalid order data structure');
   }
   ```

3. **Permission Issues**
   ```typescript
   // Check user permissions
   const userPermissions = usePermissions();
   console.log('User permissions:', userPermissions);
   
   // Ensure user has required permissions
   if (!userPermissions.includes('orders.view')) {
     console.error('User lacks required permissions');
   }
   ```

**Debug Steps:**
1. Check browser console for JavaScript errors
2. Verify all required props are provided
3. Confirm order data structure matches interface
4. Check user permissions and authentication state
5. Ensure all dependencies are properly imported

#### Issue: Styling Problems

**Symptoms:**
- Components appear unstyled or incorrectly styled
- Layout issues on different screen sizes
- Dark mode not working properly

**Solutions:**

1. **Tailwind CSS Not Loading**
   ```bash
   # Verify Tailwind is properly configured
   npm run build:css
   
   # Check if Tailwind classes are being purged
   npm run build -- --debug
   ```

2. **CSS Conflicts**
   ```css
   /* Check for conflicting CSS rules */
   .order-header {
     /* Ensure specificity doesn't override component styles */
     all: unset; /* Reset if necessary */
   }
   ```

3. **Design System Components Missing**
   ```typescript
   // Ensure all UI components are imported
   import { Card } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { Badge } from '@/components/ui/badge';
   ```

### 2. API Integration Issues

#### Issue: Status Updates Failing

**Symptoms:**
- Status changes don't persist
- Error messages about invalid transitions
- API calls returning 400/500 errors

**Solutions:**

1. **Invalid Stage Transitions**
   ```typescript
   // Check if transition is valid
   const isValidTransition = OrderProgressCalculator.canAdvanceToStage(
     currentStage,
     targetStage
   );
   
   if (!isValidTransition) {
     console.error('Invalid stage transition attempted');
   }
   ```

2. **Missing Required Fields**
   ```typescript
   // Ensure all required fields are provided
   const advanceStageData = {
     orderId: order.id, // Required
     toStage: BusinessStage.VENDOR_NEGOTIATION, // Required
     notes: 'Advancement reason', // Required for some stages
     metadata: {} // Optional
   };
   ```

3. **Authentication Issues**
   ```typescript
   // Check if user is authenticated
   const token = getAuthToken();
   if (!token) {
     console.error('User not authenticated');
     // Redirect to login
   }
   
   // Verify token is valid
   if (isTokenExpired(token)) {
     console.error('Token expired');
     // Refresh token or redirect to login
   }
   ```

#### Issue: Optimistic Updates Not Working

**Symptoms:**
- UI doesn't update immediately
- Changes revert after API call
- Inconsistent state between components

**Solutions:**

1. **Check OptimisticUpdateManager Configuration**
   ```typescript
   // Ensure optimistic updates are properly configured
   const updateId = OptimisticUpdateManager.startUpdate(orderId, {
     toState: { stage: targetStage, status: targetStatus },
     userFeedback: {
       showProgress: true,
       progressMessage: 'Updating order status...'
     }
   });
   ```

2. **Verify Query Key Consistency**
   ```typescript
   // Ensure query keys are consistent across components
   const orderQueryKey = ['orders', orderId];
   const timelineQueryKey = ['orders', orderId, 'timeline'];
   
   // Invalidate related queries after updates
   queryClient.invalidateQueries(['orders', orderId]);
   ```

3. **Handle Rollback Scenarios**
   ```typescript
   try {
     const result = await advanceStage(data);
     OptimisticUpdateManager.confirmUpdate(updateId, result);
   } catch (error) {
     OptimisticUpdateManager.revertUpdate(updateId, error);
     // Show error message to user
   }
   ```

### 3. Performance Issues

#### Issue: Slow Component Rendering

**Symptoms:**
- Components take long time to render
- UI feels sluggish during interactions
- High memory usage

**Solutions:**

1. **Optimize Re-renders**
   ```typescript
   // Use React.memo for expensive components
   const EnhancedOrderDetailHeader = React.memo(({ order, isLoading }) => {
     // Component implementation
   });
   
   // Memoize expensive calculations
   const progressPercentage = useMemo(() => {
     return calculateProgressPercentage(order.status);
   }, [order.status]);
   ```

2. **Implement Virtual Scrolling for Large Lists**
   ```typescript
   // For large timeline datasets
   import { FixedSizeList as List } from 'react-window';
   
   const TimelineList = ({ timeline }) => (
     <List
       height={400}
       itemCount={timeline.length}
       itemSize={80}
       itemData={timeline}
     >
       {TimelineItem}
     </List>
   );
   ```

3. **Lazy Load Heavy Components**
   ```typescript
   // Lazy load modal components
   const ActionableStageModal = lazy(() => 
     import('./ActionableStageModal')
   );
   
   // Use with Suspense
   <Suspense fallback={<ModalSkeleton />}>
     <ActionableStageModal {...props} />
   </Suspense>
   ```

#### Issue: Large Bundle Size

**Symptoms:**
- Slow initial page load
- Large JavaScript bundle
- Poor Lighthouse scores

**Solutions:**

1. **Code Splitting**
   ```typescript
   // Split components by route
   const OrderDetailPage = lazy(() => import('./OrderDetailPage'));
   
   // Split by feature
   const StatusActionPanel = lazy(() => import('./StatusActionPanel'));
   ```

2. **Tree Shaking**
   ```typescript
   // Import only what you need
   import { format } from 'date-fns/format';
   // Instead of: import { format } from 'date-fns';
   
   // Use specific icon imports
   import { CheckCircle2 } from 'lucide-react';
   // Instead of: import * as Icons from 'lucide-react';
   ```

3. **Bundle Analysis**
   ```bash
   # Analyze bundle size
   npm run build:analyze
   
   # Check for duplicate dependencies
   npm run bundle-analyzer
   ```

### 4. Accessibility Issues

#### Issue: Screen Reader Problems

**Symptoms:**
- Screen readers not announcing status changes
- Missing or incorrect ARIA labels
- Poor keyboard navigation

**Solutions:**

1. **Fix ARIA Labels**
   ```typescript
   // Ensure proper ARIA labels
   <Badge 
     role="status"
     aria-label={`Current order status: ${statusLabel}`}
   >
     {statusLabel}
   </Badge>
   ```

2. **Announce Dynamic Changes**
   ```typescript
   // Use live regions for status updates
   <div 
     role="status" 
     aria-live="polite"
     aria-atomic="true"
     className="sr-only"
   >
     {statusChangeAnnouncement}
   </div>
   ```

3. **Improve Focus Management**
   ```typescript
   // Manage focus in modals
   useEffect(() => {
     if (isOpen) {
       const firstFocusable = modalRef.current?.querySelector('[tabindex="0"]');
       firstFocusable?.focus();
     }
   }, [isOpen]);
   ```

#### Issue: Keyboard Navigation Problems

**Symptoms:**
- Cannot navigate with keyboard only
- Focus traps not working in modals
- Skip links not functioning

**Solutions:**

1. **Implement Focus Traps**
   ```typescript
   import { useFocusTrap } from '@/hooks/useFocusTrap';
   
   const Modal = ({ isOpen, children }) => {
     const trapRef = useFocusTrap(isOpen);
     
     return (
       <div ref={trapRef} role="dialog">
         {children}
       </div>
     );
   };
   ```

2. **Add Skip Links**
   ```typescript
   const SkipLink = () => (
     <a 
       href="#main-content"
       className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
     >
       Skip to main content
     </a>
   );
   ```

### 5. Mobile Responsiveness Issues

#### Issue: Layout Problems on Mobile

**Symptoms:**
- Components overflow on small screens
- Touch targets too small
- Horizontal scrolling required

**Solutions:**

1. **Responsive Grid Layouts**
   ```typescript
   // Use responsive grid classes
   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
     {metricCards}
   </div>
   ```

2. **Touch-Friendly Buttons**
   ```typescript
   // Ensure minimum touch target size (44px)
   <Button 
     size="sm"
     className="min-h-[44px] min-w-[44px]"
   >
     Action
   </Button>
   ```

3. **Mobile-Optimized Modals**
   ```typescript
   // Full-screen modals on mobile
   <Dialog>
     <DialogContent className="sm:max-w-md w-full h-full sm:h-auto">
       {content}
     </DialogContent>
   </Dialog>
   ```

### 6. State Management Issues

#### Issue: State Synchronization Problems

**Symptoms:**
- Components showing different data
- State updates not propagating
- Stale data being displayed

**Solutions:**

1. **Consistent Query Keys**
   ```typescript
   // Use query key factory
   export const orderKeys = {
     all: ['orders'] as const,
     detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
     timeline: (id: string) => [...orderKeys.detail(id), 'timeline'] as const,
   };
   ```

2. **Proper Cache Invalidation**
   ```typescript
   // Invalidate related queries after mutations
   const mutation = useMutation({
     mutationFn: updateOrderStatus,
     onSuccess: (data, variables) => {
       queryClient.invalidateQueries(orderKeys.detail(variables.orderId));
       queryClient.invalidateQueries(orderKeys.timeline(variables.orderId));
     }
   });
   ```

3. **Handle Race Conditions**
   ```typescript
   // Use mutation keys to prevent race conditions
   const mutation = useMutation({
     mutationKey: ['updateOrder', orderId],
     mutationFn: updateOrderStatus,
     // Only one mutation per order at a time
   });
   ```

## Debugging Tools and Techniques

### 1. React Developer Tools

```typescript
// Add debug information to components
const EnhancedOrderDetailHeader = ({ order, isLoading }) => {
  // Debug props in development
  if (process.env.NODE_ENV === 'development') {
    console.log('EnhancedOrderDetailHeader props:', { order, isLoading });
  }
  
  return (
    <div data-testid="order-header" data-order-id={order?.id}>
      {/* Component content */}
    </div>
  );
};
```

### 2. React Query DevTools

```typescript
// Enable React Query DevTools in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Router />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </>
  );
}
```

### 3. Custom Debug Hooks

```typescript
// Custom hook for debugging component renders
export const useDebugRender = (componentName: string, props: any) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`, props);
  });
  
  return renderCount.current;
};

// Usage
const StatusActionPanel = (props) => {
  const renderCount = useDebugRender('StatusActionPanel', props);
  
  return (
    <div data-render-count={renderCount}>
      {/* Component content */}
    </div>
  );
};
```

### 4. Performance Profiling

```typescript
// Profile component performance
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Component performance:', {
    id,
    phase,
    actualDuration,
    timestamp: Date.now()
  });
};

<Profiler id="OrderStatusWorkflow" onRender={onRenderCallback}>
  <OrderDetailPage />
</Profiler>
```

## Environment-Specific Issues

### Development Environment

1. **Hot Reload Issues**
   ```bash
   # Clear development cache
   rm -rf node_modules/.cache
   npm run dev
   ```

2. **Mock Service Worker Issues**
   ```typescript
   // Ensure MSW is properly configured
   if (process.env.NODE_ENV === 'development') {
     const { worker } = await import('./mocks/browser');
     worker.start();
   }
   ```

### Production Environment

1. **Build Failures**
   ```bash
   # Check for TypeScript errors
   npm run type-check
   
   # Check for linting errors
   npm run lint
   
   # Run tests before build
   npm run test
   ```

2. **Runtime Errors**
   ```typescript
   // Add error boundaries
   class OrderWorkflowErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
   
     componentDidCatch(error, errorInfo) {
       console.error('Order workflow error:', error, errorInfo);
       // Send to error reporting service
     }
   
     render() {
       if (this.state.hasError) {
         return <OrderWorkflowFallback />;
       }
   
       return this.props.children;
     }
   }
   ```

## Monitoring and Alerting

### Error Tracking

```typescript
// Sentry integration for error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
});

// Wrap components with Sentry error boundary
export default Sentry.withErrorBoundary(OrderDetailPage, {
  fallback: OrderWorkflowFallback,
  beforeCapture: (scope, error, errorInfo) => {
    scope.setTag('component', 'OrderWorkflow');
    scope.setContext('errorInfo', errorInfo);
  }
});
```

### Performance Monitoring

```typescript
// Custom performance monitoring
const trackPerformance = (componentName: string, duration: number) => {
  if (duration > 100) { // Alert if render takes > 100ms
    console.warn(`Slow render detected: ${componentName} took ${duration}ms`);
    
    // Send to analytics
    analytics.track('Slow Component Render', {
      component: componentName,
      duration,
      timestamp: Date.now()
    });
  }
};
```

## Getting Help

### Internal Resources

1. **Component Documentation**: Check the comprehensive component docs in `docs/DEVELOPMENT/`
2. **API Documentation**: Review API integration guide for backend communication
3. **Test Examples**: Look at existing tests for usage patterns
4. **Storybook**: Use Storybook for component development and testing

### External Resources

1. **React Query Documentation**: For data fetching and caching issues
2. **Tailwind CSS Documentation**: For styling and responsive design
3. **React Testing Library**: For testing best practices
4. **Accessibility Guidelines**: WCAG 2.1 documentation for accessibility compliance

### Escalation Process

1. **Check Documentation**: Review this troubleshooting guide and component docs
2. **Search Issues**: Look for similar issues in the project's issue tracker
3. **Create Reproduction**: Create a minimal reproduction of the issue
4. **Contact Team**: Reach out to the development team with detailed information

### Issue Reporting Template

```markdown
## Issue Description
Brief description of the problem

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120.0.0.0
- OS: macOS 14.0
- Node Version: 18.17.0
- Package Version: 2.0.0

## Additional Context
- Console errors
- Screenshots
- Network requests
- Component props
```

This troubleshooting guide should help developers quickly identify and resolve common issues with the Order Status Workflow components. Keep this document updated as new issues are discovered and resolved.