import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  Play,
  Square,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  XCircle,
  Pause,
  FastForward,
  FileText,
  Download as DownloadIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useProductionStore } from '@/stores/productionStore';
import { ProductionItem } from '@/services/tenant/productionService';
import { toast } from 'sonner';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  material_preparation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  quality_check: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  on_hold: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const qcStatusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  passed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  rework_required: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

export default function ProductionManagement() {
  const {
    // Data
    productionItems,
    selectedProductionItem,
    stats,
    dashboardSummary,
    overdueItems,
    
    // Loading states
    itemsLoading,
    itemLoading,
    statsLoading,
    dashboardLoading,
    bulkActionLoading,
    error,
    
    // Pagination & filters
    currentPage,
    totalPages,
    totalCount,
    perPage,
    filters,
    
    // Selection
    selectedItemIds,
    
    // Actions
    fetchProductionItems,
    fetchProductionStats,
    fetchDashboardSummary,
    fetchOverdueItems,
    updateFilters,
    resetFilters,
    setSelectedItemIds,
    toggleItemSelection,
    selectAllItems,
    clearItemSelection,
    startProduction,
    completeProduction,
    updateProgress,
    bulkUpdateProductionItems,
    setCurrentPage
  } = useProductionStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardSummary();
    fetchProductionStats();
    fetchProductionItems();
    fetchOverdueItems();
  }, []);

  useEffect(() => {
    if (currentPage > 1 || Object.keys(filters).some(key => filters[key as keyof typeof filters])) {
      fetchProductionItems();
    }
  }, [currentPage, filters]);

  const handleSearch = (value: string) => {
    updateFilters({ search: value, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({ 
      status: status === 'all' ? undefined : status as ProductionItem['status']
    });
  };

  const handlePriorityFilter = (priority: string) => {
    updateFilters({ 
      priority: priority === 'all' ? undefined : priority as ProductionItem['priority']
    });
  };

  const handleStartProduction = async (item: ProductionItem) => {
    try {
      await startProduction(item.id, {
        actual_start_date: new Date().toISOString(),
        notes: 'Production started from management interface'
      });
      toast.success('Production started successfully');
      fetchProductionItems();
    } catch (error) {
      toast.error('Failed to start production');
    }
  };

  const handleCompleteProduction = async (item: ProductionItem) => {
    try {
      await completeProduction(item.id, {
        actual_completion_date: new Date().toISOString(),
        quality_check_required: true,
        notes: 'Production completed from management interface'
      });
      toast.success('Production completed successfully');
      fetchProductionItems();
    } catch (error) {
      toast.error('Failed to complete production');
    }
  };

  const handleUpdateProgress = async (item: ProductionItem, progress: number) => {
    try {
      await updateProgress(item.id, {
        progress_percentage: progress,
        notes: `Progress updated to ${progress}%`
      });
      toast.success('Progress updated successfully');
      fetchProductionItems();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleBulkUpdate = async (updateData: any) => {
    try {
      const result = await bulkUpdateProductionItems(selectedItemIds, updateData);
      
      if (result.failed.length > 0) {
        toast.warning(`Updated ${result.success.length} items, ${result.failed.length} failed`);
      } else {
        toast.success(`Successfully updated ${result.success.length} production items`);
      }
      
      setShowBulkUpdateDialog(false);
      clearItemSelection();
      fetchProductionItems();
    } catch (error) {
      toast.error('Failed to update production items');
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Production Management</h1>
          <p className="text-muted-foreground">Monitor and manage production workflow</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Production Item
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="production">Production Items</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Production</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? '...' : dashboardSummary?.today?.scheduled || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardSummary?.today?.in_progress || 0} in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${stats?.completion_rate?.toFixed(1) || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Weekly average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${stats?.quality_pass_rate?.toFixed(1) || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  QC pass rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {overdueItems.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Distribution Chart */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Production Status Distribution</CardTitle>
                <CardDescription>Current status of all production items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.status_distribution?.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${statusColors[status.status]?.replace(/text-\w+-\d+/, 'border-0')}`} />
                        <span className="capitalize text-sm">{status.status.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{status.count}</span>
                        <span className="text-xs text-muted-foreground">({status.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Production Line Performance</CardTitle>
                <CardDescription>Efficiency and quality metrics by line</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.production_line_stats?.map((line) => (
                    <div key={line.line} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{line.line}</span>
                        <span className="text-xs text-muted-foreground">{line.items_completed} items</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Efficiency</span>
                          <span>{line.efficiency}%</span>
                        </div>
                        <Progress value={line.efficiency} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search production items..."
                      className="pl-8"
                      value={filters.search || ''}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={filters.status || 'all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="material_preparation">Material Prep</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="quality_check">Quality Check</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.priority || 'all'} onValueChange={handlePriorityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedItemIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItemIds.length} items selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBulkUpdateDialog(true)}
                      disabled={bulkActionLoading}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Bulk Update
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearItemSelection}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Production Items Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Production Items</CardTitle>
                  <CardDescription>
                    Showing {productionItems.length} of {totalCount} items
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={selectAllItems}>
                  Select All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItemIds.length === productionItems.length && productionItems.length > 0}
                            onCheckedChange={selectAllItems}
                          />
                        </TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>QC Status</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItemIds.includes(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{item.product_name}</div>
                              <div className="text-sm text-muted-foreground">
                                SKU: {item.product_sku} | Qty: {item.quantity} {item.unit_of_measure}
                              </div>
                              {item.batch_number && (
                                <div className="text-xs text-muted-foreground">
                                  Batch: {item.batch_number}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{item.order.order_code}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.order.customer_name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[item.status]}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item.progress_percentage}%</span>
                                <span className="text-muted-foreground">{item.current_stage}</span>
                              </div>
                              <Progress 
                                value={item.progress_percentage} 
                                className="w-24 h-2"
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={priorityColors[item.priority]}>
                              {item.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={qcStatusColors[item.qc_status]}>
                              {item.qc_status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div>Start: {item.scheduled_start_date ? new Date(item.scheduled_start_date).toLocaleDateString() : 'Not set'}</div>
                              <div>Due: {item.scheduled_completion_date ? new Date(item.scheduled_completion_date).toLocaleDateString() : 'Not set'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {item.status === 'scheduled' && (
                                  <DropdownMenuItem onClick={() => handleStartProduction(item)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Production
                                  </DropdownMenuItem>
                                )}
                                {item.status === 'in_progress' && (
                                  <DropdownMenuItem onClick={() => handleCompleteProduction(item)}>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Complete
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalCount)} of {totalCount} entries
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Schedule</CardTitle>
              <CardDescription>Plan and manage production schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Production Schedule</h3>
                <p className="text-muted-foreground">Schedule management interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Production Reports</CardTitle>
              <CardDescription>Generate and download production reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Production Reports</h3>
                <p className="text-muted-foreground">Report generation interface coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}