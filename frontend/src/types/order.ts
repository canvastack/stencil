// PT CEX Business Cycle - Order Status Workflow
// ✅ ALIGNED WITH BACKEND: App\Domain\Order\Enums\OrderStatus
export enum OrderStatus {
  // Initial stages
  New = 'new',                         // New order received
  Draft = 'draft',                     // Order being prepared
  Pending = 'pending',                 // Pending review and approval
  
  // Vendor sourcing and negotiation phase  
  VendorSourcing = 'vendor_sourcing',         // Finding suitable vendor
  VendorNegotiation = 'vendor_negotiation',   // Negotiating with vendor
  
  // Customer quotation and approval phase
  CustomerQuote = 'customer_quote',           // Customer quote sent
  AwaitingPayment = 'awaiting_payment',       // Waiting for payment
  
  // Payment processing phase (DP 50% vs Full 100%)
  PartialPayment = 'partial_payment',         // DP 50% received - Account Payable
  FullPayment = 'full_payment',               // 100% payment - Account Receivable
  
  // Production and quality phase
  InProduction = 'in_production',             // Being produced by vendor
  QualityControl = 'quality_control',         // Quality inspection
  
  // Final delivery phase
  Shipping = 'shipping',                      // Being shipped
  Completed = 'completed',                    // Completed and delivered
  
  // Exception handling
  Cancelled = 'cancelled',                    // Order cancelled
  Refunded = 'refunded',                      // Order refunded
}

export enum ProductionType {
  Internal = 'internal',
  Vendor = 'vendor',
}

export enum PaymentType {
  DP50 = 'dp_50',     // DP Minimum 50% - Account Payable
  Full100 = 'full_100' // Full 100% Payment - Account Receivable
}

// ✅ ALIGNED WITH BACKEND: App\Domain\Order\Enums\PaymentStatus
export enum PaymentStatus {
  Unpaid = 'unpaid',                          // No payment received
  PartiallyPaid = 'partially_paid',           // Partial payment received
  Paid = 'paid',                              // Full payment received
  Refunded = 'refunded',                      // Payment refunded
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
  unitPrice: number; // Alias for price (customer price per unit)
  vendorCost?: number; // Cost from vendor per unit
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
  
  // Vendor Negotiation Fields (from backend OrderResource)
  vendorQuotedPrice?: number;   // Price quoted by vendor (from accepted quote)
  quotationAmount?: number;     // Final price to customer (vendor_quoted_price × 1.35)
  vendorTerms?: any;            // Terms from vendor quote
  activeQuotes?: number;        // Count of active quotes (status 'open' or 'countered')
  acceptedQuote?: string;       // UUID of accepted quote
  
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
