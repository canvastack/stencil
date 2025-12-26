# Product Module Developer Guide

**Version:** 1.0  
**Target:** Backend & Frontend Developers  
**Last Updated:** 2025-12-26

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Adding New Product Types](#adding-new-product-types)
3. [Adding New Filter Criteria](#adding-new-filter-criteria)
4. [Customizing Product Options](#customizing-product-options)
5. [Adding New Fields](#adding-new-fields)
6. [Testing Guidelines](#testing-guidelines)
7. [Performance Optimization](#performance-optimization)
8. [Common Patterns](#common-patterns)

---

## Architecture Overview

### Hexagonal Architecture Pattern

Product module mengikuti hexagonal architecture dengan clear separation of concerns:

```
backend/
├── app/
│   ├── Domain/
│   │   └── Product/           # Core business logic
│   │       ├── Entities/
│   │       ├── ValueObjects/
│   │       └── Repositories/
│   ├── Application/
│   │   └── Product/           # Use cases
│   │       ├── Commands/
│   │       └── Queries/
│   ├── Infrastructure/
│   │   └── Persistence/
│   │       └── Eloquent/
│   │           └── Models/    # Database models
│   └── Http/
│       ├── Controllers/
│       │   └── Api/V1/
│       │       ├── Public/    # Public endpoints
│       │       └── Admin/     # Admin endpoints
│       └── Resources/
│           └── Product/       # API responses
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── types/
│   │   └── product.ts         # TypeScript interfaces
│   ├── services/
│   │   └── api/
│   │       ├── publicProducts.ts  # Public API service
│   │       └── adminProducts.ts   # Admin API service
│   ├── themes/
│   │   └── default/
│   │       └── pages/
│   │           ├── Products.tsx       # Product list
│   │           └── ProductDetail.tsx  # Product detail
│   └── pages/
│       └── admin/
│           └── products/
│               ├── ProductCatalog.tsx  # Admin catalog
│               └── ProductForm.tsx     # Create/Edit form
```

---

## Adding New Product Types

### Step 1: Update Database Schema

**File:** `backend/database/migrations/xxxx_update_products_business_type.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add new business type to enum
        DB::statement("
            ALTER TABLE products 
            DROP CONSTRAINT IF EXISTS products_business_type_check
        ");
        
        DB::statement("
            ALTER TABLE products 
            ADD CONSTRAINT products_business_type_check 
            CHECK (business_type IN (
                'metal_etching', 
                'glass_etching', 
                'award_plaque',
                'crystal_engraving'  -- NEW TYPE
            ))
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE products 
            DROP CONSTRAINT products_business_type_check
        ");
        
        DB::statement("
            ALTER TABLE products 
            ADD CONSTRAINT products_business_type_check 
            CHECK (business_type IN (
                'metal_etching', 
                'glass_etching', 
                'award_plaque'
            ))
        ");
    }
};
```

### Step 2: Update Backend Validation

**File:** `backend/app/Http/Requests/Product/StoreProductRequest.php`

```php
<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'business_type' => [
                'required',
                'string',
                Rule::in([
                    'metal_etching',
                    'glass_etching',
                    'award_plaque',
                    'crystal_engraving', // NEW TYPE
                ]),
            ],
            // ... other rules
        ];
    }
}
```

### Step 3: Update Frontend Types

**File:** `frontend/src/types/product.ts`

```typescript
export type BusinessType = 
  | 'metal_etching' 
  | 'glass_etching' 
  | 'award_plaque'
  | 'crystal_engraving'; // NEW TYPE

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  metal_etching: 'Metal Etching',
  glass_etching: 'Glass Etching',
  award_plaque: 'Award Plaque',
  crystal_engraving: 'Crystal Engraving', // NEW TYPE
};
```

### Step 4: Update Frontend Filter UI

**File:** `frontend/src/themes/default/pages/Products.tsx`

```typescript
const TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "metal_etching", label: "Metal Etching" },
  { value: "glass_etching", label: "Glass Etching" },
  { value: "award_plaque", label: "Award Plaque" },
  { value: "crystal_engraving", label: "Crystal Engraving" }, // NEW TYPE
];
```

### Step 5: Update Seeder

**File:** `backend/database/seeders/ProductSeeder.php`

```php
$products[] = [
    'uuid' => Uuid::uuid4()->toString(),
    'tenant_id' => $tenant->id,
    'name' => 'Premium Crystal Trophy',
    'business_type' => 'crystal_engraving', // NEW TYPE
    'type' => 'physical',
    'status' => 'published',
    // ... other fields
];
```

### Step 6: Add Integration Test

**File:** `backend/tests/Feature/ProductDataCompletenessTest.php`

```php
public function test_crystal_engraving_type_filter_works(): void
{
    $response = $this->get('/api/v1/public/etchinx/products?type=crystal_engraving');
    
    $response->assertStatus(200);
    $data = $response->json('data');
    
    foreach ($data as $product) {
        $this->assertEquals('crystal_engraving', $product['businessType']);
    }
}
```

---

## Adding New Filter Criteria

### Example: Adding "Color" Filter

### Step 1: Add Database Column

**File:** Create new migration

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('color')->nullable()->after('material');
            $table->jsonb('available_colors')->nullable()->after('color');
        });
        
        // Add index for performance
        Schema::table('products', function (Blueprint $table) {
            $table->index('color');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['color', 'available_colors']);
        });
    }
};
```

### Step 2: Update Controller Query Logic

**File:** `backend/app/Http/Controllers/Api/V1/Public/ProductController.php`

```php
// Add validation for color filter
$validated = $request->validate([
    'color' => 'sometimes|string|max:50',
    // ... existing validations
]);

// Add color filter logic
if (!empty($validated['color'])) {
    $query->where(function ($q) use ($validated) {
        $q->where('color', $validated['color'])
          ->orWhereJsonContains('available_colors', $validated['color']);
    });
}
```

### Step 3: Update ProductResource

**File:** `backend/app/Http/Resources/Product/ProductResource.php`

```php
public function toArray(Request $request): array
{
    return [
        // ... existing fields
        'color' => $this->color,
        'availableColors' => $this->available_colors,
    ];
}
```

### Step 4: Update Frontend Types

**File:** `frontend/src/types/product.ts`

```typescript
export interface Product {
  // ... existing fields
  color?: string;
  availableColors?: string[];
}

export interface ProductFilters {
  // ... existing filters
  color?: string;
}
```

### Step 5: Update Frontend Filter UI

**File:** `frontend/src/themes/default/pages/Products.tsx`

```typescript
// Add state
const [selectedColor, setSelectedColor] = useState("all");

// Add to filters object
const filters: ProductFilters = useMemo(() => ({
  // ... existing filters
  color: selectedColor !== "all" ? selectedColor : undefined,
}), [/* dependencies */, selectedColor]);

// Add UI component
<Select value={selectedColor} onValueChange={setSelectedColor}>
  <SelectTrigger>
    <SelectValue placeholder="Pilih Warna" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Semua Warna</SelectItem>
    <SelectItem value="silver">Silver</SelectItem>
    <SelectItem value="gold">Gold</SelectItem>
    <SelectItem value="bronze">Bronze</SelectItem>
  </SelectContent>
</Select>
```

### Step 6: Update API Service

**File:** `frontend/src/services/api/publicProducts.ts`

```typescript
export async function getProducts(filters?: ProductFilters) {
  const params = new URLSearchParams();
  
  // ... existing params
  
  if (filters?.color) {
    params.append('color', filters.color);
  }
  
  // ... rest of implementation
}
```

### Step 7: Update Field Mapping Documentation

**File:** `roadmaps/AUDIT/FINDING/PRODUCT/MATCHING_BACKEND_FRONTEND_DATA/03-FIELD_MAPPING_REFERENCE.md`

```markdown
| **Color** | `color` | `color` | `product.color` | ✅ Available |
| **Available Colors** | `available_colors` (JSON) | `availableColors` | `product.availableColors` | ✅ Array support |
```

### Step 8: Add Test Coverage

```php
public function test_color_filter_works(): void
{
    // Seed test data
    Product::factory()->create([
        'tenant_id' => $this->tenant->id,
        'color' => 'silver',
        'status' => 'published',
    ]);
    
    // Test filter
    $response = $this->get('/api/v1/public/products?color=silver');
    
    $response->assertStatus(200);
    $data = $response->json('data');
    
    foreach ($data as $product) {
        $this->assertTrue(
            $product['color'] === 'silver' ||
            in_array('silver', $product['availableColors'] ?? [])
        );
    }
}
```

---

## Customizing Product Options

### Dynamic Custom Options Structure

Custom options disimpan sebagai JSON array dengan struktur flexible:

```typescript
interface CustomOption {
  name: string;           // Display name
  type: 'text' | 'select' | 'number' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];     // For 'select' type
  minLength?: number;     // For 'text' / 'textarea'
  maxLength?: number;
  min?: number;           // For 'number'
  max?: number;
  defaultValue?: any;
  priceModifier?: number; // Additional price in cents
  description?: string;
}
```

### Example: Adding File Upload Option

```typescript
{
  name: "Design File",
  type: "file",
  required: true,
  acceptedFormats: ["pdf", "ai", "svg"],
  maxFileSize: 10485760, // 10MB in bytes
  description: "Upload your design file (PDF, AI, or SVG format)"
}
```

### Backend Validation for Custom Options

**File:** Create custom validation rule

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;

class CustomOptionsValidation implements Rule
{
    public function passes($attribute, $value)
    {
        if (!is_array($value)) {
            return false;
        }
        
        foreach ($value as $option) {
            // Validate structure
            if (!isset($option['name'], $option['type'], $option['required'])) {
                return false;
            }
            
            // Validate type
            $validTypes = ['text', 'select', 'number', 'textarea', 'checkbox', 'file'];
            if (!in_array($option['type'], $validTypes)) {
                return false;
            }
            
            // Validate select options
            if ($option['type'] === 'select' && empty($option['options'])) {
                return false;
            }
        }
        
        return true;
    }

    public function message()
    {
        return 'Invalid custom options structure.';
    }
}
```

**Usage in Request:**

```php
public function rules(): array
{
    return [
        'custom_options' => ['nullable', 'array', new CustomOptionsValidation()],
    ];
}
```

---

## Adding New Fields

### Complete Workflow Example: Adding "Warranty Period"

### 1. Database Migration

```php
Schema::table('products', function (Blueprint $table) {
    $table->integer('warranty_months')->nullable()->after('lead_time');
    $table->text('warranty_terms')->nullable()->after('warranty_months');
});
```

### 2. Update Model

**File:** `backend/app/Infrastructure/Persistence/Eloquent/Models/Product.php`

```php
protected $fillable = [
    // ... existing fields
    'warranty_months',
    'warranty_terms',
];

protected $casts = [
    // ... existing casts
    'warranty_months' => 'integer',
];
```

### 3. Update ProductResource

```php
public function toArray(Request $request): array
{
    return [
        // ... existing fields
        'warranty' => [
            'months' => $this->warranty_months,
            'terms' => $this->warranty_terms,
        ],
    ];
}
```

### 4. Update Validation

```php
public function rules(): array
{
    return [
        // ... existing rules
        'warranty_months' => 'nullable|integer|min:0|max:120',
        'warranty_terms' => 'nullable|string|max:1000',
    ];
}
```

### 5. Update Frontend Types

```typescript
export interface Product {
  // ... existing fields
  warranty?: {
    months: number;
    terms?: string;
  };
}
```

### 6. Update UI Component

```tsx
// In ProductDetail.tsx
{product.warranty && (
  <div className="warranty-section">
    <h3>Garansi</h3>
    <p className="font-semibold">
      {product.warranty.months} Bulan Garansi
    </p>
    {product.warranty.terms && (
      <p className="text-sm text-muted-foreground">
        {product.warranty.terms}
      </p>
    )}
  </div>
)}
```

### 7. Update Admin Form

```tsx
// In ProductForm.tsx
<FormField
  control={form.control}
  name="warranty_months"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Warranty Period (Months)</FormLabel>
      <FormControl>
        <Input type="number" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="warranty_terms"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Warranty Terms</FormLabel>
      <FormControl>
        <Textarea {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### 8. Update Seeder

```php
$products[] = [
    // ... existing fields
    'warranty_months' => 12,
    'warranty_terms' => 'Full replacement warranty for manufacturing defects',
];
```

### 9. Update Documentation

Add to `03-FIELD_MAPPING_REFERENCE.md`:

```markdown
| **Warranty Period** | `warranty_months` | `warranty.months` | `product.warranty.months` | ✅ Available |
| **Warranty Terms** | `warranty_terms` | `warranty.terms` | `product.warranty.terms` | ✅ Available |
```

---

## Testing Guidelines

### Backend Integration Tests

**File:** `backend/tests/Feature/Product/ProductApiTest.php`

```php
<?php

namespace Tests\Feature\Product;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tenant = Tenant::factory()->create(['slug' => 'test-tenant']);
    }

    public function test_can_fetch_public_products(): void
    {
        Product::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/v1/public/test-tenant/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'uuid',
                        'name',
                        'price',
                        'businessType',
                    ]
                ],
                'meta',
                'links',
            ]);
    }

    public function test_filter_by_business_type_works(): void
    {
        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'business_type' => 'metal_etching',
            'status' => 'published',
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'business_type' => 'glass_etching',
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/v1/public/test-tenant/products?type=metal_etching');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        
        foreach ($data as $product) {
            $this->assertEquals('metal_etching', $product['businessType']);
        }
    }

    public function test_rating_filter_returns_correct_products(): void
    {
        // Create products with different ratings
        $highRated = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
        ]);
        
        // Add reviews
        CustomerReview::factory()->count(3)->create([
            'product_id' => $highRated->id,
            'rating' => 5,
            'is_approved' => true,
        ]);

        $response = $this->getJson('/api/v1/public/test-tenant/products?min_rating=4');

        $response->assertStatus(200);
        
        $data = $response->json('data');
        foreach ($data as $product) {
            $this->assertGreaterThanOrEqual(4, $product['reviewSummary']['averageRating']);
        }
    }

    public function test_admin_can_create_product(): void
    {
        $admin = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->actingAs($admin, 'sanctum');

        $productData = [
            'name' => 'Test Product',
            'slug' => 'test-product',
            'description' => 'Test description',
            'price' => 100000,
            'business_type' => 'metal_etching',
            'type' => 'physical',
            'status' => 'draft',
            'stock_quantity' => 50,
        ];

        $response = $this->postJson('/api/v1/admin/products', $productData);

        $response->assertStatus(201)
            ->assertJsonFragment(['name' => 'Test Product']);
        
        $this->assertDatabaseHas('products', [
            'name' => 'Test Product',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_product_id_is_uuid_not_integer(): void
    {
        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/v1/public/test-tenant/products');

        $product = $response->json('data.0');
        
        // UUID is string, not integer
        $this->assertIsString($product['id']);
        
        // UUID format validation
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $product['id']
        );
        
        // Internal ID should not be exposed to public
        $this->assertArrayNotHasKey('_internal_id', $product);
    }
}
```

### Frontend Component Tests

**File:** `frontend/src/themes/default/pages/__tests__/Products.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Products from '../Products';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Products Page', () => {
  it('renders product list', async () => {
    render(<Products />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/products/i)).toBeInTheDocument();
    });
  });

  it('filters by business type', async () => {
    const { getByLabelText } = render(<Products />, { wrapper });

    const typeSelect = getByLabelText(/type/i);
    fireEvent.change(typeSelect, { target: { value: 'metal_etching' } });

    await waitFor(() => {
      // Verify API called with correct filter
      expect(mockApi.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'metal_etching' })
      );
    });
  });
});
```

---

## Performance Optimization

### 1. Database Indexing

**Critical indexes untuk product queries:**

```php
// In migration
Schema::table('products', function (Blueprint $table) {
    // Filter indexes
    $table->index('business_type');
    $table->index('size');
    $table->index('status');
    $table->index(['tenant_id', 'status']);
    
    // Search index (PostgreSQL full-text)
    DB::statement('CREATE INDEX products_name_search_idx ON products USING gin(to_tsvector(\'english\', name))');
    DB::statement('CREATE INDEX products_description_search_idx ON products USING gin(to_tsvector(\'english\', description))');
    
    // JSON indexes
    DB::statement('CREATE INDEX products_available_sizes_idx ON products USING gin(available_sizes)');
    DB::statement('CREATE INDEX products_available_materials_idx ON products USING gin(available_materials)');
});
```

### 2. Query Optimization

**Eager Loading Relationships:**

```php
// BAD: N+1 query problem
$products = Product::all();
foreach ($products as $product) {
    echo $product->category->name; // Triggers query for each product
}

// GOOD: Eager load
$products = Product::with('category', 'reviews')->get();
```

**Select Only Needed Columns:**

```php
// BAD: Load all columns
$products = Product::all();

// GOOD: Select specific columns
$products = Product::select(['id', 'uuid', 'name', 'price', 'status'])->get();
```

### 3. Caching Strategy

```php
use Illuminate\Support\Facades\Cache;

class ProductService
{
    public function getPublicProducts(string $tenantSlug, array $filters = [])
    {
        $cacheKey = "products:{$tenantSlug}:" . md5(json_encode($filters));
        
        return Cache::remember($cacheKey, 300, function () use ($tenantSlug, $filters) {
            // Query logic here
            return Product::query()
                ->where('tenant_id', $tenant->id)
                ->where('status', 'published')
                ->applyFilters($filters)
                ->paginate();
        });
    }
    
    public function clearProductCache(string $tenantSlug): void
    {
        Cache::tags(["products:{$tenantSlug}"])->flush();
    }
}
```

### 4. Frontend Performance

**Lazy Loading Images:**

```tsx
import { LazyLoadImage } from 'react-lazy-load-image-component';

<LazyLoadImage
  src={product.images[0]}
  alt={product.name}
  effect="blur"
  placeholderSrc="/placeholder.jpg"
/>
```

**Virtual Scrolling for Large Lists:**

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function ProductList({ products }) {
  const parentRef = React.useRef(null);

  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div key={virtualRow.index}>
            <ProductCard product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Common Patterns

### 1. Scoped Queries (Multi-Tenancy)

**Always scope queries to tenant:**

```php
// Add global scope in Model
protected static function booted()
{
    static::addGlobalScope('tenant', function (Builder $builder) {
        if (auth()->check() && auth()->user()->tenant_id) {
            $builder->where('tenant_id', auth()->user()->tenant_id);
        }
    });
}
```

### 2. Repository Pattern

```php
<?php

namespace App\Domain\Product\Repositories;

use App\Domain\Product\Entities\Product;

interface ProductRepositoryInterface
{
    public function findByUuid(string $uuid): ?Product;
    public function findPublished(array $filters = []): Collection;
    public function create(array $data): Product;
    public function update(string $uuid, array $data): Product;
    public function delete(string $uuid): bool;
}
```

### 3. Service Layer Pattern

```php
<?php

namespace App\Application\Product\Services;

class ProductService
{
    public function __construct(
        private ProductRepositoryInterface $repository,
        private ImageUploadService $imageService
    ) {}

    public function createProduct(array $data): Product
    {
        // Business logic
        if (isset($data['images'])) {
            $data['images'] = $this->imageService->upload($data['images']);
        }
        
        return $this->repository->create($data);
    }
}
```

### 4. Event-Driven Updates

```php
<?php

namespace App\Domain\Product\Events;

use Illuminate\Foundation\Events\Dispatchable;

class ProductCreated
{
    use Dispatchable;

    public function __construct(public Product $product) {}
}
```

**Listener:**

```php
<?php

namespace App\Domain\Product\Listeners;

class ClearProductCache
{
    public function handle(ProductCreated $event): void
    {
        Cache::tags(["products:{$event->product->tenant_id}"])->flush();
    }
}
```

---

## Development Checklist

Setiap kali menambah feature baru ke Product module:

- [ ] **Database:** Migration dengan rollback support
- [ ] **Model:** Update fillable dan casts
- [ ] **Validation:** Request validation rules
- [ ] **API Resource:** Update response structure
- [ ] **Controller:** Query logic dengan filtering
- [ ] **Frontend Types:** TypeScript interfaces
- [ ] **Frontend UI:** Component implementation
- [ ] **API Service:** HTTP client methods
- [ ] **Tests:** Backend integration + Frontend component
- [ ] **Documentation:** Update field mapping reference
- [ ] **Seeder:** Sample data untuk testing
- [ ] **Cache:** Invalidation strategy

---

## Troubleshooting

### Common Issues

**1. Filter Not Working**

```php
// Check query builder
DB::enableQueryLog();
$products = Product::applyFilters($filters)->get();
dd(DB::getQueryLog());
```

**2. UUID vs ID Confusion**

```typescript
// Always use UUID
const url = `/api/products/${product.uuid}`; // ✅ CORRECT
const url = `/api/products/${product.id}`;   // ✅ ALSO CORRECT (id is UUID)
const url = `/api/products/${product._internal_id}`; // ❌ WRONG
```

**3. Performance Issues**

```bash
# Check slow queries
php artisan telescope:prune --hours=1
# Visit /telescope to analyze queries
```

---

## Resources

**Code References:**
- Product Controller: `backend/app/Http/Controllers/Api/V1/Public/ProductController.php`
- Product Model: `backend/app/Infrastructure/Persistence/Eloquent/Models/Product.php`
- Product Resource: `backend/app/Http/Resources/Product/ProductResource.php`
- Frontend Service: `frontend/src/services/api/publicProducts.ts`

**Documentation:**
- API Reference: `04-PRODUCT_API_REFERENCE.md`
- Field Mapping: `roadmaps/.../03-FIELD_MAPPING_REFERENCE.md`
- Audit Report: `roadmaps/.../01-COMPREHENSIVE_AUDIT_REPORT.md`

---

**Last Updated:** 2025-12-26  
**Maintained By:** CanvaStack Development Team
