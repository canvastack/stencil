/**
 * VendorProfile Page Tests
 * 
 * Tests for the vendor profile page.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 8.9
 * 
 * Task 6.5.1.5: Test displays profile information and edit form validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorProfile from '@/pages/vendor/VendorProfile';
import vendorApi from '@/services/api/vendorApi';
import type { VendorProfileResponse } from '@/types/vendor/portal';

// Mock the vendorApi
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

describe('VendorProfile', () => {
  const mockProfileResponse: VendorProfileResponse = {
    success: true,
    data: {
      id: '1',
      uuid: 'vendor-123',
      tenant_id: 'tenant-1',
      company_name: 'ABC Manufacturing',
      email: 'contact@abc.com',
      phone: '+6281252525599',
      contact_person: 'John Doe',
      address: 'Jl. Sudirman No. 123, Jakarta',
      status: 'active',
      performance_metrics: {
        total_quotes: 50,
        accepted_quotes: 35,
        rejected_quotes: 10,
        pending_quotes: 5,
        acceptance_rate: 70.0,
        average_response_time: 2.5,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorApi.getProfile).mockResolvedValue(mockProfileResponse);
  });

  const renderWithRouter = () => {
    return render(
      <MemoryRouter>
        <VendorProfile />
      </MemoryRouter>
    );
  };

  /**
   * Task 6.5.1.5: Core Tests
   * Test 1: Displays profile information
   * Test 2: Edit form validation
   */
  describe('Task 6.5.1.5: Profile Display and Form Validation', () => {
    it('should display complete profile information including company details and performance metrics', async () => {
      renderWithRouter();

      // Wait for profile to load
      await waitFor(() => {
        expect(vendorApi.getProfile).toHaveBeenCalledTimes(1);
      });

      // Verify company information is displayed
      expect(screen.getByText('ABC Manufacturing')).toBeInTheDocument();
      expect(screen.getByText('contact@abc.com')).toBeInTheDocument();
      expect(screen.getByText('+6281252525599')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jl. Sudirman No. 123, Jakarta')).toBeInTheDocument();

      // Verify performance metrics are displayed
      expect(screen.getByText('70.0%')).toBeInTheDocument(); // Acceptance rate
      expect(screen.getByText('35 of 50 quotes accepted')).toBeInTheDocument();
      expect(screen.getByText('2.5 hours')).toBeInTheDocument(); // Response time
      expect(screen.getByText('50')).toBeInTheDocument(); // Total quotes
      expect(screen.getByText('5 pending responses')).toBeInTheDocument();
    });

    it('should validate edit form with email format and phone length validation', async () => {
      renderWithRouter();

      // Wait for profile to load and enter edit mode
      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      // Test invalid email validation
      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'invalid-email-format' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });

      // Fix email and test phone validation
      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
      });

      await waitFor(() => {
        const phoneInput = screen.getByLabelText('Phone Number');
        fireEvent.change(phoneInput, { target: { value: '123' } }); // Too short
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Phone number must be at least 10 digits')).toBeInTheDocument();
        expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument(); // Email error cleared
      });
    });
  });

  describe('Page Loading', () => {
    it('should show loading skeletons initially', () => {
      renderWithRouter();

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should fetch profile on mount', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(vendorApi.getProfile).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Profile Display', () => {
    it('should display company name', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('ABC Manufacturing')).toBeInTheDocument();
      });
    });

    it('should display email', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('contact@abc.com')).toBeInTheDocument();
      });
    });

    it('should display phone', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('+6281252525599')).toBeInTheDocument();
      });
    });

    it('should display contact person', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display address', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Jl. Sudirman No. 123, Jakarta')).toBeInTheDocument();
      });
    });

    it('should show "Not provided" for missing fields', async () => {
      const profileWithMissingFields = {
        ...mockProfileResponse,
        data: {
          ...mockProfileResponse.data,
          email: '',
          phone: '',
          contact_person: '',
          address: '',
        },
      };
      vi.mocked(vendorApi.getProfile).mockResolvedValue(profileWithMissingFields);

      renderWithRouter();

      await waitFor(() => {
        const notProvidedTexts = screen.getAllByText('Not provided');
        expect(notProvidedTexts.length).toBe(4); // email, phone, contact_person, address
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display acceptance rate', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('70.0%')).toBeInTheDocument();
        expect(screen.getByText('35 of 50 quotes accepted')).toBeInTheDocument();
      });
    });

    it('should display average response time in hours', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('2.5 hours')).toBeInTheDocument();
      });
    });

    it('should display average response time in minutes when less than 1 hour', async () => {
      const profileWithFastResponse = {
        ...mockProfileResponse,
        data: {
          ...mockProfileResponse.data,
          performance_metrics: {
            ...mockProfileResponse.data.performance_metrics,
            average_response_time: 0.5, // 30 minutes
          },
        },
      };
      vi.mocked(vendorApi.getProfile).mockResolvedValue(profileWithFastResponse);

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('30 minutes')).toBeInTheDocument();
      });
    });

    it('should display total quotes', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('5 pending responses')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should show edit button initially', async () => {
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });
    });

    it('should enter edit mode when edit button is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
        expect(screen.getByLabelText('Contact Person')).toBeInTheDocument();
        expect(screen.getByLabelText('Address')).toBeInTheDocument();
      });
    });

    it('should show save and cancel buttons in edit mode', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should populate form fields with current values', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
        const phoneInput = screen.getByLabelText('Phone Number') as HTMLInputElement;
        const contactInput = screen.getByLabelText('Contact Person') as HTMLInputElement;
        const addressInput = screen.getByLabelText('Address') as HTMLInputElement;

        expect(emailInput.value).toBe('contact@abc.com');
        expect(phoneInput.value).toBe('+6281252525599');
        expect(contactInput.value).toBe('John Doe');
        expect(addressInput.value).toBe('Jl. Sudirman No. 123, Jakarta');
      });
    });

    it('should show company name as read-only', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Company name cannot be changed')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });
    });

    it('should validate phone number length', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const phoneInput = screen.getByLabelText('Phone Number');
        fireEvent.change(phoneInput, { target: { value: '123' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Phone number must be at least 10 digits')).toBeInTheDocument();
      });
    });

    it('should clear validation errors when field is corrected', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      // Enter invalid email
      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'invalid' } });
      });

      // Try to save
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      // Error should appear
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });

      // Correct the email
      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'valid@email.com' } });
      });

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
      });
    });
  });

  describe('Save Profile', () => {
    it('should call updateProfile API when save is clicked', async () => {
      const updatedProfile = {
        ...mockProfileResponse,
        data: {
          ...mockProfileResponse.data,
          email: 'newemail@abc.com',
        },
      };
      vi.mocked(vendorApi.updateProfile).mockResolvedValue(updatedProfile);

      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'newemail@abc.com' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(vendorApi.updateProfile).toHaveBeenCalledWith({
          email: 'newemail@abc.com',
          phone: '+6281252525599',
          contact_person: 'John Doe',
          address: 'Jl. Sudirman No. 123, Jakarta',
        });
      });
    });

    it('should show success message after save', async () => {
      const updatedProfile = {
        ...mockProfileResponse,
        data: {
          ...mockProfileResponse.data,
          phone: '+6289876543210',
        },
      };
      vi.mocked(vendorApi.updateProfile).mockResolvedValue(updatedProfile);

      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const phoneInput = screen.getByLabelText('Phone Number');
        fireEvent.change(phoneInput, { target: { value: '+6289876543210' } });
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Profile updated successfully')).toBeInTheDocument();
      });
    });

    it('should exit edit mode after successful save', async () => {
      const updatedProfile = mockProfileResponse;
      vi.mocked(vendorApi.updateProfile).mockResolvedValue(updatedProfile);

      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      });
    });

    it('should show error message if save fails', async () => {
      vi.mocked(vendorApi.updateProfile).mockRejectedValue(new Error('Failed to update'));

      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to update')).toBeInTheDocument();
      });
    });

    it('should show email verification notice when email is changed', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'newemail@abc.com' } });
      });

      await waitFor(() => {
        expect(screen.getByText('Email verification will be required after saving')).toBeInTheDocument();
      });
    });

    it('should disable form during save', async () => {
      vi.mocked(vendorApi.updateProfile).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      // Check that inputs are disabled
      const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
      expect(emailInput.disabled).toBe(true);
    });
  });

  describe('Cancel Edit', () => {
    it('should reset form when cancel is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'changed@email.com' } });
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
        expect(emailInput.value).toBe('contact@abc.com'); // Original value
      });
    });

    it('should clear validation errors when cancel is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      // Enter invalid email
      await waitFor(() => {
        const emailInput = screen.getByLabelText('Email Address');
        fireEvent.change(emailInput, { target: { value: 'invalid' } });
      });

      // Try to save to trigger validation
      await waitFor(() => {
        const saveButton = screen.getByText('Save Changes');
        fireEvent.click(saveButton);
      });

      // Error should appear
      await waitFor(() => {
        expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      });

      // Cancel
      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      // Enter edit mode again
      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      // Error should not be present
      expect(screen.queryByText('Invalid email format')).not.toBeInTheDocument();
    });

    it('should exit edit mode when cancel is clicked', async () => {
      renderWithRouter();

      await waitFor(() => {
        const editButton = screen.getByText('Edit Profile');
        fireEvent.click(editButton);
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show error message when fetch fails', async () => {
      vi.mocked(vendorApi.getProfile).mockRejectedValue(new Error('Failed to load'));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Error Loading Profile')).toBeInTheDocument();
        expect(screen.getByText('Failed to load')).toBeInTheDocument();
      });
    });

    it('should show try again button on error', async () => {
      vi.mocked(vendorApi.getProfile).mockRejectedValue(new Error('Failed to load'));

      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should retry fetch when try again is clicked', async () => {
      vi.mocked(vendorApi.getProfile).mockRejectedValueOnce(new Error('Failed to load'));

      renderWithRouter();

      await waitFor(() => {
        const tryAgainButton = screen.getByText('Try Again');
        fireEvent.click(tryAgainButton);
      });

      await waitFor(() => {
        expect(vendorApi.getProfile).toHaveBeenCalledTimes(2);
      });
    });
  });
});
