import { Order, OrderFilters, OrderStatus, ProductionType, PaymentStatus } from '@/types/order';
import ordersData from './data/orders.json';

let mockOrders: Order[] = [...ordersData];

export function getOrders(filters?: OrderFilters): Order[] {
  let filtered = [...mockOrders];

  if (!filters) return filtered;

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    filtered = filtered.filter(o => statuses.includes(o.status));
  }

  if (filters.paymentStatus) {
    const paymentStatuses = Array.isArray(filters.paymentStatus) ? filters.paymentStatus : [filters.paymentStatus];
    filtered = filtered.filter(o => paymentStatuses.includes(o.paymentStatus));
  }

  if (filters.productionType) {
    filtered = filtered.filter(o => o.productionType === filters.productionType);
  }

  if (filters.customerId) {
    filtered = filtered.filter(o => o.customerId === filters.customerId);
  }

  if (filters.vendorId) {
    filtered = filtered.filter(o => o.vendorId === filters.vendorId);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(o => new Date(o.orderDate) >= new Date(filters.dateFrom!));
  }

  if (filters.dateTo) {
    filtered = filtered.filter(o => new Date(o.orderDate) <= new Date(filters.dateTo!));
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(o => 
      o.orderNumber.toLowerCase().includes(searchLower) ||
      o.orderCode.toLowerCase().includes(searchLower) ||
      o.customerName.toLowerCase().includes(searchLower)
    );
  }

  if (filters.offset !== undefined) {
    filtered = filtered.slice(filters.offset);
  }

  if (filters.limit !== undefined) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(o => o.id === id);
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  return mockOrders.find(o => o.orderNumber === orderNumber);
}

export function createOrder(data: Partial<Order>): Order {
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: data.orderNumber || `ORD-${Date.now()}`,
    orderCode: data.orderCode || `${Date.now()}`,
    customerId: data.customerId || '',
    customerName: data.customerName || '',
    customerEmail: data.customerEmail || '',
    customerPhone: data.customerPhone || '',
    vendorId: data.vendorId,
    vendorName: data.vendorName,
    items: data.items || [],
    subtotal: data.subtotal || 0,
    tax: data.tax || 0,
    shippingCost: data.shippingCost || 0,
    discount: data.discount || 0,
    totalAmount: data.totalAmount || 0,
    status: data.status || OrderStatus.New,
    productionType: data.productionType || ProductionType.Internal,
    paymentStatus: data.paymentStatus || PaymentStatus.Unpaid,
    paymentMethod: data.paymentMethod,
    shippingAddress: data.shippingAddress || '',
    billingAddress: data.billingAddress,
    customerNotes: data.customerNotes,
    internalNotes: data.internalNotes,
    orderDate: data.orderDate || new Date().toISOString(),
    estimatedDelivery: data.estimatedDelivery,
    actualDelivery: data.actualDelivery,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockOrders.push(newOrder);
  return newOrder;
}

export function updateOrder(id: string, data: Partial<Order>): Order {
  const index = mockOrders.findIndex(o => o.id === id);
  if (index === -1) {
    throw new Error(`Order with id ${id} not found`);
  }
  
  const updatedOrder: Order = {
    ...mockOrders[index],
    ...data,
    id: mockOrders[index].id,
    updatedAt: new Date().toISOString(),
  };
  
  mockOrders[index] = updatedOrder;
  return updatedOrder;
}

export function updateOrderStatus(id: string, status: OrderStatus): Order {
  return updateOrder(id, { status });
}

export function updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Order {
  return updateOrder(id, { paymentStatus });
}

export function deleteOrder(id: string): boolean {
  const index = mockOrders.findIndex(o => o.id === id);
  if (index === -1) {
    return false;
  }
  
  mockOrders.splice(index, 1);
  return true;
}

export function getOrdersByCustomer(customerId: string): Order[] {
  return mockOrders.filter(o => o.customerId === customerId);
}

export function getOrdersByVendor(vendorId: string): Order[] {
  return mockOrders.filter(o => o.vendorId === vendorId);
}

export function resetOrders(): void {
  mockOrders = [];
}
