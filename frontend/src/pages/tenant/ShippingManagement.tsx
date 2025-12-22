import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  FileText,
  Calendar,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useShippingStore } from '@/stores/shippingStore';
import { Shipment } from '@/services/tenant/shippingService';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';

const statusColors = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  picked_up: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  in_transit: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  out_for_delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  exception: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  returned: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const serviceTypeColors = {
  standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  express: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  overnight: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  same_day: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  economy: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

export default function ShippingManagement() {
  const {
    // Data
    shipments,
    selectedShipment,
    shippingMethods,
    stats,
    dashboardSummary,
    
    // Loading states
    shipmentsLoading,
    shipmentLoading,
    methodsLoading,
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
    selectedShipmentIds,
    
    // Actions
    fetchShipments,
    fetchShippingMethods,
    fetchShippingStats,
    fetchDashboardSummary,
    createShipment,
    updateShipment,
    cancelShipment,
    processShipment,
    updateFilters,
    resetFilters,
    setSelectedShipmentIds,
    toggleShipmentSelection,
    selectAllShipments,
    clearShipmentSelection,
    bulkUpdateShipments,
    setCurrentPage
  } = useShippingStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardSummary();
    fetchShippingStats();
    fetchShipments();
    fetchShippingMethods();
  }, []);

  useEffect(() => {
    if (currentPage > 1 || Object.keys(filters).some(key => filters[key as keyof typeof filters])) {
      fetchShipments();
    }
  }, [currentPage, filters]);

  const handleSearch = (value: string) => {
    updateFilters({ search: value, page: 1 });
  };

  const handleStatusFilter = (status: string) => {
    updateFilters({ 
      status: status === 'all' ? undefined : status as Shipment['status']
    });
  };

  const handleCarrierFilter = (carrier: string) => {
    updateFilters({ 
      carrier: carrier === 'all' ? undefined : carrier
    });
  };

  const handleProcessShipment = async (shipment: Shipment) => {
    try {
      await processShipment(shipment.id);
      toast.success('Shipment processed successfully');
      fetchShipments();
    } catch (error) {
      toast.error('Failed to process shipment');
    }
  };

  const handleCancelShipment = async (shipment: Shipment) => {
    try {
      await cancelShipment(shipment.id, 'Cancelled by user');
      toast.success('Shipment cancelled successfully');
      fetchShipments();
    } catch (error) {
      toast.error('Failed to cancel shipment');
    }
  };

  const handleBulkUpdate = async (updateData: any) => {
    try {
      const result = await bulkUpdateShipments(selectedShipmentIds, updateData);
      
      if (result.failed.length > 0) {
        toast.warning(`Updated ${result.success.length} shipments, ${result.failed.length} failed`);
      } else {
        toast.success(`Successfully updated ${result.success.length} shipments`);
      }
      
      setShowBulkUpdateDialog(false);
      clearShipmentSelection();
      fetchShipments();
    } catch (error) {
      toast.error('Failed to update shipments');
    }
  };

  const getDeliveryStatus = (shipment: Shipment) => {
    if (shipment.status === 'delivered') return 'on_time';
    if (!shipment.estimated_delivery) return 'unknown';
    
    const now = new Date();
    const estimated = new Date(shipment.estimated_delivery);
    
    if (now > estimated && shipment.status !== 'delivered') return 'overdue';
    if (estimated.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'due_soon';
    return 'on_track';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Management</h1>
          <p className="text-muted-foreground">Manage shipments and delivery tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Shipment
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
          <TabsTrigger value="shipments">Shipments</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Shipments</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? '...' : dashboardSummary?.today?.shipments_created || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardSummary?.today?.shipments_shipped || 0} shipped
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${stats?.on_time_delivery_rate?.toFixed(1) || 0}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  On-time delivery
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : `${Math.round((stats?.average_delivery_time || 0) / 24)}d`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average delivery
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shipping Costs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardLoading ? '...' : formatCurrency(dashboardSummary?.today?.total_shipping_cost || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Today's total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Carrier Performance and Service Types */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Carrier Performance</CardTitle>
                <CardDescription>Delivery performance by carrier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.carrier_stats?.map((carrier) => (
                    <div key={carrier.carrier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{carrier.carrier}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{carrier.on_time_rate.toFixed(1)}%</span>
                          <span className="text-xs text-muted-foreground">({carrier.shipments_count} shipments)</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Progress value={carrier.on_time_rate} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Avg Cost: {formatCurrency(carrier.average_cost)}</span>
                          <span>Exception: {carrier.exception_rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Type Distribution</CardTitle>
                <CardDescription>Shipments by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.service_type_distribution?.map((service) => (
                    <div key={service.service_type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${serviceTypeColors[service.service_type as keyof typeof serviceTypeColors]?.replace(/text-\w+-\d+/, 'border-0')}`} />
                        <span className="capitalize text-sm">{service.service_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{service.count}</span>
                        <span className="text-xs text-muted-foreground">({service.percentage.toFixed(1)}%)</span>
                        <span className="text-xs text-muted-foreground">{formatCurrency(service.average_cost)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Destinations */}
          <Card>
            <CardHeader>
              <CardTitle>Top Destinations</CardTitle>
              <CardDescription>Most frequent shipping destinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {stats?.top_destinations?.slice(0, 6).map((destination, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{destination.city}, {destination.state}</p>
                        <p className="text-xs text-muted-foreground">{destination.country}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{destination.shipments_count}</p>
                      <p className="text-xs text-muted-foreground">{destination.average_delivery_time.toFixed(1)}h avg</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shipments by tracking number, order, customer..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="exception">Exception</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.carrier || 'all'} onValueChange={handleCarrierFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carriers</SelectItem>
                    <SelectItem value="JNE">JNE</SelectItem>
                    <SelectItem value="SiCepat">SiCepat</SelectItem>
                    <SelectItem value="Pos Indonesia">Pos Indonesia</SelectItem>
                    <SelectItem value="J&T Express">J&T Express</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={resetFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedShipmentIds.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedShipmentIds.length} shipment(s) selected
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowBulkUpdateDialog(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Bulk Update
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearShipmentSelection}>
                      <X className="w-4 h-4 mr-2" />
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shipments Table */}
          <Card>
            <CardContent className="pt-6">
              {shipmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedShipmentIds.length === shipments.length && shipments.length > 0}
                            onChange={() => selectedShipmentIds.length === shipments.length ? clearShipmentSelection() : selectAllShipments()}
                            className="rounded"
                          />
                        </TableHead>
                        <TableHead>Tracking</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Carrier</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>ETA</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipments.map((shipment) => (
                        <TableRow key={shipment.id} className="hover:bg-muted/50">
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedShipmentIds.includes(shipment.id)}
                              onChange={() => toggleShipmentSelection(shipment.id)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-sm">
                              {shipment.tracking_number || 'Not assigned'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {shipment.shipment_uuid}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{shipment.order_code}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(shipment.order.order_date).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{shipment.customer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {shipment.customer_email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{shipment.carrier}</div>
                            <Badge variant="outline" className={serviceTypeColors[shipment.service_type]}>
                              {shipment.service_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[shipment.status]}>
                              {shipment.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <div className="font-medium">{shipment.destination_address.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {shipment.destination_address.city}, {shipment.destination_address.state_province}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{formatCurrency(shipment.total_cost)}</span>
                          </TableCell>
                          <TableCell>
                            {shipment.estimated_delivery ? (
                              <div className="text-sm">
                                <div>{new Date(shipment.estimated_delivery).toLocaleDateString()}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(shipment.estimated_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleProcessShipment(shipment)}>
                                  <Truck className="w-4 h-4 mr-2" />
                                  Process Shipment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleCancelShipment(shipment)}
                                  className="text-destructive"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Shipment
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
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          {/* Tracking dashboard coming soon */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking Dashboard</CardTitle>
              <CardDescription>Real-time shipment tracking and monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tracking Dashboard Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Real-time tracking, route monitoring, and delivery notifications will be available here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Reports dashboard coming soon */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Reports</CardTitle>
              <CardDescription>Analytics and reporting for shipping operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Reports Dashboard Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Detailed shipping analytics, cost analysis, and performance reports will be available here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}