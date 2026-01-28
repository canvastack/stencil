import { tenantApiClient } from '@/services/tenant/tenantApiClient';

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
  getCustomersCredit: async (filters: CustomerCreditFilters = {}): Promise<any> => {
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
      
      // Handle the actual API response structure
      if (response?.success && response?.data) {
        return {
          data: response.data, // This contains credit_analysis array and summary
          current_page: 1,
          per_page: response.data.credit_analysis?.length || 0,
          total: response.data.credit_analysis?.length || 0,
          last_page: 1
        };
      }
      
      // Fallback for other response structures
      const data = response?.data || response;
      
      return {
        data: data.data || data.customers || data,
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
  },

  /**
   * Get customer payment history
   */
  getCustomerPaymentHistory: async (customerId: string, filters: {
    limit?: number;
    type?: 'all' | 'incoming' | 'outgoing';
    status?: 'all' | 'pending' | 'completed' | 'failed' | 'refunded';
  } = {}): Promise<any> => {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.type && filters.type !== 'all') {
        params.append('type', filters.type);
      }
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await tenantApiClient.get(`/customers/${customerId}/payment-history?${params.toString()}`);
      
      if (response?.success && response?.data) {
        return response.data;
      }
      
      // Fallback for other response structures
      return response?.data || response;
    } catch (error) {
      console.error(`Failed to load payment history for customer ${customerId}:`, error);
      
      if (import.meta.env.MODE === 'development') {
        console.warn('API failed, using mock payment history data for development:', error);
        
        // Fallback payment history data for development
        return {
          customer: {
            id: customerId,
            name: 'Test Customer',
            email: 'test@customer.com'
          },
          payment_history: [
            {
              id: 'pay-001',
              order_number: 'ORD-2024-001',
              order_uuid: 'order-uuid-001',
              direction: 'incoming',
              type: 'payment',
              status: 'completed',
              amount: 5000000,
              currency: 'IDR',
              method: 'bank_transfer',
              reference: 'TXN-001',
              paid_at: '2024-01-15T10:30:00Z',
              created_at: '2024-01-15T10:00:00Z',
              formatted_amount: 'Rp 5.000.000',
              status_label: 'Completed',
              type_label: 'Payment'
            },
            {
              id: 'pay-002',
              order_number: 'ORD-2024-002',
              order_uuid: 'order-uuid-002',
              direction: 'incoming',
              type: 'payment',
              status: 'completed',
              amount: 3000000,
              currency: 'IDR',
              method: 'credit_card',
              reference: 'TXN-002',
              paid_at: '2024-01-10T14:20:00Z',
              created_at: '2024-01-10T14:00:00Z',
              formatted_amount: 'Rp 3.000.000',
              status_label: 'Completed',
              type_label: 'Payment'
            }
          ],
          summary: {
            total_transactions: 2,
            total_incoming: 8000000,
            total_outgoing: 0,
            net_amount: 8000000,
            pending_amount: 0,
            last_payment_date: '2024-01-15T10:30:00Z',
            formatted_total_incoming: 'Rp 8.000.000',
            formatted_total_outgoing: 'Rp 0',
            formatted_net_amount: 'Rp 8.000.000',
            formatted_pending_amount: 'Rp 0'
          }
        };
      } else {
        throw new Error(`Failed to load payment history: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
};