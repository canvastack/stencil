import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Header from '@/themes/default/components/Header';
import Footer from '@/themes/default/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';

const ForgotPassword = () => {
  const { forgotPassword, isLoading, error: authError } = useAuthState();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email harus diisi');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Format email tidak valid');
      return;
    }

    try {
      setError('');
      await forgotPassword({ email });
      toast.success('Link reset password telah dikirim ke email Anda');
      setIsSubmitted(true);
    } catch (err) {
      toast.error(authError || 'Gagal mengirim link reset password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-background via-muted/30 to-background">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Lupa Password?</h1>
            <p className="text-muted-foreground">
              {isSubmitted 
                ? 'Link reset password telah dikirim' 
                : 'Masukkan email Anda untuk reset password'}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || authError) && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md">
                  <p className="text-sm text-destructive">{error || authError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  className={error || authError ? 'border-destructive' : ''}
                />
                {(error || authError) && !error && (
                  <p className="text-sm text-destructive">{authError}</p>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Mengirim...' : 'Kirim Link Reset Password'}
              </Button>

              <div className="text-center">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Kembali ke Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  Kami telah mengirimkan link reset password ke <strong>{email}</strong>. 
                  Silakan cek inbox atau folder spam Anda.
                </p>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/login">
                  Kembali ke Login
                </Link>
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
