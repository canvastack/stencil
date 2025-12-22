import { tenantApiClient } from '@/services/api/tenantApiClient';

export interface CustomerCreditData {
  id: string;
  uuid: string;
  name: string;
  email: string;
  company: string;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  creditScore: number;
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  status: 'active' | 'suspended' | 'pending';
  lastPayment: string;
  nextDueDate: string;
  phone?: string;
  address?: string;
  registrationDate: string;
  lastActivity: string;
}

export interface CustomerCreditFilters {
  search?: string;
  status?: string;
  creditScore?: string;
  paymentHistory?: string;
  page?: number;
  perPage?: number;
}

export interface CustomerCreditResponse {
  data: CustomerCreditData[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export const customerCreditService = {
  /**
   * Get customers with credit information
   */
  getCustomersCredit: async (filters: CustomerCreditFilters = {}): Promise<CustomerCreditResponse> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.creditScore) {
        params.append('credit_score', filters.creditScore);
      }
      if (filters.paymentHistory) {
        params.append('payment_history', filters.paymentHistory);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.perPage) {
        params.append('per_page', filters.perPage.toString());
      }

      const response = await tenantApiClient.get(`/customers/credit?${params.toString()}`);
      
      // Handle wrapped responses: { data: {...} } or direct object
      const data = response?.data || response;
      
      if (!data) {
        throw new Error('Customer credit data not found');
      }
      
      return {
        data: data.data || data.customers || [],
        current_page: data.current_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
        last_page: data.last_page || 1
      };
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock customer credit data for development:', error);
        
        // Fallback customer credit data for development
        const mockCustomers: CustomerCreditData[] = [
          {
            id: '1',
            uuid: 'cust-001',
            name: 'PT. Manufaktur Jaya',
            email: 'admin@manufakturjaya.com',
            company: 'PT. Manufaktur Jaya',
            creditLimit: 50000000,
            creditUsed: 15000000,
            creditAvailable: 35000000,
            creditScore: 850,
            paymentHistory: 'excellent',
            status: 'active',
            lastPayment: '2024-11-15',
            nextDueDate: '2024-12-15',
            phone: '+62-21-1234567',
            address: 'Jl. Industri No. 123, Jakarta',
            registrationDate: '2022-01-15',
            lastActivity: '2024-11-20'
          },
          {
            id: '2',
            uuid: 'cust-002',
            name: 'CV. Teknik Presisi',
            email: 'info@teknikpresisi.com',
            company: 'CV. Teknik Presisi',
            creditLimit: 25000000,
            creditUsed: 8500000,
            creditAvailable: 16500000,
            creditScore: 780,
            paymentHistory: 'good',
            status: 'active',
            lastPayment: '2024-11-10',
            nextDueDate: '2024-12-10',
            phone: '+62-21-2345678',
            address: 'Jl. Teknik No. 456, Bandung',
            registrationDate: '2022-03-20',
            lastActivity: '2024-11-18'
          },
          {
            id: '3',
            uuid: 'cust-003',
            name: 'PT. Indo Etching',
            email: 'contact@indoetching.co.id',
            company: 'PT. Indo Etching',
            creditLimit: 75000000,
            creditUsed: 45000000,
            creditAvailable: 30000000,
            creditScore: 720,
            paymentHistory: 'good',
            status: 'active',
            lastPayment: '2024-10-25',
            nextDueDate: '2024-12-25',
            phone: '+62-21-3456789',
            address: 'Jl. Industrial Estate No. 789, Surabaya',
            registrationDate: '2021-08-10',
            lastActivity: '2024-11-19'
          },
          {
            id: '4',
            uuid: 'cust-004',
            name: 'Berkah Metal Works',
            email: 'admin@berkahmetal.com',
            company: 'Berkah Metal Works',
            creditLimit: 30000000,
            creditUsed: 22000000,
            creditAvailable: 8000000,
            creditScore: 680,
            paymentHistory: 'fair',
            status: 'active',
            lastPayment: '2024-11-05',
            nextDueDate: '2024-12-05',
            phone: '+62-21-4567890',
            address: 'Jl. Logam No. 321, Bekasi',
            registrationDate: '2022-06-15',
            lastActivity: '2024-11-17'
          },
          {
            id: '5',
            uuid: 'cust-005',
            name: 'Precision Tools Co',
            email: 'sales@precisiontools.net',
            company: 'Precision Tools Co',
            creditLimit: 15000000,
            creditUsed: 5000000,
            creditAvailable: 10000000,
            creditScore: 650,
            paymentHistory: 'fair',
            status: 'pending',
            lastPayment: '2024-10-15',
            nextDueDate: '2024-12-01',
            phone: '+62-21-5678901',
            address: 'Jl. Precision No. 654, Tangerang',
            registrationDate: '2023-02-28',
            lastActivity: '2024-11-16'
          }
        ];

        return {
          data: mockCustomers,
          current_page: 1,
          per_page: 10,
          total: mockCustomers.length,
          last_page: 1
        };
      } else {
        console.error('Failed to load customer credit data:', error);
        throw new Error(`Failed to load customer credit data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  /**
   * Get customer credit details by ID
   */
  getCustomerCreditById: async (id: string): Promise<CustomerCreditData | null> => {
    try {
      const response = await tenantApiClient.get(`/customers/${id}/credit`);
      const data = response?.data || response;
      
      return data || null;
    } catch (error) {
      console.error(`Failed to load customer credit details for ID ${id}:`, error);
      return null;
    }
  },

  /**
   * Update customer credit limit
   */
  updateCreditLimit: async (id: string, newLimit: number): Promise<void> => {
    try {
      await tenantApiClient.put(`/customers/${id}/credit-limit`, {
        credit_limit: newLimit
      });
    } catch (error) {
      console.error(`Failed to update credit limit for customer ${id}:`, error);
      throw new Error(`Failed to update credit limit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Update customer status
   */
  updateCustomerStatus: async (id: string, status: 'active' | 'suspended' | 'pending'): Promise<void> => {
    try {
      await tenantApiClient.put(`/customers/${id}/status`, {
        status: status
      });
    } catch (error) {
      console.error(`Failed to update customer status for ${id}:`, error);
      throw new Error(`Failed to update customer status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};