import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/authService';

const LoginPage: React.FC = () => {
  const [accountType, setAccountType] = useState<'tenant' | 'platform'>('tenant');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check if already authenticated
    if (authService.isAuthenticated()) {
      const type = authService.getAccountType();
      if (type === 'tenant') {
        navigate('/admin');
      } else if (type === 'platform') {
        navigate('/platform');
      }
    }

    // Set account type from URL params
    const typeParam = searchParams.get('type');
    if (typeParam === 'platform') {
      setAccountType('platform');
    }
  }, [navigate, searchParams]);

  const handleLoginSuccess = () => {
    if (accountType === 'tenant') {
      navigate('/admin');
    } else {
      navigate('/platform');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
          <Button
            variant={accountType === 'tenant' ? 'default' : 'outline'}
            onClick={() => setAccountType('tenant')}
          >
            Tenant Login
          </Button>
          <Button
            variant={accountType === 'platform' ? 'default' : 'outline'}
            onClick={() => setAccountType('platform')}
          >
            Platform Login
          </Button>
        </div>

        <LoginForm 
          accountType={accountType}
          onSuccess={handleLoginSuccess}
        />

        <div className="text-center text-sm text-gray-600 space-y-2">
          <p><strong>Demo Credentials:</strong></p>
          {accountType === 'tenant' ? (
            <>
              <p>Email: admin@demo-etching.com</p>
              <p>Password: DemoAdmin2024!</p>
              <p>Tenant: demo-etching</p>
            </>
          ) : (
            <>
              <p>Email: admin@canvastencil.com</p>
              <p>Password: PlatformAdmin2024!</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;