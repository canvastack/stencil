# Authorization Policies

This document describes the authorization policies implemented for the quote workflow system.

## Overview

Authorization policies enforce tenant isolation and role-based access control for quote and message operations. All policies are registered in `App\Providers\AuthServiceProvider`.

## Policies

### QuotePolicy

**Location**: `backend/app/Policies/QuotePolicy.php`

**Model**: `App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation`

**Methods**:

#### `view(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can view the quote.

**Rules**:
- User must belong to the same tenant as the quote
- Admins can view all quotes in their tenant
- Vendors can only view quotes assigned to them

#### `update(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can update the quote.

**Rules**:
- User must belong to the same tenant as the quote
- Only admins can update quotes
- Vendors cannot update quotes (they respond via separate endpoints)

#### `delete(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can delete the quote.

**Rules**:
- User must belong to the same tenant as the quote
- Only admins can delete quotes
- Soft delete maintains audit trail

#### `create(User $user): bool`
Determines if the user can create quotes.

**Rules**:
- Only admins can create quotes
- Tenant isolation enforced at creation time

#### `sendToVendor(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can send the quote to vendor.

**Rules**:
- User must belong to the same tenant as the quote
- Only admins can send quotes to vendors

#### `respond(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can respond to the quote.

**Rules**:
- User must belong to the same tenant as the quote
- Only vendors assigned to the quote can respond

### MessagePolicy

**Location**: `backend/app/Policies/MessagePolicy.php`

**Model**: `App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage`

**Methods**:

#### `view(User $user, QuoteMessage $message): bool`
Determines if the user can view the message.

**Rules**:
- User must belong to the same tenant as the message
- User must have access to the associated quote
- Admins can view all messages in their tenant
- Vendors can only view messages for their assigned quotes

#### `viewAny(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can view messages for a quote (used for listing messages in a quote thread).

**Rules**:
- User must belong to the same tenant as the quote
- Admins can view all message threads in their tenant
- Vendors can only view message threads for their assigned quotes

#### `create(User $user, OrderVendorNegotiation $quote): bool`
Determines if the user can create a message.

**Rules**:
- User must belong to the same tenant as the quote
- User must have access to the associated quote
- Admins can create messages for any quote in their tenant
- Vendors can only create messages for quotes assigned to them

#### `markAsRead(User $user, QuoteMessage $message): bool`
Determines if the user can mark a message as read.

**Rules**:
- User must belong to the same tenant as the message
- User must have access to the associated quote
- User must be the recipient (not the sender)

## Usage in Controllers

### Using Policies in Controllers

```php
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Http\Request;

class QuoteController extends Controller
{
    public function show(Request $request, string $uuid)
    {
        $quote = OrderVendorNegotiation::where('uuid', $uuid)->firstOrFail();
        
        // Authorize the action
        $this->authorize('view', $quote);
        
        // If authorized, proceed with the action
        return response()->json(new QuoteResource($quote));
    }
    
    public function update(Request $request, string $uuid)
    {
        $quote = OrderVendorNegotiation::where('uuid', $uuid)->firstOrFail();
        
        // Authorize the action
        $this->authorize('update', $quote);
        
        // If authorized, proceed with the action
        // ... update logic
    }
    
    public function destroy(Request $request, string $uuid)
    {
        $quote = OrderVendorNegotiation::where('uuid', $uuid)->firstOrFail();
        
        // Authorize the action
        $this->authorize('delete', $quote);
        
        // If authorized, proceed with the action
        $quote->delete();
        
        return response()->json(['message' => 'Quote deleted successfully']);
    }
}
```

### Using Policies in Blade Templates

```php
@can('view', $quote)
    <a href="{{ route('quotes.show', $quote->uuid) }}">View Quote</a>
@endcan

@can('update', $quote)
    <a href="{{ route('quotes.edit', $quote->uuid) }}">Edit Quote</a>
@endcan

@can('delete', $quote)
    <form action="{{ route('quotes.destroy', $quote->uuid) }}" method="POST">
        @csrf
        @method('DELETE')
        <button type="submit">Delete Quote</button>
    </form>
@endcan
```

### Using Policies in Code

```php
use Illuminate\Support\Facades\Gate;

// Check if user can view quote
if (Gate::allows('view', $quote)) {
    // User can view the quote
}

// Check if user cannot view quote
if (Gate::denies('view', $quote)) {
    // User cannot view the quote
}

// Check before performing action
if ($request->user()->can('update', $quote)) {
    // User can update the quote
}
```

## Tenant Isolation

All policies enforce tenant isolation by checking that the user's `tenant_id` matches the resource's `tenant_id`. This ensures complete data isolation between tenants.

**Example**:
```php
// Enforce tenant isolation
if ($user->tenant_id !== $quote->tenant_id) {
    return false;
}
```

## Vendor Assignment

Policies check if a vendor user is assigned to a quote by matching the vendor's email with the user's email. This relationship is defined in the `User` model:

```php
public function vendor(): BelongsTo
{
    return $this->belongsTo(Vendor::class, 'email', 'email')
        ->where('tenant_id', $this->tenant_id);
}
```

## Role-Based Access Control

Policies use Spatie Permission's role checking to determine access:

```php
// Check if user has admin role
if ($user->hasRole('admin')) {
    return true;
}

// Check if user has vendor role
if ($user->hasRole('vendor')) {
    // Additional checks for vendor-specific access
}
```

## Error Handling

When authorization fails, Laravel automatically returns a 403 Forbidden response. You can customize this behavior in your exception handler:

```php
// app/Exceptions/Handler.php
use Illuminate\Auth\Access\AuthorizationException;

public function render($request, Throwable $exception)
{
    if ($exception instanceof AuthorizationException) {
        return response()->json([
            'message' => 'You are not authorized to perform this action.',
            'error' => 'Forbidden'
        ], 403);
    }
    
    return parent::render($request, $exception);
}
```

## Testing Policies

To test policies in your application:

1. Create test users with appropriate roles
2. Create test resources (quotes, messages)
3. Use the `Gate` facade or `authorize()` method to test authorization

```php
use Illuminate\Support\Facades\Gate;

// Test admin can view quote
$admin = User::factory()->create(['tenant_id' => 1]);
$admin->assignRole('admin');
$quote = OrderVendorNegotiation::factory()->create(['tenant_id' => 1]);

$this->assertTrue(Gate::forUser($admin)->allows('view', $quote));

// Test vendor cannot update quote
$vendor = User::factory()->create(['tenant_id' => 1]);
$vendor->assignRole('vendor');

$this->assertFalse(Gate::forUser($vendor)->allows('update', $quote));
```

## Best Practices

1. **Always check authorization** before performing sensitive operations
2. **Use tenant scoping** in all queries to prevent cross-tenant data access
3. **Test authorization logic** thoroughly with different user roles
4. **Document custom policies** when adding new authorization rules
5. **Keep policies simple** and focused on authorization logic only
6. **Use policy methods** instead of inline authorization checks for consistency

## Related Files

- `backend/app/Policies/QuotePolicy.php` - Quote authorization policy
- `backend/app/Policies/MessagePolicy.php` - Message authorization policy
- `backend/app/Providers/AuthServiceProvider.php` - Policy registration
- `backend/app/Models/User.php` - User model with vendor relationship
- `backend/app/Infrastructure/Persistence/Eloquent/Models/OrderVendorNegotiation.php` - Quote model
- `backend/app/Infrastructure/Persistence/Eloquent/Models/QuoteMessage.php` - Message model
