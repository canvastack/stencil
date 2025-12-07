import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Calendar,
  DollarSign
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import MapPicker, { LocationData } from '@/components/admin/MapPicker';
import { Textarea } from '@/components/ui/textarea';
import { BulkDataTable, BulkAction } from '@/components/ui/bulk-data-table';
import { ColumnDef } from '@tanstack/react-table';
import type { Customer } from '@/types/customer';
import { customersService } from '@/services/api/customers';
import { Loader2 } from 'lucide-react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    customerType: 'individual' as 'individual' | 'business',
    status: 'active' as 'active' | 'inactive' | 'blocked',
    notes: '',
  });
  const [locationData, setLocationData] = useState<LocationData | undefined>();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await customersService.getCustomers({ per_page: 100 });
        const apiCustomers = response.data || [];
        
        const uiCustomers: Customer[] = apiCustomers.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || '',
          company: c.company,
          customerType: (c.type === 'business' ? 'business' : 'individual') as 'individual' | 'business',
          status: (c.status as any) || 'active',
          totalOrders: c.total_orders || 0,
          totalSpent: c.lifetime_value || 0,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
        
        setCustomers(uiCustomers);
      } catch (err) {
        console.error('Failed to fetch customers:', err);
        setError('Failed to load customers. Please try again.');
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company || '',
        customerType: customer.customerType,
        status: customer.status,
        notes: customer.notes || '',
      });
      setLocationData(customer.location);
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        customerType: 'individual',
        status: 'active',
        notes: '',
      });
      setLocationData(undefined);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (editingCustomer) {
        await customersService.updateCustomer(editingCustomer.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          status: formData.status,
        });
        
        setCustomers(customers.map(c => 
          c.id === editingCustomer.id 
            ? { ...c, ...formData, location: locationData }
            : c
        ));
        toast.success('Customer updated successfully!');
      } else {
        const response = await customersService.createCustomer({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          type: formData.customerType,
        });
        
        const newCustomer: Customer = {
          id: response.id,
          name: response.name,
          email: response.email,
          phone: response.phone || '',
          company: response.company,
          customerType: (response.type === 'business' ? 'business' : 'individual') as 'individual' | 'business',
          status: (response.status as any) || 'active',
          location: locationData,
          totalOrders: 0,
          totalSpent: 0,
          createdAt: response.created_at,
          updatedAt: response.updated_at,
        };
        setCustomers([...customers, newCustomer]);
        toast.success('Customer created successfully!');
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Failed to save customer:', err);
      toast.error('Failed to save customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customersService.deleteCustomer(id);
      setCustomers(customers.filter(c => c.id !== id));
      toast.success('Customer deleted successfully!');
    } catch (err) {
      console.error('Failed to delete customer:', err);
      toast.error('Failed to delete customer. Please try again.');
    }
  };

  const handleBulkDelete = async (selectedCustomers: Customer[]) => {
    if (selectedCustomers.length === 0) return;
    
    const confirmBulk = window.confirm(
      `Are you sure you want to delete ${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''}?`
    );
    
    if (!confirmBulk) return;

    try {
      for (const customer of selectedCustomers) {
        await customersService.deleteCustomer(customer.id);
      }
      setCustomers(customers.filter(c => !selectedCustomers.some(sc => sc.id === c.id)));
      toast.success(`${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''} deleted successfully!`);
    } catch (error) {
      console.error('Bulk delete failed:', error);
      toast.error('Failed to delete customers. Please try again.');
    }
  };

  const handleBulkStatusUpdate = async (selectedCustomers: Customer[], status: string) => {
    if (selectedCustomers.length === 0) return;
    
    try {
      // Mock bulk status update - replace with real API
      const updatedCustomers = customers.map(c => 
        selectedCustomers.some(sc => sc.id === c.id) ? { ...c, status } : c
      );
      setCustomers(updatedCustomers);
      toast.success(`${selectedCustomers.length} customer${selectedCustomers.length > 1 ? 's' : ''} updated to ${status}`);
    } catch (error) {
      console.error('Bulk status update failed:', error);
      toast.error('Failed to update customer status. Please try again.');
    }
  };

  const bulkActions: BulkAction[] = [
    {
      label: 'Activate Selected',
      action: (customers: Customer[]) => handleBulkStatusUpdate(customers, 'active'),
    },
    {
      label: 'Deactivate Selected',
      action: (customers: Customer[]) => handleBulkStatusUpdate(customers, 'inactive'),
    },
    {
      label: 'Delete Selected',
      action: handleBulkDelete,
      variant: 'destructive',
      icon: Trash2,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Filter customers based on search and filters
  const filteredCustomers = React.useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = !searchQuery || 
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      const matchesType = typeFilter === 'all' || customer.customerType === typeFilter;
      const matchesLocation = locationFilter === 'all' || customer.city === locationFilter;

      return matchesSearch && matchesStatus && matchesType && matchesLocation;
    });
  }, [customers, searchQuery, statusFilter, typeFilter, locationFilter]);

  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="font-medium">
          <div className="font-semibold">{row.getValue('name')}</div>
          {row.original.company && (
            <div className="text-xs text-muted-foreground">{row.original.company}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Contact',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-muted-foreground" />
            {row.getValue('email')}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-3 h-3 text-muted-foreground" />
            {row.original.phone}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customerType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant={row.getValue('customerType') === 'business' ? 'default' : 'secondary'}>
          {row.getValue('customerType')}
        </Badge>
      ),
    },
    {
      accessorKey: 'totalOrders',
      header: 'Orders',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          {row.getValue('totalOrders')}
        </div>
      ),
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 font-semibold">
          <DollarSign className="w-4 h-4 text-primary" />
          {formatCurrency(row.getValue('totalSpent'))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={
            row.getValue('status') === 'active' ? 'default' :
            row.getValue('status') === 'blocked' ? 'destructive' :
            'secondary'
          }
        >
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      accessorKey: 'lastOrderDate',
      header: 'Last Order',
      cell: ({ row }) => {
        const lastOrderDate = row.getValue('lastOrderDate') as string;
        return lastOrderDate ? (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            {lastOrderDate}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">No orders</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleOpenDialog(customer)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(customer.id)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-primary" />
            Customer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage customer information and order history
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2" disabled={saving}>
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {customers.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(customers.reduce((sum, c) => sum + c.totalSpent, 0))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Business Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.customerType === 'business').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs {customers.filter(c => c.customerType === 'individual').length} individuals
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            A list of all customers with their order history and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Advanced Search and Filters */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {Array.from(new Set(customers.map(c => c.city).filter(Boolean))).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || locationFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setLocationFilter('all');
                  }}
                  className="whitespace-nowrap"
                >
                  Clear Filters
                </Button>
              )}
            </div>
            
            <BulkDataTable
              columns={columns}
              data={filteredCustomers}
              searchPlaceholder="Search customers..."
              searchKey="name"
              bulkActions={bulkActions}
              enableBulkSelect={true}
              loading={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer 
                ? 'Update customer information and details' 
                : 'Create a new customer record'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Customer Info</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Type *</Label>
                  <Select value={formData.customerType} onValueChange={(value: 'individual' | 'business') => setFormData({ ...formData, customerType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'blocked') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name / Business Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe / ABC Company"
                  />
                </div>
                {formData.customerType === 'business' && (
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company legal name"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="customer@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 812 3456 7890"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Customer Address Location
                </Label>
                <p className="text-sm text-muted-foreground">
                  Click on the map to select the customer's shipping or billing address
                </p>
              </div>
              <MapPicker 
                onLocationSelect={setLocationData} 
                value={locationData}
              />
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <div className="space-y-2">
                <Label>Customer Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add any important notes about this customer (preferences, special requirements, etc.)"
                  rows={6}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.email || !formData.phone || saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
