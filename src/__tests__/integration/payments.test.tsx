import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import PaymentManagement from '@/pages/admin/PaymentManagement';
import { paymentsService } from '@/services/api/payments';

// Mock the payments service
vi.mock('@/services/api/payments');

const mockPaymentsService = vi.mocked(paymentsService);

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

describe('Payment Management Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Payment List', () => {
    it('should load and display payments', async () => {
      const mockPayments = [
        {
          id: '1',
          orderId: 'order-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          amount: 299.99,
          currency: 'USD',
          status: 'completed' as const,
          method: 'credit_card' as const,
          transactionId: 'txn-123',
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          orderId: 'order-2',
          customerId: 'customer-2',
          customerName: 'Jane Smith',
          amount: 199.99,
          currency: 'USD',
          status: 'pending' as const,
          method: 'bank_transfer' as const,
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      mockPaymentsService.getPayments.mockResolvedValue({
        payments: mockPayments,
        total: 2,
        page: 1,
        limit: 10,
      });

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 2,
        totalAmount: 499.98,
        completedAmount: 299.99,
        pendingAmount: 199.99,
        refundedAmount: 0,
        averageAmount: 249.99,
        paymentsByMethod: [
          { method: 'credit_card', count: 1, amount: 299.99 },
          { method: 'bank_transfer', count: 1, amount: 199.99 }
        ],
        paymentsByStatus: [
          { status: 'completed', count: 1 },
          { status: 'pending', count: 1 }
        ],
      });

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Check if payment management page loads
      expect(screen.getByText('Payment Management')).toBeInTheDocument();

      // Wait for payments to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Check payment details
      expect(screen.getByText('$299.99')).toBeInTheDocument();
      expect(screen.getByText('$199.99')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should filter payments by status', async () => {
      const mockPayments = [
        {
          id: '1',
          orderId: 'order-1',
          customerId: 'customer-1',
          customerName: 'John Doe',
          amount: 299.99,
          currency: 'USD',
          status: 'completed' as const,
          method: 'credit_card' as const,
          transactionId: 'txn-123',
          processedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      mockPaymentsService.getPayments
        .mockResolvedValueOnce({
          payments: [],
          total: 0,
          page: 1,
          limit: 10,
        })
        .mockResolvedValueOnce({
          payments: mockPayments,
          total: 1,
          page: 1,
          limit: 10,
        });

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 1,
        totalAmount: 299.99,
        completedAmount: 299.99,
        pendingAmount: 0,
        refundedAmount: 0,
        averageAmount: 299.99,
        paymentsByMethod: [
          { method: 'credit_card', count: 1, amount: 299.99 }
        ],
        paymentsByStatus: [
          { status: 'completed', count: 1 }
        ],
      });

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Payment Management')).toBeInTheDocument();
      });

      // Filter by completed status
      const statusFilter = screen.getByRole('combobox');
      await user.click(statusFilter);
      await user.click(screen.getByText('Completed'));

      // Verify filter was applied
      await waitFor(() => {
        expect(mockPaymentsService.getPayments).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'completed' })
        );
      });
    });
  });

  describe('Payment Creation', () => {
    it('should create a new payment', async () => {
      const newPayment = {
        orderId: 'order-1',
        amount: 299.99,
        currency: 'USD',
        method: 'credit_card' as const,
        transactionId: 'txn-456',
      };

      mockPaymentsService.getPayments.mockResolvedValue({
        payments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        averageAmount: 0,
        paymentsByMethod: [],
        paymentsByStatus: [],
      });

      mockPaymentsService.createPayment.mockResolvedValue({
        id: '1',
        ...newPayment,
        customerId: 'customer-1',
        customerName: 'John Doe',
        status: 'pending' as const,
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Payment Management')).toBeInTheDocument();
      });

      // Click add payment button
      const addButton = screen.getByRole('button', { name: /add payment/i });
      await user.click(addButton);

      // Fill in payment form
      await user.type(screen.getByLabelText(/order id/i), newPayment.orderId);
      await user.type(screen.getByLabelText(/amount/i), newPayment.amount.toString());
      await user.type(screen.getByLabelText(/transaction id/i), newPayment.transactionId);

      // Select payment method
      const methodSelect = screen.getByRole('combobox', { name: /method/i });
      await user.click(methodSelect);
      await user.click(screen.getByText('Credit Card'));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(submitButton);

      // Verify payment was created
      await waitFor(() => {
        expect(mockPaymentsService.createPayment).toHaveBeenCalledWith(
          expect.objectContaining({
            orderId: newPayment.orderId,
            amount: newPayment.amount,
            method: newPayment.method,
            transactionId: newPayment.transactionId,
          })
        );
      });
    });

    it('should validate payment form', async () => {
      mockPaymentsService.getPayments.mockResolvedValue({
        payments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        averageAmount: 0,
        paymentsByMethod: [],
        paymentsByStatus: [],
      });

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Payment Management')).toBeInTheDocument();
      });

      // Click add payment button
      const addButton = screen.getByRole('button', { name: /add payment/i });
      await user.click(addButton);

      // Try to submit empty form
      const submitButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(submitButton);

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText(/order id is required/i)).toBeInTheDocument();
        expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment Refunds', () => {
    it('should process a refund', async () => {
      const mockPayment = {
        id: '1',
        orderId: 'order-1',
        customerId: 'customer-1',
        customerName: 'John Doe',
        amount: 299.99,
        currency: 'USD',
        status: 'completed' as const,
        method: 'credit_card' as const,
        transactionId: 'txn-123',
        processedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockPaymentsService.getPayments.mockResolvedValue({
        payments: [mockPayment],
        total: 1,
        page: 1,
        limit: 10,
      });

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 1,
        totalAmount: 299.99,
        completedAmount: 299.99,
        pendingAmount: 0,
        refundedAmount: 0,
        averageAmount: 299.99,
        paymentsByMethod: [
          { method: 'credit_card', count: 1, amount: 299.99 }
        ],
        paymentsByStatus: [
          { status: 'completed', count: 1 }
        ],
      });

      mockPaymentsService.refundPayment.mockResolvedValue({
        success: true,
        refundId: 'refund-123',
      });

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Wait for payment to load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click refund button
      const refundButton = screen.getByRole('button', { name: /refund/i });
      await user.click(refundButton);

      // Enter refund amount
      const refundAmountInput = screen.getByLabelText(/refund amount/i);
      await user.type(refundAmountInput, '100.00');

      // Enter refund reason
      const refundReasonInput = screen.getByLabelText(/reason/i);
      await user.type(refundReasonInput, 'Customer request');

      // Submit refund
      const submitRefundButton = screen.getByRole('button', { name: /process refund/i });
      await user.click(submitRefundButton);

      // Verify refund was processed
      await waitFor(() => {
        expect(mockPaymentsService.refundPayment).toHaveBeenCalledWith(
          '1',
          expect.objectContaining({
            amount: 100.00,
            reason: 'Customer request',
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle payment loading errors', async () => {
      mockPaymentsService.getPayments.mockRejectedValue(
        new Error('Failed to fetch payments')
      );

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        averageAmount: 0,
        paymentsByMethod: [],
        paymentsByStatus: [],
      });

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch payments/i)).toBeInTheDocument();
      });
    });

    it('should handle payment creation errors', async () => {
      mockPaymentsService.getPayments.mockResolvedValue({
        payments: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      mockPaymentsService.getPaymentStats.mockResolvedValue({
        totalPayments: 0,
        totalAmount: 0,
        completedAmount: 0,
        pendingAmount: 0,
        refundedAmount: 0,
        averageAmount: 0,
        paymentsByMethod: [],
        paymentsByStatus: [],
      });

      mockPaymentsService.createPayment.mockRejectedValue(
        new Error('Payment processing failed')
      );

      render(
        <TestWrapper>
          <PaymentManagement />
        </TestWrapper>
      );

      // Wait for page to load
      await waitFor(() => {
        expect(screen.getByText('Payment Management')).toBeInTheDocument();
      });

      // Click add payment button
      const addButton = screen.getByRole('button', { name: /add payment/i });
      await user.click(addButton);

      // Fill in valid payment data
      await user.type(screen.getByLabelText(/order id/i), 'order-1');
      await user.type(screen.getByLabelText(/amount/i), '299.99');
      await user.type(screen.getByLabelText(/transaction id/i), 'txn-456');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create payment/i });
      await user.click(submitButton);

      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(/payment processing failed/i)).toBeInTheDocument();
      });
    });
  });
});