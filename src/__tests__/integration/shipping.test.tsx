import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ShippingManagement from '@/pages/admin/ShippingManagement';
import { shippingService } from '@/services/api/shipping';

// Mock the shipping service
vi.mock('@/services/api/shipping');

const mockShippingService = vi.mocked(shippingService);

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

describe('Shipping Management Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Shipments Tab', () => {
    it('should load and display shipments', async () => {
      const mockShipments = [
        {
          id: '1',
          orderId: 'order-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          status: 'shipped' as const,
          carrier: 'FedEx',
          trackingNumber: 'FDX123456789',
          shippedAt: new Date().toISOString(),
          estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
          actualDelivery: null,
          origin: {
            name: 'Warehouse A',
            address: '123 Storage St',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          destination: {
            name: 'John Doe',
            address: '456 Customer Ave',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          dimensions: {
            length: 12,
            width: 8,
            height: 6,
            weight: 2.5
          },
          cost: 15.99,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      mockShippingService.getShipments.mockResolvedValue({
        shipments: mockShipments,
        total: 1,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue([
        {
          id: '1',
          name: 'FedEx',
          code: 'fedex',
          active: true,
          services: ['ground', 'overnight', '2day'],
          trackingUrl: 'https://fedex.com/track?id=',
        }
      ]);

      mockShippingService.getShippingMethods.mockResolvedValue([
        {
          id: '1',
          name: 'Standard Shipping',
          carrier: 'FedEx',
          service: 'ground',
          estimatedDays: 5,
          cost: 15.99,
          active: true,
        }
      ]);

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Check if shipping management page loads
      expect(screen.getByText('Shipping Management')).toBeInTheDocument();

      // Wait for shipments to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('FDX123456789')).toBeInTheDocument();
      });

      // Check shipment details
      expect(screen.getByText('Shipped')).toBeInTheDocument();
      expect(screen.getByText('FedEx')).toBeInTheDocument();
      expect(screen.getByText('$15.99')).toBeInTheDocument();
    });

    it('should filter shipments by status', async () => {
      const mockShipments = [
        {
          id: '1',
          orderId: 'order-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          status: 'delivered' as const,
          carrier: 'FedEx',
          trackingNumber: 'FDX123456789',
          shippedAt: new Date().toISOString(),
          estimatedDelivery: new Date().toISOString(),
          actualDelivery: new Date().toISOString(),
          origin: {
            name: 'Warehouse A',
            address: '123 Storage St',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90210',
            country: 'USA'
          },
          destination: {
            name: 'John Doe',
            address: '456 Customer Ave',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA'
          },
          dimensions: {
            length: 12,
            width: 8,
            height: 6,
            weight: 2.5
          },
          cost: 15.99,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      mockShippingService.getShipments
        .mockResolvedValueOnce({
          shipments: [],
          total: 0,
          page: 1,
          limit: 10,
        })
        .mockResolvedValueOnce({
          shipments: mockShipments,
          total: 1,
          page: 1,
          limit: 10,
        });

      mockShippingService.getCarriers.mockResolvedValue([]);
      mockShippingService.getShippingMethods.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Shipping Management')).toBeInTheDocument();
      });

      // Filter by delivered status
      const statusFilter = screen.getAllByRole('combobox')[0]; // First combobox should be status
      await user.click(statusFilter);
      await user.click(screen.getByText('Delivered'));

      // Verify filter was applied
      await waitFor(() => {
        expect(mockShippingService.getShipments).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'delivered' })
        );
      });
    });
  });

  describe('Carriers Tab', () => {
    it('should display carriers', async () => {
      const mockCarriers = [
        {
          id: '1',
          name: 'FedEx',
          code: 'fedex',
          active: true,
          services: ['ground', 'overnight', '2day'],
          trackingUrl: 'https://fedex.com/track?id=',
        },
        {
          id: '2',
          name: 'UPS',
          code: 'ups',
          active: true,
          services: ['ground', 'next_day', '2day'],
          trackingUrl: 'https://ups.com/track?id=',
        }
      ];

      mockShippingService.getShipments.mockResolvedValue({
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue(mockCarriers);
      mockShippingService.getShippingMethods.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Switch to carriers tab
      await user.click(screen.getByText('Carriers'));

      // Wait for carriers to load
      await waitFor(() => {
        expect(screen.getByText('FedEx')).toBeInTheDocument();
        expect(screen.getByText('UPS')).toBeInTheDocument();
      });

      // Check carrier details
      expect(screen.getByText('fedex')).toBeInTheDocument();
      expect(screen.getByText('ups')).toBeInTheDocument();
    });

    it('should add a new carrier', async () => {
      const newCarrier = {
        name: 'DHL',
        code: 'dhl',
        services: ['standard', 'express'],
        trackingUrl: 'https://dhl.com/track?id=',
      };

      mockShippingService.getShipments.mockResolvedValue({
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue([]);
      mockShippingService.getShippingMethods.mockResolvedValue([]);

      mockShippingService.createCarrier.mockResolvedValue({
        id: '3',
        ...newCarrier,
        active: true,
      });

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Switch to carriers tab
      await user.click(screen.getByText('Carriers'));

      // Click add carrier button
      const addButton = screen.getByRole('button', { name: /add carrier/i });
      await user.click(addButton);

      // Fill in carrier form
      await user.type(screen.getByLabelText(/name/i), newCarrier.name);
      await user.type(screen.getByLabelText(/code/i), newCarrier.code);
      await user.type(screen.getByLabelText(/tracking url/i), newCarrier.trackingUrl);

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create carrier/i });
      await user.click(submitButton);

      // Verify carrier was created
      await waitFor(() => {
        expect(mockShippingService.createCarrier).toHaveBeenCalledWith(
          expect.objectContaining({
            name: newCarrier.name,
            code: newCarrier.code,
            trackingUrl: newCarrier.trackingUrl,
          })
        );
      });
    });
  });

  describe('Shipping Methods Tab', () => {
    it('should display shipping methods', async () => {
      const mockMethods = [
        {
          id: '1',
          name: 'Standard Shipping',
          carrier: 'FedEx',
          service: 'ground',
          estimatedDays: 5,
          cost: 15.99,
          active: true,
        },
        {
          id: '2',
          name: 'Overnight Shipping',
          carrier: 'FedEx',
          service: 'overnight',
          estimatedDays: 1,
          cost: 35.99,
          active: true,
        }
      ];

      mockShippingService.getShipments.mockResolvedValue({
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue([]);
      mockShippingService.getShippingMethods.mockResolvedValue(mockMethods);

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Switch to shipping methods tab
      await user.click(screen.getByText('Methods'));

      // Wait for methods to load
      await waitFor(() => {
        expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
        expect(screen.getByText('Overnight Shipping')).toBeInTheDocument();
      });

      // Check method details
      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('1 day')).toBeInTheDocument();
      expect(screen.getByText('$15.99')).toBeInTheDocument();
      expect(screen.getByText('$35.99')).toBeInTheDocument();
    });

    it('should create a new shipping method', async () => {
      const newMethod = {
        name: 'Express Shipping',
        carrier: 'UPS',
        service: 'express',
        estimatedDays: 2,
        cost: 25.99,
      };

      mockShippingService.getShipments.mockResolvedValue({
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue([
        {
          id: '2',
          name: 'UPS',
          code: 'ups',
          active: true,
          services: ['ground', 'express', '2day'],
          trackingUrl: 'https://ups.com/track?id=',
        }
      ]);

      mockShippingService.getShippingMethods.mockResolvedValue([]);

      mockShippingService.createShippingMethod.mockResolvedValue({
        id: '3',
        ...newMethod,
        active: true,
      });

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Switch to shipping methods tab
      await user.click(screen.getByText('Methods'));

      // Click add method button
      const addButton = screen.getByRole('button', { name: /add method/i });
      await user.click(addButton);

      // Fill in method form
      await user.type(screen.getByLabelText(/name/i), newMethod.name);
      await user.type(screen.getByLabelText(/estimated days/i), newMethod.estimatedDays.toString());
      await user.type(screen.getByLabelText(/cost/i), newMethod.cost.toString());

      // Select carrier
      const carrierSelect = screen.getByRole('combobox', { name: /carrier/i });
      await user.click(carrierSelect);
      await user.click(screen.getByText('UPS'));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create method/i });
      await user.click(submitButton);

      // Verify method was created
      await waitFor(() => {
        expect(mockShippingService.createShippingMethod).toHaveBeenCalledWith(
          expect.objectContaining({
            name: newMethod.name,
            carrier: newMethod.carrier,
            estimatedDays: newMethod.estimatedDays,
            cost: newMethod.cost,
          })
        );
      });
    });
  });

  describe('Address Management Tab', () => {
    it('should display saved addresses', async () => {
      const mockAddresses = [
        {
          id: '1',
          name: 'Warehouse A',
          address: '123 Storage St',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA',
          phone: '555-0123',
          email: 'warehouse@company.com',
          isDefault: true,
          type: 'warehouse' as const,
        },
        {
          id: '2',
          name: 'Customer Service',
          address: '789 Office Blvd',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA',
          phone: '555-0456',
          email: 'support@company.com',
          isDefault: false,
          type: 'office' as const,
        }
      ];

      mockShippingService.getShipments.mockResolvedValue({
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue([]);
      mockShippingService.getShippingMethods.mockResolvedValue([]);
      mockShippingService.getAddresses.mockResolvedValue(mockAddresses);

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Switch to addresses tab
      await user.click(screen.getByText('Addresses'));

      // Wait for addresses to load
      await waitFor(() => {
        expect(screen.getByText('Warehouse A')).toBeInTheDocument();
        expect(screen.getByText('Customer Service')).toBeInTheDocument();
      });

      // Check address details
      expect(screen.getByText('123 Storage St')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles, CA 90210')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle shipment loading errors', async () => {
      mockShippingService.getShipments.mockRejectedValue(
        new Error('Failed to fetch shipments')
      );

      mockShippingService.getCarriers.mockResolvedValue([]);
      mockShippingService.getShippingMethods.mockResolvedValue([]);

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch shipments/i)).toBeInTheDocument();
      });
    });

    it('should handle carrier creation errors', async () => {
      mockShippingService.getShipments.mockResolvedValue({
        shipments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockShippingService.getCarriers.mockResolvedValue([]);
      mockShippingService.getShippingMethods.mockResolvedValue([]);

      mockShippingService.createCarrier.mockRejectedValue(
        new Error('Failed to create carrier')
      );

      render(
        <TestWrapper>
          <ShippingManagement />
        </TestWrapper>
      );

      // Switch to carriers tab
      await user.click(screen.getByText('Carriers'));

      // Click add carrier button
      const addButton = screen.getByRole('button', { name: /add carrier/i });
      await user.click(addButton);

      // Fill in minimal carrier data
      await user.type(screen.getByLabelText(/name/i), 'Test Carrier');
      await user.type(screen.getByLabelText(/code/i), 'test');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create carrier/i });
      await user.click(submitButton);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create carrier/i)).toBeInTheDocument();
      });
    });
  });
});