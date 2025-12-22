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
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Bell,
  Clock,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  Settings,
  Package,
  CheckCircle,
  XCircle,
  Trash2,
  Mail,
  Smartphone,
  Volume2,
  BellRing,
  Zap,
  TrendingDown,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface InventoryAlert {
  id: string;
  uuid: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'reorder_point' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  productId: string;
  productName: string;
  sku: string;
  locationId: string;
  locationName: string;
  currentStock: number;
  threshold: number;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notificationSent: boolean;
  autoReorderTriggered: boolean;
}

interface AlertRule {
  id: string;
  uuid: string;
  name: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'reorder_point' | 'custom';
  description: string;
  conditions: {
    threshold?: number;
    comparison?: 'less_than' | 'greater_than' | 'equal_to';
    category?: string;
    location?: string;
    daysBeforeExpiry?: number;
  };
  actions: {
    emailNotification: boolean;
    smsNotification: boolean;
    pushNotification: boolean;
    autoReorder: boolean;
    createTask: boolean;
  };
  recipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AlertFormData {
  name: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'reorder_point' | 'custom';
  description: string;
  threshold: number;
  comparison: 'less_than' | 'greater_than' | 'equal_to';
  category: string;
  location: string;
  daysBeforeExpiry: number;
  emailNotification: boolean;
  smsNotification: boolean;
  pushNotification: boolean;
  autoReorder: boolean;
  createTask: boolean;
  recipients: string[];
  isActive: boolean;
}

const defaultFormData: AlertFormData = {
  name: '',
  type: 'low_stock',
  description: '',
  threshold: 0,
  comparison: 'less_than',
  category: '',
  location: '',
  daysBeforeExpiry: 30,
  emailNotification: true,
  smsNotification: false,
  pushNotification: true,
  autoReorder: false,
  createTask: false,
  recipients: [],
  isActive: true,
};

export default function InventoryAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<InventoryAlert | null>(null);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isCreateRuleModalOpen, setIsCreateRuleModalOpen] = useState(false);
  const [isEditRuleModalOpen, setIsEditRuleModalOpen] = useState(false);
  const [isViewAlertModalOpen, setIsViewAlertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState<AlertFormData>(defaultFormData);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'reorder_point' | 'custom'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved' | 'dismissed'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  // Mock data untuk demonstrasi
  const mockAlerts: InventoryAlert[] = [
    {
      id: '1',
      uuid: 'alert-001',
      type: 'low_stock',
      priority: 'high',
      title: 'Low Stock Alert',
      message: 'Stock level below minimum threshold',
      productId: 'prod-002',
      productName: 'Stainless Steel Plate 5mm',
      sku: 'SS-PLATE-5MM',
      locationId: 'loc-001',
      locationName: 'Warehouse A - Zone 2',
      currentStock: 35,
      threshold: 40,
      status: 'active',
      createdAt: '2024-12-08T14:30:00Z',
      updatedAt: '2024-12-08T14:30:00Z',
      notificationSent: true,
      autoReorderTriggered: false
    },
    {
      id: '2',
      uuid: 'alert-002',
      type: 'out_of_stock',
      priority: 'critical',
      title: 'Out of Stock Alert',
      message: 'Product is completely out of stock',
      productId: 'prod-003',
      productName: 'Brass Engraving Plate',
      sku: 'BRASS-ENG-PLATE',
      locationId: 'loc-002',
      locationName: 'Warehouse B - Zone 1',
      currentStock: 0,
      threshold: 20,
      status: 'acknowledged',
      createdAt: '2024-12-06T16:45:00Z',
      updatedAt: '2024-12-07T10:15:00Z',
      acknowledgedAt: '2024-12-07T10:15:00Z',
      acknowledgedBy: 'John Doe',
      notificationSent: true,
      autoReorderTriggered: true
    },
    {
      id: '3',
      uuid: 'alert-003',
      type: 'overstock',
      priority: 'medium',
      title: 'Overstock Alert',
      message: 'Stock level exceeds maximum capacity',
      productId: 'prod-004',
      productName: 'Acrylic Sheet Clear 2mm',
      sku: 'ACR-CLEAR-2MM',
      locationId: 'loc-003',
      locationName: 'Warehouse C - Zone 1',
      currentStock: 450,
      threshold: 300,
      status: 'resolved',
      createdAt: '2024-12-05T11:20:00Z',
      updatedAt: '2024-12-06T14:30:00Z',
      acknowledgedAt: '2024-12-05T12:00:00Z',
      acknowledgedBy: 'Jane Smith',
      resolvedAt: '2024-12-06T14:30:00Z',
      resolvedBy: 'Mike Johnson',
      notificationSent: true,
      autoReorderTriggered: false
    },
    {
      id: '4',
      uuid: 'alert-004',
      type: 'reorder_point',
      priority: 'high',
      title: 'Reorder Point Reached',
      message: 'Stock reached reorder point, new order recommended',
      productId: 'prod-001',
      productName: 'Aluminum Sheet 3mm',
      sku: 'ALU-SHEET-3MM',
      locationId: 'loc-001',
      locationName: 'Warehouse A - Zone 1',
      currentStock: 75,
      threshold: 75,
      status: 'active',
      createdAt: '2024-12-07T09:00:00Z',
      updatedAt: '2024-12-07T09:00:00Z',
      notificationSent: true,
      autoReorderTriggered: true
    },
    {
      id: '5',
      uuid: 'alert-005',
      type: 'expiring',
      priority: 'medium',
      title: 'Items Expiring Soon',
      message: 'Items will expire in 15 days',
      productId: 'prod-006',
      productName: 'Adhesive Labels Batch #2024-11',
      sku: 'ADH-LABEL-NOV24',
      locationId: 'loc-002',
      locationName: 'Warehouse B - Zone 3',
      currentStock: 125,
      threshold: 30,
      status: 'dismissed',
      createdAt: '2024-11-25T08:00:00Z',
      updatedAt: '2024-12-01T16:30:00Z',
      notificationSent: true,
      autoReorderTriggered: false
    }
  ];

  const mockAlertRules: AlertRule[] = [
    {
      id: '1',
      uuid: 'rule-001',
      name: 'Raw Materials Low Stock',
      type: 'low_stock',
      description: 'Alert when raw materials fall below minimum threshold',
      conditions: {
        threshold: 50,
        comparison: 'less_than',
        category: 'Raw Materials'
      },
      actions: {
        emailNotification: true,
        smsNotification: false,
        pushNotification: true,
        autoReorder: false,
        createTask: true
      },
      recipients: ['warehouse@company.com', 'procurement@company.com'],
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-12-01T14:30:00Z'
    },
    {
      id: '2',
      uuid: 'rule-002',
      name: 'Critical Out of Stock',
      type: 'out_of_stock',
      description: 'Immediate alert for out of stock situations',
      conditions: {
        threshold: 0,
        comparison: 'equal_to'
      },
      actions: {
        emailNotification: true,
        smsNotification: true,
        pushNotification: true,
        autoReorder: true,
        createTask: true
      },
      recipients: ['manager@company.com', 'warehouse@company.com', '+62812345678'],
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-12-01T14:30:00Z'
    }
  ];

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter(alert => {
      const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.locationName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || alert.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || alert.priority === priorityFilter;
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
      
      return matchesSearch && matchesType && matchesPriority && matchesStatus;
    });
  }, [searchTerm, typeFilter, priorityFilter, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalAlerts = mockAlerts.length;
    const activeAlerts = mockAlerts.filter(a => a.status === 'active').length;
    const criticalAlerts = mockAlerts.filter(a => a.priority === 'critical').length;
    const acknowledgedAlerts = mockAlerts.filter(a => a.status === 'acknowledged').length;
    const resolvedAlerts = mockAlerts.filter(a => a.status === 'resolved').length;
    const autoReordersTriggered = mockAlerts.filter(a => a.autoReorderTriggered).length;

    return {
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      acknowledgedAlerts,
      resolvedAlerts,
      autoReordersTriggered
    };
  }, []);

  // Get type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'low_stock':
        return { color: 'warning', icon: TrendingDown, label: 'Low Stock' };
      case 'out_of_stock':
        return { color: 'destructive', icon: XCircle, label: 'Out of Stock' };
      case 'overstock':
        return { color: 'secondary', icon: Package, label: 'Overstock' };
      case 'expiring':
        return { color: 'warning', icon: Calendar, label: 'Expiring' };
      case 'reorder_point':
        return { color: 'default', icon: ShoppingCart, label: 'Reorder Point' };
      case 'custom':
        return { color: 'outline', icon: Settings, label: 'Custom' };
      default:
        return { color: 'secondary', icon: Bell, label: 'Unknown' };
    }
  };

  // Get priority info
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { color: 'destructive', label: 'Critical' };
      case 'high':
        return { color: 'warning', label: 'High' };
      case 'medium':
        return { color: 'default', label: 'Medium' };
      case 'low':
        return { color: 'secondary', label: 'Low' };
      default:
        return { color: 'secondary', label: 'Unknown' };
    }
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'destructive', icon: AlertTriangle, label: 'Active' };
      case 'acknowledged':
        return { color: 'warning', icon: Eye, label: 'Acknowledged' };
      case 'resolved':
        return { color: 'success', icon: CheckCircle, label: 'Resolved' };
      case 'dismissed':
        return { color: 'secondary', icon: XCircle, label: 'Dismissed' };
      default:
        return { color: 'secondary', icon: Clock, label: 'Unknown' };
    }
  };

  // DataTable columns for alerts
  const alertColumns: ColumnDef<InventoryAlert>[] = [
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
      cell: ({ row }) => {
        const typeInfo = getTypeInfo(row.original.type);
        const Icon = typeInfo.icon;
        
        return (
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-orange-600" />
            <div>
              <div className="font-medium">{row.getValue('productName')}</div>
              <div className="text-sm text-muted-foreground">
                {row.original.sku} • {row.original.locationName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Alert Type',
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
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string;
        const priorityInfo = getPriorityInfo(priority);
        
        return (
          <Badge variant={priorityInfo.color as any}>
            {priorityInfo.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'currentStock',
      header: 'Stock Level',
      cell: ({ row }) => {
        const current = row.original.currentStock;
        const threshold = row.original.threshold;
        
        return (
          <div className="text-center">
            <div className="font-medium">{current.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              Threshold: {threshold.toLocaleString()}
            </div>
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
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="text-sm">
            {date.toLocaleDateString('id-ID')}
            <div className="text-xs text-muted-foreground">
              {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
            <DropdownMenuItem onClick={() => handleViewAlert(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {row.original.status === 'active' && (
              <DropdownMenuItem onClick={() => handleAcknowledgeAlert(row.original)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Acknowledge
              </DropdownMenuItem>
            )}
            {(row.original.status === 'active' || row.original.status === 'acknowledged') && (
              <DropdownMenuItem onClick={() => handleResolveAlert(row.original)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Resolved
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDismissAlert(row.original)}
              className="text-muted-foreground"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Dismiss
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // DataTable columns for alert rules
  const ruleColumns: ColumnDef<AlertRule>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Rule Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue('name')}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.description}
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
      accessorKey: 'conditions',
      header: 'Conditions',
      cell: ({ row }) => {
        const conditions = row.original.conditions;
        return (
          <div className="text-sm">
            {conditions.threshold && (
              <div>Threshold: {conditions.threshold}</div>
            )}
            {conditions.category && (
              <div>Category: {conditions.category}</div>
            )}
            {conditions.daysBeforeExpiry && (
              <div>Days before expiry: {conditions.daysBeforeExpiry}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      header: 'Notifications',
      cell: ({ row }) => {
        const actions = row.original.actions;
        return (
          <div className="flex gap-1">
            {actions.emailNotification && <Mail className="h-4 w-4 text-blue-600" />}
            {actions.smsNotification && <Smartphone className="h-4 w-4 text-green-600" />}
            {actions.pushNotification && <BellRing className="h-4 w-4 text-orange-600" />}
            {actions.autoReorder && <ShoppingCart className="h-4 w-4 text-purple-600" />}
          </div>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.getValue('isActive') ? 'success' : 'secondary'}>
          {row.getValue('isActive') ? 'Active' : 'Inactive'}
        </Badge>
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
            <DropdownMenuItem onClick={() => handleEditRule(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Rule
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteRule(row.original)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Rule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewAlert = (alert: InventoryAlert) => {
    setSelectedAlert(alert);
    setIsViewAlertModalOpen(true);
  };

  const handleAcknowledgeAlert = async (alert: InventoryAlert) => {
    toast.success(`Alert acknowledged for ${alert.productName}`);
  };

  const handleResolveAlert = async (alert: InventoryAlert) => {
    toast.success(`Alert resolved for ${alert.productName}`);
  };

  const handleDismissAlert = async (alert: InventoryAlert) => {
    toast.success(`Alert dismissed for ${alert.productName}`);
  };

  const handleCreateRule = () => {
    setFormData(defaultFormData);
    setIsCreateRuleModalOpen(true);
  };

  const handleEditRule = (rule: AlertRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      type: rule.type,
      description: rule.description,
      threshold: rule.conditions.threshold || 0,
      comparison: rule.conditions.comparison || 'less_than',
      category: rule.conditions.category || '',
      location: rule.conditions.location || '',
      daysBeforeExpiry: rule.conditions.daysBeforeExpiry || 30,
      emailNotification: rule.actions.emailNotification,
      smsNotification: rule.actions.smsNotification,
      pushNotification: rule.actions.pushNotification,
      autoReorder: rule.actions.autoReorder,
      createTask: rule.actions.createTask,
      recipients: rule.recipients,
      isActive: rule.isActive,
    });
    setIsEditRuleModalOpen(true);
  };

  const handleDeleteRule = (rule: AlertRule) => {
    setSelectedRule(rule);
    setIsDeleteModalOpen(true);
  };

  const handleSaveRule = async (isEdit: boolean = false) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Alert rule ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsCreateRuleModalOpen(false);
      setIsEditRuleModalOpen(false);
      setFormData(defaultFormData);
    } catch (error) {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} alert rule`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRule) return;
    
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Alert rule deleted successfully!');
      setIsDeleteModalOpen(false);
      setSelectedRule(null);
    } catch (error) {
      toast.error('Failed to delete alert rule');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor stock alerts and configure notification rules</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Alerts
          </Button>
          <Button onClick={handleCreateRule}>
            <Plus className="w-4 h-4 mr-2" />
            Create Alert Rule
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
                <p className="text-2xl font-bold">{stats.totalAlerts}</p>
              </div>
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats.activeAlerts}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
                <p className="text-2xl font-bold text-red-500">{stats.criticalAlerts}</p>
              </div>
              <Zap className="w-6 h-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Acknowledged</p>
                <p className="text-2xl font-bold text-orange-600">{stats.acknowledgedAlerts}</p>
              </div>
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolvedAlerts}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Auto-Reorders</p>
                <p className="text-2xl font-bold text-purple-600">{stats.autoReordersTriggered}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts">Current Alerts</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search alerts..."
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
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="overstock">Overstock</SelectItem>
                    <SelectItem value="expiring">Expiring</SelectItem>
                    <SelectItem value="reorder_point">Reorder Point</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
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

          {/* Alerts Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Current Alerts ({filteredAlerts.length})
              </CardTitle>
              <CardDescription>
                Active inventory alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={alertColumns}
                data={filteredAlerts}
                searchKey="productName"
                searchPlaceholder="Search alerts..."
                loading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          {/* Alert Rules Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Alert Rules ({mockAlertRules.length})
              </CardTitle>
              <CardDescription>
                Configure automated alert rules and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={ruleColumns}
                data={mockAlertRules}
                searchKey="name"
                searchPlaceholder="Search alert rules..."
                loading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Rule Modal */}
      <Dialog open={isCreateRuleModalOpen || isEditRuleModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateRuleModalOpen(false);
          setIsEditRuleModalOpen(false);
          setFormData(defaultFormData);
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditRuleModalOpen ? 'Edit' : 'Create'} Alert Rule
            </DialogTitle>
            <DialogDescription>
              Configure automated inventory alert conditions and notifications
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="conditions">Conditions</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Raw Materials Low Stock Alert"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="type">Alert Type</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="overstock">Overstock</SelectItem>
                    <SelectItem value="expiring">Expiring Items</SelectItem>
                    <SelectItem value="reorder_point">Reorder Point</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe when this alert should be triggered..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isActive">Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable this alert rule to monitor inventory
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="conditions" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="threshold">Threshold Value</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="comparison">Comparison</Label>
                  <Select value={formData.comparison} onValueChange={(value: any) => setFormData(prev => ({ ...prev, comparison: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="equal_to">Equal To</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category Filter (Optional)</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                      <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location Filter (Optional)</Label>
                  <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Locations</SelectItem>
                      <SelectItem value="loc-001">Warehouse A</SelectItem>
                      <SelectItem value="loc-002">Warehouse B</SelectItem>
                      <SelectItem value="loc-003">Warehouse C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'expiring' && (
                <div>
                  <Label htmlFor="daysBeforeExpiry">Days Before Expiry</Label>
                  <Input
                    id="daysBeforeExpiry"
                    type="number"
                    value={formData.daysBeforeExpiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, daysBeforeExpiry: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send alert via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.emailNotification}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emailNotification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send alert via SMS</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.smsNotification}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smsNotification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="h-4 w-4" />
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send browser/app notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.pushNotification}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pushNotification: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <div>
                      <Label>Auto-Reorder</Label>
                      <p className="text-sm text-muted-foreground">Automatically create reorder requests</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.autoReorder}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoReorder: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <div>
                      <Label>Create Task</Label>
                      <p className="text-sm text-muted-foreground">Create follow-up task for staff</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.createTask}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, createTask: checked }))}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateRuleModalOpen(false);
                setIsEditRuleModalOpen(false);
                setFormData(defaultFormData);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSaveRule(isEditRuleModalOpen)}
              disabled={isLoading || !formData.name}
            >
              {isLoading ? 'Saving...' : (isEditRuleModalOpen ? 'Update' : 'Create')} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Alert Modal */}
      <Dialog open={isViewAlertModalOpen} onOpenChange={setIsViewAlertModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Alert Details
            </DialogTitle>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Product</Label>
                  <p className="font-medium">{selectedAlert.productName}</p>
                  <p className="text-sm text-muted-foreground">{selectedAlert.sku}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p>{selectedAlert.locationName}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Current Stock</Label>
                  <p className="text-2xl font-bold text-blue-600">{selectedAlert.currentStock}</p>
                </div>
                <div>
                  <Label>Threshold</Label>
                  <p className="text-2xl font-bold text-orange-600">{selectedAlert.threshold}</p>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Badge variant={getPriorityInfo(selectedAlert.priority).color as any}>
                    {getPriorityInfo(selectedAlert.priority).label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Message</Label>
                <p className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded">
                  {selectedAlert.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Created</Label>
                  <p>{new Date(selectedAlert.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusInfo(selectedAlert.status).color as any}>
                    {getStatusInfo(selectedAlert.status).label}
                  </Badge>
                </div>
              </div>

              {selectedAlert.acknowledgedAt && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Acknowledged At</Label>
                    <p>{new Date(selectedAlert.acknowledgedAt).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <Label>Acknowledged By</Label>
                    <p>{selectedAlert.acknowledgedBy}</p>
                  </div>
                </div>
              )}

              {selectedAlert.resolvedAt && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label>Resolved At</Label>
                    <p>{new Date(selectedAlert.resolvedAt).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <Label>Resolved By</Label>
                    <p>{selectedAlert.resolvedBy}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Notification Sent</Label>
                  <Badge variant={selectedAlert.notificationSent ? 'success' : 'secondary'}>
                    {selectedAlert.notificationSent ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div>
                  <Label>Auto-Reorder Triggered</Label>
                  <Badge variant={selectedAlert.autoReorderTriggered ? 'success' : 'secondary'}>
                    {selectedAlert.autoReorderTriggered ? 'Yes' : 'No'}
                  </Badge>
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
            <DialogTitle>Delete Alert Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedRule?.name}"? 
              This will stop monitoring for this alert condition.
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
              {isLoading ? 'Deleting...' : 'Delete Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}