import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, User } from 'lucide-react';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

interface CustomerDataModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerData) => void;
  isSubmitting?: boolean;
}

export function CustomerDataModal({ 
  open, 
  onClose, 
  onSubmit,
  isSubmitting = false 
}: CustomerDataModalProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerData, string>> = {};

    if (!customerData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (customerData.name.trim().length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    if (!customerData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!customerData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^(\+?62|0)[0-9]{9,12}$/.test(customerData.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Format nomor telepon tidak valid (contoh: 081234567890 atau +628123456789)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: customerData.name.trim(),
        email: customerData.email.trim(),
        phone: customerData.phone.trim().replace(/[\s-]/g, ''),
      });
    }
  };

  const handleChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Data Diri Pemesan</DialogTitle>
              <DialogDescription className="text-sm">
                Mohon lengkapi data diri Anda untuk melanjutkan pesanan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">
              Nama Lengkap <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-name"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={customerData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSubmitting}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="contoh@email.com"
              value={customerData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isSubmitting}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">
              Nomor Telepon <span className="text-destructive">*</span>
            </Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="081234567890"
              value={customerData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={isSubmitting}
              className={errors.phone ? 'border-destructive' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Mohon perbaiki kesalahan pada form
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Lanjutkan Pesanan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
