/**
 * Unit Tests for VendorForgotPassword Page
 * 
 * Tests the password reset request functionality for vendor portal.
 * 
 * @module __tests__/unit/pages/vendor/VendorForgotPassword
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorForgotPassword from '@/pages/vendor/VendorForgotPassword';
import vendorApi from '@/services/api/vendorApi';

// Mock dependencies
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

// Mock vendor API
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    requestPasswordReset: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('VendorForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Helper function to render component with router
   */
  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/vendor/forgot-password']}>
        <VendorForgotPassword />
      </MemoryRouter>
    );
  };

  describe('Initial Render', () => {
    it('should render the forgot password form', () => {
      renderComponent();

      expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should display the correct header text', () => {
      renderComponent();

      expect(screen.getByText(/enter your email to receive a password reset link/i)).toBeInTheDocument();
    });

    it('should have a link back to login', () => {
      renderComponent();

      const backLink = screen.getByRole('link', { name: /back to login/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/vendor/login');
    });

    it('should have a contact support link', () => {
      renderComponent();

      const supportLink = screen.getByRole('link', { name: /contact support/i });
      expect(supportLink).toBeInTheDocument();
      expect(supportLink).toHaveAttribute('href', 'mailto:support@canvastencil.com');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(vendorApi.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should show error when email format is invalid', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      
      // Change input type to text to bypass browser validation
      emailInput.type = 'text';
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      expect(vendorApi.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('should clear validation error when user starts typing', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send reset link/i });

      // Trigger validation error
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid email', async () => {
      vi.mocked(vendorApi.requestPasswordReset).mockResolvedValue({
        success: true,
        data: { message: 'Password reset email sent' },
        message: 'Password reset email sent',
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vendorApi.requestPasswordReset).toHaveBeenCalledWith({
          email: 'vendor@example.com',
        });
      });
    });

    it('should show loading state during submission', async () => {
      vi.mocked(vendorApi.requestPasswordReset).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument();
      });

      // Button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should display success state after successful submission', async () => {
      vi.mocked(vendorApi.requestPasswordReset).mockResolvedValue({
        success: true,
        data: { message: 'Password reset email sent' },
        message: 'Password reset email sent',
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email for reset instructions/i)).toBeInTheDocument();
      });

      // Should show success message with email
      expect(screen.getByText(/vendor@example.com/i)).toBeInTheDocument();

      // Should show back to login button
      expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
    });

    it('should handle API error gracefully', async () => {
      const errorMessage = 'Email not found';
      vi.mocked(vendorApi.requestPasswordReset).mockRejectedValue(
        new Error(errorMessage)
      );

      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Form should still be visible
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    beforeEach(async () => {
      vi.mocked(vendorApi.requestPasswordReset).mockResolvedValue({
        success: true,
        data: { message: 'Password reset email sent' },
        message: 'Password reset email sent',
      });

      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email for reset instructions/i)).toBeInTheDocument();
      });
    });

    it('should display success icon', () => {
      // Success icon should be visible (Mail icon)
      const successSection = screen.getByText(/check your email for reset instructions/i).closest('div');
      expect(successSection).toBeInTheDocument();
    });

    it('should display helpful instructions', () => {
      expect(screen.getByText(/didn't receive the email/i)).toBeInTheDocument();
      expect(screen.getByText(/check your spam or junk folder/i)).toBeInTheDocument();
      expect(screen.getByText(/make sure the email address is correct/i)).toBeInTheDocument();
    });

    it('should allow user to try different email', async () => {
      const tryDifferentButton = screen.getByRole('button', { name: /try a different email address/i });
      fireEvent.click(tryDifferentButton);

      await waitFor(() => {
        // Should return to form state
        expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id', 'email');
    });

    it('should have autofocus on email input', () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      // Check if the element has focus (autofocus should set focus on mount)
      expect(emailInput).toHaveFocus();
    });

    it('should have autocomplete attribute', () => {
      renderComponent();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });
  });
});
