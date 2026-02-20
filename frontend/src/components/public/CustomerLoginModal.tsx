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
import { Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';

interface CustomerLoginModalProps {
  open: boolean;
  onClose: () => void;
}

export function CustomerLoginModal({ open, onClose }: CustomerLoginModalProps) {
  const { login, isLoggingIn } = useCustomerAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      login(
        { email: email.trim(), password },
        {
          onSuccess: () => {
            onClose();
            setEmail('');
            setPassword('');
            setErrors({});
          },
        }
      );
    }
  };

  const handleChange = (field: 'email' | 'password', value: string) => {
    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }

    if (errors[field]) {
      setErrors((prev) => {
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
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Login Pelanggan
          </DialogTitle>
          <DialogDescription>
            Masuk ke akun Anda untuk melihat pesanan dan penawaran harga
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isLoggingIn}
              className={errors.email ? 'border-destructive' : ''}
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => handleChange('password', e.target.value)}
              disabled={isLoggingIn}
              className={errors.password ? 'border-destructive' : ''}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Mohon perbaiki kesalahan pada form</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between text-sm">
            <a
              href="/customer/forgot-password"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement forgot password flow
                alert('Fitur lupa password akan segera hadir');
              }}
            >
              Lupa password?
            </a>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoggingIn}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <a href="/customer/register" className="text-primary hover:underline">
            Daftar sekarang
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
