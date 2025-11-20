import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';
import { AccountType } from '@/services/api/auth';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useAuthState();
  const [showPassword, setShowPassword] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('tenant');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const demoTenants = [
    { slug: 'demo-etching', name: 'Demo Etching' },
  ];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email harus diisi';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.password) {
      newErrors.password = 'Password harus diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (accountType === 'tenant' && !selectedTenant) {
      newErrors.tenant = 'Pilih tenant terlebih dahulu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login({
        email: formData.email,
        password: formData.password,
        accountType,
        tenant_slug: selectedTenant || undefined,
      });
      toast.success('Login berhasil! Selamat datang.');
      navigate('/admin');
    } catch (err) {
      toast.error(error || 'Login gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-background via-muted/30 to-background">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Selamat Datang Kembali</h1>
            <p className="text-muted-foreground">Login ke akun Anda</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Tipe Akun</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="platform"
                    checked={accountType === 'platform'}
                    onChange={(e) => {
                      setAccountType(e.target.value as AccountType);
                      setErrors({ ...errors, tenant: '' });
                    }}
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Admin Platform</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accountType"
                    value="tenant"
                    checked={accountType === 'tenant'}
                    onChange={(e) => {
                      setAccountType(e.target.value as AccountType);
                      setErrors({ ...errors, tenant: '' });
                    }}
                    disabled={isLoading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Pengguna Tenant</span>
                </label>
              </div>
            </div>

            {accountType === 'tenant' && (
              <div className="space-y-2">
                <Label htmlFor="tenant">Pilih Tenant</Label>
                <select
                  id="tenant"
                  value={selectedTenant}
                  onChange={(e) => {
                    setSelectedTenant(e.target.value);
                    setErrors({ ...errors, tenant: '' });
                  }}
                  disabled={isLoading}
                  className={`w-full border rounded px-3 py-2 bg-background ${errors.tenant ? 'border-destructive' : 'border-input'}`}
                >
                  <option value="">Pilih tenant...</option>
                  {demoTenants.map((tenant) => (
                    <option key={tenant.slug} value={tenant.slug}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                {errors.tenant && (
                  <p className="text-sm text-destructive">{errors.tenant}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: '' });
                }}
                disabled={isLoading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                  disabled={isLoading}
                  className={errors.password ? 'border-destructive' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Lupa Password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Demo Account:</p>
              {accountType === 'platform' ? (
                <>
                  <p>Email: <span className="font-mono text-foreground">admin@canvastencil.com</span></p>
                  <p>Password: <span className="font-mono text-foreground">SuperAdmin2024!</span></p>
                </>
              ) : (
                <>
                  <p>Email: <span className="font-mono text-foreground">admin@demo-etching.com</span></p>
                  <p>Password: <span className="font-mono text-foreground">DemoAdmin2024!</span></p>
                  <p className="mt-2 text-xs">Atau:</p>
                  <p>Email: <span className="font-mono text-foreground">manager@demo-etching.com</span></p>
                  <p>Password: <span className="font-mono text-foreground">DemoManager2024!</span></p>
                </>
              )}
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Belum punya akun?{' '}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Daftar sekarang
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
