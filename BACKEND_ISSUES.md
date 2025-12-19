# Backend API Issues - Product Catalog

**Date**: December 19, 2025  
**Reported By**: Frontend Team  
**Priority**: HIGH (Security) + MEDIUM (Functionality)

---

## 🔴 ISSUE 1: Database ID Exposure (SECURITY)

### Problem
Backend API exposes internal database IDs in product responses:
```json
{
  "id": 280,  // ❌ SECURITY RISK: Exposes internal database structure
  "uuid": "653d9f7c-7c86-4d9b-98fd-ee71701c0590"
}
```

### Impact
- **Security Risk**: Attackers can enumerate database records
- **Architecture Violation**: Public APIs should never expose internal IDs
- **Best Practice**: Use UUIDs for external-facing identifiers

### Solution Required
Update Laravel ProductResource to exclude `id` field:

```php
// app/Http/Resources/ProductResource.php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            // ✅ Use UUID as identifier, NOT id
            'uuid' => $this->uuid,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'longDescription' => $this->long_description,
            
            // Category with proper resource
            'category' => $this->category ? [
                'uuid' => $this->category->uuid,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                // ❌ DON'T: 'id' => $this->category->id
            ] : null,
            
            'price' => $this->price,
            'currency' => $this->currency,
            'priceUnit' => $this->price_unit,
            'minOrder' => $this->min_order,
            'status' => $this->status,
            
            // ✅ ADD THIS: Featured field (currently missing!)
            'isFeatured' => (bool) $this->is_featured,
            
            'stockQuantity' => $this->stock_quantity,
            'inStock' => $this->in_stock,
            'leadTime' => $this->lead_time,
            'images' => $this->images,
            'tags' => $this->tags,
            'features' => $this->features,
            'specifications' => $this->specifications,
            
            'createdAt' => $this->created_at,
            'updatedAt' => $this->updated_at,
            
            // ❌ NEVER expose these fields to public:
            // 'id' => $this->id,
            // 'tenantId' => $this->tenant_id,
        ];
    }
}
```

Update Controller to use Resource:

```php
// app/Http/Controllers/Api/ProductController.php

use App\Http\Resources\ProductResource;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $products = Product::with('category')
            ->where('tenant_id', $request->user()->tenant_id)
            ->paginate($request->get('per_page', 12));
        
        // ✅ Use Resource to transform response
        return ProductResource::collection($products);
    }
    
    public function show(Product $product)
    {
        // ✅ Use Resource for single product
        return new ProductResource($product);
    }
}
```

---

## 🟡 ISSUE 2: Missing `featured` Field

### Problem
Backend response does NOT include `featured` or `is_featured` field:

**Current Response:**
```json
{
  "id": 280,
  "uuid": "...",
  "name": "Deluxe Clear Glass Stand",
  "status": "draft",
  "inStock": true
  // ❌ NO 'featured' or 'is_featured' field!
}
```

**Expected Response:**
```json
{
  "uuid": "...",
  "name": "Deluxe Clear Glass Stand",
  "status": "draft",
  "inStock": true,
  "isFeatured": false  // ✅ Should be included
}
```

### Impact
- Frontend cannot display featured products correctly
- Featured filter doesn't work
- Product cards don't show star icon for featured items
- Stats card shows "Featured: 0" (always)

### Solution Required
Add `is_featured` field to ProductResource (see ISSUE 1 solution above).

---

## 🟢 Frontend Workaround (Temporary)

Frontend has implemented transformation layer to handle various field name formats:

```typescript
// src/utils/productTransform.ts
featured: Boolean(
  backendProduct.is_featured ?? 
  backendProduct.featured ?? 
  backendProduct.isFeatured ?? 
  false
)
```

This handles:
- ✅ `is_featured` (snake_case - Laravel standard)
- ✅ `featured` (direct field)
- ✅ `isFeatured` (camelCase)
- ✅ Missing field (defaults to `false`)

---

## Testing Checklist

After implementing fixes, verify:

### Security (ISSUE 1)
- [ ] XHR response does NOT contain `"id": 280` field
- [ ] Only `uuid` field is present as identifier
- [ ] Category also uses `uuid` instead of `id`
- [ ] No `tenantId` exposed in public responses

### Featured Field (ISSUE 2)
- [ ] Response includes `isFeatured: true/false` field
- [ ] Featured products show star icon in UI
- [ ] Featured filter works correctly
- [ ] Stats card shows correct featured count
- [ ] Featured products appear in homepage carousel

### Test Endpoints
```bash
# Tenant API (authenticated)
GET /api/v1/tenant/products
GET /api/v1/tenant/products/{uuid}

# Public API (guest)
GET /api/v1/public/products
GET /api/v1/public/products/{uuid}
```

---

## Priority

1. **HIGH**: Fix ID exposure (security risk)
2. **MEDIUM**: Add featured field (functionality)
3. **LOW**: Standardize all field names to camelCase (consistency)

---

## Related Files

### Backend (Laravel)
- `app/Http/Resources/ProductResource.php` (needs creation/update)
- `app/Http/Controllers/Api/ProductController.php`
- `app/Models/Product.php` (check if `is_featured` column exists)

### Frontend (React)
- `src/utils/productTransform.ts` (workaround implemented)
- `src/services/api/products.ts` (uses transformation)
- `src/pages/admin/products/ProductCatalog.tsx` (displays featured)

---

## Database Migration Check

Verify `is_featured` column exists:

```sql
-- Check if column exists
DESCRIBE products;

-- If missing, add it:
ALTER TABLE products 
ADD COLUMN is_featured BOOLEAN DEFAULT FALSE AFTER status;

-- Set some products as featured for testing
UPDATE products 
SET is_featured = TRUE 
WHERE status = 'published' 
LIMIT 5;
```
