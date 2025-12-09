import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useShipping } from '@/hooks/useShipping';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  DollarSign,
  Package,
  MapPin,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface ShippingMethod {
  id: string;
  uuid: string;
  name: string;
  code: string;
  description: string;
  carrierId: string;
  carrierName: string;
  type: 'express' | 'standard' | 'economy' | 'same_day' | 'freight';
  zone: 'local' | 'domestic' | 'international';
  deliveryTime: {
    min: number;
    max: number;
    unit: 'hours' | 'days';
  };
  pricing: {
    type: 'flat_rate' | 'weight_based' | 'distance_based' | 'dimensional';
    baseRate: number;
    perKgRate?: number;
    perKmRate?: number;
    dimensionalFactor?: number;
  };
  restrictions: {
    minWeight: number;
    maxWeight: number;
    minDimensions?: { length: number; width: number; height: number };
    maxDimensions?: { length: number; width: number; height: number };
    prohibitedItems?: string[];
  };
  coverage: {
    regions: string[];
    postalCodes?: string[];
    excludedAreas?: string[];
  };
  isActive: boolean;
  isDefault: boolean;
  trackingEnabled: boolean;
  insuranceAvailable: boolean;
  signatureRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ShippingMethodFormData {
  name: string;
  code: string;
  description: string;
  carrierId: string;
  type: 'express' | 'standard' | 'economy' | 'same_day' | 'freight';
  zone: 'local' | 'domestic' | 'international';
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit: 'hours' | 'days';
  pricingType: 'flat_rate' | 'weight_based' | 'distance_based' | 'dimensional';
  baseRate: number;
  perKgRate: number;
  perKmRate: number;
  dimensionalFactor: number;
  minWeight: number;
  maxWeight: number;
  regions: string[];
  isActive: boolean;
  isDefault: boolean;
  trackingEnabled: boolean;
  insuranceAvailable: boolean;
  signatureRequired: boolean;
}

const defaultFormData: ShippingMethodFormData = {
  name: '',
  code: '',
  description: '',
  carrierId: '',
  type: 'standard',
  zone: 'domestic',
  deliveryTimeMin: 1,
  deliveryTimeMax: 3,
  deliveryTimeUnit: 'days',
  pricingType: 'flat_rate',
  baseRate: 0,
  perKgRate: 0,
  perKmRate: 0,
  dimensionalFactor: 0,
  minWeight: 0,
  maxWeight: 50,
  regions: [],
  isActive: true,
  isDefault: false,
  trackingEnabled: true,
  insuranceAvailable: false,
  signatureRequired: false,
};

export default function ShippingMethods() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<ShippingMethodFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'express' | 'standard' | 'economy' | 'same_day' | 'freight'>('all');
  const [zoneFilter, setZoneFilter] = useState<'all' | 'local' | 'domestic' | 'international'>('all');
  const [carrierFilter, setCarrierFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data
  const mockMethods: ShippingMethod[] = [
    {
      id: '1',
      uuid: 'sm-001',
      name: 'JNE Express',
      code: 'JNE-EXP',
      description: 'Fast delivery service for urgent shipments',
      carrierId: 'carrier-jne',
      carrierName: 'JNE',
      type: 'express',
      zone: 'domestic',
      deliveryTime: { min: 1, max: 2, unit: 'days' },
      pricing: { type: 'weight_based', baseRate: 15000, perKgRate: 5000 },
      restrictions: { minWeight: 0.1, maxWeight: 30 },
      coverage: { regions: ['Jakarta', 'Surabaya', 'Bandung', 'Medan'] },
      isActive: true,
      isDefault: false,
      trackingEnabled: true,
      insuranceAvailable: true,
      signatureRequired: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-12-08T14:30:00Z'
    },
    {
      id: '2',
      uuid: 'sm-002',
      name: 'TIKI Regular',
      code: 'TIKI-REG',
      description: 'Standard delivery service with reliable timing',
      carrierId: 'carrier-tiki',
      carrierName: 'TIKI',
      type: 'standard',
      zone: 'domestic',
      deliveryTime: { min: 2, max: 4, unit: 'days' },
      pricing: { type: 'weight_based', baseRate: 12000, perKgRate: 3000 },
      restrictions: { minWeight: 0.1, maxWeight: 50 },
      coverage: { regions: ['Jakarta', 'Surabaya', 'Bandung', 'Yogyakarta', 'Semarang'] },
      isActive: true,
      isDefault: true,
      trackingEnabled: true,
      insuranceAvailable: true,
      signatureRequired: false,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-12-07T16:45:00Z'
    },
    {
      id: '3',
      uuid: 'sm-003',
      name: 'Pos Indonesia Economy',
      code: 'POS-ECO',
      description: 'Economical shipping option for non-urgent items',
      carrierId: 'carrier-pos',
      carrierName: 'Pos Indonesia',
      type: 'economy',
      zone: 'domestic',
      deliveryTime: { min: 5, max: 10, unit: 'days' },
      pricing: { type: 'weight_based', baseRate: 8000, perKgRate: 2000 },
      restrictions: { minWeight: 0.1, maxWeight: 20 },
      coverage: { regions: ['All Indonesia'] },
      isActive: true,
      isDefault: false,
      trackingEnabled: false,
      insuranceAvailable: false,
      signatureRequired: false,
      createdAt: '2024-02-01T08:00:00Z',
      updatedAt: '2024-12-06T12:15:00Z'
    },
    {
      id: '4',
      uuid: 'sm-004',
      name: 'GoSend Same Day',
      code: 'GOSEND-SD',
      description: 'Same day delivery for Jakarta area',
      carrierId: 'carrier-gojek',
      carrierName: 'GoSend',
      type: 'same_day',
      zone: 'local',
      deliveryTime: { min: 2, max: 8, unit: 'hours' },
      pricing: { type: 'distance_based', baseRate: 25000, perKmRate: 2500 },
      restrictions: { minWeight: 0.1, maxWeight: 10 },
      coverage: { regions: ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'] },
      isActive: true,
      isDefault: false,
      trackingEnabled: true,
      insuranceAvailable: false,
      signatureRequired: true,
      createdAt: '2024-03-01T12:00:00Z',
      updatedAt: '2024-12-08T09:30:00Z'
    }
  ];

  // Filter methods
  const filteredMethods = useMemo(() => {
    return mockMethods.filter(method => {
      const matchesSearch = method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          method.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          method.carrierName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || method.type === typeFilter;
      const matchesZone = zoneFilter === 'all' || method.zone === zoneFilter;
      const matchesCarrier = carrierFilter === 'all' || method.carrierId === carrierFilter;
      
      return matchesSearch && matchesType && matchesZone && matchesCarrier;
    });
  }, [searchTerm, typeFilter, zoneFilter, carrierFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalMethods = mockMethods.length;
    const activeMethods = mockMethods.filter(m => m.isActive).length;
    const expressCount = mockMethods.filter(m => m.type === 'express').length;
    const standardCount = mockMethods.filter(m => m.type === 'standard').length;
    const economyCount = mockMethods.filter(m => m.type === 'economy').length;
    const sameDayCount = mockMethods.filter(m => m.type === 'same_day').length;

    return {
      totalMethods,
      activeMethods,
      expressCount,
      standardCount,
      economyCount,
      sameDayCount
    };
  }, []);

  // Get type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'express':
        return { color: 'destructive', label: 'Express' };
      case 'standard':
        return { color: 'default', label: 'Standard' };
      case 'economy':
        return { color: 'secondary', label: 'Economy' };
      case 'same_day':
        return { color: 'warning', label: 'Same Day' };
      case 'freight':
        return { color: 'outline', label: 'Freight' };
      default:
        return { color: 'secondary', label: 'Unknown' };
    }
  };

  // Get zone info
  const getZoneInfo = (zone: string) => {
    switch (zone) {
      case 'local':
        return { color: 'success', label: 'Local' };
      case 'domestic':
        return { color: 'default', label: 'Domestic' };
      case 'international':
        return { color: 'warning', label: 'International' };
      default:
        return { color: 'secondary', label: 'Unknown' };
    }
  };

  // DataTable columns
  const columns: ColumnDef<ShippingMethod>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Shipping Method
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-blue-600" />
          <div>
            <div className="font-medium flex items-center gap-2">
              {row.getValue('name')}
              {row.original.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">
              {row.original.code} • {row.original.carrierName}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const typeInfo = getTypeInfo(type);
        
        return (
          <Badge variant={typeInfo.color as any}>
            {typeInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'zone',
      header: 'Zone',
      cell: ({ row }) => {
        const zone = row.getValue('zone') as string;
        const zoneInfo = getZoneInfo(zone);
        
        return (
          <Badge variant={zoneInfo.color as any}>
            <MapPin className="h-3 w-3 mr-1" />
            {zoneInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'deliveryTime',
      header: 'Delivery Time',
      cell: ({ row }) => {
        const deliveryTime = row.original.deliveryTime;
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{deliveryTime.min}-{deliveryTime.max} {deliveryTime.unit}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'pricing',
      header: 'Pricing',
      cell: ({ row }) => {
        const pricing = row.original.pricing;
        return (
          <div className="text-right">
            <div className="font-medium">
              Rp {pricing.baseRate.toLocaleString('id-ID')}
            </div>
            <div className="text-sm text-muted-foreground">
              {pricing.type.replace('_', ' ')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'success' : 'secondary'}>
          {row.getValue('isActive') ? (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      ),
    },
    {
      id: 'features',
      header: 'Features',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.trackingEnabled && <Badge variant="outline" className="text-xs">Tracking</Badge>}
          {row.original.insuranceAvailable && <Badge variant="outline" className="text-xs">Insurance</Badge>}
          {row.original.signatureRequired && <Badge variant="outline" className="text-xs">Signature</Badge>}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewMethod(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditMethod(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Method
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleSetDefault(row.original)}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Set as Default
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteMethod(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Method
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleCreateMethod = () => {
    setFormData(defaultFormData);
    setIsCreateModalOpen(true);
  };

  const handleViewMethod = (method: ShippingMethod) => {
    setSelectedMethod(method);
    setIsViewModalOpen(true);
  };

  const handleEditMethod = (method: ShippingMethod) => {
    setSelectedMethod(method);
    // Convert method data to form data format
    setFormData({
      name: method.name,
      code: method.code,
      description: method.description,
      carrierId: method.carrierId,
      type: method.type,
      zone: method.zone,
      deliveryTimeMin: method.deliveryTime.min,
      deliveryTimeMax: method.deliveryTime.max,
      deliveryTimeUnit: method.deliveryTime.unit,
      pricingType: method.pricing.type,
      baseRate: method.pricing.baseRate,
      perKgRate: method.pricing.perKgRate || 0,
      perKmRate: method.pricing.perKmRate || 0,
      dimensionalFactor: method.pricing.dimensionalFactor || 0,
      minWeight: method.restrictions.minWeight,
      maxWeight: method.restrictions.maxWeight,
      regions: method.coverage.regions,
      isActive: method.isActive,
      isDefault: method.isDefault,
      trackingEnabled: method.trackingEnabled,
      insuranceAvailable: method.insuranceAvailable,
      signatureRequired: method.signatureRequired,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteMethod = (method: ShippingMethod) => {
    setSelectedMethod(method);
    setIsDeleteModalOpen(true);
  };

  const handleSetDefault = async (method: ShippingMethod) => {
    toast.success(`${method.name} set as default shipping method`);
  };

  const handleSaveMethod = async (isEdit: boolean = false) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Shipping method ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} shipping method`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMethod) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Shipping method deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedMethod(null);
    } catch (error) {
      toast.error('Failed to delete shipping method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipping Methods</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure delivery options and shipping rates</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Methods
          </Button>
          <Button onClick={handleCreateMethod}>
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Methods</p>
                <p className="text-2xl font-bold">{stats.totalMethods}</p>
              </div>
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeMethods}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Express</p>
                <p className="text-2xl font-bold text-red-600">{stats.expressCount}</p>
              </div>
              <Package className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Standard</p>
                <p className="text-2xl font-bold text-blue-600">{stats.standardCount}</p>
              </div>
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Economy</p>
                <p className="text-2xl font-bold text-gray-600">{stats.economyCount}</p>
              </div>
              <DollarSign className="w-6 h-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Same Day</p>
                <p className="text-2xl font-bold text-orange-600">{stats.sameDayCount}</p>
              </div>
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search methods..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="same_day">Same Day</SelectItem>
                <SelectItem value="freight">Freight</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={(value: any) => setZoneFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="domestic">Domestic</SelectItem>
                <SelectItem value="international">International</SelectItem>
              </SelectContent>
            </Select>
            <Select value={carrierFilter} onValueChange={setCarrierFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by carrier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="carrier-jne">JNE</SelectItem>
                <SelectItem value="carrier-tiki">TIKI</SelectItem>
                <SelectItem value="carrier-pos">Pos Indonesia</SelectItem>
                <SelectItem value="carrier-gojek">GoSend</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Advanced
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Methods ({filteredMethods.length})
          </CardTitle>
          <CardDescription>
            Configure delivery options, rates, and service levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredMethods}
            searchKey="name"
            searchPlaceholder="Search shipping methods..."
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Method Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setFormData(defaultFormData);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? 'Edit' : 'Create'} Shipping Method
            </DialogTitle>
            <DialogDescription>
              Configure delivery service options and pricing
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Method Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., JNE Express"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="code">Method Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., JNE-EXP"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this shipping method..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="carrierId">Carrier</Label>
                  <Select value={formData.carrierId} onValueChange={(value) => setFormData(prev => ({ ...prev, carrierId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carrier-jne">JNE</SelectItem>
                      <SelectItem value="carrier-tiki">TIKI</SelectItem>
                      <SelectItem value="carrier-pos">Pos Indonesia</SelectItem>
                      <SelectItem value="carrier-gojek">GoSend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type">Service Type</Label>
                  <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="same_day">Same Day</SelectItem>
                      <SelectItem value="freight">Freight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="zone">Service Zone</Label>
                  <Select value={formData.zone} onValueChange={(value: any) => setFormData(prev => ({ ...prev, zone: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="domestic">Domestic</SelectItem>
                      <SelectItem value="international">International</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="deliveryTimeMin">Min Delivery Time</Label>
                  <Input
                    id="deliveryTimeMin"
                    type="number"
                    value={formData.deliveryTimeMin}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMin: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTimeMax">Max Delivery Time</Label>
                  <Input
                    id="deliveryTimeMax"
                    type="number"
                    value={formData.deliveryTimeMax}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMax: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryTimeUnit">Time Unit</Label>
                  <Select value={formData.deliveryTimeUnit} onValueChange={(value: any) => setFormData(prev => ({ ...prev, deliveryTimeUnit: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div>
                <Label htmlFor="pricingType">Pricing Model</Label>
                <Select value={formData.pricingType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, pricingType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat_rate">Flat Rate</SelectItem>
                    <SelectItem value="weight_based">Weight Based</SelectItem>
                    <SelectItem value="distance_based">Distance Based</SelectItem>
                    <SelectItem value="dimensional">Dimensional Weight</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="baseRate">Base Rate (Rp) *</Label>
                  <Input
                    id="baseRate"
                    type="number"
                    value={formData.baseRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                {formData.pricingType === 'weight_based' && (
                  <div>
                    <Label htmlFor="perKgRate">Per Kg Rate (Rp)</Label>
                    <Input
                      id="perKgRate"
                      type="number"
                      value={formData.perKgRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, perKgRate: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                )}
              </div>

              {formData.pricingType === 'distance_based' && (
                <div>
                  <Label htmlFor="perKmRate">Per Km Rate (Rp)</Label>
                  <Input
                    id="perKmRate"
                    type="number"
                    value={formData.perKmRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, perKmRate: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="restrictions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minWeight">Min Weight (kg)</Label>
                  <Input
                    id="minWeight"
                    type="number"
                    step="0.1"
                    value={formData.minWeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, minWeight: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxWeight">Max Weight (kg)</Label>
                  <Input
                    id="maxWeight"
                    type="number"
                    step="0.1"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxWeight: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active Status</Label>
                    <p className="text-sm text-muted-foreground">Enable this shipping method</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isDefault">Default Method</Label>
                    <p className="text-sm text-muted-foreground">Set as default shipping option</p>
                  </div>
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trackingEnabled">Tracking Available</Label>
                    <p className="text-sm text-muted-foreground">Enable shipment tracking</p>
                  </div>
                  <Switch
                    id="trackingEnabled"
                    checked={formData.trackingEnabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackingEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insuranceAvailable">Insurance Available</Label>
                    <p className="text-sm text-muted-foreground">Offer shipment insurance</p>
                  </div>
                  <Switch
                    id="insuranceAvailable"
                    checked={formData.insuranceAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insuranceAvailable: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="signatureRequired">Signature Required</Label>
                    <p className="text-sm text-muted-foreground">Require delivery signature</p>
                  </div>
                  <Switch
                    id="signatureRequired"
                    checked={formData.signatureRequired}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, signatureRequired: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setIsEditModalOpen(false);
                setFormData(defaultFormData);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveMethod(isEditModalOpen)}
              disabled={isLoading || !formData.name || !formData.code}
            >
              {isLoading ? 'Saving...' : (isEditModalOpen ? 'Update' : 'Create')} Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Method Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              {selectedMethod?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedMethod?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedMethod && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Carrier</Label>
                  <p>{selectedMethod.carrierName}</p>
                </div>
                <div>
                  <Label>Service Type</Label>
                  <Badge variant={getTypeInfo(selectedMethod.type).color as any}>
                    {getTypeInfo(selectedMethod.type).label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Delivery Time</Label>
                  <p>{selectedMethod.deliveryTime.min}-{selectedMethod.deliveryTime.max} {selectedMethod.deliveryTime.unit}</p>
                </div>
                <div>
                  <Label>Base Rate</Label>
                  <p>Rp {selectedMethod.pricing.baseRate.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <Label>Weight Limit</Label>
                  <p>{selectedMethod.restrictions.minWeight}-{selectedMethod.restrictions.maxWeight} kg</p>
                </div>
              </div>

              <div>
                <Label>Coverage Areas</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMethod.coverage.regions.map((region, index) => (
                    <Badge key={index} variant="outline">{region}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Features</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedMethod.trackingEnabled && <Badge variant="outline">Tracking</Badge>}
                  {selectedMethod.insuranceAvailable && <Badge variant="outline">Insurance</Badge>}
                  {selectedMethod.signatureRequired && <Badge variant="outline">Signature Required</Badge>}
                  {selectedMethod.isDefault && <Badge variant="secondary">Default Method</Badge>}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Shipping Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedMethod?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}