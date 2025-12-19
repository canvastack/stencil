import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService, CreateVendorRequest, UpdateVendorRequest } from '@/services/api/vendors';
import type { Vendor, VendorFilters } from '@/services/api/vendors';
import { toast } from '@/lib/toast-config';
import { handleApiError, displayError } from '@/lib/api/error-handler';
import { announceToScreenReader } from '@/lib/utils/accessibility';

/**
 * React Query-based hook for vendor management
 * Provides intelligent caching, automatic refetching, and optimistic updates
 */
export const useVendorsQuery = (filters?: VendorFilters) => {
  const queryClient = useQueryClient();

  // Fetch vendors with intelligent caching
  const {
    data: vendorsData,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['vendors', filters],
    queryFn: () => vendorsService.getVendors(filters),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Fetch single vendor by ID
  const fetchVendorById = (id: string) => {
    return useQuery({
      queryKey: ['vendor', id],
      queryFn: () => vendorsService.getVendorById(id),
      staleTime: 5 * 60 * 1000,
      enabled: !!id, // Only fetch if ID is provided
    });
  };

  // Create vendor mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: (data: CreateVendorRequest) => vendorsService.createVendor(data),
    onMutate: async (newVendor) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vendors', filters] });

      // Snapshot the previous value
      const previousVendors = queryClient.getQueryData(['vendors', filters]);

      // Announce to screen reader
      announceToScreenReader(`Creating vendor ${newVendor.name}...`);

      // Return context with snapshot
      return { previousVendors };
    },
    onSuccess: (newVendor) => {
      // Invalidate and refetch vendors list
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
      toast.success('Vendor created successfully');
      announceToScreenReader(`Vendor ${newVendor.name} created successfully`);
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousVendors) {
        queryClient.setQueryData(['vendors', filters], context.previousVendors);
      }
      
      const apiError = handleApiError(error, 'Create Vendor');
      displayError(apiError);
      announceToScreenReader('Failed to create vendor. Please try again.');
    },
  });

  // Update vendor mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorRequest }) =>
      vendorsService.updateVendor(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vendors', filters] });
      await queryClient.cancelQueries({ queryKey: ['vendor', id] });

      // Snapshot previous values
      const previousVendors = queryClient.getQueryData(['vendors', filters]);
      const previousVendor = queryClient.getQueryData(['vendor', id]);

      // Optimistically update vendor in list
      queryClient.setQueryData(['vendors', filters], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((v: Vendor) => 
            v.id === id ? { ...v, ...data } : v
          ),
        };
      });

      // Announce to screen reader
      announceToScreenReader(`Updating vendor ${data.name}...`);

      return { previousVendors, previousVendor };
    },
    onSuccess: (updatedVendor, variables) => {
      // Update cache with server response
      queryClient.setQueryData(['vendor', variables.id], updatedVendor);
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
      toast.success('Vendor updated successfully');
      announceToScreenReader(`Vendor ${updatedVendor.name} updated successfully`);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousVendors) {
        queryClient.setQueryData(['vendors', filters], context.previousVendors);
      }
      if (context?.previousVendor) {
        queryClient.setQueryData(['vendor', variables.id], context.previousVendor);
      }
      
      const apiError = handleApiError(error, 'Update Vendor');
      displayError(apiError);
      announceToScreenReader('Failed to update vendor. Please try again.');
    },
  });

  // Delete vendor mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorsService.deleteVendor(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vendors', filters] });

      // Snapshot previous value
      const previousVendors = queryClient.getQueryData(['vendors', filters]);

      // Optimistically remove vendor from list
      queryClient.setQueryData(['vendors', filters], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.filter((v: Vendor) => v.id !== deletedId),
          total: (old.total || 0) - 1,
        };
      });

      // Announce to screen reader
      announceToScreenReader('Deleting vendor...');

      return { previousVendors };
    },
    onSuccess: (_, deletedId) => {
      // Remove vendor from individual cache
      queryClient.removeQueries({ queryKey: ['vendor', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      
      toast.success('Vendor deleted successfully');
      announceToScreenReader('Vendor deleted successfully');
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousVendors) {
        queryClient.setQueryData(['vendors', filters], context.previousVendors);
      }
      
      const apiError = handleApiError(error, 'Delete Vendor');
      displayError(apiError);
      announceToScreenReader('Failed to delete vendor. Please try again.');
    },
  });

  // Bulk operations mutation
  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ vendorIds, status }: { vendorIds: string[]; status: string }) =>
      vendorsService.bulkUpdateStatus(vendorIds, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor statuses updated successfully');
      announceToScreenReader('Bulk status update completed');
    },
    onError: (error) => {
      const apiError = handleApiError(error, 'Bulk Update');
      displayError(apiError);
      announceToScreenReader('Failed to update vendor statuses');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (vendorIds: string[]) => vendorsService.bulkDelete(vendorIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendors deleted successfully');
      announceToScreenReader('Bulk delete completed');
    },
    onError: (error) => {
      const apiError = handleApiError(error, 'Bulk Delete');
      displayError(apiError);
      announceToScreenReader('Failed to delete vendors');
    },
  });

  return {
    // Data
    vendors: vendorsData?.data || [],
    pagination: {
      page: vendorsData?.current_page || 1,
      per_page: vendorsData?.per_page || 50,
      total: vendorsData?.total || 0,
      last_page: vendorsData?.last_page || 1,
    },
    
    // Loading states
    isLoading,
    isFetching,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    
    // Error
    error: error?.message || null,
    
    // Actions
    createVendor: createMutation.mutate,
    createVendorAsync: createMutation.mutateAsync,
    updateVendor: (id: string, data: UpdateVendorRequest) => updateMutation.mutate({ id, data }),
    updateVendorAsync: updateMutation.mutateAsync,
    deleteVendor: deleteMutation.mutate,
    deleteVendorAsync: deleteMutation.mutateAsync,
    fetchVendorById,
    refreshVendors: refetch,
    
    // Bulk operations
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    bulkDelete: bulkDeleteMutation.mutate,
  };
};
