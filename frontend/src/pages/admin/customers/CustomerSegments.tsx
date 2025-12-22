import React, { useState, useMemo } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer, CustomerSegment, CustomerFilters } from '@/types/customer';
import { Link } from 'react-router-dom';
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
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Trash2, 
  Target,
  TrendingUp,
  UserCheck,
  Settings,
  Download,
  Upload,
  PieChart,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface CustomerSegmentFormData {
  name: string;
  description: string;
  criteria: {
    minOrders?: number;
    maxOrders?: number;
    minSpending?: number;
    maxSpending?: number;
    customerType?: 'individual' | 'company' | '';
    city?: string;
    registrationDateFrom?: string;
    registrationDateTo?: string;
    lastOrderDays?: number;
  };
  color: string;
  autoAssign: boolean;
  isActive: boolean;
}

const defaultFormData: CustomerSegmentFormData = {
  name: '',
  description: '',
  criteria: {},
  color: '#3B82F6',
  autoAssign: false,
  isActive: true,
};

const presetColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function CustomerSegments() {
  const { customers: apiCustomers, isLoading: customersLoading, fetchCustomers } = useCustomers();
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<CustomerSegment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Load customers from API
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerSegmentFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data untuk demonstrasi
  const mockSegments: CustomerSegment[] = [
    {
      id: '1',
      uuid: 'seg-001',
      name: 'VIP Customers',
      description: 'High-value customers with orders above Rp 50M annually',
      criteria: {
        minSpending: 50000000,
        minOrders: 10
      },
      color: '#10B981',
      customerCount: 45,
      isActive: true,
      autoAssign: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-12-01'
    },
    {
      id: '2',
      uuid: 'seg-002',
      name: 'Corporate Clients',
      description: 'B2B corporate customers for bulk orders',
      criteria: {
        customerType: 'company',
        minOrders: 5
      },
      color: '#3B82F6',
      customerCount: 128,
      isActive: true,
      autoAssign: true,
      createdAt: '2024-02-10',
      updatedAt: '2024-11-20'
    },
    {
      id: '3',
      uuid: 'seg-003',
      name: 'New Customers',
      description: 'Recently registered customers (last 30 days)',
      criteria: {
        registrationDateFrom: '2024-11-01'
      },
      color: '#F59E0B',
      customerCount: 67,
      isActive: true,
      autoAssign: true,
      createdAt: '2024-03-05',
      updatedAt: '2024-12-05'
    },
    {
      id: '4',
      uuid: 'seg-004',
      name: 'Inactive Customers',
      description: 'No orders in the last 90 days',
      criteria: {
        lastOrderDays: 90
      },
      color: '#EF4444',
      customerCount: 234,
      isActive: false,
      autoAssign: false,
      createdAt: '2024-01-20',
      updatedAt: '2024-10-15'
    },
    {
      id: '5',
      uuid: 'seg-005',
      name: 'Jakarta Premium',
      description: 'Premium customers from Jakarta area',
      criteria: {
        city: 'Jakarta',
        minSpending: 10000000
      },
      color: '#8B5CF6',
      customerCount: 89,
      isActive: true,
      autoAssign: true,
      createdAt: '2024-04-12',
      updatedAt: '2024-11-28'
    }
  ];

  // Filter segments
  const filteredSegments = useMemo(() => {
    return mockSegments.filter(segment => {
      const matchesSearch = segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          segment.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && segment.isActive) ||
                          (statusFilter === 'inactive' && !segment.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalSegments = mockSegments.length;
    const activeSegments = mockSegments.filter(s => s.isActive).length;
    const totalCustomersSegmented = mockSegments.reduce((sum, s) => sum + s.customerCount, 0);
    const autoAssignSegments = mockSegments.filter(s => s.autoAssign).length;

    return {
      totalSegments,
      activeSegments,
      totalCustomersSegmented,
      autoAssignSegments
    };
  }, []);

  // DataTable columns
  const columns: ColumnDef<CustomerSegment>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Segment Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: row.original.color }}
          />
          <div>
            <div className="font-medium">{row.getValue('name')}</div>
            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
              {row.original.description}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'customerCount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customers
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.getValue('customerCount')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {isActive ? (
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
        );
      },
    },
    {
      accessorKey: 'autoAssign',
      header: 'Auto-Assign',
      cell: ({ row }) => {
        const autoAssign = row.getValue('autoAssign') as boolean;
        return (
          <Badge variant={autoAssign ? 'default' : 'outline'}>
            {autoAssign ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <Settings className="h-3 w-3 mr-1" />
                Manual
              </>
            )}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last Updated
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {new Date(row.getValue('updatedAt')).toLocaleDateString('id-ID')}
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
            <DropdownMenuItem onClick={() => handleViewSegment(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditSegment(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Segment
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteSegment(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Segment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleCreateSegment = () => {
    setFormData(defaultFormData);
    setIsCreateModalOpen(true);
  };

  const handleViewSegment = (segment: CustomerSegment) => {
    setSelectedSegment(segment);
    setIsViewModalOpen(true);
  };

  const handleEditSegment = (segment: CustomerSegment) => {
    setSelectedSegment(segment);
    setFormData({
      name: segment.name,
      description: segment.description,
      criteria: segment.criteria,
      color: segment.color,
      autoAssign: segment.autoAssign,
      isActive: segment.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteSegment = (segment: CustomerSegment) => {
    setSelectedSegment(segment);
    setIsDeleteModalOpen(true);
  };

  const handleSaveSegment = async (isEdit: boolean = false) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Segment ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} segment`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSegment) return;
    
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Segment deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedSegment(null);
    } catch (error) {
      toast.error('Failed to delete segment');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCriteriaForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minOrders">Minimum Orders</Label>
          <Input
            id="minOrders"
            type="number"
            placeholder="e.g., 5"
            value={formData.criteria.minOrders || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              criteria: { ...prev.criteria, minOrders: e.target.value ? parseInt(e.target.value) : undefined }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="maxOrders">Maximum Orders</Label>
          <Input
            id="maxOrders"
            type="number"
            placeholder="e.g., 50"
            value={formData.criteria.maxOrders || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              criteria: { ...prev.criteria, maxOrders: e.target.value ? parseInt(e.target.value) : undefined }
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minSpending">Minimum Spending (Rp)</Label>
          <Input
            id="minSpending"
            type="number"
            placeholder="e.g., 1000000"
            value={formData.criteria.minSpending || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              criteria: { ...prev.criteria, minSpending: e.target.value ? parseInt(e.target.value) : undefined }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="maxSpending">Maximum Spending (Rp)</Label>
          <Input
            id="maxSpending"
            type="number"
            placeholder="e.g., 100000000"
            value={formData.criteria.maxSpending || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              criteria: { ...prev.criteria, maxSpending: e.target.value ? parseInt(e.target.value) : undefined }
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerType">Customer Type</Label>
          <Select 
            value={formData.criteria.customerType || ''} 
            onValueChange={(value) => setFormData(prev => ({
              ...prev,
              criteria: { ...prev.criteria, customerType: value as 'individual' | 'company' | '' }
            }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any Type</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="e.g., Jakarta"
            value={formData.criteria.city || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              criteria: { ...prev.criteria, city: e.target.value || undefined }
            }))}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="lastOrderDays">Days Since Last Order</Label>
        <Input
          id="lastOrderDays"
          type="number"
          placeholder="e.g., 90 (customers with no orders in last 90 days)"
          value={formData.criteria.lastOrderDays || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            criteria: { ...prev.criteria, lastOrderDays: e.target.value ? parseInt(e.target.value) : undefined }
          }))}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Segments</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer segmentation and targeting</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Segments
          </Button>
          <Button onClick={handleCreateSegment}>
            <Plus className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Segments</p>
                <p className="text-2xl font-bold">{stats.totalSegments}</p>
              </div>
              <Target className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Segments</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeSegments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Segmented Customers</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalCustomersSegmented}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auto-Assign</p>
                <p className="text-2xl font-bold text-orange-600">{stats.autoAssignSegments}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search segments..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
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
            <Target className="h-5 w-5" />
            Customer Segments ({filteredSegments.length})
          </CardTitle>
          <CardDescription>
            Manage customer segmentation rules and automatic assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredSegments}
            searchKey="name"
            searchPlaceholder="Search segments..."
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Segment Modal */}
      <Dialog open={isCreateModalOpen || isEditModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setFormData(defaultFormData);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditModalOpen ? 'Edit' : 'Create'} Customer Segment
            </DialogTitle>
            <DialogDescription>
              Define criteria to automatically group customers based on their behavior and attributes.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="criteria">Segmentation Criteria</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Segment Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., VIP Customers"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe this customer segment..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoAssign">Auto-Assign Customers</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign customers who meet the criteria
                  </p>
                </div>
                <Switch
                  id="autoAssign"
                  checked={formData.autoAssign}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoAssign: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this segment for use in marketing campaigns
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="criteria" className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Segmentation Rules</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Define criteria to automatically identify customers for this segment. 
                  Customers must match ALL specified criteria to be included.
                </p>
              </div>
              
              {renderCriteriaForm()}
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
              onClick={() => handleSaveSegment(isEditModalOpen)}
              disabled={isLoading || !formData.name}
            >
              {isLoading ? 'Saving...' : (isEditModalOpen ? 'Update' : 'Create')} Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Segment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedSegment?.color }}
              />
              {selectedSegment?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedSegment?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedSegment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Customer Count</Label>
                  <p className="text-2xl font-bold text-blue-600">{selectedSegment.customerCount}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p>
                    <Badge variant={selectedSegment.isActive ? 'success' : 'secondary'}>
                      {selectedSegment.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <Label>Segmentation Criteria</Label>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mt-2">
                  <pre className="text-sm">
                    {JSON.stringify(selectedSegment.criteria, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Auto-Assign</Label>
                  <p className="text-sm">
                    {selectedSegment.autoAssign ? 'Enabled' : 'Manual assignment only'}
                  </p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-sm">
                    {new Date(selectedSegment.updatedAt).toLocaleDateString('id-ID')}
                  </p>
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
            <DialogTitle>Delete Customer Segment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedSegment?.name}"? 
              This action cannot be undone and will remove {selectedSegment?.customerCount} customers from this segment.
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
              {isLoading ? 'Deleting...' : 'Delete Segment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}