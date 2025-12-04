import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Building2, Store, Eye, EyeOff } from 'lucide-react';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { useTenantAuth } from '@/contexts/TenantAuthContext';
import { useGlobalContext } from '@/contexts/GlobalContext';
import { authService, type AccountType } from '@/services/api/auth';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated: isPlatformAuth, login: platformLogin } = usePlatformAuth();
  const { isAuthenticated: isTenantAuth, login: tenantLogin } = useTenantAuth();
  const { switchContext, detectContext } = useGlobalContext();
  
  const [isPlatformMode, setIsPlatformMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // SECURITY FIX: Prevent redirect loops by checking current location
    const currentPath = window.location.pathname;
    
    if (isPlatformAuth && !currentPath.startsWith('/platform')) {
      navigate('/platform/dashboard', { replace: true });
    } else if (isTenantAuth && !currentPath.startsWith('/admin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isPlatformAuth, isTenantAuth, navigate]);

  const handleModeChange = (checked: boolean) => {
    setIsPlatformMode(checked);
    setError('');
    // Set demo credentials based on mode
    if (checked) {
      setEmail('admin@canvastencil.com');
      setPassword('SuperAdmin2024!');
    } else {
      setEmail('admin@demo-etching.com');
      setPassword('DemoAdmin2024!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isPlatformMode) {
        const result = await platformLogin(email, password);
        // The GlobalContext will automatically detect and switch context
        // via the useEffect in GlobalContextProvider
        if (result) {
          await detectContext();
        }
      } else {
        const result = await tenantLogin(email, password, 'demo-etching');
        // The GlobalContext will automatically detect and switch context
        // via the useEffect in GlobalContextProvider
        if (result) {
          await detectContext();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-16 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="w-full max-w-md">
          <Card className="p-8 shadow-lg">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                {isPlatformMode ? (
                  <Building2 className="w-8 h-8 text-primary" />
                ) : (
                  <Store className="w-8 h-8 text-primary" />
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {isPlatformMode ? 'Platform Admin Login' : 'Business Admin Login'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isPlatformMode 
                  ? 'Access platform management and system administration'
                  : 'Access your business operations and management tools'
                }
              </p>
            </div>

            {/* Account Type Switch */}
            <div className="flex items-center justify-center gap-4 mb-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-green-600" />
                <span className={`text-sm font-medium ${!isPlatformMode ? 'text-green-600' : 'text-muted-foreground'}`}>
                  Business
                </span>
              </div>
              <Switch
                checked={isPlatformMode}
                onCheckedChange={handleModeChange}
                className="data-[state=checked]:bg-blue-600"
              />
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className={`text-sm font-medium ${isPlatformMode ? 'text-blue-600' : 'text-muted-foreground'}`}>
                  Platform
                </span>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Info */}
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <p className="text-xs text-center text-muted-foreground mb-2">Demo Credentials:</p>
              <div className="text-xs text-center space-y-1">
                {isPlatformMode ? (
                  <div>
                    <p><strong>Platform:</strong> admin@canvastencil.com</p>
                    <p>Password: SuperAdmin2024!</p>
                  </div>
                ) : (
                  <div>
                    <p><strong>Business:</strong> admin@demo-etching.com</p>
                    <p>Password: DemoAdmin2024!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team or{' '}
                <Link to="/register" className="text-primary font-medium hover:underline">
                  create a new account
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
