# 🔌 Phase 1: API Examples & Integration Guide

> **Complete API Documentation with Examples**  
> **Companion Document to**: PHASE1_COMPLETE_ROADMAP.md

---

## 🎯 **API DESIGN PRINCIPLES**

### **1. RESTful Standards**
```yaml
Base URL: https://api.stencil.com/v1
Authentication: Bearer Token (Laravel Sanctum)
Content-Type: application/json
Accept: application/json
```

### **2. Response Format (MANDATORY)**

**Success Response:**
```json
{
  "data": {
    // Main response data
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

**List/Collection Response:**
```json
{
  "data": [
    // Array of items
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "timestamp": "2024-11-07T10:30:00Z"
  },
  "links": {
    "first": "/api/v1/admin/orders?page=1",
    "last": "/api/v1/admin/orders?page=8",
    "prev": null,
    "next": "/api/v1/admin/orders?page=2"
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid.",
    "details": {
      "email": ["The email field is required."],
      "password": ["The password must be at least 8 characters."]
    }
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

---

## 🔐 **AUTHENTICATION ENDPOINTS**

### **POST /api/v1/auth/login**

**Request:**
```json
{
  "email": "admin@ptcex.com",
  "password": "password123",
  "device_name": "Chrome on Windows"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Admin PT CEX",
      "email": "admin@ptcex.com",
      "avatar_url": null
    },
    "token": "1|abcdefghijklmnopqrstuvwxyz1234567890",
    "expires_in": 525600,
    "tenants": [
      {
        "id": "tenant-001",
        "name": "PT Custom Etching Xenial",
        "slug": "pt-cex",
        "domain": "cex.stencil.com",
        "role": "admin"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

**Error: 401 Unauthorized**
```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The provided credentials are incorrect."
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

---

### **POST /api/v1/auth/logout**

**Headers:**
```
Authorization: Bearer {token}
```

**Response: 204 No Content**

---

## 📦 **PRODUCT MANAGEMENT ENDPOINTS**

### **GET /api/v1/admin/products**

**Headers:**
```
Authorization: Bearer {token}
X-Tenant-ID: tenant-001 (optional, can be from subdomain)
```

**Query Parameters:**
```
?page=1
&per_page=20
&search=plakat
&category_id=cat-001
&is_public=true
&sort_by=created_at
&sort_order=desc
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "prod-001",
      "name": "Plakat Etching Premium",
      "slug": "plakat-etching-premium",
      "description": "Plakat etching berkualitas tinggi...",
      "short_description": "Plakat premium dengan detail presisi",
      "base_price": 150000.00,
      "currency": "IDR",
      "images": [
        "https://cdn.stencil.com/products/plakat-001.jpg"
      ],
      "thumbnail_url": "https://cdn.stencil.com/products/plakat-001-thumb.jpg",
      "specifications": {
        "materials": ["Kuningan", "Stainless Steel"],
        "sizes": ["10x15cm", "15x20cm", "20x30cm"]
      },
      "is_public": true,
      "is_featured": true,
      "created_at": "2024-10-01T10:00:00Z",
      "updated_at": "2024-10-15T14:30:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 45,
    "total_pages": 3,
    "timestamp": "2024-11-07T10:30:00Z"
  },
  "links": {
    "first": "/api/v1/admin/products?page=1",
    "last": "/api/v1/admin/products?page=3",
    "prev": null,
    "next": "/api/v1/admin/products?page=2"
  }
}
```

---

### **POST /api/v1/admin/products**

**Request:**
```json
{
  "name": "Plakat Akrilik Custom",
  "slug": "plakat-akrilik-custom",
  "description": "Plakat akrilik dengan desain custom sesuai kebutuhan",
  "short_description": "Plakat akrilik berkualitas",
  "base_price": 85000.00,
  "currency": "IDR",
  "specifications": {
    "materials": ["Akrilik"],
    "sizes": ["15x20cm", "20x30cm"],
    "thickness": ["3mm", "5mm"]
  },
  "features": [
    "Desain custom",
    "Presisi tinggi",
    "Tahan lama"
  ],
  "is_public": true,
  "is_featured": false,
  "meta_title": "Plakat Akrilik Custom - PT CEX",
  "meta_description": "Pesan plakat akrilik dengan desain sesuai keinginan"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "prod-046",
    "name": "Plakat Akrilik Custom",
    "slug": "plakat-akrilik-custom",
    "description": "Plakat akrilik dengan desain custom...",
    "base_price": 85000.00,
    "is_public": true,
    "created_at": "2024-11-07T10:30:00Z",
    "updated_at": "2024-11-07T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

**Error: 422 Unprocessable Entity**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid.",
    "details": {
      "name": ["The name field is required."],
      "slug": ["The slug has already been taken."]
    }
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

---

### **GET /api/v1/admin/products/{id}**

**Response: 200 OK**
```json
{
  "data": {
    "id": "prod-001",
    "name": "Plakat Etching Premium",
    "slug": "plakat-etching-premium",
    "description": "Full description here...",
    "base_price": 150000.00,
    "specifications": {
      "materials": ["Kuningan", "Stainless Steel"],
      "sizes": ["10x15cm", "15x20cm"]
    },
    "category": {
      "id": "cat-001",
      "name": "Plakat",
      "slug": "plakat"
    },
    "statistics": {
      "total_orders": 45,
      "total_revenue": 6750000.00,
      "average_rating": 4.8
    },
    "created_at": "2024-10-01T10:00:00Z",
    "updated_at": "2024-10-15T14:30:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

---

### **PUT /api/v1/admin/products/{id}**

**Request:**
```json
{
  "name": "Plakat Etching Premium - Updated",
  "base_price": 165000.00,
  "is_featured": true
}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "prod-001",
    "name": "Plakat Etching Premium - Updated",
    "base_price": 165000.00,
    "is_featured": true,
    "updated_at": "2024-11-07T11:00:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T11:00:00Z"
  }
}
```

---

### **DELETE /api/v1/admin/products/{id}**

**Response: 204 No Content**

---

## 🛒 **ORDER MANAGEMENT ENDPOINTS**

### **GET /api/v1/admin/orders**

**Query Parameters:**
```
?page=1
&per_page=20
&status=in_production
&customer_id=cust-001
&vendor_id=vendor-001
&production_type=vendor
&from_date=2024-10-01
&to_date=2024-11-07
&sort_by=created_at
&sort_order=desc
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "order-001",
      "order_code": "PO-2024-001",
      "customer": {
        "id": "cust-001",
        "name": "PT ABC Corporation",
        "email": "purchasing@abc.com"
      },
      "vendor": {
        "id": "vendor-001",
        "name": "CV Etching Indonesia"
      },
      "status": "in_production",
      "production_type": "vendor",
      "order_details": {
        "product": "Plakat Etching Premium",
        "quantity": 50,
        "material": "Kuningan",
        "size": "15x20cm"
      },
      "quote": {
        "vendor_price": 5000000.00,
        "final_price_for_customer": 7500000.00,
        "profit": 2500000.00,
        "profit_margin": 50.00
      },
      "payment_status": "partially_paid",
      "production_progress": "60%",
      "estimated_completion_date": "2024-11-20",
      "created_at": "2024-10-15T09:00:00Z",
      "updated_at": "2024-11-06T16:45:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 128,
    "total_pages": 7,
    "statistics": {
      "total_orders": 128,
      "total_revenue": 245000000.00,
      "total_profit": 98000000.00,
      "average_profit_margin": 40.00
    },
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

---

### **POST /api/v1/admin/orders**

**Request:**
```json
{
  "customer_id": "cust-001",
  "order_details": {
    "product_name": "Plakat Etching Custom",
    "quantity": 100,
    "material": "Kuningan",
    "thickness": "5mm",
    "size": "20x30cm",
    "color": "Gold",
    "finishing": "Glossy"
  },
  "customer_notes": "Mohon dikerjakan dengan detail presisi tinggi",
  "customer_files": [
    "https://uploads.stencil.com/designs/custom-logo-001.ai"
  ],
  "production_type": "vendor"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "order-129",
    "order_code": "PO-2024-129",
    "customer": {
      "id": "cust-001",
      "name": "PT ABC Corporation"
    },
    "status": "new",
    "production_type": "vendor",
    "order_details": {
      "product_name": "Plakat Etching Custom",
      "quantity": 100,
      "material": "Kuningan"
    },
    "created_at": "2024-11-07T10:30:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T10:30:00Z"
  }
}
```

---

### **POST /api/v1/admin/orders/{id}/assign-vendor**

**Request:**
```json
{
  "vendor_id": "vendor-001",
  "internal_notes": "Vendor terpercaya dengan kualitas premium"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "order-129",
    "order_code": "PO-2024-129",
    "status": "vendor_negotiation",
    "vendor": {
      "id": "vendor-001",
      "name": "CV Etching Indonesia",
      "specializations": ["etching_kuningan"]
    },
    "vendor_assigned_at": "2024-11-07T10:35:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T10:35:00Z"
  }
}
```

---

### **POST /api/v1/admin/orders/{id}/quotes**

**Request:**
```json
{
  "vendor_price": 8000000.00,
  "markup_percentage": 50.00,
  "ppn_amount": 1200000.00,
  "estimated_production_days": 14,
  "vendor_notes": "Dapat diselesaikan dalam 2 minggu"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "quote-001",
    "purchase_order_id": "order-129",
    "vendor_price": 8000000.00,
    "markup_amount": 4000000.00,
    "markup_percentage": 50.00,
    "ppn_amount": 1200000.00,
    "final_price_for_customer": 13200000.00,
    "estimated_production_days": 14,
    "estimated_completion_date": "2024-11-21",
    "status": "pending",
    "created_at": "2024-11-07T10:40:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T10:40:00Z"
  }
}
```

---

### **PUT /api/v1/admin/orders/{id}/status**

**Request:**
```json
{
  "status": "customer_approval",
  "internal_notes": "Penawaran dikirim ke customer via email"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "order-129",
    "order_code": "PO-2024-129",
    "status": "customer_approval",
    "previous_status": "vendor_negotiation",
    "updated_at": "2024-11-07T10:45:00Z"
  },
  "meta": {
    "timestamp": "2024-11-07T10:45:00Z"
  }
}
```

---

### **POST /api/v1/admin/orders/{id}/verify-payment**

**Request:**
```json
{
  "invoice_id": "inv-001",
  "amount_paid": 6600000.00,
  "payment_method": "bank_transfer",
  "bank_name": "BCA",
  "account_number": "1234567890",
  "transfer_receipt_url": "https://uploads.stencil.com/receipts/001.jpg",
  "payment_date": "2024-11-07",
  "verification_notes": "Transfer verified manually"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "payment_id": "pay-001",
    "invoice_id": "inv-001",
    "amount_paid": 6600000.00,
    "payment_method": "bank_transfer",
    "is_verified": true,
    "verified_at": "2024-11-07T11:00:00Z",
    "order": {
      "id": "order-129",
      "status": "in_production",
      "payment_status": "partially_paid"
    }
  },
  "meta": {
    "timestamp": "2024-11-07T11:00:00Z"
  }
}
```

---

## 📊 **DASHBOARD STATISTICS ENDPOINT**

### **GET /api/v1/admin/dashboard/statistics**

**Query Parameters:**
```
?from_date=2024-10-01
&to_date=2024-11-07
```

**Response: 200 OK**
```json
{
  "data": {
    "overview": {
      "total_orders": 128,
      "total_revenue": 245000000.00,
      "total_profit": 98000000.00,
      "average_profit_margin": 40.00
    },
    "orders_by_status": {
      "new": 5,
      "sourcing_vendor": 3,
      "vendor_negotiation": 8,
      "customer_approval": 12,
      "awaiting_payment": 15,
      "in_production": 35,
      "production_complete": 10,
      "shipped": 20,
      "completed": 18,
      "cancelled": 2
    },
    "orders_by_month": [
      {
        "month": "2024-10",
        "total_orders": 45,
        "total_revenue": 87500000.00
      },
      {
        "month": "2024-11",
        "total_orders": 83,
        "total_revenue": 157500000.00
      }
    ],
    "top_products": [
      {
        "product_id": "prod-001",
        "product_name": "Plakat Etching Premium",
        "total_orders": 35,
        "total_revenue": 78750000.00
      }
    ],
    "top_vendors": [
      {
        "vendor_id": "vendor-001",
        "vendor_name": "CV Etching Indonesia",
        "total_orders": 42,
        "average_rating": 4.8
      }
    ],
    "recent_activities": [
      {
        "type": "order_created",
        "message": "Order PO-2024-129 created",
        "timestamp": "2024-11-07T10:30:00Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-11-07T11:00:00Z"
  }
}
```

---

## 🎨 **FRONTEND INTEGRATION EXAMPLES**

### **React TypeScript API Service**

```typescript
// src/lib/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const tenantId = localStorage.getItem('current_tenant_id');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }
  
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

```typescript
// src/lib/api/products.ts
import { apiClient } from './client';
import type { Product, ProductListResponse } from '@/types';

export const productApi = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<ProductListResponse> => {
    const response = await apiClient.get('/admin/products', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/admin/products/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/admin/products', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/admin/products/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/products/${id}`);
  },
};
```

```typescript
// src/pages/admin/ProductList.tsx
import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/api/products';
import { DataTable } from '@/components/ui/data-table';

export const ProductList = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <DataTable data={data?.data || []} />
    </div>
  );
};
```

---

**Document continues in PHASE1_TESTING_STRATEGY.md**

