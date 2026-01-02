import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Menu, MenuInput } from '@/types/navigation';
import { Loader2 } from 'lucide-react';

interface MenuItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MenuInput) => Promise<void>;
  menu?: Menu;
  parentOptions: { uuid: string; label: string }[];
  isLoading?: boolean;
}

export const MenuItemForm = ({ open, onClose, onSubmit, menu, parentOptions, isLoading }: MenuItemFormProps) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<MenuInput>({
    defaultValues: {
      label: '',
      path: '',
      icon: '',
      description: '',
      target: '_self',
      is_external: false,
      requires_auth: false,
      is_active: true,
      is_visible: true,
      show_in_header: true,
      show_in_footer: false,
      show_in_mobile: true,
      sort_order: 0,
      custom_class: '',
      badge_text: '',
      badge_color: '',
      parent_uuid: null,
      allowed_roles: [],
      notes: '',
    }
  });

  useEffect(() => {
    if (menu) {
      reset({
        label: menu.label,
        path: menu.path || '',
        icon: menu.icon || '',
        description: menu.description || '',
        target: menu.target,
        is_external: menu.is_external,
        requires_auth: menu.requires_auth,
        is_active: menu.is_active,
        is_visible: menu.is_visible,
        show_in_header: menu.show_in_header,
        show_in_footer: menu.show_in_footer,
        show_in_mobile: menu.show_in_mobile,
        sort_order: menu.sort_order,
        custom_class: menu.custom_class || '',
        badge_text: menu.badge_text || '',
        badge_color: menu.badge_color || '',
        parent_uuid: menu.parent_uuid || null,
        allowed_roles: menu.allowed_roles || [],
        notes: '',
      });
    } else {
      reset();
    }
  }, [menu, reset]);

  const handleFormSubmit = async (data: MenuInput) => {
    await onSubmit(data);
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menu ? 'Edit Menu' : 'Tambah Menu Baru'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="label">Label Menu *</Label>
            <Input
              id="label"
              {...register('label', { required: 'Label menu harus diisi' })}
              placeholder="Contoh: Tentang Kami"
            />
            {errors.label && (
              <p className="text-sm text-destructive">{errors.label.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="path">Path/URL</Label>
            <Input
              id="path"
              {...register('path')}
              placeholder="/about atau https://example.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Lucide)</Label>
              <Input
                id="icon"
                {...register('icon')}
                placeholder="Info, Home, Package, dll."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Select
                value={watch('target')}
                onValueChange={(value) => setValue('target', value as any)}
              >
                <SelectTrigger id="target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Same Tab (_self)</SelectItem>
                  <SelectItem value="_blank">New Tab (_blank)</SelectItem>
                  <SelectItem value="_parent">Parent (_parent)</SelectItem>
                  <SelectItem value="_top">Top (_top)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_uuid">Parent Menu</Label>
            <Select
              value={watch('parent_uuid') || 'none'}
              onValueChange={(value) => setValue('parent_uuid', value === 'none' ? null : value)}
            >
              <SelectTrigger id="parent_uuid">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Top Level)</SelectItem>
                {parentOptions.map((option) => (
                  <SelectItem key={option.uuid} value={option.uuid}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="badge_text">Badge Text</Label>
              <Input
                id="badge_text"
                {...register('badge_text')}
                placeholder="New, Hot, dll."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge_color">Badge Color</Label>
              <Input
                id="badge_color"
                {...register('badge_color')}
                placeholder="#ff6b35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Urutan</Label>
              <Input
                id="sort_order"
                type="number"
                {...register('sort_order', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_class">Custom CSS Class</Label>
            <Input
              id="custom_class"
              {...register('custom_class')}
              placeholder="custom-menu-class"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Deskripsi menu (opsional)"
              rows={2}
            />
          </div>

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Pengaturan Tampilan</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show_in_header"
                  checked={watch('show_in_header')}
                  onCheckedChange={(checked) => setValue('show_in_header', checked)}
                />
                <Label htmlFor="show_in_header">Tampil di Header</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_in_footer"
                  checked={watch('show_in_footer')}
                  onCheckedChange={(checked) => setValue('show_in_footer', checked)}
                />
                <Label htmlFor="show_in_footer">Tampil di Footer</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_in_mobile"
                  checked={watch('show_in_mobile')}
                  onCheckedChange={(checked) => setValue('show_in_mobile', checked)}
                />
                <Label htmlFor="show_in_mobile">Tampil di Mobile</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_visible"
                  checked={watch('is_visible')}
                  onCheckedChange={(checked) => setValue('is_visible', checked)}
                />
                <Label htmlFor="is_visible">Visible</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={watch('is_active')}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_external"
                  checked={watch('is_external')}
                  onCheckedChange={(checked) => setValue('is_external', checked)}
                />
                <Label htmlFor="is_external">Link Eksternal</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_auth"
                  checked={watch('requires_auth')}
                  onCheckedChange={(checked) => setValue('requires_auth', checked)}
                />
                <Label htmlFor="requires_auth">Perlu Login</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
