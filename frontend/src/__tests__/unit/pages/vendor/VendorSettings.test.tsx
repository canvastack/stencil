/**
 * VendorSettings Page Tests
 * 
 * Tests for the vendor settings page component.
 * Covers password change functionality and account information display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import VendorSettings from '@/pages/vendor/VendorSettings';
import { VendorAuthProvider } from '@/contexts/VendorAuthContext';
import vendorApi from '@/services/api/vendorApi';

// Mock vendorApi
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    changePassword: vi.fn(),
    isAuthenticated: vi.fn(() => true),
    getVendorUser: vi.fn(),
    getVendorProfile: vi.fn(),
  },
}));

// Mock monitoring
vi.mock('@/lib/monitoring', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  setUserContext: vi.fn(),
  clearUserContext: vi.fn(),
}));

const mockUser = {
  id: '1',
  uuid: 'user-uuid-1',
  email: 'vendor@example.com',
  name: 'Test Vendor Company',
  account_type: 'vendor' as const,
  vendor_id: 'vendor-1',
  status: 'active' as const,
  is_email_verified: true,
  two_factor_enabled: false,
  failed_login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockVendor = {
  id: '1',
  uuid: 'vendor-uuid-1',
  tenant_id: 'tenant-1',
  company_name: 'Test Vendor Company',
  email: 'vendor@example.com',
  phone: '+1234567890',
  contact_person: 'John Doe',
  status: 'active' as const,
  is_verified: true,
  onboarding_status: 'completed' as const,
  portal_access_enabled: true,
  total_orders: 10,
  completed_orders: 8,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const renderWithProviders = (component: React.ReactElement) => {
  // Setup mocks
  vi.mocked(vendorApi.getVendorUser).mockReturnValue(mockUser);
  vi.mocked(vendorApi.getVendorProfile).mockReturnValue(mockVendor);

  return render(
    <MemoryRouter>
      <VendorAuthProvider>
        {component}
      </VendorAuthProvider>
    </MemoryRouter>
  );
};

describe('VendorSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Loading and Display', () => {
    it('should render settings page with header', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your account settings and security')).toBeInTheDocument();
    });

    it('should render account information card', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.getByText('Account Information')).toBeInTheDocument();
      expect(screen.getByText('Your account details (read-only)')).toBeInTheDocument();
    });

    it('should render change password card', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.getAllByText('Change Password')[0]).toBeInTheDocument();
      expect(screen.getByText('Update your password to keep your account secure')).toBeInTheDocument();
    });
  });

  describe('Account Information Display', () => {
    it('should display N/A when user data is missing', () => {
      vi.mocked(vendorApi.getVendorUser).mockReturnValue(null);

      renderWithProviders(<VendorSettings />);

      const nameSection = screen.getByText('Name').closest('div');
      expect(within(nameSection!).getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Password Change Form', () => {
    it('should render all password fields', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    });

    it('should render password visibility toggles', () => {
      renderWithProviders(<VendorSettings />);

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      // 3 password fields = 3 toggle buttons (plus the submit button)
      expect(toggleButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should render password requirements', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
      expect(screen.getByText(/At least 8 characters long/)).toBeInTheDocument();
      expect(screen.getByText(/Contains uppercase and lowercase letters/)).toBeInTheDocument();
      expect(screen.getByText(/Contains at least one number/)).toBeInTheDocument();
      expect(screen.getByText(/Contains at least one special character/)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle current password visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      expect(currentPasswordInput).toHaveAttribute('type', 'password');

      // Find the toggle button for current password (first one)
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[0]);

      expect(currentPasswordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButtons[0]);
      expect(currentPasswordInput).toHaveAttribute('type', 'password');
    });

    it('should toggle new password visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const newPasswordInput = screen.getByLabelText('New Password');
      expect(newPasswordInput).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[1]);

      expect(newPasswordInput).toHaveAttribute('type', 'text');
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[2]);

      expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Form Validation', () => {
    it('should show error when current password is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeInTheDocument();
      });
    });

    it('should show error when new password is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      await user.type(currentPasswordInput, 'oldpassword');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('New password is required')).toBeInTheDocument();
      });
    });

    it('should show error when confirm password is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please confirm your new password')).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should show error when new password is same as current', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'SamePassword123!');
      await user.type(newPasswordInput, 'SamePassword123!');
      await user.type(confirmPasswordInput, 'SamePassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('New password must be different from current password')).toBeInTheDocument();
      });
    });

    it('should clear field error when user types', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is required')).toBeInTheDocument();
      });

      const currentPasswordInput = screen.getByLabelText('Current Password');
      await user.type(currentPasswordInput, 'password');

      await waitFor(() => {
        expect(screen.queryByText('Current password is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Validation', () => {
    it('should show error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'Short1!');
      await user.type(confirmPasswordInput, 'Short1!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('should show error for password without uppercase letter', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'lowercase123!');
      await user.type(confirmPasswordInput, 'lowercase123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });
    });

    it('should show error for password without lowercase letter', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'UPPERCASE123!');
      await user.type(confirmPasswordInput, 'UPPERCASE123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one lowercase letter')).toBeInTheDocument();
      });
    });

    it('should show error for password without number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'NoNumbers!');
      await user.type(confirmPasswordInput, 'NoNumbers!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one number')).toBeInTheDocument();
      });
    });

    it('should show error for password without special character', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'NoSpecial123');
      await user.type(confirmPasswordInput, 'NoSpecial123');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one special character')).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show "Weak" for password with low score', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText(/Password strength: Weak/)).toBeInTheDocument();
      });
    });

    it('should show "Fair" for password with medium score', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'Fair123');

      await waitFor(() => {
        expect(screen.getByText(/Password strength: Fair/)).toBeInTheDocument();
      });
    });

    it('should show "Good" for password with good score', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'GoodPass123');

      await waitFor(() => {
        expect(screen.getByText(/Password strength: Good/)).toBeInTheDocument();
      });
    });

    it('should show "Strong" for password with high score', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const newPasswordInput = screen.getByLabelText('New Password');
      await user.type(newPasswordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(screen.getByText(/Password strength: Strong/)).toBeInTheDocument();
      });
    });

    it('should not show strength indicator when field is empty', () => {
      renderWithProviders(<VendorSettings />);

      expect(screen.queryByText(/Password strength:/)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call changePassword API with correct data', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockResolvedValue({
        success: true,
        data: { message: 'Password changed successfully' },
      });

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(vendorApi.changePassword).toHaveBeenCalledWith({
          current_password: 'OldPassword123!',
          new_password: 'NewPassword123!',
          new_password_confirmation: 'NewPassword123!',
        });
      });
    });

    it('should show success message on successful password change', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockResolvedValue({
        success: true,
        data: { message: 'Password changed successfully' },
      });

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password changed successfully/)).toBeInTheDocument();
      });
    });

    it('should clear form after successful password change', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockResolvedValue({
        success: true,
        data: { message: 'Password changed successfully' },
      });

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password') as HTMLInputElement;
      const newPasswordInput = screen.getByLabelText('New Password') as HTMLInputElement;
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password') as HTMLInputElement;

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(currentPasswordInput.value).toBe('');
        expect(newPasswordInput.value).toBe('');
        expect(confirmPasswordInput.value).toBe('');
      });
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockRejectedValue(
        new Error('Current password is incorrect')
      );

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'WrongPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: { message: 'Success' },
        }), 100))
      );

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      // Check button is disabled during submission
      expect(screen.getByRole('button', { name: /Changing Password/i })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change Password/i })).not.toBeDisabled();
      });
    });

    it('should not submit form with validation errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<VendorSettings />);

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      expect(vendorApi.changePassword).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when API call fails', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should show generic error message when error has no message', async () => {
      const user = userEvent.setup();
      vi.mocked(vendorApi.changePassword).mockRejectedValue(new Error());

      renderWithProviders(<VendorSettings />);

      const currentPasswordInput = screen.getByLabelText('Current Password');
      const newPasswordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(currentPasswordInput, 'OldPassword123!');
      await user.type(newPasswordInput, 'NewPassword123!');
      await user.type(confirmPasswordInput, 'NewPassword123!');

      const submitButton = screen.getByRole('button', { name: /Change Password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to change password')).toBeInTheDocument();
      });
    });
  });
});
