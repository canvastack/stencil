/**
 * VendorLogin Page Tests
 * 
 * Unit tests for the vendor login page component.
 * Tests form validation, submission, error handling, and navigation.
 * 
 * @module __tests__/unit/pages/vendor/VendorLogin
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import VendorLogin from '@/pages/vendor/VendorLogin';
import { VendorAuthProvider } from '@/contexts/VendorAuthContext';
import * as vendorAuthContext from '@/contexts/VendorAuthContext';

// Mock dependencies
vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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

describe('VendorLogin', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  const defaultAuthContext = {
    user: null,
    vendor: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: mockLogin,
    logout: vi.fn(),
    refreshProfile: vi.fn(),
    clearError: mockClearError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useVendorAuth hook
    vi.spyOn(vendorAuthContext, 'useVendorAuth').mockReturnValue(defaultAuthContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (authOverrides = {}) => {
    vi.spyOn(vendorAuthContext, 'useVendorAuth').mockReturnValue({
      ...defaultAuthContext,
      ...authOverrides,
    });

    return render(
      <MemoryRouter initialEntries={['/vendor/login']}>
        <VendorLogin />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      renderComponent();

      expect(screen.getByText('Vendor Portal')).toBeInTheDocument();
      expect(screen.getByText('Login to manage your quotes')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login to portal/i })).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderComponent();

      const forgotPasswordLink = screen.getByText('Forgot Password?');
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/vendor/forgot-password');
    });

    it('should render header and footer', () => {
      renderComponent();

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });

    it('should render password visibility toggle', () => {
      renderComponent();

      const toggleButton = screen.getByLabelText('Show password');
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /login to portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when email format is invalid', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      
      // Change input type to text to bypass browser validation
      emailInput.type = 'text';
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitButton = screen.getByRole('button', { name: /login to portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when password is empty', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      const submitButton = screen.getByRole('button', { name: /login to portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show error when password is too short', async () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });
      fireEvent.change(passwordInput, { target: { value: '12345' } });

      const submitButton = screen.getByRole('button', { name: /login to portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should clear validation error when user starts typing', async () => {
      renderComponent();

      const submitButton = screen.getByRole('button', { name: /login to portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct credentials', async () => {
      mockLogin.mockResolvedValue(undefined);
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitButton = screen.getByRole('button', { name: /login to portal/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('vendor@example.com', 'password123');
      });
    });

    it('should disable form during submission', async () => {
      renderComponent({ isLoading: true });

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /logging in/i });

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state on submit button', () => {
      renderComponent({ isLoading: true });

      expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display authentication error from context', () => {
      renderComponent({ error: 'Invalid credentials' });

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    it('should clear error when user starts typing', async () => {
      renderComponent({ error: 'Invalid credentials' });

      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'vendor@example.com' } });

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });

    it('should clear error on component unmount', () => {
      const { unmount } = renderComponent();

      unmount();

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      renderComponent();

      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const toggleButton = screen.getByLabelText('Show password');

      expect(passwordInput.type).toBe('password');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Navigation', () => {
    it('should redirect to dashboard when authenticated', () => {
      renderComponent({ isAuthenticated: true });

      expect(mockNavigate).toHaveBeenCalledWith('/vendor/dashboard', { replace: true });
    });

    it('should not redirect when not authenticated', () => {
      renderComponent({ isAuthenticated: false });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderComponent();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should have autocomplete attributes', () => {
      renderComponent();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });
});
