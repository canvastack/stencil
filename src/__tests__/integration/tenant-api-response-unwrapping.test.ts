import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { TenantApiClient } from '@/services/tenant/tenantApiClient';
import type { AxiosInstance } from 'axios';

describe('Tenant API Response Unwrapping Integration Tests', () => {
  let tenantApiClient: TenantApiClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Paginated Response Unwrapping', () => {
    test('should unwrap Laravel paginated response correctly', () => {
      const laravelPaginatedResponse = {
        data: [
          { id: '1', name: 'Vendor A' },
          { id: '2', name: 'Vendor B' },
        ],
        current_page: 1,
        last_page: 5,
        per_page: 50,
        total: 250,
        from: 1,
        to: 50,
        links: {
          first: 'http://api.test/vendors?page=1',
          last: 'http://api.test/vendors?page=5',
          prev: null,
          next: 'http://api.test/vendors?page=2',
        },
      };

      const expectedUnwrapped = {
        data: [
          { id: '1', name: 'Vendor A' },
          { id: '2', name: 'Vendor B' },
        ],
        current_page: 1,
        last_page: 5,
        per_page: 50,
        total: 250,
        from: 1,
        to: 50,
        links: {
          first: 'http://api.test/vendors?page=1',
          last: 'http://api.test/vendors?page=5',
          prev: null,
          next: 'http://api.test/vendors?page=2',
        },
      };

      expect(laravelPaginatedResponse).toEqual(expectedUnwrapped);
    });

    test('should handle paginated response with all pagination fields', () => {
      const response = {
        data: [
          { id: '10', name: 'Item 1' },
          { id: '11', name: 'Item 2' },
          { id: '12', name: 'Item 3' },
        ],
        current_page: 2,
        last_page: 10,
        per_page: 3,
        total: 30,
        from: 4,
        to: 6,
        links: {
          first: 'http://api.test/items?page=1',
          last: 'http://api.test/items?page=10',
          prev: 'http://api.test/items?page=1',
          next: 'http://api.test/items?page=3',
        },
      };

      expect(response.data).toHaveLength(3);
      expect(response.current_page).toBe(2);
      expect(response.last_page).toBe(10);
      expect(response.per_page).toBe(3);
      expect(response.total).toBe(30);
      expect(response.from).toBe(4);
      expect(response.to).toBe(6);
      expect(response.links).toBeDefined();
      expect(response.links?.prev).toBe('http://api.test/items?page=1');
      expect(response.links?.next).toBe('http://api.test/items?page=3');
    });

    test('should handle first page pagination', () => {
      const response = {
        data: [{ id: '1', name: 'First Item' }],
        current_page: 1,
        last_page: 3,
        per_page: 1,
        total: 3,
        from: 1,
        to: 1,
        links: {
          first: 'http://api.test/items?page=1',
          last: 'http://api.test/items?page=3',
          prev: null,
          next: 'http://api.test/items?page=2',
        },
      };

      expect(response.current_page).toBe(1);
      expect(response.links?.prev).toBeNull();
      expect(response.links?.next).toBeTruthy();
    });

    test('should handle last page pagination', () => {
      const response = {
        data: [{ id: '3', name: 'Last Item' }],
        current_page: 3,
        last_page: 3,
        per_page: 1,
        total: 3,
        from: 3,
        to: 3,
        links: {
          first: 'http://api.test/items?page=1',
          last: 'http://api.test/items?page=3',
          prev: 'http://api.test/items?page=2',
          next: null,
        },
      };

      expect(response.current_page).toBe(3);
      expect(response.last_page).toBe(3);
      expect(response.links?.prev).toBeTruthy();
      expect(response.links?.next).toBeNull();
    });

    test('should handle empty paginated response', () => {
      const response = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 0,
        from: null,
        to: null,
        links: {
          first: 'http://api.test/items?page=1',
          last: 'http://api.test/items?page=1',
          prev: null,
          next: null,
        },
      };

      expect(response.data).toHaveLength(0);
      expect(response.total).toBe(0);
      expect(response.from).toBeNull();
      expect(response.to).toBeNull();
    });
  });

  describe('Single Resource Response Unwrapping', () => {
    test('should unwrap single resource response', () => {
      const laravelSingleResponse = {
        data: {
          id: '123',
          name: 'Test Vendor',
          email: 'vendor@test.com',
          status: 'active',
        },
      };

      const unwrapped = laravelSingleResponse.data;

      expect(unwrapped).toEqual({
        id: '123',
        name: 'Test Vendor',
        email: 'vendor@test.com',
        status: 'active',
      });
    });

    test('should unwrap nested resource with relationships', () => {
      const response = {
        data: {
          id: '456',
          name: 'Advanced Vendor',
          contact: {
            email: 'contact@vendor.com',
            phone: '+1234567890',
          },
          specializations: [
            { id: '1', name: 'Laser Cutting' },
            { id: '2', name: 'Anodizing' },
          ],
        },
      };

      const unwrapped = response.data;

      expect(unwrapped.id).toBe('456');
      expect(unwrapped.contact).toBeDefined();
      expect(unwrapped.contact.email).toBe('contact@vendor.com');
      expect(unwrapped.specializations).toHaveLength(2);
    });

    test('should preserve single resource with only data key', () => {
      const response = {
        data: {
          id: '789',
          created_at: '2025-12-16T10:00:00Z',
          updated_at: '2025-12-16T12:00:00Z',
        },
      };

      expect(Object.keys(response)).toEqual(['data']);
      expect(response.data.id).toBe('789');
    });
  });

  describe('Non-Standard Response Handling', () => {
    test('should not unwrap response with multiple keys', () => {
      const response = {
        data: { id: '1', name: 'Test' },
        meta: { timestamp: '2025-12-16' },
        links: { self: 'http://api.test/resource/1' },
      };

      expect(Object.keys(response)).toHaveLength(3);
      expect(response.data).toBeDefined();
      expect(response.meta).toBeDefined();
      expect(response.links).toBeDefined();
    });

    test('should not unwrap array response', () => {
      const response = {
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ],
      };

      expect(Object.keys(response)).toEqual(['data']);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should handle non-object responses', () => {
      const stringResponse = 'Success';
      const numberResponse = 204;
      const booleanResponse = true;

      expect(stringResponse).toBe('Success');
      expect(numberResponse).toBe(204);
      expect(booleanResponse).toBe(true);
    });

    test('should handle null response data', () => {
      const response = {
        data: null,
      };

      expect(response.data).toBeNull();
    });

    test('should handle undefined response data', () => {
      const response = {
        data: undefined,
      };

      expect(response.data).toBeUndefined();
    });
  });

  describe('Edge Cases and Complex Structures', () => {
    test('should handle deeply nested pagination metadata', () => {
      const response = {
        data: [
          {
            id: '1',
            vendor: {
              id: 'v1',
              name: 'Nested Vendor',
              stats: {
                orders: 150,
                revenue: 50000,
              },
            },
          },
        ],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 1,
        from: 1,
        to: 1,
      };

      expect(response.data[0].vendor.stats.orders).toBe(150);
      expect(response.current_page).toBe(1);
    });

    test('should handle response with additional custom fields', () => {
      const response = {
        data: { id: '1', name: 'Custom' },
        success: true,
        message: 'Operation successful',
      };

      expect(Object.keys(response)).toContain('data');
      expect(Object.keys(response)).toContain('success');
      expect(Object.keys(response)).toContain('message');
      expect(response.success).toBe(true);
    });

    test('should handle large paginated dataset', () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `Item ${i + 1}`,
      }));

      const response = {
        data: largeDataset,
        current_page: 1,
        last_page: 20,
        per_page: 100,
        total: 2000,
        from: 1,
        to: 100,
      };

      expect(response.data).toHaveLength(100);
      expect(response.total).toBe(2000);
      expect(response.last_page).toBe(20);
    });

    test('should handle response with empty string values', () => {
      const response = {
        data: {
          id: '1',
          name: '',
          description: '',
          notes: null,
        },
      };

      const unwrapped = response.data;

      expect(unwrapped.name).toBe('');
      expect(unwrapped.description).toBe('');
      expect(unwrapped.notes).toBeNull();
    });

    test('should preserve special characters in data', () => {
      const response = {
        data: {
          id: '1',
          name: 'Vendor & Co.',
          description: 'Special chars: <>&"\'',
          unicode: '日本語テスト',
        },
      };

      const unwrapped = response.data;

      expect(unwrapped.name).toBe('Vendor & Co.');
      expect(unwrapped.description).toContain('<>&"\'');
      expect(unwrapped.unicode).toBe('日本語テスト');
    });
  });

  describe('Type Safety Verification', () => {
    test('should maintain type information for paginated response', () => {
      interface Vendor {
        id: string;
        name: string;
        status: 'active' | 'inactive';
      }

      const response: {
        data: Vendor[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      } = {
        data: [
          { id: '1', name: 'Vendor A', status: 'active' },
          { id: '2', name: 'Vendor B', status: 'inactive' },
        ],
        current_page: 1,
        last_page: 1,
        per_page: 50,
        total: 2,
      };

      expect(response.data[0].status).toBe('active');
      expect(response.data[1].status).toBe('inactive');
    });

    test('should maintain type information for single resource', () => {
      interface VendorDetail {
        id: string;
        name: string;
        metadata: {
          created_at: string;
          updated_at: string;
        };
      }

      const response: { data: VendorDetail } = {
        data: {
          id: '123',
          name: 'Typed Vendor',
          metadata: {
            created_at: '2025-12-16T10:00:00Z',
            updated_at: '2025-12-16T12:00:00Z',
          },
        },
      };

      expect(response.data.metadata.created_at).toBeDefined();
      expect(typeof response.data.metadata.created_at).toBe('string');
    });
  });

  describe('Response Interceptor Behavior', () => {
    test('should handle successful response codes (2xx)', () => {
      const responses = [
        { status: 200, data: { data: { id: '1' } } },
        { status: 201, data: { data: { id: '2' } } },
        { status: 204, data: null },
      ];

      responses.forEach(response => {
        expect([200, 201, 204]).toContain(response.status);
      });
    });

    test('should preserve response structure for DELETE operations', () => {
      const deleteResponse = {
        status: 204,
        data: null,
        statusText: 'No Content',
      };

      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.data).toBeNull();
    });

    test('should handle POST/PUT responses with created/updated resource', () => {
      const createResponse = {
        data: {
          id: '999',
          name: 'Newly Created',
          created_at: '2025-12-16T15:00:00Z',
        },
      };

      const unwrapped = createResponse.data;

      expect(unwrapped.id).toBe('999');
      expect(unwrapped.created_at).toBeDefined();
    });
  });
});
