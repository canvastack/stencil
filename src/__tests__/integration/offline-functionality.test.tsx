import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ProductList from '@/pages/admin/ProductList';
import OrderManagement from '@/pages/admin/OrderManagement';

// Mock online/offline status
const mockNavigator = {
  onLine: true,
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock local storage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock API services
const mockProductsService = {
  getProducts: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
};

const mockOrdersService = {
  getOrders: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  cancelOrder: vi.fn(),
};

vi.mock('@/services/api/products', () => ({
  productsService: mockProductsService,
}));

vi.mock('@/services/api/orders', () => ({
  ordersService: mockOrdersService,
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        networkMode: 'offlineFirst', // Enable offline-first behavior
      },
      mutations: { 
        retry: false,
        networkMode: 'offlineFirst',
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Offline Functionality Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockNavigator.onLine = true;
  });

  afterEach(() => {
    // Reset online status
    mockNavigator.onLine = true;
  });

  describe('Offline Detection', () => {
    it('should detect when application goes offline', async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Start online
      expect(mockNavigator.onLine).toBe(true);

      // Simulate going offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Check for offline indicator
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });
    });

    it('should detect when application comes back online', async () => {
      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Start offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });

      // Come back online
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      // Check for online indicator or offline message disappears
      await waitFor(() => {
        expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Offline Data Caching', () => {
    it('should cache product data for offline use', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Cached Product',
          description: 'A product that should be cached',
          price: 99.99,
          category: 'Test',
          stock: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // First, load data while online
      mockProductsService.getProducts.mockResolvedValue({
        products: mockProducts,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Wait for products to load and be cached
      await waitFor(() => {
        expect(screen.getByText('Cached Product')).toBeInTheDocument();
      });

      // Go offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Make API calls fail
      mockProductsService.getProducts.mockRejectedValue(new Error('Network Error'));

      // Data should still be available from cache
      expect(screen.getByText('Cached Product')).toBeInTheDocument();
    });

    it('should show cached data indicator when offline', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Offline Product',
          description: 'Viewing from cache',
          price: 49.99,
          category: 'Cache',
          stock: 5,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Load data while online first
      mockProductsService.getProducts.mockResolvedValue({
        products: mockProducts,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Offline Product')).toBeInTheDocument();
      });

      // Go offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Check for cached data indicator
      await waitFor(() => {
        expect(screen.getByText(/cached data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Offline Operations Queue', () => {
    it('should queue product creation when offline', async () => {
      mockProductsService.getProducts.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Go offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Try to create a product while offline
      const addButton = screen.getByRole('button', { name: /add product/i });
      await user.click(addButton);

      // Fill product form
      await user.type(screen.getByLabelText(/name/i), 'Offline Product');
      await user.type(screen.getByLabelText(/description/i), 'Created while offline');
      await user.type(screen.getByLabelText(/price/i), '29.99');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Check that operation was queued
      await waitFor(() => {
        expect(screen.getByText(/queued for sync/i)).toBeInTheDocument();
      });

      // Verify operation was stored locally
      const queuedOps = JSON.parse(
        localStorageMock.getItem('offline_operations') || '[]'
      );
      expect(queuedOps).toHaveLength(1);
      expect(queuedOps[0].type).toBe('CREATE_PRODUCT');
    });

    it('should queue product updates when offline', async () => {
      const existingProduct = {
        id: '1',
        name: 'Existing Product',
        description: 'To be updated',
        price: 39.99,
        category: 'Test',
        stock: 15,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockProductsService.getProducts.mockResolvedValue({
        products: [existingProduct],
        total: 1,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Existing Product')).toBeInTheDocument();
      });

      // Go offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Edit the product
      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      // Update product name
      const nameInput = screen.getByDisplayValue('Existing Product');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Product');

      // Save changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Check that operation was queued
      await waitFor(() => {
        expect(screen.getByText(/queued for sync/i)).toBeInTheDocument();
      });

      // Verify operation was stored locally
      const queuedOps = JSON.parse(
        localStorageMock.getItem('offline_operations') || '[]'
      );
      expect(queuedOps).toHaveLength(1);
      expect(queuedOps[0].type).toBe('UPDATE_PRODUCT');
      expect(queuedOps[0].data.name).toBe('Updated Product');
    });

    it('should sync queued operations when coming back online', async () => {
      // Queue some operations while offline
      const queuedOperations = [
        {
          id: 'op1',
          type: 'CREATE_PRODUCT',
          data: {
            name: 'Queued Product 1',
            price: 19.99,
          },
          timestamp: Date.now(),
        },
        {
          id: 'op2',
          type: 'UPDATE_PRODUCT',
          data: {
            id: '1',
            name: 'Updated Product',
            price: 29.99,
          },
          timestamp: Date.now(),
        },
      ];

      localStorageMock.setItem('offline_operations', JSON.stringify(queuedOperations));

      mockProductsService.getProducts.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockProductsService.createProduct.mockResolvedValue({
        id: '2',
        name: 'Queued Product 1',
        price: 19.99,
        category: 'Test',
        stock: 0,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      mockProductsService.updateProduct.mockResolvedValue({
        id: '1',
        name: 'Updated Product',
        price: 29.99,
        category: 'Test',
        stock: 5,
        images: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Start offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Come back online
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      // Wait for sync to complete
      await waitFor(() => {
        expect(mockProductsService.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Queued Product 1' })
        );
        expect(mockProductsService.updateProduct).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({ name: 'Updated Product' })
        );
      });

      // Check that sync success message appears
      await waitFor(() => {
        expect(screen.getByText(/sync completed/i)).toBeInTheDocument();
      });

      // Verify queued operations were cleared
      expect(localStorageMock.getItem('offline_operations')).toBe('[]');
    });
  });

  describe('Offline Order Management', () => {
    it('should allow viewing cached orders when offline', async () => {
      const mockOrders = [
        {
          id: '1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          status: 'pending',
          total: 199.99,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      // Load orders while online
      mockOrdersService.getOrders.mockResolvedValue({
        orders: mockOrders,
        total: 1,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <OrderManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Go offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // API calls should fail
      mockOrdersService.getOrders.mockRejectedValue(new Error('Network Error'));

      // Orders should still be visible from cache
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('$199.99')).toBeInTheDocument();
    });

    it('should queue order status changes when offline', async () => {
      const mockOrder = {
        id: '1',
        customerId: 'customer-1',
        customerName: 'Jane Smith',
        status: 'pending',
        total: 299.99,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockOrdersService.getOrders.mockResolvedValue({
        orders: [mockOrder],
        total: 1,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <OrderManagement />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Go offline
      act(() => {
        mockNavigator.onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // Try to change order status
      const statusSelect = screen.getByRole('combobox');
      await user.click(statusSelect);
      await user.click(screen.getByText('Processing'));

      // Check that operation was queued
      await waitFor(() => {
        expect(screen.getByText(/queued for sync/i)).toBeInTheDocument();
      });

      // Verify operation was stored locally
      const queuedOps = JSON.parse(
        localStorageMock.getItem('offline_operations') || '[]'
      );
      expect(queuedOps).toHaveLength(1);
      expect(queuedOps[0].type).toBe('UPDATE_ORDER');
      expect(queuedOps[0].data.status).toBe('processing');
    });
  });

  describe('Conflict Resolution', () => {
    it('should handle conflicts when syncing updated data', async () => {
      // Set up a product that was updated both locally and on the server
      const localUpdate = {
        id: 'conflict1',
        type: 'UPDATE_PRODUCT',
        data: {
          id: '1',
          name: 'Local Update',
          price: 25.99,
        },
        timestamp: Date.now() - 60000, // 1 minute ago
      };

      localStorageMock.setItem('offline_operations', JSON.stringify([localUpdate]));

      // Server has a more recent update
      mockProductsService.updateProduct.mockRejectedValue({
        response: {
          status: 409, // Conflict
          data: {
            error: 'Conflict',
            serverData: {
              id: '1',
              name: 'Server Update',
              price: 35.99,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      });

      mockProductsService.getProducts.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Come back online to trigger sync
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      // Wait for conflict resolution dialog
      await waitFor(() => {
        expect(screen.getByText(/conflict detected/i)).toBeInTheDocument();
        expect(screen.getByText(/local update/i)).toBeInTheDocument();
        expect(screen.getByText(/server update/i)).toBeInTheDocument();
      });

      // User can choose to keep local changes
      const keepLocalButton = screen.getByRole('button', { name: /keep local/i });
      await user.click(keepLocalButton);

      // Verify local changes were applied
      await waitFor(() => {
        expect(screen.getByText(/local changes applied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle sync failures gracefully', async () => {
      const failedOperation = {
        id: 'fail1',
        type: 'CREATE_PRODUCT',
        data: {
          name: 'Failed Product',
          price: 15.99,
        },
        timestamp: Date.now(),
      };

      localStorageMock.setItem('offline_operations', JSON.stringify([failedOperation]));

      mockProductsService.getProducts.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockProductsService.createProduct.mockRejectedValue(
        new Error('Server error')
      );

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Come back online to trigger sync
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      // Wait for sync failure message
      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
      });

      // Operation should remain in queue for retry
      const queuedOps = JSON.parse(
        localStorageMock.getItem('offline_operations') || '[]'
      );
      expect(queuedOps).toHaveLength(1);
      expect(queuedOps[0].id).toBe('fail1');
    });

    it('should provide manual sync retry option', async () => {
      const retryOperation = {
        id: 'retry1',
        type: 'UPDATE_PRODUCT',
        data: {
          id: '1',
          name: 'Retry Product',
          price: 45.99,
        },
        timestamp: Date.now(),
      };

      localStorageMock.setItem('offline_operations', JSON.stringify([retryOperation]));

      mockProductsService.getProducts.mockResolvedValue({
        products: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      // First attempt fails
      mockProductsService.updateProduct
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({
          id: '1',
          name: 'Retry Product',
          price: 45.99,
          category: 'Test',
          stock: 10,
          images: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      render(
        <TestWrapper>
          <ProductList />
        </TestWrapper>
      );

      // Come back online
      act(() => {
        mockNavigator.onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      // Wait for sync failure
      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry sync/i });
      await user.click(retryButton);

      // Wait for successful sync
      await waitFor(() => {
        expect(screen.getByText(/sync completed/i)).toBeInTheDocument();
      });

      // Verify operation was removed from queue
      expect(localStorageMock.getItem('offline_operations')).toBe('[]');
    });
  });
});