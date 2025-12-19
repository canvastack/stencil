import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VendorForm } from '@/components/vendor/VendorForm';
import { CreateVendorFormData, UpdateVendorFormData } from '@/schemas/vendor.schema';
import { Vendor } from '@/types/vendor';
import { Badge } from '@/components/ui/badge';

interface VendorFormDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<Vendor>;
  onSubmit: (data: CreateVendorFormData | UpdateVendorFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function VendorFormDialog({
  mode,
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: VendorFormDialogProps) {
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (mode === 'create' && open) {
      const draft = localStorage.getItem('vendor-form-draft');
      setHasDraft(draft !== null);
    }
  }, [mode, open]);

  const handleSubmit = async (data: CreateVendorFormData | UpdateVendorFormData) => {
    await onSubmit(data);
    onOpenChange(false);
    
    // Hapus draft setelah dialog ditutup untuk mencegah auto-save ulang
    // Delay diperlukan karena form.watch() masih aktif saat dialog closing
    if (mode === 'create') {
      setTimeout(() => {
        localStorage.removeItem('vendor-form-draft');
        setHasDraft(false);
      }, 150);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const getDialogTitle = () => {
    if (mode === 'edit' && defaultValues?.name) {
      return `Edit Vendor - ${defaultValues.name}`;
    }
    return mode === 'create' ? 'Add New Vendor' : 'Edit Vendor';
  };

  const getDialogDescription = () => {
    if (mode === 'edit') {
      return 'Update vendor information and manage business details';
    }
    return 'Add a new vendor to your database';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="vendor-form-title"
        aria-describedby="vendor-form-description"
      >
        <DialogHeader>
          <DialogTitle id="vendor-form-title" className="flex items-center gap-2">
            {getDialogTitle()}
            {mode === 'create' && hasDraft && (
              <Badge variant="secondary" className="ml-2">
                Draft Available
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription id="vendor-form-description">
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>

        <VendorForm
          mode={mode}
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
