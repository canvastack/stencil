import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapPicker, { LocationData } from '@/components/admin/MapPicker';
import { Search, Plus, Edit, Trash2, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { Vendor } from '@/types/vendor';
import { vendorsService } from '@/services/api/vendors';
import { Loader2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '',
    code: '',
    email: '',
    phone: '',
    contactPerson: '',
    category: '',
    status: 'active',
    rating: 0,
    totalOrders: 0,
    notes: '',
    paymentTerms: '',
    taxId: '',
  });

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await vendorsService.getVendors({ per_page: 100 });
        const apiVendors = response.data || [];
        
        const uiVendors: Vendor[] = apiVendors.map(v => ({
          id: v.id,
          name: v.name,
          code: v.name.substring(0, 6).toUpperCase(),
          email: v.email,
          phone: v.phone || '',
          contactPerson: v.name,
          category: 'General',
          status: (v.status as any) || 'active',
          rating: v.rating || 0,
          totalOrders: v.total_orders || 0,
          location: {
            latitude: 0,
            longitude: 0,
            city: v.city || '',
            country: v.country || '',
            address: v.company || '',
          },
          notes: '',
          paymentTerms: 'NET 30',
          taxId: '',
          bankAccount: v.bank_account,
        }));
        
        setVendors(uiVendors);
      } catch (err) {
        console.error('Failed to fetch vendors:', err);
        setError('Failed to load vendors. Please try again.');
        toast.error('Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const columns: ColumnDef<Vendor>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="font-mono">{row.getValue('code')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Vendor Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.getValue('name')}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Mail className="w-3 h-3" />
            {row.original.email}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3 h-3" />
            {row.original.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'contactPerson',
      header: 'Contact Person',
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('status') === 'active' ? 'default' : 'secondary'}>
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="text-yellow-500">★</span>
          {(row.getValue('rating') as number).toFixed(1)}
        </div>
      ),
    },
    {
      accessorKey: 'totalOrders',
      header: 'Orders',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditVendor(vendor)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteVendor(vendor.id)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  const handleAddVendor = () => {
    setEditingVendor(null);
    setFormData({
      name: '',
      code: '',
      email: '',
      phone: '',
      contactPerson: '',
      category: '',
      status: 'active',
      rating: 0,
      totalOrders: 0,
      notes: '',
      paymentTerms: '',
      taxId: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData(vendor);
    setIsDialogOpen(true);
  };

  const handleDeleteVendor = async (id: string) => {
    try {
      await vendorsService.deleteVendor(id);
      setVendors(vendors.filter((v) => v.id !== id));
      toast.success('Vendor deleted successfully');
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      toast.error('Failed to delete vendor. Please try again.');
    }
  };

  const handleSaveVendor = async () => {
    try {
      setSaving(true);
      if (editingVendor) {
        await vendorsService.updateVendor(editingVendor.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.contactPerson,
          status: formData.status,
          bank_account: formData.bankAccount,
        });
        
        setVendors(
          vendors.map((v) =>
            v.id === editingVendor.id ? { ...editingVendor, ...formData } : v
          )
        );
        toast.success('Vendor updated successfully');
      } else {
        const response = await vendorsService.createVendor({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.contactPerson,
          bank_account: formData.bankAccount,
        });
        
        const newVendor: Vendor = {
          id: response.id,
          name: response.name,
          code: (formData.code as string) || response.name.substring(0, 6).toUpperCase(),
          email: response.email,
          phone: response.phone || '',
          contactPerson: formData.contactPerson || response.name,
          category: (formData.category as string) || 'General',
          status: (response.status as any) || 'active',
          rating: formData.rating || 0,
          totalOrders: response.total_orders || 0,
          location: {
            latitude: 0,
            longitude: 0,
            city: response.city || '',
            country: response.country || '',
            address: response.company || '',
          },
          notes: (formData.notes as string) || '',
          paymentTerms: (formData.paymentTerms as string) || 'NET 30',
          taxId: (formData.taxId as string) || '',
          bankAccount: response.bank_account,
        };
        setVendors([...vendors, newVendor]);
        toast.success('Vendor added successfully');
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save vendor:', err);
      toast.error('Failed to save vendor. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setFormData({ ...formData, location });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">Manage suppliers and vendors</p>
        </div>
        <Button onClick={handleAddVendor} disabled={saving}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Vendors</p>
              <p className="text-2xl font-bold">{vendors.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Building2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Vendors</p>
              <p className="text-2xl font-bold">
                {vendors.filter((v) => v.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">
                {vendors.reduce((sum, v) => sum + v.totalOrders, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Building2 className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">
                {new Set(vendors.map((v) => v.category)).size}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Vendors Table */}
      <Card className="p-6">
        <DataTable
          columns={columns}
          data={vendors}
          searchPlaceholder="Search vendors by name, code, or email..."
          searchKey="name"
        />
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Vendor Information</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="notes">Notes & Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="PT/CV Vendor Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Vendor Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="VEN001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="vendor@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 21 1234567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    placeholder="Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Material">Raw Material</SelectItem>
                      <SelectItem value="Glass Supplier">Glass Supplier</SelectItem>
                      <SelectItem value="Metal Supplier">Metal Supplier</SelectItem>
                      <SelectItem value="Packaging">Packaging</SelectItem>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Service Provider">Service Provider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / NPWP</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="01.234.567.8-901.000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location">
              <MapPicker
                onLocationSelect={handleLocationSelect}
                value={formData.location}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentTerms: e.target.value })
                  }
                  placeholder="e.g., NET 30, COD, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this vendor..."
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveVendor} disabled={!formData.name || !formData.email || !formData.phone || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingVendor ? 'Update Vendor' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
