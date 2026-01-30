# Vendor Negotiation Stage Implementation Guide

## Overview

This document provides comprehensive technical implementation guidance for the Vendor Negotiation stage in the order workflow. This stage is critical for PT CEX's business model as it handles the negotiation process between the company and vendors for custom etching orders.

## Current Problem

**User Experience Issue:**
- User at `vendor_negotiation` stage sees no form or input fields
- Clicking "Complete Stage" fails validation
- System expects `quotation_amount` but provides no way to input vendor negotiation data
- No clear guidance on what data needs to be collected

**Business Flow Context:**
```
Vendor Sourcing → Vendor Negotiation → Customer Quote → Awaiting Payment → Production
                      ↑ YOU ARE HERE
```

## System Analysis: Existing Quotes Infrastructure

### ✅ GOOD NEWS: Comprehensive Quotes System Already Exists!

The platform has a **fully functional quotes management system** that can be leveraged for vendor negotiation:

**Frontend Components:**
- ✅ `QuoteManagement.tsx` - Full-featured quotes dashboard
- ✅ `QuoteList.tsx` - Paginated list with filtering and sorting
- ✅ `QuoteForm.tsx` - Comprehensive form for creating/editing quotes
- ✅ `quoteStore.ts` - Complete Zustand store with all CRUD operations
- ✅ `quoteService.ts` - API client with 20+ quote operations

**Backend Infrastructure:**
- ✅ `QuoteController.php` - Full REST API controller
- ✅ `OrderVendorNegotiation` model - Database entity for quotes
- ✅ Complete routes: `/tenant/quotes/*` with all CRUD operations
- ✅ Statistics, export, PDF generation endpoints

**Key Features Already Implemented:**
- Quote creation, update, delete
- Accept/reject/counter quote workflows
- Quote statistics and analytics
- Revision history tracking
- Bulk operations
- Export functionality
- PDF generation (stub)

### Current Quotes Page: `/admin/quotes`

**What It Does:**
- Displays all vendor negotiations (OrderVendorNegotiation records)
- Shows quote status, pricing, vendor info
- Provides filtering by status, vendor, date range
- Supports quote acceptance, rejection, counter-offers
- Tracks negotiation rounds and history

**Data Model Mapping:**
```
OrderVendorNegotiation (Backend) → Quote (Frontend)
├── initial_offer → original_price
├── latest_offer → quoted_price / grand_total
├── status → status (open, countered, accepted, rejected, etc.)
├── round → negotiation round counter
├── history → negotiation history array
├── terms → vendor terms (JSON)
└── expires_at → valid_until
```

## Architecture Decision: Integration Strategy

### ✅ RECOMMENDED: Option 3 - Integrate Existing Quotes System

**Why This Is The Best Approach:**

1. **Zero Duplication**: Reuse 2000+ lines of existing, tested code
2. **Consistent UX**: Users already familiar with quotes interface
3. **Full Features**: Get statistics, history, export for free
4. **Maintainable**: Single source of truth for vendor negotiations
5. **Production Ready**: Already tested and working

**Implementation Strategy:**

Instead of building new forms, **connect the order workflow to the existing quotes system**:

```
Order Detail (vendor_negotiation stage)
    ↓
    "Manage Vendor Quotes" button
    ↓
Quotes Page (filtered to current order)
    ↓
Create/Edit Quote (using existing QuoteForm)
    ↓
Accept Quote → Auto-advance order stage
```

## Required Data Collection

At the vendor_negotiation stage, the system must collect:

### Required Fields:
1. **vendor_quoted_price** (required)
   - Vendor's quoted price for the order
   - Stored in cents (BIGINT)
   - Used to calculate customer quotation

2. **vendor_lead_time_days** (required)
   - Number of days vendor needs for production
   - Integer value
   - Used for delivery estimation

### Optional Fields:
3. **negotiation_notes** (optional)
   - Internal notes about the negotiation
   - TEXT field
   - For record-keeping and future reference

4. **vendor_terms** (optional)
   - Vendor's specific terms and conditions
   - JSON field
   - Can include payment terms, delivery conditions, etc.

## Database Schema

### Orders Table (Already Exists)
```sql
orders:
  - vendor_quoted_price (BIGINT, nullable) - in cents
  - vendor_lead_time_days (INTEGER, nullable)
  - negotiation_notes (TEXT, nullable)
  - vendor_terms (JSON, nullable)
  - quotation_amount (BIGINT, nullable) - auto-calculated
```

### OrderVendorNegotiation Table (Already Exists)
```sql
order_vendor_negotiations:
  - id (BIGINT PRIMARY KEY)
  - uuid (UUID UNIQUE)
  - tenant_id (BIGINT)
  - order_id (BIGINT)
  - vendor_id (BIGINT)
  - initial_offer (BIGINT) - in cents
  - latest_offer (BIGINT) - in cents
  - currency (VARCHAR(3))
  - status (ENUM: open, countered, accepted, rejected, cancelled, expired)
  - round (INTEGER) - negotiation round counter
  - terms (JSON)
  - history (JSON) - negotiation history
  - expires_at (TIMESTAMP)
  - closed_at (TIMESTAMP)
  - created_at, updated_at
```

**No migration needed** - all fields already exist.

## Implementation Plan: Option 3 (Recommended)

### Phase 1: Backend Integration (Priority: HIGH)

#### 1.1 Update OrderController::advanceStage

When accepting a quote, sync data to order:

```php
// In OrderController::advanceStage
if ($currentStage === 'vendor_negotiation' && $targetStage === 'customer_quote') {
    // Get accepted quote for this order
    $acceptedQuote = OrderVendorNegotiation::where('order_id', $order->id)
        ->where('status', 'accepted')
        ->latest()
        ->first();
    
    if (!$acceptedQuote) {
        throw ValidationException::withMessages([
            'vendor_negotiation' => ['No accepted vendor quote found. Please accept a quote first.']
        ]);
    }
    
    // Sync quote data to order
    $order->vendor_quoted_price = $acceptedQuote->latest_offer;
    $order->vendor_id = $acceptedQuote->vendor_id;
    $order->vendor_terms = $acceptedQuote->terms;
    
    // Auto-calculate quotation_amount
    $markup = 0.30; // 30%
    $operationalCost = 0.05; // 5%
    $order->quotation_amount = (int) ($acceptedQuote->latest_offer * (1 + $markup + $operationalCost));
    
    $order->save();
}
```

#### 1.2 Add Quote Acceptance Hook

Update `QuoteController::accept` to trigger order stage advancement:

```php
public function accept(Request $request, string $id)
{
    $tenantId = $this->getCurrentTenantId($request);
    $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
        ->where('uuid', $id)
        ->firstOrFail();

    $quote->update([
        'status' => 'accepted',
        'closed_at' => now(),
    ]);
    
    // NEW: Check if order is in vendor_negotiation stage
    $order = $quote->order;
    if ($order && $order->current_stage === 'vendor_negotiation') {
        // Sync quote data to order
        $order->vendor_quoted_price = $quote->latest_offer;
        $order->vendor_id = $quote->vendor_id;
        $order->vendor_terms = $quote->terms;
        
        // Auto-calculate quotation_amount
        $markup = 0.30;
        $operationalCost = 0.05;
        $order->quotation_amount = (int) ($quote->latest_offer * (1 + $markup + $operationalCost));
        
        $order->save();
        
        // Optionally auto-advance stage
        // $order->advanceToStage('customer_quote');
    }

    $quote->load(['order.customer', 'vendor']);

    return response()->json([
        'data' => $this->transformQuoteToFrontend($quote)
    ]);
}
```

#### 1.3 Update OrderResource

Ensure OrderResource includes vendor negotiation fields:

```php
public function toArray(Request $request): array
{
    return [
        // ... existing fields
        'vendor_quoted_price' => $this->vendor_quoted_price ? $this->vendor_quoted_price / 100 : null,
        'vendor_lead_time_days' => $this->vendor_lead_time_days,
        'negotiation_notes' => $this->negotiation_notes,
        'vendor_terms' => $this->vendor_terms,
        'quotation_amount' => $this->quotation_amount ? $this->quotation_amount / 100 : null,
        
        // NEW: Include quote information
        'active_quotes' => $this->vendorNegotiations()
            ->whereIn('status', ['open', 'countered'])
            ->count(),
        'accepted_quote' => $this->vendorNegotiations()
            ->where('status', 'accepted')
            ->latest()
            ->first()
            ?->uuid,
    ];
}
```

### Phase 2: Frontend Integration (Priority: HIGH)

#### 2.1 Update ActionableStageModal for vendor_negotiation

Add "Manage Vendor Quotes" button instead of form:

```typescript
// In ActionableStageModal.tsx
const renderVendorNegotiationActions = () => {
  const hasActiveQuotes = order.active_quotes > 0;
  const hasAcceptedQuote = !!order.accepted_quote;
  
  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Vendor Negotiation Required</AlertTitle>
        <AlertDescription>
          {hasAcceptedQuote 
            ? "You have accepted a vendor quote. You can now proceed to customer quote stage."
            : "Create and accept a vendor quote before proceeding to customer quote stage."
          }
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate(`/admin/quotes?order_id=${order.id}`)}
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          {hasActiveQuotes ? `Manage Quotes (${order.active_quotes})` : 'Create Quote'}
        </Button>
        
        {hasAcceptedQuote && (
          <Button
            onClick={() => handleAdvanceStage('customer_quote')}
            className="flex-1"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Proceed to Customer Quote
          </Button>
        )}
      </div>
      
      {hasAcceptedQuote && (
        <div className="text-sm text-muted-foreground">
          <p>Accepted Quote: {order.accepted_quote}</p>
          <p>Vendor Price: {formatCurrency(order.vendor_quoted_price)}</p>
          <p>Customer Quote: {formatCurrency(order.quotation_amount)}</p>
        </div>
      )}
    </div>
  );
};
```

#### 2.2 Update QuoteManagement Page

Add order context filtering:

```typescript
// In QuoteManagement.tsx
const orderId = searchParams.get('order_id');

useEffect(() => {
  if (orderId) {
    setFilters({ order_id: orderId });
    setActiveTab('quotes'); // Show quotes list directly
  }
}, [orderId]);

// Add order context banner
{orderId && (
  <Alert>
    <InfoIcon className="h-4 w-4" />
    <AlertTitle>Order Context</AlertTitle>
    <AlertDescription>
      Showing quotes for Order #{orderNumber}
      <Button variant="link" onClick={() => navigate(`/admin/orders/${orderId}`)}>
        View Order
      </Button>
    </AlertDescription>
  </Alert>
)}
```

#### 2.3 Update QuoteForm

Add order pre-selection when coming from order context:

```typescript
// In QuoteForm.tsx
const orderId = searchParams.get('order_id');

useEffect(() => {
  if (orderId) {
    form.setValue('order_id', orderId);
    // Optionally pre-fill customer and vendor from order
  }
}, [orderId]);
```

### Phase 3: UX Enhancements (Priority: MEDIUM)

#### 3.1 Add Quick Quote Creation from Order Detail

```typescript
// In OrderDetailPage.tsx
{order.current_stage === 'vendor_negotiation' && (
  <Card>
    <CardHeader>
      <CardTitle>Vendor Negotiation</CardTitle>
    </CardHeader>
    <CardContent>
      <QuickQuoteForm orderId={order.id} />
    </CardContent>
  </Card>
)}
```

#### 3.2 Add Quote Status Widget to Order Detail

```typescript
// New component: QuoteStatusWidget.tsx
const QuoteStatusWidget = ({ orderId }) => {
  const { quotes, fetchQuotes } = useQuoteStore();
  
  useEffect(() => {
    fetchQuotes({ order_id: orderId });
  }, [orderId]);
  
  return (
    <div className="space-y-2">
      <h4>Vendor Quotes</h4>
      {quotes.map(quote => (
        <QuoteCard key={quote.id} quote={quote} compact />
      ))}
    </div>
  );
};
```

### Phase 4: Testing (Priority: HIGH)

#### Test Scenarios:

1. **Create Quote from Order**
   - [ ] Navigate to order in vendor_negotiation stage
   - [ ] Click "Manage Vendor Quotes"
   - [ ] Create new quote with vendor pricing
   - [ ] Verify quote appears in quotes list

2. **Accept Quote and Advance Stage**
   - [ ] Accept a vendor quote
   - [ ] Verify order data syncs (vendor_quoted_price, quotation_amount)
   - [ ] Verify "Proceed to Customer Quote" button appears
   - [ ] Click button and verify stage advances

3. **Multiple Quotes Workflow**
   - [ ] Create multiple quotes for same order
   - [ ] Compare quotes side-by-side
   - [ ] Accept best quote
   - [ ] Verify other quotes are marked as rejected

4. **Counter-Offer Workflow**
   - [ ] Create initial quote
   - [ ] Counter-offer with different price
   - [ ] Track negotiation history
   - [ ] Accept final offer

5. **Data Validation**
   - [ ] Verify quotation_amount calculation (vendor_price * 1.35)
   - [ ] Verify vendor terms sync to order
   - [ ] Verify lead time tracking

## Alternative Options (Not Recommended)

### Option 1: Extend ActionableStageModal

**Pros:**
- Consistent with existing UI patterns
- Minimal code changes

**Cons:**
- Duplicates existing quotes functionality
- Limited space for complex forms
- No quote comparison features
- No negotiation history tracking

### Option 2: Separate Vendor Negotiation Page

**Pros:**
- More space for detailed information
- Can show vendor comparison

**Cons:**
- Duplicates existing quotes system
- More development effort
- Maintenance burden of two systems

## API Endpoints

### Existing Quotes API (Already Implemented)

```http
# List quotes for an order
GET /api/v1/tenant/quotes?order_id={uuid}

# Create quote
POST /api/v1/tenant/quotes
{
  "order_id": "uuid",
  "vendor_id": "uuid",
  "initial_offer": 1500000,  // in cents
  "currency": "IDR",
  "terms": {},
  "expires_at": "2024-12-31"
}

# Accept quote
POST /api/v1/tenant/quotes/{uuid}/accept

# Counter quote
POST /api/v1/tenant/quotes/{uuid}/counter
{
  "quoted_price": 1400000,
  "notes": "Can you do better?"
}

# Get quote statistics
GET /api/v1/tenant/quotes/stats
```

### Order Stage Advancement (Existing)

```http
POST /api/v1/tenant/orders/{uuid}/advance-stage
{
  "target_stage": "customer_quote"
}
```

## Calculation Formula

```
quotation_amount = vendor_quoted_price × (1 + markup + operational_cost)
                 = vendor_quoted_price × 1.35
                 = vendor_quoted_price × (1 + 0.30 + 0.05)

Example:
vendor_quoted_price = IDR 15,000
quotation_amount = 15,000 × 1.35 = IDR 20,250
```

## Implementation Timeline

### Week 1: Backend Integration
- Day 1-2: Update OrderController with quote sync logic
- Day 3: Update QuoteController with order stage hooks
- Day 4-5: Testing and validation

### Week 2: Frontend Integration
- Day 1-2: Update ActionableStageModal with quote navigation
- Day 3: Update QuoteManagement with order context
- Day 4-5: Testing and UX refinement

### Week 3: Polish and Documentation
- Day 1-2: Add quote status widgets
- Day 3: User documentation and training
- Day 4-5: Final testing and deployment

## Success Metrics

- [ ] Users can create vendor quotes from order detail
- [ ] Users can compare multiple vendor quotes
- [ ] Quote acceptance auto-syncs to order
- [ ] Quotation amount calculates correctly
- [ ] Stage advancement works seamlessly
- [ ] Negotiation history is tracked
- [ ] Zero code duplication with existing quotes system

## Related Documentation

- [User Guide: Vendor Negotiation](../USER_DOCUMENTATION/TENANTS/VENDOR_NEGOTIATION_GUIDE.md)
- [Order Status Workflow Components](ORDER_STATUS_WORKFLOW_COMPONENTS.md)
- [Order Status API Integration](ORDER_STATUS_API_INTEGRATION.md)
- [Quote Management System](../../frontend/src/pages/tenant/QuoteManagement.tsx)

## Conclusion

By leveraging the existing quotes management system, we can provide a comprehensive vendor negotiation solution with minimal development effort. This approach:

1. **Eliminates code duplication** - Reuse 2000+ lines of tested code
2. **Provides rich features** - Statistics, history, comparison, export
3. **Maintains consistency** - Single UX pattern for all quote operations
4. **Reduces maintenance** - One system to update and test
5. **Accelerates delivery** - Integration vs building from scratch

The vendor negotiation stage becomes a seamless part of the order workflow while maintaining the full power of the dedicated quotes management system.

---

**Status**: 📋 **ANALYSIS COMPLETE - READY FOR IMPLEMENTATION**  
**Priority**: 🔴 **HIGH** (Blocking user workflow)  
**Estimated Effort**: 2 weeks (vs 4 weeks for building from scratch)  
**Dependencies**: None (all infrastructure already exists)
