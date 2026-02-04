# Check Existing Quote Endpoint - Test Summary

## Overview

Comprehensive unit/feature tests for the `GET /api/v1/tenant/quotes/check-existing` endpoint that checks for existing active quotes for a given order and optional vendor.

## Test File Location

`backend/tests/Feature/Quote/CheckExistingQuoteTest.php`

## Test Results

✅ **All 10 tests passing** (24 assertions)

## Test Coverage

### 1. Core Functionality Tests

#### ✅ test_detects_existing_active_quote
- **Purpose**: Verifies endpoint returns `has_active_quote=true` when an active quote exists
- **Scenario**: Creates an 'open' status quote and checks detection
- **Assertions**: 
  - Status 200
  - `has_active_quote` is true
  - Quote data is returned with correct UUID

#### ✅ test_returns_false_when_no_active_quote
- **Purpose**: Verifies endpoint returns `has_active_quote=false` when no quotes exist
- **Scenario**: Checks order with no quotes
- **Assertions**:
  - Status 200
  - `has_active_quote` is false
  - Quote data is null

### 2. Status Filtering Tests

#### ✅ test_ignores_rejected_quotes
- **Purpose**: Verifies rejected quotes are not considered "active"
- **Scenario**: Creates a 'rejected' status quote
- **Assertions**:
  - Status 200
  - `has_active_quote` is false (rejected quotes ignored)
  - Quote data is null

#### ✅ test_ignores_expired_quotes
- **Purpose**: Verifies expired quotes are not considered "active"
- **Scenario**: Creates an 'expired' status quote
- **Assertions**:
  - Status 200
  - `has_active_quote` is false (expired quotes ignored)
  - Quote data is null

#### ✅ test_filters_by_custom_statuses
- **Purpose**: Verifies custom status filtering works correctly
- **Scenario**: Creates quotes with 'accepted' and 'open' statuses, filters for 'accepted' only
- **Assertions**:
  - Status 200
  - Returns only the 'accepted' quote
  - Correct quote UUID returned

### 3. Vendor Filtering Tests

#### ✅ test_filters_by_vendor_id
- **Purpose**: Verifies vendor_id filtering works correctly
- **Scenario**: Creates quotes for two different vendors, filters for specific vendor
- **Assertions**:
  - Status 200
  - Returns only the quote for the specified vendor
  - Correct quote UUID returned

### 4. Multi-Quote Scenarios

#### ✅ test_returns_most_recent_quote_when_multiple_exist
- **Purpose**: Verifies most recent quote is returned when multiple exist
- **Scenario**: Creates two quotes with different created_at timestamps
- **Assertions**:
  - Status 200
  - Returns the newer quote (not the older one)

### 5. Security & Validation Tests

#### ✅ test_enforces_tenant_isolation
- **Purpose**: Verifies tenant isolation is enforced
- **Scenario**: Creates quote for different tenant, attempts to access it
- **Assertions**:
  - Status 404 (order not found in current tenant context)
  - No cross-tenant data leakage

#### ✅ test_requires_order_id
- **Purpose**: Verifies order_id parameter is required
- **Scenario**: Calls endpoint without order_id parameter
- **Assertions**:
  - Status 422 (validation error)
  - Validation error for 'order_id' field

#### ✅ test_validates_order_id_format
- **Purpose**: Verifies order_id must be valid UUID format
- **Scenario**: Calls endpoint with invalid UUID string
- **Assertions**:
  - Status 422 (validation error)
  - Validation error for 'order_id' field

## Test Setup

### Tenant Context Configuration
```php
// Set tenant context for proper multi-tenancy
$this->app->instance('current_tenant', $this->tenant);

// Authenticate user with Sanctum
Sanctum::actingAs($this->user);
```

### Test Data
- **Tenant**: Created via factory
- **User**: Created and authenticated with Sanctum
- **Order**: Created with tenant_id
- **Vendor**: Created with tenant_id
- **Quotes**: Created with various statuses for testing

## Key Implementation Details

### Valid Quote Statuses
The endpoint only recognizes these statuses (per database schema):
- `open`
- `countered`
- `accepted`
- `rejected`
- `cancelled`
- `expired`

**Note**: 'draft' and 'sent' statuses were removed as they don't exist in the database schema.

### Default Active Statuses
When no status filter is provided, the endpoint defaults to:
- `open`
- `countered`

### Tenant Isolation
- All queries are automatically scoped to the current tenant
- Cross-tenant access attempts return 404
- Tenant context is set via `$this->app->instance('current_tenant', $tenant)`

## API Endpoint Details

### Endpoint
```
GET /api/v1/tenant/quotes/check-existing
```

### Query Parameters
- `order_id` (required, UUID): The order UUID to check
- `vendor_id` (optional, UUID): Filter by specific vendor
- `status[]` (optional, array): Custom status filters

### Response Format
```json
{
  "data": {
    "has_active_quote": true|false,
    "quote": {
      "id": "uuid",
      "quote_number": "Q-000001",
      "order_id": "uuid",
      "vendor_id": "uuid",
      "status": "open",
      // ... other quote fields
    } | null
  }
}
```

## Testing Best Practices Applied

1. ✅ **RefreshDatabase**: Each test runs with fresh database
2. ✅ **Real Database**: No mocks, tests use actual database interactions
3. ✅ **Tenant Context**: Proper multi-tenancy setup
4. ✅ **Authentication**: Sanctum authentication for API calls
5. ✅ **Descriptive Names**: Test names clearly describe what they test
6. ✅ **Comprehensive Coverage**: All scenarios from requirements covered
7. ✅ **Isolation**: Each test is independent and can run in any order

## Changes Made to Fix Tests

### 1. Controller Updates
- Removed invalid statuses ('draft', 'sent') from validation rules
- Updated default active statuses to only include valid ones: ['open', 'countered']

### 2. Test File Updates
- Added proper tenant context setup: `$this->app->instance('current_tenant', $tenant)`
- Added Sanctum authentication: `Sanctum::actingAs($this->user)`
- Removed duplicate `actingAs()` calls in individual tests
- Changed 'draft' status test to use 'accepted' status instead
- Added `use Laravel\Sanctum\Sanctum;` import

## Performance

- **Test Suite Duration**: ~33 seconds for 10 tests
- **First Test**: ~18 seconds (includes database setup)
- **Subsequent Tests**: ~0.7-1.1 seconds each

## Maintenance Notes

### When Adding New Tests
1. Ensure tenant context is set in setUp()
2. Use Sanctum for authentication
3. Use only valid quote statuses from database schema
4. Test both positive and negative scenarios
5. Verify tenant isolation for security-critical operations

### When Modifying Endpoint
1. Update tests to match new behavior
2. Ensure backward compatibility or update all tests
3. Verify tenant isolation is maintained
4. Check validation rules are comprehensive

## Related Files

- **Controller**: `backend/app/Infrastructure/Presentation/Http/Controllers/Tenant/QuoteController.php`
- **Route**: `backend/routes/tenant.php` (line ~405)
- **Migration**: `backend/database/migrations/2025_11_18_010000_create_order_vendor_negotiations_table.php`
- **Integration Tests**: `backend/tests/Integration/QuoteManagementWorkflowTest.php`
- **Domain Service**: `backend/app/Domain/Quote/Services/QuoteDuplicationChecker.php`

## Conclusion

The check-existing endpoint now has comprehensive test coverage with 10 passing tests covering all requirements:
- ✅ Active quote detection
- ✅ Status filtering (including rejected/expired)
- ✅ Vendor filtering
- ✅ Tenant isolation
- ✅ Input validation
- ✅ Multiple quote scenarios
- ✅ Error handling

All tests use real database interactions (no mocks) and properly handle multi-tenant context with Sanctum authentication.
