# Product API Reference

**Version:** 1.0  
**Base URL:** `/api/v1`  
**Authentication:** Required for admin endpoints, Optional for public endpoints  
**Last Updated:** 2025-12-26

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Public Endpoints](#public-endpoints)
4. [Admin Endpoints](#admin-endpoints)
5. [Data Models](#data-models)
6. [Filter Options](#filter-options)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Overview

Product API menyediakan akses lengkap untuk mengelola dan mengambil data produk dalam platform CanvaStencil. API ini mendukung:

- ✅ Multi-tenant data isolation
- ✅ UUID-based public identification
- ✅ Advanced filtering dan search
- ✅ Pagination support
- ✅ Role-based access control
- ✅ Real-time inventory updates

---

## Authentication

### Public Endpoints
Tidak memerlukan authentication token. Digunakan untuk customer-facing features.

### Admin Endpoints
Memerlukan Bearer token dari Laravel Sanctum.

**Header Format:**
```http
Authorization: Bearer {token}
```

**Obtaining Token:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@tenant.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "1|abc123...",
  "user": { ... }
}
```

---

## Public Endpoints

### 1. Get Public Product List

**Endpoint:** `GET /api/v1/public/products`  
**Tenant-Scoped:** `GET /api/v1/public/{tenant_slug}/products`

**Description:** Mengambil daftar produk yang dipublikasikan dengan pagination dan filtering.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Halaman pagination |
| `per_page` | integer | No | 12 | Jumlah item per halaman (max: 100) |
| `search` | string | No | - | Search keyword (name, description) |
| `type` | string | No | - | Filter by business type (metal_etching, glass_etching, award_plaque) |
| `category` | string | No | - | Filter by category slug or name |
| `subcategory` | string | No | - | Filter by subcategory |
| `size` | string | No | - | Filter by size (small, medium, large) |
| `material` | string | No | - | Filter by material (metal, glass, acrylic, wood) |
| `min_rating` | integer | No | - | Minimum average rating (1-5) |
| `price_min` | integer | No | - | Minimum price in cents |
| `price_max` | integer | No | - | Maximum price in cents |
| `stock_min` | integer | No | - | Minimum stock quantity |
| `stock_max` | integer | No | - | Maximum stock quantity |
| `sort` | string | No | name-asc | Sort option (see Sort Options below) |

#### Sort Options

- `name-asc` - Nama A-Z
- `name-desc` - Nama Z-A
- `price-asc` - Harga Terendah
- `price-desc` - Harga Tertinggi
- `newest` - Terbaru
- `oldest` - Terlama
- `rating-desc` - Rating Tertinggi
- `popular` - Paling Populer

#### Example Request

```http
GET /api/v1/public/etchinx/products?type=metal_etching&size=medium&min_rating=4&page=1&per_page=12&sort=price-asc
```

#### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Premium Metal Etching Trophy",
      "slug": "premium-metal-etching-trophy",
      "description": "High-quality metal etching trophy with custom engraving options",
      "longDescription": "Our premium metal etching trophy combines...",
      "images": [
        "https://cdn.canvastencil.com/products/trophy-001.jpg",
        "https://cdn.canvastencil.com/products/trophy-002.jpg"
      ],
      "price": 150000,
      "currency": "IDR",
      "type": "physical",
      "businessType": "metal_etching",
      "status": "published",
      "stock": {
        "quantity": 50,
        "status": "in_stock",
        "sku": "MET-001"
      },
      "category": {
        "id": "cat-uuid-123",
        "name": "Trophies & Awards",
        "slug": "trophies-awards"
      },
      "materials": {
        "material": "Stainless Steel",
        "availableMaterials": ["Stainless Steel", "Brass", "Bronze"],
        "availableSizes": ["small", "medium", "large"],
        "qualityLevels": ["standard", "premium", "deluxe"]
      },
      "customization": {
        "customizable": true,
        "customOptions": [
          {
            "name": "Engraving Text",
            "type": "text",
            "required": false,
            "maxLength": 100
          },
          {
            "name": "Size",
            "type": "select",
            "options": ["Small (10cm)", "Medium (15cm)", "Large (20cm)"],
            "required": true
          }
        ]
      },
      "ordering": {
        "leadTime": "5-7 hari kerja",
        "minOrderQuantity": 1,
        "maxOrderQuantity": 100
      },
      "reviewSummary": {
        "averageRating": 4.8,
        "totalReviews": 24,
        "ratingDistribution": {
          "5": 18,
          "4": 4,
          "3": 2,
          "2": 0,
          "1": 0
        }
      },
      "features": [
        "Laser precision etching",
        "Weatherproof coating",
        "Custom engraving included",
        "Gift box packaging"
      ],
      "specifications": {
        "weight": "500g",
        "dimensions": "15cm x 10cm x 5cm",
        "finish": "Polished"
      },
      "featured": true,
      "created_at": "2025-01-15T08:30:00Z",
      "updated_at": "2025-12-20T15:45:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 12,
    "total": 44,
    "last_page": 4,
    "from": 1,
    "to": 12
  },
  "links": {
    "first": "/api/v1/public/etchinx/products?page=1",
    "last": "/api/v1/public/etchinx/products?page=4",
    "prev": null,
    "next": "/api/v1/public/etchinx/products?page=2"
  }
}
```

---

### 2. Get Product Detail

**Endpoint:** `GET /api/v1/public/products/{uuid}`  
**Tenant-Scoped:** `GET /api/v1/public/{tenant_slug}/products/{uuid}`

**Description:** Mengambil detail lengkap produk berdasarkan UUID.

#### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `uuid` | string | Yes | Product UUID |

#### Example Request

```http
GET /api/v1/public/etchinx/products/550e8400-e29b-41d4-a716-446655440000
```

#### Success Response (200 OK)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Premium Metal Etching Trophy",
    ... (sama seperti list response, tapi dengan detail lengkap)
  }
}
```

#### Error Response (404 Not Found)

```json
{
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

---

## Admin Endpoints

### 3. Get Admin Product List

**Endpoint:** `GET /api/v1/admin/products`

**Description:** Mengambil semua produk (termasuk draft dan archived) untuk tenant admin.

**Authentication:** Required (`Bearer token`)

#### Query Parameters

Sama seperti public endpoint, dengan tambahan:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | - | Filter by status (draft, published, archived) |
| `featured` | boolean | No | - | Filter featured products |

#### Example Request

```http
GET /api/v1/admin/products?status=draft&page=1
Authorization: Bearer 1|abc123...
```

#### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "_internal_id": 42,
      "name": "Draft Product",
      "status": "draft",
      "view_count": 0,
      "created_at": "2025-12-26T10:00:00Z",
      "updated_at": "2025-12-26T10:00:00Z",
      ... (fields lengkap)
    }
  ],
  "meta": { ... }
}
```

**Note:** Admin response includes `_internal_id` and `view_count` yang tidak tersedia di public endpoint.

---

### 4. Create Product

**Endpoint:** `POST /api/v1/admin/products`

**Description:** Membuat produk baru untuk tenant.

**Authentication:** Required (Permission: `products.create`)

#### Request Body

```json
{
  "name": "New Metal Trophy",
  "slug": "new-metal-trophy",
  "description": "Short description",
  "long_description": "Detailed description with HTML support",
  "price": 150000,
  "currency": "IDR",
  "type": "physical",
  "business_type": "metal_etching",
  "status": "draft",
  "stock_quantity": 100,
  "sku": "MET-NEW-001",
  "category_id": "cat-uuid-123",
  "subcategory": "Awards",
  "tags": ["trophy", "metal", "custom"],
  "material": "Stainless Steel",
  "size": "medium",
  "available_sizes": ["small", "medium", "large"],
  "available_materials": ["Stainless Steel", "Brass"],
  "features": [
    "Laser etching",
    "Weatherproof"
  ],
  "specifications": {
    "weight": "500g",
    "dimensions": "15x10x5cm"
  },
  "customizable": true,
  "custom_options": [
    {
      "name": "Engraving Text",
      "type": "text",
      "required": false,
      "maxLength": 100
    }
  ],
  "lead_time": "5-7 hari kerja",
  "min_order_quantity": 1,
  "max_order_quantity": 100,
  "production_type": "on_demand",
  "featured": false,
  "images": [
    "https://cdn.example.com/image1.jpg"
  ]
}
```

#### Success Response (201 Created)

```json
{
  "data": {
    "id": "new-product-uuid",
    "name": "New Metal Trophy",
    "status": "draft",
    ... (full product object)
  },
  "message": "Product created successfully"
}
```

#### Error Response (422 Unprocessable Entity)

```json
{
  "error": "Validation failed",
  "errors": {
    "name": ["The name field is required."],
    "price": ["The price must be a positive integer."]
  }
}
```

---

### 5. Update Product

**Endpoint:** `PUT /api/v1/admin/products/{uuid}`

**Description:** Update produk yang sudah ada.

**Authentication:** Required (Permission: `products.update`)

#### Request Body

Sama seperti Create Product, tapi semua field optional (partial update supported).

```json
{
  "name": "Updated Product Name",
  "price": 175000,
  "status": "published"
}
```

#### Success Response (200 OK)

```json
{
  "data": { ... },
  "message": "Product updated successfully"
}
```

---

### 6. Delete Product

**Endpoint:** `DELETE /api/v1/admin/products/{uuid}`

**Description:** Soft delete produk (status berubah ke `archived`).

**Authentication:** Required (Permission: `products.delete`)

#### Success Response (200 OK)

```json
{
  "message": "Product deleted successfully"
}
```

---

### 7. Bulk Operations

**Endpoint:** `POST /api/v1/admin/products/bulk`

**Description:** Operasi bulk untuk multiple products.

**Authentication:** Required (Permission: `products.manage`)

#### Request Body

```json
{
  "action": "update_status",
  "product_ids": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ],
  "data": {
    "status": "published"
  }
}
```

**Available Actions:**
- `update_status` - Update status produk
- `update_price` - Update harga
- `delete` - Soft delete multiple products
- `feature` - Set/unset featured flag

#### Success Response (200 OK)

```json
{
  "message": "Bulk operation completed",
  "affected_count": 3,
  "results": [
    {
      "uuid": "uuid-1",
      "success": true
    },
    {
      "uuid": "uuid-2",
      "success": true
    },
    {
      "uuid": "uuid-3",
      "success": false,
      "error": "Product not found"
    }
  ]
}
```

---

## Data Models

### Product Resource Structure

```typescript
interface Product {
  // Identification
  id: string;                    // UUID (public)
  uuid: string;                  // UUID (public)
  _internal_id?: number;         // Integer (admin only)
  
  // Basic Information
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  images: string[];
  
  // Pricing
  price: number;                 // In cents (100 = Rp 1.00)
  currency: string;              // ISO 4217 (IDR, USD, etc)
  
  // Classification
  type: ProductType;             // physical | digital | service
  businessType: BusinessType;    // metal_etching | glass_etching | award_plaque
  status: ProductStatus;         // draft | published | archived
  
  // Inventory
  stock: {
    quantity: number;
    status: StockStatus;         // in_stock | low_stock | out_of_stock
    sku?: string;
  };
  
  // Category
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: string;
  tags?: string[];
  
  // Materials & Specifications
  materials: {
    material?: string;
    availableMaterials?: string[];
    availableSizes?: string[];
    qualityLevels?: string[];
  };
  
  // Customization
  customization: {
    customizable: boolean;
    customOptions?: CustomOption[];
  };
  
  // Ordering
  ordering: {
    leadTime?: string;
    minOrderQuantity?: number;
    maxOrderQuantity?: number;
  };
  
  // Reviews
  reviewSummary?: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution?: {
      [key: string]: number;
    };
  };
  
  // Additional Info
  features?: string[];
  specifications?: Record<string, any>;
  productionType?: string;
  featured?: boolean;
  
  // Timestamps (admin only)
  view_count?: number;
  created_at?: string;
  updated_at?: string;
}
```

### Enums

```typescript
enum ProductType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service'
}

enum BusinessType {
  METAL_ETCHING = 'metal_etching',
  GLASS_ETCHING = 'glass_etching',
  AWARD_PLAQUE = 'award_plaque'
}

enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock'
}
```

---

## Filter Options

### Available Business Types

| Value | Display Name | Description |
|-------|--------------|-------------|
| `metal_etching` | Metal Etching | Laser etching pada logam |
| `glass_etching` | Glass Etching | Laser etching pada kaca |
| `award_plaque` | Award Plaque | Plakat penghargaan |

### Available Sizes

| Value | Display Name |
|-------|--------------|
| `small` | Small |
| `medium` | Medium |
| `large` | Large |

### Available Materials

| Value | Display Name |
|-------|--------------|
| `metal` | Metal |
| `glass` | Glass |
| `acrylic` | Acrylic |
| `wood` | Wood |
| `stainless_steel` | Stainless Steel |
| `brass` | Brass |
| `bronze` | Bronze |

### Rating Filter

- `min_rating=1` - Minimal 1 bintang
- `min_rating=2` - Minimal 2 bintang
- `min_rating=3` - Minimal 3 bintang
- `min_rating=4` - Minimal 4 bintang (highly rated)
- `min_rating=5` - Perfect 5 bintang

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request format |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `PRODUCT_NOT_FOUND` | Product tidak ditemukan |
| 422 | `VALIDATION_FAILED` | Validation error |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

### Public Endpoints
- **Limit:** 60 requests per minute per IP
- **Header:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Admin Endpoints
- **Limit:** 100 requests per minute per user
- **Header:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### Rate Limit Response (429)

```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 45
}
```

---

## Best Practices

### 1. UUID Usage
✅ **DO:** Gunakan UUID untuk semua public references
```javascript
fetch(`/api/v1/public/products/${product.uuid}`)
```

❌ **DON'T:** Jangan gunakan internal ID
```javascript
fetch(`/api/v1/public/products/${product._internal_id}`) // WRONG!
```

### 2. Pagination
✅ **DO:** Implementasi infinite scroll atau pagination
```javascript
const params = new URLSearchParams({
  page: currentPage,
  per_page: 12
});
```

### 3. Filter Combination
✅ **DO:** Combine multiple filters untuk hasil lebih spesifik
```javascript
const filters = {
  type: 'metal_etching',
  size: 'medium',
  min_rating: 4,
  price_max: 500000
};
```

### 4. Error Handling
✅ **DO:** Handle semua error cases
```javascript
try {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json();
    console.error(error.code, error.error);
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 5. Image Optimization
✅ **DO:** Request optimized images dengan query params
```javascript
const imageUrl = `${product.images[0]}?w=400&h=400&fit=cover`;
```

---

## Code Examples

### Fetch Products with React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { publicProductsApi } from '@/services/api/publicProducts';

function ProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products', { 
      type: 'metal_etching', 
      min_rating: 4 
    }],
    queryFn: () => publicProductsApi.getProducts({
      type: 'metal_etching',
      min_rating: 4,
      per_page: 12
    })
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.data.map(product => (
        <ProductCard key={product.uuid} product={product} />
      ))}
    </div>
  );
}
```

### Create Product (Admin)

```typescript
import { useMutation } from '@tanstack/react-query';
import { adminProductsApi } from '@/services/api/adminProducts';

function CreateProductForm() {
  const mutation = useMutation({
    mutationFn: adminProductsApi.createProduct,
    onSuccess: () => {
      toast.success('Product created successfully');
      queryClient.invalidateQueries(['admin-products']);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (data: ProductFormData) => {
    mutation.mutate({
      name: data.name,
      price: data.price * 100, // Convert to cents
      business_type: data.type,
      status: 'draft',
      // ... other fields
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

---

## Support & Resources

**API Documentation:** [https://api.canvastencil.com/docs](https://api.canvastencil.com/docs)  
**Developer Portal:** [https://developers.canvastencil.com](https://developers.canvastencil.com)  
**Support Email:** dev-support@canvastencil.com  

---

**Last Updated:** 2025-12-26  
**Version:** 1.0  
**Maintained By:** CanvaStack Development Team
