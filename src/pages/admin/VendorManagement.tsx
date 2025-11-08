import { useState } from 'react';
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

const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'PT Material Utama',
    code: 'VEN001',
    email: 'sales@materialutama.com',
    phone: '+62 21 1234567',
    contactPerson: 'Budi Santoso',
    category: 'Raw Material',
    status: 'active',
    rating: 4.5,
    totalOrders: 156,
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
      city: 'Jakarta Pusat',
      district: 'Menteng',
      subdistrict: 'Kebon Sirih',
      village: 'Kebon Sirih',
      municipality: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      address: 'Jl. Kebon Sirih No. 12, Jakarta Pusat',
    },
    notes: 'Vendor utama untuk stainless steel',
    paymentTerms: 'NET 30',
    taxId: '01.234.567.8-901.000',
  },
  {
    id: '2',
    name: 'CV Glass Premium',
    code: 'VEN002',
    email: 'info@glasspremium.co.id',
    phone: '+62 21 9876543',
    contactPerson: 'Siti Nurhaliza',
    category: 'Glass Supplier',
    status: 'active',
    rating: 4.8,
    totalOrders: 89,
    location: {
      latitude: -6.1751,
      longitude: 106.8650,
      city: 'Jakarta Timur',
      district: 'Cakung',
      subdistrict: 'Cakung Barat',
      village: 'Cakung Barat',
      municipality: 'Jakarta Timur',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      address: 'Jl. Cakung Cilincing No. 45, Jakarta Timur',
    },
    notes: 'Spesialis glass crystal dan mirror',
    paymentTerms: 'COD',
    taxId: '02.345.678.9-012.000',
  },
];

export default function VendorManagement() {
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
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

  const handleDeleteVendor = (id: string) => {
    setVendors(vendors.filter((v) => v.id !== id));
    toast.success('Vendor deleted successfully');
  };

  const handleSaveVendor = () => {
    if (editingVendor) {
      setVendors(
        vendors.map((v) =>
          v.id === editingVendor.id ? { ...editingVendor, ...formData } : v
        )
      );
      toast.success('Vendor updated successfully');
    } else {
      const newVendor: Vendor = {
        id: Date.now().toString(),
        ...formData,
      } as Vendor;
      setVendors([...vendors, newVendor]);
      toast.success('Vendor added successfully');
    }
    setIsDialogOpen(false);
  };

  const handleLocationSelect = (location: LocationData) => {
    setFormData({ ...formData, location });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Management</h1>
          <p className="text-muted-foreground">Manage suppliers and vendors</p>
        </div>
        <Button onClick={handleAddVendor}>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVendor}>
              {editingVendor ? 'Update' : 'Add'} Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
