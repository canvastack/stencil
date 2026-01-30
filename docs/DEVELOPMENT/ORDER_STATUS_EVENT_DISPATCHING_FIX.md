# Order Status Event Dispatching Fix

## Issue Summary

**Error**: 500 Internal Server Error when completing order stages
```
OrderStatusChanged::__construct(): Argument #1 ($orderId) must be of type 
App\Domain\Shared\ValueObjects\UuidValueObject, App\Infrastructure\Persistence\Eloquent\Models\Order given
```

**Location**: `OrderStateMachine.php` line 838 in `dispatchEvents()` method

## Root Cause Analysis

### The Problem
The `OrderStatusChanged` domain event constructor expects:
1. `UuidValueObject $orderId` - Order's UUID as value object
2. `UuidValueObject $tenantId` - Tenant's UUID as value object
3. `string $oldStatus` - Previous status
4. `string $newStatus` - New status
5. Optional `?string $changedBy` - User who made the change
6. Optional `?string $reason` - Reason for change

However, the `dispatchEvents()` method was passing:
- The entire `Order` model instead of `UuidValueObject`
- Integer `tenant_id` instead of tenant's UUID

### Database Schema Context
```php
// orders table
$table->id();                    // BIGINT - internal ID
$table->uuid('uuid');            // UUID - public identifier
$table->foreignId('tenant_id');  // BIGINT - FK to tenants.id

// tenants table  
$table->id();                    // BIGINT - internal ID
$table->uuid('uuid');            // UUID - public identifier
```

**Key Insight**: 
- `orders.tenant_id` references `tenants.id` (integer)
- Domain events need `tenants.uuid` (UUID string)
- Must use tenant relationship to get UUID

## Solution Implementation

### 1. Fixed Event Dispatching (OrderStateMachine.php)

**Before**:
```php
event(new OrderStatusChanged($order, $oldStatusEnum, $newStatusEnum, $reason));
```

**After**:
```php
// Create UuidValueObject instances for the event
$orderIdVO = \App\Domain\Shared\ValueObjects\UuidValueObject::fromString($order->uuid);

// Get tenant UUID from the tenant relationship
$tenantUuid = $order->tenant->uuid ?? null;
if (!$tenantUuid) {
    throw new \RuntimeException('Tenant UUID not found for order ' . $order->uuid);
}
$tenantIdVO = \App\Domain\Shared\ValueObjects\UuidValueObject::fromString($tenantUuid);

// Get the user who made the change (if available)
$changedBy = auth()->id() ? (string) auth()->id() : null;

event(new OrderStatusChanged(
    $orderIdVO,
    $tenantIdVO,
    $oldStatusEnum->value,
    $newStatusEnum->value,
    $changedBy,
    $reason
));
```

### 2. Ensured Tenant Relationship Loading (OrderController.php)

**transitionState() method**:
```php
$order = Order::where('tenant_id', $tenant->id)
    ->where($isUuid ? 'uuid' : 'id', $id)
    ->firstOrFail();

// Load tenant relationship before transition (needed for event dispatching)
$order->load('tenant');
```

**advanceStage() method**:
```php
$order = Order::where('tenant_id', $tenant->id)
    ->where($isUuid ? 'uuid' : 'id', $id)
    ->firstOrFail();

// Load tenant relationship before transition (needed for event dispatching)
$order->load('tenant');
```

## Technical Details

### Value Object Pattern
The fix properly implements the Value Object pattern from Domain-Driven Design:
- Domain events use value objects for type safety
- UUIDs are wrapped in `UuidValueObject` for validation
- Prevents passing raw models to domain layer

### Multi-Tenant Architecture
The fix maintains proper tenant isolation:
- Uses tenant UUID (public identifier) in events
- Maintains integer tenant_id for database relationships
- Ensures tenant relationship is loaded before event dispatch

### Hexagonal Architecture Compliance
- Domain layer (events) uses value objects
- Infrastructure layer (models) uses Eloquent
- Proper translation between layers in OrderStateMachine

## Files Modified

1. **backend/app/Domain/Order/Services/OrderStateMachine.php**
   - Fixed `dispatchEvents()` method
   - Added proper UuidValueObject creation
   - Added tenant UUID resolution from relationship

2. **backend/app/Infrastructure/Presentation/Http/Controllers/Tenant/OrderController.php**
   - Added tenant loading in `transitionState()` method
   - Added tenant loading in `advanceStage()` method
   - Ensures tenant relationship available before state machine operations

## Testing Verification

### Manual Testing
1. Navigate to order details page
2. Click "Complete Stage" button
3. Verify stage advances successfully
4. Check no 500 errors in console
5. Verify order status updates correctly

### Expected Behavior
- ✅ Stage advancement completes successfully
- ✅ OrderStatusChanged event dispatches correctly
- ✅ No type errors in event construction
- ✅ Proper tenant UUID used in events
- ✅ SLA monitoring jobs dispatch with integer tenant_id

## Related Components

### OrderStatusChanged Event
- Location: `backend/app/Domain/Order/Events/OrderStatusChanged.php`
- Purpose: Domain event for order status changes
- Used by: Notifications, audit logging, real-time updates

### OrderSlaMonitorJob
- Location: `backend/app/Domain/Order/Jobs/OrderSlaMonitorJob.php`
- Purpose: Monitor SLA compliance for orders
- Uses: Integer tenant_id (correct - for database queries)

### UuidValueObject
- Location: `backend/app/Domain/Shared/ValueObjects/UuidValueObject.php`
- Purpose: Type-safe UUID handling
- Features: Validation, generation, comparison

## Best Practices Established

### 1. Always Load Required Relationships
```php
// ✅ GOOD: Load relationships before operations that need them
$order->load('tenant');
$this->stateMachine->transitionTo($order, $newStatus, $data);

// ❌ BAD: Assume relationships are loaded
$this->stateMachine->transitionTo($order, $newStatus, $data);
```

### 2. Use Value Objects in Domain Layer
```php
// ✅ GOOD: Domain events use value objects
event(new OrderStatusChanged($orderIdVO, $tenantIdVO, ...));

// ❌ BAD: Domain events use raw models
event(new OrderStatusChanged($order, $tenant, ...));
```

### 3. Distinguish Between Internal and Public IDs
```php
// ✅ GOOD: Use appropriate ID type for context
$order->tenant_id;        // Integer for database FK
$order->tenant->uuid;     // UUID for public/domain use

// ❌ BAD: Mix ID types
$order->tenant_id;        // Trying to use as UUID
```

## Impact Assessment

### Positive Impacts
- ✅ Proper domain-driven design implementation
- ✅ Type safety in domain events
- ✅ Correct multi-tenant UUID handling
- ✅ Maintains hexagonal architecture principles

### No Breaking Changes
- ✅ OrderSlaMonitorJob still uses integer tenant_id (correct)
- ✅ Database schema unchanged
- ✅ API responses unchanged
- ✅ Frontend integration unchanged

## Future Considerations

### 1. Eager Loading Optimization
Consider eager loading tenant relationship in repository layer:
```php
public function findByUuid(string $uuid): ?Order
{
    return Order::with('tenant')->where('uuid', $uuid)->first();
}
```

### 2. Event Consistency
Ensure all domain events follow same pattern:
- Use UuidValueObject for entity identifiers
- Use tenant UUID (not tenant_id integer)
- Include user context when available

### 3. Testing Coverage
Add integration tests for:
- Event dispatching with proper value objects
- Tenant relationship loading
- Multi-tenant event isolation

## Conclusion

This fix ensures proper domain-driven design implementation while maintaining multi-tenant architecture integrity. The solution correctly distinguishes between:
- Internal database IDs (integers for foreign keys)
- Public identifiers (UUIDs for domain events and APIs)
- Infrastructure concerns (Eloquent models)
- Domain concerns (value objects and events)

The fix is production-ready and maintains backward compatibility with all existing functionality.
