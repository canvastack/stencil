import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import Header from '@/themes/default/components/Header';
import Footer from '@/themes/default/components/Footer';
import { useAuthState } from '@/hooks/useAuthState';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, resendVerification, isLoading, error: authError } = useAuthState();
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (token) {
      setVerificationToken(token);
      verifyEmailToken(token);
    } else if (emailParam) {
      setEmail(emailParam);
      setShowResend(true);
    }
  }, [searchParams]);

  const verifyEmailToken = async (token: string) => {
    try {
      await verifyEmail({ token });
      setIsVerified(true);
      toast.success('Email berhasil diverifikasi!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      toast.error(authError || 'Gagal memverifikasi email');
      setShowResend(true);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error('Email harus diisi');
      return;
    }

    try {
      setResendLoading(true);
      await resendVerification({ email });
      toast.success('Email verifikasi telah dikirim ulang');
      setShowResend(false);
    } catch (err) {
      toast.error(authError || 'Gagal mengirim ulang email verifikasi');
    } finally {
      setResendLoading(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-background via-muted/30 to-background">
          <Card className="w-full max-w-md p-8 shadow-xl text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Email Terverifikasi!</h1>
            <p className="text-muted-foreground mb-6">
              Email Anda berhasil diverifikasi. Anda akan diarahkan ke halaman login...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  if (verificationToken && isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-background via-muted/30 to-background">
          <Card className="w-full max-w-md p-8 shadow-xl text-center">
            <div className="flex justify-center mb-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Memverifikasi Email...</h1>
            <p className="text-muted-foreground">
              Mohon tunggu sebentar
            </p>
          </Card>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <div className="flex-1 flex items-center justify-center px-4 py-32 bg-gradient-to-br from-background via-muted/30 to-background">
        <Card className="w-full max-w-md p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Verifikasi Email</h1>
            <p className="text-muted-foreground">
              {showResend 
                ? 'Verifikasi email Anda untuk melanjutkan' 
                : 'Email verifikasi telah dikirim ke inbox Anda'}
            </p>
          </div>

          {authError && (
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md mb-6">
              <p className="text-sm text-destructive">{authError}</p>
            </div>
          )}

          {!showResend && !isLoading && (
            <div className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-center">
                  Kami telah mengirimkan link verifikasi email ke inbox Anda. 
                  Silakan cek inbox atau folder spam Anda dan klik link untuk memverifikasi email.
                </p>
              </div>

              <div className="text-center">
                <button
                  onClick={() => setShowResend(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Tidak menerima email? Kirim ulang
                </button>
              </div>
            </div>
          )}

          {showResend && (
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Masukkan email Anda untuk mengirim ulang link verifikasi
                </p>
                <input
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={resendLoading}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <Button 
                onClick={handleResendVerification} 
                className="w-full" 
                size="lg"
                disabled={resendLoading}
              >
                {resendLoading ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setShowResend(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Kembali
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default VerifyEmail;
