import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersService, OrderFilters, CreateOrderRequest, UpdateOrderRequest, OrderStateTransitionRequest } from '../services/api/orders';
import { queryKeys, realtimeConfig, cacheUtils } from '../lib/react-query';
import { Order } from '../types/order';
import { PaginatedResponse } from '../types/api';

// Get orders list with real-time updates
export const useOrders = (filters?: OrderFilters) => {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => ordersService.getOrders(filters),
    staleTime: realtimeConfig.staleTime.orders,
    refetchInterval: realtimeConfig.polling.orders,
    refetchIntervalInBackground: true,
    enabled: true,
  });
};

// Get single order with real-time updates
export const useOrder = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersService.getOrderById(id),
    staleTime: realtimeConfig.staleTime.orders,
    refetchInterval: realtimeConfig.polling.orders,
    refetchIntervalInBackground: true,
    enabled: !!id,
  });
};

// Get order history
export const useOrderHistory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.history(id),
    queryFn: () => ordersService.getOrderHistory(id),
    staleTime: 30000, // 30 seconds
    enabled: !!id,
  });
};

// Get order payments
export const useOrderPayments = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.payments(id),
    queryFn: () => ordersService.getOrderPayments(id),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!id,
  });
};

// Get order shipments
export const useOrderShipments = (id: string) => {
  return useQuery({
    queryKey: queryKeys.orders.shipments(id),
    queryFn: () => ordersService.getOrderShipments(id),
    staleTime: 45000, // 45 seconds
    refetchInterval: 45000, // Refetch every 45 seconds
    enabled: !!id,
  });
};

// Create order mutation
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersService.createOrder(data),
    onMutate: async (newOrder) => {
      // Optimistic update for orders list
      const rollback = await cacheUtils.optimisticUpdate<PaginatedResponse<Order>>(
        queryKeys.orders.lists(),
        (old) => {
          if (!old) return old;
          
          const optimisticOrder: Order = {
            id: `temp-${Date.now()}`,
            customer_id: newOrder.customer_id,
            items: newOrder.items,
            status: 'pending',
            total: newOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Order;

          return {
            ...old,
            data: [optimisticOrder, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        }
      );

      return { rollback };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      
      // Show success toast
      toast.success('Order created successfully', {
        description: `Order #${data.id} has been created`,
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      context?.rollback?.();
      
      // Show error toast
      toast.error('Failed to create order', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Update order mutation
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) => 
      ordersService.updateOrder(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });

      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));

      // Optimistically update the order
      if (previousOrder) {
        const updatedOrder = { ...previousOrder, ...data, updated_at: new Date().toISOString() };
        queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);
      }

      return { previousOrder };
    },
    onSuccess: (data, variables, context) => {
      // Update the order in cache
      queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      
      // Show success toast
      toast.success('Order updated successfully', {
        description: `Order #${data.id} has been updated`,
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(variables.id), context.previousOrder);
      }
      
      // Show error toast
      toast.error('Failed to update order', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Transition order state mutation
export const useTransitionOrderState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderStateTransitionRequest }) => 
      ordersService.transitionOrderState(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });

      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));

      return { previousOrder };
    },
    onSuccess: (data, variables, context) => {
      // Update the order in cache
      queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.history(variables.id) });
      
      // Show success toast
      toast.success('Order status updated', {
        description: `Order #${data.id} status changed to ${data.status}`,
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(variables.id), context.previousOrder);
      }
      
      // Show error toast
      toast.error('Failed to update order status', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Delete order mutation
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersService.deleteOrder(id),
    onMutate: async (id) => {
      // Remove order from cache optimistically
      const rollback = await cacheUtils.optimisticUpdate<PaginatedResponse<Order>>(
        queryKeys.orders.lists(),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter(order => order.id !== id),
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
          };
        }
      );

      return { rollback };
    },
    onSuccess: (data, variables, context) => {
      // Remove order from cache
      queryClient.removeQueries({ queryKey: queryKeys.orders.detail(variables) });
      
      // Invalidate orders list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      
      // Show success toast
      toast.success('Order deleted successfully', {
        description: `Order #${variables} has been deleted`,
      });
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      context?.rollback?.();
      
      // Show error toast
      toast.error('Failed to delete order', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Record payment mutation
export const useRecordPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { 
      orderId: string; 
      data: { amount: number; method: string; notes?: string } 
    }) => ordersService.recordPayment(orderId, data),
    onSuccess: (data, variables) => {
      // Invalidate order details and payments
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.payments(variables.orderId) });
      
      // Show success toast
      toast.success('Payment recorded successfully', {
        description: `Payment of $${variables.data.amount} recorded for order #${variables.orderId}`,
      });
    },
    onError: (error) => {
      // Show error toast
      toast.error('Failed to record payment', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};

// Test notification mutation (development only)
export const useTestOrderNotification = () => {
  return useMutation({
    mutationFn: (orderId?: string) => ordersService.testOrderNotification(orderId),
    onSuccess: () => {
      toast.success('Test notification sent');
    },
    onError: (error) => {
      toast.error('Failed to send test notification', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    },
  });
};