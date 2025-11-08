# 🔌 PHASE 2 API EXAMPLES

**Complete API Contracts & Integration Examples**

> **Version**: 1.0  
> **Status**: ✅ API Specification Complete  
> **Base URL**: `https://api.stencil.com/v1` (production)  
> **Authentication**: Laravel Sanctum Bearer Tokens

---

## 📋 TABLE OF CONTENTS

1. [Response Format Standards](#response-format-standards)
2. [Menu Management APIs](#menu-management-apis)
3. [Package Management APIs](#package-management-apis)
4. [License Management APIs](#license-management-apis)
5. [Dynamic Content Editor APIs](#dynamic-content-editor-apis)
6. [Frontend Integration Examples](#frontend-integration-examples)

---

## RESPONSE FORMAT STANDARDS

### Success Response

```json
{
  "success": true,
  "data": { },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2025-11-08T01:30:00Z",
    "version": "1.0.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "title": ["The title field is required"],
      "slug": ["The slug has already been taken"]
    }
  },
  "meta": {
    "timestamp": "2025-11-08T01:30:00Z",
    "version": "1.0.0"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7,
    "from": 1,
    "to": 15
  }
}
```

---

## MENU MANAGEMENT APIs

### 1. List All Menus

**Endpoint**: `GET /api/v1/admin/menus`

**Headers**:
```
Authorization: Bearer {token}
Accept: application/json
```

**Query Parameters**:
```
?type=admin          # Filter by type (admin, public)
?location=admin_sidebar  # Filter by location
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "name": "Admin Sidebar",
      "location": "admin_sidebar",
      "type": "admin",
      "settings": {},
      "items_count": 12,
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-11-07T14:30:00Z"
    },
    {
      "id": 2,
      "name": "Public Header",
      "location": "header",
      "type": "public",
      "settings": {},
      "items_count": 5,
      "created_at": "2025-10-01T10:00:00Z",
      "updated_at": "2025-11-05T09:15:00Z"
    }
  ]
}
```

### 2. Get Menu with Items (Hierarchical Tree)

**Endpoint**: `GET /api/v1/admin/menus/{menuId}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Admin Sidebar",
    "location": "admin_sidebar",
    "type": "admin",
    "items": [
      {
        "id": 1,
        "menu_id": 1,
        "parent_id": null,
        "title": "Dashboard",
        "url": "/admin/dashboard",
        "type": "internal",
        "target": "_self",
        "icon": "Home",
        "order_index": 0,
        "permissions": {},
        "is_active": true,
        "children": []
      },
      {
        "id": 2,
        "parent_id": null,
        "title": "Products",
        "url": "/admin/products",
        "type": "internal",
        "icon": "Package",
        "order_index": 1,
        "permissions": {
          "roles": ["admin", "manager"],
          "permissions": ["view_products"]
        },
        "is_active": true,
        "children": [
          {
            "id": 3,
            "parent_id": 2,
            "title": "All Products",
            "url": "/admin/products",
            "type": "internal",
            "icon": "List",
            "order_index": 0,
            "permissions": {},
            "is_active": true,
            "children": []
          },
          {
            "id": 4,
            "parent_id": 2,
            "title": "Add New",
            "url": "/admin/products/create",
            "type": "internal",
            "icon": "Plus",
            "order_index": 1,
            "permissions": {
              "permissions": ["create_products"]
            },
            "is_active": true,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 3. Create Menu

**Endpoint**: `POST /api/v1/admin/menus`

**Request Body**:
```json
{
  "name": "Footer Menu",
  "location": "footer",
  "type": "public",
  "settings": {}
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 3,
    "tenant_id": 1,
    "name": "Footer Menu",
    "location": "footer",
    "type": "public",
    "settings": {},
    "created_at": "2025-11-08T01:30:00Z"
  },
  "message": "Menu created successfully"
}
```

**Validation Errors** (422 Unprocessable Entity):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "location": ["A menu already exists for this location"]
    }
  }
}
```

### 4. Add Menu Item

**Endpoint**: `POST /api/v1/admin/menus/{menuId}/items`

**Request Body**:
```json
{
  "parent_id": null,
  "title": "Orders",
  "url": "/admin/orders",
  "type": "internal",
  "target": "_self",
  "icon": "ShoppingCart",
  "permissions": {
    "roles": ["admin", "manager"],
    "permissions": ["view_orders"]
  },
  "is_active": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 10,
    "menu_id": 1,
    "parent_id": null,
    "title": "Orders",
    "url": "/admin/orders",
    "type": "internal",
    "target": "_self",
    "icon": "ShoppingCart",
    "order_index": 3,
    "permissions": {
      "roles": ["admin", "manager"],
      "permissions": ["view_orders"]
    },
    "is_active": true,
    "created_at": "2025-11-08T01:35:00Z"
  },
  "message": "Menu item created successfully"
}
```

### 5. Reorder Menu Items (Bulk Update)

**Endpoint**: `PUT /api/v1/admin/menus/{menuId}/items/reorder`

**Request Body**:
```json
{
  "items": [
    {"id": 1, "order_index": 0, "parent_id": null},
    {"id": 2, "order_index": 1, "parent_id": null},
    {"id": 3, "order_index": 0, "parent_id": 2},
    {"id": 4, "order_index": 1, "parent_id": 2},
    {"id": 10, "order_index": 2, "parent_id": null}
  ]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Menu items reordered successfully",
  "data": {
    "updated_count": 5
  }
}
```

### 6. Get Public Menu (Frontend)

**Endpoint**: `GET /api/v1/menus/location/{location}`

**Example**: `GET /api/v1/menus/location/header`

**Headers**: No authentication required

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "location": "header",
    "items": [
      {
        "id": 20,
        "title": "Home",
        "url": "/",
        "children": []
      },
      {
        "id": 21,
        "title": "Products",
        "url": "/products",
        "children": [
          {
            "id": 22,
            "title": "Etching",
            "url": "/products/etching"
          },
          {
            "id": 23,
            "title": "Laser Cutting",
            "url": "/products/laser-cutting"
          }
        ]
      },
      {
        "id": 24,
        "title": "About",
        "url": "/about",
        "children": []
      }
    ]
  }
}
```

**Note**: This endpoint returns only items visible to the current user (permission-filtered).

---

## PACKAGE MANAGEMENT APIs

### 1. Browse Marketplace

**Endpoint**: `GET /api/v1/marketplace/packages`

**Query Parameters**:
```
?category=business-module
?search=finance
?is_official=true
?sort=popular (popular, newest, rating)
?page=1
&per_page=12
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "slug": "finance-reporting",
      "name": "Finance & Reporting",
      "description": "Comprehensive financial reporting and analytics",
      "category": "business-module",
      "version": "1.2.0",
      "author": "CanvaStack",
      "homepage_url": "https://packages.stencil.com/finance-reporting",
      "requires_license": true,
      "is_official": true,
      "download_count": 1250,
      "rating": 4.8,
      "price": "$49/month",
      "metadata": {
        "screenshots": ["/screenshots/finance-1.jpg"],
        "tags": ["finance", "reporting", "analytics"]
      },
      "created_at": "2025-09-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 12,
    "total": 45,
    "last_page": 4
  }
}
```

### 2. Get Package Details

**Endpoint**: `GET /api/v1/marketplace/packages/{slug}`

**Example**: `GET /api/v1/marketplace/packages/finance-reporting`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "slug": "finance-reporting",
    "name": "Finance & Reporting",
    "description": "Full financial management module...",
    "long_description": "Markdown content here...",
    "category": "business-module",
    "current_version": "1.2.0",
    "author": "CanvaStack",
    "homepage_url": "https://packages.stencil.com/finance-reporting",
    "documentation_url": "https://docs.stencil.com/packages/finance-reporting",
    "requires_license": true,
    "is_official": true,
    "download_count": 1250,
    "rating": 4.8,
    "reviews_count": 43,
    "price": "$49/month",
    "metadata": {
      "screenshots": [
        "/screenshots/finance-1.jpg",
        "/screenshots/finance-2.jpg"
      ],
      "features": [
        "Profit & Loss Reports",
        "Revenue Tracking",
        "Expense Management"
      ],
      "compatibility": ["stencil 2.0+"],
      "dependencies": []
    },
    "versions": [
      {
        "version": "1.2.0",
        "changelog": "- Added budget tracking\n- Fixed report export bug",
        "released_at": "2025-10-15T00:00:00Z"
      },
      {
        "version": "1.1.0",
        "changelog": "- Added expense categorization",
        "released_at": "2025-09-20T00:00:00Z"
      }
    ]
  }
}
```

### 3. Install Package

**Endpoint**: `POST /api/v1/admin/packages/install`

**Request Body**:
```json
{
  "slug": "finance-reporting",
  "version": "1.2.0"
}
```

**Response** (202 Accepted - Async Job):
```json
{
  "success": true,
  "data": {
    "job_id": "pkg-install-abc123",
    "status": "queued",
    "estimated_time": "2 minutes"
  },
  "message": "Package installation started. You will be notified when complete."
}
```

**Check Installation Status**:

**Endpoint**: `GET /api/v1/admin/packages/install/{jobId}/status`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "job_id": "pkg-install-abc123",
    "status": "completed",
    "progress": 100,
    "steps_completed": [
      "Downloaded package",
      "Verified checksum",
      "Extracted files",
      "Ran migrations",
      "Registered hooks",
      "Activated package"
    ],
    "completed_at": "2025-11-08T01:42:00Z"
  }
}
```

**Installation Failed**:
```json
{
  "success": false,
  "data": {
    "job_id": "pkg-install-abc123",
    "status": "failed",
    "progress": 60,
    "error": "Migration failed: Table 'finance_categories' already exists",
    "rollback_completed": true
  },
  "message": "Package installation failed and has been rolled back"
}
```

### 4. List Installed Packages

**Endpoint**: `GET /api/v1/admin/packages/installed`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "tenant_id": 1,
      "package_id": 1,
      "package_slug": "finance-reporting",
      "package_name": "Finance & Reporting",
      "version": "1.2.0",
      "status": "active",
      "installed_at": "2025-11-01T10:00:00Z",
      "updated_at": "2025-11-01T10:00:00Z",
      "settings": {
        "currency": "USD",
        "fiscal_year_start": "01-01"
      },
      "license_key": "AG7K-PLM2-98NX-****",
      "license_status": "active",
      "license_expires_at": "2026-11-01T00:00:00Z",
      "update_available": true,
      "latest_version": "1.3.0"
    }
  ]
}
```

### 5. Update Package

**Endpoint**: `POST /api/v1/admin/packages/{slug}/update`

**Request Body**:
```json
{
  "version": "1.3.0"
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "data": {
    "job_id": "pkg-update-xyz456",
    "status": "queued"
  },
  "message": "Package update started"
}
```

### 6. Uninstall Package

**Endpoint**: `DELETE /api/v1/admin/packages/{slug}`

**Request Body**:
```json
{
  "delete_data": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Package uninstalled successfully. Data has been preserved."
}
```

---

## LICENSE MANAGEMENT APIs

### 1. Activate License

**Endpoint**: `POST /api/v1/licenses/activate`

**Request Body**:
```json
{
  "license_key": "AG7K-PLM2-98NX-4TBQ",
  "package_slug": "finance-reporting"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "license_id": 10,
    "license_key": "AG7K-PLM2-98NX-****",
    "package_slug": "finance-reporting",
    "type": "per-tenant",
    "max_activations": 1,
    "current_activations": 1,
    "expires_at": "2026-11-08T00:00:00Z",
    "activated_at": "2025-11-08T01:45:00Z"
  },
  "message": "License activated successfully"
}
```

**Errors**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_LICENSE",
    "message": "The license key is invalid or has expired"
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "MAX_ACTIVATIONS_REACHED",
    "message": "This license has reached its maximum number of activations (1/1)"
  }
}
```

### 2. Validate License

**Endpoint**: `POST /api/v1/licenses/validate`

**Request Body**:
```json
{
  "license_key": "AG7K-PLM2-98NX-4TBQ",
  "package_slug": "finance-reporting"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "status": "active",
    "expires_at": "2026-11-08T00:00:00Z",
    "days_until_expiration": 365
  }
}
```

**Expired License**:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "status": "expired",
    "expired_at": "2025-10-01T00:00:00Z",
    "days_since_expiration": 38
  }
}
```

### 3. List My Licenses

**Endpoint**: `GET /api/v1/admin/licenses`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "license_id": 10,
      "license_key": "AG7K-PLM2-98NX-****",
      "package_name": "Finance & Reporting",
      "type": "per-tenant",
      "status": "active",
      "activated_at": "2025-11-08T01:45:00Z",
      "expires_at": "2026-11-08T00:00:00Z",
      "activations": [
        {
          "activated_at": "2025-11-08T01:45:00Z",
          "last_verified_at": "2025-11-08T02:00:00Z",
          "ip_address": "192.168.1.100"
        }
      ]
    }
  ]
}
```

---

## DYNAMIC CONTENT EDITOR APIs

### 1. List Pages

**Endpoint**: `GET /api/v1/admin/pages`

**Query Parameters**:
```
?status=published
?search=about
&page=1
&per_page=15
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "title": "About Us",
      "slug": "about-us",
      "status": "published",
      "template_id": null,
      "published_at": "2025-11-05T10:00:00Z",
      "created_at": "2025-11-01T09:00:00Z",
      "updated_at": "2025-11-05T09:55:00Z",
      "author": {
        "id": 1,
        "name": "Admin User"
      },
      "revisions_count": 5
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 15,
    "total": 12
  }
}
```

### 2. Get Page (for Editing)

**Endpoint**: `GET /api/v1/admin/pages/{id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "About Us",
    "slug": "about-us",
    "content": {
      "html": "<div class='gjs-row'>...</div>",
      "css": ".gjs-row { display: flex; }",
      "components": [],
      "styles": []
    },
    "template_id": null,
    "status": "published",
    "published_at": "2025-11-05T10:00:00Z",
    "seo": {
      "meta_title": "About Us - Stencil",
      "meta_description": "Learn more about our company",
      "meta_keywords": "about, company",
      "og_image": "/images/og-about.jpg"
    },
    "created_at": "2025-11-01T09:00:00Z",
    "updated_at": "2025-11-05T09:55:00Z"
  }
}
```

### 3. Create Page

**Endpoint**: `POST /api/v1/admin/pages`

**Request Body**:
```json
{
  "title": "Contact Us",
  "slug": "contact-us",
  "content": {
    "html": "",
    "css": ""
  },
  "template_id": 3,
  "status": "draft"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Contact Us",
    "slug": "contact-us",
    "status": "draft",
    "created_at": "2025-11-08T02:00:00Z"
  },
  "message": "Page created successfully"
}
```

### 4. Update Page Content

**Endpoint**: `PUT /api/v1/admin/pages/{id}`

**Request Body**:
```json
{
  "title": "Contact Us",
  "content": {
    "html": "<div class='gjs-row'>...</div>",
    "css": ".gjs-row { display: flex; }"
  },
  "seo": {
    "meta_title": "Contact Us - Stencil",
    "meta_description": "Get in touch with us"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Contact Us",
    "updated_at": "2025-11-08T02:10:00Z"
  },
  "message": "Page updated successfully. New revision created."
}
```

### 5. Publish Page

**Endpoint**: `POST /api/v1/admin/pages/{id}/publish`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 5,
    "status": "published",
    "published_at": "2025-11-08T02:15:00Z",
    "public_url": "https://tenant1.stencil.com/contact-us"
  },
  "message": "Page published successfully"
}
```

### 6. Get Page Revisions

**Endpoint**: `GET /api/v1/admin/pages/{id}/revisions`

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "page_id": 5,
      "content": {},
      "created_by": {
        "id": 1,
        "name": "Admin User"
      },
      "created_at": "2025-11-08T02:10:00Z"
    },
    {
      "id": 9,
      "page_id": 5,
      "content": {},
      "created_by": {
        "id": 1,
        "name": "Admin User"
      },
      "created_at": "2025-11-08T02:05:00Z"
    }
  ]
}
```

### 7. Restore Revision

**Endpoint**: `POST /api/v1/admin/pages/{id}/revisions/{revisionId}/restore`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Revision restored successfully. A new revision has been created."
}
```

### 8. Get Public Page (Frontend)

**Endpoint**: `GET /api/v1/pages/{slug}`

**Example**: `GET /api/v1/pages/about-us`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "title": "About Us",
    "slug": "about-us",
    "content": {
      "html": "<div class='gjs-row'>...</div>",
      "css": ".gjs-row { display: flex; }"
    },
    "seo": {
      "meta_title": "About Us - Stencil",
      "meta_description": "Learn more about our company",
      "og_image": "/images/og-about.jpg"
    },
    "published_at": "2025-11-05T10:00:00Z"
  }
}
```

---

## FRONTEND INTEGRATION EXAMPLES

### React Query + Axios Setup

**API Client** (`src/lib/api/client.ts`):
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.stencil.com/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

export default apiClient;
```

### Menu Management Hooks

**useMenus Hook** (`src/features/menu/hooks/useMenus.ts`):
```typescript
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface Menu {
  id: number;
  name: string;
  location: string;
  type: string;
  items_count: number;
}

export const useMenus = () => {
  return useQuery<Menu[]>({
    queryKey: ['menus'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/menus');
      return data.data;
    },
  });
};
```

**useCreateMenuItem Hook**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

interface CreateMenuItemData {
  parent_id: number | null;
  title: string;
  url: string;
  type: string;
  icon: string;
  permissions: {
    roles?: string[];
    permissions?: string[];
  };
}

export const useCreateMenuItem = (menuId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMenuItemData) => {
      const response = await apiClient.post(`/admin/menus/${menuId}/items`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', menuId] });
    },
  });
};
```

**MenuEditor Component**:
```tsx
import { useMenu, useReorderMenuItems } from '../hooks';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export const MenuEditor: React.FC<{ menuId: number }> = ({ menuId }) => {
  const { data: menu, isLoading } = useMenu(menuId);
  const reorderMutation = useReorderMenuItems(menuId);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = reorder(menu.items, result.source.index, result.destination.index);
    
    reorderMutation.mutate({
      items: reorderedItems.map((item, index) => ({
        id: item.id,
        order_index: index,
        parent_id: item.parent_id,
      })),
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="menu-items">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {menu.items.map((item, index) => (
              <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {item.title}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### Package Installation Component

**PackageInstaller Component**:
```tsx
import { useState } from 'react';
import { useInstallPackage } from '../hooks';

export const PackageInstaller: React.FC<{ packageSlug: string }> = ({ packageSlug }) => {
  const [jobId, setJobId] = useState<string | null>(null);
  const installMutation = useInstallPackage();

  const handleInstall = async () => {
    const result = await installMutation.mutateAsync({ slug: packageSlug, version: 'latest' });
    setJobId(result.data.job_id);
  };

  return (
    <div>
      <button onClick={handleInstall} disabled={installMutation.isPending}>
        {installMutation.isPending ? 'Installing...' : 'Install Package'}
      </button>
      
      {jobId && <InstallationProgress jobId={jobId} />}
    </div>
  );
};
```

---

**Document Version:** 1.0  
**Created:** November 2025  
**Status:** ✅ API Specification Complete

**Related Documents:**
- `PHASE2_FEATURES_SPECIFICATION.md` - Feature requirements
- `PHASE2_STRUCTURE.md` - Architecture reference
- OpenAPI 3.0 spec: `docs/api/openapi-phase2.yaml`

---

**END OF PHASE 2 API EXAMPLES**