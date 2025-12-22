import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';

const UserProfile = () => {
  const { user, getCurrentUser, updateProfile, changePassword, isLoading, error: authError } = useAuthState();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await getCurrentUser();
      } catch (err) {
        toast.error('Gagal memuat data pengguna');
      }
    };
    
    loadUser();
  }, [getCurrentUser]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!profileData.name || profileData.name.length < 3) {
      newErrors.name = 'Nama minimal 3 karakter';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setProfileLoading(true);
      await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
      });
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      toast.error(authError || 'Gagal memperbarui profil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Password saat ini harus diisi';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Password baru harus diisi';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password minimal 8 karakter';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password berhasil diubah');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      toast.error(authError || 'Gagal mengubah password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profil Pengguna</h1>
          <p className="text-muted-foreground">Kelola informasi akun Anda</p>
        </div>

        {authError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md mb-6">
            <p className="text-sm text-destructive">{authError}</p>
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="profile">Informasi Profil</TabsTrigger>
            <TabsTrigger value="password">Ubah Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="p-8">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <Input
                    id="name"
                    type="text"
                    value={profileData.name}
                    onChange={(e) => {
                      setProfileData({ ...profileData, name: e.target.value });
                      setErrors({ ...errors, name: '' });
                    }}
                    disabled={profileLoading}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email tidak dapat diubah
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08123456789"
                    value={profileData.phone}
                    onChange={(e) => {
                      setProfileData({ ...profileData, phone: e.target.value });
                      setErrors({ ...errors, phone: '' });
                    }}
                    disabled={profileLoading}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={profileLoading}
                >
                  {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="p-8">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Password Saat Ini</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, currentPassword: e.target.value });
                        setErrors({ ...errors, currentPassword: '' });
                      }}
                      disabled={passwordLoading}
                      className={errors.currentPassword ? 'border-destructive' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      disabled={passwordLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">{errors.currentPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, newPassword: e.target.value });
                        setErrors({ ...errors, newPassword: '' });
                      }}
                      disabled={passwordLoading}
                      className={errors.newPassword ? 'border-destructive' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      disabled={passwordLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">{errors.newPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                        setErrors({ ...errors, confirmPassword: '' });
                      }}
                      disabled={passwordLoading}
                      className={errors.confirmPassword ? 'border-destructive' : ''}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={passwordLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Mengubah...' : 'Ubah Password'}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
