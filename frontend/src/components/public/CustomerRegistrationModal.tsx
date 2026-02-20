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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, User, UserPlus, ShoppingCart } from 'lucide-react';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  createAccount?: boolean;
}

interface CustomerRegistrationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerData) => void;
  isSubmitting?: boolean;
}

export function CustomerRegistrationModal({ 
  open, 
  onClose, 
  onSubmit,
  isSubmitting = false 
}: CustomerRegistrationModalProps) {
  const [activeTab, setActiveTab] = useState<'guest' | 'register'>('guest');
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    createAccount: false,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerData | 'confirmPassword', string>>>({});
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CustomerData | 'confirmPassword', string>> = {};

    // Common validations
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
      newErrors.phone = 'Format nomor telepon tidak valid (contoh: 081234567890)';
    }

    // Registration-specific validations
    if (activeTab === 'register') {
      if (!customerData.password) {
        newErrors.password = 'Password wajib diisi';
      } else if (customerData.password.length < 8) {
        newErrors.password = 'Password minimal 8 karakter';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(customerData.password)) {
        newErrors.password = 'Password harus mengandung huruf besar, huruf kecil, dan angka';
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = 'Konfirmasi password wajib diisi';
      } else if (confirmPassword !== customerData.password) {
        newErrors.confirmPassword = 'Password tidak cocok';
      }

      if (!agreeToTerms) {
        newErrors.name = 'Anda harus menyetujui syarat dan ketentuan';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData: CustomerData = {
        name: customerData.name.trim(),
        email: customerData.email.trim(),
        phone: customerData.phone.trim().replace(/[\s-]/g, ''),
        createAccount: activeTab === 'register',
      };

      if (activeTab === 'register') {
        submitData.password = customerData.password;
      }

      onSubmit(submitData);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lengkapi Data Pemesanan</DialogTitle>
          <DialogDescription>
            Pilih untuk melanjutkan sebagai tamu atau buat akun untuk kemudahan pemesanan di masa depan
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'guest' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guest" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Lanjut sebagai Tamu
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Buat Akun
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-4">
            <TabsContent value="guest" className="space-y-4 mt-0">
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  Anda akan menerima email konfirmasi pesanan. Anda dapat membuat akun nanti untuk melacak pesanan Anda.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="guest-name">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-name"
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
                <Label htmlFor="guest-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-email"
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
                <Label htmlFor="guest-phone">
                  Nomor Telepon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="guest-phone"
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
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-0">
              <Alert>
                <UserPlus className="h-4 w-4" />
                <AlertDescription>
                  Buat akun untuk melacak pesanan, menyimpan alamat, dan mendapatkan penawaran khusus.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="register-name">
                  Nama Lengkap <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="register-name"
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
                <Label htmlFor="register-email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="register-email"
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
                <p className="text-xs text-muted-foreground">
                  Email verifikasi akan dikirim setelah pemesanan
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-phone">
                  Nomor Telepon <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="register-phone"
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

              <div className="space-y-2">
                <Label htmlFor="register-password">
                  Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Minimal 8 karakter"
                  value={customerData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isSubmitting}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Harus mengandung huruf besar, huruf kecil, dan angka
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Konfirmasi Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.confirmPassword;
                        return newErrors;
                      });
                    }
                  }}
                  disabled={isSubmitting}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Saya setuju dengan{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    syarat dan ketentuan
                  </a>{' '}
                  serta{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    kebijakan privasi
                  </a>
                </label>
              </div>
            </TabsContent>

            {hasErrors && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Mohon perbaiki kesalahan pada form
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 sm:gap-0 mt-6">
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
                disabled={isSubmitting || (activeTab === 'register' && !agreeToTerms)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    {activeTab === 'guest' ? 'Lanjutkan Pesanan' : 'Buat Akun & Pesan'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
