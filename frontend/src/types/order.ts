// PT CEX Business Cycle - 12 Status Workflow
export enum OrderStatus {
  // Initial stage - Admin input order from customer
  Draft = 'draft',
  Pending = 'pending',
  
  // Vendor sourcing and negotiation phase  
  VendorSourcing = 'vendor_sourcing',
  VendorNegotiation = 'vendor_negotiation',
  
  // Customer quotation and approval phase
  CustomerQuote = 'customer_quote', 
  AwaitingPayment = 'awaiting_payment',
  
  // Payment processing phase (DP 50% vs Full 100%)
  PartialPayment = 'partial_payment',  // DP 50% - Account Payable
  FullPayment = 'full_payment',        // 100% - Account Receivable
  
  // Production and quality phase
  InProduction = 'in_production',
  QualityControl = 'quality_control',
  
  // Final delivery phase
  Shipping = 'shipping',
  Completed = 'completed',
  
  // Exception handling
  Cancelled = 'cancelled',
  Refunded = 'refunded',
}

export enum ProductionType {
  Internal = 'internal',
  Vendor = 'vendor',
}

export enum PaymentType {
  DP50 = 'dp_50',     // DP Minimum 50% - Account Payable
  Full100 = 'full_100' // Full 100% Payment - Account Receivable
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
  uuid: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vendorId?: string;
  vendorName?: string;
  items: OrderItem[];
  
  // PT CEX Business Cycle - Financial Fields
  vendorCost?: number;          // Cost from vendor
  customerPrice?: number;       // Price to customer  
  markupAmount?: number;        // Profit margin
  totalAmount: number;
  paymentType?: PaymentType;    // DP 50% vs Full 100%
  paidAmount: number;
  remainingAmount: number;
  
  // Status and workflow
  status: OrderStatus;
  productionType: ProductionType;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  
  // Delivery information
  shippingAddress: string;
  billingAddress?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  
  // Production timeline
  productionStart?: string;
  productionEnd?: string;
  
  // Notes and communication
  customerNotes?: string;
  vendorNotes?: string;
  internalNotes?: string;
  
  // Audit fields
  createdBy: string;
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
