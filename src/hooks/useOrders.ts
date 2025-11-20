import { useState, useCallback, useEffect } from 'react';
import { ordersService, OrderFilters, CreateOrderRequest, UpdateOrderRequest, OrderStateTransitionRequest } from '@/services/api/orders';
import { Order } from '@/types/order';
import { PaginatedResponse } from '@/types/api';
import { toast } from 'sonner';

interface UseOrdersState {
  orders: Order[];
  currentOrder: Order | null;
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

export const useOrders = () => {
  const [state, setState] = useState<UseOrdersState>({
    orders: [],
    currentOrder: null,
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

  const fetchOrders = useCallback(async (filters?: OrderFilters) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response: PaginatedResponse<Order> = await ordersService.getOrders(filters);
      setState((prev) => ({
        ...prev,
        orders: response.data,
        pagination: {
          page: response.current_page || 1,
          per_page: response.per_page || 10,
          total: response.total || 0,
          last_page: response.last_page || 1,
        },
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch orders';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const fetchOrderById = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const order = await ordersService.getOrderById(id);
      setState((prev) => ({ ...prev, currentOrder: order, isLoading: false }));
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch order';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      toast.error(message);
    }
  }, []);

  const createOrder = useCallback(async (data: CreateOrderRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const order = await ordersService.createOrder(data);
      setState((prev) => ({
        ...prev,
        orders: [order, ...prev.orders],
        isSaving: false,
      }));
      toast.success('Order created successfully');
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create order';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const updateOrder = useCallback(async (id: string, data: UpdateOrderRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const order = await ordersService.updateOrder(id, data);
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === id ? order : o)),
        currentOrder: prev.currentOrder?.id === id ? order : prev.currentOrder,
        isSaving: false,
      }));
      toast.success('Order updated successfully');
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await ordersService.deleteOrder(id);
      setState((prev) => ({
        ...prev,
        orders: prev.orders.filter((o) => o.id !== id),
        currentOrder: prev.currentOrder?.id === id ? null : prev.currentOrder,
        isSaving: false,
      }));
      toast.success('Order deleted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete order';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const transitionOrderState = useCallback(async (id: string, data: OrderStateTransitionRequest) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const order = await ordersService.transitionOrderState(id, data);
      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((o) => (o.id === id ? order : o)),
        currentOrder: prev.currentOrder?.id === id ? order : prev.currentOrder,
        isSaving: false,
      }));
      toast.success('Order state updated successfully');
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to transition order state';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  const getOrderHistory = useCallback(async (id: string) => {
    try {
      return await ordersService.getOrderHistory(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch order history';
      toast.error(message);
    }
  }, []);

  const getOrderPayments = useCallback(async (id: string) => {
    try {
      return await ordersService.getOrderPayments(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch order payments';
      toast.error(message);
    }
  }, []);

  const getOrderShipments = useCallback(async (id: string) => {
    try {
      return await ordersService.getOrderShipments(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch order shipments';
      toast.error(message);
    }
  }, []);

  const recordPayment = useCallback(async (orderId: string, data: { amount: number; method: string; notes?: string }) => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await ordersService.recordPayment(orderId, data);
      toast.success('Payment recorded successfully');
      setState((prev) => ({ ...prev, isSaving: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to record payment';
      setState((prev) => ({ ...prev, error: message, isSaving: false }));
      toast.error(message);
    }
  }, []);

  return {
    orders: state.orders,
    currentOrder: state.currentOrder,
    pagination: state.pagination,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    deleteOrder,
    transitionOrderState,
    getOrderHistory,
    getOrderPayments,
    getOrderShipments,
    recordPayment,
  };
};
