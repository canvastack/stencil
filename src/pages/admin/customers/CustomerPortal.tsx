import React, { useState, useMemo, useEffect } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer, CustomerFilters } from '@/types/customer';
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
  Globe, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Eye, 
  Settings,
  UserCheck,
  UserX,
  Key,
  Mail,
  Clock,
  Shield,
  Activity,
  Users,
  Building,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link as LinkIcon,
  Copy,
  Send,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface PortalAccess {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerType: 'individual' | 'company';
  portalEnabled: boolean;
  lastLogin: string | null;
  loginCount: number;
  accountCreatedDate: string;
  permissions: string[];
  status: 'active' | 'suspended' | 'pending_activation' | 'locked';
  invitationSent: boolean;
  invitationSentDate: string | null;
  totalOrders: number;
  lifetimeValue: number;
}

interface PortalInvitation {
  customerId: string;
  customerName: string;
  customerEmail: string;
  message: string;
  includeSetupGuide: boolean;
  expirationDays: number;
}

interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

const defaultInvitation: PortalInvitation = {
  customerId: '',
  customerName: '',
  customerEmail: '',
  message: 'Welcome to our customer portal! You can now access your orders, track shipments, and manage your account online.',
  includeSetupGuide: true,
  expirationDays: 7,
};

const permissionGroups: PermissionGroup[] = [
  {
    id: 'basic',
    name: 'Basic Access',
    description: 'View orders and account information',
    permissions: ['view_orders', 'view_profile', 'view_invoices']
  },
  {
    id: 'standard',
    name: 'Standard Access',
    description: 'Basic access plus order management',
    permissions: ['view_orders', 'view_profile', 'view_invoices', 'cancel_orders', 'request_quotes', 'download_files']
  },
  {
    id: 'premium',
    name: 'Premium Access',
    description: 'Full portal access with advanced features',
    permissions: ['view_orders', 'view_profile', 'view_invoices', 'cancel_orders', 'request_quotes', 'download_files', 'bulk_orders', 'analytics', 'api_access']
  }
];

export default function CustomerPortal() {
  const { customers: apiCustomers, isLoading: customersLoading, fetchCustomers } = useCustomers();
  const [portalAccess, setPortalAccess] = useState<PortalAccess[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<PortalAccess | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [invitationForm, setInvitationForm] = useState<PortalInvitation>(defaultInvitation);

  // Load customers from API
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Transform API customers to PortalAccess format
  useEffect(() => {
    if (apiCustomers && apiCustomers.length > 0) {
      const accessData: PortalAccess[] = apiCustomers.map(customer => ({
        id: customer.id,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerType: customer.type,
        hasAccess: Math.random() > 0.5, // Random for demo
        accessLevel: 'standard',
        permissions: permissionGroups.find(g => g.id === 'standard')?.permissions || [],
        lastLogin: customer.status === 'active' ? new Date().toISOString() : null,
        invitedAt: customer.created_at,
        activatedAt: customer.status === 'active' ? customer.created_at : null,
        status: customer.status === 'active' ? 'active' : 'inactive'
      }));
      setPortalAccess(accessData);
    }
  }, [apiCustomers]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending_activation' | 'locked'>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Mock data untuk demonstrasi
  const mockPortalAccess: PortalAccess[] = [
    {
      id: '1',
      customerId: 'cust-001',
      customerName: 'PT. Teknologi Maju',
      customerEmail: 'procurement@teknologimaju.co.id',
      customerType: 'company',
      portalEnabled: true,
      lastLogin: '2024-12-08T14:30:00Z',
      loginCount: 145,
      accountCreatedDate: '2023-05-15T10:00:00Z',
      permissions: ['view_orders', 'view_profile', 'view_invoices', 'cancel_orders', 'request_quotes', 'download_files', 'bulk_orders', 'analytics'],
      status: 'active',
      invitationSent: true,
      invitationSentDate: '2023-05-15T10:00:00Z',
      totalOrders: 45,
      lifetimeValue: 2500000000
    },
    {
      id: '2',
      customerId: 'cust-002',
      customerName: 'CV. Berkah Jaya',
      customerEmail: 'owner@berkahjaya.com',
      customerType: 'company',
      portalEnabled: true,
      lastLogin: '2024-12-05T09:15:00Z',
      loginCount: 67,
      accountCreatedDate: '2023-08-20T14:30:00Z',
      permissions: ['view_orders', 'view_profile', 'view_invoices', 'cancel_orders', 'request_quotes'],
      status: 'active',
      invitationSent: true,
      invitationSentDate: '2023-08-20T14:30:00Z',
      totalOrders: 23,
      lifetimeValue: 450000000
    },
    {
      id: '3',
      customerId: 'cust-003',
      customerName: 'Ahmad Budiman',
      customerEmail: 'ahmad.budiman@gmail.com',
      customerType: 'individual',
      portalEnabled: false,
      lastLogin: null,
      loginCount: 0,
      accountCreatedDate: '2024-01-10T11:20:00Z',
      permissions: [],
      status: 'pending_activation',
      invitationSent: false,
      invitationSentDate: null,
      totalOrders: 12,
      lifetimeValue: 85000000
    },
    {
      id: '4',
      customerId: 'cust-004',
      customerName: 'PT. Industri Kreatif',
      customerEmail: 'finance@industrikreatif.co.id',
      customerType: 'company',
      portalEnabled: true,
      lastLogin: '2024-11-20T16:45:00Z',
      loginCount: 23,
      accountCreatedDate: '2023-11-05T13:10:00Z',
      permissions: ['view_orders', 'view_profile', 'view_invoices'],
      status: 'suspended',
      invitationSent: true,
      invitationSentDate: '2023-11-05T13:10:00Z',
      totalOrders: 18,
      lifetimeValue: 320000000
    },
    {
      id: '5',
      customerId: 'cust-005',
      customerName: 'Sari Dewi',
      customerEmail: 'sari.dewi@hotmail.com',
      customerType: 'individual',
      portalEnabled: true,
      lastLogin: '2024-12-07T08:30:00Z',
      loginCount: 34,
      accountCreatedDate: '2024-03-22T15:45:00Z',
      permissions: ['view_orders', 'view_profile', 'view_invoices', 'cancel_orders'],
      status: 'active',
      invitationSent: true,
      invitationSentDate: '2024-03-22T15:45:00Z',
      totalOrders: 8,
      lifetimeValue: 45000000
    }
  ];

  // Filter portal access
  const filteredPortalAccess = useMemo(() => {
    return mockPortalAccess.filter(access => {
      const matchesSearch = access.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          access.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || access.status === statusFilter;
      const matchesAccess = accessFilter === 'all' || 
                          (accessFilter === 'enabled' && access.portalEnabled) ||
                          (accessFilter === 'disabled' && !access.portalEnabled);
      
      return matchesSearch && matchesStatus && matchesAccess;
    });
  }, [searchTerm, statusFilter, accessFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalCustomers = mockPortalAccess.length;
    const enabledPortals = mockPortalAccess.filter(a => a.portalEnabled).length;
    const activeUsers = mockPortalAccess.filter(a => a.status === 'active').length;
    const totalLogins = mockPortalAccess.reduce((sum, a) => sum + a.loginCount, 0);
    const recentLogins = mockPortalAccess.filter(a => {
      if (!a.lastLogin) return false;
      const lastLogin = new Date(a.lastLogin);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastLogin > thirtyDaysAgo;
    }).length;

    return {
      totalCustomers,
      enabledPortals,
      activeUsers,
      totalLogins,
      recentLogins,
      engagementRate: totalCustomers > 0 ? (recentLogins / enabledPortals) * 100 : 0
    };
  }, []);

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'success', icon: CheckCircle, label: 'Active' };
      case 'suspended':
        return { color: 'destructive', icon: Ban, label: 'Suspended' };
      case 'pending_activation':
        return { color: 'warning', icon: Clock, label: 'Pending' };
      case 'locked':
        return { color: 'secondary', icon: XCircle, label: 'Locked' };
      default:
        return { color: 'secondary', icon: AlertTriangle, label: 'Unknown' };
    }
  };

  // DataTable columns
  const columns: ColumnDef<PortalAccess>[] = [
    {
      accessorKey: 'customerName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customer Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.customerType === 'company' ? (
            <Building className="h-4 w-4 text-blue-600" />
          ) : (
            <Users className="h-4 w-4 text-green-600" />
          )}
          <div>
            <div className="font-medium">{row.getValue('customerName')}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.customerEmail}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'portalEnabled',
      header: 'Portal Access',
      cell: ({ row }) => {
        const enabled = row.getValue('portalEnabled') as boolean;
        return (
          <Badge variant={enabled ? 'success' : 'secondary'}>
            {enabled ? (
              <>
                <UserCheck className="h-3 w-3 mr-1" />
                Enabled
              </>
            ) : (
              <>
                <UserX className="h-3 w-3 mr-1" />
                Disabled
              </>
            )}
          </Badge>
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
      accessorKey: 'lastLogin',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last Login
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const lastLogin = row.getValue('lastLogin') as string | null;
        if (!lastLogin) {
          return <span className="text-muted-foreground">Never</span>;
        }
        
        const loginDate = new Date(lastLogin);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60));
        
        let timeAgo = '';
        if (diffInHours < 1) {
          timeAgo = 'Just now';
        } else if (diffInHours < 24) {
          timeAgo = `${diffInHours}h ago`;
        } else if (diffInHours < 24 * 7) {
          timeAgo = `${Math.floor(diffInHours / 24)}d ago`;
        } else {
          timeAgo = loginDate.toLocaleDateString('id-ID');
        }
        
        return (
          <div>
            <div className="text-sm">{timeAgo}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.loginCount} total logins
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.getValue('permissions') as string[];
        const permissionCount = permissions.length;
        
        let permissionLevel = 'Basic';
        if (permissionCount >= 8) {
          permissionLevel = 'Premium';
        } else if (permissionCount >= 5) {
          permissionLevel = 'Standard';
        }
        
        return (
          <div className="text-sm">
            <Badge variant="outline" className="mb-1">
              {permissionLevel}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {permissionCount} permissions
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
            <DropdownMenuItem onClick={() => handleViewPortalAccess(row.original)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleManagePortalAccess(row.original)}>
              <Settings className="mr-2 h-4 w-4" />
              Manage Access
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!row.original.invitationSent && (
              <DropdownMenuItem onClick={() => handleSendInvitation(row.original)}>
                <Send className="mr-2 h-4 w-4" />
                Send Invitation
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleCopyPortalLink(row.original)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Portal Link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleToggleAccess(row.original)}
              className={row.original.portalEnabled ? "text-destructive" : "text-green-600"}
            >
              {row.original.portalEnabled ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Disable Portal
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Enable Portal
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleSendInvitation = (customer: PortalAccess) => {
    setSelectedCustomer(customer);
    setInvitationForm({
      ...defaultInvitation,
      customerId: customer.customerId,
      customerName: customer.customerName,
      customerEmail: customer.customerEmail,
    });
    setIsInviteModalOpen(true);
  };

  const handleViewPortalAccess = (customer: PortalAccess) => {
    setSelectedCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleManagePortalAccess = (customer: PortalAccess) => {
    setSelectedCustomer(customer);
    setSelectedPermissions(customer.permissions);
    setIsManageModalOpen(true);
  };

  const handleCopyPortalLink = (customer: PortalAccess) => {
    const portalLink = `https://portal.canvastack.com/login?customer=${customer.customerId}`;
    navigator.clipboard.writeText(portalLink);
    toast.success('Portal link copied to clipboard!');
  };

  const handleToggleAccess = async (customer: PortalAccess) => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const action = customer.portalEnabled ? 'disabled' : 'enabled';
      toast.success(`Portal access ${action} for ${customer.customerName}`);
    } catch (error) {
      toast.error('Failed to toggle portal access');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendInvitationSubmit = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Invitation sent to ${invitationForm.customerName}!`);
      setIsInviteModalOpen(false);
      setInvitationForm(defaultInvitation);
    } catch (error) {
      toast.error('Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    setIsLoading(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Permissions updated successfully!');
      setIsManageModalOpen(false);
    } catch (error) {
      toast.error('Failed to update permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionGroupSelect = (groupId: string) => {
    const group = permissionGroups.find(g => g.id === groupId);
    if (group) {
      setSelectedPermissions(group.permissions);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Portal Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer portal access and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Access Report
          </Button>
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Bulk Invite
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Portal Enabled</p>
                <p className="text-2xl font-bold text-green-600">{stats.enabledPortals}</p>
              </div>
              <Globe className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-purple-600">{stats.activeUsers}</p>
              </div>
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Logins</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalLogins}</p>
              </div>
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recent Logins</p>
                <p className="text-2xl font-bold text-teal-600">{stats.recentLogins}</p>
              </div>
              <Clock className="w-6 h-6 text-teal-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Engagement</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.engagementRate.toFixed(0)}%</p>
              </div>
              <Shield className="w-6 h-6 text-indigo-600" />
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
                placeholder="Search customers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'suspended' | 'pending_activation' | 'locked') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="pending_activation">Pending</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={accessFilter} onValueChange={(value: 'all' | 'enabled' | 'disabled') => setAccessFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by access" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Access</SelectItem>
                <SelectItem value="enabled">Portal Enabled</SelectItem>
                <SelectItem value="disabled">Portal Disabled</SelectItem>
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
            <Globe className="h-5 w-5" />
            Customer Portal Access ({filteredPortalAccess.length})
          </CardTitle>
          <CardDescription>
            Manage customer portal access, permissions, and login activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPortalAccess}
            searchKey="customerName"
            searchPlaceholder="Search customers..."
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Send Invitation Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Portal Invitation</DialogTitle>
            <DialogDescription>
              Send a portal access invitation to {invitationForm.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <Input value={invitationForm.customerName} disabled />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input value={invitationForm.customerEmail} disabled />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Invitation Message</Label>
              <Textarea
                id="message"
                value={invitationForm.message}
                onChange={(e) => setInvitationForm(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expirationDays">Invitation Expires (Days)</Label>
                <Select 
                  value={invitationForm.expirationDays.toString()} 
                  onValueChange={(value) => setInvitationForm(prev => ({ ...prev, expirationDays: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="0">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label htmlFor="includeSetupGuide">Include Setup Guide</Label>
                <Switch
                  id="includeSetupGuide"
                  checked={invitationForm.includeSetupGuide}
                  onCheckedChange={(checked) => setInvitationForm(prev => ({ ...prev, includeSetupGuide: checked }))}
                />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Portal Features</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
                <div>• View order history</div>
                <div>• Track shipments</div>
                <div>• Download invoices</div>
                <div>• Request quotes</div>
                <div>• Manage profile</div>
                <div>• Access analytics</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitationSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Portal Access Modal */}
      <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Portal Access</DialogTitle>
            <DialogDescription>
              Configure permissions and settings for {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="permissions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4">
              <div>
                <Label>Permission Groups (Quick Select)</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {permissionGroups.map((group) => (
                    <Button
                      key={group.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePermissionGroupSelect(group.id)}
                    >
                      {group.name}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Individual Permissions</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'view_orders', name: 'View Orders', description: 'View order history and details' },
                    { id: 'view_profile', name: 'View Profile', description: 'Access account information' },
                    { id: 'view_invoices', name: 'View Invoices', description: 'View and download invoices' },
                    { id: 'cancel_orders', name: 'Cancel Orders', description: 'Cancel pending orders' },
                    { id: 'request_quotes', name: 'Request Quotes', description: 'Submit quote requests' },
                    { id: 'download_files', name: 'Download Files', description: 'Download order documents' },
                    { id: 'bulk_orders', name: 'Bulk Orders', description: 'Place bulk orders via CSV' },
                    { id: 'analytics', name: 'Analytics', description: 'View order analytics dashboard' },
                    { id: 'api_access', name: 'API Access', description: 'Generate and use API keys' },
                  ].map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions(prev => [...prev, permission.id]);
                          } else {
                            setSelectedPermissions(prev => prev.filter(p => p !== permission.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor={permission.id} className="text-sm font-medium">
                          {permission.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="text-center text-muted-foreground">
                Portal settings configuration would be displayed here
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsManageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Portal Access Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Portal Access Details - {selectedCustomer?.customerName}
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedCustomer.loginCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Logins</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedCustomer.permissions.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Permissions</div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Label>Account Status</Label>
                <div className="mt-2">
                  <Badge variant={getStatusInfo(selectedCustomer.status).color as any}>
                    {getStatusInfo(selectedCustomer.status).label}
                  </Badge>
                </div>
              </div>

              <div>
                <Label>Current Permissions</Label>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {selectedCustomer.permissions.map(permission => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace('_', ' ').toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Account Created</Label>
                  <p>{new Date(selectedCustomer.accountCreatedDate).toLocaleDateString('id-ID')}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p>{selectedCustomer.lastLogin ? new Date(selectedCustomer.lastLogin).toLocaleDateString('id-ID') : 'Never'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}