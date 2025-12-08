import { tenantApiClient } from '../tenant/tenantApiClient';
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
  private isDemoMode(): boolean {
    const token = localStorage.getItem('auth_token');
    return token?.startsWith('demo_token_') || false;
  }

  private getMockOrders(filters?: OrderFilters): PaginatedResponse<Order> {
    const mockOrders: Order[] = [
      {
        id: 'order-demo-001',
        uuid: 'demo-uuid-001',
        order_number: 'ORD-2024-001',
        customer: {
          id: 'customer-001',
          name: 'PT Demo Manufaktur',
          email: 'demo@customer.com',
          phone: '+62812-3456-7890'
        },
        vendor: {
          id: 'vendor-001',
          name: 'CV Etching Solutions',
          email: 'vendor@etching.com',
          contact_person: 'John Doe'
        },
        status: 'processing',
        total_amount: 15750000,
        subtotal_amount: 15000000,
        tax_amount: 750000,
        discount_amount: 0,
        paid_amount: 7500000,
        remaining_amount: 8250000,
        payment_status: 'partial',
        delivery_date: '2024-01-15',
        notes: 'Custom etching project - precision components',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-08T15:30:00Z'
      },
      {
        id: 'order-demo-002', 
        uuid: 'demo-uuid-002',
        order_number: 'ORD-2024-002',
        customer: {
          id: 'customer-002',
          name: 'CV Metalworks Indo',
          email: 'orders@metalworks.co.id',
          phone: '+62821-9876-5432'
        },
        vendor: {
          id: 'vendor-002',
          name: 'UD Precision Tools',
          email: 'info@precision.tools',
          contact_person: 'Jane Smith'
        },
        status: 'completed',
        total_amount: 23500000,
        subtotal_amount: 22500000,
        tax_amount: 1000000,
        discount_amount: 0,
        paid_amount: 23500000,
        remaining_amount: 0,
        payment_status: 'paid',
        delivery_date: '2024-01-10',
        notes: 'Industrial etching components delivered on time',
        created_at: '2023-12-15T09:00:00Z',
        updated_at: '2024-01-10T16:45:00Z'
      }
    ];

    // Apply basic filtering for demo
    let filteredOrders = mockOrders;
    if (filters?.status) {
      filteredOrders = mockOrders.filter(order => order.status === filters.status);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.order_number.toLowerCase().includes(search) ||
        order.customer.name.toLowerCase().includes(search)
      );
    }

    const page = filters?.page || 1;
    const perPage = filters?.per_page || 10;
    const total = filteredOrders.length;

    return {
      data: filteredOrders,
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: Math.ceil(total / perPage),
        from: (page - 1) * perPage + 1,
        to: Math.min(page * perPage, total)
      }
    };
  }

  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    // Demo mode fallback
    if (this.isDemoMode()) {
      console.log('Demo mode: Using mock orders data');
      return this.getMockOrders(filters);
    }

    try {
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

      const response = await tenantApiClient.get<PaginatedResponse<Order>>(
        `/orders?${params.toString()}`
      );
      return response;
    } catch (error) {
      console.warn('Orders API failed, falling back to demo data', error);
      return this.getMockOrders(filters);
    }
  }

  async getOrderById(id: string): Promise<Order> {
    // Demo mode fallback
    if (this.isDemoMode()) {
      console.log('Demo mode: Using mock order by ID');
      const mockData = this.getMockOrders();
      const order = mockData.data.find(o => o.id === id || o.uuid === id);
      if (order) {
        return order;
      }
      throw new Error('Demo order not found');
    }

    try {
      const response = await tenantApiClient.get<Order>(`/orders/${id}`);
      return response;
    } catch (error) {
      console.warn('Get order by ID API failed, trying demo fallback', error);
      const mockData = this.getMockOrders();
      const order = mockData.data.find(o => o.id === id || o.uuid === id);
      if (order) {
        return order;
      }
      throw error;
    }
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
}

export const ordersService = new OrdersService();
export default ordersService;
