import { useState, useCallback } from 'react';
import { shippingService } from '@/services/api/shipping';
import { Shipment, ShippingMethod, ShippingAddress } from '@/types/shipping';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UseShippingState {
  shipments: Shipment[];
  methods: ShippingMethod[];
  addresses: ShippingAddress[];
  currentShipment: Shipment | null;
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

export const useShipping = () => {
  const [state, setState] = useState<UseShippingState>({
    shipments: [],
    methods: [],
    addresses: [],
    currentShipment: null,
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

  const fetchShipments = useCallback(async (filters?: any) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Shipment> = await shippingService.getShipments(filters);
      setState((prev) => ({
        ...prev,
        shipments: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 10,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch shipments';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchShipmentById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const shipment = await shippingService.getShipmentById(id);
      setState((prev) => ({ ...prev, currentShipment: shipment, isLoading: false }));
      return shipment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch shipment';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchShippingMethods = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const methods = await shippingService.getShippingMethods();
      setState((prev) => ({
        ...prev,
        methods,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch shipping methods';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchShippingAddresses = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const addresses = await shippingService.getShippingAddresses();
      setState((prev) => ({
        ...prev,
        addresses,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch shipping addresses';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const createShipment = useCallback(async (data: any) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const shipment = await shippingService.createShipment(data);
      setState((prev) => ({
        ...prev,
        shipments: [shipment, ...prev.shipments],
        isSaving: false,
      }));
      toast.success('Shipment created successfully');
      return shipment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create shipment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateShipment = useCallback(async (id: string, data: any) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const shipment = await shippingService.updateShipment(id, data);
      setState((prev) => ({
        ...prev,
        shipments: prev.shipments.map((s) => (s.id === id ? shipment : s)),
        currentShipment: prev.currentShipment?.id === id ? shipment : prev.currentShipment,
        isSaving: false,
      }));
      toast.success('Shipment updated successfully');
      return shipment;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update shipment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteShipment = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await shippingService.deleteShipment(id);
      setState((prev) => ({
        ...prev,
        shipments: prev.shipments.filter((s) => s.id !== id),
        currentShipment: prev.currentShipment?.id === id ? null : prev.currentShipment,
        isSaving: false,
      }));
      toast.success('Shipment deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete shipment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const createShippingMethod = useCallback(async (data: Partial<ShippingMethod>) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const method = await shippingService.createShippingMethod(data);
      setState((prev) => ({
        ...prev,
        methods: [method, ...prev.methods],
        isSaving: false,
      }));
      toast.success('Shipping method created successfully');
      return method;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create shipping method';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateShippingMethod = useCallback(async (id: string, data: Partial<ShippingMethod>) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const method = await shippingService.updateShippingMethod(id, data);
      setState((prev) => ({
        ...prev,
        methods: prev.methods.map((m) => (m.id === id ? method : m)),
        isSaving: false,
      }));
      toast.success('Shipping method updated successfully');
      return method;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update shipping method';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const createShippingAddress = useCallback(async (data: Partial<ShippingAddress>) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const address = await shippingService.createShippingAddress(data);
      setState((prev) => ({
        ...prev,
        addresses: [address, ...prev.addresses],
        isSaving: false,
      }));
      toast.success('Shipping address created successfully');
      return address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create shipping address';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const getShipmentTracking = useCallback(async (shipmentId: string) => {
    try {
      return await shippingService.getShipmentTracking(shipmentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch shipment tracking';
      toast.error(message);
    }
  }, []);

  return {
    shipments: state.shipments,
    methods: state.methods,
    addresses: state.addresses,
    currentShipment: state.currentShipment,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchShipments,
    fetchShipmentById,
    fetchShippingMethods,
    fetchShippingAddresses,
    createShipment,
    updateShipment,
    deleteShipment,
    createShippingMethod,
    updateShippingMethod,
    createShippingAddress,
    getShipmentTracking,
  };
};