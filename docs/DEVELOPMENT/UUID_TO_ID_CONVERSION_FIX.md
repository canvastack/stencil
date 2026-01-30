# UUID to Internal ID Conversion Fix

## Problem Statement

**Error**: `The vendor id field must be an integer.`

**Root Cause**: Frontend was sending vendor UUID (string) to the backend, but the `orders.vendor_id` field is a foreign key (BIGINT) that references `vendors.id` (integer), not `vendors.uuid`.

## Architecture Context

### Database Schema
- `vendors.id` - BIGINT (internal database ID)
- `vendors.uuid` - UUID (public identifier)
- `orders.vendor_id` - BIGINT foreign key referencing `vendors.id`

### API Design Principles (ZERO TOLERANCE RULES)
- ✅ **UUID-ONLY for public consumption**: All API responses use UUID
- ❌ **Never expose integer IDs**: Internal database IDs must not be exposed to frontend
- ✅ **Backend handles conversion**: Backend should accept UUID and convert to internal ID

## Solution Implemented

### Backend: UpdateOrderRequest.php

Added `prepareForValidation()` method to automatically convert vendor UUID to internal ID before validation:

```php
/**
 * Prepare the data for validation.
 * Convert vendor UUID to internal ID before validation
 */
protected function prepareForValidation(): void
{
    if ($this->has('vendor_id') && $this->vendor_id) {
        // Check if it's a UUID (string with dashes)
        if (is_string($this->vendor_id) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $this->vendor_id)) {
            $tenantId = $this->resolveTenantId();
            
            // Find vendor by UUID and get internal ID
            $vendor = \App\Models\Vendor::where('uuid', $this->vendor_id)
                ->where('tenant_id', $tenantId)
                ->first();
            
            if ($vendor) {
                $this->merge([
                    'vendor_id' => $vendor->id
                ]);
            }
        }
    }
}
```

### How It Works

1. **Frontend sends UUID**: `{ vendor_id: "550e8400-e29b-41d4-a716-446655440000" }`
2. **prepareForValidation() runs**: Detects UUID format
3. **Database lookup**: Finds vendor by UUID within tenant scope
4. **ID conversion**: Replaces UUID with internal ID
5. **Validation proceeds**: `vendor_id` is now integer, passes validation
6. **Database update**: Order updated with correct foreign key

### Benefits

✅ **Frontend stays clean**: No need to track internal IDs
✅ **Security maintained**: Internal IDs never exposed
✅ **Backward compatible**: Still accepts integer IDs if provided
✅ **Tenant-scoped**: Conversion respects tenant isolation
✅ **Hexagonal architecture**: Proper separation of concerns

## Testing

### Manual Test

1. **Get vendor UUID from API**:
   ```bash
   GET /api/v1/tenant/vendors
   Response: { "id": "550e8400-e29b-41d4-a716-446655440000", "name": "Vendor A", ... }
   ```

2. **Assign vendor to order using UUID**:
   ```bash
   PUT /api/v1/tenant/orders/{order_uuid}
   Body: { "vendor_id": "550e8400-e29b-41d4-a716-446655440000" }
   ```

3. **Verify success**:
   ```bash
   Response: 200 OK
   { "id": "...", "vendor": { "id": "550e8400-...", "name": "Vendor A" }, ... }
   ```

### Edge Cases Handled

- ✅ UUID format validation (regex check)
- ✅ Tenant scoping (vendor must belong to same tenant)
- ✅ Non-existent UUID (validation fails gracefully)
- ✅ Integer ID still works (backward compatible)
- ✅ Null vendor_id (optional field)

## Files Modified

1. **backend/app/Infrastructure/Presentation/Http/Requests/Order/UpdateOrderRequest.php**
   - Added `prepareForValidation()` method
   - UUID to ID conversion logic
   - Tenant-scoped vendor lookup

## Compliance Checklist

- ✅ **NO INTEGER ID EXPOSURE**: Frontend only sees UUIDs
- ✅ **UUID-ONLY PUBLIC API**: VendorResource returns UUID as `id`
- ✅ **TENANT ISOLATION**: Conversion respects tenant boundaries
- ✅ **HEXAGONAL ARCHITECTURE**: Request layer handles conversion
- ✅ **NO MOCK DATA**: Real database lookup
- ✅ **BACKWARD COMPATIBLE**: Doesn't break existing functionality

## Related Issues

- **Task 8**: Vendor Selection UI Implementation
- **Error**: "The vendor id field must be an integer"
- **Frontend**: ActionableStageModal.tsx sends vendor UUID
- **Backend**: UpdateOrderRequest expects integer ID

## Future Considerations

### Similar Conversions Needed

This pattern should be applied to other foreign key fields that accept UUIDs:

1. **customer_id**: Convert customer UUID to ID
2. **product_id**: Convert product UUID to ID (in items array)
3. **category_id**: Convert category UUID to ID
4. **Any other foreign keys**: Follow same pattern

### Generalization

Consider creating a trait for UUID-to-ID conversion:

```php
trait ConvertsUuidsToIds
{
    protected function convertUuidToId(string $field, string $model, ?string $tenantIdField = 'tenant_id'): void
    {
        if ($this->has($field) && $this->$field) {
            if ($this->isUuid($this->$field)) {
                $tenantId = $this->resolveTenantId();
                $record = $model::where('uuid', $this->$field)
                    ->where($tenantIdField, $tenantId)
                    ->first();
                
                if ($record) {
                    $this->merge([$field => $record->id]);
                }
            }
        }
    }
    
    protected function isUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $value);
    }
}
```

## Documentation Updates

- [x] UUID to ID Conversion Fix (this document)
- [x] Vendor Selection UI Implementation
- [ ] Update API documentation to clarify UUID acceptance
- [ ] Add to troubleshooting guide

---

**Version**: 1.0.0  
**Date**: January 30, 2026  
**Author**: Kiro AI Assistant  
**Status**: ✅ Implemented and Ready for Testing
