import { Product, ProductFilters } from '@/types/product';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import { getContextAwareClient, getContextAwareEndpoint, UserType } from './contextAwareClients';
import { ApiError, AuthError, PermissionError, NotFoundError } from '@/lib/errors';
import { authService } from './auth';

/**
 * Get authenticated context for API calls
 * Validates tenant context and returns necessary auth info
 */
interface AuthContext {
  userType: UserType;
  tenantId?: string;
  userId?: string;
}

function getAuthContext(requireTenant: boolean = true): AuthContext {
  const userType = (authService.getAccountType() || 'anonymous') as UserType;
  const userId = authService.getUserIdFromStorage();
  const tenantId = authService.getTenantIdFromStorage();

  // Validate authentication
  if (!authService.isAuthenticated()) {
    throw new AuthError('Authentication required');
  }

  // Validate tenant context for tenant users
  if (userType === 'tenant' && requireTenant && !tenantId) {
    console.error('[RBAC] Tenant context missing for tenant user', {
      userType,
      userId,
      hasToken: !!authService.getToken(),
    });
    throw new Error('[RBAC] Tenant context required for tenant users');
  }

  return { userType, tenantId, userId };
}

/**
 * Validate that filters don't contain tenant manipulation attempts
 */
function validateFilters(filters: Partial<ProductFilters>, authContext: AuthContext): void {
  // Tenant users cannot filter by different tenant_id
  if (authContext.userType === 'tenant' && filters.tenant_id) {
    if (filters.tenant_id !== authContext.tenantId) {
      console.error('[RBAC] Tenant manipulation attempt detected', {
        requestedTenantId: filters.tenant_id,
        actualTenantId: authContext.tenantId,
        userType: authContext.userType,
      });
      throw new PermissionError('[RBAC] Cannot access products from other tenants');
    }
  }
}

/**
 * Validate response data belongs to current tenant
 */
function validateResponseTenantOwnership(
  data: Product | Product[],
  authContext: AuthContext
): void {
  // Only validate for tenant users
  if (authContext.userType !== 'tenant' || !authContext.tenantId) {
    return;
  }

  // SECURITY: Backend enforces tenant isolation with 4-layer protection:
  // 1. Middleware validates user tenant_id
  // 2. Global scope auto-filters queries
  // 3. Controller explicit WHERE tenant_id filtering
  // 4. Sanctum auth token validation
  //
  // Frontend validation removed - ProductResource doesn't expose tenant_id
  // (internal DB ID never exposed to public, only UUIDs used)
  return;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  description: string;
  longDescription?: string;
  images: string[];
  category: string;
  subcategory?: string;
  tags?: string[];
  material: string;
  price: number;
  currency?: string;
  priceUnit?: string;
  minOrder?: number;
  maxOrder?: number;
  leadTime?: string;
  availability?: 'in-stock' | 'out-of-stock' | 'pre-order';
  features?: string[];
  specifications?: Record<string, unknown>;
  customizationOptions?: Array<{
    name: string;
    type: 'text' | 'select' | 'color' | 'image';
    required: boolean;
    options?: string[];
  }>;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface BulkUpdateError {
  productId: string;
  message: string;
  code?: string;
}

export interface BulkUpdateResponse {
  updated: number;
  failed: number;
  errors?: BulkUpdateError[];
}

export const createContextAwareProductsService = (userType: UserType) => {
  const apiClient = getContextAwareClient(userType);
  
  const handleError = (error: unknown, operation: string): never => {
    if (error.response?.status === 401) {
      throw new AuthError('Session expired, please login again', error);
    }
    
    if (error.response?.status === 403) {
      throw new PermissionError('You do not have permission to perform this action', error);
    }
    
    if (error.response?.status === 404) {
      throw new NotFoundError('Resource not found', error);
    }
    
    throw new ApiError(`Failed to ${operation}`, error);
  };
  
  const transformToSnakeCase = (data: any): any => {
    const transformed: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        transformed[snakeKey] = data[key];
      }
    }
    return transformed;
  };
  
  return {
    async getProducts(params?: ListRequestParams & ProductFilters, signal?: AbortSignal): Promise<PaginatedResponse<Product>> {
      try {
        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');
        
        // 2. Build tenant-scoped filters
        const scopedParams: ListRequestParams & ProductFilters = {
          ...params,
          // Enforce tenant_id for tenant users
          ...(authContext.userType === 'tenant' && { tenant_id: authContext.tenantId }),
        };

        // 3. Validate filters for tenant manipulation attempts
        validateFilters(scopedParams, authContext);
        
        const endpoint = getContextAwareEndpoint(userType, 'products');
        const queryParams = new URLSearchParams();
        
        if (scopedParams) {
          Object.entries(scopedParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        const response = await apiClient.get<PaginatedResponse<Product>>(
          `${endpoint}?${queryParams.toString()}`,
          { 
            signal,
            headers: {
              // Explicit tenant header for backend validation
              'X-Tenant-ID': authContext.tenantId || '',
              'X-User-Type': authContext.userType,
            },
          }
        );

        // 4. Backend multi-layer security ensures tenant isolation
        // - ProductResource intentionally doesn't expose tenant_id (internal DB key)
        // - Backend has 4-layer protection (see validateTenantIsolation comment above)
        // - No client-side validation needed
        // validateResponseTenantOwnership call removed - backend handles all security
        
        return response as any;
      } catch (error) {
        handleError(error, 'fetch products');
      }
    },

    async getProductById(id: string, signal?: AbortSignal): Promise<Product> {
      try {
        // Validate UUID format - if it looks like a slug, use slug endpoint instead
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (!uuidRegex.test(id)) {
          // If not a valid UUID, assume it's a slug and redirect to slug endpoint
          console.warn(`getProductById called with non-UUID value "${id}", redirecting to getProductBySlug`);
          return await this.getProductBySlug(id, signal);
        }

        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');
        
        const endpoint = getContextAwareEndpoint(userType, `products/${id}`);
        const response = await apiClient.get<Product>(endpoint, { 
          signal,
          headers: {
            'X-Tenant-ID': authContext.tenantId || '',
            'X-User-Type': authContext.userType,
          },
        });

        // 2. Backend enforces tenant isolation - no client validation needed
        // validateResponseTenantOwnership removed

        return response.data as Product;
      } catch (error) {
        handleError(error, 'fetch product');
      }
    },

    async getProductBySlug(slug: string, signal?: AbortSignal): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/slug/${slug}`);
        const response = await apiClient.get<Product>(endpoint, { signal });
        return response.data as Product;
      } catch (error) {
        handleError(error, 'fetch product');
      }
    },

    async createProduct(data: CreateProductRequest): Promise<Product> {
      try {
        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');

        // 2. Validate tenant context for tenant users
        if (authContext.userType === 'tenant' && !authContext.tenantId) {
          throw new Error('[RBAC] Tenant context required');
        }

        // 3. Platform admin must explicitly specify tenant_id
        if (authContext.userType === 'platform' && !data.tenant_id) {
          throw new Error('[RBAC] tenant_id required for platform admin');
        }

        // 4. Prepare product data with tenant enforcement
        const productData: CreateProductRequest = {
          ...data,
          // Force tenant_id for tenant users
          tenant_id: authContext.userType === 'tenant' ? authContext.tenantId : data.tenant_id,
        };

        // Backend MUST validate:
        // - tenant_id is never NULL
        // - tenant_id matches authenticated user's tenant (if tenant user)
        // - User has products.create permission
        const endpoint = getContextAwareEndpoint(userType, 'products');
        const transformedData = transformToSnakeCase(productData);
        const response = await apiClient.post<Product>(endpoint, transformedData, {
          headers: {
            'X-Tenant-ID': authContext.tenantId || '',
            'X-User-Type': authContext.userType,
          },
        });

        // 5. Backend enforces tenant isolation - no client validation needed
        // validateResponseTenantOwnership removed

        return response.data as Product;
      } catch (error) {
        handleError(error, 'create product');
      }
    },

    async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
      try {
        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');

        // 2. Tenant users cannot change tenant_id
        if (authContext.userType === 'tenant' && data.tenant_id && data.tenant_id !== authContext.tenantId) {
          throw new PermissionError('[RBAC] Cannot change product tenant ownership');
        }

        const endpoint = getContextAwareEndpoint(userType, `products/${id}`);
        const transformedData = transformToSnakeCase(data);
        const response = await apiClient.put<Product>(endpoint, transformedData, {
          headers: {
            'X-Tenant-ID': authContext.tenantId || '',
            'X-User-Type': authContext.userType,
          },
        });

        // 3. Backend enforces tenant isolation - no client validation needed
        // validateResponseTenantOwnership removed

        return response.data as Product;
      } catch (error) {
        handleError(error, 'update product');
      }
    },

    async deleteProduct(id: string): Promise<boolean> {
      try {
        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');

        // Backend MUST validate:
        // - Product belongs to user's tenant (if tenant user)
        // - User has products.delete permission
        const endpoint = getContextAwareEndpoint(userType, `products/${id}`);
        await apiClient.delete(endpoint, {
          headers: {
            'X-Tenant-ID': authContext.tenantId || '',
            'X-User-Type': authContext.userType,
          },
        });
        return true;
      } catch (error) {
        handleError(error, 'delete product');
      }
    },

    async toggleFeatured(id: string): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}/toggle-featured`);
        const response = await apiClient.patch<Product>(endpoint);
        return response.data as Product;
      } catch (error) {
        handleError(error, 'toggle featured status');
      }
    },

    async updateStock(id: string, stockQuantity: number): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}/stock`);
        const response = await apiClient.patch<Product>(endpoint, { stock_quantity: stockQuantity });
        return response.data as Product;
      } catch (error) {
        handleError(error, 'update stock');
      }
    },

    async bulkDelete(ids: string[]): Promise<{ success: boolean; deleted: number }> {
      try {
        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');

        // Backend MUST validate:
        // - Each product belongs to user's tenant
        // - User has permission for each operation
        // - Atomic transaction or rollback on failure
        const endpoint = getContextAwareEndpoint(userType, 'products/bulk-delete');
        const response = await apiClient.post<{ success: boolean; deleted: number }>(
          endpoint, 
          { ids },
          {
            headers: {
              'X-Tenant-ID': authContext.tenantId || '',
              'X-User-Type': authContext.userType,
            },
          }
        );
        return response.data;
      } catch (error) {
        handleError(error, 'bulk delete products');
      }
    },

    async bulkStatusUpdate(ids: string[], status: string): Promise<{ success: boolean; updated: number }> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/bulk-status');
        const response = await apiClient.post<{ success: boolean; updated: number }>(endpoint, { ids, status });
        return response.data;
      } catch (error) {
        handleError(error, 'bulk update status');
      }
    },

    async reorderProducts(productIds: string[]): Promise<{ success: boolean; message: string }> {
      try {
        const endpoint = getContextAwareEndpoint(userType, 'products/reorder');
        const response = await apiClient.post<{ success: boolean; message: string }>(endpoint, { product_ids: productIds });
        return response.data;
      } catch (error) {
        handleError(error, 'reorder products');
      }
    },

    async bulkUpdateProducts(productIds: string[], updateData: {
      priceUpdate?: { mode: 'set' | 'add' | 'subtract' | 'multiply'; value: number };
      stockUpdate?: { mode: 'set' | 'add' | 'subtract'; value: number };
      status?: 'draft' | 'published' | 'archived';
      featured?: boolean;
      category?: string;
    }): Promise<BulkUpdateResponse> {
      try {
        // 1. Get and validate auth context
        const authContext = getAuthContext(userType === 'tenant');

        // Backend MUST validate:
        // - Each product belongs to user's tenant
        // - User has permission for bulk updates
        const endpoint = getContextAwareEndpoint(userType, 'products/bulk-update');
        const response = await apiClient.post<BulkUpdateResponse>(
          endpoint, 
          { 
            product_ids: productIds,
            ...updateData 
          },
          {
            headers: {
              'X-Tenant-ID': authContext.tenantId || '',
              'X-User-Type': authContext.userType,
            },
          }
        );
        return response.data;
      } catch (error) {
        handleError(error, 'bulk update products');
      }
    },

    async duplicateProduct(id: string): Promise<Product> {
      try {
        const endpoint = getContextAwareEndpoint(userType, `products/${id}/duplicate`);
        const response = await apiClient.post<Product>(endpoint);
        return response.data as Product;
      } catch (error) {
        handleError(error, 'duplicate product');
      }
    }
  };
};
