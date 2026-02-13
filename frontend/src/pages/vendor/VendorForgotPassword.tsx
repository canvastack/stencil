/**
 * Vendor Forgot Password Page
 * 
 * Password reset request page for vendor portal.
 * Allows vendors to request a password reset email.
 * 
 * Requirements:
 * - 3.1: Display password reset request form
 * - 3.2: Send password reset link if email exists
 * 
 * @module pages/vendor/VendorForgotPassword
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Package } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import vendorApi from '@/services/api/vendorApi';

/**
 * VendorForgotPassword Component
 * 
 * Provides password reset request interface for vendor users.
 * Includes form validation, error handling, and success feedback.
 */
const VendorForgotPassword = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

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
    // Email validation
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    
    if (!validateEmail(email)) {
      setValidationError('Invalid email format');
      return false;
    }

    setValidationError(null);
    return true;
  };

  /**
   * Handle form submission
   * 
   * Validates input and sends password reset request
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    setValidationError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await vendorApi.requestPasswordReset({ email });
      
      // Show success state
      setIsSuccess(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (err: any) {
      console.error('Password reset request error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
      toast.error(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   * 
   * Clears validation error when user starts typing
   */
  const handleInputChange = (value: string) => {
    setEmail(value);
    
    // Clear validation error
    if (validationError) {
      setValidationError(null);
    }
    
    // Clear general error
    if (error) {
      setError(null);
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
              Reset Password
            </h1>
            <p className="text-purple-600 dark:text-purple-300">
              {isSuccess 
                ? 'Check your email for reset instructions'
                : 'Enter your email to receive a password reset link'
              }
            </p>
          </div>

          {/* Success State */}
          {isSuccess ? (
            <div className="space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Success Message */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200 text-center">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions.
                </p>
              </div>

              {/* Additional Info */}
              <div className="text-center text-sm text-muted-foreground space-y-2">
                <p>Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure the email address is correct</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>

              {/* Back to Login Button */}
              <Button 
                type="button"
                onClick={() => window.location.href = '/vendor/login'}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800" 
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>

              {/* Resend Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Try a different email address
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md mb-6">
                  <p className="text-sm text-destructive">{error}</p>
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
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={isLoading}
                    className={validationError ? 'border-destructive' : ''}
                    autoComplete="email"
                    autoFocus
                  />
                  {validationError && (
                    <p className="text-sm text-destructive">{validationError}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter the email address associated with your vendor account
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800" 
                  size="lg" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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

export default VendorForgotPassword;
