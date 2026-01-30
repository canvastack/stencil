import { tenantApiClient } from '../tenant/tenantApiClient';
import { Order, OrderStatus, PaymentStatus, PaymentType, PaymentMethod, ProductionType } from '@/types/order';
import { PaginatedResponse, ListRequestParams } from '@/types/api';
import { orderNotificationService } from '../notifications/orderNotificationService';
import { anonymousApiClient } from './anonymousApiClient';

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

export interface StageAdvancementRequest {
  target_stage: string;
  notes: string;
  requirements?: Record<string, boolean>;
  metadata?: Record<string, any>;
}

class OrdersService {

  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    // Debug authentication and tenant context
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    const accountType = localStorage.getItem('account_type');
    
    console.log('🔍 [OrdersService] Debug authentication:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tenantId,
      accountType,
      localStorage: {
        auth_token: localStorage.getItem('auth_token'),
        tenant_id: localStorage.getItem('tenant_id'),
        account_type: localStorage.getItem('account_type')
      }
    });

    // CRITICAL: Check if user is authenticated
    if (!token) {
      console.error('❌ [OrdersService] No authentication token found');
      throw new Error('Authentication required. Please log in.');
    }

    if (accountType !== 'tenant') {
      console.error('❌ [OrdersService] Invalid account type for tenant API:', accountType);
      throw new Error('Tenant account required for this operation.');
    }

    if (!tenantId) {
      console.error('❌ [OrdersService] No tenant ID found');
      throw new Error('Tenant context required. Please log in again.');
    }

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

    console.log('🚀 [OrdersService] Making API call to:', `/orders?${params.toString()}`);

    try {
      const response = await tenantApiClient.get<PaginatedResponse<Order>>(
        `/orders?${params.toString()}`
      );
      
      console.log('✅ [OrdersService] API response received:', {
        dataLength: response.data?.length,
        total: response.total,
        currentPage: response.current_page,
        response
      });
      
      return response;
    } catch (error: any) {
      console.error('❌ [OrdersService] API call failed:', {
        error: error.message,
        status: error.status,
        details: error.details,
        originalError: error
      });
      
      // If authentication error, clear invalid tokens
      if (error.status === 401) {
        console.warn('🔄 [OrdersService] Authentication failed, clearing tokens');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('account_type');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant');
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      throw error;
    }
  }

  async getOrderById(id: string): Promise<Order> {
    const response = await tenantApiClient.get<Order>(`/orders/${id}`);
    return response;
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await tenantApiClient.post<Order>('/orders', data);
    return response;
  }

  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    // Get current order to track status change
    const currentOrder = await this.getOrderById(id);
    const previousStatus = currentOrder.status;

    const response = await tenantApiClient.put<Order>(`/orders/${id}`, data);
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
    const response = await tenantApiClient.delete<{ message: string }>(`/orders/${id}`);
    return response;
  }

  async transitionOrderState(
    id: string,
    data: OrderStateTransitionRequest
  ): Promise<Order> {
    // Get current order to track status change
    const currentOrder = await this.getOrderById(id);
    const previousStatus = currentOrder.status;

    const response = await tenantApiClient.post<Order>(`/orders/${id}/transition-state`, data);
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

  /**
   * Advance order to specific business stage
   * Enhanced API integration for stage advancement workflow
   */
  async advanceOrderStage(
    id: string,
    targetStage: string,
    notes: string,
    requirements?: Record<string, boolean>
  ): Promise<Order> {
    // Get current order to track status change
    const currentOrder = await this.getOrderById(id);
    const previousStatus = currentOrder.status;

    // Prepare advancement data
    const advancementData = {
      action: 'advance_stage',
      target_stage: targetStage,
      notes: notes,
      requirements: requirements || {},
      metadata: {
        advanced_by: localStorage.getItem('user_id') || 'system',
        advanced_at: new Date().toISOString(),
        previous_status: previousStatus,
      }
    };

    console.log('🚀 [OrdersService] Advancing order stage:', {
      orderId: id,
      targetStage,
      notes,
      requirements,
      advancementData
    });

    try {
      const response = await tenantApiClient.post<Order>(`/orders/${id}/advance-stage`, advancementData);
      const updatedOrder = response;

      console.log('✅ [OrdersService] Stage advancement successful:', {
        orderId: id,
        previousStatus,
        newStatus: updatedOrder.status,
        targetStage
      });

      // Send notification for stage advancement
      try {
        await orderNotificationService.sendOrderStatusNotification({
          orderId: id,
          previousStatus: previousStatus,
          newStatus: updatedOrder.status,
          customerName: updatedOrder.customer?.name || 'Unknown Customer',
          orderTotal: updatedOrder.total,
          notificationChannels: ['inApp', 'email'],
          metadata: {
            action: 'stage_advancement',
            targetStage,
            updatedBy: localStorage.getItem('user_id') || 'system',
            timestamp: new Date().toISOString(),
            notes,
            requirements,
          },
        });
      } catch (notificationError) {
        console.warn('Failed to send stage advancement notification:', notificationError);
        // Don't fail the advancement if notification fails
      }

      return response;
    } catch (error: any) {
      console.error('❌ [OrdersService] Stage advancement failed:', {
        orderId: id,
        targetStage,
        error: error.message,
        status: error.status,
        details: error.details
      });

      // Enhanced error handling with specific error messages
      if (error.status === 422) {
        throw new Error(`Stage advancement validation failed: ${error.details?.message || 'Invalid stage transition'}`);
      } else if (error.status === 403) {
        throw new Error('You do not have permission to advance this order stage');
      } else if (error.status === 404) {
        throw new Error('Order not found or stage advancement endpoint not available');
      } else if (error.status === 409) {
        throw new Error('Stage advancement conflict: Order may have been updated by another user');
      } else {
        throw new Error(`Stage advancement failed: ${error.message || 'An unexpected error occurred'}`);
      }
    }
  }

  async getOrderHistory(id: string): Promise<any[]> {
    const response = await tenantApiClient.get<any[]>(`/orders/${id}/history`);
    return response;
  }

  async getOrderPayments(id: string): Promise<any[]> {
    const response = await tenantApiClient.get<any[]>(`/orders/${id}/payments`);
    return response;
  }

  async getOrderShipments(id: string): Promise<any[]> {
    const response = await tenantApiClient.get<any[]>(`/orders/${id}/shipments`);
    return response;
  }

  async recordPayment(
    orderId: string,
    data: { amount: number; method: string; notes?: string }
  ): Promise<any> {
    const response = await tenantApiClient.post(`/orders/${orderId}/payments`, data);
    return response;
  }

  /**
   * Test order status notification (development only)
   */
  async testOrderNotification(orderId: string = 'TEST-001'): Promise<void> {
    await orderNotificationService.sendTestOrderNotification(orderId);
  }

  /**
   * Submit order form from public product page
   * This endpoint creates both customer and order records
   */
  async submitOrderForm(
    productUuid: string,
    formData: Record<string, any>
  ): Promise<{
    message: string;
    data: {
      order_uuid: string;
      order_number: string;
      submission_uuid: string;
      customer_uuid: string;
      submitted_at: string;
    };
  }> {
    const response = await anonymousApiClient.post<{
      message: string;
      data: {
        order_uuid: string;
        order_number: string;
        submission_uuid: string;
        customer_uuid: string;
        submitted_at: string;
      };
    }>(`/public/products/${productUuid}/form-submission`, formData);

    return response;
  }
}

export const ordersService = new OrdersService();
export default ordersService;
