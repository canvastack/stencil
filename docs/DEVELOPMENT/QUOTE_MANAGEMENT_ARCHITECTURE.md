# Quote Management Architecture

## Overview

This document provides comprehensive technical documentation for the Quote Management Workflow system in CanvaStencil. It covers the hexagonal architecture implementation, data flows, component hierarchy, state management, API integration patterns, and testing strategies.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Hexagonal Architecture Implementation](#hexagonal-architecture-implementation)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Component Hierarchy](#component-hierarchy)
5. [State Management](#state-management)
6. [API Integration Patterns](#api-integration-patterns)
7. [Database Schema & Indexes](#database-schema--indexes)
8. [Testing Strategy](#testing-strategy)
9. [Performance Optimization](#performance-optimization)
10. [Security Considerations](#security-considerations)
11. [Code Examples](#code-examples)
12. [Migration Guide](#migration-guide)

---

## Architecture Overview

### System Context

The Quote Management system integrates with:
- **Order Management**: Order status advancement
- **Vendor Management**: Vendor selection and information
- **Customer Management**: Customer data and quotations
- **Notification System**: In-app notifications (Phase 2: Email)

### Technology Stack

**Backend**:
- Laravel 10 (PHP 8.2+)
- PostgreSQL 15+
- Eloquent ORM
- Laravel Sanctum (Authentication)

**Frontend**:
- React 18.3.1
- TypeScript 5.5
- Zustand (State Management)
- React Query (Data Fetching)
- Tailwind CSS + shadcn-ui

### Design Principles

1. **Hexagonal Architecture**: Clean separation of concerns
2. **Domain-Driven Design**: Business logic in domain layer
3. **CQRS Pattern**: Separate read and write operations
4. **Event-Driven**: Domain events for loose coupling
5. **Tenant Isolation**: Complete data isolation per tenant


---

## Hexagonal Architecture Implementation

### Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (HTTP Controllers, API Resources, Request Validation)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│        (Use Cases, Commands, Queries, DTOs)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  (Entities, Value Objects, Domain Services, Events)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│    (Eloquent Models, Repositories, External Services)        │
└─────────────────────────────────────────────────────────────┘
```

### Backend Structure

```
backend/app/
├── Domain/
│   └── Quote/
│       ├── Entities/
│       │   └── Quote.php                    # Domain entity
│       ├── Services/
│       │   ├── QuoteDuplicationChecker.php  # Duplicate detection
│       │   └── QuoteStatusManager.php       # Status transitions
│       ├── Events/
│       │   ├── QuoteAccepted.php            # Quote accepted event
│       │   └── QuoteRejected.php            # Quote rejected event
│       └── ValueObjects/
│           └── QuoteStatus.php              # Status value object
│
├── Application/
│   └── Quote/
│       ├── Commands/
│       │   ├── AcceptQuoteCommand.php       # Accept quote DTO
│       │   └── RejectQuoteCommand.php       # Reject quote DTO
│       ├── Queries/
│       │   └── CheckExistingQuoteQuery.php  # Check duplicate query
│       └── UseCases/
│           ├── AcceptQuoteUseCase.php       # Accept quote logic
│           ├── RejectQuoteUseCase.php       # Reject quote logic
│           └── CheckExistingQuoteUseCase.php # Check duplicates
│
└── Infrastructure/
    ├── Persistence/
    │   └── Eloquent/
    │       ├── Models/
    │       │   └── OrderVendorNegotiation.php # Eloquent model
    │       └── Repositories/
    │           └── QuoteRepository.php        # Repository impl
    │
    └── Presentation/
        └── Http/
            └── Controllers/
                └── Tenant/
                    └── QuoteController.php    # API controller
```

### Frontend Structure

```
frontend/src/
├── pages/
│   └── tenant/
│       ├── QuoteManagement.tsx          # Main quote list page
│       ├── QuoteDetail.tsx              # Quote detail view
│       └── QuoteEdit.tsx                # Quote edit page
│
├── components/
│   └── tenant/
│       └── quotes/
│           ├── QuoteList.tsx            # Quote table
│           ├── QuoteForm.tsx            # Quote form
│           ├── QuoteDetailView.tsx      # Read-only quote view
│           ├── QuoteActions.tsx         # Action buttons
│           ├── QuoteStatusBadge.tsx     # Status indicator
│           ├── QuoteHistory.tsx         # Negotiation history
│           ├── AcceptQuoteDialog.tsx    # Accept confirmation
│           ├── RejectQuoteDialog.tsx    # Reject with reason
│           └── CounterOfferDialog.tsx   # Counter offer form
│
├── hooks/
│   ├── useQuoteActions.ts               # Quote action handlers
│   └── useDuplicateQuoteCheck.ts        # Duplicate detection
│
├── stores/
│   └── quoteStore.ts                    # Zustand store
│
└── services/
    └── quoteService.ts                  # API client
```


---

## Data Flow Diagrams

### 1. Duplicate Quote Prevention Flow

```
User navigates to /admin/quotes?order_id={uuid}
              ↓
QuoteManagement component mounts
              ↓
useDuplicateQuoteCheck hook triggered
              ↓
GET /api/v1/tenant/quotes?order_id={uuid}&status=open,draft,sent,countered
              ↓
┌─────────────────────────────────────────┐
│ Backend: QuoteController::index()       │
│ - Validate tenant_id                    │
│ - Filter by order_id and statuses       │
│ - Return first matching quote           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Frontend: Check Response                │
├─────────────────────────────────────────┤
│ If quotes.length > 0:                   │
│   → hasActiveQuote = true               │
│   → existingQuote = quotes[0]           │
│   → Open modal in EDIT mode             │
│                                         │
│ If quotes.length === 0:                 │
│   → hasActiveQuote = false              │
│   → existingQuote = null                │
│   → Open modal in CREATE mode           │
└─────────────────────────────────────────┘
```

### 2. Quote Accept Flow

```
Admin clicks "Accept" button
              ↓
AcceptQuoteDialog opens
              ↓
Admin confirms acceptance
              ↓
POST /api/v1/tenant/quotes/{id}/accept
              ↓
┌─────────────────────────────────────────────────────────┐
│ Backend: QuoteController::accept()                      │
├─────────────────────────────────────────────────────────┤
│ DB::transaction(function() {                            │
│                                                         │
│   1. Validate Quote                                     │
│      - Tenant isolation check                           │
│      - Status is 'open' or 'countered'                  │
│      - Not expired                                      │
│                                                         │
│   2. Update Quote                                       │
│      - status = 'accepted'                              │
│      - closed_at = now()                                │
│      - Add to history                                   │
│                                                         │
│   3. Auto-Reject Other Quotes                           │
│      - Same order_id                                    │
│      - Different quote id                               │
│      - Status IN ('open', 'countered')                  │
│      - Set status = 'rejected'                          │
│      - Add rejection reason to history                  │
│                                                         │
│   4. Update Order                                       │
│      - vendor_quoted_price = quote.latest_offer         │
│      - quotation_amount = latest_offer × 1.35           │
│      - vendor_id = quote.vendor_id                      │
│      - vendor_terms = quote.terms                       │
│      - status = 'customer_quote'                        │
│                                                         │
│   5. Create Order History Entry                         │
│      - action = 'quote_accepted'                        │
│      - user_id = current_user                           │
│      - metadata = quote details                         │
│                                                         │
│   6. Dispatch Domain Event                              │
│      - QuoteAccepted event                              │
│      - Triggers listeners (notifications, etc.)         │
│                                                         │
│ });                                                     │
└─────────────────────────────────────────────────────────┘
              ↓
Return success response with quote + order data
              ↓
Frontend: Show success toast
              ↓
Redirect to order detail page
              ↓
Order status now shows "Customer Quote"
```

### 3. Quote Reject Flow

```
Admin clicks "Reject" button
              ↓
RejectQuoteDialog opens
              ↓
Admin enters rejection reason (min 10 chars)
              ↓
POST /api/v1/tenant/quotes/{id}/reject
Body: { reason: "Price too high" }
              ↓
┌─────────────────────────────────────────────────────────┐
│ Backend: QuoteController::reject()                      │
├─────────────────────────────────────────────────────────┤
│ 1. Validate rejection reason                            │
│    - Required, min 10 chars, max 1000 chars             │
│                                                         │
│ 2. Update Quote                                         │
│    - status = 'rejected'                                │
│    - closed_at = now()                                  │
│    - Add rejection to history with reason               │
│                                                         │
│ 3. Check Other Quotes                                   │
│    - Count active quotes for same order                 │
│    - Active = status IN ('open', 'countered', 'sent')   │
│                                                         │
│ 4. If All Quotes Rejected                               │
│    - Update order status to 'vendor_sourcing'           │
│    - Create order history entry                         │
│    - Set all_quotes_rejected = true in response         │
│                                                         │
│ 5. Dispatch Domain Event                                │
│    - QuoteRejected event                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
              ↓
Return success response
              ↓
Frontend: Show appropriate notification
              ↓
If all_quotes_rejected:
  → Show warning modal
  → Suggest selecting new vendor
Else:
  → Show success toast
  → Refresh quote list
```


---

## Component Hierarchy

### Frontend Component Tree

```
QuoteManagement (Page)
├── QuoteList (Table Component)
│   ├── QuoteStatusBadge (Status Display)
│   ├── QuoteActions (Action Buttons)
│   └── Pagination
│
├── QuoteForm (Modal/Dialog)
│   ├── OrderSelect
│   ├── VendorSelect
│   ├── PriceInput
│   ├── DatePicker (valid_until)
│   └── TermsEditor
│
└── DashboardWidget
    └── QuoteNotifications
        └── QuoteCard (×5)

QuoteDetail (Page)
├── QuoteDetailView (Read-Only Display)
│   ├── QuoteHeader
│   ├── OrderInformation
│   ├── VendorInformation
│   ├── QuoteItems
│   ├── TermsAndConditions
│   └── QuoteHistory
│
└── QuoteActions (Action Buttons)
    ├── AcceptQuoteDialog
    ├── RejectQuoteDialog
    ├── CounterOfferDialog
    └── EditButton

QuoteEdit (Page)
└── QuoteForm (Edit Mode)
    └── [Same as create mode with pre-populated data]
```

### Component Props & Interfaces

```typescript
// QuoteDetailView.tsx
interface QuoteDetailViewProps {
  quoteId: string;
  showActions?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
}

// QuoteActions.tsx
interface QuoteActionsProps {
  quote: Quote;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
  loading?: boolean;
}

// QuoteForm.tsx
interface QuoteFormProps {
  initialData?: Quote;
  mode: 'create' | 'edit';
  orderId?: string;
  onSubmit: (data: QuoteFormData) => Promise<void>;
  onCancel: () => void;
}

// QuoteStatusBadge.tsx
interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  showReadOnly?: boolean;
  showActive?: boolean;
}
```


---

## State Management

### Zustand Store Structure

```typescript
// stores/quoteStore.ts
interface QuoteStore {
  // State
  quotes: Quote[];
  quotesLoading: boolean;
  error: string | null;
  activeQuoteForOrder: Quote | null;
  checkingDuplicate: boolean;
  
  // Actions
  fetchQuotes: (filters?: QuoteListParams) => Promise<void>;
  createQuote: (data: CreateQuoteRequest) => Promise<Quote>;
  updateQuote: (id: string, data: UpdateQuoteRequest) => Promise<Quote>;
  acceptQuote: (id: string) => Promise<void>;
  rejectQuote: (id: string, reason: string) => Promise<void>;
  counterQuote: (id: string, price: number, notes?: string) => Promise<void>;
  checkExistingQuote: (orderId: string, vendorId?: string) => Promise<{
    hasActiveQuote: boolean;
    quote: Quote | null;
  }>;
  
  // Utilities
  clearError: () => void;
  reset: () => void;
}
```

### React Query Integration

```typescript
// hooks/useQuoteActions.ts
export const useQuoteActions = () => {
  const queryClient = useQueryClient();
  
  const acceptMutation = useMutation({
    mutationFn: (id: string) => quoteService.acceptQuote(id),
    onSuccess: (data) => {
      // Invalidate quotes cache
      queryClient.invalidateQueries(['quotes']);
      // Invalidate orders cache (order status changed)
      queryClient.invalidateQueries(['orders']);
      // Show success notification
      toast.success('Quote accepted and order updated');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      quoteService.rejectQuote(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['quotes']);
      if (data.all_quotes_rejected) {
        toast.warning('All quotes rejected. Order reverted to vendor sourcing.');
      } else {
        toast.success('Quote rejected');
      }
    },
  });
  
  return { acceptMutation, rejectMutation };
};
```

### Cache Invalidation Strategy

```typescript
// When to invalidate caches:

// 1. After quote acceptance
queryClient.invalidateQueries(['quotes']);           // Refresh quote list
queryClient.invalidateQueries(['orders']);           // Order status changed
queryClient.invalidateQueries(['dashboard-stats']); // Update dashboard

// 2. After quote rejection
queryClient.invalidateQueries(['quotes']);
// Only invalidate orders if all quotes rejected

// 3. After quote creation/update
queryClient.invalidateQueries(['quotes']);
queryClient.setQueryData(['quote', quoteId], newQuoteData); // Optimistic update

// 4. After counter offer
queryClient.invalidateQueries(['quotes']);
queryClient.invalidateQueries(['quote', quoteId]);
```

---

## API Integration Patterns

### Service Layer Pattern

```typescript
// services/quoteService.ts
class QuoteService {
  private baseUrl = '/api/v1/tenant/quotes';
  
  async getQuotes(params?: QuoteListParams): Promise<PaginatedResponse<Quote>> {
    const response = await apiClient.get(this.baseUrl, { params });
    return response.data;
  }
  
  async getQuote(id: string): Promise<Quote> {
    const response = await apiClient.get(`${this.baseUrl}/${id}`);
    return response.data.data;
  }
  
  async createQuote(data: CreateQuoteRequest): Promise<Quote> {
    const response = await apiClient.post(this.baseUrl, data);
    return response.data.data;
  }
  
  async acceptQuote(id: string): Promise<AcceptQuoteResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/accept`);
    return response.data.data;
  }
  
  async rejectQuote(id: string, reason: string): Promise<RejectQuoteResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${id}/reject`, { reason });
    return response.data.data;
  }
  
  async checkExisting(orderId: string, vendorId?: string): Promise<CheckExistingResponse> {
    const response = await apiClient.get(`${this.baseUrl}/check-existing`, {
      params: { order_id: orderId, vendor_id: vendorId }
    });
    return response.data.data;
  }
}

export const quoteService = new QuoteService();
```

### Error Handling Pattern

```typescript
// utils/errorHandler.ts
export const handleQuoteError = (error: AxiosError) => {
  if (error.response?.status === 422) {
    const message = error.response.data.message;
    
    if (message.includes('expired')) {
      return 'This quote has expired and cannot be accepted.';
    }
    if (message.includes('already accepted')) {
      return 'This quote has already been accepted.';
    }
    if (message.includes('duplicate')) {
      return 'An active quote already exists for this order and vendor.';
    }
  }
  
  if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  return 'An unexpected error occurred. Please try again.';
};
```

### Tenant Scoping Pattern

```typescript
// All API requests automatically include tenant header via interceptor
apiClient.interceptors.request.use((config) => {
  const tenantId = getTenantId(); // From auth context
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  return config;
});
```

---

## Database Schema & Indexes

### Table: order_vendor_negotiations

```sql
CREATE TABLE order_vendor_negotiations (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Quote identification
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Pricing
    initial_offer BIGINT NOT NULL, -- in cents
    latest_offer BIGINT NOT NULL,  -- in cents
    currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
    
    -- Status and lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    round INTEGER NOT NULL DEFAULT 1,
    
    -- Terms
    terms JSONB,
    
    -- Timestamps
    expires_at TIMESTAMP,
    closed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Audit trail
    history JSONB NOT NULL DEFAULT '[]',
    metadata JSONB,
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN (
        'draft', 'open', 'sent', 'countered', 
        'accepted', 'rejected', 'expired', 'cancelled'
    )),
    CONSTRAINT positive_amounts CHECK (
        initial_offer > 0 AND latest_offer > 0
    ),
    CONSTRAINT valid_round CHECK (round >= 1 AND round <= 5)
);
```

### Performance Indexes

```sql
-- 1. Composite index for duplicate check
CREATE INDEX idx_order_vendor_negotiations_order_vendor_status 
ON order_vendor_negotiations(order_id, vendor_id, status)
WHERE status IN ('draft', 'open', 'sent', 'countered');

-- Purpose: Fast duplicate detection
-- Query: SELECT * FROM order_vendor_negotiations 
--        WHERE order_id = ? AND vendor_id = ? 
--        AND status IN ('draft', 'open', 'sent', 'countered')

-- 2. Index for quote listing by order
CREATE INDEX idx_order_vendor_negotiations_order_created 
ON order_vendor_negotiations(order_id, created_at DESC);

-- Purpose: Fast quote retrieval for specific order
-- Query: SELECT * FROM order_vendor_negotiations 
--        WHERE order_id = ? ORDER BY created_at DESC

-- 3. Tenant scoping index
CREATE INDEX idx_order_vendor_negotiations_tenant_status 
ON order_vendor_negotiations(tenant_id, status, created_at DESC);

-- Purpose: Fast quote listing with status filter
-- Query: SELECT * FROM order_vendor_negotiations 
--        WHERE tenant_id = ? AND status = ? 
--        ORDER BY created_at DESC

-- 4. UUID lookup index (already created by UNIQUE constraint)
-- Purpose: Fast quote retrieval by UUID for API endpoints

-- 5. Vendor quotes index
CREATE INDEX idx_order_vendor_negotiations_vendor_status 
ON order_vendor_negotiations(vendor_id, status, created_at DESC);

-- Purpose: Vendor-specific quote listing
-- Query: SELECT * FROM order_vendor_negotiations 
--        WHERE vendor_id = ? AND status = ? 
--        ORDER BY created_at DESC
```

### Index Usage Verification

```sql
-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM order_vendor_negotiations
WHERE order_id = 123 
  AND vendor_id = 456 
  AND status IN ('draft', 'open', 'sent', 'countered');

-- Expected output should show:
-- Index Scan using idx_order_vendor_negotiations_order_vendor_status
```

### History JSON Structure

```json
{
  "history": [
    {
      "action": "created",
      "user_id": "uuid",
      "timestamp": "2026-02-02T10:00:00Z",
      "notes": "Initial quote created"
    },
    {
      "action": "countered",
      "user_id": "uuid",
      "timestamp": "2026-02-02T14:00:00Z",
      "previous_offer": 5000000,
      "new_offer": 4500000,
      "notes": "Counter offer sent"
    },
    {
      "action": "accepted",
      "user_id": "uuid",
      "timestamp": "2026-02-02T16:00:00Z",
      "notes": "Quote accepted by admin"
    }
  ]
}
```


---

## Testing Strategy

### Unit Tests

#### Backend Unit Tests

```php
// tests/Unit/Domain/Quote/QuoteDuplicationCheckerTest.php
class QuoteDuplicationCheckerTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_detects_duplicate_quote_for_same_order_and_vendor()
    {
        $checker = new QuoteDuplicationChecker();
        
        $existingQuote = OrderVendorNegotiation::factory()->create([
            'order_id' => 1,
            'vendor_id' => 1,
            'status' => 'open',
        ]);
        
        $hasDuplicate = $checker->check(
            orderId: 1,
            vendorId: 1,
            statuses: ['open', 'draft']
        );
        
        $this->assertTrue($hasDuplicate);
    }
    
    public function test_allows_quote_for_different_vendor()
    {
        $checker = new QuoteDuplicationChecker();
        
        OrderVendorNegotiation::factory()->create([
            'order_id' => 1,
            'vendor_id' => 1,
            'status' => 'open',
        ]);
        
        $hasDuplicate = $checker->check(
            orderId: 1,
            vendorId: 2, // Different vendor
            statuses: ['open', 'draft']
        );
        
        $this->assertFalse($hasDuplicate);
    }
    
    public function test_ignores_rejected_quotes()
    {
        $checker = new QuoteDuplicationChecker();
        
        OrderVendorNegotiation::factory()->create([
            'order_id' => 1,
            'vendor_id' => 1,
            'status' => 'rejected',
        ]);
        
        $hasDuplicate = $checker->check(
            orderId: 1,
            vendorId: 1,
            statuses: ['open', 'draft']
        );
        
        $this->assertFalse($hasDuplicate);
    }
}
```

#### Frontend Unit Tests

```typescript
// hooks/__tests__/useDuplicateQuoteCheck.test.ts
describe('useDuplicateQuoteCheck', () => {
  it('detects existing active quote', async () => {
    const mockQuote = createMockQuote({ status: 'open' });
    jest.spyOn(quoteService, 'getQuotes').mockResolvedValue({
      data: [mockQuote],
      meta: { total: 1 }
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useDuplicateQuoteCheck('order-uuid')
    );
    
    await waitForNextUpdate();
    
    expect(result.current.hasActiveQuote).toBe(true);
    expect(result.current.existingQuote).toEqual(mockQuote);
  });
  
  it('returns null when no active quote', async () => {
    jest.spyOn(quoteService, 'getQuotes').mockResolvedValue({
      data: [],
      meta: { total: 0 }
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useDuplicateQuoteCheck('order-uuid')
    );
    
    await waitForNextUpdate();
    
    expect(result.current.hasActiveQuote).toBe(false);
    expect(result.current.existingQuote).toBeNull();
  });
});
```

### Integration Tests

```php
// tests/Integration/QuoteManagementWorkflowTest.php
class QuoteManagementWorkflowTest extends TestCase
{
    use RefreshDatabase;
    
    public function test_complete_quote_acceptance_workflow()
    {
        $tenant = Tenant::factory()->create();
        $this->actingAsTenant($tenant);
        
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'vendor_negotiation',
        ]);
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'status' => 'open',
            'latest_offer' => 5000000, // Rp 50,000 in cents
        ]);
        
        // Accept quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
        
        $response->assertStatus(200);
        
        // Assert quote updated
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $quote->id,
            'status' => 'accepted',
        ]);
        
        // Assert order updated
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'customer_quote',
            'vendor_quoted_price' => 5000000,
            'quotation_amount' => 6750000, // 5M × 1.35
        ]);
    }
    
    public function test_accepting_quote_rejects_other_quotes()
    {
        $tenant = Tenant::factory()->create();
        $this->actingAsTenant($tenant);
        
        $order = Order::factory()->create(['tenant_id' => $tenant->id]);
        
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'status' => 'open',
        ]);
        
        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'status' => 'open',
        ]);
        
        $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/accept");
        
        // Assert quote2 auto-rejected
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $quote2->id,
            'status' => 'rejected',
        ]);
    }
    
    public function test_tenant_isolation_in_quote_acceptance()
    {
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant2->id,
        ]);
        
        // Try to accept quote from different tenant
        $this->actingAsTenant($tenant1);
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
        
        $response->assertStatus(404); // Not found due to tenant scoping
    }
}
```

### E2E Tests (Playwright)

```typescript
// e2e/quote-management.spec.ts
test.describe('Quote Management Workflow', () => {
  test('complete quote acceptance flow', async ({ page }) => {
    // Login as tenant admin
    await loginAsTenantAdmin(page);
    
    // Navigate to order detail
    await page.goto('/admin/orders/ORD-2026-001');
    
    // Click manage quote
    await page.click('button:has-text("Manage Quote")');
    
    // Fill quote form
    await page.selectOption('select[name="vendor_id"]', 'vendor-uuid');
    await page.fill('input[name="initial_offer"]', '5000000');
    await page.fill('input[name="expires_at"]', '2026-12-31');
    
    // Submit quote
    await page.click('button:has-text("Create Quote")');
    
    // Wait for redirect to quote detail
    await page.waitForURL(/\/admin\/quotes\/.+/);
    
    // Accept quote
    await page.click('button:has-text("Accept")');
    
    // Confirm in dialog
    await page.click('button:has-text("Confirm Accept")');
    
    // Verify success notification
    await expect(page.locator('.toast-success')).toContainText('Quote accepted');
    
    // Verify redirected to order page
    await page.waitForURL(/\/admin\/orders\/.+/);
    
    // Verify order status updated
    await expect(page.locator('.order-status')).toContainText('Customer Quote');
  });
  
  test('duplicate prevention workflow', async ({ page }) => {
    await loginAsTenantAdmin(page);
    
    // Create first quote
    await page.goto('/admin/orders/ORD-2026-001');
    await page.click('button:has-text("Manage Quote")');
    // ... create quote
    
    // Try to create second quote for same order
    await page.goto('/admin/orders/ORD-2026-001');
    await page.click('button:has-text("Manage Quote")');
    
    // Verify modal opens in EDIT mode
    await expect(page.locator('h2')).toContainText('Edit Quote');
    
    // Verify existing quote data loaded
    await expect(page.locator('input[name="initial_offer"]')).toHaveValue('5000000');
  });
});
```

### Test Coverage Goals

- **Backend Unit Tests**: 80%+ coverage
- **Backend Integration Tests**: All critical workflows
- **Frontend Unit Tests**: 70%+ coverage
- **E2E Tests**: All user-facing workflows

---

## Performance Optimization

### Database Query Optimization

```php
// ❌ BAD: N+1 query problem
$quotes = OrderVendorNegotiation::where('tenant_id', $tenantId)->get();
foreach ($quotes as $quote) {
    echo $quote->vendor->name; // N+1 queries
    echo $quote->order->order_number;
}

// ✅ GOOD: Eager loading
$quotes = OrderVendorNegotiation::with([
    'vendor:id,uuid,name,email',
    'order:id,uuid,order_number,status',
    'order.customer:id,uuid,name,company'
])
->where('tenant_id', $tenantId)
->get();
```

### Pagination Strategy

```php
// Always paginate large result sets
$quotes = OrderVendorNegotiation::where('tenant_id', $tenantId)
    ->with(['vendor', 'order'])
    ->orderBy('created_at', 'desc')
    ->paginate(20); // 20 items per page
```

### Frontend Performance

```typescript
// 1. React Query caching
const { data: quotes } = useQuery({
  queryKey: ['quotes', filters],
  queryFn: () => quoteService.getQuotes(filters),
  staleTime: 30000, // 30 seconds
  cacheTime: 300000, // 5 minutes
});

// 2. Debounced search
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    setSearchTerm(value);
  }, 300),
  []
);

// 3. Virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: quotes.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
});
```

### Caching Strategy

```php
// Cache frequently accessed data
Cache::remember("tenant.{$tenantId}.pending_quotes_count", 300, function () use ($tenantId) {
    return OrderVendorNegotiation::where('tenant_id', $tenantId)
        ->whereIn('status', ['open', 'countered'])
        ->count();
});

// Invalidate cache after mutations
Cache::forget("tenant.{$tenantId}.pending_quotes_count");
```

---

## Security Considerations

### 1. Tenant Isolation

```php
// CRITICAL: Always scope queries by tenant_id
$quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
    ->where('uuid', $id)
    ->firstOrFail();

// Validate tenant_id matches before any operation
if ($quote->tenant_id !== $tenantId) {
    abort(403, 'Cross-tenant access denied');
}
```

### 2. Authorization Checks

```php
// Middleware: tenant.scoped already handles basic tenant isolation
// Additional permission checks:
if (!auth()->user()->can('accept-quotes')) {
    abort(403, 'Insufficient permissions');
}
```

### 3. Input Validation

```php
// Accept quote validation
$request->validate([
    // No input needed, just validate quote state
]);

// Reject quote validation
$request->validate([
    'reason' => 'required|string|min:10|max:1000'
]);

// Counter offer validation
$request->validate([
    'quoted_price' => 'required|numeric|min:0',
    'notes' => 'sometimes|string|max:1000'
]);
```

### 4. UUID-Only Public APIs

```typescript
// ✅ CORRECT: Use UUIDs in frontend
const quote = await quoteService.getQuote(quote.id); // UUID

// ❌ WRONG: Never expose internal IDs
// const quote = await quoteService.getQuote(quote.internal_id); // BIGINT
```

### 5. SQL Injection Prevention

```php
// ✅ GOOD: Use query builder with parameter binding
OrderVendorNegotiation::where('tenant_id', $tenantId)
    ->where('status', $status)
    ->get();

// ❌ BAD: Raw SQL without binding
DB::select("SELECT * FROM order_vendor_negotiations WHERE status = '$status'");
```

### 6. XSS Prevention

```typescript
// ✅ GOOD: React automatically escapes
<div>{quote.vendor.name}</div>

// ❌ BAD: dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: quote.notes }} />

// ✅ GOOD: Sanitize HTML if needed
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(quote.notes) }} />
```


---

## Code Examples

### Example 1: Creating a Quote with Duplicate Check

```typescript
// components/tenant/quotes/QuoteManagement.tsx
const QuoteManagement = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const { checking, hasActiveQuote, existingQuote } = useDuplicateQuoteCheck(orderId);
  const [showDialog, setShowDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (orderId && !checking) {
      if (hasActiveQuote && existingQuote) {
        // Edit mode: existing quote found
        setEditMode(true);
        setShowDialog(true);
      } else {
        // Create mode: no active quote
        setEditMode(false);
        setShowDialog(true);
      }
    }
  }, [orderId, checking, hasActiveQuote, existingQuote]);

  const handleSubmit = async (data: QuoteFormData) => {
    try {
      if (editMode && existingQuote) {
        await quoteService.updateQuote(existingQuote.id, data);
        toast.success('Quote updated successfully');
      } else {
        await quoteService.createQuote(data);
        toast.success('Quote created successfully');
      }
      setShowDialog(false);
    } catch (error) {
      toast.error(handleQuoteError(error));
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editMode 
              ? `Edit Quote ${existingQuote?.quote_number}` 
              : 'Create New Quote'
            }
          </DialogTitle>
        </DialogHeader>
        <QuoteForm
          initialData={editMode ? existingQuote : undefined}
          mode={editMode ? 'edit' : 'create'}
          orderId={orderId}
          onSubmit={handleSubmit}
          onCancel={() => setShowDialog(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
```

### Example 2: Accepting a Quote (Backend)

```php
// app/Infrastructure/Presentation/Http/Controllers/Tenant/QuoteController.php
public function accept(Request $request, string $id)
{
    $tenantId = $this->getCurrentTenantId($request);
    
    $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
        ->where('uuid', $id)
        ->with(['order', 'vendor'])
        ->firstOrFail();

    // Validation
    if ($quote->status === 'accepted') {
        return response()->json([
            'success' => false,
            'message' => 'Quote has already been accepted'
        ], 422);
    }

    if ($quote->status === 'expired' || ($quote->expires_at && $quote->expires_at < now())) {
        return response()->json([
            'success' => false,
            'message' => 'Cannot accept expired quote'
        ], 422);
    }

    if (!in_array($quote->status, ['open', 'countered'])) {
        return response()->json([
            'success' => false,
            'message' => "Only quotes with status 'open' or 'countered' can be accepted"
        ], 422);
    }

    // Execute acceptance in transaction
    DB::transaction(function () use ($quote, $tenantId) {
        // 1. Update quote
        $quote->update([
            'status' => 'accepted',
            'closed_at' => now(),
        ]);
        
        // Add to history
        $history = $quote->history ?? [];
        $history[] = [
            'action' => 'accepted',
            'user_id' => auth()->id(),
            'timestamp' => now()->toISOString(),
            'notes' => 'Quote accepted by admin'
        ];
        $quote->update(['history' => $history]);

        // 2. Auto-reject other quotes
        OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $quote->order_id)
            ->where('id', '!=', $quote->id)
            ->whereIn('status', ['open', 'countered'])
            ->update([
                'status' => 'rejected',
                'closed_at' => now(),
            ]);

        // 3. Update order
        $order = $quote->order;
        $order->update([
            'vendor_quoted_price' => $quote->latest_offer,
            'quotation_amount' => $quote->latest_offer * 1.35,
            'vendor_id' => $quote->vendor_id,
            'vendor_terms' => $quote->terms,
            'status' => 'customer_quote',
        ]);

        // 4. Create order history entry
        $orderHistory = $order->history ?? [];
        $orderHistory[] = [
            'action' => 'quote_accepted',
            'user_id' => auth()->id(),
            'timestamp' => now()->toISOString(),
            'metadata' => [
                'quote_id' => $quote->uuid,
                'quote_number' => $quote->quote_number,
                'vendor_quoted_price' => $quote->latest_offer,
                'quotation_amount' => $quote->latest_offer * 1.35,
            ]
        ];
        $order->update(['history' => $orderHistory]);

        // 5. Dispatch domain event
        event(new QuoteAccepted($quote, $order));
    });

    // Reload relationships
    $quote->load(['order', 'vendor']);

    return response()->json([
        'success' => true,
        'data' => [
            'quote' => $this->transformQuoteToFrontend($quote),
            'order' => [
                'id' => $quote->order->uuid,
                'status' => $quote->order->status,
                'vendor_quoted_price' => $quote->order->vendor_quoted_price,
                'quotation_amount' => $quote->order->quotation_amount,
                'vendor_id' => $quote->order->vendor->uuid,
            ]
        ],
        'message' => 'Quote accepted and order updated'
    ]);
}
```

### Example 3: Quote Actions Component

```typescript
// components/tenant/quotes/QuoteActions.tsx
interface QuoteActionsProps {
  quote: Quote;
  onAccept: () => void;
  onReject: () => void;
  onCounter: () => void;
  loading?: boolean;
}

export const QuoteActions: React.FC<QuoteActionsProps> = ({
  quote,
  onAccept,
  onReject,
  onCounter,
  loading = false,
}) => {
  const navigate = useNavigate();
  
  // Determine which actions are available
  const canAccept = ['open', 'countered'].includes(quote.status) 
    && !isExpired(quote.valid_until);
  
  const canReject = ['open', 'countered', 'sent'].includes(quote.status);
  
  const canCounter = ['open', 'sent'].includes(quote.status) 
    && quote.round < 5;
  
  const canEdit = ['draft', 'open'].includes(quote.status);
  
  const isReadOnly = ['accepted', 'rejected', 'expired', 'cancelled']
    .includes(quote.status);

  if (isReadOnly) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Read-Only</Badge>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {canAccept && (
        <Button
          onClick={onAccept}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Accept
        </Button>
      )}
      
      {canReject && (
        <Button
          onClick={onReject}
          disabled={loading}
          variant="destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
      )}
      
      {canCounter && (
        <Button
          onClick={onCounter}
          disabled={loading}
          variant="outline"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Counter Offer
        </Button>
      )}
      
      {canEdit && (
        <Button
          onClick={() => navigate(`/admin/quotes/${quote.id}/edit`)}
          disabled={loading}
          variant="outline"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      )}
      
      <Button
        onClick={() => navigate(-1)}
        variant="ghost"
      >
        Back
      </Button>
    </div>
  );
};
```

### Example 4: Duplicate Check Hook

```typescript
// hooks/useDuplicateQuoteCheck.ts
export const useDuplicateQuoteCheck = (orderId?: string) => {
  const [checking, setChecking] = useState(false);
  const [existingQuote, setExistingQuote] = useState<Quote | null>(null);
  const [hasActiveQuote, setHasActiveQuote] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setHasActiveQuote(false);
      setExistingQuote(null);
      return;
    }

    const checkExisting = async () => {
      setChecking(true);
      try {
        const response = await quoteService.getQuotes({
          order_id: orderId,
          status: ['draft', 'open', 'sent', 'countered'],
          per_page: 1,
        });

        if (response.data.length > 0) {
          setHasActiveQuote(true);
          setExistingQuote(response.data[0]);
        } else {
          setHasActiveQuote(false);
          setExistingQuote(null);
        }
      } catch (error) {
        console.error('Failed to check existing quote:', error);
        setHasActiveQuote(false);
        setExistingQuote(null);
      } finally {
        setChecking(false);
      }
    };

    checkExisting();
  }, [orderId]);

  return { checking, hasActiveQuote, existingQuote };
};
```

---

## Migration Guide

### For Future Enhancements

#### Phase 2: Email Notifications

**Database Changes**:
```sql
ALTER TABLE order_vendor_negotiations
ADD COLUMN sent_at TIMESTAMP,
ADD COLUMN vendor_viewed_at TIMESTAMP,
ADD COLUMN responded_at TIMESTAMP,
ADD COLUMN response_token VARCHAR(255) UNIQUE,
ADD COLUMN vendor_response JSONB;
```

**New Endpoints**:
- `POST /api/v1/tenant/quotes/{id}/send` - Send quote to vendor
- `GET /api/v1/public/vendor-quotes/{token}` - Public vendor response page
- `POST /api/v1/public/vendor-quotes/{token}/respond` - Vendor response

**New Components**:
- `SendQuoteDialog.tsx` - Send quote confirmation
- `VendorQuoteResponse.tsx` - Public vendor response page
- Email templates for quote notifications

#### Phase 3: Advanced Features

**Quote Comparison Matrix**:
```typescript
// components/tenant/quotes/QuoteComparison.tsx
interface QuoteComparisonProps {
  orderId: string;
  quotes: Quote[];
}

// Shows side-by-side comparison of all quotes for an order
```

**Quote Templates**:
```sql
CREATE TABLE quote_templates (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    terms JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Bulk Operations**:
- Bulk reject quotes
- Bulk export to CSV
- Bulk status updates

### Breaking Changes to Avoid

1. **Never change UUID field names** - Frontend depends on these
2. **Never remove required fields** - Add new fields as optional
3. **Never change status enum values** - Add new statuses only
4. **Never change API response structure** - Add new fields only
5. **Never remove database indexes** - Only add new ones

### Backward Compatibility

When adding new features:
```php
// ✅ GOOD: Add optional field
$quote->update([
    'new_field' => $value ?? null, // Optional
]);

// ❌ BAD: Add required field without default
$quote->update([
    'new_field' => $value, // Breaks existing code
]);
```

---

## Conclusion

The Quote Management system follows hexagonal architecture principles with clear separation of concerns, comprehensive testing, and production-ready security measures. This architecture supports:

- ✅ **Scalability**: Handles growing quote volumes
- ✅ **Maintainability**: Clean code structure
- ✅ **Testability**: Comprehensive test coverage
- ✅ **Security**: Tenant isolation and authorization
- ✅ **Performance**: Optimized queries and caching
- ✅ **Extensibility**: Easy to add new features

### Key Takeaways

1. **Always scope by tenant_id** - Critical for data isolation
2. **Use transactions** - Ensure data consistency
3. **Validate thoroughly** - Prevent invalid state transitions
4. **Test extensively** - Unit, integration, and E2E tests
5. **Optimize queries** - Use indexes and eager loading
6. **Cache wisely** - Improve performance without stale data
7. **Document everything** - Help future developers

### Next Steps

1. Review this documentation thoroughly
2. Set up local development environment
3. Run existing tests to understand coverage
4. Implement Phase 2 features (email notifications)
5. Add Phase 3 enhancements (comparison, templates)

---

## Document Information

- **Version**: 1.0
- **Last Updated**: February 2, 2026
- **Applies To**: Quote Management Workflow Phase 1
- **Related Docs**:
  - Quote Management User Guide
  - Order Status Workflow Architecture
  - Vendor Negotiation Integration
  - API Documentation (OpenAPI)

---

**© 2026 CanvaStencil. All rights reserved.**
