import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useInventory } from '@/hooks/useInventory';
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
import { Progress } from '@/components/ui/progress';
import { 
  Warehouse, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  MapPin,
  Building,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Users,
  BarChart3,
  Activity,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface InventoryLocation {
  id: string;
  uuid: string;
  code: string;
  name: string;
  type: 'warehouse' | 'store' | 'distribution_center' | 'virtual';
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  manager: string;
  isActive: boolean;
  capacity: {
    totalSpace: number; // in cubic meters
    usedSpace: number;
    availableSpace: number;
    utilizationPercentage: number;
  };
  zones: InventoryZone[];
  itemCount: number;
  totalValue: number;
  lastInventoryDate: string;
  operatingHours: {
    weekdays: string;
    weekends: string;
  };
  status: 'operational' | 'maintenance' | 'closed';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface InventoryZone {
  id: string;
  code: string;
  name: string;
  type: 'storage' | 'picking' | 'receiving' | 'shipping' | 'returns';
  capacity: number;
  utilization: number;
  temperature: 'ambient' | 'cold' | 'frozen';
  isActive: boolean;
}

interface LocationFormData {
  code: string;
  name: string;
  type: 'warehouse' | 'store' | 'distribution_center' | 'virtual';
  address: string;
  city: string;
  province: string;
  postalCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  manager: string;
  isActive: boolean;
  totalSpace: number;
  operatingHours: {
    weekdays: string;
    weekends: string;
  };
  notes: string;
}

const defaultFormData: LocationFormData = {
  code: '',
  name: '',
  type: 'warehouse',
  address: '',
  city: '',
  province: '',
  postalCode: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  manager: '',
  isActive: true,
  totalSpace: 0,
  operatingHours: {
    weekdays: '08:00-17:00',
    weekends: '09:00-15:00',
  },
  notes: '',
};

export default function InventoryLocations() {
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<InventoryLocation | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<LocationFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'warehouse' | 'store' | 'distribution_center' | 'virtual'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'operational' | 'maintenance' | 'closed'>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data untuk demonstrasi
  const mockLocations: InventoryLocation[] = [
    {
      id: '1',
      uuid: 'loc-001',
      code: 'WH-001',
      name: 'Main Warehouse Jakarta',
      type: 'warehouse',
      address: 'Jl. Industri Raya No. 123, Kawasan Industri Pulogadung',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '13260',
      contactPerson: 'Budi Santoso',
      contactPhone: '+62-21-4567-8901',
      contactEmail: 'warehouse.jakarta@company.com',
      manager: 'Sari Dewi',
      isActive: true,
      capacity: {
        totalSpace: 5000,
        usedSpace: 3750,
        availableSpace: 1250,
        utilizationPercentage: 75
      },
      zones: [
        { id: '1', code: 'A1', name: 'Raw Materials Zone', type: 'storage', capacity: 1000, utilization: 85, temperature: 'ambient', isActive: true },
        { id: '2', code: 'B1', name: 'Finished Goods Zone', type: 'storage', capacity: 800, utilization: 70, temperature: 'ambient', isActive: true },
        { id: '3', code: 'C1', name: 'Picking Area', type: 'picking', capacity: 200, utilization: 60, temperature: 'ambient', isActive: true }
      ],
      itemCount: 1250,
      totalValue: 15750000000,
      lastInventoryDate: '2024-12-01T10:00:00Z',
      operatingHours: {
        weekdays: '07:00-19:00',
        weekends: '08:00-16:00'
      },
      status: 'operational',
      notes: 'Primary storage facility with automated inventory system',
      createdAt: '2023-01-15T10:00:00Z',
      updatedAt: '2024-12-08T14:30:00Z'
    },
    {
      id: '2',
      uuid: 'loc-002',
      code: 'WH-002',
      name: 'Distribution Center Surabaya',
      type: 'distribution_center',
      address: 'Jl. Tanjungsari No. 456, Surabaya Industrial Estate',
      city: 'Surabaya',
      province: 'Jawa Timur',
      postalCode: '60187',
      contactPerson: 'Ahmad Wijaya',
      contactPhone: '+62-31-7890-1234',
      contactEmail: 'dc.surabaya@company.com',
      manager: 'Rudi Hartono',
      isActive: true,
      capacity: {
        totalSpace: 3000,
        usedSpace: 2400,
        availableSpace: 600,
        utilizationPercentage: 80
      },
      zones: [
        { id: '4', code: 'A1', name: 'Receiving Dock', type: 'receiving', capacity: 400, utilization: 75, temperature: 'ambient', isActive: true },
        { id: '5', code: 'B1', name: 'Storage Area', type: 'storage', capacity: 1800, utilization: 82, temperature: 'ambient', isActive: true },
        { id: '6', code: 'C1', name: 'Shipping Dock', type: 'shipping', capacity: 300, utilization: 65, temperature: 'ambient', isActive: true }
      ],
      itemCount: 890,
      totalValue: 8950000000,
      lastInventoryDate: '2024-11-28T09:00:00Z',
      operatingHours: {
        weekdays: '06:00-18:00',
        weekends: 'Closed'
      },
      status: 'operational',
      notes: 'Regional distribution hub for East Java operations',
      createdAt: '2023-03-20T08:00:00Z',
      updatedAt: '2024-12-07T16:45:00Z'
    },
    {
      id: '3',
      uuid: 'loc-003',
      code: 'ST-001',
      name: 'Retail Store Bandung',
      type: 'store',
      address: 'Jl. Braga No. 78, Bandung City Center',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40111',
      contactPerson: 'Lina Mulyani',
      contactPhone: '+62-22-2345-6789',
      contactEmail: 'store.bandung@company.com',
      manager: 'Dedi Kusuma',
      isActive: true,
      capacity: {
        totalSpace: 500,
        usedSpace: 350,
        availableSpace: 150,
        utilizationPercentage: 70
      },
      zones: [
        { id: '7', code: 'SF', name: 'Sales Floor', type: 'storage', capacity: 300, utilization: 75, temperature: 'ambient', isActive: true },
        { id: '8', code: 'BK', name: 'Back Storage', type: 'storage', capacity: 150, utilization: 60, temperature: 'ambient', isActive: true }
      ],
      itemCount: 456,
      totalValue: 2250000000,
      lastInventoryDate: '2024-12-05T18:00:00Z',
      operatingHours: {
        weekdays: '09:00-21:00',
        weekends: '09:00-22:00'
      },
      status: 'operational',
      notes: 'Flagship retail store with customer showroom',
      createdAt: '2023-06-10T12:00:00Z',
      updatedAt: '2024-12-08T10:15:00Z'
    },
    {
      id: '4',
      uuid: 'loc-004',
      code: 'WH-003',
      name: 'Cold Storage Facility',
      type: 'warehouse',
      address: 'Jl. Logistik No. 999, Tangerang Industrial Park',
      city: 'Tangerang',
      province: 'Banten',
      postalCode: '15710',
      contactPerson: 'Eko Prasetyo',
      contactPhone: '+62-21-5432-1098',
      contactEmail: 'coldstorage.tangerang@company.com',
      manager: 'Maya Sari',
      isActive: false,
      capacity: {
        totalSpace: 1200,
        usedSpace: 0,
        availableSpace: 1200,
        utilizationPercentage: 0
      },
      zones: [
        { id: '9', code: 'CS1', name: 'Cold Storage Zone 1', type: 'storage', capacity: 600, utilization: 0, temperature: 'cold', isActive: false },
        { id: '10', code: 'CS2', name: 'Cold Storage Zone 2', type: 'storage', capacity: 600, utilization: 0, temperature: 'frozen', isActive: false }
      ],
      itemCount: 0,
      totalValue: 0,
      lastInventoryDate: '2024-10-15T12:00:00Z',
      operatingHours: {
        weekdays: '24/7',
        weekends: '24/7'
      },
      status: 'maintenance',
      notes: 'Currently under maintenance - refrigeration system upgrade',
      createdAt: '2023-09-01T14:00:00Z',
      updatedAt: '2024-11-20T09:30:00Z'
    },
    {
      id: '5',
      uuid: 'loc-005',
      code: 'VW-001',
      name: 'Virtual Warehouse - Digital Products',
      type: 'virtual',
      address: 'Cloud Storage - AWS S3 ap-southeast-1',
      city: 'Virtual',
      province: 'Virtual',
      postalCode: '00000',
      contactPerson: 'IT Support Team',
      contactPhone: '+62-21-1111-2222',
      contactEmail: 'itsupport@company.com',
      manager: 'Tech Administrator',
      isActive: true,
      capacity: {
        totalSpace: 999999,
        usedSpace: 125000,
        availableSpace: 874999,
        utilizationPercentage: 12.5
      },
      zones: [
        { id: '11', code: 'DIG1', name: 'Digital Assets Zone', type: 'storage', capacity: 500000, utilization: 15, temperature: 'ambient', isActive: true },
        { id: '12', code: 'DIG2', name: 'Backup Storage', type: 'storage', capacity: 499999, utilization: 10, temperature: 'ambient', isActive: true }
      ],
      itemCount: 2500,
      totalValue: 850000000,
      lastInventoryDate: '2024-12-08T23:59:00Z',
      operatingHours: {
        weekdays: '24/7',
        weekends: '24/7'
      },
      status: 'operational',
      notes: 'Virtual location for digital product inventory tracking',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-12-09T00:05:00Z'
    }
  ];

  // Filter locations
  const filteredLocations = useMemo(() => {
    return mockLocations.filter(location => {
      const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          location.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || location.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, typeFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalLocations = mockLocations.length;
    const activeLocations = mockLocations.filter(l => l.isActive).length;
    const totalCapacity = mockLocations.reduce((sum, l) => sum + l.capacity.totalSpace, 0);
    const totalUsed = mockLocations.reduce((sum, l) => sum + l.capacity.usedSpace, 0);
    const avgUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
    const totalValue = mockLocations.reduce((sum, l) => sum + l.totalValue, 0);
    const maintenanceLocations = mockLocations.filter(l => l.status === 'maintenance').length;

    return {
      totalLocations,
      activeLocations,
      totalCapacity,
      totalUsed,
      avgUtilization,
      totalValue,
      maintenanceLocations
    };
  }, []);

  // Get type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'warehouse':
        return { color: 'default', icon: Warehouse, label: 'Warehouse' };
      case 'distribution_center':
        return { color: 'secondary', icon: Building, label: 'Distribution Center' };
      case 'store':
        return { color: 'success', icon: Users, label: 'Retail Store' };
      case 'virtual':
        return { color: 'warning', icon: Activity, label: 'Virtual' };
      default:
        return { color: 'secondary', icon: MapPin, label: 'Unknown' };
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'operational':
        return { color: 'success', icon: CheckCircle, label: 'Operational' };
      case 'maintenance':
        return { color: 'warning', icon: AlertTriangle, label: 'Maintenance' };
      case 'closed':
        return { color: 'destructive', icon: XCircle, label: 'Closed' };
      default:
        return { color: 'secondary', icon: Clock, label: 'Unknown' };
    }
  };

  // DataTable columns
  const columns: ColumnDef<InventoryLocation>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const typeInfo = getTypeInfo(row.original.type);
        const Icon = typeInfo.icon;
        
        return (
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">{row.getValue('name')}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.code} • {row.original.city}
              </div>
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
        const typeInfo = getTypeInfo(type);
        
        return (
          <Badge variant={typeInfo.color as any}>
            {typeInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'capacity',
      header: 'Capacity',
      cell: ({ row }) => {
        const capacity = row.original.capacity;
        
        return (
          <div className="text-center">
            <div className="font-medium">
              {capacity.usedSpace.toLocaleString()} / {capacity.totalSpace.toLocaleString()} m³
            </div>
            <div className="text-sm text-muted-foreground">
              {capacity.utilizationPercentage.toFixed(1)}% utilized
            </div>
            <Progress 
              value={capacity.utilizationPercentage} 
              className="w-20 h-1 mt-1"
              indicatorClassName={
                capacity.utilizationPercentage > 90 ? 'bg-red-500' : 
                capacity.utilizationPercentage > 75 ? 'bg-yellow-500' : 
                'bg-green-500'
              }
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'itemCount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Items
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.getValue<number>('itemCount').toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.zones.length} zones
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalValue',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Total Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium">
          Rp {(row.getValue<number>('totalValue') / 1000000000).toFixed(1)}B
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const statusInfo = getStatusInfo(status);
        const Icon = statusInfo.icon;
        
        return (
          <Badge variant={statusInfo.color as any}>
            <Icon className="h-3 w-3 mr-1" />
            {statusInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'manager',
      header: 'Manager',
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{row.getValue('manager')}</div>
          <div className="text-muted-foreground">{row.original.contactPerson}</div>
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
            <DropdownMenuItem onClick={() => handleViewLocation(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditLocation(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Location
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleManageZones(row.original)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Zones
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteLocation(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Location
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleCreateLocation = () => {
    setFormData(defaultFormData);
    setIsCreateModalOpen(true);
  };

  const handleViewLocation = (location: InventoryLocation) => {
    setSelectedLocation(location);
    setIsViewModalOpen(true);
  };

  const handleEditLocation = (location: InventoryLocation) => {
    setSelectedLocation(location);
    setFormData({
      code: location.code,
      name: location.name,
      type: location.type,
      address: location.address,
      city: location.city,
      province: location.province,
      postalCode: location.postalCode,
      contactPerson: location.contactPerson,
      contactPhone: location.contactPhone,
      contactEmail: location.contactEmail,
      manager: location.manager,
      isActive: location.isActive,
      totalSpace: location.capacity.totalSpace,
      operatingHours: location.operatingHours,
      notes: location.notes,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteLocation = (location: InventoryLocation) => {
    setSelectedLocation(location);
    setIsDeleteModalOpen(true);
  };

  const handleManageZones = (location: InventoryLocation) => {
    toast.info(`Zone management for ${location.name} coming soon!`);
  };

  const handleSaveLocation = async (isEdit: boolean = false) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Location ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} location`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLocation) return;
    
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Location deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      toast.error('Failed to delete location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Locations</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage warehouse locations, zones, and capacity</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Locations
          </Button>
          <Button onClick={handleCreateLocation}>
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Locations</p>
                <p className="text-2xl font-bold">{stats.totalLocations}</p>
              </div>
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeLocations}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Capacity</p>
                <p className="text-xl font-bold text-purple-600">
                  {(stats.totalCapacity / 1000).toFixed(0)}K m³
                </p>
              </div>
              <Warehouse className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Used Space</p>
                <p className="text-xl font-bold text-orange-600">
                  {(stats.totalUsed / 1000).toFixed(0)}K m³
                </p>
              </div>
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilization</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.avgUtilization.toFixed(0)}%
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-xl font-bold text-teal-600">
                  Rp {(stats.totalValue / 1000000000).toFixed(0)}B
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-teal-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenanceLocations}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search locations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: 'all' | 'warehouse' | 'store' | 'distribution_center' | 'virtual') => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="distribution_center">Distribution Center</SelectItem>
                <SelectItem value="store">Retail Store</SelectItem>
                <SelectItem value="virtual">Virtual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'operational' | 'maintenance' | 'closed') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                Advanced Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            Inventory Locations ({filteredLocations.length})
          </CardTitle>
          <CardDescription>
            Manage warehouse locations, storage zones, and capacity planning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredLocations}
            searchKey="name"
            searchPlaceholder="Search locations..."
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Location Modal */}
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
              {isEditModalOpen ? 'Edit' : 'Create'} Location
            </DialogTitle>
            <DialogDescription>
              {isEditModalOpen ? 'Update location information and settings' : 'Add a new inventory location to your system'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="contact">Contact & Operations</TabsTrigger>
              <TabsTrigger value="capacity">Capacity & Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Location Code *</Label>
                  <Input
                    id="code"
                    placeholder="e.g., WH-001"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Location Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Warehouse Jakarta"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="type">Location Type</Label>
                <Select value={formData.type} onValueChange={(value: 'warehouse' | 'store' | 'distribution_center' | 'virtual') => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse">Warehouse</SelectItem>
                    <SelectItem value="distribution_center">Distribution Center</SelectItem>
                    <SelectItem value="store">Retail Store</SelectItem>
                    <SelectItem value="virtual">Virtual Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Full address including street, district..."
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    value={formData.province}
                    onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="manager">Location Manager</Label>
                  <Input
                    id="manager"
                    value={formData.manager}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weekdays">Weekday Hours</Label>
                  <Input
                    id="weekdays"
                    placeholder="e.g., 08:00-17:00"
                    value={formData.operatingHours.weekdays}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      operatingHours: { ...prev.operatingHours, weekdays: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="weekends">Weekend Hours</Label>
                  <Input
                    id="weekends"
                    placeholder="e.g., 09:00-15:00 or Closed"
                    value={formData.operatingHours.weekends}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      operatingHours: { ...prev.operatingHours, weekends: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="capacity" className="space-y-4">
              <div>
                <Label htmlFor="totalSpace">Total Storage Capacity (m³)</Label>
                <Input
                  id="totalSpace"
                  type="number"
                  value={formData.totalSpace}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSpace: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this location for inventory operations
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this location..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
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
              onClick={() => handleSaveLocation(isEditModalOpen)}
              disabled={isLoading || !formData.name || !formData.code}
            >
              {isLoading ? 'Saving...' : (isEditModalOpen ? 'Update' : 'Create')} Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Location Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              {selectedLocation?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedLocation?.code} • {selectedLocation?.city}
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="zones">Zones</TabsTrigger>
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedLocation.capacity.utilizationPercentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Utilization</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {selectedLocation.itemCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Items</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {selectedLocation.zones.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Storage Zones</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        Rp {(selectedLocation.totalValue / 1000000000).toFixed(1)}B
                      </div>
                      <div className="text-sm text-muted-foreground">Total Value</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="zones" className="space-y-4">
                <div className="grid gap-3">
                  {selectedLocation.zones.map((zone) => (
                    <Card key={zone.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{zone.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {zone.code} • {zone.type.replace('_', ' ')} • {zone.temperature}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{zone.utilization}% utilized</div>
                            <Badge variant={zone.isActive ? 'success' : 'secondary'}>
                              {zone.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label>Contact Person</Label>
                          <p>{selectedLocation.contactPerson}</p>
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <p>{selectedLocation.contactPhone}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p>{selectedLocation.contactEmail}</p>
                        </div>
                        <div>
                          <Label>Manager</Label>
                          <p>{selectedLocation.manager}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Operating Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label>Weekdays</Label>
                          <p>{selectedLocation.operatingHours.weekdays}</p>
                        </div>
                        <div>
                          <Label>Weekends</Label>
                          <p>{selectedLocation.operatingHours.weekends}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedLocation?.name}"? 
              This action cannot be undone and will affect {selectedLocation?.itemCount} inventory items.
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
              {isLoading ? 'Deleting...' : 'Delete Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}