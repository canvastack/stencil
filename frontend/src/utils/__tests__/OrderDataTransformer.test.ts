/**
 * OrderDataTransformer Unit Tests
 * 
 * Comprehensive test suite for order data transformation
 * Ensures 100% compliance with development rules
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrderDataTransformer, type OrderDetailData } from '../OrderDataTransformer';
import { OrderStatus, PaymentStatus } from '@/types/order';

describe('OrderDataTransformer', () => {
  let mockApiResponse: any;

  beforeEach(() => {
    // Mock API response with all possible field variations
    mockApiResponse = {
      uuid: '94137568-a056-4644-881d-676424124a0d',
      order_number: 'ETC-251229-0015',
      status: 'shipped',
      payment_status: 'paid',
      total_amount: 22719468,
      subtotal: 20000000,
      tax: 2000000,
      shipping_cost: 719468,
      discount: 0,
      down_payment_amount: 11359734,
      total_paid_amount: 22719468,
      vendor_cost: 15903627,
      customer_price: 22719468,
      markup_amount: 6815841,
      markup_percentage: 42.86,
      currency: 'IDR',
      customer: {
        uuid: 'customer-uuid-123',
        name: 'PT Teknologi Maju',
        email: 'admin@teknologimaju.com',
        phone: '+62812345678'
      },
      vendor: {
        uuid: 'vendor-uuid-456',
        name: 'CV Etching Specialist',
        code: 'VND001'
      },
      items: [
        {
          product_id: 'product-uuid-789',
          product_name: 'Custom Etching Plate',
          quantity: 2,
          unit_price: 10000000,
          total_price: 20000000,
          specifications: {
            material: 'stainless_steel',
            dimensions: '10x15cm',
            text_content: 'Company Logo'
          }
        }
      ],
      shipping_address: 'Jl. Sudirman No. 123, Jakarta Pusat',
      billing_address: 'Jl. Sudirman No. 123, Jakarta Pusat',
      customer_notes: 'Please handle with care',
      internal_notes: 'High priority customer',
      production_type: 'vendor',
      payment_method: 'bank_transfer',
      payment_type: 'full_payment',
      created_at: '2024-12-29T10:00:00Z',
      updated_at: '2024-12-30T15:30:00Z',
      down_payment_due_at: '2024-12-30T00:00:00Z',
      down_payment_paid_at: '2024-12-30T14:00:00Z',
      estimated_delivery: '2025-01-15T00:00:00Z',
      metadata: {
        negotiation: {
          rounds: 2,
          final_discount: 0
        }
      }
    };
  });

  describe('transform()', () => {
    it('should transform complete API response correctly', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);

      expect(result).toMatchObject({
        id: '94137568-a056-4644-881d-676424124a0d',
        uuid: '94137568-a056-4644-881d-676424124a0d',
        orderNumber: 'ETC-251229-0015',
        status: OrderStatus.Shipping,
        paymentStatus: PaymentStatus.Paid,
        totalAmount: 22719468,
        subtotal: 20000000,
        tax: 2000000,
        shippingCost: 719468,
        discount: 0,
        vendorCost: 15903627,
        customerPrice: 22719468,
        markupAmount: 6815841,
        markupPercentage: 42.86,
        currency: 'IDR',
        itemsCount: 1
      });
    });

    it('should handle missing API response', () => {
      expect(() => OrderDataTransformer.transform(null)).toThrow('API response is required');
      expect(() => OrderDataTransformer.transform(undefined)).toThrow('API response is required');
    });

    it('should handle missing UUID', () => {
      const responseWithoutUuid = { ...mockApiResponse };
      delete responseWithoutUuid.uuid;
      delete responseWithoutUuid.id;

      expect(() => OrderDataTransformer.transform(responseWithoutUuid)).toThrow('Order UUID is required');
    });

    it('should reject integer ID and require UUID', () => {
      const responseWithIntegerId = {
        ...mockApiResponse,
        id: 12345, // Integer ID
        uuid: undefined
      };

      expect(() => OrderDataTransformer.transform(responseWithIntegerId)).toThrow('Integer ID detected - UUID string required');
    });

    it('should handle alternative field names', () => {
      const alternativeResponse = {
        id: '94137568-a056-4644-881d-676424124a0d', // Using id instead of uuid
        orderNumber: 'ETC-251229-0015', // camelCase
        status: 'in_production',
        paymentStatus: 'partially_paid', // camelCase
        totalAmount: 1000000, // camelCase
        shippingCost: 50000, // camelCase
        customerName: 'John Doe', // Flattened customer
        customerEmail: 'john@example.com',
        customerPhone: '+62812345678',
        vendorName: 'Vendor ABC', // Flattened vendor
        vendorId: 'vendor-uuid-123',
        items: '[]', // JSON string
        createdAt: '2024-12-29T10:00:00Z' // camelCase
      };

      const result = OrderDataTransformer.transform(alternativeResponse);

      expect(result.id).toBe('94137568-a056-4644-881d-676424124a0d');
      expect(result.orderNumber).toBe('ETC-251229-0015');
      expect(result.status).toBe(OrderStatus.InProduction);
      expect(result.paymentStatus).toBe(PaymentStatus.PartiallyPaid);
      expect(result.customerInfo.name).toBe('John Doe');
      expect(result.customerInfo.email).toBe('john@example.com');
    });
  });

  describe('Status Normalization', () => {
    it('should normalize various status formats', () => {
      const statusTests = [
        { input: 'shipped', expected: OrderStatus.Shipping },
        { input: 'in_production', expected: OrderStatus.InProduction },
        { input: 'vendor_negotiation', expected: OrderStatus.VendorNegotiation },
        { input: 'awaiting_payment', expected: OrderStatus.AwaitingPayment },
        { input: 'completed', expected: OrderStatus.Completed },
        { input: 'cancelled', expected: OrderStatus.Cancelled },
        { input: 'SHIPPED', expected: OrderStatus.Shipping }, // Uppercase
        { input: 'In Production', expected: OrderStatus.InProduction }, // Spaces
        { input: 'vendor-negotiation', expected: OrderStatus.VendorNegotiation }, // Hyphens
      ];

      statusTests.forEach(({ input, expected }) => {
        const response = { ...mockApiResponse, status: input };
        const result = OrderDataTransformer.transform(response);
        expect(result.status).toBe(expected);
      });
    });

    it('should normalize payment status formats', () => {
      const paymentStatusTests = [
        { input: 'paid', expected: PaymentStatus.Paid },
        { input: 'unpaid', expected: PaymentStatus.Unpaid },
        { input: 'partially_paid', expected: PaymentStatus.PartiallyPaid },
        { input: 'refunded', expected: PaymentStatus.Refunded },
        { input: 'PAID', expected: PaymentStatus.Paid }, // Uppercase
        { input: 'Partially Paid', expected: PaymentStatus.PartiallyPaid }, // Spaces
      ];

      paymentStatusTests.forEach(({ input, expected }) => {
        const response = { ...mockApiResponse, payment_status: input };
        const result = OrderDataTransformer.transform(response);
        expect(result.paymentStatus).toBe(expected);
      });
    });
  });

  describe('Financial Data Handling', () => {
    it('should normalize monetary amounts correctly', () => {
      const response = {
        ...mockApiResponse,
        total_amount: '1000000', // String number
        subtotal: 900000.50, // Float
        tax: null, // Null value
        shipping_cost: undefined, // Undefined value
        discount: 'invalid' // Invalid string
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.totalAmount).toBe(1000000);
      expect(result.subtotal).toBe(900001); // Rounded
      expect(result.tax).toBe(0); // Null becomes 0
      expect(result.shippingCost).toBe(0); // Undefined becomes 0
      expect(result.discount).toBe(0); // Invalid becomes 0
    });

    it('should calculate remaining amount correctly', () => {
      const response = {
        ...mockApiResponse,
        total_amount: 1000000,
        total_paid_amount: 600000
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.remainingAmount).toBe(400000);
      expect(result.financial.remainingAmount).toBe(400000);
    });

    it('should handle PT CEX business fields', () => {
      const response = {
        ...mockApiResponse,
        vendor_cost: 1500000,
        customer_price: 2000000,
        markup_amount: 500000,
        markup_percentage: 33.33
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.vendorCost).toBe(1500000);
      expect(result.customerPrice).toBe(2000000);
      expect(result.markupAmount).toBe(500000);
      expect(result.markupPercentage).toBe(33.33);
    });
  });

  describe('Items Transformation', () => {
    it('should transform items array correctly', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);

      expect(result.items).toHaveLength(1);
      expect(result.itemsCount).toBe(1);
      expect(result.items[0]).toMatchObject({
        product_id: 'product-uuid-789',
        product_name: 'Custom Etching Plate',
        productName: 'Custom Etching Plate',
        name: 'Custom Etching Plate',
        quantity: 2,
        price: 10000000,
        unit_price: 10000000,
        total_price: 20000000,
        specifications: {
          material: 'stainless_steel',
          dimensions: '10x15cm',
          text_content: 'Company Logo'
        }
      });
    });

    it('should handle items as JSON string', () => {
      const response = {
        ...mockApiResponse,
        items: JSON.stringify([
          {
            product_name: 'Test Product',
            quantity: 1,
            unit_price: 100000
          }
        ])
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.items).toHaveLength(1);
      expect(result.itemsCount).toBe(1);
      expect(result.items[0].product_name).toBe('Test Product');
    });

    it('should handle empty or invalid items', () => {
      const testCases = [
        { items: null, expectedCount: 0 },
        { items: undefined, expectedCount: 0 },
        { items: [], expectedCount: 0 },
        { items: '', expectedCount: 0 },
        { items: 'invalid json', expectedCount: 0 },
        { items: {}, expectedCount: 1 }, // Single object becomes array
      ];

      testCases.forEach(({ items, expectedCount }) => {
        const response = { ...mockApiResponse, items };
        const result = OrderDataTransformer.transform(response);
        expect(result.itemsCount).toBe(expectedCount);
      });
    });
  });

  describe('Customer and Vendor Information', () => {
    it('should transform nested customer object', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);

      expect(result.customerInfo).toMatchObject({
        id: 'customer-uuid-123',
        name: 'PT Teknologi Maju',
        email: 'admin@teknologimaju.com',
        phone: '+62812345678'
      });

      expect(result.customer).toEqual(result.customerInfo);
    });

    it('should transform flattened customer fields', () => {
      const response = {
        ...mockApiResponse,
        customer: undefined,
        customer_id: 'customer-uuid-456',
        customer_name: 'Flattened Customer',
        customer_email: 'flat@example.com',
        customer_phone: '+62987654321'
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.customerInfo).toMatchObject({
        id: 'customer-uuid-456',
        name: 'Flattened Customer',
        email: 'flat@example.com',
        phone: '+62987654321'
      });
    });

    it('should handle missing customer data gracefully', () => {
      const response = {
        ...mockApiResponse,
        customer: undefined,
        customer_id: undefined
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.customerInfo).toMatchObject({
        id: '',
        name: 'Unknown Customer',
        email: '',
        phone: ''
      });
    });

    it('should transform vendor information when present', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);

      expect(result.vendorInfo).toMatchObject({
        id: 'vendor-uuid-456',
        name: 'CV Etching Specialist',
        code: 'VND001'
      });
    });

    it('should handle missing vendor information', () => {
      const response = {
        ...mockApiResponse,
        vendor: undefined,
        vendor_id: undefined
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.vendorInfo).toBeUndefined();
    });
  });

  describe('Timestamp Normalization', () => {
    it('should normalize various timestamp formats', () => {
      const response = {
        ...mockApiResponse,
        created_at: '2024-12-29T10:00:00Z', // ISO string
        updated_at: new Date('2024-12-30T15:30:00Z'), // Date object
        order_date: '2024-12-29', // Date only
        estimated_delivery: '2025-01-15T00:00:00Z' // ISO string instead of timestamp
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.createdAt).toBe('2024-12-29T10:00:00.000Z');
      expect(result.updatedAt).toBe('2024-12-30T15:30:00.000Z');
      expect(result.orderDate).toBe('2024-12-29T00:00:00.000Z');
      expect(result.estimatedDelivery).toBe('2025-01-15T00:00:00.000Z');
    });

    it('should handle invalid timestamps', () => {
      const response = {
        ...mockApiResponse,
        created_at: 'invalid date',
        updated_at: null
      };

      const result = OrderDataTransformer.transform(response);

      // Should fallback to current date for invalid timestamps
      expect(new Date(result.createdAt).getTime()).toBeGreaterThan(Date.now() - 1000);
      expect(new Date(result.updatedAt).getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Nested Objects', () => {
    it('should create proper nested objects', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);

      expect(result.financial).toMatchObject({
        subtotal: 20000000,
        tax: 2000000,
        shippingCost: 719468,
        discount: 0,
        totalAmount: 22719468,
        vendorCost: 15903627,
        customerPrice: 22719468,
        markupAmount: 6815841,
        markupPercentage: 42.86,
        currency: 'IDR'
      });

      expect(result.production).toMatchObject({
        productionType: 'vendor',
        paymentMethod: 'bank_transfer',
        paymentType: 'full_payment'
      });

      expect(result.addresses).toMatchObject({
        shipping: 'Jl. Sudirman No. 123, Jakarta Pusat',
        billing: 'Jl. Sudirman No. 123, Jakarta Pusat'
      });

      expect(result.notes).toMatchObject({
        customerNotes: 'Please handle with care',
        internalNotes: 'High priority customer'
      });
    });
  });

  describe('validate()', () => {
    it('should validate correct data', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);
      expect(OrderDataTransformer.validate(result)).toBe(true);
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        id: '',
        uuid: '94137568-a056-4644-881d-676424124a0d',
        orderNumber: 'ETC-251229-0015'
      } as OrderDetailData;

      expect(OrderDataTransformer.validate(invalidData)).toBe(false);
    });

    it('should reject data with invalid UUID format', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);
      result.uuid = 'invalid-uuid';

      expect(OrderDataTransformer.validate(result)).toBe(false);
    });

    it('should reject data with negative amounts', () => {
      const result = OrderDataTransformer.transform(mockApiResponse);
      result.totalAmount = -1000;

      expect(OrderDataTransformer.validate(result)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimal API response', () => {
      const minimalResponse = {
        uuid: '94137568-a056-4644-881d-676424124a0d',
        status: 'new'
      };

      const result = OrderDataTransformer.transform(minimalResponse);

      expect(result.id).toBe('94137568-a056-4644-881d-676424124a0d');
      expect(result.status).toBe(OrderStatus.New);
      expect(result.paymentStatus).toBe(PaymentStatus.Unpaid);
      expect(result.totalAmount).toBe(0);
      expect(result.itemsCount).toBe(0);
      expect(result.customerInfo.name).toBe('Unknown Customer');
    });

    it('should generate order number from UUID when missing', () => {
      const response = {
        ...mockApiResponse,
        order_number: undefined,
        orderNumber: undefined,
        number: undefined
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.orderNumber).toMatch(/^ORDER-[A-F0-9]{8}$/);
    });

    it('should handle complex address objects', () => {
      const response = {
        ...mockApiResponse,
        shipping_address: {
          street: 'Jl. Sudirman No. 123',
          city: 'Jakarta',
          postal_code: '12345'
        }
      };

      const result = OrderDataTransformer.transform(response);

      expect(result.shippingAddress).toEqual({
        street: 'Jl. Sudirman No. 123',
        city: 'Jakarta',
        postal_code: '12345'
      });
    });
  });
});