import { tenantApiClient } from './base';

export interface LocationData {
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface UserWithLocation {
  id: string;
  uuid: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  department?: string;
  location?: LocationData;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  profilePicture?: string;
  timezone?: string;
  language?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  permissions?: string[];
}

export interface UserFilters {
  search?: string;
  status?: UserStatus | 'all';
  role?: string;
  department?: string;
  page?: number;
  perPage?: number;
}

export interface UserResponse {
  data: UserWithLocation[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  role: string;
  department?: string;
  status: UserStatus;
  location?: LocationData;
  timezone?: string;
  language?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  status?: UserStatus;
  location?: LocationData;
  timezone?: string;
  language?: string;
}

export interface UserStatsResponse {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  usersByRole: Record<string, number>;
  usersByDepartment: Record<string, number>;
  recentSignups: number;
}

export const userManagementService = {
  /**
   * Get all users with filtering and pagination
   */
  getUsers: async (filters: UserFilters = {}): Promise<UserResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.role) {
        params.append('role', filters.role);
      }
      if (filters.department) {
        params.append('department', filters.department);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.perPage) {
        params.append('per_page', filters.perPage.toString());
      }

      const response = await tenantApiClient.get(`/users?${params.toString()}`);
      
      // Handle wrapped responses: { data: {...} } or direct object
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Users data not found');
      }
      
      return {
        data: data.data || data.users || [],
        current_page: data.current_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
        last_page: data.last_page || 1
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock users data for development:', error);
        
        // Fallback users data for development
        const mockUsers: UserWithLocation[] = [
          {
            id: '1',
            uuid: 'user-001',
            name: 'John Doe',
            email: 'john.doe@company.com',
            phone: '+62 812 3456 7890',
            role: 'Admin',
            status: 'active',
            department: 'IT',
            location: {
              address: 'Jl. Sudirman No. 123',
              city: 'Jakarta',
              province: 'DKI Jakarta',
              postalCode: '12190',
              country: 'Indonesia'
            },
            createdAt: '2024-01-15',
            lastLoginAt: '2024-12-10T08:30:00Z',
            timezone: 'Asia/Jakarta',
            language: 'id',
            isEmailVerified: true,
            isPhoneVerified: true,
            permissions: ['admin_full_access']
          },
          {
            id: '2',
            uuid: 'user-002',
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            phone: '+62 813 4567 8901',
            role: 'Manager',
            status: 'active',
            department: 'Sales',
            location: {
              address: 'Jl. Thamrin No. 456',
              city: 'Bandung',
              province: 'Jawa Barat',
              postalCode: '40111',
              country: 'Indonesia'
            },
            createdAt: '2024-02-20',
            lastLoginAt: '2024-12-09T15:45:00Z',
            timezone: 'Asia/Jakarta',
            language: 'en',
            isEmailVerified: true,
            isPhoneVerified: false,
            permissions: ['products_manage', 'orders_manage', 'sales_view']
          },
          {
            id: '3',
            uuid: 'user-003',
            name: 'Bob Wilson',
            email: 'bob.wilson@company.com',
            phone: '+62 814 5678 9012',
            role: 'Staff',
            status: 'inactive',
            department: 'Operations',
            location: {
              address: 'Jl. Gatot Subroto No. 789',
              city: 'Surabaya',
              province: 'Jawa Timur',
              postalCode: '60174',
              country: 'Indonesia'
            },
            createdAt: '2024-03-10',
            lastLoginAt: '2024-11-28T10:20:00Z',
            timezone: 'Asia/Jakarta',
            language: 'id',
            isEmailVerified: true,
            isPhoneVerified: true,
            permissions: ['products_view', 'orders_view']
          },
          {
            id: '4',
            uuid: 'user-004',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@company.com',
            phone: '+62 815 9012 3456',
            role: 'Manager',
            status: 'active',
            department: 'Marketing',
            location: {
              address: 'Jl. Pemuda No. 321',
              city: 'Yogyakarta',
              province: 'DI Yogyakarta',
              postalCode: '55223',
              country: 'Indonesia'
            },
            createdAt: '2024-04-05',
            lastLoginAt: '2024-12-10T14:15:00Z',
            timezone: 'Asia/Jakarta',
            language: 'en',
            isEmailVerified: true,
            isPhoneVerified: true,
            permissions: ['content_manage', 'marketing_view', 'analytics_view']
          },
          {
            id: '5',
            uuid: 'user-005',
            name: 'Ahmad Rahman',
            email: 'ahmad.rahman@company.com',
            phone: '+62 816 3456 7890',
            role: 'Staff',
            status: 'pending',
            department: 'Support',
            location: {
              address: 'Jl. Diponegoro No. 654',
              city: 'Medan',
              province: 'Sumatera Utara',
              postalCode: '20152',
              country: 'Indonesia'
            },
            createdAt: '2024-05-12',
            timezone: 'Asia/Jakarta',
            language: 'id',
            isEmailVerified: false,
            isPhoneVerified: false,
            permissions: ['support_view']
          }
        ];

        return {
          data: mockUsers,
          current_page: 1,
          per_page: 10,
          total: mockUsers.length,
          last_page: 1
        };
      } else {
        console.error('Failed to load users data:', error);
        throw new Error(`Failed to load users data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Get user details by ID
   */
  getUserById: async (id: string): Promise<UserWithLocation | null> => {
    try {
      const response = await tenantApiClient.get(`/users/${id}`);
      const data = response?.data || response;
      
      return data || null;
    } catch (error) {
      console.error('Failed to load user details:', error);
      return null;
    }
  },

  /**
   * Create a new user
   */
  createUser: async (request: CreateUserRequest): Promise<UserWithLocation> => {
    try {
      const response = await tenantApiClient.post('/users', request);
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Failed to create user');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update user details
   */
  updateUser: async (id: string, request: UpdateUserRequest): Promise<UserWithLocation> => {
    try {
      const response = await tenantApiClient.put(`/users/${id}`, request);
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Failed to update user');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string): Promise<void> => {
    try {
      await tenantApiClient.delete(`/users/${id}`);
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update user status
   */
  updateUserStatus: async (id: string, status: UserStatus): Promise<UserWithLocation> => {
    try {
      const response = await tenantApiClient.patch(`/users/${id}/status`, { status });
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Failed to update user status');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw new Error(`Failed to update user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<UserStatsResponse> => {
    try {
      const response = await tenantApiClient.get('/users/stats');
      const data = response?.data || response;
      
      return data || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        pendingUsers: 0,
        usersByRole: {},
        usersByDepartment: {},
        recentSignups: 0
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock user stats for development:', error);
        
        return {
          totalUsers: 5,
          activeUsers: 3,
          inactiveUsers: 1,
          pendingUsers: 1,
          usersByRole: {
            'Admin': 1,
            'Manager': 2,
            'Staff': 2
          },
          usersByDepartment: {
            'IT': 1,
            'Sales': 1,
            'Operations': 1,
            'Marketing': 1,
            'Support': 1
          },
          recentSignups: 2
        };
      } else {
        console.error('Failed to load user stats:', error);
        throw new Error(`Failed to load user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Export users data
   */
  exportUsers: async (filters: UserFilters = {}): Promise<Blob> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.role) {
        params.append('role', filters.role);
      }
      if (filters.department) {
        params.append('department', filters.department);
      }

      const response = await tenantApiClient.get(`/users/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to export users data:', error);
      throw new Error(`Failed to export users data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};