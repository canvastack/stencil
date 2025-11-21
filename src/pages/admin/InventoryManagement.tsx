import React, { useState, useEffect, Suspense } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  Button,
  Input,
  Label,
  Badge,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/lazy-components';
import { Search, Plus, Edit, Package, AlertTriangle, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { getInventoryItems, getInventoryLocations } from '@/services/api/inventory';
import { InventoryItem as APIInventoryItem, InventoryLocation } from '@/types/inventory';

interface InventoryItem {
  id: string;
  productName: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
}

const getColumns = (handleEdit: (item: InventoryItem) => void): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: "sku",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SKU
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "productName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "stock",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      const minStock = row.getValue("minStock") as number;
      const unit = (row.original as InventoryItem).unit;
      return (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{stock}</span>
          <span className="text-muted-foreground">{unit}</span>
          {stock > minStock ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "minStock",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Min Stock
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const minStock = row.getValue("minStock") as number;
      const unit = (row.original as InventoryItem).unit;
      return `${minStock} ${unit}`;
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "lastUpdated",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const lastUpdated = row.getValue("lastUpdated") as string;
      return new Date(lastUpdated).toLocaleDateString('id-ID');
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      const minStock = row.getValue("minStock") as number;
      if (stock === 0) {
        return <Badge className="bg-red-600">Out of Stock</Badge>;
      } else if (stock <= minStock) {
        return <Badge className="bg-yellow-600">Low Stock</Badge>;
      } else {
        return <Badge className="bg-green-600">In Stock</Badge>;
      }
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleEdit(item)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      );
    },
  },
];

export default function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory data from API
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getInventoryItems({ per_page: 100 });
        const apiItems = response.data || [];
        
        // Transform API data to UI format
        const uiItems: InventoryItem[] = apiItems.map(item => ({
          id: item.id?.toString() || item.uuid,
          productName: item.product?.name || `Product ${item.product_id}`,
          sku: item.product?.sku || 'N/A',
          category: item.product?.category || 'Uncategorized',
          stock: item.current_quantity || 0,
          minStock: item.minimum_quantity || 0,
          unit: item.unit_of_measurement || 'units',
          location: item.location_details?.location_name || 'Unknown Location',
          lastUpdated: item.updated_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        }));
        
        setInventory(uiItems);
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
        setError('Failed to load inventory data');
        toast.error('Failed to load inventory data');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((item) =>
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.stock <= item.minStock);
  const totalValue = inventory.reduce((acc, item) => acc + item.stock, 0);

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleViewItem = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      productName: '',
      sku: '',
      category: '',
      stock: 0,
      minStock: 0,
      unit: '',
      location: '',
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingItem) {
      setInventory(inventory.map(item =>
        item.id === editingItem.id ? { ...item, ...formData, lastUpdated: new Date().toISOString().split('T')[0] } : item
      ));
      toast.success('Item updated successfully');
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        ...formData as InventoryItem,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      setInventory([...inventory, newItem]);
      toast.success('Item added successfully');
    }
    setDialogOpen(false);
  };

  const getStockBadge = (item: InventoryItem) => {
    if (item.stock === 0) {
      return <Badge className="bg-red-600">Out of Stock</Badge>;
    } else if (item.stock <= item.minStock) {
      return <Badge className="bg-yellow-600">Low Stock</Badge>;
    } else {
      return <Badge className="bg-green-600">In Stock</Badge>;
    }
  };

  const stats = [
    {
      label: 'Total Items',
      value: inventory.length,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Low Stock Alert',
      value: lowStockItems.length,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    },
    {
      label: 'Total Units',
      value: totalValue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory & Stock Management</h1>
          <p className="text-muted-foreground">Track and manage raw materials and product stock</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <LazyWrapper key={stat.label}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </LazyWrapper>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="p-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Low Stock Alert</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {lowStockItems.length} items are below minimum stock level
              </p>
            </div>
          </div>
        </Card>
      )}


      {/* Inventory Table */}
      <LazyWrapper>
        <Card className="p-6">
          <DataTable
            columns={getColumns(handleEdit)}
            data={inventory}
            searchKey="productName"
            searchPlaceholder="Search by product name, SKU, or category..."
          />
        </Card>
      </LazyWrapper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName || ''}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku || ''}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Enter SKU"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Raw Material"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Input
                id="unit"
                value={formData.unit || ''}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., sheets, liters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Current Stock *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock || 0}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock *</Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock || 0}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Storage Location *</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Warehouse A - Rack 1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
