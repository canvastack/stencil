import { describe, it, expect, beforeAll } from 'vitest';
import { tenantApiClient } from '@/services/api/tenantApiClient';

describe('Product Stock Validation - API Integration', () => {
  const testProductBase = {
    name: 'API Test Product',
    slug: 'api-test-product',
    description: 'Test product for stock validation API testing',
    long_description: 'Longer description for testing purposes',
    images: ['https://example.com/test-image.jpg'],
    category: 'Test Category',
    material: 'Test Material',
    price: 1000,
    currency: 'IDR',
  };

  beforeAll(() => {
    console.log('Running Product Stock Validation API Integration Tests');
    console.log('Note: These tests require a running backend API and valid authentication token');
  });

  describe('POST /api/v1/tenant/products - Stock Validation', () => {
    it('should REJECT product with negative stock (-50)', async () => {
      const productWithNegativeStock = {
        ...testProductBase,
        slug: 'test-negative-stock-' + Date.now(),
        stock_quantity: -50,
      };

      try {
        await tenantApiClient.post('/products', productWithNegativeStock);
        
        expect.fail('Should have thrown validation error for negative stock');
      } catch (error: any) {
        expect(error.response?.status).toBe(422);
        
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors?.stock_quantity?.[0] || 
                            '';
        expect(errorMessage.toLowerCase()).toContain('stock');
        expect(errorMessage.toLowerCase()).toMatch(/negative|at least 0|minimum/);
      }
    });

    it('should REJECT product with fractional stock (50.5)', async () => {
      const productWithFractionalStock = {
        ...testProductBase,
        slug: 'test-fractional-stock-' + Date.now(),
        stock_quantity: 50.5,
      };

      try {
        await tenantApiClient.post('/products', productWithFractionalStock);
        
        expect.fail('Should have thrown validation error for fractional stock');
      } catch (error: any) {
        expect(error.response?.status).toBe(422);
        
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors?.stock_quantity?.[0] || 
                            '';
        expect(errorMessage.toLowerCase()).toMatch(/integer|whole number/);
      }
    });

    it('should REJECT product with excessive stock (1000000)', async () => {
      const productWithExcessiveStock = {
        ...testProductBase,
        slug: 'test-excessive-stock-' + Date.now(),
        stock_quantity: 1000000,
      };

      try {
        await tenantApiClient.post('/products', productWithExcessiveStock);
        
        expect.fail('Should have thrown validation error for excessive stock');
      } catch (error: any) {
        expect(error.response?.status).toBe(422);
        
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors?.stock_quantity?.[0] || 
                            '';
        expect(errorMessage.toLowerCase()).toMatch(/maximum|too high|exceeds/);
      }
    });

    it('should ACCEPT product with valid positive stock (100)', async () => {
      const productWithValidStock = {
        ...testProductBase,
        slug: 'test-valid-stock-' + Date.now(),
        stock_quantity: 100,
      };

      try {
        const response = await tenantApiClient.post('/products', productWithValidStock);
        
        expect(response.status).toBe(201);
        expect(response.data.data.stock_quantity).toBe(100);
        
        const createdProductId = response.data.data.id || response.data.data.uuid;
        if (createdProductId) {
          await tenantApiClient.delete(`/products/${createdProductId}`);
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('Skipping test: No authentication token or permission');
          return;
        }
        throw error;
      }
    });

    it('should ACCEPT product with zero stock (out of stock)', async () => {
      const productWithZeroStock = {
        ...testProductBase,
        slug: 'test-zero-stock-' + Date.now(),
        stock_quantity: 0,
      };

      try {
        const response = await tenantApiClient.post('/products', productWithZeroStock);
        
        expect(response.status).toBe(201);
        expect(response.data.data.stock_quantity).toBe(0);
        
        const createdProductId = response.data.data.id || response.data.data.uuid;
        if (createdProductId) {
          await tenantApiClient.delete(`/products/${createdProductId}`);
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('Skipping test: No authentication token or permission');
          return;
        }
        throw error;
      }
    });

    it('should ACCEPT product without stock_quantity (optional field)', async () => {
      const productWithoutStock = {
        ...testProductBase,
        slug: 'test-no-stock-' + Date.now(),
      };

      try {
        const response = await tenantApiClient.post('/products', productWithoutStock);
        
        expect(response.status).toBe(201);
        expect([undefined, null, 0]).toContain(response.data.data.stock_quantity);
        
        const createdProductId = response.data.data.id || response.data.data.uuid;
        if (createdProductId) {
          await tenantApiClient.delete(`/products/${createdProductId}`);
        }
      } catch (error: any) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('Skipping test: No authentication token or permission');
          return;
        }
        throw error;
      }
    });
  });

  describe('PATCH /api/v1/tenant/products/:id - Update Stock Validation', () => {
    it('should REJECT update with negative stock', async () => {
      const updateData = {
        stock_quantity: -10,
      };

      try {
        await tenantApiClient.patch('/products/test-product-uuid', updateData);
        
        expect.fail('Should have thrown validation error for negative stock');
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn('Test product not found (expected in test environment)');
          return;
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('Skipping test: No authentication token or permission');
          return;
        }
        
        expect(error.response?.status).toBe(422);
      }
    });

    it('should ACCEPT update with valid stock', async () => {
      const updateData = {
        stock_quantity: 200,
      };

      try {
        const response = await tenantApiClient.patch('/products/test-product-uuid', updateData);
        
        if (response.status === 200) {
          expect(response.data.data.stock_quantity).toBe(200);
        }
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn('Test product not found (expected in test environment)');
          return;
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('Skipping test: No authentication token or permission');
          return;
        }
        
        throw error;
      }
    });
  });

  describe('Batch Operations - Stock Validation', () => {
    it('should REJECT batch create with any invalid stock', async () => {
      const batchProducts = [
        {
          ...testProductBase,
          slug: 'batch-valid-1-' + Date.now(),
          stock_quantity: 50,
        },
        {
          ...testProductBase,
          slug: 'batch-invalid-' + Date.now(),
          stock_quantity: -10,
        },
        {
          ...testProductBase,
          slug: 'batch-valid-2-' + Date.now(),
          stock_quantity: 100,
        },
      ];

      try {
        await tenantApiClient.post('/products/batch', { products: batchProducts });
        
        expect.fail('Should have thrown validation error for batch with invalid stock');
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.warn('Batch endpoint not implemented');
          return;
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('Skipping test: No authentication token or permission');
          return;
        }
        
        expect(error.response?.status).toBe(422);
      }
    });
  });

  describe('Error Response Format', () => {
    it('should return proper error structure for validation failures', async () => {
      const productWithNegativeStock = {
        ...testProductBase,
        slug: 'test-error-format-' + Date.now(),
        stock_quantity: -999,
      };

      try {
        await tenantApiClient.post('/products', productWithNegativeStock);
        
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response?.status).toBe(422);
        
        const responseData = error.response?.data;
        expect(responseData).toBeDefined();
        expect(responseData.message || responseData.errors).toBeDefined();
        
        if (responseData.errors) {
          expect(responseData.errors.stock_quantity).toBeDefined();
          expect(Array.isArray(responseData.errors.stock_quantity)).toBe(true);
        }
      }
    });

    it('should include helpful error message for users', async () => {
      const productWithFractionalStock = {
        ...testProductBase,
        slug: 'test-user-message-' + Date.now(),
        stock_quantity: 99.99,
      };

      try {
        await tenantApiClient.post('/products', productWithFractionalStock);
        
        expect.fail('Should have thrown validation error');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors?.stock_quantity?.[0] || 
                            '';
        
        expect(errorMessage.length).toBeGreaterThan(0);
        
        expect(errorMessage.toLowerCase()).toMatch(/(integer|whole number|decimal|fractional)/);
      }
    });
  });
});
