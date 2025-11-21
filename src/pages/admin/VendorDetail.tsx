import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { vendorsService } from '@/services/api/vendors';
import type { Vendor } from '@/services/api/vendors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Star,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
  Award,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';

interface VendorOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
}

interface VendorEvaluation {
  id: string;
  rating: number;
  quality_score: number;
  delivery_score: number;
  service_score: number;
  comment: string;
  created_at: string;
}

interface VendorSpecialization {
  id: string;
  name: string;
  category: string;
  experience_years: number;
  certification: string;
}

const orderColumns: ColumnDef<VendorOrder>[] = [
  {
    accessorKey: 'order_number',
    header: 'Order Number',
    cell: ({ row }) => (
      <Link 
        to={`/admin/orders/${row.original.id}`}
        className="font-mono text-blue-600 hover:text-blue-800"
      >
        {row.getValue('order_number')}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant = 
        status === 'completed' ? 'default' :
        status === 'pending' ? 'secondary' :
        status === 'cancelled' ? 'destructive' : 'outline';
      
      return (
        <Badge variant={variant as any}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => {
      const total = row.getValue('total') as number;
      return <span className="font-semibold">{formatCurrency(total)}</span>;
    },
  },
  {
    accessorKey: 'items_count',
    header: 'Items',
    cell: ({ row }) => {
      const count = row.getValue('items_count') as number;
      return <span>{count} item{count !== 1 ? 's' : ''}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at') as string);
      return <span>{date.toLocaleDateString()}</span>;
    },
  },
];

const specializationColumns: ColumnDef<VendorSpecialization>[] = [
  {
    accessorKey: 'name',
    header: 'Service/Product',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.getValue('name')}</p>
        <p className="text-sm text-muted-foreground">{row.original.category}</p>
      </div>
    ),
  },
  {
    accessorKey: 'experience_years',
    header: 'Experience',
    cell: ({ row }) => {
      const years = row.getValue('experience_years') as number;
      return <span>{years} year{years !== 1 ? 's' : ''}</span>;
    },
  },
  {
    accessorKey: 'certification',
    header: 'Certification',
    cell: ({ row }) => {
      const cert = row.getValue('certification') as string;
      return cert ? <Badge variant="outline">{cert}</Badge> : <span className="text-muted-foreground">None</span>;
    },
  },
];

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [evaluations, setEvaluations] = useState<VendorEvaluation[]>([]);
  const [specializations, setSpecializations] = useState<VendorSpecialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch vendor details
        const vendorData = await vendorsService.getVendorById(id);
        setVendor(vendorData);
        
        // Fetch vendor orders
        setOrdersLoading(true);
        try {
          const ordersData = await vendorsService.getVendorOrders(id);
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        } catch (ordersError) {
          console.error('Failed to fetch vendor orders:', ordersError);
          setOrders([]);
        }
        
        // Fetch vendor evaluations
        try {
          const evaluationsData = await vendorsService.getVendorEvaluations(id);
          setEvaluations(Array.isArray(evaluationsData) ? evaluationsData : []);
        } catch (evalError) {
          console.error('Failed to fetch vendor evaluations:', evalError);
          setEvaluations([]);
        }
        
        // Fetch vendor specializations
        try {
          const specializationsData = await vendorsService.getVendorSpecializations(id);
          setSpecializations(Array.isArray(specializationsData) ? specializationsData : []);
        } catch (specError) {
          console.error('Failed to fetch vendor specializations:', specError);
          setSpecializations([]);
        }
        
      } catch (err) {
        console.error('Failed to fetch vendor:', err);
        setError('Failed to load vendor details');
        toast.error('Failed to load vendor details');
      } finally {
        setLoading(false);
        setOrdersLoading(false);
      }
    };

    fetchVendor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">Vendor not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/vendors')}>
          Back to Vendors
        </Button>
      </div>
    );
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const averageEvaluation = evaluations.length > 0 
    ? evaluations.reduce((acc, evaluation) => acc + evaluation.rating, 0) / evaluations.length
    : vendor.rating || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin/vendors')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{vendor.name}</h1>
            <p className="text-muted-foreground">
              Vendor Code: {vendor.code || vendor.id}
            </p>
          </div>
        </div>
        <Link to={`/admin/vendors/${vendor.id}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Vendor
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={
                vendor.status === 'active' ? 'default' :
                vendor.status === 'inactive' ? 'secondary' : 
                'destructive'
              }
              className="text-lg"
            >
              {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderStarRating(averageEvaluation)}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {vendor.total_orders || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {(vendor.completion_rate || 0).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {new Date(vendor.created_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Contact Information</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
          <TabsTrigger value="evaluations">Performance</TabsTrigger>
          <TabsTrigger value="specializations">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{vendor.email}</p>
                    </div>
                  </div>
                  
                  {vendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{vendor.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{vendor.company}</p>
                      </div>
                    </div>
                  )}
                  
                  {vendor.bank_account && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Bank Account</p>
                        <p className="font-mono font-medium">{vendor.bank_account}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {(vendor.city || vendor.country) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {[vendor.city, vendor.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <div className="space-y-1">
                        {renderStarRating(averageEvaluation)}
                        <p className="text-xs text-muted-foreground">
                          Based on {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Services Offered</p>
                      <p className="font-medium">{specializations.length} service{specializations.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order History ({orders.length} orders)</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading orders...</span>
                </div>
              ) : orders.length > 0 ? (
                <DataTable
                  columns={orderColumns}
                  data={orders}
                  searchPlaceholder="Search orders..."
                  searchKey="order_number"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No orders found for this vendor
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Overall Rating:</span>
                    <div>{renderStarRating(averageEvaluation)}</div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="font-semibold">{vendor.total_orders || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion Rate:</span>
                    <span className="font-semibold">{(vendor.completion_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Evaluations:</span>
                    <span className="font-semibold">{evaluations.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                {evaluations.length > 0 ? (
                  <div className="space-y-4">
                    {evaluations.slice(0, 3).map((evaluation, index) => (
                      <div key={evaluation.id || index} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          {renderStarRating(evaluation.rating)}
                          <span className="text-sm text-muted-foreground">
                            {new Date(evaluation.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {evaluation.comment && (
                          <p className="text-sm text-muted-foreground italic">
                            "{evaluation.comment}"
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                          <span>Quality: {evaluation.quality_score}/5</span>
                          <span>Delivery: {evaluation.delivery_score}/5</span>
                          <span>Service: {evaluation.service_score}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No evaluations available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="specializations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Services & Specializations</CardTitle>
            </CardHeader>
            <CardContent>
              {specializations.length > 0 ? (
                <DataTable
                  columns={specializationColumns}
                  data={specializations}
                  searchPlaceholder="Search services..."
                  searchKey="name"
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No specializations recorded for this vendor
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}