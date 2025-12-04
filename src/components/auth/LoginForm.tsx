import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authService } from '@/services/authService';

interface LoginFormProps {
  accountType: 'tenant' | 'platform';
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ accountType, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenant_slug: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (accountType === 'tenant') {
        if (!formData.tenant_slug) {
          setError('Tenant slug is required');
          setIsLoading(false);
          return;
        }
        await authService.loginTenant(formData.email, formData.password, formData.tenant_slug);
      } else {
        await authService.loginPlatform(formData.email, formData.password);
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {accountType === 'tenant' ? 'Tenant Login' : 'Platform Login'}
        </CardTitle>
        <CardDescription>
          {accountType === 'tenant' 
            ? 'Sign in to your tenant account' 
            : 'Sign in to the platform administration'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {accountType === 'tenant' && (
            <div className="space-y-2">
              <Label htmlFor="tenant_slug">Tenant</Label>
              <Input
                id="tenant_slug"
                name="tenant_slug"
                type="text"
                placeholder="demo-etching"
                value={formData.tenant_slug}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@demo-etching.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};