import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shippingService, ShipmentFilters } from '@/services/api/shipping';
import type { Shipment, ShippingMethod } from '@/types/shipping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Truck,
  Package,
  Plus,
  Search,
  Filter,
  X,
  MoreHorizontal,
  Eye,
  Edit,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Weight,
  Ruler,
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';

const shipmentColumns: ColumnDef<Shipment>[] = [
  {
    accessorKey: 'tracking_number',
    header: 'Tracking Number',
    cell: ({ row }) => (
      <div className="font-mono">
        {row.getValue('tracking_number') || 'Not assigned'}
      </div>
    ),
  },
  {
    accessorKey: 'order_number',
    header: 'Order',
    cell: ({ row }) => (
      <Link 
        to={`/admin/orders/${row.original.order_id}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {row.getValue('order_number') || 'N/A'}
      </Link>
    ),
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) => {
      const name = row.getValue('customer_name') as string;
      return <span className="font-medium">{name || 'Unknown'}</span>;
    },
  },
  {
    accessorKey: 'carrier',
    header: 'Carrier',
    cell: ({ row }) => {
      const carrier = row.getValue('carrier') as string;
      const method = row.original.shipping_method_name;
      return (
        <div>
          <p className="font-medium">{carrier}</p>
          <p className="text-sm text-muted-foreground">{method}</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variants = {
        pending: 'secondary',
        picked_up: 'outline',
        in_transit: 'default',
        out_for_delivery: 'default',
        delivered: 'default',
        returned: 'destructive',
        cancelled: 'destructive',
      };
      
      return (
        <Badge variant={variants[status as keyof typeof variants] as any}>
          {status.replace('_', ' ').toUpperCase()}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'destination_address',
    header: 'Destination',
    cell: ({ row }) => {
      const address = row.getValue('destination_address') as any;
      return (
        <div className="max-w-xs">
          <p className="font-medium">{address.name}</p>
          <p className="text-sm text-muted-foreground">
            {address.city}, {address.state}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: 'shipping_cost',
    header: 'Cost',
    cell: ({ row }) => {
      const cost = row.getValue('shipping_cost') as number;
      return <span className="font-semibold">{formatCurrency(cost)}</span>;
    },
  },
  {
    accessorKey: 'estimated_delivery',
    header: 'ETA',
    cell: ({ row }) => {
      const eta = row.getValue('estimated_delivery') as string;
      if (!eta) return <span className="text-muted-foreground">-</span>;
      const date = new Date(eta);
      return (
        <div className="text-sm">
          {date.toLocaleDateString()}
          <br />
          <span className="text-muted-foreground">
            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      );
    },
  },
];

const methodColumns: ColumnDef<ShippingMethod>[] = [
  {
    accessorKey: 'name',
    header: 'Method Name',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue('name')}</p>
        <p className="text-sm text-muted-foreground">{row.original.carrier}</p>
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const desc = row.getValue('description') as string;
      return <span className="text-sm">{desc || '-'}</span>;
    },
  },
  {
    accessorKey: 'estimated_days',
    header: 'Delivery Time',
    cell: ({ row }) => {
      const days = row.getValue('estimated_days') as number;
      return <span>{days} day{days !== 1 ? 's' : ''}</span>;
    },
  },
  {
    accessorKey: 'base_cost',
    header: 'Base Cost',
    cell: ({ row }) => {
      const cost = row.getValue('base_cost') as number;
      return <span className="font-semibold">{formatCurrency(cost)}</span>;
    },
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => {
      const active = row.getValue('active') as boolean;
      return (
        <Badge variant={active ? 'default' : 'secondary'}>
          {active ? 'Active' : 'Inactive'}
        </Badge>
      );
    },
  },
];

export default function ShippingManagement() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [shipmentToDelete, setShipmentToDelete] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filters, setFilters] = useState<ShipmentFilters>({
    search: '',
    status: '',
    carrier: '',
    date_from: '',
    date_to: '',
  });

  const [newShipmentData, setNewShipmentData] = useState({
    order_id: '',
    carrier: '',
    shipping_method_id: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    destination_address: {
      name: '',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'Indonesia',
      phone: '',
    },
    notes: '',
  });

  const [newMethodData, setNewMethodData] = useState({
    name: '',
    carrier: '',
    description: '',
    estimated_days: 3,
    base_cost: 0,
    weight_rate: 0,
    active: true,
  });

  useEffect(() => {
    fetchShipments();
    fetchShippingMethods();
  }, []);

  const fetchShipments = async (customFilters?: ShipmentFilters) => {
    try {
      setLoading(true);
      const filtersToUse = customFilters || filters;
      
      // Use mock data for now - replace with real API when backend is ready
      const response = await shippingService.getMockShipments({
        ...filtersToUse,
        per_page: 50,
      });
      
      setShipments(response.data);
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      toast.error('Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  const fetchShippingMethods = async () => {
    try {
      // Use mock data for now
      const methods = await shippingService.getMockShippingMethods();
      setShippingMethods(methods);
    } catch (error) {
      console.error('Failed to fetch shipping methods:', error);
    }
  };

  const handleApplyFilters = () => {
    fetchShipments(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      carrier: '',
      date_from: '',
      date_to: '',
    };
    setFilters(clearedFilters);
    fetchShipments(clearedFilters);
  };

  const handleCreateShipment = async () => {
    if (!newShipmentData.order_id || !newShipmentData.carrier || !newShipmentData.shipping_method_id) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      // Mock creation - replace with real API
      toast.success('Shipment created successfully');
      setIsCreateDialogOpen(false);
      setNewShipmentData({
        order_id: '',
        carrier: '',
        shipping_method_id: '',
        weight: 0,
        dimensions: { length: 0, width: 0, height: 0 },
        destination_address: {
          name: '',
          street: '',
          city: '',
          state: '',
          postal_code: '',
          country: 'Indonesia',
          phone: '',
        },
        notes: '',
      });
      fetchShipments();
    } catch (error) {
      console.error('Failed to create shipment:', error);
      toast.error('Failed to create shipment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateMethod = async () => {
    if (!newMethodData.name || !newMethodData.carrier) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      // Mock creation - replace with real API
      const newMethod: ShippingMethod = {
        id: `method_${Date.now()}`,
        ...newMethodData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setShippingMethods([...shippingMethods, newMethod]);
      toast.success('Shipping method created successfully');
      setIsMethodDialogOpen(false);
      setNewMethodData({
        name: '',
        carrier: '',
        description: '',
        estimated_days: 3,
        base_cost: 0,
        weight_rate: 0,
        active: true,
      });
    } catch (error) {
      console.error('Failed to create shipping method:', error);
      toast.error('Failed to create shipping method');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteShipment = (shipmentId: string) => {
    setShipmentToDelete(shipmentId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!shipmentToDelete) return;

    try {
      setIsSaving(true);
      // Mock deletion - replace with real API
      setShipments(shipments.filter(s => s.id !== shipmentToDelete));
      toast.success('Shipment deleted successfully');
      setIsDeleteDialogOpen(false);
      setShipmentToDelete(null);
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      toast.error('Failed to delete shipment');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'picked_up':
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'returned':
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const actionColumns: ColumnDef<Shipment>[] = [
    ...shipmentColumns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const shipment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/admin/shipments/${shipment.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/shipments/${shipment.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/admin/shipments/${shipment.id}/tracking`}>
                  <MapPin className="mr-2 h-4 w-4" />
                  Track
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDeleteShipment(shipment.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const methodActionColumns: ColumnDef<ShippingMethod>[] = [
    ...methodColumns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const method = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const updatedMethods = shippingMethods.map(m => 
                    m.id === method.id ? { ...m, active: !m.active } : m
                  );
                  setShippingMethods(updatedMethods);
                  toast.success(`Method ${method.active ? 'deactivated' : 'activated'}`);
                }}
              >
                {method.active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Summary stats
  const totalShipments = shipments.length;
  const inTransitCount = shipments.filter(s => s.status === 'in_transit').length;
  const deliveredCount = shipments.filter(s => s.status === 'delivered').length;
  const pendingCount = shipments.filter(s => s.status === 'pending').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Management</h1>
          <p className="text-muted-foreground">
            Manage shipments, carriers and delivery tracking
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Shipment
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{totalShipments}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{inTransitCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{deliveredCount}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{pendingCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="shipments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="methods">Shipping Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-4">
          <Card className="p-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by tracking number, order, or customer..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="max-w-sm"
                />
              </div>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.carrier || 'all'} onValueChange={(value) => setFilters({ ...filters, carrier: value === 'all' ? '' : value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Carriers</SelectItem>
                  <SelectItem value="JNE">JNE</SelectItem>
                  <SelectItem value="SiCepat">SiCepat</SelectItem>
                  <SelectItem value="J&T">J&T</SelectItem>
                  <SelectItem value="Pos Indonesia">Pos Indonesia</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleApplyFilters} disabled={loading}>
                Apply
              </Button>
              {(filters.search || filters.status || filters.carrier) && (
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading shipments...</span>
              </div>
            ) : (
              <DataTable
                columns={actionColumns}
                data={shipments}
                searchPlaceholder="Search shipments..."
                searchKey="tracking_number"
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Shipping Methods</h3>
              <Button onClick={() => setIsMethodDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Method
              </Button>
            </div>
            
            <DataTable
              columns={methodActionColumns}
              data={shippingMethods}
              searchPlaceholder="Search methods..."
              searchKey="name"
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Shipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shipment</DialogTitle>
            <DialogDescription>
              Create a new shipment for an order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Order ID *</Label>
                <Input
                  value={newShipmentData.order_id}
                  onChange={(e) => setNewShipmentData({ ...newShipmentData, order_id: e.target.value })}
                  placeholder="Enter order ID"
                />
              </div>
              <div>
                <Label>Carrier *</Label>
                <Select value={newShipmentData.carrier} onValueChange={(value) => setNewShipmentData({ ...newShipmentData, carrier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JNE">JNE</SelectItem>
                    <SelectItem value="SiCepat">SiCepat</SelectItem>
                    <SelectItem value="J&T">J&T</SelectItem>
                    <SelectItem value="Pos Indonesia">Pos Indonesia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Shipping Method *</Label>
              <Select value={newShipmentData.shipping_method_id} onValueChange={(value) => setNewShipmentData({ ...newShipmentData, shipping_method_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {shippingMethods
                    .filter(m => m.active && m.carrier === newShipmentData.carrier)
                    .map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} - {formatCurrency(method.base_cost)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newShipmentData.weight}
                  onChange={(e) => setNewShipmentData({ ...newShipmentData, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Length (cm)</Label>
                <Input
                  type="number"
                  value={newShipmentData.dimensions.length}
                  onChange={(e) => setNewShipmentData({ 
                    ...newShipmentData, 
                    dimensions: { ...newShipmentData.dimensions, length: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input
                  type="number"
                  value={newShipmentData.dimensions.width}
                  onChange={(e) => setNewShipmentData({ 
                    ...newShipmentData, 
                    dimensions: { ...newShipmentData.dimensions, width: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  value={newShipmentData.dimensions.height}
                  onChange={(e) => setNewShipmentData({ 
                    ...newShipmentData, 
                    dimensions: { ...newShipmentData.dimensions, height: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>

            <div>
              <Label>Destination Address</Label>
              <div className="space-y-2 mt-2">
                <Input
                  placeholder="Recipient name *"
                  value={newShipmentData.destination_address.name}
                  onChange={(e) => setNewShipmentData({
                    ...newShipmentData,
                    destination_address: { ...newShipmentData.destination_address, name: e.target.value }
                  })}
                />
                <Textarea
                  placeholder="Street address *"
                  value={newShipmentData.destination_address.street}
                  onChange={(e) => setNewShipmentData({
                    ...newShipmentData,
                    destination_address: { ...newShipmentData.destination_address, street: e.target.value }
                  })}
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City *"
                    value={newShipmentData.destination_address.city}
                    onChange={(e) => setNewShipmentData({
                      ...newShipmentData,
                      destination_address: { ...newShipmentData.destination_address, city: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="State *"
                    value={newShipmentData.destination_address.state}
                    onChange={(e) => setNewShipmentData({
                      ...newShipmentData,
                      destination_address: { ...newShipmentData.destination_address, state: e.target.value }
                    })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Postal code *"
                    value={newShipmentData.destination_address.postal_code}
                    onChange={(e) => setNewShipmentData({
                      ...newShipmentData,
                      destination_address: { ...newShipmentData.destination_address, postal_code: e.target.value }
                    })}
                  />
                  <Input
                    placeholder="Phone"
                    value={newShipmentData.destination_address.phone}
                    onChange={(e) => setNewShipmentData({
                      ...newShipmentData,
                      destination_address: { ...newShipmentData.destination_address, phone: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={newShipmentData.notes}
                onChange={(e) => setNewShipmentData({ ...newShipmentData, notes: e.target.value })}
                placeholder="Optional notes or special instructions"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateShipment} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Shipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Method Dialog */}
      <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Shipping Method</DialogTitle>
            <DialogDescription>
              Create a new shipping method configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Method Name *</Label>
              <Input
                value={newMethodData.name}
                onChange={(e) => setNewMethodData({ ...newMethodData, name: e.target.value })}
                placeholder="e.g., Express, Regular"
              />
            </div>
            <div>
              <Label>Carrier *</Label>
              <Select value={newMethodData.carrier} onValueChange={(value) => setNewMethodData({ ...newMethodData, carrier: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JNE">JNE</SelectItem>
                  <SelectItem value="SiCepat">SiCepat</SelectItem>
                  <SelectItem value="J&T">J&T</SelectItem>
                  <SelectItem value="Pos Indonesia">Pos Indonesia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newMethodData.description}
                onChange={(e) => setNewMethodData({ ...newMethodData, description: e.target.value })}
                placeholder="Method description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Estimated Days</Label>
                <Input
                  type="number"
                  min="1"
                  value={newMethodData.estimated_days}
                  onChange={(e) => setNewMethodData({ ...newMethodData, estimated_days: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Base Cost</Label>
                <Input
                  type="number"
                  min="0"
                  value={newMethodData.base_cost}
                  onChange={(e) => setNewMethodData({ ...newMethodData, base_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label>Weight Rate (per kg)</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={newMethodData.weight_rate}
                onChange={(e) => setNewMethodData({ ...newMethodData, weight_rate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMethodDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateMethod} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Cancel Shipment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this shipment? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Shipment
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}