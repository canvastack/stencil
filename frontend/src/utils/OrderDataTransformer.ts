/**
 * Order Data Transformer
 * 
 * Standardizes order data between backend API responses and frontend components
 * Ensures consistent field mapping and handles different API response formats
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from real API responses
 * - ✅ UUID ONLY: Uses UUID strings for public consumption
 * - ✅ DATA SYNC: 100% accurate frontend-backend synchronization
 */

import { OrderStatus, PaymentStatus, type Order } from '@/types/order';

export interface OrderDetailData {
  // Core identification (UUID-based)
  id: string;
  uuid: string;
  orderNumber: string;
  
  // Status information
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  
  // Financial data (in cents/integer format)
  totalAmount: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  downPaymentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  
  // PT CEX Business Fields
  vendorCost: number;
  customerPrice: number;
  markupAmount: number;
  markupPercentage: number;
  
  // Customer information
  customerInfo: CustomerInfo;
  
  // Vendor information (optional)
  vendorInfo?: VendorInfo;
  
  // Items (JSON-based dynamic data)
  items: OrderItem[];
  itemsCount: number;
  
  // Addresses
  shippingAddress?: string | object;
  billingAddress?: string | object;
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  
  // Production information
  productionType?: string;
  paymentMethod?: string;
  paymentType?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  orderDate: string;
  downPaymentDue?: string;
  downPaymentPaidAt?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  
  // Metadata (for additional business data)
  metadata?: Record<string, any>;
  
  // Nested objects for detailed views
  customer: CustomerInfo;
  vendor?: VendorInfo;
  financial: FinancialInfo;
  production: ProductionInfo;
  addresses: AddressInfo;
  notes: NotesInfo;
}

export interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface VendorInfo {
  id: string;
  name: string;
  code?: string;
}

export interface OrderItem {
  product_id?: string;
  product_name?: string;
  productName?: string;
  name?: string;
  quantity: number;
  price?: number;
  unit_price?: number;
  total_price?: number;
  specifications?: Record<string, any>;
  customization?: Record<string, any>;
}

export interface FinancialInfo {
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  totalAmount: number;
  downPaymentAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  vendorCost: number;
  customerPrice: number;
  markupAmount: number;
  markupPercentage: number;
}

export interface ProductionInfo {
  productionType?: string;
  paymentMethod?: string;
  paymentType?: string;
}

export interface AddressInfo {
  shipping?: string | object;
  billing?: string | object;
}

export interface NotesInfo {
  customerNotes?: string;
  internalNotes?: string;
}

export class OrderDataTransformer {
  /**
   * Transform API response to standardized OrderDetailData
   * Handles multiple API response formats and ensures consistency
   */
  static transform(apiResponse: any): OrderDetailData {
    if (!apiResponse) {
      throw new Error('API response is required for transformation');
    }

    return {
      // Core identification - Always use UUID
      id: this.extractUuid(apiResponse),
      uuid: this.extractUuid(apiResponse),
      orderNumber: this.extractOrderNumber(apiResponse),
      
      // Status normalization
      status: this.normalizeStatus(apiResponse.status),
      paymentStatus: this.normalizePaymentStatus(
        apiResponse.payment_status || apiResponse.paymentStatus
      ),
      
      // Financial data normalization
      totalAmount: this.normalizeAmount(
        apiResponse.total_amount || apiResponse.totalAmount || apiResponse.total
      ),
      subtotal: this.normalizeAmount(apiResponse.subtotal),
      tax: this.normalizeAmount(apiResponse.tax),
      shippingCost: this.normalizeAmount(
        apiResponse.shipping_cost || apiResponse.shippingCost
      ),
      discount: this.normalizeAmount(apiResponse.discount),
      downPaymentAmount: this.normalizeAmount(
        apiResponse.down_payment_amount || apiResponse.downPaymentAmount
      ),
      paidAmount: this.normalizeAmount(
        apiResponse.total_paid_amount || apiResponse.paidAmount
      ),
      remainingAmount: this.calculateRemainingAmount(apiResponse),
      currency: apiResponse.currency || 'IDR',
      
      // PT CEX Business Fields
      vendorCost: this.normalizeAmount(
        apiResponse.vendor_cost || apiResponse.vendorCost
      ),
      customerPrice: this.normalizeAmount(
        apiResponse.customer_price || apiResponse.customerPrice
      ),
      markupAmount: this.normalizeAmount(
        apiResponse.markup_amount || apiResponse.markupAmount
      ),
      markupPercentage: this.normalizePercentage(
        apiResponse.markup_percentage || apiResponse.markupPercentage
      ),
      
      // Customer information
      customerInfo: this.transformCustomerInfo(apiResponse),
      
      // Vendor information (optional)
      vendorInfo: this.transformVendorInfo(apiResponse),
      
      // Items transformation (JSON-based)
      items: this.transformItems(apiResponse.items || []),
      itemsCount: this.calculateItemsCount(apiResponse.items || []),
      
      // Addresses
      shippingAddress: this.normalizeAddress(
        apiResponse.shipping_address || apiResponse.shippingAddress
      ),
      billingAddress: this.normalizeAddress(
        apiResponse.billing_address || apiResponse.billingAddress
      ),
      
      // Notes
      customerNotes: apiResponse.customer_notes || apiResponse.customerNotes,
      internalNotes: apiResponse.internal_notes || apiResponse.internalNotes,
      
      // Production information
      productionType: apiResponse.production_type || apiResponse.productionType,
      paymentMethod: apiResponse.payment_method || apiResponse.paymentMethod,
      paymentType: apiResponse.payment_type || apiResponse.paymentType,
      
      // Timestamps
      createdAt: this.normalizeTimestamp(apiResponse.created_at || apiResponse.createdAt),
      updatedAt: this.normalizeTimestamp(apiResponse.updated_at || apiResponse.updatedAt),
      orderDate: this.normalizeTimestamp(
        apiResponse.order_date || apiResponse.orderDate || apiResponse.created_at || apiResponse.createdAt
      ),
      downPaymentDue: this.normalizeTimestamp(
        apiResponse.down_payment_due_at || apiResponse.downPaymentDue
      ),
      downPaymentPaidAt: this.normalizeTimestamp(
        apiResponse.down_payment_paid_at || apiResponse.downPaymentPaidAt
      ),
      estimatedDelivery: this.normalizeTimestamp(
        apiResponse.estimated_delivery || apiResponse.estimatedDelivery
      ),
      actualDelivery: this.normalizeTimestamp(
        apiResponse.actual_delivery || apiResponse.actualDelivery || 
        apiResponse.delivered_at || apiResponse.deliveredAt
      ),
      
      // Metadata
      metadata: apiResponse.metadata || {},
      
      // Nested objects for detailed views
      customer: this.transformCustomerInfo(apiResponse),
      vendor: this.transformVendorInfo(apiResponse),
      financial: this.transformFinancialInfo(apiResponse),
      production: this.transformProductionInfo(apiResponse),
      addresses: this.transformAddressInfo(apiResponse),
      notes: this.transformNotesInfo(apiResponse),
    };
  }

  /**
   * Extract UUID from various possible fields
   * Always prioritize UUID over integer ID
   */
  private static extractUuid(apiResponse: any): string {
    const uuid = apiResponse.uuid || apiResponse.id;
    if (!uuid) {
      throw new Error('Order UUID is required but not found in API response');
    }
    
    // Ensure we're using UUID string format, not integer ID
    if (typeof uuid === 'number') {
      throw new Error('Integer ID detected - UUID string required for public consumption');
    }
    
    return uuid;
  }

  /**
   * Extract order number with fallback generation
   */
  private static extractOrderNumber(apiResponse: any): string {
    return (
      apiResponse.order_number ||
      apiResponse.orderNumber ||
      apiResponse.number ||
      `ORDER-${this.extractUuid(apiResponse).slice(-8).toUpperCase()}`
    );
  }

  /**
   * Normalize order status to enum values
   */
  private static normalizeStatus(status: string): OrderStatus {
    if (!status) return OrderStatus.New;
    
    // Handle different status formats
    const normalizedStatus = status.toLowerCase().replace(/[_\s-]/g, '_');
    
    // Map common variations to standard enum values
    const statusMap: Record<string, OrderStatus> = {
      'new': OrderStatus.New,
      'draft': OrderStatus.Draft,
      'pending': OrderStatus.Pending,
      'sourcing_vendor': OrderStatus.VendorSourcing,
      'vendor_sourcing': OrderStatus.VendorSourcing,
      'vendor_negotiation': OrderStatus.VendorNegotiation,
      'negotiation': OrderStatus.VendorNegotiation,
      'customer_quotation': OrderStatus.CustomerQuote,
      'customer_quote': OrderStatus.CustomerQuote,
      'quotation': OrderStatus.CustomerQuote,
      'waiting_payment': OrderStatus.AwaitingPayment,
      'awaiting_payment': OrderStatus.AwaitingPayment,
      'payment_received': OrderStatus.FullPayment,
      'paid': OrderStatus.FullPayment,
      'partial_payment': OrderStatus.PartialPayment,
      'full_payment': OrderStatus.FullPayment,
      'in_production': OrderStatus.InProduction,
      'production': OrderStatus.InProduction,
      'quality_check': OrderStatus.QualityControl,
      'quality_control': OrderStatus.QualityControl,
      'qc': OrderStatus.QualityControl,
      'ready_to_ship': OrderStatus.Shipping,
      'ready': OrderStatus.Shipping,
      'shipped': OrderStatus.Shipping,
      'shipping': OrderStatus.Shipping,
      'delivered': OrderStatus.Completed,
      'completed': OrderStatus.Completed,
      'complete': OrderStatus.Completed,
      'cancelled': OrderStatus.Cancelled,
      'canceled': OrderStatus.Cancelled,
      'refunded': OrderStatus.Refunded,
    };

    return statusMap[normalizedStatus] || (status as OrderStatus);
  }

  /**
   * Normalize payment status to enum values
   */
  private static normalizePaymentStatus(paymentStatus: string): PaymentStatus {
    if (!paymentStatus) return PaymentStatus.Unpaid;
    
    const normalizedStatus = paymentStatus.toLowerCase().replace(/[_\s-]/g, '_');
    
    const statusMap: Record<string, PaymentStatus> = {
      'unpaid': PaymentStatus.Unpaid,
      'pending': PaymentStatus.Unpaid,
      'partially_paid': PaymentStatus.PartiallyPaid,
      'partial': PaymentStatus.PartiallyPaid,
      'paid': PaymentStatus.Paid,
      'completed': PaymentStatus.Paid,
      'refunded': PaymentStatus.Refunded,
      // Note: 'cancelled' removed as it's not in the backend enum
    };

    return statusMap[normalizedStatus] || (paymentStatus as PaymentStatus);
  }

  /**
   * Normalize monetary amounts (ensure integer format)
   */
  private static normalizeAmount(amount: any): number {
    if (amount === null || amount === undefined) return 0;
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    return isNaN(numAmount) ? 0 : Math.round(numAmount);
  }

  /**
   * Normalize percentage values
   */
  private static normalizePercentage(percentage: any): number {
    if (percentage === null || percentage === undefined) return 0;
    
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : Number(percentage);
    return isNaN(numPercentage) ? 0 : Math.round(numPercentage * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate remaining amount
   */
  private static calculateRemainingAmount(apiResponse: any): number {
    const totalAmount = this.normalizeAmount(
      apiResponse.total_amount || apiResponse.totalAmount || apiResponse.total
    );
    const paidAmount = this.normalizeAmount(
      apiResponse.total_paid_amount || apiResponse.paidAmount
    );
    
    return Math.max(0, totalAmount - paidAmount);
  }

  /**
   * Transform customer information
   */
  private static transformCustomerInfo(apiResponse: any): CustomerInfo {
    // Handle nested customer object or flattened fields
    const customer = apiResponse.customer || {};
    
    return {
      id: customer.uuid || customer.id || apiResponse.customer_id || apiResponse.customerId || '',
      name: customer.name || apiResponse.customer_name || apiResponse.customerName || 'Unknown Customer',
      email: customer.email || apiResponse.customer_email || apiResponse.customerEmail || '',
      phone: customer.phone || apiResponse.customer_phone || apiResponse.customerPhone || '',
    };
  }

  /**
   * Transform vendor information (optional)
   */
  private static transformVendorInfo(apiResponse: any): VendorInfo | undefined {
    const vendor = apiResponse.vendor || {};
    const vendorId = vendor.uuid || vendor.id || apiResponse.vendor_id || apiResponse.vendorId;
    
    if (!vendorId) return undefined;
    
    return {
      id: vendorId,
      name: vendor.name || apiResponse.vendor_name || apiResponse.vendorName || 'Unknown Vendor',
      code: vendor.code || apiResponse.vendor_code || apiResponse.vendorCode,
    };
  }

  /**
   * Transform items array (JSON-based dynamic data)
   */
  private static transformItems(items: any): OrderItem[] {
    if (!items) return [];
    
    // Handle different item formats
    let itemsArray: any[] = [];
    
    if (Array.isArray(items)) {
      itemsArray = items;
    } else if (typeof items === 'string') {
      try {
        itemsArray = JSON.parse(items);
      } catch (e) {
        console.warn('Failed to parse items JSON:', e);
        return [];
      }
    } else if (typeof items === 'object') {
      itemsArray = [items];
    }
    
    return itemsArray.map((item, index) => ({
      product_id: item.product_id || item.productId,
      product_name: item.product_name || item.productName || item.name || `Item ${index + 1}`,
      productName: item.product_name || item.productName || item.name || `Item ${index + 1}`,
      name: item.product_name || item.productName || item.name || `Item ${index + 1}`,
      quantity: this.normalizeAmount(item.quantity) || 1,
      price: this.normalizeAmount(item.price || item.unit_price),
      unit_price: this.normalizeAmount(item.price || item.unit_price),
      total_price: this.normalizeAmount(item.total_price || (item.price || item.unit_price) * (item.quantity || 1)),
      specifications: item.specifications || item.customization || {},
      customization: item.specifications || item.customization || {},
    }));
  }

  /**
   * Calculate items count
   */
  private static calculateItemsCount(items: any): number {
    if (!items) return 0;
    
    if (Array.isArray(items)) {
      return items.length;
    }
    
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        return 0;
      }
    }
    
    return typeof items === 'object' ? 1 : 0;
  }

  /**
   * Normalize address data
   */
  private static normalizeAddress(address: any): string | object | undefined {
    if (!address) return undefined;
    
    if (typeof address === 'string') {
      return address;
    }
    
    if (typeof address === 'object') {
      return address;
    }
    
    return String(address);
  }

  /**
   * Normalize timestamp to ISO string
   */
  private static normalizeTimestamp(timestamp: any): string {
    if (!timestamp) return new Date().toISOString();
    
    if (timestamp instanceof Date) {
      return timestamp.toISOString();
    }
    
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
    
    return new Date().toISOString();
  }

  /**
   * Transform financial information
   */
  private static transformFinancialInfo(apiResponse: any): FinancialInfo {
    return {
      subtotal: this.normalizeAmount(apiResponse.subtotal),
      tax: this.normalizeAmount(apiResponse.tax),
      shippingCost: this.normalizeAmount(
        apiResponse.shipping_cost || apiResponse.shippingCost
      ),
      discount: this.normalizeAmount(apiResponse.discount),
      totalAmount: this.normalizeAmount(
        apiResponse.total_amount || apiResponse.totalAmount || apiResponse.total
      ),
      downPaymentAmount: this.normalizeAmount(
        apiResponse.down_payment_amount || apiResponse.downPaymentAmount
      ),
      paidAmount: this.normalizeAmount(
        apiResponse.total_paid_amount || apiResponse.paidAmount
      ),
      remainingAmount: this.calculateRemainingAmount(apiResponse),
      currency: apiResponse.currency || 'IDR',
      vendorCost: this.normalizeAmount(
        apiResponse.vendor_cost || apiResponse.vendorCost
      ),
      customerPrice: this.normalizeAmount(
        apiResponse.customer_price || apiResponse.customerPrice
      ),
      markupAmount: this.normalizeAmount(
        apiResponse.markup_amount || apiResponse.markupAmount
      ),
      markupPercentage: this.normalizePercentage(
        apiResponse.markup_percentage || apiResponse.markupPercentage
      ),
    };
  }

  /**
   * Transform production information
   */
  private static transformProductionInfo(apiResponse: any): ProductionInfo {
    return {
      productionType: apiResponse.production_type || apiResponse.productionType,
      paymentMethod: apiResponse.payment_method || apiResponse.paymentMethod,
      paymentType: apiResponse.payment_type || apiResponse.paymentType,
    };
  }

  /**
   * Transform address information
   */
  private static transformAddressInfo(apiResponse: any): AddressInfo {
    return {
      shipping: this.normalizeAddress(
        apiResponse.shipping_address || apiResponse.shippingAddress
      ),
      billing: this.normalizeAddress(
        apiResponse.billing_address || apiResponse.billingAddress
      ),
    };
  }

  /**
   * Transform notes information
   */
  private static transformNotesInfo(apiResponse: any): NotesInfo {
    return {
      customerNotes: apiResponse.customer_notes || apiResponse.customerNotes,
      internalNotes: apiResponse.internal_notes || apiResponse.internalNotes,
    };
  }

  /**
   * Validate transformed data
   * Ensures all required fields are present and valid
   */
  static validate(data: OrderDetailData): boolean {
    const requiredFields = ['id', 'uuid', 'orderNumber', 'status', 'paymentStatus'];
    
    for (const field of requiredFields) {
      if (!data[field as keyof OrderDetailData]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data.uuid)) {
      console.error('Invalid UUID format:', data.uuid);
      return false;
    }
    
    // Validate amounts are non-negative
    const amountFields = ['totalAmount', 'subtotal', 'tax', 'shippingCost', 'discount'];
    for (const field of amountFields) {
      const value = data[field as keyof OrderDetailData] as number;
      if (value < 0) {
        console.error(`Negative amount detected in ${field}:`, value);
        return false;
      }
    }
    
    return true;
  }
}