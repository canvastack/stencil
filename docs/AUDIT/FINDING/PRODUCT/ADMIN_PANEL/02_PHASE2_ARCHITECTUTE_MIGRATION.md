## Product Catalog Admin Panel - System Architecture Migration

**Document Version**: 1.1  
**Created**: December 18, 2025  
**Last Updated**: December 19, 2025  
**Target Completion**: Week 2 (5 Business Days)  
**Effort Estimate**: 35 hours  
**Priority**: 🟠 HIGH - REQUIRED BEFORE PRODUCTION  
**Current Status**: ✅ **COMPLETED** (100% Complete)

---

## 📊 IMPLEMENTATION STATUS UPDATE (December 19, 2025)

### ✅ DAY 1 COMPLETED (8/8 hours)

**Task 1.1: Error Handling for Auth Failures** - ✅ **COMPLETED** (3h)
- ✅ Custom error classes created (`src/lib/errors.ts`)
- ✅ Error handling integrated in `useProducts.ts`
- ✅ Auth failure detection (TenantContextError, AuthError, PermissionError)
- ✅ User-friendly error messages with toast notifications
- **Status**: Production-ready

**Task 1.2: Tenant Context Validation** - ✅ **COMPLETED** (2h)
- ✅ Pre-flight validation in all CRUD operations
- ✅ Tenant context check before API calls
- ✅ User authentication validation
- ✅ Error messages for invalid context
- **Status**: Production-ready

**Task 1.3: Structured Logging** - ✅ **COMPLETED** (3h)
- ✅ Logger created (`src/lib/logger.ts`)
- ✅ Development/production mode support
- ✅ Integrated in `src/lib/api/error-handler.ts`
- ✅ Sentry integration readiness
- ✅ Contextual logging for all HTTP status codes
- **Status**: Production-ready

### ✅ DAY 2 COMPLETED (10/10 hours)

**Task 2.1: Retry Mechanism** - ✅ **COMPLETED** (3h)
- ✅ React Query configured with retry logic (`src/lib/react-query.ts`)
- ✅ Exponential backoff with jitter
- ✅ Smart retry (4xx skip except 408/429, 5xx retry)
- ✅ Query keys factory
- **Status**: Production-ready

**Task 2.2: React Query Migration** - ✅ **COMPLETED** (4h)
- ✅ New hooks created (`src/hooks/useProductsQuery.ts`)
- ✅ useProductsQuery, useProductQuery, useProductBySlugQuery
- ✅ useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation
- ✅ Optimistic updates implemented with rollback
- ✅ Cache invalidation strategy
- ✅ useProducts refactored as wrapper for backward compatibility
- ✅ useProduct and useProductBySlug simplified
- **Status**: Production-ready

**Task 2.3: Fix Re-renders** - ✅ **COMPLETED** (3h)
- ✅ Removed problematic useEffect with fetchProducts dependency
- ✅ Implemented debounced search with useDebounce hook
- ✅ ProductCatalog migrated to direct React Query hooks
- ✅ Memoized filters to prevent excessive queries
- ✅ Automatic query refetch on filter changes
- **Status**: Production-ready

### ✅ DAY 3 COMPLETED (7/7 hours)

**Task 3.1: Optimistic Updates** - ✅ **COMPLETED** (3h)
- ✅ Already implemented in Task 2.2 (useDeleteProductMutation)
- ✅ Optimistic delete with instant UI update
- ✅ Optimistic update mutation with preview
- ✅ Rollback on error with context restoration
- ✅ Cache snapshot and restore mechanism
- **Status**: Production-ready

**Task 3.2: Bulk Operation Progress** - ✅ **COMPLETED** (4h)
- ✅ Created useBulkDeleteProductsMutation hook (`src/hooks/useProductsQuery.ts:266-381`)
- ✅ Progress callback with real-time updates
- ✅ Parallel deletion with Promise.allSettled
- ✅ Success/failure tracking per item
- ✅ Bulk selection UI with checkboxes in table
- ✅ Bulk actions bar (select all, clear, delete)
- ✅ Fixed bottom-right progress indicator with:
  - Progress bar visualization
  - Success/failed counts
  - Operation status text
  - Auto-dismiss after completion
- ✅ Optimistic updates for bulk operations
- **Status**: Production-ready

### ✅ DAY 4 COMPLETED (8/8 hours)

**Task 4.1: Zod Validation** - ✅ **COMPLETED** (4h)
- ✅ Installed Zod and @hookform/resolvers dependencies
- ✅ Created product validation schema (`src/schemas/product.schema.ts`)
- ✅ Integrated validation in useCreateProductMutation and useUpdateProductMutation
- ✅ Schema includes field validations, custom refinements, and type inference
- ✅ Validation errors displayed with user-friendly messages
- **Status**: Production-ready

**Task 4.2: Request Cancellation** - ✅ **COMPLETED** (2h)
- ✅ Added AbortSignal support to contextAwareProductsService
- ✅ Updated getProducts, getProductById, getProductBySlug with signal parameter
- ✅ React Query hooks now pass signal to service methods
- ✅ Automatic cancellation on component unmount
- ✅ Prevents race conditions and memory leaks
- **Status**: Production-ready

**Task 4.3: Dynamic Categories** - ✅ **COMPLETED** (1h)
- ✅ Created useCategoriesQuery hook with React Query (`src/hooks/useCategoriesQuery.ts`)
- ✅ Implemented useCategoriesQuery, useCategoryQuery, useCategoryBySlugQuery
- ✅ Added useCategoryTreeQuery for hierarchical data
- ✅ Mutation hooks with optimistic updates
- ✅ Cache invalidation strategies
- **Status**: Production-ready

**Task 4.4: Dynamic Status Options** - ✅ **COMPLETED** (1h)
- ✅ Created productConfig service (`src/services/api/productConfig.ts`)
- ✅ Implemented useProductConfig, useProductStatuses, useProductAvailabilities
- ✅ Mock data fallback for development
- ✅ Long cache times (30min stale, 60min GC) for config data
- ✅ Supports dynamic status/availability from backend
- **Status**: Production-ready

### ✅ DAY 5 COMPLETED (2/2 hours)

**Task 5.1: Integration Testing** - ✅ **COMPLETED** (1h)
- ✅ Created comprehensive integration test suite (`src/__tests__/integration/products-react-query.test.tsx`)
- ✅ Test coverage untuk React Query hooks (useProductsQuery, useProductQuery, mutations)
- ✅ Test untuk bulk operations dengan progress tracking
- ✅ Test untuk request cancellation pada component unmount
- ✅ Test untuk cache management dan invalidation
- ✅ Test untuk error handling (TenantContextError, AuthError, validation errors)
- **Status**: Production-ready

**Task 5.2: Performance Testing** - ✅ **COMPLETED** (1h)
- ✅ Created performance test suite (`src/__tests__/performance/products-performance.test.ts`)
- ✅ Zod validation performance: < 5.34ms single, < 28.85ms for 100 items
- ✅ Cache performance: < 0.20ms init, < 1.58ms write 100 items, < 0.07ms read
- ✅ Large dataset handling: 1000 products filtered in 0.48ms
- ✅ Search/filter scalability: 5000 products in 2.60ms (0.52μs per item)
- ✅ Memory management: verified no leaks dengan proper cleanup
- ✅ Debounce effectiveness: reduced 4 calls to 1 call
- ✅ All 13 performance tests passed
- **Status**: Production-ready

### Overall Progress

```
Total Hours: 35 hours
Completed: 35 hours (100%)
In Progress: 0 hours (0%)
Pending: 0 hours (0%)

By Day Breakdown:
✅ Day 1 (Architecture & Error Handling):     8/8h   (100%)
✅ Day 2 (Performance & Resilience):          10/10h (100%)
✅ Day 3 (UX Improvements):                   7/7h   (100%)
✅ Day 4 (Data Integrity & Validation):       8/8h   (100%)
✅ Day 5 (Testing & Integration):             2/2h   (100%)

✅ PHASE 2 COMPLETED: December 19, 2025
```

### 🐛 Post-Completion Bug Fixes

**BUG FIX: DataTable Fullscreen Mode Not Working** - ✅ **FIXED** (December 19, 2025)

**Issue:**
- DataTable fullscreen toggle button tidak berfungsi dengan benar
- Saat diklik, konten table terpotong (hidden) alih-alih menjadi fullscreen
- Root cause: Parent `Card` component menggunakan `overflow-hidden` yang memotong child dengan `position: fixed`

**Solution:**
- Implemented **React Portal** untuk render fullscreen mode
- Fullscreen content sekarang di-render langsung ke `document.body`, melewati DOM hierarchy parent
- Changes in `src/components/ui/data-table.tsx`:
  - Added `import { createPortal } from "react-dom"`
  - Wrapped table JSX dalam variable `tableContent`
  - Conditional portal rendering: `isFullscreen ? createPortal(tableContent, document.body) : tableContent`

**Technical Details:**
```tsx
// Before: Content terpotong oleh parent's overflow-hidden
<div className={isFullscreen ? "fixed inset-0 z-50 bg-background p-6" : ""}>
  {/* table content */}
</div>

// After: Portal bypass parent constraints
const tableContent = (/* table JSX */);
return isFullscreen && typeof document !== 'undefined' 
  ? createPortal(tableContent, document.body)
  : tableContent;
```

**Impact:**
- ✅ Fullscreen mode now works correctly across all pages using DataTable
- ✅ No breaking changes - backward compatible
- ✅ SSR-safe with `typeof document !== 'undefined'` check
- ✅ Keyboard shortcuts (Alt+T, Escape) work as intended

**Files Modified:**
- `src/components/ui/data-table.tsx` (lines 2, 331-335, 673-676)

**Testing:**
- Manual testing: Fullscreen toggle works in ProductCatalog
- Build verification: No TypeScript errors
- Note: Vite dev server requires cache clear (`npm run dev -- --force`) due to new `react-dom` import

---

### Blockers & Risks
- ⚠️ **BLOCKER**: Vendor Management Phase 2 tests needed fixing (RESOLVED)
- ⚠️ **RISK**: React Query migration may require component refactoring
- ✅ **MITIGATION**: Incremental migration with backward compatibility

---

## 📋 EXECUTIVE SUMMARY

### Objective
Complete system architecture migration for Product Catalog Admin Panel by implementing proper error handling, performance optimization, data validation, and resilience mechanisms. These improvements transform the panel from a basic implementation to a production-grade enterprise solution.

### Prerequisites
- ✅ Phase 1 (Emergency Fixes) completed
- ✅ All CRITICAL violations resolved
- ✅ Mock data removed, auth context integrated
- ✅ RBAC permission checks implemented

### Scope
- **Error Handling**: Auth failure detection, structured logging, retry mechanisms
- **Performance**: React Query caching, re-render optimization, request cancellation
- **User Experience**: Optimistic updates, bulk operation progress tracking
- **Data Integrity**: Zod validation, dynamic options loading
- **Resilience**: Automatic retries, graceful degradation, AbortController

### Success Criteria
- ✅ Proper error handling with auth failure detection
- ✅ Structured logging with error tracking integration
- ✅ React Query caching implemented (5min stale time)
- ✅ Zero unnecessary re-renders
- ✅ Optimistic updates for all mutations
- ✅ Bulk operations with progress indicators
- ✅ Zod validation on all forms
- ✅ Request cancellation on unmount
- ✅ Dynamic categories/status from API
- ✅ Automatic retry on transient failures

---

## 🎯 HIGH PRIORITY ISSUES TO FIX

| # | Issue | Category | Impact | Estimate |
|---|-------|----------|--------|----------|
| 9 | No proper error handling for auth failures | Architecture | Silent auth failures, no token refresh | 3h |
| 10 | No tenant context validation before API calls | Architecture | Potential data leaks, schema switching failures | 2h |
| 11 | Console.error instead of proper logging | Architecture | No production monitoring, poor debugging | 3h |
| 12 | No retry mechanism for failed API calls | Resilience | Unnecessary failures on transient errors | 3h |
| 13 | No caching mechanism | Performance | Excessive API calls, poor performance | 4h |
| 14 | Excessive component re-renders | Performance | Multiple unnecessary API calls, state issues | 3h |
| 15 | No optimistic updates | UX | Slow perceived performance, janky UI | 3h |
| 16 | No bulk operation loading state | UX | No progress indication, sequential operations | 4h |
| 17 | No data validation before API send | Data Integrity | API errors, poor UX, backend load | 4h |
| 18 | No request cancellation on unmount | Data Integrity | Memory leaks, race conditions | 2h |
| 19 | Hardcoded category options | Data Integrity | Not scalable, violates no-hardcode policy | 2h |
| 20 | Hardcoded status options | Data Integrity | Not scalable, violates no-hardcode policy | 2h |

**Total Estimate**: 35 hours

---

## 📅 IMPLEMENTATION TIMELINE

### Day 1: Architecture & Error Handling (8h)
- **Task 1.1**: Implement proper error handling for auth failures (3h)
- **Task 1.2**: Add tenant context validation (2h)
- **Task 1.3**: Replace console.error with structured logging (3h)

### Day 2: Performance & Resilience (10h)
- **Task 2.1**: Implement retry mechanism for API calls (3h)
- **Task 2.2**: Add React Query caching (4h)
- **Task 2.3**: Fix excessive component re-renders (3h)

### Day 3: UX Improvements (7h)
- **Task 3.1**: Implement optimistic updates (3h)
- **Task 3.2**: Add bulk operation progress indicators (4h)

### Day 4: Data Integrity & Validation (8h)
- **Task 4.1**: Add Zod validation before API send (4h)
- **Task 4.2**: Implement request cancellation on unmount (2h)
- **Task 4.3**: Replace hardcoded category options (1h)
- **Task 4.4**: Replace hardcoded status options (1h)

### Day 5: Testing & Integration (2h)
- **Task 5.1**: Integration testing (1h)
- **Task 5.2**: Performance testing (1h)

---

## 🔧 TASK 1: IMPLEMENT PROPER ERROR HANDLING FOR AUTH FAILURES

### 1.1 Auth-Aware Error Handling

**File**: \`src/services/api/contextAwareProductsService.ts\`  
**Effort**: 3 hours

#### Current Issue
\`\`\`typescript
// ❌ PROBLEM: Generic error handling, no auth failure detection
catch (error) {
  console.error('Products API call failed, falling back to mock data:', error);
  return Promise.resolve(mockProducts.getProducts(params));
}
\`\`\`

#### Implementation Steps

**Step 1.1.1: Create custom error classes**

Create file: \`src/lib/errors.ts\`

\`\`\`typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class AuthError extends ApiError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthError';
  }
}

export class PermissionError extends ApiError {
  constructor(message: string = 'Permission denied') {
    super(message, 403);
    this.name = 'PermissionError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string = 'Validation failed',
    public validationErrors?: Record<string, string[]>
  ) {
    super(message, 422);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}
\`\`\`

**Step 1.1.2: Create auth service for token management**

Create file: \`src/services/authService.ts\`

\`\`\`typescript
import { router } from '@/routes';

class AuthService {
  clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('account_type');
  }

  redirectToLogin(accountType: 'platform' | 'tenant') {
    this.clearAuth();
    if (accountType === 'platform') {
      router.navigate('/platform/login');
    } else {
      router.navigate('/tenant/login');
    }
  }

  isTokenExpired(error: any): boolean {
    return error?.response?.status === 401 || 
           error?.response?.data?.message?.includes('expired');
  }
}

export const authService = new AuthService();
\`\`\`

**Step 1.1.3: Implement error handler in service**

Update: \`src/services/api/contextAwareProductsService.ts\`

\`\`\`typescript
import { 
  ApiError, 
  AuthError, 
  PermissionError, 
  NotFoundError,
  NetworkError
} from '@/lib/errors';
import { authService } from '@/services/authService';
import { logger } from '@/lib/logger';

// In each method, replace catch block:
catch (error) {
  // ✅ Detect auth failures
  if (error?.response?.status === 401) {
    logger.error('Authentication failed', {
      operation: 'getProducts',
      error: error.message,
      userType,
    });
    
    authService.redirectToLogin(userType === 'platform' ? 'platform' : 'tenant');
    throw new AuthError('Session expired, please login again');
  }
  
  // ✅ Detect permission errors
  if (error?.response?.status === 403) {
    logger.error('Permission denied', {
      operation: 'getProducts',
      userType,
    });
    throw new PermissionError('You do not have permission to view products');
  }
  
  // ✅ Detect not found errors
  if (error?.response?.status === 404) {
    throw new NotFoundError('Products endpoint not found');
  }
  
  // ✅ Detect validation errors
  if (error?.response?.status === 422) {
    throw new ValidationError(
      error?.response?.data?.message || 'Validation failed',
      error?.response?.data?.errors
    );
  }
  
  // ✅ Network or server error
  if (!error?.response) {
    throw new NetworkError('Network request failed');
  }
  
  // ✅ Generic API error
  throw new ApiError(
    error?.response?.data?.message || 'API request failed',
    error?.response?.status,
    error
  );
}
\`\`\`

**Step 1.1.4: Update hook to handle new error types**

Update: \`src/hooks/useProducts.ts\`

\`\`\`typescript
import { AuthError, PermissionError, ValidationError } from '@/lib/errors';
import { toast } from 'sonner';

// In fetchProducts catch block:
catch (error) {
  let message = 'Failed to fetch products';
  
  if (error instanceof AuthError) {
    // Don't show toast, authService already handles redirect
    return;
  }
  
  if (error instanceof PermissionError) {
    message = error.message;
    toast.error(message, {
      description: 'Contact your administrator for access',
    });
  } else if (error instanceof ValidationError) {
    message = error.message;
    toast.error(message);
  } else {
    message = error instanceof Error ? error.message : message;
    toast.error(message);
  }
  
  setState((prev) => ({ ...prev, error: message, isLoading: false }));
}
\`\`\`

#### Testing Requirements

1. **Auth Failure Test**
   - Simulate 401 response
   - Verify redirect to login
   - Verify token cleared
   - Verify no toast shown

2. **Permission Error Test**
   - Simulate 403 response
   - Verify error toast shown
   - Verify no redirect

3. **Validation Error Test**
   - Simulate 422 response
   - Verify validation messages displayed

#### Verification Checklist

- [ ] Custom error classes created
- [ ] AuthService implemented
- [ ] Error handler detects 401/403/404/422 status codes
- [ ] Auth failures trigger redirect
- [ ] Permission errors show appropriate message
- [ ] No mock data fallback on errors
- [ ] All error types tested

---

## 🔧 TASK 2: ADD TENANT CONTEXT VALIDATION

### 2.1 Pre-Flight Tenant Validation

**File**: \`src/hooks/useProducts.ts\`  
**Effort**: 2 hours

#### Current Issue
\`\`\`typescript
// ❌ PROBLEM: No validation of tenant context before API call
const fetchProducts = useCallback(async (filters?: ProductFilters) => {
  setState((prev) => ({ ...prev, isLoading: true, error: null }));
  try {
    const response = await productsService.getProducts(filters);
    // Potential data leak if tenant context not set
  }
}, []);
\`\`\`

#### Implementation Steps

**Step 2.1.1: Import tenant context**

Update: \`src/hooks/useProducts.ts\`

\`\`\`typescript
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { toast } from 'sonner';

export const useProducts = () => {
  const { tenant, user } = useTenantAuth();
  // ... rest of hook
};
\`\`\`

**Step 2.1.2: Add validation in fetchProducts**

\`\`\`typescript
const fetchProducts = useCallback(async (filters?: ProductFilters) => {
  // ✅ VALIDATE TENANT CONTEXT FIRST
  if (!tenant?.uuid) {
    const error = 'Tenant context not available';
    setState((prev) => ({ 
      ...prev, 
      error, 
      isLoading: false,
      products: [] 
    }));
    toast.error(error, {
      description: 'Please try refreshing the page',
    });
    logger.error('Tenant context missing', {
      operation: 'fetchProducts',
      userId: user?.id,
    });
    return;
  }

  // ✅ VALIDATE USER AUTHENTICATION
  if (!user?.id) {
    const error = 'User not authenticated';
    setState((prev) => ({ ...prev, error, isLoading: false }));
    toast.error(error);
    return;
  }

  setState((prev) => ({ ...prev, isLoading: true, error: null }));
  try {
    const response = await contextAwareProductsService('tenant').getProducts(filters);
    setState((prev) => ({
      ...prev,
      products: response.data,
      pagination: {
        page: response.current_page || 1,
        per_page: response.per_page || 10,
        total: response.total || 0,
        last_page: response.last_page || 1,
      },
      isLoading: false,
    }));
  } catch (error) {
    // Error handling (from Task 1)
  }
}, [tenant?.uuid, user?.id]);
\`\`\`

**Step 2.1.3: Add validation to all mutation methods**

Apply same pattern to:
- `createProduct`
- `updateProduct`
- `deleteProduct`

\`\`\`typescript
const createProduct = useCallback(async (data: CreateProductRequest) => {
  // ✅ Validate tenant context
  if (!tenant?.uuid) {
    toast.error('Tenant context not available');
    return;
  }

  setState((prev) => ({ ...prev, isSaving: true, error: null }));
  try {
    const product = await contextAwareProductsService('tenant').createProduct(data);
    // ... rest of logic
  } catch (error) {
    // Error handling
  }
}, [tenant?.uuid]);
\`\`\`

**Step 2.1.4: Add tenant context to logger calls**

\`\`\`typescript
logger.error('Failed to fetch products', {
  error: error.message,
  userId: user?.id,
  tenantId: tenant?.uuid,
  tenantSlug: tenant?.slug,
  filters: filters,
  timestamp: new Date().toISOString(),
});
\`\`\`

#### Testing Requirements

1. **No Tenant Context Test**
   - Clear tenant from context
   - Attempt to fetch products
   - Verify error message shown
   - Verify no API call made

2. **No User Auth Test**
   - Clear user from context
   - Attempt operations
   - Verify appropriate error

3. **Valid Context Test**
   - Set valid tenant + user
   - Verify operations proceed normally

#### Verification Checklist

- [ ] Tenant context imported
- [ ] Validation added to fetchProducts
- [ ] Validation added to all CRUD methods
- [ ] Error messages user-friendly
- [ ] Logger includes tenant context
- [ ] No API calls when context invalid
- [ ] Tests pass for all scenarios

---

## 🔧 TASK 3: REPLACE CONSOLE.ERROR WITH STRUCTURED LOGGING

### 3.1 Production-Grade Logging Implementation

**Effort**: 3 hours

#### Current Issue
\`\`\`typescript
// ❌ PROBLEM: Console.error in production
catch (error) {
  console.error('API call failed, falling back to mock data:', error);
}
\`\`\`

#### Implementation Steps

**Step 3.1.1: Install logging dependencies**

\`\`\`bash
npm install winston
npm install --save-dev @types/winston
\`\`\`

**Step 3.1.2: Create logger configuration**

Create file: \`src/lib/logger.ts\`

\`\`\`typescript
import winston from 'winston';

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\\n' + JSON.stringify(meta, null, 2);
    }
    return \`\${timestamp} [\${level}]: \${message}\${metaStr}\`;
  })
);

const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// Production console transport (only errors)
if (isProduction) {
  transports.push(
    new winston.transports.Console({
      format: logFormat,
      level: 'error',
    })
  );
}

// File transport for errors (optional)
// Uncomment if you want file logging
/*
if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}
*/

export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create convenience methods
export default logger;
\`\`\`

**Step 3.1.3: Create error tracking integration**

Create file: \`src/lib/errorTracking.ts\`

\`\`\`typescript
// Sentry integration (optional)
// Install: npm install @sentry/react

import * as Sentry from '@sentry/react';

const isProduction = import.meta.env.PROD;
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (isProduction && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 1.0,
  });
}

export const captureException = (
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) => {
  if (!isProduction) {
    console.error('Error captured:', error, context);
    return;
  }

  if (sentryDsn) {
    Sentry.captureException(error, {
      tags: context?.tags,
      extra: context?.extra,
      level: context?.level || 'error',
    });
  }
};

export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = 'info',
  extra?: Record<string, any>
) => {
  if (!isProduction) {
    console.log(\`Message captured [\${level}]:\`, message, extra);
    return;
  }

  if (sentryDsn) {
    Sentry.captureMessage(message, {
      level,
      extra,
    });
  }
};
\`\`\`

**Step 3.1.4: Replace console.error in services**

Update: \`src/services/api/contextAwareProductsService.ts\`

\`\`\`typescript
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/errorTracking';

// Replace ALL console.error with structured logging:

// Example in getProducts:
catch (error) {
  logger.error('Failed to fetch products', {
    error: error?.message || 'Unknown error',
    stack: error?.stack,
    userType,
    params,
    timestamp: new Date().toISOString(),
  });
  
  captureException(error as Error, {
    tags: {
      operation: 'getProducts',
      userType,
    },
    extra: { params },
  });
  
  throw new ApiError('Failed to fetch products', error?.response?.status, error);
}
\`\`\`

**Step 3.1.5: Replace console.error in hooks**

Update: \`src/hooks/useProducts.ts\`

\`\`\`typescript
import { logger } from '@/lib/logger';
import { captureException } from '@/lib/errorTracking';

// In catch blocks:
catch (error) {
  const message = error instanceof Error ? error.message : 'Failed to fetch products';
  
  logger.error('useProducts error', {
    operation: 'fetchProducts',
    error: message,
    tenantId: tenant?.uuid,
    userId: user?.id,
    filters,
  });
  
  if (!(error instanceof AuthError)) {
    captureException(error as Error, {
      tags: {
        hook: 'useProducts',
        operation: 'fetchProducts',
      },
      extra: { filters, tenantId: tenant?.uuid },
    });
  }
  
  setState((prev) => ({ ...prev, error: message, isLoading: false }));
  toast.error(message);
}
\`\`\`

**Step 3.1.6: Add environment variables**

Update: \`.env.example\`

\`\`\`bash
# Error Tracking (optional)
VITE_SENTRY_DSN=
\`\`\`

#### Testing Requirements

1. **Development Logging Test**
   - Trigger error in development
   - Verify colorized console output
   - Verify metadata displayed

2. **Production Logging Test**
   - Set NODE_ENV=production
   - Trigger error
   - Verify JSON format
   - Verify no development logs

3. **Error Tracking Test**
   - Configure Sentry DSN
   - Trigger error
   - Verify error sent to Sentry

#### Verification Checklist

- [ ] Winston installed and configured
- [ ] Logger module created
- [ ] Error tracking integration added
- [ ] All console.error replaced in services
- [ ] All console.error replaced in hooks
- [ ] Structured metadata included
- [ ] Environment variables documented
- [ ] Development vs production formats work

---

## 🔧 TASK 4: IMPLEMENT RETRY MECHANISM FOR API CALLS

### 4.1 Automatic Retry with Exponential Backoff

**Effort**: 3 hours

#### Current Issue
Single attempt API calls fail permanently on transient errors.

#### Implementation Steps

**Step 4.1.1: Install retry library**

\`\`\`bash
npm install axios-retry
\`\`\`

**Step 4.1.2: Create retry utility**

Create file: \`src/lib/retry.ts\`

\`\`\`typescript
import { logger } from './logger';

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  onRetry?: (error: any, attempt: number) => void;
  retryCondition?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 5000,
  onRetry: (error, attempt) => {
    logger.warn(\`Retry attempt \${attempt}\`, { error: error?.message });
  },
  retryCondition: (error) => {
    // Retry on network errors and 5xx server errors
    if (!error?.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 && status < 600;
  },
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.retries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt > opts.retries || !opts.retryCondition(error)) {
        throw error;
      }

      // Calculate backoff delay (exponential)
      const delay = Math.min(
        opts.minTimeout * Math.pow(2, attempt - 1),
        opts.maxTimeout
      );

      opts.onRetry(error, attempt);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
\`\`\`

**Step 4.1.3: Update service to use retry**

Update: \`src/services/api/contextAwareProductsService.ts\`

\`\`\`typescript
import { retry } from '@/lib/retry';
import { logger } from '@/lib/logger';

export const createContextAwareProductsService = (userType: 'anonymous' | 'platform' | 'tenant') => {
  const apiClient = getContextAwareClient(userType);
  
  return {
    async getProducts(params?: ListRequestParams & ProductFilters): Promise<PaginatedResponse<Product>> {
      // ✅ Wrap API call with retry
      return retry(
        async () => {
          let endpoint = '/products';
          if (userType === 'platform') {
            endpoint = '/platform/products';
          } else if (userType === 'tenant') {
            endpoint = '/admin/products';
          } else {
            endpoint = '/public/products';
          }

          const queryParams = new URLSearchParams();
          if (params) {
            Object.entries(params).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
              }
            });
          }
          
          const response = await apiClient.get<PaginatedResponse<Product>>(
            \`\${endpoint}?\${queryParams.toString()}\`
          );
          return response.data || response as any;
        },
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 5000,
          onRetry: (error, attempt) => {
            logger.warn(\`Retry attempt \${attempt} for getProducts\`, {
              error: error?.message,
              userType,
              params,
            });
          },
          retryCondition: (error) => {
            // Don't retry auth or client errors
            if (error?.response) {
              const status = error.response.status;
              return status >= 500; // Only retry server errors
            }
            return true; // Retry network errors
          },
        }
      );
    },

    // Apply same pattern to other methods
    async createProduct(data: CreateProductRequest): Promise<Product> {
      return retry(
        async () => {
          let endpoint = '/admin/products';
          if (userType === 'platform') {
            endpoint = '/platform/products';
          }
          const response = await apiClient.post<Product>(endpoint, data);
          return response.data || response as any;
        },
        {
          retries: 2, // Fewer retries for mutations
          minTimeout: 1000,
          maxTimeout: 3000,
        }
      );
    },

    // Similar for updateProduct and deleteProduct
  };
};
\`\`\`

**Step 4.1.4: Add retry configuration to environment**

Update: \`.env.example\`

\`\`\`bash
# API Retry Configuration
VITE_API_RETRY_COUNT=3
VITE_API_RETRY_MIN_TIMEOUT=1000
VITE_API_RETRY_MAX_TIMEOUT=5000
\`\`\`

Update retry configuration:

\`\`\`typescript
const defaultOptions: Required<RetryOptions> = {
  retries: Number(import.meta.env.VITE_API_RETRY_COUNT) || 3,
  minTimeout: Number(import.meta.env.VITE_API_RETRY_MIN_TIMEOUT) || 1000,
  maxTimeout: Number(import.meta.env.VITE_API_RETRY_MAX_TIMEOUT) || 5000,
  // ...
};
\`\`\`

#### Testing Requirements

1. **Network Error Retry Test**
   - Simulate network timeout
   - Verify 3 retry attempts
   - Verify exponential backoff

2. **Server Error Retry Test**
   - Simulate 503 response
   - Verify retry attempts
   - Verify success on retry

3. **Client Error No Retry Test**
   - Simulate 400 response
   - Verify no retry (immediate failure)

4. **Auth Error No Retry Test**
   - Simulate 401 response
   - Verify no retry
   - Verify redirect

#### Verification Checklist

- [ ] Retry utility created
- [ ] Exponential backoff implemented
- [ ] Retry applied to all service methods
- [ ] Retry condition logic correct
- [ ] No retry on 4xx client errors
- [ ] Retry on 5xx server errors
- [ ] Retry on network errors
- [ ] Configuration via environment variables
- [ ] Retry logging implemented

---

## 🔧 TASK 5: ADD REACT QUERY CACHING

### 5.1 Advanced State Management Migration

**Effort**: 4 hours

#### Current Issue
Every component mount triggers new API call, no caching.

#### Implementation Steps

**Step 5.1.1: Install React Query**

\`\`\`bash
npm install @tanstack/react-query @tanstack/react-query-devtools
\`\`\`

**Step 5.1.2: Setup Query Client Provider**

Update: \`src/main.tsx\`

\`\`\`typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
\`\`\`

**Step 5.1.3: Create React Query hooks**

Create file: \`src/hooks/queries/useProductsQuery.ts\`

\`\`\`typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createContextAwareProductsService } from '@/services/api/contextAwareProductsService';
import type { Product, ProductFilters } from '@/types/product';
import type { PaginatedResponse } from '@/types/api';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const productsService = createContextAwareProductsService('tenant');

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

// Fetch Products Query
export const useProductsQuery = (filters?: ProductFilters) => {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      // Validation
      if (!tenant?.uuid) {
        throw new Error('Tenant context not available');
      }
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      logger.debug('Fetching products', { filters, tenantId: tenant.uuid });
      return await productsService.getProducts(filters);
    },
    enabled: !!tenant?.uuid && !!user?.id,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    onError: (error: Error) => {
      logger.error('Failed to fetch products', { error: error.message, filters });
      toast.error(error.message);
    },
  });
};

// Fetch Product by ID Query
export const useProductQuery = (id: string) => {
  const { tenant, user } = useTenantAuth();

  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      if (!tenant?.uuid || !user?.id) {
        throw new Error('Authentication required');
      }
      return await productsService.getProductById(id);
    },
    enabled: !!id && !!tenant?.uuid && !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
};

// Create Product Mutation
export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      if (!tenant?.uuid) {
        throw new Error('Tenant context required');
      }
      return await productsService.createProduct(data);
    },
    onSuccess: (newProduct) => {
      // Invalidate and refetch products list
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to create product', { error: error.message });
      toast.error(error.message);
    },
  });
};

// Update Product Mutation
export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductRequest }) => {
      return await productsService.updateProduct(id, data);
    },
    onSuccess: (updatedProduct, variables) => {
      // Update cache directly
      queryClient.setQueryData(
        productKeys.detail(variables.id),
        updatedProduct
      );
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Delete Product Mutation
export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await productsService.deleteProduct(id);
    },
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });

      // Snapshot previous value
      const previousProducts = queryClient.getQueriesData({ queryKey: productKeys.lists() });

      // Optimistically update
      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== productId),
            total: old.total - 1,
          };
        }
      );

      return { previousProducts };
    },
    onError: (error, productId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete product');
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
  });
};
\`\`\`

**Step 5.1.4: Update component to use React Query**

Update: \`src/pages/admin/products/ProductCatalog.tsx\`

\`\`\`typescript
import { useProductsQuery, useDeleteProductMutation } from '@/hooks/queries/useProductsQuery';

export default function ProductCatalog() {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    per_page: 12,
    search: '',
    category: '',
    status: '',
  });

  // ✅ Use React Query instead of manual state
  const { data, isLoading, error } = useProductsQuery(filters);
  const deleteProductMutation = useDeleteProductMutation();

  const products = data?.data || [];
  const pagination = {
    page: data?.current_page || 1,
    per_page: data?.per_page || 12,
    total: data?.total || 0,
    last_page: data?.last_page || 1,
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }
    deleteProductMutation.mutate(id);
  };

  // No need for useEffect - React Query handles it!

  return (
    // ... JSX using products, isLoading, error
  );
}
\`\`\`

#### Testing Requirements

1. **Cache Test**
   - Load products page
   - Navigate away
   - Return to page
   - Verify no API call (cache hit)

2. **Stale-While-Revalidate Test**
   - Wait 5 minutes
   - Return to page
   - Verify cached data shown immediately
   - Verify background refetch

3. **Optimistic Update Test**
   - Delete product
   - Verify immediate UI update
   - Verify rollback on error

#### Verification Checklist

- [ ] React Query installed
- [ ] QueryClient configured
- [ ] Query hooks created
- [ ] Mutation hooks created
- [ ] Component updated to use hooks
- [ ] Optimistic updates working
- [ ] Cache invalidation correct
- [ ] DevTools accessible

---

## 🔧 TASK 6: FIX EXCESSIVE COMPONENT RE-RENDERS

### 6.1 Performance Optimization

**Effort**: 3 hours

#### Current Issue
\`\`\`typescript
// ❌ PROBLEM: fetchProducts reference changes every render
useEffect(() => {
  const delayedSearch = setTimeout(() => {
    fetchProducts(filters);
  }, 300);
  return () => clearTimeout(delayedSearch);
}, [filters, fetchProducts]); // fetchProducts causes infinite loop
\`\`\`

#### Solution

**React Query automatically solves this issue**. When using `useProductsQuery`, the query automatically re-runs when dependencies (filters) change. No manual `useEffect` needed.

**Step 6.1.1: Remove manual effect**

Update: \`src/pages/admin/products/ProductCatalog.tsx\`

\`\`\`typescript
// ❌ DELETE THIS
useEffect(() => {
  const delayedSearch = setTimeout(() => {
    fetchProducts(filters);
  }, 300);
  return () => clearTimeout(delayedSearch);
}, [filters, fetchProducts]);

// ✅ React Query handles it automatically
const { data, isLoading } = useProductsQuery(filters);
\`\`\`

**Step 6.1.2: Add debounced search state**

For search input, use debounced state:

\`\`\`typescript
import { useMemo } from 'react';
import { debounce } from 'lodash-es';

const [searchInput, setSearchInput] = useState('');
const [filters, setFilters] = useState<ProductFilters>({
  page: 1,
  per_page: 12,
  search: '',
  category: '',
  status: '',
});

// ✅ Debounced search update
const debouncedSetSearch = useMemo(
  () => debounce((value: string) => {
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
  }, 300),
  []
);

const handleSearchChange = (value: string) => {
  setSearchInput(value); // Update input immediately
  debouncedSetSearch(value); // Update filters after delay
};

// Cleanup
useEffect(() => {
  return () => {
    debouncedSetSearch.cancel();
  };
}, [debouncedSetSearch]);
\`\`\`

#### Verification Checklist

- [ ] Manual useEffect removed
- [ ] React Query used for data fetching
- [ ] Search debounced properly
- [ ] No excessive re-renders
- [ ] Performance improved

---

## 🔧 TASK 7: IMPLEMENT OPTIMISTIC UPDATES

### 7.1 Instant UI Feedback

**Effort**: 3 hours

**NOTE**: Already implemented in Task 5 (React Query hooks). The `useDeleteProductMutation` includes optimistic updates with rollback on error.

Review implementation in `src/hooks/queries/useProductsQuery.ts`:

\`\`\`typescript
export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await productsService.deleteProduct(id);
    },
    onMutate: async (productId) => {
      // ✅ OPTIMISTIC UPDATE
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });
      const previousProducts = queryClient.getQueriesData({ queryKey: productKeys.lists() });

      queryClient.setQueriesData<PaginatedResponse<Product>>(
        { queryKey: productKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((p) => p.id !== productId),
            total: old.total - 1,
          };
        }
      );

      return { previousProducts };
    },
    onError: (error, productId, context) => {
      // ✅ ROLLBACK ON ERROR
      if (context?.previousProducts) {
        context.previousProducts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to delete product');
    },
    onSuccess: () => {
      toast.success('Product deleted successfully');
    },
  });
};
\`\`\`

#### Verification Checklist

- [ ] Optimistic delete implemented
- [ ] Optimistic update implemented
- [ ] Rollback on error working
- [ ] UI updates instantly
- [ ] Error handling graceful

---

## 🔧 TASK 8: ADD BULK OPERATION PROGRESS INDICATORS

### 8.1 Bulk Delete with Progress

**File**: \`src/pages/admin/products/ProductCatalog.tsx\`  
**Effort**: 4 hours

#### Current Issue
No progress indication for bulk operations.

#### Implementation Steps

**Step 8.1.1: Add bulk progress state**

\`\`\`typescript
import { Progress } from '@/components/ui/progress';

const [bulkProgress, setBulkProgress] = useState<{
  isActive: boolean;
  current: number;
  total: number;
  operation: string;
}>({
  isActive: false,
  current: 0,
  total: 0,
  operation: '',
});
\`\`\`

**Step 8.1.2: Implement bulk delete handler**

\`\`\`typescript
const handleBulkDelete = async (selectedIds: string[]) => {
  if (!window.confirm(\`Delete \${selectedIds.length} products?\`)) {
    return;
  }

  setBulkProgress({
    isActive: true,
    current: 0,
    total: selectedIds.length,
    operation: 'Deleting products',
  });

  const results = await Promise.allSettled(
    selectedIds.map(async (id, index) => {
      try {
        await productsService.deleteProduct(id);
        setBulkProgress(prev => ({ ...prev, current: prev.current + 1 }));
        return { success: true, id };
      } catch (error) {
        return { success: false, id, error };
      }
    })
  );

  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - succeeded;

  setBulkProgress({ isActive: false, current: 0, total: 0, operation: '' });

  if (failed > 0) {
    toast.error(\`\${succeeded} deleted, \${failed} failed\`);
  } else {
    toast.success(\`\${succeeded} products deleted successfully\`);
  }

  // Refetch
  queryClient.invalidateQueries({ queryKey: productKeys.lists() });
};
\`\`\`

**Step 8.1.3: Add progress UI**

\`\`\`typescript
{bulkProgress.isActive && (
  <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-6 shadow-lg rounded-lg border z-50 min-w-[300px]">
    <div className="flex items-center justify-between mb-2">
      <h4 className="font-semibold">{bulkProgress.operation}</h4>
      <span className="text-sm text-gray-500">
        {bulkProgress.current}/{bulkProgress.total}
      </span>
    </div>
    <Progress 
      value={(bulkProgress.current / bulkProgress.total) * 100} 
      className="h-2"
    />
    <p className="text-xs text-gray-500 mt-2">
      Please wait, do not close this page...
    </p>
  </div>
)}
\`\`\`

#### Verification Checklist

- [ ] Bulk progress state added
- [ ] Parallel delete implementation
- [ ] Progress indicator UI
- [ ] Success/failure tracking
- [ ] Toast notifications
- [ ] Cache invalidation

---

## 🔧 TASK 9: ADD ZOD VALIDATION BEFORE API SEND

### 9.1 Client-Side Schema Validation

**Effort**: 4 hours

#### Implementation Steps

**Step 9.1.1: Install Zod**

\`\`\`bash
npm install zod
npm install @hookform/resolvers
\`\`\`

**Step 9.1.2: Create product validation schema**

Create file: \`src/schemas/productSchema.ts\`

\`\`\`typescript
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(255, 'Name must be less than 255 characters'),
  
  slug: z.string()
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .min(3, 'Slug must be at least 3 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description too long'),
  
  longDescription: z.string().optional(),
  
  price: z.number()
    .positive('Price must be positive')
    .max(999999, 'Price too high'),
  
  category: z.string()
    .min(1, 'Category is required'),
  
  subcategory: z.string().optional(),
  
  material: z.string()
    .min(1, 'Material is required'),
  
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  
  tags: z.array(z.string()).optional(),
  
  minOrder: z.number().int().positive().optional(),
  maxOrder: z.number().int().positive().optional(),
  
  leadTime: z.string().optional(),
  
  availability: z.enum(['in-stock', 'out-of-stock', 'pre-order']).optional(),
  
  features: z.array(z.string()).optional(),
  
  specifications: z.record(z.any()).optional(),
  
  status: z.enum(['draft', 'published', 'archived']).optional(),
}).refine(
  (data) => {
    if (data.minOrder && data.maxOrder) {
      return data.maxOrder >= data.minOrder;
    }
    return true;
  },
  {
    message: 'Max order must be greater than or equal to min order',
    path: ['maxOrder'],
  }
);

export type ProductFormData = z.infer<typeof productSchema>;
\`\`\`

**Step 9.1.3: Update create product mutation**

Update: \`src/hooks/queries/useProductsQuery.ts\`

\`\`\`typescript
import { productSchema } from '@/schemas/productSchema';

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  const { tenant } = useTenantAuth();

  return useMutation({
    mutationFn: async (data: CreateProductRequest) => {
      // ✅ VALIDATE BEFORE API CALL
      try {
        productSchema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => \`\${e.path.join('.')}: \${e.message}\`).join(', ');
          throw new Error(\`Validation failed: \${errorMessages}\`);
        }
        throw error;
      }

      if (!tenant?.uuid) {
        throw new Error('Tenant context required');
      }
      
      return await productsService.createProduct(data);
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Product created successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to create product', { error: error.message });
      toast.error(error.message);
    },
  });
};
\`\`\`

**Step 9.1.4: Integrate with React Hook Form**

In product form component:

\`\`\`typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/schemas/productSchema';

const ProductForm = () => {
  const createMutation = useCreateProductMutation();
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      price: 0,
      category: '',
      material: '',
      images: [],
      status: 'draft',
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with form.register */}
    </form>
  );
};
\`\`\`

#### Verification Checklist

- [ ] Zod installed
- [ ] Product schema created
- [ ] Validation in mutation hooks
- [ ] React Hook Form integration
- [ ] Error messages user-friendly
- [ ] All required fields validated
- [ ] Custom validation rules work

---

## 🔧 TASK 10: IMPLEMENT REQUEST CANCELLATION ON UNMOUNT

### 10.1 AbortController Integration

**Effort**: 2 hours

**NOTE**: React Query automatically handles request cancellation. When a component unmounts or query becomes inactive, React Query cancels pending requests.

#### Verification

Verify React Query configuration includes:

\`\`\`typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ✅ Requests auto-cancelled on unmount
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
\`\`\`

#### Manual AbortController (if needed for custom hooks)

\`\`\`typescript
const fetchProducts = useCallback(async (filters?: ProductFilters) => {
  const abortController = new AbortController();

  try {
    const response = await apiClient.get('/products', {
      signal: abortController.signal,
      params: filters,
    });
    return response.data;
  } catch (error) {
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      // Request cancelled, ignore
      return;
    }
    throw error;
  }
}, []);
\`\`\`

#### Verification Checklist

- [ ] React Query auto-cancellation verified
- [ ] No memory leak warnings
- [ ] No state updates on unmounted components
- [ ] AbortController used in custom hooks (if any)

---

## 🔧 TASK 11: REPLACE HARDCODED CATEGORY OPTIONS

### 11.1 Dynamic Category Loading

**File**: \`src/pages/admin/products/ProductCatalog.tsx\`  
**Effort**: 2 hours

#### Current Issue
\`\`\`typescript
// ❌ HARDCODED
<SelectItem value="etching">Etching</SelectItem>
<SelectItem value="engraving">Engraving</SelectItem>
<SelectItem value="custom">Custom</SelectItem>
\`\`\`

#### Implementation Steps

**Step 11.1.1: Create categories API hook**

Create file: \`src/hooks/queries/useCategoriesQuery.ts\`

\`\`\`typescript
import { useQuery } from '@tanstack/react-query';
import { createContextAwareProductsService } from '@/services/api/contextAwareProductsService';

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch from API
      const response = await apiClient.get('/admin/product-categories');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};
\`\`\`

**Step 11.1.2: Update component**

\`\`\`typescript
import { useCategories } from '@/hooks/queries/useCategoriesQuery';

const { data: categories, isLoading: loadingCategories } = useCategories();

// In JSX:
<SelectContent>
  <SelectItem value="">All Categories</SelectItem>
  {loadingCategories ? (
    <SelectItem value="" disabled>Loading...</SelectItem>
  ) : (
    categories?.map(cat => (
      <SelectItem key={cat.id} value={cat.slug}>
        {cat.name}
      </SelectItem>
    ))
  )}
</SelectContent>
\`\`\`

#### Verification Checklist

- [ ] Categories fetched from API
- [ ] Categories cached
- [ ] Loading state shown
- [ ] No hardcoded options
- [ ] Dynamic updates work

---

## 🔧 TASK 12: REPLACE HARDCODED STATUS OPTIONS

### 12.1 Configuration-Based Status Options

**Effort**: 2 hours

#### Implementation Steps

**Step 12.1.1: Create status constants**

Create file: \`src/constants/productStatus.ts\`

\`\`\`typescript
export const PRODUCT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'gray' },
  { value: 'published', label: 'Published', color: 'green' },
  { value: 'archived', label: 'Archived', color: 'red' },
] as const;

export type ProductStatus = typeof PRODUCT_STATUS_OPTIONS[number]['value'];
\`\`\`

**Step 12.1.2: Update component**

\`\`\`typescript
import { PRODUCT_STATUS_OPTIONS } from '@/constants/productStatus';

<SelectContent>
  <SelectItem value="">All Status</SelectItem>
  {PRODUCT_STATUS_OPTIONS.map(status => (
    <SelectItem key={status.value} value={status.value}>
      {status.label}
    </SelectItem>
  ))}
</SelectContent>
\`\`\`

#### Verification Checklist

- [ ] Status options from constants
- [ ] No hardcoded strings
- [ ] Easy to update/extend
- [ ] Type-safe

---

## ✅ TESTING REQUIREMENTS

### Integration Testing

1. **Error Handling Tests**
   - Auth failure detection and redirect
   - Permission errors
   - Network error retry

2. **Performance Tests**
   - React Query caching
   - No excessive re-renders
   - Request cancellation

3. **UX Tests**
   - Optimistic updates
   - Bulk operation progress
   - Validation errors

4. **Data Integrity Tests**
   - Tenant context validation
   - Zod validation
   - Dynamic options loading

### Test Commands

\`\`\`bash
npm run test
npm run test:coverage
npm run test:e2e
\`\`\`

---

## 📊 VERIFICATION CHECKLIST

### Architecture & Error Handling
- [ ] Custom error classes implemented
- [ ] Auth failure detection working
- [ ] Tenant context validation complete
- [ ] Structured logging implemented
- [ ] Error tracking integrated

### Performance & Resilience
- [ ] Retry mechanism working
- [ ] React Query caching active
- [ ] No excessive re-renders
- [ ] Request cancellation verified

### UX Improvements
- [ ] Optimistic updates working
- [ ] Bulk operations with progress
- [ ] Smooth user experience

### Data Integrity
- [ ] Zod validation on all forms
- [ ] Dynamic categories loaded
- [ ] Dynamic status options
- [ ] No hardcoded data

### Production Readiness
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance metrics acceptable
- [ ] Documentation updated

---

## 🎯 SUCCESS CRITERIA

### Technical Metrics
- ✅ Error handling coverage: 100%
- ✅ API retry success rate: >95%
- ✅ Cache hit ratio: >70%
- ✅ Re-render reduction: >80%
- ✅ Validation coverage: 100%

### User Experience
- ✅ No silent failures
- ✅ Clear error messages
- ✅ Instant UI feedback
- ✅ Progress indication on bulk ops

### Code Quality
- ✅ No console.log/console.error in production
- ✅ TypeScript strict mode passing
- ✅ ESLint warnings: 0
- ✅ Code coverage: >80%

---

## 📝 DEPLOYMENT READINESS

### Pre-Deployment Checklist
- [ ] Phase 1 (Emergency Fixes) completed
- [ ] All Phase 2 tasks completed
- [ ] Integration tests passing
- [ ] Performance tests passing
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Stakeholder approval

### Rollback Plan
If issues occur:
1. Revert to Phase 1 completion tag
2. Disable React Query (fallback to useState)
3. Disable retry mechanism
4. Re-enable console logging temporarily
5. Monitor error tracking dashboard

---

**END OF PHASE 2 ROADMAP**