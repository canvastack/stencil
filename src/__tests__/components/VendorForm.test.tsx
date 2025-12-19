import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VendorForm } from '@/components/vendor/VendorForm';

vi.mock('@/lib/toast-config', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('VendorForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Rendering', () => {
    it('should render create form with all fields', () => {
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/Nama Vendor/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Kode Vendor/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tambah Vendor/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Batal/i })).toBeInTheDocument();
    });

    it('should render edit form with prefilled data', () => {
      const defaultValues = {
        name: 'Vendor Test',
        email: 'test@vendor.com',
        code: 'VEND-001',
      };

      render(
        <VendorForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('Vendor Test')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@vendor.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('VEND-001')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Simpan Perubahan/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation error for invalid email', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });

      await user.type(nameInput, 'Vendor Name');
      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Format email tidak valid/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for short name', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });

      await user.type(nameInput, 'AB');
      await user.type(emailInput, 'valid@email.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/minimal 3 karakter/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid vendor code format', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const codeInput = screen.getByLabelText(/Kode Vendor/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });

      await user.type(nameInput, 'Vendor Name');
      await user.type(emailInput, 'valid@email.com');
      await user.type(codeInput, 'lowercase-code');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/huruf besar/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with valid data', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });

      await user.type(nameInput, 'Vendor Name');
      await user.type(emailInput, 'valid@email.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Vendor Name',
            email: 'valid@email.com',
            status: 'active',
          })
        );
      });
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /Batal/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable buttons while submitting', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });
      const cancelButton = screen.getByRole('button', { name: /Batal/i });

      await user.type(nameInput, 'Vendor Name');
      await user.type(emailInput, 'valid@email.com');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
        expect(cancelButton).not.toBeDisabled();
      }, { timeout: 200 });
    });
  });

  describe('Draft Persistence', () => {
    it('should save form data to localStorage while typing', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={true}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);

      await user.type(nameInput, 'Draft Vendor');
      await user.type(emailInput, 'draft@vendor.com');

      await waitFor(() => {
        const savedDraft = localStorage.getItem('vendor-form-draft');
        expect(savedDraft).toBeTruthy();
        
        if (savedDraft) {
          const draftData = JSON.parse(savedDraft);
          expect(draftData.name).toBe('Draft Vendor');
          expect(draftData.email).toBe('draft@vendor.com');
        }
      });
    });

    it('should restore draft data on form mount', () => {
      const draftData = {
        name: 'Restored Vendor',
        email: 'restored@vendor.com',
        code: 'RESTORE-001',
        status: 'active',
      };

      localStorage.setItem('vendor-form-draft', JSON.stringify(draftData));

      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={true}
        />
      );

      expect(screen.getByDisplayValue('Restored Vendor')).toBeInTheDocument();
      expect(screen.getByDisplayValue('restored@vendor.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('RESTORE-001')).toBeInTheDocument();
    });

    it('should clear draft after successful submission', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      localStorage.setItem('vendor-form-draft', JSON.stringify({ name: 'Draft' }));

      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={true}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Final Vendor');
      await user.type(emailInput, 'final@vendor.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('vendor-form-draft')).toBeNull();
      });
    });

    it('should show clear draft button when draft exists', () => {
      localStorage.setItem('vendor-form-draft', JSON.stringify({ name: 'Draft' }));

      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={true}
        />
      );

      expect(screen.getByRole('button', { name: /Hapus Draft/i })).toBeInTheDocument();
    });

    it('should clear draft when clear button clicked', async () => {
      const user = userEvent.setup();
      const { toast } = await import('@/lib/toast-config');

      localStorage.setItem('vendor-form-draft', JSON.stringify({ name: 'Draft' }));

      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={true}
        />
      );

      const clearButton = screen.getByRole('button', { name: /Hapus Draft/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(localStorage.getItem('vendor-form-draft')).toBeNull();
        expect(toast.info).toHaveBeenCalledWith('Draft berhasil dihapus');
      });
    });

    it('should not save draft in edit mode', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="edit"
          defaultValues={{ name: 'Edit Vendor' }}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={true}
        />
      );

      const nameInput = screen.getByDisplayValue('Edit Vendor');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Vendor');

      await waitFor(() => {
        expect(localStorage.getItem('vendor-form-draft')).toBeNull();
      });
    });

    it('should not save draft when enableDraftSave is false', async () => {
      const user = userEvent.setup();
      
      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          enableDraftSave={false}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      await user.type(nameInput, 'No Draft Vendor');

      await waitFor(() => {
        expect(localStorage.getItem('vendor-form-draft')).toBeNull();
      }, { timeout: 500 });
    });
  });

  describe('Server-side Validation Errors', () => {
    it('should display server validation errors', async () => {
      const user = userEvent.setup();
      const serverError = {
        response: {
          data: {
            errors: {
              email: ['Email sudah digunakan'],
              code: ['Kode vendor sudah ada'],
            },
          },
        },
      };

      mockOnSubmit.mockRejectedValueOnce(serverError);

      render(
        <VendorForm
          mode="create"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameInput = screen.getByLabelText(/Nama Vendor/i);
      const emailInput = screen.getByLabelText(/Email/i);
      const codeInput = screen.getByLabelText(/Kode Vendor/i);
      const submitButton = screen.getByRole('button', { name: /Tambah Vendor/i });

      await user.type(nameInput, 'Vendor Name');
      await user.type(emailInput, 'duplicate@email.com');
      await user.type(codeInput, 'DUP-001');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email sudah digunakan')).toBeInTheDocument();
        expect(screen.getByText('Kode vendor sudah ada')).toBeInTheDocument();
      });
    });
  });
});
