import React, { useState, useEffect, useCallback } from 'react';
import { useShipping } from '@/hooks/useShipping';
import { shippingTrackingService, type ShipmentTracking, type ShippingTrackingFilters } from '@/services/api/shippingTracking';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  ArrowUpDown,
  Download,
  Upload,
  RefreshCw,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Navigation,
  Calendar,
  Phone,
  Mail,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';

interface TrackingFilters {
  search: string;
  status: string;
  carrier: string;
  dateFrom: string;
  dateTo: string;
}

const defaultFilters: TrackingFilters = {
  search: '',
  status: 'all',
  carrier: 'all',
  dateFrom: '',
  dateTo: '',
};

export default function ShippingTracking() {
  const [trackings, setTrackings] = useState<ShipmentTracking[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<ShipmentTracking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [filters, setFilters] = useState<TrackingFilters>(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tracking data from API
  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await shippingTrackingService.getShipmentTrackings({
          search: filters.search || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          carrier: filters.carrier !== 'all' ? filters.carrier : undefined,
          startDate: filters.dateFrom || undefined,
          endDate: filters.dateTo || undefined
        });
        
        setTrackings(response.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load shipping tracking data';
        setError(errorMessage);
        console.error('Shipping tracking fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrackingData();
  }, [filters]);

  // Mock data removed - now using real API data via shippingTrackingService

  // No need for additional filtering since API handles it via filters parameter
  const filteredTrackings = trackings;

  const handleViewTracking = (tracking: ShipmentTracking) => {
    setSelectedTracking(tracking);
    setIsViewModalOpen(true);
  };

  const handleRefreshTracking = async (trackingId?: string) => {
    setIsRefreshing(true);
    try {
      if (trackingId) {
        // Find tracking number for the specific ID
        const tracking = trackings.find(t => t.id === trackingId);
        if (tracking) {
          await shippingTrackingService.refreshTracking(tracking.trackingNumber);
          // Refresh data after updating
          const response = await shippingTrackingService.getShipmentTrackings({
            search: filters.search || undefined,
            status: filters.status !== 'all' ? filters.status : undefined,
            carrier: filters.carrier !== 'all' ? filters.carrier : undefined,
            startDate: filters.dateFrom || undefined,
            endDate: filters.dateTo || undefined
          });
          setTrackings(response.data);
          toast.success('Tracking updated');
        }
      } else {
        // Refresh all tracking data
        const response = await shippingTrackingService.getShipmentTrackings({
          search: filters.search || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          carrier: filters.carrier !== 'all' ? filters.carrier : undefined,
          startDate: filters.dateFrom || undefined,
          endDate: filters.dateTo || undefined
        });
        setTrackings(response.data);
        toast.success('All tracking data refreshed');
      }
    } catch (error) {
      toast.error('Failed to refresh tracking data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: ShipmentTracking['status']) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'outline' as const, icon: Clock },
      in_transit: { label: 'In Transit', variant: 'default' as const, icon: Truck },
      out_for_delivery: { label: 'Out for Delivery', variant: 'default' as const, icon: Navigation },
      delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-500' },
      exception: { label: 'Exception', variant: 'destructive' as const, icon: AlertTriangle },
      returned: { label: 'Returned', variant: 'secondary' as const, icon: XCircle },
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getDeliveryProgress = (status: ShipmentTracking['status']) => {
    const progressMap = {
      pending: 10,
      in_transit: 40,
      out_for_delivery: 80,
      delivered: 100,
      exception: 60,
      returned: 0,
    };
    return progressMap[status];
  };

  const copyTrackingNumber = (trackingNumber: string) => {
    navigator.clipboard.writeText(trackingNumber);
    toast.success('Tracking number copied to clipboard');
  };

  const columns: ColumnDef<ShipmentTracking>[] = [
    {
      accessorKey: 'trackingNumber',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Tracking Number
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const tracking = row.original;
        return (
          <div className="flex items-center gap-2">
            <div>
              <p className="font-medium">{tracking.trackingNumber}</p>
              <p className="text-xs text-muted-foreground">{tracking.orderNumber}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyTrackingNumber(tracking.trackingNumber)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const tracking = row.original;
        return (
          <div>
            <p className="font-medium">{tracking.customerName}</p>
            <p className="text-xs text-muted-foreground">{tracking.customerEmail}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'carrierName',
      header: 'Carrier',
      cell: ({ row }) => {
        const tracking = row.original;
        return (
          <div>
            <p className="font-medium">{tracking.carrierName}</p>
            <p className="text-xs text-muted-foreground">{tracking.shippingMethodName}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as ShipmentTracking['status'];
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'currentLocation',
      header: 'Current Location',
      cell: ({ row }) => {
        const location = row.getValue('currentLocation') as string;
        return (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">{location}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'estimatedDelivery',
      header: 'Est. Delivery',
      cell: ({ row }) => {
        const tracking = row.original;
        const estDelivery = new Date(tracking.estimatedDelivery);
        const isOverdue = new Date() > estDelivery && tracking.status !== 'delivered';
        return (
          <div className={isOverdue ? 'text-red-600' : ''}>
            <p className="text-sm">{estDelivery.toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">{estDelivery.toLocaleTimeString()}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'progress',
      header: 'Progress',
      cell: ({ row }) => {
        const tracking = row.original;
        const progress = getDeliveryProgress(tracking.status);
        return (
          <div className="w-full">
            <Progress value={progress} className="w-full h-2" />
            <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const tracking = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleViewTracking(tracking)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleRefreshTracking(tracking.id)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Tracking
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => copyTrackingNumber(tracking.trackingNumber)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Tracking Number
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
          <h1 className="text-3xl font-bold tracking-tight">Shipping Tracking</h1>
          <p className="text-muted-foreground">
            Monitor and track all shipment deliveries in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleRefreshTracking()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trackings.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackings.filter(t => t.status === 'in_transit').length}
            </div>
            <p className="text-xs text-muted-foreground">
              On the way
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out for Delivery</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackings.filter(t => t.status === 'out_for_delivery').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Final mile
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackings.filter(t => t.status === 'delivered').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trackings.filter(t => t.status === 'exception').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
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
                  placeholder="Search by tracking number, order, or customer..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="exception">Exception</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={filters.carrier} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, carrier: value }))}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Carriers</SelectItem>
                <SelectItem value="JNE">JNE Express</SelectItem>
                <SelectItem value="SICEPAT">SiCepat Express</SelectItem>
                <SelectItem value="POSINDO">Pos Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredTrackings}
        searchKey="trackingNumber"
      />

      {/* View Tracking Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              Tracking Details: {selectedTracking?.trackingNumber}
              {selectedTracking && getStatusBadge(selectedTracking.status)}
            </DialogTitle>
            <DialogDescription>
              Detailed tracking information and delivery timeline
            </DialogDescription>
          </DialogHeader>

          {selectedTracking && (
            <div className="space-y-6">
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Delivery Progress</h3>
                      <span className="text-sm text-muted-foreground">
                        {getDeliveryProgress(selectedTracking.status)}% Complete
                      </span>
                    </div>
                    <Progress value={getDeliveryProgress(selectedTracking.status)} className="w-full" />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Tracking Events</h3>
                    <div className="space-y-3">
                      {selectedTracking.trackingEvents
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((event, index) => (
                        <div key={event.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                          <div className="flex flex-col items-center">
                            {event.isDelivered ? (
                              <CheckCircle className="h-6 w-6 text-green-500 fill-current" />
                            ) : event.isException ? (
                              <AlertTriangle className="h-6 w-6 text-red-500 fill-current" />
                            ) : (
                              <Clock className="h-6 w-6 text-blue-500 fill-current" />
                            )}
                            {index < selectedTracking.trackingEvents.length - 1 && (
                              <div className="w-px h-8 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">{event.description}</h4>
                              <Badge variant="outline">
                                {new Date(event.timestamp).toLocaleString()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                              {event.facilityName && (
                                <div>• {event.facilityName}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Shipment Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Order Number:</span> {selectedTracking.orderNumber}</div>
                        <div><span className="text-muted-foreground">Carrier:</span> {selectedTracking.carrierName}</div>
                        <div><span className="text-muted-foreground">Service:</span> {selectedTracking.shippingMethodName}</div>
                        <div><span className="text-muted-foreground">Ship Date:</span> {new Date(selectedTracking.shipmentDate).toLocaleString()}</div>
                        <div><span className="text-muted-foreground">Est. Delivery:</span> {new Date(selectedTracking.estimatedDelivery).toLocaleString()}</div>
                        {selectedTracking.actualDelivery && (
                          <div><span className="text-muted-foreground">Actual Delivery:</span> {new Date(selectedTracking.actualDelivery).toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Package Information</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Weight:</span> {selectedTracking.package.weight} kg</div>
                        <div><span className="text-muted-foreground">Dimensions:</span> {selectedTracking.package.dimensions.length} × {selectedTracking.package.dimensions.width} × {selectedTracking.package.dimensions.height} cm</div>
                        <div><span className="text-muted-foreground">Value:</span> Rp {selectedTracking.package.value.toLocaleString()}</div>
                        <div><span className="text-muted-foreground">Description:</span> {selectedTracking.package.description}</div>
                        {selectedTracking.isInsured && (
                          <div><span className="text-muted-foreground">Insurance:</span> Rp {selectedTracking.insuranceValue.toLocaleString()}</div>
                        )}
                        {selectedTracking.codAmount && (
                          <div><span className="text-muted-foreground">COD Amount:</span> Rp {selectedTracking.codAmount.toLocaleString()}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-3">Origin</h3>
                      <div className="text-sm">
                        <p>{selectedTracking.origin.address}</p>
                        <p>{selectedTracking.origin.city}, {selectedTracking.origin.province}</p>
                        <p>{selectedTracking.origin.postalCode}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-3">Destination</h3>
                      <div className="text-sm">
                        <p>{selectedTracking.destination.address}</p>
                        <p>{selectedTracking.destination.city}, {selectedTracking.destination.province}</p>
                        <p>{selectedTracking.destination.postalCode}</p>
                      </div>
                    </div>
                  </div>

                  {selectedTracking.specialInstructions && (
                    <div>
                      <h3 className="font-semibold mb-3">Special Instructions</h3>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">
                        {selectedTracking.specialInstructions}
                      </p>
                    </div>
                  )}

                  {selectedTracking.deliveredTo && (
                    <div>
                      <h3 className="font-semibold mb-3">Delivery Confirmation</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-muted-foreground">Delivered To:</span> {selectedTracking.deliveredTo}</div>
                        <div><span className="text-muted-foreground">Proof of Delivery:</span> {selectedTracking.proofOfDelivery}</div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Customer Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <Mail className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                          </div>
                          <div>
                            <p className="font-medium">{selectedTracking.customerName}</p>
                            <p className="text-sm text-muted-foreground">{selectedTracking.customerEmail}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Phone className="h-4 w-4 text-green-600 dark:text-green-300" />
                          </div>
                          <div>
                            <p className="font-medium">Phone</p>
                            <p className="text-sm text-muted-foreground">{selectedTracking.customerPhone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium mb-1">Delivery Attempts</p>
                          <p className="text-sm text-muted-foreground">{selectedTracking.deliveryAttempts} attempt(s)</p>
                        </div>
                        
                        <div>
                          <p className="font-medium mb-1">Signature Required</p>
                          <Badge variant={selectedTracking.signatureRequired ? 'default' : 'outline'}>
                            {selectedTracking.signatureRequired ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Quick Actions</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="mr-2 h-4 w-4" />
                        Call Customer
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => copyTrackingNumber(selectedTracking.trackingNumber)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Tracking
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            {selectedTracking && (
              <Button onClick={() => handleRefreshTracking(selectedTracking.id)} disabled={isRefreshing}>
                {isRefreshing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Refresh Tracking
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}