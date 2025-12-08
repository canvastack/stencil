import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Store } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTenantAuth } from '@/hooks/useTenantAuth';

const TenantLogin = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated } = useTenantAuth();
  const [showPassword, setShowPassword] = useState(false);
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
    { slug: 'etchinx', name: 'Demo Etching Business' },
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

    if (!selectedTenant) {
      newErrors.tenant = 'Pilih tenant terlebih dahulu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(formData.email, formData.password, selectedTenant);
      toast.success('Login berhasil! Selamat datang di Admin Panel.');
      navigate('/admin');
    } catch (err) {
      toast.error(error || 'Login gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/10 dark:to-teal-950/20">
        <Card className="w-full max-w-md p-8 shadow-xl border-green-200 dark:border-green-800">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <Store className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-green-900 dark:text-green-100">Tenant Admin</h1>
            <p className="text-green-600 dark:text-green-300">Login ke Admin Panel Bisnis</p>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md mb-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tenant">Pilih Tenant Bisnis</Label>
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

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800" size="lg" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login ke Admin Panel'}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">Demo Account Tenant:</p>
              <p>Email: <span className="font-mono text-foreground">admin@etchinx.com</span></p>
              <p>Password: <span className="font-mono text-foreground">DemoAdmin2024!</span></p>
              <p className="mt-2 text-xs">Atau:</p>
              <p>Email: <span className="font-mono text-foreground">manager@etchinx.com</span></p>
              <p>Password: <span className="font-mono text-foreground">DemoManager2024!</span></p>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Akses Platform?{' '}
              <Link to="/platform/login" className="text-primary font-medium hover:underline">
                Login Platform
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default TenantLogin;