/**
 * Unit Tests for VendorResetPassword Page
 * 
 * Tests password reset form functionality including:
 * - Form rendering
 * - Password strength validation
 * - Password confirmation matching
 * - Token validation
 * - Success/error states
 * 
 * @module __tests__/unit/pages/vendor/VendorResetPassword
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import VendorResetPassword from '@/pages/vendor/VendorResetPassword';
import vendorApi from '@/services/api/vendorApi';

// Mock dependencies
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    resetPassword: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Header and Footer components
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

// Mock navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('VendorResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper function to render component with router
   */
  const renderWithRouter = (initialRoute: string = '/vendor/reset-password?token=test-token&email=vendor@example.com') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <VendorResetPassword />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render reset password form with all fields', () => {
      renderWithRouter();

      expect(screen.getByText('Set New Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should pre-fill email from URL parameter', () => {
      renderWithRouter('/vendor/reset-password?token=test-token&email=vendor@example.com');

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      expect(emailInput.value).toBe('vendor@example.com');
    });

    it('should display password requirements', () => {
      renderWithRouter();

      expect(screen.getByText(/password must contain:/i)).toBeInTheDocument();
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/one lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/one number/i)).toBeInTheDocument();
      expect(screen.getByText(/one special character/i)).toBeInTheDocument();
    });

    it('should show error when token is missing', () => {
      renderWithRouter('/vendor/reset-password');

      expect(screen.getByText(/invalid or missing reset token/i)).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle new password visibility', () => {
      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i) as HTMLInputElement;
      const toggleButtons = screen.getAllByRole('button', { name: /password/i });
      const passwordToggle = toggleButtons[0]; // First toggle is for password field

      expect(passwordInput.type).toBe('password');

      fireEvent.click(passwordToggle);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(passwordToggle);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Password Strength Validation', () => {
    it('should show password strength indicator when typing', () => {
      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      
      // Type strong password
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      
      // Check that password strength section exists (the strength bar and label)
      // The component shows a strength meter, so we check for the meter container
      const strengthElements = document.querySelectorAll('.h-2.bg-muted');
      expect(strengthElements.length).toBeGreaterThan(0);
    });

    it('should validate minimum length requirement', async () => {
      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'Short1!' } });
      fireEvent.change(confirmInput, { target: { value: 'Short1!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Look for the error message specifically (not the requirement list item)
        const errorMessage = screen.getByText(/password must contain at least 8 characters/i);
        expect(errorMessage).toHaveClass('text-destructive');
      });
    });
  });

  describe('Password Confirmation Matching', () => {
    it('should show match indicator when passwords match', () => {
      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });

      expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
    });

    it('should show mismatch indicator when passwords do not match', () => {
      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'DifferentPass123!' } });

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate required email field', async () => {
      renderWithRouter('/vendor/reset-password?token=test-token');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i);
        expect(errorMessage).toHaveClass('text-destructive');
      });
    });

    it('should validate email format', async () => {
      renderWithRouter('/vendor/reset-password?token=test-token');

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const form = emailInput.closest('form');

      // Fill in invalid email and valid passwords
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
      
      // Submit the form directly
      if (form) {
        fireEvent.submit(form);
      }

      // Wait for validation error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should validate required password field', async () => {
      renderWithRouter();

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/password is required/i);
        expect(errorMessage).toHaveClass('text-destructive');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const mockResetPassword = vi.mocked(vendorApi.resetPassword);
      mockResetPassword.mockResolvedValueOnce({
        success: true,
        message: 'Password reset successful',
        data: { message: 'Password reset successful' },
      });

      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith({
          token: 'test-token',
          email: 'vendor@example.com',
          password: 'StrongPass123!',
          password_confirmation: 'StrongPass123!',
        });
      });
    });

    it('should show success state after successful reset', async () => {
      const mockResetPassword = vi.mocked(vendorApi.resetPassword);
      mockResetPassword.mockResolvedValueOnce({
        success: true,
        message: 'Password reset successful',
        data: { message: 'Password reset successful' },
      });

      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // Look for the more specific success message in the green box
        expect(screen.getByText(/you can now login with your new password/i)).toBeInTheDocument();
      }, { timeout: 3000 });
      
      // Check for login button
      expect(screen.getByRole('button', { name: /go to login/i })).toBeInTheDocument();
    });

    it('should show error message on failed reset', async () => {
      const mockResetPassword = vi.mocked(vendorApi.resetPassword);
      mockResetPassword.mockRejectedValueOnce(new Error('Reset failed'));

      renderWithRouter();

      const passwordInput = screen.getByLabelText(/^new password$/i);
      const confirmInput = screen.getByLabelText(/confirm new password/i);
      const submitButton = screen.getByRole('button', { name: /reset password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'StrongPass123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/reset failed/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button when token is missing', () => {
      renderWithRouter('/vendor/reset-password');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should have back to login link', () => {
      renderWithRouter();

      const backLink = screen.getByRole('link', { name: /back to login/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/vendor/login');
    });

    it('should have contact support link', () => {
      renderWithRouter();

      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', 'mailto:support@canvastencil.com');
    });
  });
});

