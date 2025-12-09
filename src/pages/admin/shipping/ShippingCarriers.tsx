import React, { useState, useEffect, useCallback } from 'react';
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
  Star,
  AlertTriangle,
  Building,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface ShippingCarrier {
  id: string;
  uuid: string;
  name: string;
  code: string;
  type: 'courier' | 'postal' | 'freight' | 'express' | 'logistics_partner';
  description: string;
  logo?: string;
  website?: string;
  apiEndpoint?: string;
  apiKey?: string;
  accountNumber?: string;
  contactInfo: {
    primaryContact: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
  serviceAreas: string[];
  supportedServices: {
    domestic: boolean;
    international: boolean;
    sameDay: boolean;
    nextDay: boolean;
    freight: boolean;
    tracking: boolean;
    insurance: boolean;
    cod: boolean;
  };
  pricing: {
    model: 'flat_rate' | 'zone_based' | 'weight_based' | 'api_calculated';
    currency: string;
    minimumCharge: number;
    fuelSurcharge: number;
    insuranceRate: number;
  };
  performance: {
    onTimeDelivery: number;
    averageDeliveryTime: number;
    customerRating: number;
    totalShipments: number;
    successRate: number;
    lastUpdated: string;
  };
  integration: {
    apiConnected: boolean;
    lastSync: string;
    webhookUrl?: string;
    trackingSupport: boolean;
    labelGeneration: boolean;
  };
  status: 'active' | 'inactive' | 'suspended' | 'testing';
  isDefault: boolean;
  contractDetails?: {
    contractNumber: string;
    startDate: string;
    endDate: string;
    discountRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CarrierFormData {
  name: string;
  code: string;
  type: string;
  description: string;
  website: string;
  apiEndpoint: string;
  apiKey: string;
  accountNumber: string;
  contactInfo: {
    primaryContact: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
  serviceAreas: string[];
  supportedServices: {
    domestic: boolean;
    international: boolean;
    sameDay: boolean;
    nextDay: boolean;
    freight: boolean;
    tracking: boolean;
    insurance: boolean;
    cod: boolean;
  };
  pricing: {
    model: string;
    currency: string;
    minimumCharge: number;
    fuelSurcharge: number;
    insuranceRate: number;
  };
  webhookUrl: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  discountRate: number;
}

const defaultFormData: CarrierFormData = {
  name: '',
  code: '',
  type: '',
  description: '',
  website: '',
  apiEndpoint: '',
  apiKey: '',
  accountNumber: '',
  contactInfo: {
    primaryContact: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
  },
  serviceAreas: [],
  supportedServices: {
    domestic: false,
    international: false,
    sameDay: false,
    nextDay: false,
    freight: false,
    tracking: false,
    insurance: false,
    cod: false,
  },
  pricing: {
    model: 'weight_based',
    currency: 'IDR',
    minimumCharge: 0,
    fuelSurcharge: 0,
    insuranceRate: 0,
  },
  webhookUrl: '',
  contractNumber: '',
  startDate: '',
  endDate: '',
  discountRate: 0,
};

const serviceAreaOptions = [
  'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 
  'Palembang', 'Tangerang', 'Depok', 'Bekasi', 'Bogor', 'Batam',
  'National', 'International'
];

export default function ShippingCarriers() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingCarrier | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<CarrierFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for carriers
  useEffect(() => {
    const mockCarriers: ShippingCarrier[] = [
      {
        id: '1',
        uuid: 'carrier-001',
        name: 'JNE Express',
        code: 'JNE',
        type: 'courier',
        description: 'Jaringan Nasional Express - Leading courier service in Indonesia',
        logo: '/api/placeholder/100/60',
        website: 'https://www.jne.co.id',
        apiEndpoint: 'https://api.jne.co.id/v2',
        apiKey: '***********',
        accountNumber: 'JNE123456',
        contactInfo: {
          primaryContact: 'John Doe',
          phone: '+62-21-1234567',
          email: 'partner@jne.co.id',
          address: 'Jl. Tomang Raya No. 11',
          city: 'Jakarta',
          country: 'Indonesia',
        },
        serviceAreas: ['National', 'Jakarta', 'Surabaya', 'Bandung'],
        supportedServices: {
          domestic: true,
          international: true,
          sameDay: true,
          nextDay: true,
          freight: true,
          tracking: true,
          insurance: true,
          cod: true,
        },
        pricing: {
          model: 'weight_based',
          currency: 'IDR',
          minimumCharge: 5000,
          fuelSurcharge: 2.5,
          insuranceRate: 0.5,
        },
        performance: {
          onTimeDelivery: 94.5,
          averageDeliveryTime: 2.3,
          customerRating: 4.6,
          totalShipments: 15420,
          successRate: 98.2,
          lastUpdated: '2024-12-09T10:00:00Z',
        },
        integration: {
          apiConnected: true,
          lastSync: '2024-12-09T09:30:00Z',
          webhookUrl: 'https://mystore.com/webhooks/jne',
          trackingSupport: true,
          labelGeneration: true,
        },
        status: 'active',
        isDefault: true,
        contractDetails: {
          contractNumber: 'JNE-2024-001',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          discountRate: 15,
        },
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-12-09T10:00:00Z',
      },
      {
        id: '2',
        uuid: 'carrier-002',
        name: 'SiCepat Express',
        code: 'SICEPAT',
        type: 'courier',
        description: 'SiCepat Ekspres - Fast and reliable delivery service',
        website: 'https://www.sicepat.com',
        apiEndpoint: 'https://api.sicepat.com/v1',
        contactInfo: {
          primaryContact: 'Jane Smith',
          phone: '+62-21-7654321',
          email: 'partnership@sicepat.com',
          address: 'Jl. Raya Bekasi Km 18',
          city: 'Bekasi',
          country: 'Indonesia',
        },
        serviceAreas: ['National', 'Jakarta', 'Tangerang', 'Bekasi'],
        supportedServices: {
          domestic: true,
          international: false,
          sameDay: true,
          nextDay: true,
          freight: false,
          tracking: true,
          insurance: true,
          cod: true,
        },
        pricing: {
          model: 'zone_based',
          currency: 'IDR',
          minimumCharge: 4500,
          fuelSurcharge: 2.0,
          insuranceRate: 0.3,
        },
        performance: {
          onTimeDelivery: 92.8,
          averageDeliveryTime: 1.8,
          customerRating: 4.4,
          totalShipments: 8930,
          successRate: 97.5,
          lastUpdated: '2024-12-09T09:45:00Z',
        },
        integration: {
          apiConnected: true,
          lastSync: '2024-12-09T09:15:00Z',
          trackingSupport: true,
          labelGeneration: true,
        },
        status: 'active',
        isDefault: false,
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-12-09T09:45:00Z',
      },
      {
        id: '3',
        uuid: 'carrier-003',
        name: 'Pos Indonesia',
        code: 'POSINDO',
        type: 'postal',
        description: 'Indonesia Post - National postal service',
        website: 'https://www.posindonesia.co.id',
        contactInfo: {
          primaryContact: 'Ahmad Rahman',
          phone: '+62-21-1500161',
          email: 'kemitraan@posindonesia.co.id',
          address: 'Jl. Cilaki No. 73',
          city: 'Bandung',
          country: 'Indonesia',
        },
        serviceAreas: ['National', 'International'],
        supportedServices: {
          domestic: true,
          international: true,
          sameDay: false,
          nextDay: false,
          freight: true,
          tracking: true,
          insurance: true,
          cod: false,
        },
        pricing: {
          model: 'flat_rate',
          currency: 'IDR',
          minimumCharge: 3000,
          fuelSurcharge: 1.0,
          insuranceRate: 0.2,
        },
        performance: {
          onTimeDelivery: 89.2,
          averageDeliveryTime: 3.5,
          customerRating: 4.1,
          totalShipments: 5220,
          successRate: 95.8,
          lastUpdated: '2024-12-09T08:30:00Z',
        },
        integration: {
          apiConnected: false,
          lastSync: '2024-12-08T18:00:00Z',
          trackingSupport: true,
          labelGeneration: false,
        },
        status: 'inactive',
        isDefault: false,
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-12-08T18:00:00Z',
      },
    ];
    setCarriers(mockCarriers);
  }, []);

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         carrier.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || carrier.status === statusFilter;
    const matchesType = typeFilter === 'all' || carrier.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleCreateCarrier = () => {
    setFormData(defaultFormData);
    setIsCreateModalOpen(true);
  };

  const handleEditCarrier = (carrier: ShippingCarrier) => {
    setSelectedCarrier(carrier);
    setFormData({
      ...defaultFormData,
      name: carrier.name,
      code: carrier.code,
      type: carrier.type,
      description: carrier.description,
      website: carrier.website || '',
      apiEndpoint: carrier.apiEndpoint || '',
      accountNumber: carrier.accountNumber || '',
      contactInfo: carrier.contactInfo,
      serviceAreas: carrier.serviceAreas,
      supportedServices: carrier.supportedServices,
      pricing: carrier.pricing,
      webhookUrl: carrier.integration.webhookUrl || '',
      contractNumber: carrier.contractDetails?.contractNumber || '',
      startDate: carrier.contractDetails?.startDate || '',
      endDate: carrier.contractDetails?.endDate || '',
      discountRate: carrier.contractDetails?.discountRate || 0,
    });
    setIsEditModalOpen(true);
  };

  const handleViewCarrier = (carrier: ShippingCarrier) => {
    setSelectedCarrier(carrier);
    setIsViewModalOpen(true);
  };

  const handleDeleteCarrier = (carrier: ShippingCarrier) => {
    setSelectedCarrier(carrier);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCarrier) return;
    
    try {
      setIsLoading(true);
      // Delete API call would go here
      setCarriers(prev => prev.filter(c => c.id !== selectedCarrier.id));
      toast.success('Carrier deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedCarrier(null);
    } catch (error) {
      toast.error('Failed to delete carrier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (selectedCarrier) {
        // Update API call would go here
        const updatedCarrier: ShippingCarrier = {
          ...selectedCarrier,
          ...formData,
          updatedAt: new Date().toISOString(),
        };
        setCarriers(prev => prev.map(c => c.id === selectedCarrier.id ? updatedCarrier : c));
        toast.success('Carrier updated successfully');
        setIsEditModalOpen(false);
      } else {
        // Create API call would go here
        const newCarrier: ShippingCarrier = {
          id: Date.now().toString(),
          uuid: `carrier-${Date.now()}`,
          ...formData,
          performance: {
            onTimeDelivery: 0,
            averageDeliveryTime: 0,
            customerRating: 0,
            totalShipments: 0,
            successRate: 0,
            lastUpdated: new Date().toISOString(),
          },
          integration: {
            apiConnected: false,
            lastSync: new Date().toISOString(),
            webhookUrl: formData.webhookUrl,
            trackingSupport: false,
            labelGeneration: false,
          },
          status: 'testing',
          isDefault: false,
          contractDetails: formData.contractNumber ? {
            contractNumber: formData.contractNumber,
            startDate: formData.startDate,
            endDate: formData.endDate,
            discountRate: formData.discountRate,
          } : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCarriers(prev => [...prev, newCarrier]);
        toast.success('Carrier created successfully');
        setIsCreateModalOpen(false);
      }
      
      setFormData(defaultFormData);
      setSelectedCarrier(null);
    } catch (error) {
      toast.error(selectedCarrier ? 'Failed to update carrier' : 'Failed to create carrier');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<ShippingCarrier>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Carrier Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const carrier = row.original;
        return (
          <div className="flex items-center gap-3">
            {carrier.logo && (
              <img 
                src={carrier.logo} 
                alt={carrier.name}
                className="h-8 w-12 object-contain"
              />
            )}
            <div>
              <p className="font-medium">{carrier.name}</p>
              <p className="text-xs text-muted-foreground">{carrier.code}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const typeLabels = {
          courier: 'Courier',
          postal: 'Postal',
          freight: 'Freight',
          express: 'Express',
          logistics_partner: 'Logistics Partner',
        };
        return (
          <Badge variant="outline">
            {typeLabels[type as keyof typeof typeLabels] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'serviceAreas',
      header: 'Service Areas',
      cell: ({ row }) => {
        const areas = row.getValue('serviceAreas') as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {areas.slice(0, 2).map((area, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {area}
              </Badge>
            ))}
            {areas.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{areas.length - 2} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'performance',
      header: 'Performance',
      cell: ({ row }) => {
        const performance = row.original.performance;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-sm">{performance.customerRating}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {performance.onTimeDelivery}% on-time
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'integration',
      header: 'Integration',
      cell: ({ row }) => {
        const integration = row.original.integration;
        return (
          <div className="flex items-center gap-2">
            {integration.apiConnected ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusConfig = {
          active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
          inactive: { label: 'Inactive', variant: 'secondary' as const, icon: XCircle },
          suspended: { label: 'Suspended', variant: 'destructive' as const, icon: AlertTriangle },
          testing: { label: 'Testing', variant: 'outline' as const, icon: Clock },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config?.icon || Clock;
        return (
          <Badge variant={config?.variant || 'outline'}>
            <Icon className="h-3 w-3 mr-1" />
            {config?.label || status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const carrier = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewCarrier(carrier)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditCarrier(carrier)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Carrier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteCarrier(carrier)}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Carriers</h1>
          <p className="text-muted-foreground">
            Manage shipping carriers and their integrations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleCreateCarrier}>
            <Plus className="mr-2 h-4 w-4" />
            Add Carrier
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Carriers</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{carriers.length}</div>
            <p className="text-xs text-muted-foreground">
              {carriers.filter(c => c.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Connected</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carriers.filter(c => c.integration.apiConnected).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {carriers.length} carriers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(carriers.reduce((acc, c) => acc + c.performance.customerRating, 0) / carriers.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {carriers.reduce((acc, c) => acc + c.performance.totalShipments, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search carriers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="courier">Courier</SelectItem>
                <SelectItem value="postal">Postal</SelectItem>
                <SelectItem value="freight">Freight</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="logistics_partner">Logistics Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredCarriers}
        searchKey="name"
      />

      {/* Create/Edit Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setFormData(defaultFormData);
          setSelectedCarrier(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCarrier ? 'Edit Carrier' : 'Add New Carrier'}
            </DialogTitle>
            <DialogDescription>
              {selectedCarrier 
                ? 'Update carrier information and settings.' 
                : 'Add a new shipping carrier to your network.'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="integration">Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Carrier Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., JNE Express"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Carrier Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., JNE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="courier">Courier</SelectItem>
                      <SelectItem value="postal">Postal</SelectItem>
                      <SelectItem value="freight">Freight</SelectItem>
                      <SelectItem value="express">Express</SelectItem>
                      <SelectItem value="logistics_partner">Logistics Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.carrier.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the carrier"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryContact">Primary Contact</Label>
                  <Input
                    id="primaryContact"
                    value={formData.contactInfo.primaryContact}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, primaryContact: e.target.value }
                    }))}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.contactInfo.phone}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, phone: e.target.value }
                    }))}
                    placeholder="+62-21-1234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, email: e.target.value }
                    }))}
                    placeholder="contact@carrier.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.contactInfo.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, city: e.target.value }
                    }))}
                    placeholder="Jakarta"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.contactInfo.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    contactInfo: { ...prev.contactInfo, address: e.target.value }
                  }))}
                  placeholder="Complete address"
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Supported Services</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {Object.entries(formData.supportedServices).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Switch
                          id={key}
                          checked={value}
                          onCheckedChange={(checked) => setFormData(prev => ({
                            ...prev,
                            supportedServices: { ...prev.supportedServices, [key]: checked }
                          }))}
                        />
                        <Label htmlFor={key} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Pricing Configuration</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="pricingModel">Pricing Model</Label>
                      <Select 
                        value={formData.pricing.model} 
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          pricing: { ...prev.pricing, model: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flat_rate">Flat Rate</SelectItem>
                          <SelectItem value="zone_based">Zone Based</SelectItem>
                          <SelectItem value="weight_based">Weight Based</SelectItem>
                          <SelectItem value="api_calculated">API Calculated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumCharge">Minimum Charge (IDR)</Label>
                      <Input
                        id="minimumCharge"
                        type="number"
                        value={formData.pricing.minimumCharge}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          pricing: { ...prev.pricing, minimumCharge: Number(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                    placeholder="https://api.carrier.com/v1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your API key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Your account number with carrier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://yourstore.com/webhooks/carrier"
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
                setSelectedCarrier(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              {selectedCarrier ? 'Update Carrier' : 'Create Carrier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedCarrier?.logo && (
                <img 
                  src={selectedCarrier.logo} 
                  alt={selectedCarrier.name}
                  className="h-8 w-12 object-contain"
                />
              )}
              {selectedCarrier?.name}
              <Badge variant={selectedCarrier?.status === 'active' ? 'default' : 'secondary'}>
                {selectedCarrier?.status}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Detailed information about this shipping carrier
            </DialogDescription>
          </DialogHeader>

          {selectedCarrier && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Code:</span> {selectedCarrier.code}</div>
                    <div><span className="text-muted-foreground">Type:</span> {selectedCarrier.type}</div>
                    <div><span className="text-muted-foreground">Website:</span> 
                      {selectedCarrier.website && (
                        <a href={selectedCarrier.website} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline ml-1">
                          {selectedCarrier.website}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Performance Metrics</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Customer Rating:</span> {selectedCarrier.performance.customerRating}/5</div>
                    <div><span className="text-muted-foreground">On-time Delivery:</span> {selectedCarrier.performance.onTimeDelivery}%</div>
                    <div><span className="text-muted-foreground">Success Rate:</span> {selectedCarrier.performance.successRate}%</div>
                    <div><span className="text-muted-foreground">Total Shipments:</span> {selectedCarrier.performance.totalShipments.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Contact Person:</span> {selectedCarrier.contactInfo.primaryContact}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selectedCarrier.contactInfo.phone}</div>
                  <div><span className="text-muted-foreground">Email:</span> {selectedCarrier.contactInfo.email}</div>
                  <div><span className="text-muted-foreground">City:</span> {selectedCarrier.contactInfo.city}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Service Coverage</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCarrier.serviceAreas.map((area, index) => (
                    <Badge key={index} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Supported Services</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(selectedCarrier.supportedServices).map(([service, supported]) => (
                    <div key={service} className="flex items-center gap-2">
                      {supported ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm capitalize">{service.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Integration Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {selectedCarrier.integration.apiConnected ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>API Connected</span>
                  </div>
                  <div><span className="text-muted-foreground">Last Sync:</span> {new Date(selectedCarrier.integration.lastSync).toLocaleString()}</div>
                  <div className="flex items-center gap-2">
                    {selectedCarrier.integration.trackingSupport ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span>Tracking Support</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            {selectedCarrier && (
              <Button onClick={() => {
                setIsViewModalOpen(false);
                handleEditCarrier(selectedCarrier);
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Carrier
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Carrier</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCarrier?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
              {isLoading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}