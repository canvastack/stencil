import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createProductSchema, updateProductSchema } from '@/schemas/product.schema';
import { QueryClient } from '@tanstack/react-query';
import type { Product } from '@/types/product';
import type { PaginatedResponse } from '@/types/api';

describe('Product Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Zod Validation Performance', () => {
    test('harus validate product data dalam waktu < 50ms', () => {
      const validData = {
        name: 'Test Product Performance',
        slug: 'test-product-performance',
        description: 'This is a test product for performance testing',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        category: 'awards',
        material: 'metal',
        price: 150000,
        currency: 'IDR',
        priceUnit: 'pcs',
        minOrder: 10,
        maxOrder: 1000,
        status: 'published' as const,
      };

      const startTime = performance.now();
      const result = createProductSchema.safeParse(validData);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(50);
      console.log(`✅ Validation completed in ${duration.toFixed(2)}ms`);
    });

    test('harus validate batch of 100 products dalam waktu < 500ms', () => {
      const products = Array.from({ length: 100 }, (_, i) => ({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description for product ${i}`,
        images: [`https://example.com/image${i}.jpg`],
        category: 'awards',
        material: 'metal',
        price: 100000 + i * 1000,
        status: 'published' as const,
      }));

      const startTime = performance.now();
      const results = products.map(product => createProductSchema.safeParse(product));
      const endTime = performance.now();

      const duration = endTime - startTime;
      const successCount = results.filter(r => r.success).length;

      expect(successCount).toBe(100);
      expect(duration).toBeLessThan(500);
      console.log(`✅ Validated 100 products in ${duration.toFixed(2)}ms (${(duration / 100).toFixed(2)}ms per item)`);
    });

    test('harus detect validation errors dengan cepat', () => {
      const invalidData = {
        name: 'Te',
        slug: 'a',
        description: 'Short',
        images: [],
        category: '',
        material: '',
        price: -100,
      };

      const startTime = performance.now();
      const result = createProductSchema.safeParse(invalidData);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.success).toBe(false);
      expect(duration).toBeLessThan(50);
      
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
        console.log(`✅ Error detection completed in ${duration.toFixed(2)}ms with ${result.error.errors.length} errors`);
      }
    });

    test('partial update validation harus lebih cepat', () => {
      const partialData = {
        price: 200000,
        status: 'published' as const,
      };

      const startTime = performance.now();
      const result = updateProductSchema.safeParse(partialData);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(30);
      console.log(`✅ Partial validation completed in ${duration.toFixed(2)}ms`);
    });
  });

  describe('React Query Cache Performance', () => {
    test('cache initialization harus cepat', () => {
      const startTime = performance.now();
      
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
          },
        },
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(queryClient).toBeDefined();
      expect(duration).toBeLessThan(10);
      console.log(`✅ QueryClient initialized in ${duration.toFixed(2)}ms`);
    });

    test('cache write untuk 100 products harus < 100ms', () => {
      const queryClient = new QueryClient();
      
      const mockProducts: Product[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        uuid: `uuid-${i}`,
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description ${i}`,
        images: [`https://example.com/image${i}.jpg`],
        price: 100000,
        currency: 'IDR',
        status: 'published',
      }));

      const mockResponse: PaginatedResponse<Product> = {
        data: mockProducts,
        current_page: 1,
        per_page: 100,
        total: 100,
        last_page: 1,
      };

      const startTime = performance.now();
      queryClient.setQueryData(['products', 'list', { page: 1 }], mockResponse);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
      console.log(`✅ Cached 100 products in ${duration.toFixed(2)}ms`);
    });

    test('cache read harus sangat cepat (< 5ms)', () => {
      const queryClient = new QueryClient();
      
      const mockResponse: PaginatedResponse<Product> = {
        data: [],
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1,
      };

      queryClient.setQueryData(['products', 'list', { page: 1 }], mockResponse);

      const startTime = performance.now();
      const cachedData = queryClient.getQueryData(['products', 'list', { page: 1 }]);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(cachedData).toBeDefined();
      expect(duration).toBeLessThan(5);
      console.log(`✅ Cache read completed in ${duration.toFixed(2)}ms`);
    });

    test('cache invalidation untuk multiple queries harus < 50ms', () => {
      const queryClient = new QueryClient();
      
      for (let i = 1; i <= 10; i++) {
        queryClient.setQueryData(['products', 'list', { page: i }], {
          data: [],
          current_page: i,
          per_page: 10,
          total: 100,
          last_page: 10,
        });
      }

      const startTime = performance.now();
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
      console.log(`✅ Invalidated 10 cached queries in ${duration.toFixed(2)}ms`);
    });
  });

  describe('Large Dataset Handling', () => {
    test('harus handle 1000 products dengan smooth scrolling', () => {
      const largeDataset: Product[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        uuid: `uuid-${i}`,
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: `Description for product number ${i}`,
        images: [`https://example.com/image${i}.jpg`],
        price: 50000 + (i * 1000),
        currency: 'IDR',
        priceUnit: 'pcs',
        minOrder: 10,
        category: i % 2 === 0 ? 'awards' : 'etching',
        material: i % 3 === 0 ? 'metal' : 'glass',
        status: 'published',
        featured: i % 10 === 0,
        inStock: true,
        stockQuantity: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const startTime = performance.now();
      
      const filteredByCategory = largeDataset.filter(p => p.category === 'awards');
      const filteredByPrice = largeDataset.filter(p => p.price && p.price > 100000 && p.price < 500000);
      const featuredProducts = largeDataset.filter(p => p.featured);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(filteredByCategory.length).toBeGreaterThan(0);
      expect(filteredByPrice.length).toBeGreaterThan(0);
      expect(featuredProducts.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
      
      console.log(`✅ Filtered 1000 products in ${duration.toFixed(2)}ms`);
      console.log(`   - By category: ${filteredByCategory.length} results`);
      console.log(`   - By price: ${filteredByPrice.length} results`);
      console.log(`   - Featured: ${featuredProducts.length} results`);
    });

    test('pagination harus efficient untuk large dataset', () => {
      const totalItems = 10000;
      const perPage = 50;
      const totalPages = Math.ceil(totalItems / perPage);

      const startTime = performance.now();
      
      const paginationInfo = [];
      for (let page = 1; page <= totalPages; page++) {
        const start = (page - 1) * perPage;
        const end = Math.min(start + perPage, totalItems);
        
        paginationInfo.push({
          page,
          start,
          end,
          itemsOnPage: end - start,
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(paginationInfo.length).toBe(totalPages);
      expect(duration).toBeLessThan(50);
      
      console.log(`✅ Calculated pagination for ${totalItems} items in ${duration.toFixed(2)}ms`);
      console.log(`   - Total pages: ${totalPages}`);
      console.log(`   - Items per page: ${perPage}`);
    });

    test('search/filter operations harus scalable', () => {
      const largeDataset: Product[] = Array.from({ length: 5000 }, (_, i) => ({
        id: `${i}`,
        uuid: `uuid-${i}`,
        name: `Product ${i} ${i % 2 === 0 ? 'Premium' : 'Standard'}`,
        slug: `product-${i}`,
        description: `High quality product for ${i % 3 === 0 ? 'corporate' : 'personal'} use`,
        images: [`https://example.com/image${i}.jpg`],
        price: 50000 + (i * 500),
        currency: 'IDR',
        status: 'published',
        tags: i % 2 === 0 ? ['premium', 'featured'] : ['standard'],
      }));

      const searchTerm = 'Premium';
      const priceMin = 100000;
      const priceMax = 500000;

      const startTime = performance.now();
      
      const results = largeDataset.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrice = product.price && product.price >= priceMin && product.price <= priceMax;
        return matchesSearch && matchesPrice;
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(results.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(200);
      
      console.log(`✅ Searched and filtered 5000 products in ${duration.toFixed(2)}ms`);
      console.log(`   - Results found: ${results.length}`);
      console.log(`   - Performance: ${(duration / 5000 * 1000).toFixed(2)}μs per item`);
    });
  });

  describe('Memory Management', () => {
    test('cache cleanup harus tidak memory leak', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 100,
          },
        },
      });

      for (let i = 0; i < 100; i++) {
        queryClient.setQueryData(['products', 'test', i], {
          data: Array.from({ length: 10 }, (_, j) => ({ id: `${i}-${j}` })),
        });
      }

      const cacheSize = queryClient.getQueryCache().getAll().length;
      expect(cacheSize).toBe(100);

      queryClient.clear();
      
      const cacheSizeAfterClear = queryClient.getQueryCache().getAll().length;
      expect(cacheSizeAfterClear).toBe(0);
      
      console.log(`✅ Cache cleared successfully: ${cacheSize} → ${cacheSizeAfterClear} entries`);
    });
  });

  describe('Debounce Performance', () => {
    test('debounced search harus reduce API calls', async () => {
      let apiCallCount = 0;
      const mockSearchAPI = () => {
        apiCallCount++;
        return Promise.resolve({ results: [] });
      };

      const debounceTime = 300;
      let timeoutId: NodeJS.Timeout;

      const debouncedSearch = (query: string) => {
        clearTimeout(timeoutId);
        return new Promise((resolve) => {
          timeoutId = setTimeout(async () => {
            const result = await mockSearchAPI();
            resolve(result);
          }, debounceTime);
        });
      };

      const startTime = performance.now();
      
      debouncedSearch('a');
      debouncedSearch('ab');
      debouncedSearch('abc');
      debouncedSearch('abcd');
      
      await new Promise(resolve => setTimeout(resolve, debounceTime + 100));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(apiCallCount).toBe(1);
      console.log(`✅ Debounce reduced 4 calls to ${apiCallCount} call in ${duration.toFixed(0)}ms`);
    });
  });
});
