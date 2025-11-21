import apiClient from './client';
import { Order } from '@/types/order';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import { orderNotificationService } from '../notifications/orderNotificationService';

export interface OrderFilters extends ListRequestParams {
  status?: string;
  customer_id?: string;
  vendor_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface CreateOrderRequest {
  customer_id: string;
  items: OrderItem[];
  notes?: string;
}

export interface OrderItem {
  product_id: string;
  quantity: number;
  price: number;
}

export interface UpdateOrderRequest {
  status?: string;
  notes?: string;
}

export interface OrderStateTransitionRequest {
  action: string;
  notes?: string;
  data?: Record<string, any>;
}

class OrdersService {
  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.per_page) params.append('per_page', filters.per_page.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.order) params.append('order', filters.order);
      if (filters.status) params.append('status', filters.status);
      if (filters.customer_id) params.append('customer_id', filters.customer_id);
      if (filters.vendor_id) params.append('vendor_id', filters.vendor_id);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
    }

    const response = await apiClient.get<PaginatedResponse<Order>>(
      `/orders?${params.toString()}`
    );
    return response;
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response;
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return response;
  }

  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    // Get current order to track status change
    const currentOrder = await this.getOrderById(id);
    const previousStatus = currentOrder.status;

    const response = await apiClient.put<Order>(`/orders/${id}`, data);
    const updatedOrder = response;

    // If status changed, send notification
    if (data.status && data.status !== previousStatus) {
      try {
        await orderNotificationService.sendOrderStatusNotification({
          orderId: id,
          previousStatus: previousStatus,
          newStatus: data.status,
          customerName: updatedOrder.customer?.name || 'Unknown Customer',
          orderTotal: updatedOrder.total,
          notificationChannels: ['inApp', 'email'],
          metadata: {
            updatedBy: localStorage.getItem('user_id') || 'system',
            timestamp: new Date().toISOString(),
            notes: data.notes,
          },
        });
      } catch (notificationError) {
        console.warn('Failed to send order status notification:', notificationError);
        // Don't fail the order update if notification fails
      }
    }

    return response;
  }

  async deleteOrder(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/orders/${id}`);
    return response;
  }

  async transitionOrderState(
    id: string,
    data: OrderStateTransitionRequest
  ): Promise<Order> {
    // Get current order to track status change
    const currentOrder = await this.getOrderById(id);
    const previousStatus = currentOrder.status;

    const response = await apiClient.post<Order>(`/orders/${id}/transition-state`, data);
    const updatedOrder = response;

    // Send notification for state transition
    try {
      await orderNotificationService.sendOrderStatusNotification({
        orderId: id,
        previousStatus: previousStatus,
        newStatus: updatedOrder.status,
        customerName: updatedOrder.customer?.name || 'Unknown Customer',
        orderTotal: updatedOrder.total,
        notificationChannels: ['inApp', 'email'],
        metadata: {
          action: data.action,
          updatedBy: localStorage.getItem('user_id') || 'system',
          timestamp: new Date().toISOString(),
          notes: data.notes,
          transitionData: data.data,
        },
      });
    } catch (notificationError) {
      console.warn('Failed to send order transition notification:', notificationError);
      // Don't fail the transition if notification fails
    }

    return response;
  }

  async getOrderHistory(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/orders/${id}/history`);
    return response;
  }

  async getOrderPayments(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/orders/${id}/payments`);
    return response;
  }

  async getOrderShipments(id: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/orders/${id}/shipments`);
    return response;
  }

  async recordPayment(
    orderId: string,
    data: { amount: number; method: string; notes?: string }
  ): Promise<any> {
    const response = await apiClient.post(`/orders/${orderId}/payments`, data);
    return response;
  }

  /**
   * Test order status notification (development only)
   */
  async testOrderNotification(orderId: string = 'TEST-001'): Promise<void> {
    await orderNotificationService.sendTestOrderNotification(orderId);
  }
}

export const ordersService = new OrdersService();
export default ordersService;
