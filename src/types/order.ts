export enum OrderStatus {
  New = 'new',
  SourcingVendor = 'sourcing_vendor',
  VendorNegotiation = 'vendor_negotiation',
  CustomerQuotation = 'customer_quotation',
  WaitingPayment = 'waiting_payment',
  PaymentReceived = 'payment_received',
  InProduction = 'in_production',
  QualityCheck = 'quality_check',
  ReadyToShip = 'ready_to_ship',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum ProductionType {
  Internal = 'internal',
  Vendor = 'vendor',
}

export enum PaymentStatus {
  Unpaid = 'unpaid',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Refunded = 'refunded',
  Cancelled = 'cancelled',
}

export enum PaymentMethod {
  Cash = 'cash',
  BankTransfer = 'bank_transfer',
  CreditCard = 'credit_card',
  Midtrans = 'midtrans',
  Xendit = 'xendit',
  Other = 'other',
}

export interface OrderItemCustomization {
  size?: string;
  material?: string;
  color?: string;
  customText?: string;
  design?: string;
  [key: string]: any;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
  customization?: OrderItemCustomization;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vendorId?: string;
  vendorName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  productionType: ProductionType;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  shippingAddress: string;
  billingAddress?: string;
  customerNotes?: string;
  internalNotes?: string;
  orderDate: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder extends Order {
  vendorPrice?: number;
  vendorNotes?: string;
  vendorQuotationId?: string;
  customerQuotationId?: string;
  profitMargin?: number;
  profitAmount?: number;
}

export interface OrderFilters {
  status?: OrderStatus | OrderStatus[];
  paymentStatus?: PaymentStatus | PaymentStatus[];
  productionType?: ProductionType;
  customerId?: string;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}
