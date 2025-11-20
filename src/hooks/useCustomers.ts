import { useState, useCallback } from 'react';
import { customersService, CustomerFilters, CreateCustomerRequest, UpdateCustomerRequest, Customer } from '@/services/api/customers';
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
    isLoading: false,
    isSaving: false,
    error: null,
  });

  const fetchCustomers = useCallback(async (filters?: CustomerFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Customer> = await customersService.getCustomers(filters);
      setState((prev) => ({
        ...prev,
        customers: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 10,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customers';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchCustomerById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const customer = await customersService.getCustomerById(id);
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
      const customer = await customersService.createCustomer(data);
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
      const customer = await customersService.updateCustomer(id, data);
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
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchCustomers,
    fetchCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerOrders,
    getCustomerSegment,
  };
};
