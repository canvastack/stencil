import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ordersService, OrderFilters, CreateOrderRequest, UpdateOrderRequest, OrderStateTransitionRequest, StageAdvancementRequest } from '../services/api/orders';
import { queryKeys, realtimeConfig, cacheUtils } from '../lib/react-query';
import { Order, OrderStatus } from '../types/order';
import { PaginatedResponse } from '../types/api';
import { BusinessStage, OrderProgressCalculator } from '../utils/OrderProgressCalculator';
import { OrderStatusMessaging } from '../utils/OrderStatusMessaging';
import OptimisticUpdateManager from '../utils/OptimisticUpdateManager';

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

// Update order mutation with enhanced optimistic updates
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  // Get a fresh instance for each hook usage to avoid singleton issues in tests
  const optimisticManager = new OptimisticUpdateManager(queryClient);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) => 
      ordersService.updateOrder(id, data),
    onMutate: async ({ id, data }) => {
      try {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });

        // Get current order
        const currentOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));
        if (!currentOrder) {
          throw new Error('Order not found for optimistic update');
        }

        // Check if this is a status change that needs optimistic handling
        if (data.status && data.status !== currentOrder.status) {
          const currentProgress = OrderProgressCalculator.calculateProgress(currentOrder.status as OrderStatus);
          const targetStatus = data.status as OrderStatus;
          const targetStage = OrderProgressCalculator.mapStatusToStage(targetStatus);

          // Apply optimistic update for status changes
          const optimisticResult = await optimisticManager.applyOptimisticStatusUpdate({
            orderId: id,
            operation: 'status_change',
            fromState: {
              status: currentOrder.status as OrderStatus,
              stage: currentProgress.currentStage,
              updatedAt: currentOrder.updated_at,
            },
            toState: {
              status: targetStatus,
              stage: targetStage,
              metadata: data,
            },
            userFeedback: {
              showProgress: true,
              progressMessage: 'Updating Order',
              successMessage: 'Order updated successfully',
            },
          });

          return { optimisticResult, isStatusChange: true };
        } else {
          // For non-status changes, use simple optimistic update
          const updatedOrder = { 
            ...currentOrder, 
            ...data, 
            updated_at: new Date().toISOString() 
          };
          queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);

          return { previousOrder: currentOrder, isStatusChange: false };
        }

      } catch (error) {
        console.error('Failed to apply optimistic update:', error);
        
        // Fallback to basic optimistic update
        const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));
        if (previousOrder) {
          const updatedOrder = { ...previousOrder, ...data, updated_at: new Date().toISOString() };
          queryClient.setQueryData(queryKeys.orders.detail(id), updatedOrder);
        }

        return { previousOrder, fallback: true };
      }
    },
    onSuccess: (data, variables, context) => {
      try {
        if (context?.optimisticResult && context.isStatusChange) {
          // Confirm optimistic update with server response
          optimisticManager.confirmUpdate(context.optimisticResult.updateId, data);
        } else {
          // Handle non-status changes or fallback
          queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
          
          if (!context?.fallback) {
            toast.success('Order updated successfully', {
              description: `Order #${data.id} has been updated`,
            });
          }
        }

        // Invalidate all order list queries (including filtered ones)
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

      } catch (error) {
        console.error('Error in update success handler:', error);
        
        // Fallback to basic cache update
        queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      }
    },
    onError: (error, variables, context) => {
      try {
        if (context?.optimisticResult && context.isStatusChange) {
          // Handle optimistic update error
          optimisticManager.handleUpdateError(
            context.optimisticResult.updateId,
            error instanceof Error ? error : new Error(String(error)),
            context.optimisticResult.context
          );
        } else if (context?.previousOrder) {
          // Rollback simple optimistic update
          queryClient.setQueryData(queryKeys.orders.detail(variables.id), context.previousOrder);
          
          toast.error('Failed to update order', {
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
        }

      } catch (handlingError) {
        console.error('Error in update error handler:', handlingError);
        
        // Ultimate fallback
        toast.error('Failed to update order', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      }
    },
  });
};

// Transition order state mutation with enhanced optimistic updates
export const useTransitionOrderState = () => {
  const queryClient = useQueryClient();
  // Get a fresh instance for each hook usage to avoid singleton issues in tests
  const optimisticManager = new OptimisticUpdateManager(queryClient);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderStateTransitionRequest }) => 
      ordersService.transitionOrderState(id, data),
    onMutate: async ({ id, data }) => {
      try {
        // Get current order
        const currentOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));
        if (!currentOrder) {
          throw new Error('Order not found for optimistic update');
        }

        const currentProgress = OrderProgressCalculator.calculateProgress(currentOrder.status as OrderStatus);
        
        // Determine target stage from action
        let targetStage: BusinessStage;
        let targetStatus: OrderStatus;

        // Parse action to determine target stage
        if (data.action.startsWith('advance_to_')) {
          const stageString = data.action.replace('advance_to_', '');
          targetStage = stageString as BusinessStage;
          targetStatus = OrderProgressCalculator.mapStageToStatus(targetStage);
        } else {
          // Fallback to next stage
          targetStage = currentProgress.nextStage || currentProgress.currentStage;
          targetStatus = OrderProgressCalculator.mapStageToStatus(targetStage);
        }

        // Apply optimistic update
        const optimisticResult = await optimisticManager.applyOptimisticStatusUpdate({
          orderId: id,
          operation: 'status_change',
          fromState: {
            status: currentOrder.status as OrderStatus,
            stage: currentProgress.currentStage,
            updatedAt: currentOrder.updated_at,
          },
          toState: {
            status: targetStatus,
            stage: targetStage,
            notes: data.notes,
          },
          userFeedback: {
            showProgress: true,
            progressMessage: 'Transitioning Order State',
            successMessage: `Order transitioned to ${OrderProgressCalculator.getStageInfo(targetStage).indonesianLabel}`,
          },
        });

        // Create optimistic timeline entry
        const optimisticTimelineEntry = optimisticManager.createOptimisticTimelineEntry(
          id,
          targetStage,
          data.notes
        );

        // Update timeline cache
        const timelineRollback = optimisticManager.updateTimelineCache(id, optimisticTimelineEntry);

        return { optimisticResult, timelineRollback, targetStage };

      } catch (error) {
        console.error('Failed to apply optimistic update:', error);
        
        // Fallback to basic optimistic update
        await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });
        const previousOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));

        return { previousOrder, fallback: true };
      }
    },
    onSuccess: (data, variables, context) => {
      try {
        if (context?.optimisticResult) {
          // Confirm optimistic update with server response
          optimisticManager.confirmUpdate(context.optimisticResult.updateId, data);
        } else {
          // Handle fallback case
          queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
          
          toast.success('Order status updated', {
            description: `Order #${data.id} status changed to ${data.status}`,
          });
        }

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.history(variables.id) });

      } catch (error) {
        console.error('Error in transition success handler:', error);
        
        // Fallback to basic cache update
        queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      }
    },
    onError: (error, variables, context) => {
      try {
        if (context?.optimisticResult) {
          // Handle optimistic update error
          optimisticManager.handleUpdateError(
            context.optimisticResult.updateId,
            error instanceof Error ? error : new Error(String(error)),
            context.optimisticResult.context
          );

          // Rollback timeline changes
          if (context.timelineRollback) {
            context.timelineRollback();
          }
        } else if (context?.previousOrder) {
          // Rollback simple optimistic update
          queryClient.setQueryData(queryKeys.orders.detail(variables.id), context.previousOrder);
          
          toast.error('Failed to update order status', {
            description: error instanceof Error ? error.message : 'An unexpected error occurred',
          });
        }

      } catch (handlingError) {
        console.error('Error in transition error handler:', handlingError);
        
        // Ultimate fallback
        toast.error('Failed to update order status', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      }
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

// Advance order stage mutation with enhanced optimistic updates
export const useAdvanceOrderStage = () => {
  const queryClient = useQueryClient();
  // Get a fresh instance for each hook usage to avoid singleton issues in tests
  const optimisticManager = new OptimisticUpdateManager(queryClient);

  return useMutation({
    mutationFn: ({ 
      id, 
      targetStage, 
      notes, 
      requirements 
    }: { 
      id: string; 
      targetStage: string; 
      notes: string; 
      requirements?: Record<string, boolean> 
    }) => ordersService.advanceOrderStage(id, targetStage, notes, requirements),
    
    onMutate: async ({ id, targetStage, notes }) => {
      try {
        // Get current order to determine from state
        const currentOrder = queryClient.getQueryData<Order>(queryKeys.orders.detail(id));
        if (!currentOrder) {
          throw new Error('Order not found for optimistic update');
        }

        const currentProgress = OrderProgressCalculator.calculateProgress(currentOrder.status as OrderStatus);
        const targetStageEnum = targetStage as BusinessStage;
        const targetStatus = OrderProgressCalculator.mapStageToStatus(targetStageEnum);

        // Apply optimistic update with enhanced feedback
        const optimisticResult = await optimisticManager.applyOptimisticStatusUpdate({
          orderId: id,
          operation: 'stage_advance',
          fromState: {
            status: currentOrder.status as OrderStatus,
            stage: currentProgress.currentStage,
            updatedAt: currentOrder.updated_at,
          },
          toState: {
            status: targetStatus,
            stage: targetStageEnum,
            notes,
          },
          userFeedback: {
            showProgress: true,
            progressMessage: 'Advancing Order Stage',
            successMessage: `Advanced to ${OrderProgressCalculator.getStageInfo(targetStageEnum).indonesianLabel}`,
          },
        });

        // Create optimistic timeline entry
        const optimisticTimelineEntry = optimisticManager.createOptimisticTimelineEntry(
          id,
          targetStageEnum,
          notes
        );

        // Update timeline cache
        const timelineRollback = optimisticManager.updateTimelineCache(id, optimisticTimelineEntry);

        return {
          optimisticResult,
          timelineRollback,
          targetStage: targetStageEnum,
        };

      } catch (error) {
        console.error('Failed to apply optimistic update:', error);
        
        // Fallback to basic progress indicator
        OrderStatusMessaging.showProgressIndicator(`advance-${id}`, {
          title: 'Advancing Order Stage',
          description: `Updating order to ${OrderProgressCalculator.getStageInfo(targetStage as BusinessStage)?.indonesianLabel || targetStage}...`,
          estimatedDuration: 3000,
        });

        return { fallbackProgressId: `advance-${id}` };
      }
    },
    
    onSuccess: (data, variables, context) => {
      try {
        if (context?.optimisticResult) {
          // Confirm optimistic update with server response
          optimisticManager.confirmUpdate(context.optimisticResult.updateId, data);
        } else if (context?.fallbackProgressId) {
          // Handle fallback case
          OrderStatusMessaging.dismissProgressIndicator(context.fallbackProgressId);
          
          // Update cache with server response
          queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
          
          // Show success message
          OrderStatusMessaging.showStageAdvancementSuccess(
            variables.targetStage as BusinessStage,
            variables.notes,
            { important: true }
          );
        }

        // Invalidate related queries to ensure consistency
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.history(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });

      } catch (error) {
        console.error('Error in onSuccess handler:', error);
        
        // Fallback to basic cache update
        queryClient.setQueryData(queryKeys.orders.detail(variables.id), data);
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      }
    },
    
    onError: (error, variables, context) => {
      try {
        if (context?.optimisticResult) {
          // Handle optimistic update error
          optimisticManager.handleUpdateError(
            context.optimisticResult.updateId,
            error instanceof Error ? error : new Error(String(error)),
            context.optimisticResult.context
          );

          // Rollback timeline changes
          if (context.timelineRollback) {
            context.timelineRollback();
          }
        } else if (context?.fallbackProgressId) {
          // Handle fallback error
          OrderStatusMessaging.dismissProgressIndicator(context.fallbackProgressId);
          
          OrderStatusMessaging.showStageAdvancementError(
            error instanceof Error ? error : new Error(String(error)),
            variables.targetStage as BusinessStage,
            {
              orderId: variables.id,
              notes: variables.notes,
              requirements: variables.requirements
            }
          );
        }

      } catch (handlingError) {
        console.error('Error in error handler:', handlingError);
        
        // Ultimate fallback
        toast.error('Failed to advance order stage', {
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
      }
      
      console.error('Stage advancement error:', {
        orderId: variables.id,
        targetStage: variables.targetStage,
        error: error instanceof Error ? error.message : error,
        fullError: error
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