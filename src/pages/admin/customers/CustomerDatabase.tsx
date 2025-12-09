import { useState, useEffect, useCallback } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer, CustomerFilters, CustomerType, CustomerStatus } from '@/types/customer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin,
  Building,
  User,
  DollarSign,
  ShoppingBag,
  Download,
  Upload,
  UserCheck,
  UserX,
  Calendar,
  TrendingUp,
  X
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function CustomerDatabase() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customerType: undefined,
    status: undefined,
    city: '',
    minOrders: undefined,
    minSpent: undefined,
  });

  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { 
    customers, 
    pagination, 
    isLoading, 
    error, 
    fetchCustomers, 
    deleteCustomer 
  } = useCustomers();

  // Fetch customers when filters change
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchCustomers(filters);
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [filters, fetchCustomers]);

  const handleFilterChange = useCallback((key: keyof CustomerFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  }, []);

  const handleViewCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailDialogOpen(true);
  }, []);

  const handleDeleteCustomer = useCallback(async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      await deleteCustomer(customerId);
    }
  }, [deleteCustomer]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const handleClearFilters = () => {
    setFilters({
      search: '',
      customerType: undefined,
      status: undefined,
      city: '',
      minOrders: undefined,
      minSpent: undefined,
    });
  };

  // Enhanced Card with hover effects
  const EnhancedCard = ({ 
    children, 
    className = "",
    ...props 
  }: { 
    children: React.ReactNode; 
    className?: string;
    [key: string]: any;
  }) => (
    <Card 
      className={`relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      {...props}
    >
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
      {children}
    </Card>
  );

  const getStatusBadge = (status: CustomerStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: CustomerType) => {
    return type === 'business' ? (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Building className="w-3 h-3 mr-1" />
        Business
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-600 border-gray-600">
        <User className="w-3 h-3 mr-1" />
        Individual
      </Badge>
    );
  };

  // Table columns configuration
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'name',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-semibold">{customer.name}</div>
              <div className="text-sm text-muted-foreground">{customer.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'customerType',
      header: 'Type',
      cell: ({ row }) => getTypeBadge(row.original.customerType),
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.company || '-'}
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Contact',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <Phone className="w-3 h-3" />
              <span>{customer.phone || '-'}</span>
            </div>
            {customer.city && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{customer.city}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'totalOrders',
      header: 'Orders',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <div className="text-center">
            <div className="font-semibold">{customer.totalOrders}</div>
            <div className="text-xs text-muted-foreground">orders</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalSpent',
      header: 'Total Spent',
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-600">
          {formatCurrency(row.original.totalSpent)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.createdAt ? format(new Date(row.original.createdAt), 'dd/MM/yyyy') : 'N/A'}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const customer = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/customers/${customer.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Customer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShoppingBag className="mr-2 h-4 w-4" />
                View Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteCustomer(customer.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Calculate summary stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const businessCustomers = customers.filter(c => c.customerType === 'business').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Customer Database</h1>
          <p className="text-muted-foreground">Manage your customer information and relationships</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Stacked Cards */}
          <div className="space-y-3">
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeCustomers}</p>
                </div>
              </div>
            </EnhancedCard>
            
            <EnhancedCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Building className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Business</p>
                  <p className="text-2xl font-bold">{businessCustomers}</p>
                </div>
              </div>
            </EnhancedCard>
          </div>

          {/* Middle Column - Total Revenue */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="p-4 bg-green-500/10 rounded-lg inline-block mb-4">
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </EnhancedCard>

          {/* Right Column - Quick Actions */}
          <EnhancedCard className="p-6 flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-4">
              <div className="p-4 bg-purple-500/10 rounded-lg inline-block mb-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/admin/customers/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Link>
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>
            </div>
          </EnhancedCard>
        </div>

        {/* Filters */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="mb-2 block">Search</Label>
                  <Input
                    placeholder="Name, email, phone, company..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Customer Type</Label>
                  <Select value={filters.customerType || 'all'} onValueChange={(value) => handleFilterChange('customerType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Status</Label>
                  <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Filters auto-applied
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                    size="icon"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Data Table */}
        <Card className="p-6">
          <DataTable
            columns={columns}
            data={customers}
            searchKey="name"
            searchPlaceholder="Search customers..."
            loading={isLoading}
            datasetId="customer-database"
          />
        </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              Detailed information about the customer
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Basic Information</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedCustomer.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedCustomer.phone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Type</Label>
                      <p>{getTypeBadge(selectedCustomer.customerType)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <p>{getStatusBadge(selectedCustomer.status)}</p>
                    </div>
                  </div>
                </div>

                {selectedCustomer.customerType === 'business' && (
                  <div>
                    <h4 className="font-semibold mb-2">Business Information</h4>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Company</Label>
                        <p className="font-medium">{selectedCustomer.company || '-'}</p>
                      </div>
                      {selectedCustomer.taxId && (
                        <div>
                          <Label className="text-sm text-muted-foreground">Tax ID</Label>
                          <p className="font-medium">{selectedCustomer.taxId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Statistics & Activity */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Customer Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Total Orders</span>
                      </div>
                      <span className="font-bold">{selectedCustomer.totalOrders}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Total Spent</span>
                      </div>
                      <span className="font-bold">{formatCurrency(selectedCustomer.totalSpent)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="text-sm">Member Since</span>
                      </div>
                      <span className="font-bold">
                        {format(new Date(selectedCustomer.createdAt), 'MMM yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">Avg Order Value</span>
                      </div>
                      <span className="font-bold">
                        {selectedCustomer.totalOrders > 0 
                          ? formatCurrency(selectedCustomer.totalSpent / selectedCustomer.totalOrders)
                          : formatCurrency(0)
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCustomer.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {selectedCustomer.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            {selectedCustomer && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/admin/customers/${selectedCustomer.id}`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Customer
                  </Link>
                </Button>
                <Button asChild>
                  <Link to={`/admin/orders?customer=${selectedCustomer.id}`}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    View Orders
                  </Link>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LazyWrapper>
  );
}