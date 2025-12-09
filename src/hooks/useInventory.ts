import { useState, useCallback } from 'react';
import { inventoryService } from '@/services/api/inventory';
import { InventoryItem, InventoryLocation } from '@/types/inventory';
import { toast } from 'sonner';

interface UseInventoryState {
  items: InventoryItem[];
  locations: InventoryLocation[];
  currentItem: InventoryItem | null;
  currentLocation: InventoryLocation | null;
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

export const useInventory = () => {
  const [state, setState] = useState<UseInventoryState>({
    items: [],
    locations: [],
    currentItem: null,
    currentLocation: null,
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

  const fetchItems = useCallback(async (filters?: any) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await inventoryService.getItems(filters);
      setState((prev) => ({
        ...prev,
        items: response.data,
        pagination: {
          page: response.currentPage || 1,
          per_page: response.perPage || 10,
          total: response.total || 0,
          last_page: response.lastPage || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch inventory items';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchLocations = useCallback(async (filters?: any) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const locations = await inventoryService.getLocations(filters);
      setState((prev) => ({
        ...prev,
        locations,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch inventory locations';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const adjustStock = useCallback(async (itemId: number, locationId: number, data: any) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await inventoryService.adjustLocationStock(itemId, locationId, data);
      toast.success('Stock adjusted successfully');
      // Refresh items
      await fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to adjust stock';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, [fetchItems]);

  const transferStock = useCallback(async (itemId: number, data: any) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await inventoryService.transferStock(itemId, data);
      toast.success('Stock transferred successfully');
      // Refresh items
      await fetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to transfer stock';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, [fetchItems]);

  const createLocation = useCallback(async (data: any) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const location = await inventoryService.createLocation(data);
      setState((prev) => ({
        ...prev,
        locations: [location, ...prev.locations],
        isSaving: false,
      }));
      toast.success('Location created successfully');
      return location;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create location';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateLocation = useCallback(async (id: number, data: any) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const location = await inventoryService.updateLocation(id, data);
      setState((prev) => ({
        ...prev,
        locations: prev.locations.map((l) => (l.id === id ? location : l)),
        isSaving: false,
      }));
      toast.success('Location updated successfully');
      return location;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update location';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteLocation = useCallback(async (id: number) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await inventoryService.deleteLocation(id);
      setState((prev) => ({
        ...prev,
        locations: prev.locations.filter((l) => l.id !== id),
        isSaving: false,
      }));
      toast.success('Location deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete location';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  return {
    items: state.items,
    locations: state.locations,
    currentItem: state.currentItem,
    currentLocation: state.currentLocation,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchItems,
    fetchLocations,
    adjustStock,
    transferStock,
    createLocation,
    updateLocation,
    deleteLocation,
  };
};