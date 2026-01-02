import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useMenuManagement } from '@/hooks/useNavigationConfig';
import { Menu, MenuInput, MenusQueryParams } from '@/types/navigation';
import { MenuItemCard } from './MenuItemCard';
import { MenuItemForm } from './MenuItemForm';
import { Plus, Loader2, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const MenuBuilder = () => {
  const [filters, setFilters] = useState<MenusQueryParams>({
    location: 'all',
    status: 'all',
    sort: 'order',
    include_children: 'true',
  });
  
  const { menus, meta, isLoading, createMenu, updateMenu, deleteMenu, isCreating, isUpdating, isDeleting } = useMenuManagement(filters);
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | undefined>();
  const [parentMenu, setParentMenu] = useState<Menu | undefined>();
  const [deleteConfirmUuid, setDeleteConfirmUuid] = useState<string | null>(null);

  const handleAddNew = () => {
    setEditingMenu(undefined);
    setParentMenu(undefined);
    setShowForm(true);
  };

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setParentMenu(undefined);
    setShowForm(true);
  };

  const handleAddChild = (parent: Menu) => {
    setEditingMenu(undefined);
    setParentMenu(parent);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmUuid) return;
    
    try {
      await deleteMenu(deleteConfirmUuid);
      setDeleteConfirmUuid(null);
    } catch (error: any) {
      toast({
        title: 'Gagal menghapus menu',
        description: error?.response?.data?.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (data: MenuInput) => {
    if (parentMenu) {
      data.parent_uuid = parentMenu.uuid;
    }

    if (editingMenu) {
      await updateMenu({ uuid: editingMenu.uuid, data });
    } else {
      await createMenu(data);
    }
  };

  const getParentOptions = (): { uuid: string; label: string }[] => {
    const flattenMenus = (menuList: Menu[]): { uuid: string; label: string }[] => {
      return menuList.reduce((acc, menu) => {
        if (editingMenu && menu.uuid === editingMenu.uuid) {
          return acc;
        }
        
        acc.push({ uuid: menu.uuid, label: menu.label });
        
        if (menu.children && menu.children.length > 0) {
          acc.push(...flattenMenus(menu.children));
        }
        
        return acc;
      }, [] as { uuid: string; label: string }[]);
    };
    
    return flattenMenus(menus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Builder</CardTitle>
              <CardDescription>
                Kelola menu navigasi website Anda
                {meta && (
                  <span className="block mt-1">
                    Total: {meta.total} menu ({meta.active_count} aktif, {meta.inactive_count} tidak aktif)
                  </span>
                )}
              </CardDescription>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Menu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={filters.location}
                onValueChange={(value) => setFilters({ ...filters, location: value as any })}
              >
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select
                value={filters.sort}
                onValueChange={(value) => setFilters({ ...filters, sort: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Urutan</SelectItem>
                  <SelectItem value="name">Nama</SelectItem>
                  <SelectItem value="created_at">Tanggal Dibuat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {menus.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Belum ada menu. Klik tombol "Tambah Menu" untuk membuat menu baru.</p>
              </div>
            ) : (
              menus.map((menu) => (
                <MenuItemCard
                  key={menu.uuid}
                  menu={menu}
                  onEdit={handleEdit}
                  onDelete={(uuid) => setDeleteConfirmUuid(uuid)}
                  onAddChild={handleAddChild}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <MenuItemForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        menu={editingMenu}
        parentOptions={getParentOptions()}
        isLoading={isCreating || isUpdating}
      />

      <AlertDialog open={!!deleteConfirmUuid} onOpenChange={(open) => !open && setDeleteConfirmUuid(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Menu?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus menu ini? Menu akan dihapus secara soft delete dan dapat dipulihkan nanti.
              Pastikan menu ini tidak memiliki sub-menu aktif.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                'Hapus'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
