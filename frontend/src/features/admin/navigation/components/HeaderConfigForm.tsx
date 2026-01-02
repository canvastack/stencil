import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { useHeaderConfig } from '@/hooks/useNavigationConfig';
import { HeaderConfigInput } from '@/types/navigation';
import { Loader2, Save, RotateCcw } from 'lucide-react';

export const HeaderConfigForm = () => {
  const { headerConfig, isLoading, createHeaderConfig, updateHeaderConfig, isCreating, isUpdating } = useHeaderConfig();
  const [stylingOptions, setStylingOptions] = useState({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    activeColor: '#ff6b35',
    hoverColor: '#ff8559',
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<HeaderConfigInput>({
    defaultValues: {
      brand_name: '',
      brand_initials: '',
      brand_tagline: '',
      logo_url: '',
      logo_dark_url: '',
      logo_width: 150,
      logo_height: 50,
      logo_alt_text: '',
      use_logo: true,
      header_style: 'default',
      show_cart: true,
      show_search: true,
      show_login: true,
      sticky_header: true,
      transparent_on_scroll: false,
      login_button_text: 'Login',
      cart_button_text: 'Keranjang',
      search_placeholder: 'Cari produk...',
      is_active: true,
      notes: '',
    }
  });

  useEffect(() => {
    console.log('[HeaderConfigForm] 📥 useEffect triggered');
    console.log('[HeaderConfigForm] headerConfig:', headerConfig);
    console.log('[HeaderConfigForm] headerConfig type:', typeof headerConfig);
    console.log('[HeaderConfigForm] isLoading:', isLoading);
    
    if (headerConfig) {
      console.log('[HeaderConfigForm] ✅ Populating form with headerConfig data');
      console.log('[HeaderConfigForm] brand_name:', headerConfig.brand_name);
      console.log('[HeaderConfigForm] brand_initials:', headerConfig.brand_initials);
      console.log('[HeaderConfigForm] brand_tagline:', headerConfig.brand_tagline);
      
      reset({
        brand_name: headerConfig.brand_name,
        brand_initials: headerConfig.brand_initials || '',
        brand_tagline: headerConfig.brand_tagline || '',
        logo_url: headerConfig.logo_url || '',
        logo_dark_url: headerConfig.logo_dark_url || '',
        logo_width: headerConfig.logo_width || 150,
        logo_height: headerConfig.logo_height || 50,
        logo_alt_text: headerConfig.logo_alt_text || '',
        use_logo: headerConfig.use_logo,
        header_style: headerConfig.header_style,
        show_cart: headerConfig.show_cart,
        show_search: headerConfig.show_search,
        show_login: headerConfig.show_login,
        sticky_header: headerConfig.sticky_header,
        transparent_on_scroll: headerConfig.transparent_on_scroll,
        login_button_text: headerConfig.login_button_text || '',
        cart_button_text: headerConfig.cart_button_text || '',
        search_placeholder: headerConfig.search_placeholder || '',
        is_active: headerConfig.is_active,
        notes: headerConfig.notes || '',
      });

      if (headerConfig.styling_options) {
        setStylingOptions({
          backgroundColor: headerConfig.styling_options.backgroundColor || '#ffffff',
          textColor: headerConfig.styling_options.textColor || '#000000',
          activeColor: headerConfig.styling_options.activeColor || '#ff6b35',
          hoverColor: headerConfig.styling_options.hoverColor || '#ff8559',
        });
      }
      
      console.log('[HeaderConfigForm] ✅ Form reset complete');
    } else {
      console.log('[HeaderConfigForm] ⚠️ headerConfig is null/undefined, skipping form population');
    }
  }, [headerConfig, reset]);

  const onSubmit = async (data: HeaderConfigInput) => {
    const payload = {
      ...data,
      styling_options: stylingOptions,
    };

    try {
      if (headerConfig) {
        await updateHeaderConfig(payload);
      } else {
        await createHeaderConfig(payload);
      }
    } catch (error) {
      console.error('Failed to save header config:', error);
    }
  };

  const handleReset = () => {
    if (headerConfig) {
      reset();
      if (headerConfig.styling_options) {
        setStylingOptions({
          backgroundColor: headerConfig.styling_options.backgroundColor || '#ffffff',
          textColor: headerConfig.styling_options.textColor || '#000000',
          activeColor: headerConfig.styling_options.activeColor || '#ff6b35',
          hoverColor: headerConfig.styling_options.hoverColor || '#ff8559',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Brand</CardTitle>
          <CardDescription>Konfigurasi informasi brand dan logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand_name">Nama Brand *</Label>
            <Input
              id="brand_name"
              {...register('brand_name', { required: 'Nama brand harus diisi' })}
              placeholder="Contoh: Etching Xenial"
            />
            {errors.brand_name && (
              <p className="text-sm text-destructive">{errors.brand_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand_initials">Inisial Brand</Label>
              <Input
                id="brand_initials"
                {...register('brand_initials')}
                placeholder="Contoh: CEX"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand_tagline">Tagline</Label>
              <Input
                id="brand_tagline"
                {...register('brand_tagline')}
                placeholder="Contoh: Solusi Etching Profesional"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL Logo</Label>
            <Input
              id="logo_url"
              {...register('logo_url')}
              placeholder="https://example.com/logo.png"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_dark_url">URL Logo (Dark Mode)</Label>
            <Input
              id="logo_dark_url"
              {...register('logo_dark_url')}
              placeholder="https://example.com/logo-dark.png"
              type="url"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo_width">Lebar Logo (px)</Label>
              <Input
                id="logo_width"
                type="number"
                {...register('logo_width', { valueAsNumber: true, min: 20, max: 500 })}
                min={20}
                max={500}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_height">Tinggi Logo (px)</Label>
              <Input
                id="logo_height"
                type="number"
                {...register('logo_height', { valueAsNumber: true, min: 20, max: 200 })}
                min={20}
                max={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_alt_text">Alt Text Logo</Label>
              <Input
                id="logo_alt_text"
                {...register('logo_alt_text')}
                placeholder="Logo Brand"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="use_logo"
              checked={watch('use_logo')}
              onCheckedChange={(checked) => setValue('use_logo', checked)}
            />
            <Label htmlFor="use_logo">Gunakan Logo</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opsi Tampilan</CardTitle>
          <CardDescription>Konfigurasi elemen yang ditampilkan di header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="header_style">Style Header</Label>
            <Select
              value={watch('header_style')}
              onValueChange={(value) => setValue('header_style', value as any)}
            >
              <SelectTrigger id="header_style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show_search"
                checked={watch('show_search')}
                onCheckedChange={(checked) => setValue('show_search', checked)}
              />
              <Label htmlFor="show_search">Tampilkan Pencarian</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_cart"
                checked={watch('show_cart')}
                onCheckedChange={(checked) => setValue('show_cart', checked)}
              />
              <Label htmlFor="show_cart">Tampilkan Keranjang</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show_login"
                checked={watch('show_login')}
                onCheckedChange={(checked) => setValue('show_login', checked)}
              />
              <Label htmlFor="show_login">Tampilkan Login</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="sticky_header"
                checked={watch('sticky_header')}
                onCheckedChange={(checked) => setValue('sticky_header', checked)}
              />
              <Label htmlFor="sticky_header">Sticky Header</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="transparent_on_scroll"
                checked={watch('transparent_on_scroll')}
                onCheckedChange={(checked) => setValue('transparent_on_scroll', checked)}
              />
              <Label htmlFor="transparent_on_scroll">Transparent on Scroll</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={watch('is_active')}
                onCheckedChange={(checked) => setValue('is_active', checked)}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="login_button_text">Teks Tombol Login</Label>
              <Input
                id="login_button_text"
                {...register('login_button_text')}
                placeholder="Login"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cart_button_text">Teks Tombol Keranjang</Label>
              <Input
                id="cart_button_text"
                {...register('cart_button_text')}
                placeholder="Keranjang"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search_placeholder">Placeholder Pencarian</Label>
              <Input
                id="search_placeholder"
                {...register('search_placeholder')}
                placeholder="Cari produk..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Styling & Warna</CardTitle>
          <CardDescription>Kustomisasi warna header</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Warna Background</Label>
              <ColorPicker
                value={stylingOptions.backgroundColor}
                onChange={(color) => setStylingOptions({ ...stylingOptions, backgroundColor: color })}
              />
            </div>

            <div className="space-y-2">
              <Label>Warna Teks</Label>
              <ColorPicker
                value={stylingOptions.textColor}
                onChange={(color) => setStylingOptions({ ...stylingOptions, textColor: color })}
              />
            </div>

            <div className="space-y-2">
              <Label>Warna Aktif</Label>
              <ColorPicker
                value={stylingOptions.activeColor}
                onChange={(color) => setStylingOptions({ ...stylingOptions, activeColor: color })}
              />
            </div>

            <div className="space-y-2">
              <Label>Warna Hover</Label>
              <ColorPicker
                value={stylingOptions.hoverColor}
                onChange={(color) => setStylingOptions({ ...stylingOptions, hoverColor: color })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catatan</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            {...register('notes')}
            placeholder="Catatan internal (opsional)"
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={handleReset} disabled={isSaving}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
