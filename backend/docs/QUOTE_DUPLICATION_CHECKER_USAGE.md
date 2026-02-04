# QuoteDuplicationChecker Service - Usage Documentation

## Overview

The `QuoteDuplicationChecker` is a Domain service that prevents duplicate active quotes for the same order-vendor combination. This ensures data integrity and prevents confusion in the quote management workflow.

## Location

```
backend/app/Domain/Quote/Services/QuoteDuplicationChecker.php
```

## Business Rules

1. **Only one active quote allowed per order-vendor combination**
   - Active statuses: `open`, `countered`
   - Closed statuses: `accepted`, `rejected`, `cancelled`, `expired`

2. **Different vendors can have quotes for same order**
   - Multiple vendors can submit quotes for the same order
   - Each vendor can only have one active quote per order

3. **Tenant isolation enforced**
   - All checks are scoped to tenant_id
   - Cross-tenant quote detection is prevented

## Available Methods

### 1. check()

Check if a duplicate active quote exists.

**Signature:**
```php
public function check(
    int $tenantId,
    int $orderId,
    int $vendorId,
    array $statuses = ['open', 'countered'],
    ?int $excludeQuoteId = null
): bool
```

**Parameters:**
- `$tenantId` - Tenant ID for isolation
- `$orderId` - Internal order ID
- `$vendorId` - Internal vendor ID
- `$statuses` - Array of statuses to consider as "active" (default: `['open', 'countered']`)
- `$excludeQuoteId` - Optional quote ID to exclude from check (useful for updates)

**Returns:** `bool` - True if duplicate exists, false otherwise

**Example Usage:**
```php
$checker = new QuoteDuplicationChecker();

// Check if duplicate exists
$hasDuplicate = $checker->check(
    tenantId: 1,
    orderId: 123,
    vendorId: 456
);

if ($hasDuplicate) {
    throw new \InvalidArgumentException('Active quote already exists');
}

// Check excluding current quote (for updates)
$hasDuplicate = $checker->check(
    tenantId: 1,
    orderId: 123,
    vendorId: 456,
    statuses: ['open', 'countered'],
    excludeQuoteId: 789
);
```

### 2. getExisting()

Get the existing active quote if it exists.

**Signature:**
```php
public function getExisting(
    int $tenantId,
    int $orderId,
    int $vendorId,
    array $statuses = ['open', 'countered']
): ?OrderVendorNegotiation
```

**Returns:** `OrderVendorNegotiation|null` - The existing quote or null

**Example Usage:**
```php
$existingQuote = $checker->getExisting(
    tenantId: 1,
    orderId: 123,
    vendorId: 456
);

if ($existingQuote) {
    // Redirect to edit mode
    return redirect()->route('quotes.edit', $existingQuote->uuid);
}
```

### 3. hasActiveQuotesForOrder()

Check if any active quotes exist for an order (any vendor).

**Signature:**
```php
public function hasActiveQuotesForOrder(
    int $tenantId,
    int $orderId,
    array $statuses = ['open', 'countered']
): bool
```

**Returns:** `bool` - True if any active quotes exist

**Example Usage:**
```php
$hasActiveQuotes = $checker->hasActiveQuotesForOrder(
    tenantId: 1,
    orderId: 123
);

if ($hasActiveQuotes) {
    // Show "Active Quotes" badge on order detail page
}
```

### 4. countActiveQuotesForOrder()

Count the number of active quotes for an order.

**Signature:**
```php
public function countActiveQuotesForOrder(
    int $tenantId,
    int $orderId,
    array $statuses = ['open', 'countered']
): int
```

**Returns:** `int` - Number of active quotes

**Example Usage:**
```php
$activeCount = $checker->countActiveQuotesForOrder(
    tenantId: 1,
    orderId: 123
);

// Display: "3 active quotes"
```

### 5. getActiveQuotesForOrder()

Get all active quotes for an order.

**Signature:**
```php
public function getActiveQuotesForOrder(
    int $tenantId,
    int $orderId,
    array $statuses = ['open', 'countered']
): \Illuminate\Database\Eloquent\Collection
```

**Returns:** Collection of `OrderVendorNegotiation` models

**Example Usage:**
```php
$activeQuotes = $checker->getActiveQuotesForOrder(
    tenantId: 1,
    orderId: 123
);

foreach ($activeQuotes as $quote) {
    echo "Vendor: {$quote->vendor->name}, Price: {$quote->latest_offer}\n";
}
```

### 6. validateNoDuplicate()

Validate that a quote can be created without duplication (throws exception if duplicate exists).

**Signature:**
```php
public function validateNoDuplicate(
    int $tenantId,
    int $orderId,
    int $vendorId
): void
```

**Throws:** `\InvalidArgumentException` if duplicate exists

**Example Usage:**
```php
try {
    $checker->validateNoDuplicate(
        tenantId: 1,
        orderId: 123,
        vendorId: 456
    );
    
    // Safe to create quote
    $quote = OrderVendorNegotiation::create([...]);
    
} catch (\InvalidArgumentException $e) {
    return response()->json([
        'message' => $e->getMessage()
    ], 422);
}
```

## Integration Examples

### Controller Usage

```php
// QuoteController.php

use App\Domain\Quote\Services\QuoteDuplicationChecker;

class QuoteController extends Controller
{
    private QuoteDuplicationChecker $duplicationChecker;
    
    public function __construct(QuoteDuplicationChecker $duplicationChecker)
    {
        $this->duplicationChecker = $duplicationChecker;
    }
    
    public function store(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        
        // Validate no duplicate
        try {
            $this->duplicationChecker->validateNoDuplicate(
                $tenantId,
                $request->order_id,
                $request->vendor_id
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
        
        // Create quote
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $tenantId,
            'order_id' => $request->order_id,
            'vendor_id' => $request->vendor_id,
            // ... other fields
        ]);
        
        return response()->json(['data' => $quote], 201);
    }
    
    public function checkExisting(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        
        $existingQuote = $this->duplicationChecker->getExisting(
            $tenantId,
            $request->order_id,
            $request->vendor_id
        );
        
        return response()->json([
            'data' => [
                'has_active_quote' => $existingQuote !== null,
                'quote' => $existingQuote ? new QuoteResource($existingQuote) : null
            ]
        ]);
    }
}
```

### Use Case Integration

```php
// CreateQuoteUseCase.php

use App\Domain\Quote\Services\QuoteDuplicationChecker;

class CreateQuoteUseCase
{
    private QuoteDuplicationChecker $duplicationChecker;
    
    public function __construct(QuoteDuplicationChecker $duplicationChecker)
    {
        $this->duplicationChecker = $duplicationChecker;
    }
    
    public function execute(CreateQuoteCommand $command): OrderVendorNegotiation
    {
        // Check for duplicates
        $this->duplicationChecker->validateNoDuplicate(
            $command->tenantId,
            $command->orderId,
            $command->vendorId
        );
        
        // Create quote
        return OrderVendorNegotiation::create([
            'tenant_id' => $command->tenantId,
            'order_id' => $command->orderId,
            'vendor_id' => $command->vendorId,
            'status' => 'open',
            'initial_offer' => $command->initialOffer,
            'latest_offer' => $command->initialOffer,
            // ... other fields
        ]);
    }
}
```

## Database Schema Reference

The service works with the `order_vendor_negotiations` table:

**Allowed Status Values:**
- `open` - Quote is open for negotiation
- `countered` - Counter offer has been made
- `accepted` - Quote has been accepted
- `rejected` - Quote has been rejected
- `cancelled` - Quote has been cancelled
- `expired` - Quote has expired

**Active Statuses (default):** `open`, `countered`
**Closed Statuses:** `accepted`, `rejected`, `cancelled`, `expired`

## Performance Considerations

### Database Indexes

The service benefits from the following composite index:

```sql
CREATE INDEX idx_ovn_order_vendor_status 
ON order_vendor_negotiations(tenant_id, order_id, vendor_id, status)
WHERE status IN ('open', 'countered');
```

This partial index optimizes duplicate checks by only indexing active quotes.

### Query Optimization

All methods use efficient queries with proper indexing:
- Tenant scoping prevents full table scans
- Status filtering uses indexed columns
- Eager loading available via `getExisting()` method

## Testing

Comprehensive unit tests are available at:
```
backend/tests/Unit/Domain/Quote/Services/QuoteDuplicationCheckerTest.php
```

**Test Coverage:**
- ✅ Detects duplicate quotes for same order-vendor
- ✅ Allows quotes for different vendors
- ✅ Ignores rejected/expired/cancelled quotes
- ✅ Enforces tenant isolation
- ✅ Supports quote ID exclusion for updates
- ✅ Custom status filtering
- ✅ Exception throwing for validation

**Run Tests:**
```bash
php artisan test --filter=QuoteDuplicationCheckerTest
```

## Best Practices

1. **Always check before creating quotes**
   ```php
   $checker->validateNoDuplicate($tenantId, $orderId, $vendorId);
   ```

2. **Use getExisting() for edit mode detection**
   ```php
   $existing = $checker->getExisting($tenantId, $orderId, $vendorId);
   if ($existing) {
       // Open in edit mode
   }
   ```

3. **Exclude current quote when updating**
   ```php
   $hasDuplicate = $checker->check(
       $tenantId, 
       $orderId, 
       $vendorId,
       ['open', 'countered'],
       $currentQuoteId // Exclude this
   );
   ```

4. **Always scope by tenant_id**
   - Never skip tenant_id parameter
   - Prevents cross-tenant data leaks

5. **Use appropriate status filters**
   - Default `['open', 'countered']` covers most cases
   - Customize only when needed

## Common Pitfalls

❌ **Don't use non-existent statuses**
```php
// WRONG - 'draft' and 'sent' don't exist in database
$checker->check($tenantId, $orderId, $vendorId, ['draft', 'sent']);
```

✅ **Use correct statuses**
```php
// CORRECT - Use actual database enum values
$checker->check($tenantId, $orderId, $vendorId, ['open', 'countered']);
```

❌ **Don't skip tenant isolation**
```php
// WRONG - Missing tenant_id
OrderVendorNegotiation::where('order_id', $orderId)->exists();
```

✅ **Always include tenant_id**
```php
// CORRECT - Tenant scoped
$checker->check($tenantId, $orderId, $vendorId);
```

## Related Documentation

- [Quote Management Workflow Requirements](/.kiro/specs/quote-management-workflow/requirements.md)
- [Quote Management Workflow Design](/.kiro/specs/quote-management-workflow/design.md)
- [Database Indexes Documentation](/backend/docs/DATABASE_INDEXES.md)

## Support

For questions or issues:
1. Check unit tests for usage examples
2. Review integration tests for real-world scenarios
3. Consult the design document for business rules
