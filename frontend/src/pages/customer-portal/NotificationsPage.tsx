import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerNotificationApi, CustomerNotification } from '@/services/api/customerNotificationApi';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DataTable,
  Input,
} from '@/components/ui/lazy-components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  Eye, 
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Search,
  AlertTriangle,
  Info,
  CheckCircle as CheckCircleIcon,
  ArrowUpDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, customer } = useCustomerAuth();
  
  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Fetch all notifications
  const { data: allNotifications, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-notifications', currentPage],
    queryFn: () => customerNotificationApi.getAll(currentPage, 20),
    enabled: isAuthenticated,
    retry: false, // Don't retry on 401
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (uuid: string) => customerNotificationApi.markAsRead(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
      toast.success('Notification marked as read');
    },
    onError: () => {
      toast.error('Failed to mark notification as read');
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => customerNotificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all notifications as read');
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (uuid: string) => customerNotificationApi.deleteNotification(uuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
      toast.success('Notification deleted');
    },
    onError: () => {
      toast.error('Failed to delete notification');
    },
  });

  /**
   * Handle refresh
   */
  const handleRefresh = () => {
    refetch();
    toast.success('Notifications refreshed');
  };

  /**
   * Handle export
   */
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    toast.info(`Exporting notifications as ${format.toUpperCase()}...`);
    // TODO: Implement export functionality
  };

  /**
   * Filter notifications based on search and priority
   */
  const filteredNotifications = useMemo(() => {
    const notifications = allNotifications?.data || [];
    
    let filtered = notifications;
    
    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((n: CustomerNotification) => n.priority === priorityFilter);
    }
    
    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((n: CustomerNotification) => 
        n.title?.toLowerCase().includes(searchLower) ||
        n.message?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [allNotifications, priorityFilter, search]);

  /**
   * Calculate stats from notifications
   */
  const stats = useMemo(() => {
    const notifications = allNotifications?.data || [];
    
    return {
      total: notifications.length,
      unread: notifications.filter((n: CustomerNotification) => !n.is_read).length,
      urgent: notifications.filter((n: CustomerNotification) => n.priority === 'urgent').length,
      high: notifications.filter((n: CustomerNotification) => n.priority === 'high').length,
    };
  }, [allNotifications]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="p-12 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please login to view your notifications
          </p>
          <Button onClick={() => navigate('/customer/login')} size="lg">
            Login
          </Button>
        </Card>
      </div>
    );
  }

  const handleNotificationClick = (notification: CustomerNotification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.uuid);
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'normal':
        return <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'low':
        return <CheckCircleIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getPriorityBadgeClass = (priority: string): string => {
    const variants: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return variants[priority] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      urgent: 'Urgent',
      high: 'High',
      normal: 'Normal',
      low: 'Low',
    };
    return labels[priority] || priority;
  };

  /**
   * Table columns definition
   */
  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const notification = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              {getPriorityIcon(notification.priority)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{notification.title}</span>
                {!notification.is_read && (
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {notification.message}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Priority
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string;
        return (
          <Badge className={getPriorityBadgeClass(priority)}>
            {getPriorityLabel(priority)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Time
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string;
        return (
          <div className="text-sm">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const notification = row.original;
        return (
          <div className="flex gap-2">
            {notification.action_text && notification.action_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNotificationClick(notification)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {notification.action_text}
              </Button>
            )}
            {!notification.is_read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  markAsReadMutation.mutate(notification.uuid);
                }}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteNotificationMutation.mutate(notification.uuid);
              }}
              title="Delete notification"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ], [markAsReadMutation, deleteNotificationMutation, handleNotificationClick, getPriorityIcon, getPriorityBadgeClass, getPriorityLabel]);

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            Welcome back, {customer?.name}
          </p>
        </div>
      </div>

      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 -mx-4 md:-mx-6 px-4 md:px-6 py-3 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh} 
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 md:mr-2", isLoading && "animate-spin")} />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          
          {/* Live Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="hidden md:inline text-xs text-gray-600 dark:text-gray-400">Live</span>
          </div>

          {/* Mark All as Read Button */}
          {stats.unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Mark All Read</span>
            </Button>
          )}

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                disabled={isLoading || filteredNotifications.length === 0}
              >
                <Download className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('json')}>
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards - 4 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className={cn(isLoading && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Notifications
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground mt-2">
              All notifications
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isLoading && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unread
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
              <Eye className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unread}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Awaiting your attention
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isLoading && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Urgent
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.urgent}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Requires immediate action
            </p>
          </CardContent>
        </Card>

        <Card className={cn(isLoading && "animate-pulse")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High Priority
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.high}</div>
            <p className="text-sm text-muted-foreground mt-2">
              Important notifications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Notifications</h3>
            </div>
            <p className="text-muted-foreground mb-4">{(error as any).message}</p>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {!error && (
        <Card>
          <CardContent className="p-6">
            <DataTable
              columns={columns}
              data={filteredNotifications}
              loading={isLoading}
              externalPagination={{
                pageIndex: currentPage - 1,
                pageSize: 20,
                pageCount: allNotifications?.last_page || 1,
                total: allNotifications?.total || 0,
                onPageChange: (page: number) => setCurrentPage(page + 1),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
            <p className="text-muted-foreground mb-4">
              {search || priorityFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'New notifications will appear here when you receive them'}
            </p>
            {(search || priorityFilter !== 'all') && (
              <Button
                onClick={() => {
                  setSearch('');
                  setPriorityFilter('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
