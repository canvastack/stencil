import { useState, useCallback } from 'react';
import { customersService, CreateCustomerRequest, UpdateCustomerRequest } from '@/services/api/customers';
import type { Customer as ApiCustomer } from '@/services/api/customers';
import type { Customer, CustomerFilters } from '@/types/customer';
import { adaptApiCustomersToTypeCustomers, adaptApiCustomerToTypeCustomer } from '@/adapters/customerAdapter';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UseCustomersState {
  customers: Customer[];
  currentCustomer: Customer | null;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  overallStats: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    individual: number;
    business: number;
    totalRevenue: number;
    averageOrderValue: number;
    customersWithOrders: number;
    averageRevenuePerCustomer: number;
  } | null;
  filteredStats: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    individual: number;
    business: number;
    totalRevenue: number;
  } | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export const useCustomers = () => {
  const [state, setState] = useState<UseCustomersState>({
    customers: [],
    currentCustomer: null,
    pagination: {
      page: 1,
      per_page: 10,
      total: 0,
      last_page: 1,
    },
    overallStats: null,
    filteredStats: null,
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchCustomers = useCallback(async (filters?: CustomerFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('[useCustomers] Fetching customers with filters:', filters);
      
      // Map frontend filters to API service filters
      const apiFilters: import('@/services/api/customers').CustomerFilters = {};
      
      if (filters) {
        if (filters.search) apiFilters.search = filters.search;
        if (filters.customerType) apiFilters.type = filters.customerType; // Map customerType to type
        if (filters.status) apiFilters.status = filters.status;
        if (filters.city) apiFilters.city = filters.city;
        if (filters.page) apiFilters.page = filters.page;
        if (filters.per_page) apiFilters.per_page = filters.per_page;
        // Add other filter mappings as needed
      }
      
      console.log('[useCustomers] Mapped API filters:', apiFilters);
      
      const response: PaginatedResponse<ApiCustomer> = await customersService.getCustomers(apiFilters);
      console.log('[useCustomers] Raw API Response:', response);
      console.log('[useCustomers] Response type:', typeof response);
      console.log('[useCustomers] Response keys:', Object.keys(response || {}));
      
      if (!response) {
        throw new Error('No response received from API');
      }
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('[useCustomers] Invalid response structure:', response);
        throw new Error('Invalid response structure - data is not an array');
      }
      
      const adaptedCustomers = adaptApiCustomersToTypeCustomers(response.data);
      console.log('[useCustomers] Adapted customers:', adaptedCustomers);
      
      // Extract pagination data from Laravel Resource collection response
      // Laravel returns: { data: [...], links: {...}, meta: { current_page, last_page, per_page, total, ... } }
      const meta = (response as any).meta || {};
      const paginationData = {
        page: meta.current_page || response.current_page || 1,
        per_page: meta.per_page || response.per_page || 20,
        total: meta.total || response.total || 0,
        last_page: meta.last_page || response.last_page || 1,
      };
      
      // Extract filtered stats from response
      const filteredStats = (response as any).filtered_stats || null;
      
      console.log('[useCustomers] Meta object:', meta);
      console.log('[useCustomers] Pagination Data:', paginationData);
      console.log('[useCustomers] Filtered Stats:', filteredStats);
      console.log('[useCustomers] Customers Count:', adaptedCustomers.length);
      
      setState((prev) => ({
        ...prev,
        customers: adaptedCustomers,
        pagination: paginationData,
        filteredStats: filteredStats,
        isLoading: false,
      }));
    } catch (error) {
      console.error('[useCustomers] Error fetching customers:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch customers';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchCustomerById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const apiCustomer = await customersService.getCustomerById(id);
      const customer = adaptApiCustomerToTypeCustomer(apiCustomer);
      setState((prev) => ({ ...prev, currentCustomer: customer, isLoading: false }));
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customer';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const createCustomer = useCallback(async (data: CreateCustomerRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const apiCustomer = await customersService.createCustomer(data);
      const customer = adaptApiCustomerToTypeCustomer(apiCustomer);
      setState((prev) => ({
        ...prev,
        customers: [customer, ...prev.customers],
        isSaving: false,
      }));
      toast.success('Customer created successfully');
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create customer';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateCustomer = useCallback(async (id: string, data: UpdateCustomerRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const apiCustomer = await customersService.updateCustomer(id, data);
      const customer = adaptApiCustomerToTypeCustomer(apiCustomer);
      setState((prev) => ({
        ...prev,
        customers: prev.customers.map((c) => (c.id === id ? customer : c)),
        currentCustomer: prev.currentCustomer?.id === id ? customer : prev.currentCustomer,
        isSaving: false,
      }));
      toast.success('Customer updated successfully');
      return customer;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update customer';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await customersService.deleteCustomer(id);
      setState((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== id),
        currentCustomer: prev.currentCustomer?.id === id ? null : prev.currentCustomer,
        isSaving: false,
      }));
      toast.success('Customer deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete customer';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const getCustomerOrders = useCallback(async (id: string) => {
    try {
      return await customersService.getCustomerOrders(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customer orders';
      toast.error(message);
    }
  }, []);

  const fetchCustomerStats = useCallback(async () => {
    try {
      console.log('[useCustomers] Fetching customer stats...');
      const response = await customersService.getCustomerStats();
      console.log('[useCustomers] Stats response received:', response);
      
      // Handle both direct data and nested data structure
      const statsData = response.data || response;
      console.log('[useCustomers] Stats data:', statsData);
      
      setState((prev) => ({
        ...prev,
        overallStats: statsData,
      }));
    } catch (error) {
      console.error('[useCustomers] Error fetching customer stats:', error);
      // Set default values on error
      setState((prev) => ({
        ...prev,
        overallStats: {
          total: 0,
          active: 0,
          inactive: 0,
          blocked: 0,
          individual: 0,
          business: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          customersWithOrders: 0,
          averageRevenuePerCustomer: 0,
        },
      }));
    }
  }, []);

  const getCustomerSegment = useCallback(async (id: string) => {
    try {
      return await customersService.getCustomerSegment(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customer segment';
      toast.error(message);
    }
  }, []);

  return {
    customers: state.customers,
    currentCustomer: state.currentCustomer,
    pagination: state.pagination,
    overallStats: state.overallStats,
    filteredStats: state.filteredStats,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchCustomers,
    fetchCustomerById,
    fetchCustomerStats,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerOrders,
    getCustomerSegment,
  };
};
