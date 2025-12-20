import { describe, it, expect } from 'vitest';
import { createProductSchema } from '@/schemas/product.schema';

describe('Product Schema - Stock Quantity Validation', () => {
  const baseValidProduct = {
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description for validation testing',
    images: ['https://example.com/image.jpg'],
    category: 'test-category',
    material: 'test-material',
    price: 1000,
  };

  describe('Negative Stock Validation', () => {
    it('should REJECT negative stock quantity', () => {
      const productWithNegativeStock = {
        ...baseValidProduct,
        stockQuantity: -50,
      };

      expect(() => createProductSchema.parse(productWithNegativeStock)).toThrow();
      
      try {
        createProductSchema.parse(productWithNegativeStock);
      } catch (error: any) {
        expect(error.errors[0].message).toBe('Stock quantity cannot be negative');
      }
    });

    it('should REJECT -1 stock quantity', () => {
      const productWithMinusOne = {
        ...baseValidProduct,
        stockQuantity: -1,
      };

      expect(() => createProductSchema.parse(productWithMinusOne)).toThrow();
    });
  });

  describe('Positive Stock Validation', () => {
    it('should ACCEPT valid positive stock quantity', () => {
      const productWithValidStock = {
        ...baseValidProduct,
        stockQuantity: 100,
      };

      const result = createProductSchema.parse(productWithValidStock);
      expect(result.stockQuantity).toBe(100);
    });

    it('should ACCEPT stock quantity of 1', () => {
      const productWithOne = {
        ...baseValidProduct,
        stockQuantity: 1,
      };

      const result = createProductSchema.parse(productWithOne);
      expect(result.stockQuantity).toBe(1);
    });

    it('should ACCEPT maximum valid stock (999999)', () => {
      const productWithMaxStock = {
        ...baseValidProduct,
        stockQuantity: 999999,
      };

      const result = createProductSchema.parse(productWithMaxStock);
      expect(result.stockQuantity).toBe(999999);
    });
  });

  describe('Zero Stock Validation', () => {
    it('should ACCEPT zero stock quantity (out of stock)', () => {
      const productWithZeroStock = {
        ...baseValidProduct,
        stockQuantity: 0,
      };

      const result = createProductSchema.parse(productWithZeroStock);
      expect(result.stockQuantity).toBe(0);
    });
  });

  describe('Fractional Stock Validation', () => {
    it('should REJECT fractional stock quantity (50.5)', () => {
      const productWithFractional = {
        ...baseValidProduct,
        stockQuantity: 50.5,
      };

      expect(() => createProductSchema.parse(productWithFractional)).toThrow();
      
      try {
        createProductSchema.parse(productWithFractional);
      } catch (error: any) {
        expect(error.errors[0].message).toBe('Stock quantity must be a whole number');
      }
    });

    it('should REJECT decimal stock quantity (100.99)', () => {
      const productWithDecimal = {
        ...baseValidProduct,
        stockQuantity: 100.99,
      };

      expect(() => createProductSchema.parse(productWithDecimal)).toThrow();
    });
  });

  describe('Required Stock Validation', () => {
    it('should REQUIRE stock quantity (field cannot be omitted)', () => {
      const productWithoutStock = {
        ...baseValidProduct,
      };

      expect(() => createProductSchema.parse(productWithoutStock)).toThrow();
    });

    it('should REJECT null stock quantity', () => {
      const productWithNullStock = {
        ...baseValidProduct,
        stockQuantity: null,
      };

      expect(() => createProductSchema.parse(productWithNullStock)).toThrow();
    });
  });

  describe('Maximum Stock Validation', () => {
    it('should REJECT stock quantity exceeding maximum (1000000)', () => {
      const productWithExcessiveStock = {
        ...baseValidProduct,
        stockQuantity: 1000000,
      };

      expect(() => createProductSchema.parse(productWithExcessiveStock)).toThrow();
      
      try {
        createProductSchema.parse(productWithExcessiveStock);
      } catch (error: any) {
        expect(error.errors[0].message).toBe('Stock quantity exceeds maximum allowed value');
      }
    });

    it('should REJECT extremely high stock (999999999)', () => {
      const productWithHugeStock = {
        ...baseValidProduct,
        stockQuantity: 999999999,
      };

      expect(() => createProductSchema.parse(productWithHugeStock)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should maintain validation for other required fields', () => {
      const productMissingName = {
        slug: 'test-product',
        description: 'Test description',
        images: ['https://example.com/image.jpg'],
        category: 'test-category',
        material: 'test-material',
        price: 1000,
        stockQuantity: 50,
      };

      expect(() => createProductSchema.parse(productMissingName)).toThrow();
    });

    it('should work with all valid fields including stock', () => {
      const completeValidProduct = {
        ...baseValidProduct,
        stockQuantity: 150,
        longDescription: 'This is a longer description for the product',
        tags: ['tag1', 'tag2'],
        currency: 'IDR',
        minOrder: 1,
        maxOrder: 100,
        status: 'published' as const,
      };

      const result = createProductSchema.parse(completeValidProduct);
      expect(result.stockQuantity).toBe(150);
      expect(result.status).toBe('published');
    });
  });
});
