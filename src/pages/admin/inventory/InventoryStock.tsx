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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Warehouse,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  XCircle,
  History,
  Calculator,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationName: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  totalValue: number;
  lastStockUpdate: string;
  lastMovement: string;
  movementType: 'in' | 'out' | 'transfer' | 'adjustment';
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked';
  category: string;
  supplier: string;
}

interface StockAdjustment {
  itemId: string;
  productName: string;
  currentStock: number;
  adjustmentQuantity: number;
  adjustmentType: 'increase' | 'decrease' | 'set';
  reason: string;
  notes: string;
}

const defaultAdjustment: StockAdjustment = {
  itemId: '',
  productName: '',
  currentStock: 0,
  adjustmentQuantity: 0,
  adjustmentType: 'increase',
  reason: '',
  notes: '',
};

export default function InventoryStock() {
  const { items, isLoading: inventoryLoading, fetchItems, adjustStock } = useInventory();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isMovementHistoryOpen, setIsMovementHistoryOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustment>(defaultAdjustment);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked'>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load inventory items from API
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Set inventory when items are loaded
  useEffect(() => {
    if (items && items.length > 0) {
      setInventory(items);
    }
  }, [items]);

  // Mock data untuk demonstrasi
  const mockInventory: InventoryItem[] = [
    {
      id: '1',
      productId: 'prod-001',
      productName: 'Aluminum Sheet 3mm',
      sku: 'ALU-SHEET-3MM',
      locationId: 'loc-001',
      locationName: 'Warehouse A - Zone 1',
      currentStock: 150,
      reservedStock: 25,
      availableStock: 125,
      minimumStock: 50,
      maximumStock: 300,
      reorderPoint: 75,
      reorderQuantity: 100,
      unitCost: 45000,
      totalValue: 6750000,
      lastStockUpdate: '2024-12-08T10:30:00Z',
      lastMovement: '2024-12-08T10:30:00Z',
      movementType: 'out',
      status: 'in_stock',
      category: 'Raw Materials',
      supplier: 'PT. Alumindo Jaya'
    },
    {
      id: '2',
      productId: 'prod-002',
      productName: 'Stainless Steel Plate 5mm',
      sku: 'SS-PLATE-5MM',
      locationId: 'loc-001',
      locationName: 'Warehouse A - Zone 2',
      currentStock: 35,
      reservedStock: 10,
      availableStock: 25,
      minimumStock: 40,
      maximumStock: 200,
      reorderPoint: 50,
      reorderQuantity: 80,
      unitCost: 125000,
      totalValue: 4375000,
      lastStockUpdate: '2024-12-07T14:15:00Z',
      lastMovement: '2024-12-07T14:15:00Z',
      movementType: 'in',
      status: 'low_stock',
      category: 'Raw Materials',
      supplier: 'CV. Stainless Prima'
    },
    {
      id: '3',
      productId: 'prod-003',
      productName: 'Brass Engraving Plate',
      sku: 'BRASS-ENG-PLATE',
      locationId: 'loc-002',
      locationName: 'Warehouse B - Zone 1',
      currentStock: 0,
      reservedStock: 5,
      availableStock: -5,
      minimumStock: 20,
      maximumStock: 100,
      reorderPoint: 25,
      reorderQuantity: 50,
      unitCost: 85000,
      totalValue: 0,
      lastStockUpdate: '2024-12-06T16:45:00Z',
      lastMovement: '2024-12-06T16:45:00Z',
      movementType: 'out',
      status: 'out_of_stock',
      category: 'Finished Goods',
      supplier: 'PT. Logam Mulia'
    },
    {
      id: '4',
      productId: 'prod-004',
      productName: 'Acrylic Sheet Clear 2mm',
      sku: 'ACR-CLEAR-2MM',
      locationId: 'loc-003',
      locationName: 'Warehouse C - Zone 1',
      currentStock: 450,
      reservedStock: 50,
      availableStock: 400,
      minimumStock: 100,
      maximumStock: 300,
      reorderPoint: 150,
      reorderQuantity: 200,
      unitCost: 35000,
      totalValue: 15750000,
      lastStockUpdate: '2024-12-08T11:20:00Z',
      lastMovement: '2024-12-08T11:20:00Z',
      movementType: 'in',
      status: 'overstocked',
      category: 'Raw Materials',
      supplier: 'PT. Plastik Cemerlang'
    },
    {
      id: '5',
      productId: 'prod-005',
      productName: 'Wooden Sign Base Oak',
      sku: 'WOOD-OAK-BASE',
      locationId: 'loc-002',
      locationName: 'Warehouse B - Zone 2',
      currentStock: 85,
      reservedStock: 15,
      availableStock: 70,
      minimumStock: 30,
      maximumStock: 150,
      reorderPoint: 45,
      reorderQuantity: 75,
      unitCost: 95000,
      totalValue: 8075000,
      lastStockUpdate: '2024-12-08T09:00:00Z',
      lastMovement: '2024-12-08T09:00:00Z',
      movementType: 'adjustment',
      status: 'in_stock',
      category: 'Finished Goods',
      supplier: 'CV. Kayu Berkualitas'
    }
  ];

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return mockInventory.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.locationName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesLocation = locationFilter === 'all' || item.locationId === locationFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesLocation && matchesCategory;
    });
  }, [searchTerm, statusFilter, locationFilter, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalItems = mockInventory.length;
    const totalValue = mockInventory.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = mockInventory.filter(item => item.status === 'low_stock').length;
    const outOfStockItems = mockInventory.filter(item => item.status === 'out_of_stock').length;
    const overstockedItems = mockInventory.filter(item => item.status === 'overstocked').length;
    const reorderNeeded = mockInventory.filter(item => item.currentStock <= item.reorderPoint).length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      outOfStockItems,
      overstockedItems,
      reorderNeeded
    };
  }, []);

  // Get stock status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'in_stock':
        return { color: 'success', icon: CheckCircle, label: 'In Stock' };
      case 'low_stock':
        return { color: 'warning', icon: AlertTriangle, label: 'Low Stock' };
      case 'out_of_stock':
        return { color: 'destructive', icon: XCircle, label: 'Out of Stock' };
      case 'overstocked':
        return { color: 'secondary', icon: TrendingUp, label: 'Overstocked' };
      default:
        return { color: 'secondary', icon: Package, label: 'Unknown' };
    }
  };

  // DataTable columns
  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: 'productName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Product
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('productName')}</div>
          <div className="text-sm text-muted-foreground">
            SKU: {row.original.sku}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.category}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'locationName',
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{row.getValue('locationName')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'currentStock',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Stock Level
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const current = row.original.currentStock;
        const reserved = row.original.reservedStock;
        const available = row.original.availableStock;
        const minimum = row.original.minimumStock;
        const maximum = row.original.maximumStock;
        
        const stockPercentage = maximum > 0 ? (current / maximum) * 100 : 0;
        
        return (
          <div className="text-right">
            <div className="font-medium text-lg">
              {current.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Available: {available.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              Reserved: {reserved.toLocaleString()}
            </div>
            <Progress 
              value={stockPercentage} 
              className="w-20 h-1 mt-1"
              indicatorClassName={
                current <= minimum ? 'bg-red-500' : 
                current >= maximum ? 'bg-orange-500' : 
                'bg-green-500'
              }
            />
          </div>
        );
      },
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
      accessorKey: 'totalValue',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Value
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue<number>('totalValue');
        const unitCost = row.original.unitCost;
        
        return (
          <div className="text-right">
            <div className="font-medium">
              Rp {value.toLocaleString('id-ID')}
            </div>
            <div className="text-sm text-muted-foreground">
              @ Rp {unitCost.toLocaleString('id-ID')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'lastMovement',
      header: 'Last Movement',
      cell: ({ row }) => {
        const lastMovement = new Date(row.getValue('lastMovement'));
        const movementType = row.original.movementType;
        
        const getMovementIcon = () => {
          switch (movementType) {
            case 'in': return <ArrowUp className="h-3 w-3 text-green-600" />;
            case 'out': return <ArrowDown className="h-3 w-3 text-red-600" />;
            case 'transfer': return <ArrowUpDown className="h-3 w-3 text-blue-600" />;
            case 'adjustment': return <Calculator className="h-3 w-3 text-orange-600" />;
            default: return <Minus className="h-3 w-3 text-gray-600" />;
          }
        };
        
        return (
          <div className="flex items-center gap-2">
            {getMovementIcon()}
            <div>
              <div className="text-sm">
                {lastMovement.toLocaleDateString('id-ID')}
              </div>
              <div className="text-xs text-muted-foreground capitalize">
                {movementType.replace('_', ' ')}
              </div>
            </div>
          </div>
        );
      },
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
            <DropdownMenuItem onClick={() => handleViewItem(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStockAdjustment(row.original)}>
              <Calculator className="mr-2 h-4 w-4" />
              Adjust Stock
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleMovementHistory(row.original)}>
              <History className="mr-2 h-4 w-4" />
              Movement History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleCreateReorder(row.original)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Reorder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewModalOpen(true);
  };

  const handleStockAdjustment = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustmentForm({
      ...defaultAdjustment,
      itemId: item.id,
      productName: item.productName,
      currentStock: item.currentStock,
    });
    setIsAdjustmentModalOpen(true);
  };

  const handleMovementHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsMovementHistoryOpen(true);
  };

  const handleCreateReorder = (item: InventoryItem) => {
    toast.info(`Reorder created for ${item.productName} - Quantity: ${item.reorderQuantity}`);
  };

  const handleSaveAdjustment = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Stock adjustment saved successfully!');
      setIsAdjustmentModalOpen(false);
      setAdjustmentForm(defaultAdjustment);
    } catch (error) {
      toast.error('Failed to save stock adjustment');
    } finally {
      setIsLoading(false);
    }
  };

  const getNewStock = () => {
    const { currentStock, adjustmentQuantity, adjustmentType } = adjustmentForm;
    switch (adjustmentType) {
      case 'increase':
        return currentStock + adjustmentQuantity;
      case 'decrease':
        return currentStock - adjustmentQuantity;
      case 'set':
        return adjustmentQuantity;
      default:
        return currentStock;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Stock Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage real-time inventory stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Stock Report
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Stock Levels
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Inventory Item
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-xl font-bold">
                  Rp {(stats.totalValue / 1000000).toFixed(0)}M
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
              </div>
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Overstocked</p>
                <p className="text-2xl font-bold text-purple-600">{stats.overstockedItems}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reorder Needed</p>
                <p className="text-2xl font-bold text-teal-600">{stats.reorderNeeded}</p>
              </div>
              <RefreshCw className="w-6 h-6 text-teal-600" />
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
                placeholder="Search products..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="overstocked">Overstocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="loc-001">Warehouse A</SelectItem>
                <SelectItem value="loc-002">Warehouse B</SelectItem>
                <SelectItem value="loc-003">Warehouse C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                <SelectItem value="Finished Goods">Finished Goods</SelectItem>
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
            <Package className="h-5 w-5" />
            Inventory Stock Levels ({filteredInventory.length})
          </CardTitle>
          <CardDescription>
            Real-time inventory stock tracking with alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredInventory}
            searchKey="productName"
            searchPlaceholder="Search products..."
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjust stock levels for {adjustmentForm.productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Current Stock</Label>
                <div className="text-2xl font-bold text-blue-600">
                  {adjustmentForm.currentStock.toLocaleString()}
                </div>
              </div>
              <div>
                <Label htmlFor="adjustmentType">Adjustment Type</Label>
                <Select 
                  value={adjustmentForm.adjustmentType} 
                  onValueChange={(value: 'increase' | 'decrease' | 'set') => setAdjustmentForm(prev => ({ ...prev, adjustmentType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increase">Increase Stock</SelectItem>
                    <SelectItem value="decrease">Decrease Stock</SelectItem>
                    <SelectItem value="set">Set Stock Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="adjustmentQuantity">
                  {adjustmentForm.adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
                </Label>
                <Input
                  id="adjustmentQuantity"
                  type="number"
                  value={adjustmentForm.adjustmentQuantity}
                  onChange={(e) => setAdjustmentForm(prev => ({
                    ...prev,
                    adjustmentQuantity: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={adjustmentForm.reason} onValueChange={(value) => setAdjustmentForm(prev => ({ ...prev, reason: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physical_count">Physical Count</SelectItem>
                  <SelectItem value="damaged_goods">Damaged Goods</SelectItem>
                  <SelectItem value="expired_items">Expired Items</SelectItem>
                  <SelectItem value="theft_loss">Theft/Loss</SelectItem>
                  <SelectItem value="supplier_return">Supplier Return</SelectItem>
                  <SelectItem value="system_error">System Error Correction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter additional notes about this adjustment..."
                value={adjustmentForm.notes}
                onChange={(e) => setAdjustmentForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Adjustment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Current Stock:</span>
                  <span>{adjustmentForm.currentStock.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>New Stock:</span>
                  <span className={getNewStock() > adjustmentForm.currentStock ? 'text-green-600' : getNewStock() < adjustmentForm.currentStock ? 'text-red-600' : ''}>
                    {getNewStock().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Difference:</span>
                  <span className={getNewStock() > adjustmentForm.currentStock ? 'text-green-600' : getNewStock() < adjustmentForm.currentStock ? 'text-red-600' : ''}>
                    {getNewStock() > adjustmentForm.currentStock ? '+' : ''}
                    {(getNewStock() - adjustmentForm.currentStock).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdjustmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdjustment}
              disabled={isLoading || !adjustmentForm.reason || adjustmentForm.adjustmentQuantity === 0}
            >
              {isLoading ? 'Saving...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Item Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedItem?.productName} - Stock Details
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="levels">Stock Levels</TabsTrigger>
                <TabsTrigger value="movements">Recent Movements</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {selectedItem.currentStock}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Stock</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {selectedItem.availableStock}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {selectedItem.reservedStock}
                      </div>
                      <div className="text-sm text-muted-foreground">Reserved</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        Rp {(selectedItem.totalValue / 1000000).toFixed(1)}M
                      </div>
                      <div className="text-sm text-muted-foreground">Total Value</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="levels" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stock Thresholds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Minimum Stock:</span>
                          <span className="font-medium">{selectedItem.minimumStock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maximum Stock:</span>
                          <span className="font-medium">{selectedItem.maximumStock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reorder Point:</span>
                          <span className="font-medium">{selectedItem.reorderPoint}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Reorder Quantity:</span>
                          <span className="font-medium">{selectedItem.reorderQuantity}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cost Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Unit Cost:</span>
                          <span className="font-medium">
                            Rp {selectedItem.unitCost.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Value:</span>
                          <span className="font-medium">
                            Rp {selectedItem.totalValue.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Supplier:</span>
                          <span className="font-medium">{selectedItem.supplier}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="movements" className="space-y-4">
                <div className="text-center text-muted-foreground">
                  Recent stock movements would be displayed here
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Movement History Modal */}
      <Dialog open={isMovementHistoryOpen} onOpenChange={setIsMovementHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Stock Movement History - {selectedItem?.productName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              Stock movement history would be displayed here with full audit trail
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}