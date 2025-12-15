import { tenantApiClient } from './base';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  module: string;
  action: string;
  resource: string;
  isSystem?: boolean;
}

export interface Role {
  id: string;
  uuid: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem?: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  lastModified?: string;
}

export interface RoleFilters {
  search?: string;
  permissions?: string[];
  isSystem?: boolean;
  page?: number;
  perPage?: number;
}

export interface RoleResponse {
  data: Role[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PermissionResponse {
  data: Permission[];
  categories: Record<string, Permission[]>;
  total: number;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleStatsResponse {
  totalRoles: number;
  systemRoles: number;
  customRoles: number;
  totalPermissions: number;
  mostUsedPermissions: Array<{ permission: string; count: number }>;
  roleUsage: Record<string, number>;
}

export const roleManagementService = {
  /**
   * Get all roles with filtering and pagination
   */
  getRoles: async (filters: RoleFilters = {}): Promise<RoleResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.permissions && filters.permissions.length > 0) {
        params.append('permissions', filters.permissions.join(','));
      }
      if (filters.isSystem !== undefined) {
        params.append('is_system', filters.isSystem.toString());
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.perPage) {
        params.append('per_page', filters.perPage.toString());
      }

      const response = await tenantApiClient.get(`/roles?${params.toString()}`);
      
      // Handle wrapped responses: { data: {...} } or direct object
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Roles data not found');
      }
      
      return {
        data: data.data || data.roles || [],
        current_page: data.current_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
        last_page: data.last_page || 1
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock roles data for development:', error);
        
        // Fallback roles data for development
        const mockRoles: Role[] = [
          {
            id: '1',
            uuid: 'role-001',
            name: 'Admin',
            description: 'Full system access with all permissions',
            permissions: [
              'users_view', 'users_create', 'users_edit', 'users_delete',
              'roles_view', 'roles_create', 'roles_edit', 'roles_delete',
              'products_view', 'products_create', 'products_edit', 'products_delete',
              'orders_view', 'orders_create', 'orders_edit', 'orders_delete',
              'orders_manage', 'inventory_view', 'inventory_manage',
              'shipping_view', 'shipping_manage', 'analytics_view',
              'content_view', 'content_edit', 'settings_view', 'settings_edit',
              'customers_view', 'customers_edit', 'reports_view'
            ],
            userCount: 2,
            isSystem: true,
            createdAt: '2024-01-01',
            createdBy: 'System'
          },
          {
            id: '2',
            uuid: 'role-002',
            name: 'Manager',
            description: 'Manage products, orders, and view reports',
            permissions: [
              'products_view', 'products_create', 'products_edit',
              'orders_view', 'orders_manage', 'inventory_view',
              'shipping_view', 'analytics_view', 'content_edit',
              'customers_view', 'reports_view'
            ],
            userCount: 5,
            isSystem: false,
            createdAt: '2024-01-15',
            createdBy: 'admin@company.com'
          },
          {
            id: '3',
            uuid: 'role-003',
            name: 'Staff',
            description: 'Basic access to view and process orders',
            permissions: [
              'products_view', 'orders_view', 'orders_manage',
              'inventory_view', 'customers_view'
            ],
            userCount: 12,
            isSystem: false,
            createdAt: '2024-02-01',
            createdBy: 'admin@company.com'
          },
          {
            id: '4',
            uuid: 'role-004',
            name: 'Viewer',
            description: 'Read-only access to system data',
            permissions: [
              'products_view', 'orders_view', 'inventory_view',
              'analytics_view', 'customers_view', 'reports_view'
            ],
            userCount: 3,
            isSystem: false,
            createdAt: '2024-02-15',
            createdBy: 'manager@company.com'
          },
          {
            id: '5',
            uuid: 'role-005',
            name: 'Customer Service',
            description: 'Handle customer inquiries and manage customer data',
            permissions: [
              'customers_view', 'customers_edit', 'orders_view',
              'orders_manage', 'products_view', 'shipping_view'
            ],
            userCount: 8,
            isSystem: false,
            createdAt: '2024-03-01',
            createdBy: 'admin@company.com'
          }
        ];

        return {
          data: mockRoles,
          current_page: 1,
          per_page: 10,
          total: mockRoles.length,
          last_page: 1
        };
      } else {
        console.error('Failed to load roles data:', error);
        throw new Error(`Failed to load roles data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Get all available permissions
   */
  getPermissions: async (): Promise<PermissionResponse> => {
    try {
      const response = await tenantApiClient.get('/permissions');
      
      // Handle wrapped responses: { data: {...} } or direct object
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Permissions data not found');
      }
      
      return {
        data: data.data || data.permissions || [],
        categories: data.categories || {},
        total: data.total || 0
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock permissions data for development:', error);
        
        // Fallback permissions data for development
        const mockPermissions: Permission[] = [
          // User Management
          { id: 'users_view', name: 'View Users', description: 'View user accounts', category: 'User Management', module: 'users', action: 'view', resource: 'users' },
          { id: 'users_create', name: 'Create Users', description: 'Create new user accounts', category: 'User Management', module: 'users', action: 'create', resource: 'users' },
          { id: 'users_edit', name: 'Edit Users', description: 'Modify user accounts', category: 'User Management', module: 'users', action: 'edit', resource: 'users' },
          { id: 'users_delete', name: 'Delete Users', description: 'Delete user accounts', category: 'User Management', module: 'users', action: 'delete', resource: 'users' },
          
          // Role Management
          { id: 'roles_view', name: 'View Roles', description: 'View role configurations', category: 'Role Management', module: 'roles', action: 'view', resource: 'roles' },
          { id: 'roles_create', name: 'Create Roles', description: 'Create new roles', category: 'Role Management', module: 'roles', action: 'create', resource: 'roles' },
          { id: 'roles_edit', name: 'Edit Roles', description: 'Modify role configurations', category: 'Role Management', module: 'roles', action: 'edit', resource: 'roles' },
          { id: 'roles_delete', name: 'Delete Roles', description: 'Delete roles', category: 'Role Management', module: 'roles', action: 'delete', resource: 'roles' },
          
          // Product Management
          { id: 'products_view', name: 'View Products', description: 'View product catalog', category: 'Product Management', module: 'products', action: 'view', resource: 'products' },
          { id: 'products_create', name: 'Create Products', description: 'Add new products', category: 'Product Management', module: 'products', action: 'create', resource: 'products' },
          { id: 'products_edit', name: 'Edit Products', description: 'Modify product details', category: 'Product Management', module: 'products', action: 'edit', resource: 'products' },
          { id: 'products_delete', name: 'Delete Products', description: 'Remove products', category: 'Product Management', module: 'products', action: 'delete', resource: 'products' },
          
          // Order Management
          { id: 'orders_view', name: 'View Orders', description: 'View order details', category: 'Order Management', module: 'orders', action: 'view', resource: 'orders' },
          { id: 'orders_create', name: 'Create Orders', description: 'Create new orders', category: 'Order Management', module: 'orders', action: 'create', resource: 'orders' },
          { id: 'orders_edit', name: 'Edit Orders', description: 'Modify order details', category: 'Order Management', module: 'orders', action: 'edit', resource: 'orders' },
          { id: 'orders_delete', name: 'Delete Orders', description: 'Cancel/remove orders', category: 'Order Management', module: 'orders', action: 'delete', resource: 'orders' },
          { id: 'orders_manage', name: 'Manage Orders', description: 'Process and manage order lifecycle', category: 'Order Management', module: 'orders', action: 'manage', resource: 'orders' },
          
          // Inventory Management
          { id: 'inventory_view', name: 'View Inventory', description: 'View inventory levels', category: 'Inventory Management', module: 'inventory', action: 'view', resource: 'inventory' },
          { id: 'inventory_manage', name: 'Manage Inventory', description: 'Update inventory levels', category: 'Inventory Management', module: 'inventory', action: 'manage', resource: 'inventory' },
          
          // Shipping Management
          { id: 'shipping_view', name: 'View Shipping', description: 'View shipping information', category: 'Shipping Management', module: 'shipping', action: 'view', resource: 'shipping' },
          { id: 'shipping_manage', name: 'Manage Shipping', description: 'Manage shipping processes', category: 'Shipping Management', module: 'shipping', action: 'manage', resource: 'shipping' },
          
          // Analytics & Reports
          { id: 'analytics_view', name: 'View Analytics', description: 'Access analytics dashboard', category: 'Analytics & Reports', module: 'analytics', action: 'view', resource: 'analytics' },
          { id: 'reports_view', name: 'View Reports', description: 'Access system reports', category: 'Analytics & Reports', module: 'reports', action: 'view', resource: 'reports' },
          
          // Content Management
          { id: 'content_view', name: 'View Content', description: 'View website content', category: 'Content Management', module: 'content', action: 'view', resource: 'content' },
          { id: 'content_edit', name: 'Edit Content', description: 'Modify website content', category: 'Content Management', module: 'content', action: 'edit', resource: 'content' },
          
          // Customer Management
          { id: 'customers_view', name: 'View Customers', description: 'View customer information', category: 'Customer Management', module: 'customers', action: 'view', resource: 'customers' },
          { id: 'customers_edit', name: 'Edit Customers', description: 'Modify customer details', category: 'Customer Management', module: 'customers', action: 'edit', resource: 'customers' },
          
          // Settings Management
          { id: 'settings_view', name: 'View Settings', description: 'View system settings', category: 'Settings Management', module: 'settings', action: 'view', resource: 'settings' },
          { id: 'settings_edit', name: 'Edit Settings', description: 'Modify system settings', category: 'Settings Management', module: 'settings', action: 'edit', resource: 'settings' }
        ];

        const categories: Record<string, Permission[]> = {};
        mockPermissions.forEach(permission => {
          if (!categories[permission.category]) {
            categories[permission.category] = [];
          }
          categories[permission.category].push(permission);
        });

        return {
          data: mockPermissions,
          categories,
          total: mockPermissions.length
        };
      } else {
        console.error('Failed to load permissions data:', error);
        throw new Error(`Failed to load permissions data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Get role details by ID
   */
  getRoleById: async (id: string): Promise<Role | null> => {
    try {
      const response = await tenantApiClient.get(`/roles/${id}`);
      const data = response?.data || response;
      
      return data || null;
    } catch (error) {
      console.error('Failed to load role details:', error);
      return null;
    }
  },

  /**
   * Create a new role
   */
  createRole: async (request: CreateRoleRequest): Promise<Role> => {
    try {
      const response = await tenantApiClient.post('/roles', request);
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Failed to create role');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create role:', error);
      throw new Error(`Failed to create role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update role details
   */
  updateRole: async (id: string, request: UpdateRoleRequest): Promise<Role> => {
    try {
      const response = await tenantApiClient.put(`/roles/${id}`, request);
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Failed to update role');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update role:', error);
      throw new Error(`Failed to update role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete a role
   */
  deleteRole: async (id: string): Promise<void> => {
    try {
      await tenantApiClient.delete(`/roles/${id}`);
    } catch (error) {
      console.error('Failed to delete role:', error);
      throw new Error(`Failed to delete role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get role statistics
   */
  getRoleStats: async (): Promise<RoleStatsResponse> => {
    try {
      const response = await tenantApiClient.get('/roles/stats');
      const data = response?.data || response;
      
      return data || {
        totalRoles: 0,
        systemRoles: 0,
        customRoles: 0,
        totalPermissions: 0,
        mostUsedPermissions: [],
        roleUsage: {}
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock role stats for development:', error);
        
        return {
          totalRoles: 5,
          systemRoles: 1,
          customRoles: 4,
          totalPermissions: 26,
          mostUsedPermissions: [
            { permission: 'products_view', count: 5 },
            { permission: 'orders_view', count: 5 },
            { permission: 'customers_view', count: 4 },
            { permission: 'inventory_view', count: 3 },
            { permission: 'analytics_view', count: 3 }
          ],
          roleUsage: {
            'Admin': 2,
            'Manager': 5,
            'Staff': 12,
            'Viewer': 3,
            'Customer Service': 8
          }
        };
      } else {
        console.error('Failed to load role stats:', error);
        throw new Error(`Failed to load role stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Export roles data
   */
  exportRoles: async (filters: RoleFilters = {}): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.permissions && filters.permissions.length > 0) {
        params.append('permissions', filters.permissions.join(','));
      }
      if (filters.isSystem !== undefined) {
        params.append('is_system', filters.isSystem.toString());
      }

      const response = await tenantApiClient.get(`/roles/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to export roles data:', error);
      throw new Error(`Failed to export roles data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};