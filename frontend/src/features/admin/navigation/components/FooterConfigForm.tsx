import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { useFooterConfig } from '@/hooks/useNavigationConfig';
import { FooterConfigInput, FooterSection, SocialLink, LegalLink } from '@/types/navigation';
import { Loader2, Save, RotateCcw, Plus, Trash2 } from 'lucide-react';

export const FooterConfigForm = () => {
  const { footerConfig, isLoading, createFooterConfig, updateFooterConfig, isCreating, isUpdating } = useFooterConfig();
  
  const { register, handleSubmit, setValue, watch, reset, control, formState: { errors } } = useForm<FooterConfigInput>({
    defaultValues: {
      footer_sections: [],
      contact_address: '',
      contact_phone: '',
      contact_email: '',
      contact_working_hours: '',
      social_links: [],
      show_newsletter: false,
      newsletter_title: '',
      newsletter_subtitle: '',
      newsletter_button_text: 'Subscribe',
      newsletter_api_endpoint: '',
      about_text: '',
      copyright_text: '',
      bottom_text: '',
      show_social_links: true,
      show_contact_info: true,
      show_sections: true,
      footer_style: 'default',
      background_color: '#1a1a1a',
      text_color: '#ffffff',
      legal_links: [],
      is_active: true,
      notes: '',
    }
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control,
    name: 'footer_sections',
  });

  const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
    control,
    name: 'social_links',
  });

  const { fields: legalFields, append: appendLegal, remove: removeLegal } = useFieldArray({
    control,
    name: 'legal_links',
  });

  useEffect(() => {
    console.log('[FooterConfigForm] 📥 useEffect triggered');
    console.log('[FooterConfigForm] footerConfig:', footerConfig);
    console.log('[FooterConfigForm] footerConfig type:', typeof footerConfig);
    console.log('[FooterConfigForm] isLoading:', isLoading);
    
    if (footerConfig) {
      console.log('[FooterConfigForm] ✅ Populating form with footerConfig data');
      console.log('[FooterConfigForm] contact_address:', footerConfig.contact_address);
      console.log('[FooterConfigForm] contact_phone:', footerConfig.contact_phone);
      console.log('[FooterConfigForm] contact_email:', footerConfig.contact_email);
      
      reset({
        footer_sections: footerConfig.footer_sections || [],
        contact_address: footerConfig.contact_address || '',
        contact_phone: footerConfig.contact_phone || '',
        contact_email: footerConfig.contact_email || '',
        contact_working_hours: footerConfig.contact_working_hours || '',
        social_links: footerConfig.social_links || [],
        show_newsletter: footerConfig.show_newsletter,
        newsletter_title: footerConfig.newsletter_title || '',
        newsletter_subtitle: footerConfig.newsletter_subtitle || '',
        newsletter_button_text: footerConfig.newsletter_button_text || '',
        newsletter_api_endpoint: footerConfig.newsletter_api_endpoint || '',
        about_text: footerConfig.about_text || '',
        copyright_text: footerConfig.copyright_text || '',
        bottom_text: footerConfig.bottom_text || '',
        show_social_links: footerConfig.show_social_links,
        show_contact_info: footerConfig.show_contact_info,
        show_sections: footerConfig.show_sections,
        footer_style: footerConfig.footer_style,
        background_color: footerConfig.background_color || '#1a1a1a',
        text_color: footerConfig.text_color || '#ffffff',
        legal_links: footerConfig.legal_links || [],
        is_active: footerConfig.is_active,
        notes: footerConfig.notes || '',
      });
      
      console.log('[FooterConfigForm] ✅ Form reset complete');
    } else {
      console.log('[FooterConfigForm] ⚠️ footerConfig is null/undefined, skipping form population');
    }
  }, [footerConfig, reset]);

  const onSubmit = async (data: FooterConfigInput) => {
    try {
      if (footerConfig) {
        await updateFooterConfig(data);
      } else {
        await createFooterConfig(data);
      }
    } catch (error) {
      console.error('Failed to save footer config:', error);
    }
  };

  const handleReset = () => {
    if (footerConfig) {
      reset();
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
          <CardTitle>Informasi Kontak</CardTitle>
          <CardDescription>Konfigurasi informasi kontak yang ditampilkan di footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contact_address">Alamat</Label>
            <Textarea
              id="contact_address"
              {...register('contact_address')}
              placeholder="Jl. Contoh No. 123, Jakarta"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telepon</Label>
              <Input
                id="contact_phone"
                {...register('contact_phone')}
                placeholder="+62 21 1234 5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                {...register('contact_email')}
                placeholder="info@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_working_hours">Jam Kerja</Label>
            <Input
              id="contact_working_hours"
              {...register('contact_working_hours')}
              placeholder="Senin - Jumat: 09:00 - 17:00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show_contact_info"
              checked={watch('show_contact_info')}
              onCheckedChange={(checked) => setValue('show_contact_info', checked)}
            />
            <Label htmlFor="show_contact_info">Tampilkan Informasi Kontak</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Footer Sections</CardTitle>
              <CardDescription>Tambahkan section dengan link-link di footer</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSection({ title: '', links: [{ label: '', path: '' }], sort_order: sectionFields.length })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectionFields.map((field, index) => (
            <Card key={field.id} className="border-dashed">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`footer_sections.${index}.title`}>Judul Section</Label>
                      <Input
                        {...register(`footer_sections.${index}.title`)}
                        placeholder="Produk, Perusahaan, dll."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link-link Section</Label>
                      <div className="space-y-2">
                        {watch(`footer_sections.${index}.links`)?.map((_, linkIndex) => (
                          <div key={linkIndex} className="flex gap-2">
                            <Input
                              {...register(`footer_sections.${index}.links.${linkIndex}.label`)}
                              placeholder="Label"
                              className="flex-1"
                            />
                            <Input
                              {...register(`footer_sections.${index}.links.${linkIndex}.path`)}
                              placeholder="/path"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const links = watch(`footer_sections.${index}.links`) || [];
                                setValue(
                                  `footer_sections.${index}.links`,
                                  links.filter((_, i) => i !== linkIndex)
                                );
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const links = watch(`footer_sections.${index}.links`) || [];
                            setValue(`footer_sections.${index}.links`, [...links, { label: '', path: '' }]);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Tambah Link
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center space-x-2">
            <Switch
              id="show_sections"
              checked={watch('show_sections')}
              onCheckedChange={(checked) => setValue('show_sections', checked)}
            />
            <Label htmlFor="show_sections">Tampilkan Footer Sections</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Tambahkan link media sosial</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendSocial({ platform: '', url: '', icon: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Social Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`social_links.${index}.platform`)}
                placeholder="Platform (Facebook, Instagram, dll.)"
                className="flex-1"
              />
              <Input
                {...register(`social_links.${index}.url`)}
                placeholder="URL"
                className="flex-1"
              />
              <Input
                {...register(`social_links.${index}.icon`)}
                placeholder="Icon (lucide)"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSocial(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="flex items-center space-x-2">
            <Switch
              id="show_social_links"
              checked={watch('show_social_links')}
              onCheckedChange={(checked) => setValue('show_social_links', checked)}
            />
            <Label htmlFor="show_social_links">Tampilkan Social Media Links</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
          <CardDescription>Konfigurasi newsletter subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="show_newsletter"
              checked={watch('show_newsletter')}
              onCheckedChange={(checked) => setValue('show_newsletter', checked)}
            />
            <Label htmlFor="show_newsletter">Tampilkan Newsletter</Label>
          </div>

          {watch('show_newsletter') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newsletter_title">Judul</Label>
                  <Input
                    id="newsletter_title"
                    {...register('newsletter_title')}
                    placeholder="Subscribe to our Newsletter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newsletter_button_text">Teks Tombol</Label>
                  <Input
                    id="newsletter_button_text"
                    {...register('newsletter_button_text')}
                    placeholder="Subscribe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter_subtitle">Subtitle</Label>
                <Textarea
                  id="newsletter_subtitle"
                  {...register('newsletter_subtitle')}
                  placeholder="Get latest updates and offers"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newsletter_api_endpoint">API Endpoint</Label>
                <Input
                  id="newsletter_api_endpoint"
                  {...register('newsletter_api_endpoint')}
                  placeholder="/api/newsletter/subscribe"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Legal Links</CardTitle>
              <CardDescription>Privacy Policy, Terms of Service, dll.</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendLegal({ label: '', path: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Legal Link
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {legalFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`legal_links.${index}.label`)}
                placeholder="Label (Privacy Policy)"
                className="flex-1"
              />
              <Input
                {...register(`legal_links.${index}.path`)}
                placeholder="/privacy"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeLegal(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teks Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="about_text">About Text</Label>
            <Textarea
              id="about_text"
              {...register('about_text')}
              placeholder="Deskripsi singkat tentang perusahaan"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="copyright_text">Copyright Text</Label>
            <Input
              id="copyright_text"
              {...register('copyright_text')}
              placeholder="© 2025 Your Company. All rights reserved."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bottom_text">Bottom Text</Label>
            <Input
              id="bottom_text"
              {...register('bottom_text')}
              placeholder="Tagline atau teks tambahan"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Styling & Opsi Lainnya</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="footer_style">Footer Style</Label>
            <Select
              value={watch('footer_style')}
              onValueChange={(value) => setValue('footer_style', value as any)}
            >
              <SelectTrigger id="footer_style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorPicker
                value={watch('background_color') || '#1a1a1a'}
                onChange={(color) => setValue('background_color', color)}
              />
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <ColorPicker
                value={watch('text_color') || '#ffffff'}
                onChange={(color) => setValue('text_color', color)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">Aktif</Label>
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
