/**
 * Vendor Login Page
 * 
 * Login page for vendor portal access.
 * Allows vendors to authenticate and access their assigned quotes.
 * 
 * Requirements:
 * - 1.1: Display login form with email and password fields
 * - 1.2: Authenticate vendor and create session token
 * - 1.3: Return error message for invalid credentials
 * - 11.1: Public route /vendor/login for authentication
 * 
 * @module pages/vendor/VendorLogin
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Package } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useVendorAuth } from '@/contexts/VendorAuthContext';

/**
 * VendorLogin Component
 * 
 * Provides authentication interface for vendor users.
 * Includes form validation, error handling, and redirect logic.
 */
const VendorLogin = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated, clearError } = useVendorAuth();
  
  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Redirect authenticated vendors to dashboard
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/vendor/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Clear errors when component unmounts
   */
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate form inputs
   * 
   * @returns True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * 
   * Validates inputs and attempts login via VendorAuthContext
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    setValidationErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful! Welcome to Vendor Portal.');
      // Navigation handled by useEffect when isAuthenticated changes
    } catch (err: any) {
      // Error is handled by VendorAuthContext and displayed via error state
      toast.error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  /**
   * Handle input change
   * 
   * Clears validation error for the field being edited
   */
  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData({ ...formData, [field]: value });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors({ ...validationErrors, [field]: '' });
    }
    
    // Clear auth error when user starts typing
    if (error) {
      clearError();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-purple-50 via-pink-50/30 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-orange-950/20">
        <Card className="w-full max-w-md p-8 shadow-xl border-purple-200 dark:border-purple-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-purple-900 dark:text-purple-100">
              Vendor Portal
            </h1>
            <p className="text-purple-600 dark:text-purple-300">
              Login to manage your quotes
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md mb-6">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vendor@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                className={validationErrors.email ? 'border-destructive' : ''}
                autoComplete="email"
                autoFocus
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/vendor/forgot-password" 
                  className="text-xs text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                  className={validationErrors.password ? 'border-destructive' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800" 
              size="lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login to Portal'}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Need help?{' '}
              <a 
                href="mailto:support@canvastencil.com" 
                className="text-primary font-medium hover:underline"
              >
                Contact Support
              </a>
            </p>
          </div>

          {/* Demo Info (Development Only) */}
          {import.meta.env.DEV && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-muted">
              <p className="text-xs text-center text-muted-foreground mb-2 font-semibold">
                Demo Credentials (Development Only):
              </p>
              <div className="text-xs text-center space-y-1">
                <p>Email: <span className="font-mono text-foreground">vendor@etchinx.com</span></p>
                <p>Password: <span className="font-mono text-foreground">VendorDemo2024!</span></p>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default VendorLogin;
