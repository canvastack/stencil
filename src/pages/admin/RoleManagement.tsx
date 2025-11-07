import { useState } from 'react';
import {
  Shield,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
}

const availablePermissions: Permission[] = [
  { id: 'users_view', name: 'View Users', description: 'View user list and details' },
  { id: 'users_create', name: 'Create Users', description: 'Add new users' },
  { id: 'users_edit', name: 'Edit Users', description: 'Modify user information' },
  { id: 'users_delete', name: 'Delete Users', description: 'Remove users' },
  { id: 'products_view', name: 'View Products', description: 'View product catalog' },
  { id: 'products_create', name: 'Create Products', description: 'Add new products' },
  { id: 'products_edit', name: 'Edit Products', description: 'Modify product information' },
  { id: 'products_delete', name: 'Delete Products', description: 'Remove products' },
  { id: 'orders_view', name: 'View Orders', description: 'View order list and details' },
  { id: 'orders_manage', name: 'Manage Orders', description: 'Update order status' },
  { id: 'content_edit', name: 'Edit Content', description: 'Modify website content' },
  { id: 'theme_manage', name: 'Manage Themes', description: 'Change website themes' },
  { id: 'settings_view', name: 'View Settings', description: 'View system settings' },
  { id: 'settings_edit', name: 'Edit Settings', description: 'Modify system settings' },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access with all permissions',
    permissions: availablePermissions.map(p => p.id),
    userCount: 2,
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Manager',
    description: 'Manage products, orders, and view reports',
    permissions: ['products_view', 'products_create', 'products_edit', 'orders_view', 'orders_manage', 'content_edit'],
    userCount: 5,
    createdAt: '2024-01-15',
  },
  {
    id: '3',
    name: 'Staff',
    description: 'Basic access to view and process orders',
    permissions: ['products_view', 'orders_view', 'orders_manage'],
    userCount: 12,
    createdAt: '2024-02-01',
  },
  {
    id: '4',
    name: 'Viewer',
    description: 'Read-only access to system data',
    permissions: ['products_view', 'orders_view', 'settings_view'],
    userCount: 3,
    createdAt: '2024-02-15',
  },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        description: '',
        permissions: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingRole) {
      setRoles(roles.map(r => 
        r.id === editingRole.id 
          ? { ...r, ...formData }
          : r
      ));
      toast.success('Role updated successfully!');
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setRoles([...roles, newRole]);
      toast.success('Role created successfully!');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role && role.userCount > 0) {
      toast.error(`Cannot delete role with ${role.userCount} assigned users`);
      return;
    }
    setRoles(roles.filter(r => r.id !== id));
    toast.success('Role deleted successfully!');
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: 'name',
      header: 'Role Name',
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          {row.getValue('name')}
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-md">{row.getValue('description')}</div>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.getValue('permissions').length} permissions
        </Badge>
      ),
    },
    {
      accessorKey: 'userCount',
      header: 'Users',
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.getValue('userCount')} users
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const role = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(role)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(role.id)}
                className="text-destructive"
                disabled={role.userCount > 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Role Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
          <CardDescription>
            A list of all user roles with their permissions and assigned users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={roles}
            searchPlaceholder="Search roles..."
            searchKey="name"
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Edit Role' : 'Create New Role'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Update role information and permissions' 
                : 'Create a new role with specific permissions'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Manager, Staff, Viewer"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the role and its purpose..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">Permissions</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePermissions.map((permission) => (
                  <div 
                    key={permission.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => togglePermission(permission.id)}
                  >
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={permission.id}
                        className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                      >
                        {permission.name}
                        {formData.permissions.includes(permission.id) ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground" />
                        )}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Selected Permissions:</span>
                <Badge variant="default">
                  {formData.permissions.length} / {availablePermissions.length}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
