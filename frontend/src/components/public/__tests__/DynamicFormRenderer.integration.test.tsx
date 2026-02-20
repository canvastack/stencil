import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicFormRenderer } from '../DynamicFormRenderer';
import { TenantAuthProvider } from '@/contexts/TenantAuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/hooks/useFormConfiguration', () => ({
  usePublicFormConfiguration: vi.fn(),
}));

vi.mock('@/contexts/TenantAuthContext', async () => {
  const actual = await vi.importActual('@/contexts/TenantAuthContext');
  return {
    ...actual,
    useTenantAuth: vi.fn(),
  };
});

import { usePublicFormConfiguration } from '@/hooks/useFormConfiguration';
import { useTenantAuth } from '@/contexts/TenantAuthContext';

const mockUsePublicFormConfiguration = usePublicFormConfiguration as ReturnType<typeof vi.fn>;
const mockUseTenantAuth = useTenantAuth as ReturnType<typeof vi.fn>;

describe('DynamicFormRenderer - Customer Registration Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TenantAuthProvider>
          {ui}
        </TenantAuthProvider>
      </QueryClientProvider>
    );
  };

  const mockFormConfig = {
    uuid: 'form-123',
    product_uuid: 'product-123',
    form_schema: {
      version: '1.0',
      title: 'Product Order Form',
      description: 'Fill in the details',
      fields: [
        {
          id: 'field-1',
          name: 'quantity',
          type: 'number',
          label: 'Quantity',
          required: true,
          order: 1,
          validation: { min: 1 },
        },
        {
          id: 'field-2',
          name: 'notes',
          type: 'textarea',
          label: 'Notes',
          required: false,
          order: 2,
        },
      ],
      submitButton: {
        text: 'Order Now',
        position: 'center',
        style: 'primary',
      },
    },
  };

  describe('Guest User Flow', () => {
    it('should show customer registration modal when guest user submits form without customer fields', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn().mockResolvedValue({
        order_uuid: 'order-123',
        order_number: 'ORD-001',
        submission_uuid: 'sub-123',
        customer_uuid: 'cust-123',
        submitted_at: new Date().toISOString(),
      });

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: mockFormConfig,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in the form
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Customer registration modal should appear
      await waitFor(() => {
        expect(screen.getByText(/lengkapi data pemesanan/i)).toBeInTheDocument();
      });

      // Modal should have two tabs
      expect(screen.getByRole('tab', { name: /lanjut sebagai tamu/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /buat akun/i })).toBeInTheDocument();
    });

    it('should allow guest user to continue as guest', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn().mockResolvedValue({
        order_uuid: 'order-123',
        order_number: 'ORD-001',
        submission_uuid: 'sub-123',
        customer_uuid: 'cust-123',
        submitted_at: new Date().toISOString(),
      });

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: mockFormConfig,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in the form
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText(/lengkapi data pemesanan/i)).toBeInTheDocument();
      });

      // Guest tab should be active by default
      const guestTab = screen.getByRole('tab', { name: /lanjut sebagai tamu/i });
      expect(guestTab).toHaveAttribute('data-state', 'active');

      // Fill in guest information
      const nameInput = screen.getByLabelText(/nama lengkap/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/nomor telepon/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '081234567890');

      // Submit guest order
      const continueButton = screen.getByRole('button', { name: /lanjutkan pesanan/i });
      await user.click(continueButton);

      // Verify submission
      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 5,
            customer_name: 'John Doe',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '081234567890',
            create_account: false,
          })
        );
      });
    });

    it('should allow guest user to create account while ordering', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn().mockResolvedValue({
        order_uuid: 'order-123',
        order_number: 'ORD-001',
        submission_uuid: 'sub-123',
        customer_uuid: 'cust-123',
        submitted_at: new Date().toISOString(),
      });

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: mockFormConfig,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in the form
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText(/lengkapi data pemesanan/i)).toBeInTheDocument();
      });

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: /buat akun/i });
      await user.click(registerTab);

      // Fill in registration information
      const nameInput = screen.getByLabelText(/nama lengkap/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/nomor telepon/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/konfirmasi password/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '081234567890');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');

      // Agree to terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /saya setuju/i });
      await user.click(termsCheckbox);

      // Submit registration
      const createAccountButton = screen.getByRole('button', { name: /buat akun & pesan/i });
      await user.click(createAccountButton);

      // Verify submission
      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 5,
            customer_name: 'John Doe',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '081234567890',
            create_account: true,
            password: 'Password123',
          })
        );
      });
    });
  });

  describe('Authenticated User Flow', () => {
    it('should not show modal for authenticated users', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn().mockResolvedValue({
        order_uuid: 'order-123',
        order_number: 'ORD-001',
        submission_uuid: 'sub-123',
        customer_uuid: 'cust-123',
        submitted_at: new Date().toISOString(),
      });

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: mockFormConfig,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: true,
        user: {
          uuid: 'user-123',
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '081234567890',
        },
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in the form
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Modal should NOT appear
      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: 5,
            customer_name: 'Jane Doe',
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '081234567890',
          })
        );
      });

      // Verify modal did not appear
      expect(screen.queryByText(/lengkapi data pemesanan/i)).not.toBeInTheDocument();
    });
  });

  describe('Form with Customer Fields', () => {
    it('should not show modal when form has customer fields', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn().mockResolvedValue({
        order_uuid: 'order-123',
        order_number: 'ORD-001',
        submission_uuid: 'sub-123',
        customer_uuid: 'cust-123',
        submitted_at: new Date().toISOString(),
      });

      const formConfigWithCustomerFields = {
        ...mockFormConfig,
        form_schema: {
          ...mockFormConfig.form_schema,
          fields: [
            ...mockFormConfig.form_schema.fields,
            {
              id: 'field-3',
              name: 'customer_name',
              type: 'text',
              label: 'Customer Name',
              required: true,
              order: 3,
            },
            {
              id: 'field-4',
              name: 'email',
              type: 'email',
              label: 'Email',
              required: true,
              order: 4,
            },
            {
              id: 'field-5',
              name: 'phone',
              type: 'tel',
              label: 'Phone',
              required: true,
              order: 5,
            },
          ],
        },
      };

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: formConfigWithCustomerFields,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in all fields including customer fields
      const quantityInput = screen.getByLabelText(/quantity/i);
      const nameInput = screen.getByLabelText(/customer name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/phone/i);

      await user.clear(quantityInput);
      await user.type(quantityInput, '5');
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '081234567890');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Modal should NOT appear because form has customer fields
      await waitFor(() => {
        expect(mockSubmitForm).toHaveBeenCalled();
      });

      expect(screen.queryByText(/lengkapi data pemesanan/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should validate guest customer data before submission', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn();

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: mockFormConfig,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in the form
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText(/lengkapi data pemesanan/i)).toBeInTheDocument();
      });

      // Try to submit without filling in customer data
      const continueButton = screen.getByRole('button', { name: /lanjutkan pesanan/i });
      await user.click(continueButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/nama wajib diisi/i)).toBeInTheDocument();
        expect(screen.getByText(/email wajib diisi/i)).toBeInTheDocument();
        expect(screen.getByText(/nomor telepon wajib diisi/i)).toBeInTheDocument();
      });

      // Should not call submit
      expect(mockSubmitForm).not.toHaveBeenCalled();
    });

    it('should validate registration data including password requirements', async () => {
      const user = userEvent.setup();
      const mockSubmitForm = vi.fn();

      mockUsePublicFormConfiguration.mockReturnValue({
        formConfig: mockFormConfig,
        isLoading: false,
        error: null,
        submitForm: mockSubmitForm,
      });

      mockUseTenantAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(
        <DynamicFormRenderer
          productUuid="product-123"
          productName="Test Product"
        />
      );

      // Fill in the form
      const quantityInput = screen.getByLabelText(/quantity/i);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /order now/i });
      await user.click(submitButton);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByText(/lengkapi data pemesanan/i)).toBeInTheDocument();
      });

      // Switch to register tab
      const registerTab = screen.getByRole('tab', { name: /buat akun/i });
      await user.click(registerTab);

      // Fill in with weak password
      const nameInput = screen.getByLabelText(/nama lengkap/i);
      const emailInput = screen.getByLabelText(/email/i);
      const phoneInput = screen.getByLabelText(/nomor telepon/i);
      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/konfirmasi password/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(phoneInput, '081234567890');
      await user.type(passwordInput, 'weak');
      await user.type(confirmPasswordInput, 'weak');

      // Agree to terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /saya setuju/i });
      await user.click(termsCheckbox);

      // Try to submit
      const createAccountButton = screen.getByRole('button', { name: /buat akun & pesan/i });
      await user.click(createAccountButton);

      // Should show password validation error
      await waitFor(() => {
        expect(screen.getByText(/password minimal 8 karakter/i)).toBeInTheDocument();
      });

      // Should not call submit
      expect(mockSubmitForm).not.toHaveBeenCalled();
    });
  });
});
