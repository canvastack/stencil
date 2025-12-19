# Vendor Management Developer Guide
## Technical Documentation for Vendor Management Module

**Version**: 1.0  
**Last Updated**: December 17, 2025  
**For**: Developers & Technical Team

---

## 📖 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Data Flow](#data-flow)
4. [API Integration](#api-integration)
5. [State Management](#state-management)
6. [Type System](#type-system)
7. [Adding New Features](#adding-new-features)
8. [Testing Strategy](#testing-strategy)
9. [Performance Considerations](#performance-considerations)
10. [Common Pitfalls](#common-pitfalls)

---

## 🏗️ Architecture Overview

Vendor Management module mengikuti **Hexagonal Architecture** dan **API-First Development** principles:

```
┌─────────────────────────────────────────────┐
│            Frontend (React)                 │
│   ┌──────────────────────────────────────┐  │
│   │  Pages (VendorDatabase, etc.)        │  │
│   │           ↓                           │  │
│   │  Custom Hooks (useVendors)           │  │
│   │           ↓                           │  │
│   │  API Service Layer (vendorsService)  │  │
│   └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST API
┌─────────────────┴───────────────────────────┐
│            Backend (Laravel)                │
│   ┌──────────────────────────────────────┐  │
│   │  Controllers (VendorController)      │  │
│   │           ↓                           │  │
│   │  Use Cases / Application Services    │  │
│   │           ↓                           │  │
│   │  Domain Services & Repositories      │  │
│   │           ↓                           │  │
│   │  Eloquent Models (Vendor, Order)     │  │
│   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Key Principles

✅ **API-First**: No mock data, all data dari backend API  
✅ **Type Safety**: Full TypeScript dengan runtime validation (Zod)  
✅ **Reusable Components**: Components di `src/components/ui/`  
✅ **Tenant Isolation**: Semua data terisolasi per tenant_id

---

## 📁 File Structure

```
src/
├── pages/admin/vendors/
│   ├── VendorDatabase.tsx       # Main CRUD interface
│   ├── VendorPerformance.tsx    # Performance metrics
│   ├── VendorSourcing.tsx       # Sourcing requests
│   └── VendorPayments.tsx       # Payment tracking
│
├── hooks/
│   └── useVendors.ts            # React Query hooks for vendors
│
├── services/api/
│   ├── vendors.ts               # Vendor API service
│   └── tenantApiClient.ts       # Axios client with interceptors
│
├── types/vendor/
│   └── index.ts                 # TypeScript interfaces
│
├── schemas/
│   └── vendor.schema.ts         # Zod validation schemas
│
├── utils/
│   └── vendor.ts                # Vendor utility functions
│
└── components/vendor/
    ├── VirtualVendorList.tsx    # Virtual scrolling list
    └── VendorComparison.tsx     # Vendor comparison tool
```

---

## 🔄 Data Flow

### 1. Fetching Vendors

```typescript
// User opens VendorDatabase page
VendorDatabase.tsx
  → useVendors() hook
    → vendorsService.getVendors()
      → tenantApiClient.get('/vendors')
        → Laravel VendorController@index
          → VendorRepository->all()
            → Database query (tenant-scoped)
```

### 2. Creating Vendor

```typescript
// User submits vendor form
VendorDatabase.tsx (handleSubmit)
  → useVendors().createVendor(data)
    → vendorsService.createVendor(data)
      → tenantApiClient.post('/vendors', data)
        → Laravel VendorController@store
          → Validation (VendorRequest)
            → CreateVendorUseCase->execute()
              → VendorRepository->create()
                → Database insert (with tenant_id)
```

### 3. Updating Vendor

```typescript
// User clicks Save in edit modal
VendorDatabase.tsx (handleUpdate)
  → useVendors().updateVendor(id, data)
    → vendorsService.updateVendor(id, data)
      → tenantApiClient.put(`/vendors/${id}`, data)
        → Laravel VendorController@update
          → UpdateVendorUseCase->execute()
            → VendorRepository->update()
              → Database update (tenant-scoped query)
```

---

## 🔌 API Integration

### API Endpoints

```typescript
// Base URL: /api/v1/vendors

GET    /vendors                  # List all vendors (paginated)
POST   /vendors                  # Create new vendor
GET    /vendors/{id}             # Get vendor detail
PUT    /vendors/{id}             # Update vendor
DELETE /vendors/{id}             # Delete vendor

GET    /vendors/{id}/orders      # Get vendor orders
GET    /vendors/{id}/evaluations # Get vendor evaluations
POST   /vendors/{id}/evaluations # Create evaluation

GET    /vendor-performance/metrics    # Performance overview
GET    /vendor-performance/delivery-metrics
GET    /vendor-performance/quality-metrics
GET    /vendor-performance/rankings
```

### Request/Response Format

**List Vendors (Paginated)**

```typescript
// Request
GET /api/v1/vendors?page=1&per_page=50&status=active&search=ABC

// Response
{
  "data": [
    {
      "id": "1",
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "ABC Manufacturing",
      "email": "contact@abc.com",
      "phone": "+62812345678",
      "status": "active",
      "rating": 4.8,
      "total_orders": 156,
      "total_value": 250000000,
      "created_at": "2025-01-01T00:00:00.000000Z",
      "updated_at": "2025-12-17T00:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 50,
    "total": 142
  }
}
```

**Create Vendor**

```typescript
// Request
POST /api/v1/vendors
{
  "name": "XYZ Company",
  "email": "contact@xyz.com",
  "phone": "+62812345678",
  "city": "Jakarta",
  "status": "active"
}

// Success Response (201)
{
  "data": {
    "id": "2",
    "uuid": "987fcdeb-51a2-43e1-b456-426614174001",
    "name": "XYZ Company",
    "email": "contact@xyz.com",
    "phone": "+62812345678",
    "city": "Jakarta",
    "status": "active",
    "created_at": "2025-12-17T12:00:00.000000Z",
    "updated_at": "2025-12-17T12:00:00.000000Z"
  }
}

// Validation Error (422)
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required."],
    "name": ["The name field is required."]
  }
}
```

### API Service Implementation

```typescript
// src/services/api/vendors.ts

import { tenantApiClient } from './tenantApiClient';
import { vendorSchema, createVendorSchema } from '@/schemas/vendor.schema';
import { z } from 'zod';

export const vendorsService = {
  /**
   * Fetch all vendors with optional filters
   * @param filters - Optional filters (status, search, page, per_page)
   * @returns Paginated vendor list
   */
  async getVendors(filters?: VendorFilters) {
    const response = await tenantApiClient.get('/vendors', { 
      params: filters 
    });
    
    // Runtime validation with Zod
    const vendorListSchema = z.object({
      data: z.array(vendorSchema),
      meta: paginationMetaSchema,
    });
    
    return vendorListSchema.parse(response.data);
  },

  /**
   * Create new vendor
   * @param data - Vendor creation data
   * @returns Created vendor object
   * @throws ApiException on validation or server errors
   */
  async createVendor(data: CreateVendorRequest) {
    // Validate input
    createVendorSchema.parse(data);
    
    const response = await tenantApiClient.post('/vendors', data);
    return vendorSchema.parse(response.data.data);
  },

  /**
   * Update existing vendor
   * @param id - Vendor ID
   * @param data - Updated vendor data
   * @returns Updated vendor object
   */
  async updateVendor(id: string, data: UpdateVendorRequest) {
    const response = await tenantApiClient.put(`/vendors/${id}`, data);
    return vendorSchema.parse(response.data.data);
  },

  /**
   * Delete vendor
   * @param id - Vendor ID to delete
   */
  async deleteVendor(id: string) {
    await tenantApiClient.delete(`/vendors/${id}`);
  },
};
```

---

## 🎣 State Management

### React Query Hook

```typescript
// src/hooks/useVendors.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '@/services/api/vendors';
import { toast } from 'sonner';

export const useVendors = (filters?: VendorFilters) => {
  const queryClient = useQueryClient();

  // Fetch vendors
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['vendors', filters],
    queryFn: () => vendorsService.getVendors(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create vendor mutation
  const createVendor = useMutation({
    mutationFn: vendorsService.createVendor,
    onSuccess: (newVendor) => {
      // Optimistic update
      queryClient.setQueryData(['vendors'], (old: any) => ({
        ...old,
        data: [...(old?.data || []), newVendor],
      }));
      
      toast.success('Vendor created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create vendor');
      console.error(error);
    },
  });

  // Update vendor mutation
  const updateVendor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorRequest }) =>
      vendorsService.updateVendor(id, data),
    onSuccess: (updatedVendor) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor updated successfully');
    },
  });

  // Delete vendor mutation
  const deleteVendor = useMutation({
    mutationFn: vendorsService.deleteVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor deleted successfully');
    },
  });

  return {
    vendors: data?.data || [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
    createVendor: createVendor.mutate,
    updateVendor: updateVendor.mutate,
    deleteVendor: deleteVendor.mutate,
    isCreating: createVendor.isPending,
    isUpdating: updateVendor.isPending,
    isDeleting: deleteVendor.isPending,
  };
};
```

---

## 📝 Type System

### Core Types

```typescript
// src/types/vendor/index.ts

/**
 * Base Vendor interface aligned dengan backend API
 */
export interface Vendor {
  // Primary Fields
  id: string;
  uuid: string;
  tenant_id: string;
  
  // Company Information
  name: string;
  code: string;
  company_name?: string;
  email: string;
  phone?: string;
  
  // Location
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  
  // Business Details
  npwp?: string;
  tax_id?: string;
  website?: string;
  
  // Status & Classification
  status: VendorStatus;
  quality_tier?: QualityTier;
  company_size?: CompanySize;
  
  // Performance Metrics
  rating?: number;
  total_orders?: number;
  total_value?: number;
  completion_rate?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export type VendorStatus = 
  | 'active' 
  | 'inactive' 
  | 'suspended' 
  | 'on_hold' 
  | 'blacklisted';

export type QualityTier = 'standard' | 'premium' | 'exclusive';

export type CompanySize = 'small' | 'medium' | 'large';

/**
 * Vendor creation request
 */
export interface CreateVendorRequest {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  status?: VendorStatus;
}

/**
 * Vendor update request
 */
export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  id: string;
}

/**
 * Vendor filters untuk query
 */
export interface VendorFilters {
  page?: number;
  per_page?: number;
  status?: VendorStatus;
  search?: string;
  min_rating?: number;
  company_size?: CompanySize;
}
```

### Zod Schemas

```typescript
// src/schemas/vendor.schema.ts

import { z } from 'zod';

export const vendorStatusSchema = z.enum([
  'active',
  'inactive',
  'suspended',
  'on_hold',
  'blacklisted',
]);

export const vendorSchema = z.object({
  id: z.string(),
  uuid: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  status: vendorStatusSchema,
  rating: z.number().min(0).max(5).optional(),
  total_orders: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  city: z.string().optional(),
  status: vendorStatusSchema.default('active'),
});
```

---

## ➕ Adding New Features

### Example: Adding "Vendor Certificate" Feature

**Step 1: Define Types**

```typescript
// src/types/vendor/index.ts
export interface VendorCertificate {
  id: string;
  vendor_id: string;
  certificate_name: string;
  certificate_number: string;
  issued_date: string;
  expiry_date: string;
  file_url?: string;
}
```

**Step 2: Create API Service**

```typescript
// src/services/api/vendors.ts
export const vendorsService = {
  // ... existing methods
  
  async getVendorCertificates(vendorId: string) {
    const response = await tenantApiClient.get(
      `/vendors/${vendorId}/certificates`
    );
    return response.data;
  },
  
  async uploadCertificate(vendorId: string, certificate: FormData) {
    const response = await tenantApiClient.post(
      `/vendors/${vendorId}/certificates`,
      certificate,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },
};
```

**Step 3: Create Hook**

```typescript
// src/hooks/useVendors.ts
export const useVendorCertificates = (vendorId: string) => {
  return useQuery({
    queryKey: ['vendor-certificates', vendorId],
    queryFn: () => vendorsService.getVendorCertificates(vendorId),
  });
};
```

**Step 4: Update UI**

```typescript
// src/pages/admin/vendors/VendorDetail.tsx
const { data: certificates } = useVendorCertificates(vendor.id);

return (
  <div>
    <h3>Certificates</h3>
    {certificates?.map((cert) => (
      <CertificateCard key={cert.id} certificate={cert} />
    ))}
  </div>
);
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// tests/unit/services/vendors.test.ts
import { describe, it, expect, vi } from 'vitest';
import { vendorsService } from '@/services/api/vendors';
import { tenantApiClient } from '@/services/api/tenantApiClient';

describe('Vendor Service', () => {
  it('should fetch vendors', async () => {
    vi.spyOn(tenantApiClient, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: '1', name: 'Test Vendor', email: 'test@test.com' }],
        meta: { total: 1 },
      },
    });

    const result = await vendorsService.getVendors();
    
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Test Vendor');
  });
});
```

### Integration Tests

```typescript
// tests/integration/vendors/crud.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVendors } from '@/hooks/useVendors';

describe('Vendor CRUD Integration', () => {
  it('should create and fetch vendor', async () => {
    const { result } = renderHook(() => useVendors());

    // Create vendor
    await result.current.createVendor({
      name: 'Integration Test Vendor',
      email: 'integration@test.com',
    });

    // Fetch vendors
    await waitFor(() => {
      expect(result.current.vendors).toContainEqual(
        expect.objectContaining({
          name: 'Integration Test Vendor',
        })
      );
    });
  });
});
```

---

## ⚡ Performance Considerations

### 1. Virtual Scrolling

```typescript
// Use @tanstack/react-virtual for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualVendorList = ({ vendors }: { vendors: Vendor[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: vendors.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // estimated row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <VendorRow
            key={virtualRow.index}
            vendor={vendors[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### 2. Debounced Search

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebouncedValue(searchTerm, 300);

const { vendors } = useVendors({ search: debouncedSearch });
```

### 3. React Query Caching

```typescript
// Cache vendor list for 5 minutes
useQuery({
  queryKey: ['vendors'],
  queryFn: vendorsService.getVendors,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

---

## ⚠️ Common Pitfalls

### ❌ DON'T: Call API Directly in Components

```typescript
// BAD
const VendorDatabase = () => {
  const [vendors, setVendors] = useState([]);
  
  useEffect(() => {
    fetch('/api/v1/vendors').then(r => r.json()).then(setVendors);
  }, []);
};
```

### ✅ DO: Use Hooks and Services

```typescript
// GOOD
const VendorDatabase = () => {
  const { vendors, isLoading } = useVendors();
};
```

### ❌ DON'T: Hardcode Business Logic in Frontend

```typescript
// BAD
const companySize = vendor.total_orders > 100 ? 'large' : 'small';
```

### ✅ DO: Fetch from Backend Configuration

```typescript
// GOOD
const companySize = vendor.company_size; // Backend calculates this
```

### ❌ DON'T: Skip Error Handling

```typescript
// BAD
await vendorsService.createVendor(data);
toast.success('Created!');
```

### ✅ DO: Use Centralized Error Handler

```typescript
// GOOD
try {
  await vendorsService.createVendor(data);
  toast.success('Vendor created successfully');
} catch (error) {
  const apiError = handleApiError(error);
  displayError(apiError);
}
```

---

## 🔒 Security Considerations

1. **Input Validation**: Always validate user input dengan Zod schemas
2. **XSS Prevention**: React automatically escapes output
3. **CSRF Protection**: Laravel handles CSRF tokens
4. **Tenant Isolation**: Backend enforces tenant_id scoping
5. **Permission Checks**: Check permissions di frontend dan backend

---

## 📚 Additional Resources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Validation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Laravel API Resources](https://laravel.com/docs/10.x/eloquent-resources)

---

## 📄 Changelog

### Version 1.0 (December 17, 2025)
- Initial developer documentation
- Architecture overview
- Complete API integration guide
- Testing strategy
- Performance optimization tips
