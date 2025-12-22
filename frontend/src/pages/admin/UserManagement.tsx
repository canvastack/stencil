import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import type { UserStatus } from '@/types/user';
import { userManagementService, type UserWithLocation, type UserFilters, type LocationData as ApiLocationData } from '@/services/api/userManagement';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import MapPicker, { LocationData } from '@/components/admin/MapPicker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { User } from '@/types/user';

// Mock data removed - using imported UserWithLocation type from userManagementService

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithLocation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithLocation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    status: 'active' as UserStatus,
  });
  const [locationData, setLocationData] = useState<LocationData | undefined>();
  const [apiLocationData, setApiLocationData] = useState<ApiLocationData | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users data from API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await userManagementService.getUsers({
          search: searchTerm || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined
        });
        
        setUsers(response.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load users data';
        setError(errorMessage);
        console.error('Users fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter]);

  // Mock data removed - now using real API data via userManagementService

  const handleOpenDialog = (user?: UserWithLocation) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        department: user.department || '',
        status: user.status,
      });
      setApiLocationData(user.location);
      // Convert API location to MapPicker location format
      setLocationData(user.location ? {
        latitude: 0, // Default value for MapPicker
        longitude: 0, // Default value for MapPicker
        address: user.location.address || '',
        city: user.location.city || '',
        district: '', // Default value for MapPicker
        subdistrict: '', // Default value for MapPicker
        village: '', // Default value for MapPicker
        municipality: '', // Default value for MapPicker
        province: user.location.province || '',
        country: user.location.country || 'Indonesia'
      } : undefined);
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        status: 'active',
      });
      setLocationData(undefined);
      setApiLocationData(undefined);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        // Convert MapPicker location to API location format
        const apiLocation: ApiLocationData | undefined = locationData ? {
          address: locationData.address,
          city: locationData.city,
          province: locationData.province,
          postalCode: undefined, // MapPicker doesn't have postal code
          country: locationData.country || 'Indonesia'
        } : undefined;

        await userManagementService.updateUser(editingUser.id, {
          ...formData,
          location: apiLocation
        });
        toast.success('User updated successfully!');
      } else {
        // Convert MapPicker location to API location format
        const apiLocation: ApiLocationData | undefined = locationData ? {
          address: locationData.address,
          city: locationData.city,
          province: locationData.province,
          postalCode: undefined, // MapPicker doesn't have postal code
          country: locationData.country || 'Indonesia'
        } : undefined;

        await userManagementService.createUser({
          ...formData,
          location: apiLocation
        });
        toast.success('User created successfully!');
      }
      
      // Refresh users list
      const response = await userManagementService.getUsers({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined
      });
      setUsers(response.data);
      
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save user');
      console.error('User save error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userManagementService.deleteUser(id);
      
      // Refresh users list
      const response = await userManagementService.getUsers({
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined
      });
      setUsers(response.data);
      
      toast.success('User deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('User delete error:', error);
    }
  };

  const columns: ColumnDef<UserWithLocation>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground" />
          {row.getValue('email')}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-muted-foreground" />
          {row.getValue('phone')}
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="gap-1">
          <Shield className="w-3 h-3" />
          {row.getValue('role')}
        </Badge>
      ),
    },
    {
      accessorKey: 'department',
      header: 'Department',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as UserStatus;
        return (
          <Badge variant={status === 'active' ? 'default' : 'secondary'}>
            <span className="flex items-center gap-1">
              {status === 'active' ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : status === 'suspended' ? (
                <XCircle className="w-3 h-3 text-red-500" />
              ) : (
                <XCircle className="w-3 h-3 text-gray-500" />
              )}
              {status}
            </span>
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(user)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(user.id)}
                className="text-destructive"
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
            <Users className="w-8 h-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage internal company users and their roles
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            A list of all internal company users with their roles and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Users</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={users}
              searchPlaceholder="Search users..."
              searchKey="name"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Update user information and role assignment' 
                : 'Create a new internal company user'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">User Information</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="IT, Sales, Operations, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: UserStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  User Address Location
                </Label>
                <p className="text-sm text-muted-foreground">
                  Click on the map to select the user's office or home location
                </p>
              </div>
              <MapPicker 
                onLocationSelect={setLocationData} 
                value={locationData}
              />
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
