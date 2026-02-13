/**
 * Vendor Reset Password Page
 * 
 * Password reset confirmation page for vendor portal.
 * Allows vendors to set a new password using a reset token.
 * 
 * Requirements:
 * - 3.3: Display password reset form
 * - 3.4: Validate password strength requirements
 * - 3.5: Invalidate reset token on successful reset
 * - 3.7: Display error for expired tokens and offer to resend
 * 
 * @module pages/vendor/VendorResetPassword
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, Package, CheckCircle2, XCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import vendorApi from '@/services/api/vendorApi';

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
};

/**
 * Password strength indicator
 */
interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
}

/**
 * VendorResetPassword Component
 * 
 * Provides password reset interface for vendor users.
 * Includes password strength validation, confirmation matching, and token validation.
 */
const VendorResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get token and email from URL
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  // Form state
  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /**
   * Validate token presence on mount
   */
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  /**
   * Calculate password strength
   * 
   * @param password - Password to evaluate
   * @returns Password strength object
   */
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= PASSWORD_REQUIREMENTS.minLength) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-green-500',
    ];

    return {
      score,
      label: labels[score] || 'Very Weak',
      color: colors[score] || 'bg-red-500',
    };
  };

  /**
   * Validate password strength
   * 
   * @param password - Password to validate
   * @param newErrors - Errors object to add password errors to
   * @returns True if password meets requirements, false otherwise
   */
  const validatePasswordStrength = (password: string, newErrors: Record<string, string>): boolean => {
    const errors: string[] = [];

    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors.push(`at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
    }
    if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('one uppercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('one lowercase letter');
    }
    if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password)) {
      errors.push('one number');
    }
    if (PASSWORD_REQUIREMENTS.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
      errors.push('one special character');
    }

    if (errors.length > 0) {
      newErrors.password = `Password must contain ${errors.join(', ')}`;
      return false;
    }

    return true;
  };

  /**
   * Validate form inputs
   * 
   * @returns True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      // Validate password strength and add errors to newErrors object
      validatePasswordStrength(password, newErrors);
    }

    // Password confirmation validation
    if (!passwordConfirmation) {
      newErrors.passwordConfirmation = 'Password confirmation is required';
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * 
   * Validates inputs and submits password reset
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setValidationErrors({});

    // Validate token
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await vendorApi.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      // Show success state
      setIsSuccess(true);
      toast.success('Password reset successful! You can now login with your new password.');
    } catch (err: any) {
      console.error('Password reset error:', err);
      
      // Check for expired token error
      if (err.message?.includes('expired') || err.message?.includes('invalid token')) {
        setError(
          'This password reset link has expired or is invalid. Please request a new one.'
        );
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
      
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   * 
   * Clears validation error for the field being edited
   */
  const handleInputChange = (field: 'email' | 'password' | 'passwordConfirmation', value: string) => {
    // Update field value
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'passwordConfirmation') setPasswordConfirmation(value);
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      const newErrors = { ...validationErrors };
      delete newErrors[field];
      setValidationErrors(newErrors);
    }
    
    // Clear general error
    if (error) {
      setError(null);
    }
  };

  /**
   * Get password strength for display
   */
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  /**
   * Check if passwords match
   */
  const passwordsMatch = password && passwordConfirmation && password === passwordConfirmation;

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
              Set New Password
            </h1>
            <p className="text-purple-600 dark:text-purple-300">
              {isSuccess 
                ? 'Your password has been reset successfully'
                : 'Enter your new password below'
              }
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200 text-center">
                  Your password has been reset successfully. You can now login with your new password.
                </p>
              </div>

              {/* Login Button */}
              <Button 
                type="button"
                onClick={() => navigate('/vendor/login')}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800" 
                size="lg"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md mb-6">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-destructive">{error}</p>
                      {error.includes('expired') && (
                        <Link 
                          to="/vendor/forgot-password" 
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Request a new reset link
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vendor@example.com"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading || !!emailParam}
                    className={validationErrors.email ? 'border-destructive' : ''}
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive">{validationErrors.email}</p>
                  )}
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      disabled={isLoading}
                      className={validationErrors.password ? 'border-destructive' : ''}
                      autoComplete="new-password"
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
                  
                  {/* Password Strength Indicator */}
                  {password && passwordStrength && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Password Requirements */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium">Password must contain:</p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li className={password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}>
                        At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        One number
                      </li>
                      <li className={/[^a-zA-Z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}>
                        One special character
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirmation">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="passwordConfirmation"
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordConfirmation}
                      onChange={(e) => handleInputChange('passwordConfirmation', e.target.value)}
                      disabled={isLoading}
                      className={validationErrors.passwordConfirmation ? 'border-destructive' : ''}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}
                    >
                      {showPasswordConfirmation ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {validationErrors.passwordConfirmation && (
                    <p className="text-sm text-destructive">{validationErrors.passwordConfirmation}</p>
                  )}
                  
                  {/* Password Match Indicator */}
                  {passwordConfirmation && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-green-600 dark:text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-destructive">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800" 
                  size="lg" 
                  disabled={isLoading || !token}
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </Button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center">
                <Link 
                  to="/vendor/login" 
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Link>
              </div>
            </>
          )}

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
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default VendorResetPassword;
