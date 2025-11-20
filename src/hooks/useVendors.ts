import { useState, useCallback } from 'react';
import { vendorsService, VendorFilters, CreateVendorRequest, UpdateVendorRequest, Vendor } from '@/services/api/vendors';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UseVendorsState {
  vendors: Vendor[];
  currentVendor: Vendor | null;
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

export const useVendors = () => {
  const [state, setState] = useState<UseVendorsState>({
    vendors: [],
    currentVendor: null,
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

  const fetchVendors = useCallback(async (filters?: VendorFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Vendor> = await vendorsService.getVendors(filters);
      setState((prev) => ({
        ...prev,
        vendors: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 10,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vendors';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchVendorById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const vendor = await vendorsService.getVendorById(id);
      setState((prev) => ({ ...prev, currentVendor: vendor, isLoading: false }));
      return vendor;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vendor';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const createVendor = useCallback(async (data: CreateVendorRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const vendor = await vendorsService.createVendor(data);
      setState((prev) => ({
        ...prev,
        vendors: [vendor, ...prev.vendors],
        isSaving: false,
      }));
      toast.success('Vendor created successfully');
      return vendor;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create vendor';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateVendor = useCallback(async (id: string, data: UpdateVendorRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const vendor = await vendorsService.updateVendor(id, data);
      setState((prev) => ({
        ...prev,
        vendors: prev.vendors.map((v) => (v.id === id ? vendor : v)),
        currentVendor: prev.currentVendor?.id === id ? vendor : prev.currentVendor,
        isSaving: false,
      }));
      toast.success('Vendor updated successfully');
      return vendor;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update vendor';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteVendor = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await vendorsService.deleteVendor(id);
      setState((prev) => ({
        ...prev,
        vendors: prev.vendors.filter((v) => v.id !== id),
        currentVendor: prev.currentVendor?.id === id ? null : prev.currentVendor,
        isSaving: false,
      }));
      toast.success('Vendor deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete vendor';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const getVendorEvaluations = useCallback(async (id: string) => {
    try {
      return await vendorsService.getVendorEvaluations(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vendor evaluations';
      toast.error(message);
    }
  }, []);

  const getVendorSpecializations = useCallback(async (id: string) => {
    try {
      return await vendorsService.getVendorSpecializations(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vendor specializations';
      toast.error(message);
    }
  }, []);

  const getVendorOrders = useCallback(async (id: string) => {
    try {
      return await vendorsService.getVendorOrders(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vendor orders';
      toast.error(message);
    }
  }, []);

  return {
    vendors: state.vendors,
    currentVendor: state.currentVendor,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchVendors,
    fetchVendorById,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorEvaluations,
    getVendorSpecializations,
    getVendorOrders,
  };
};
