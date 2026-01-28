import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customersService } from '@/services/api/customers';
import type { Customer } from '@/services/api/customers';
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
  User, 
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currency';

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
}

const orderColumns: ColumnDef<CustomerOrder>[] = [
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

export default function CustomerDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [segment, setSegment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!uuid || uuid === 'new') {
        // Redirect to the proper create route if someone accesses /customers/new
        if (uuid === 'new') {
          navigate('/admin/customers/new');
        }
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch customer details
        const customerData = await customersService.getCustomerById(uuid);
        setCustomer(customerData);
        
        // Fetch customer orders
        setOrdersLoading(true);
        try {
          const ordersData = await customersService.getCustomerOrders(uuid);
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        } catch (ordersError) {
          console.error('Failed to fetch customer orders:', ordersError);
          setOrders([]);
        }
        
        // Fetch customer segment
        try {
          const segmentData = await customersService.getCustomerSegment(uuid);
          setSegment(segmentData);
        } catch (segmentError) {
          console.error('Failed to fetch customer segment:', segmentError);
          setSegment(null);
        }
        
      } catch (err) {
        console.error('Failed to fetch customer:', err);
        setError('Failed to load customer details');
        toast.error('Failed to load customer details');
      } finally {
        setLoading(false);
        setOrdersLoading(false);
      }
    };

    fetchCustomer();
  }, [uuid, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">Customer not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/customers')}>
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/admin/customers')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">
              {customer.type === 'business' ? 'Business Customer' : 'Individual Customer'}
            </p>
          </div>
        </div>
        <Link to={`/admin/customers/${customer.uuid}/edit`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Edit Customer
          </Button>
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant={
                customer.status === 'active' ? 'default' :
                customer.status === 'inactive' ? 'secondary' : 
                'destructive'
              }
              className="text-lg"
            >
              {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Unknown'}
            </Badge>
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
                {customer.total_orders || 0}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {formatCurrency(customer.lifetime_value || 0)}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {new Date(customer.created_at).toLocaleDateString()}
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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                  
                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{customer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {customer.company && (
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{customer.company}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Type</p>
                      <p className="font-medium">
                        {customer.type === 'business' ? 'Business' : 'Individual'}
                      </p>
                    </div>
                  </div>
                  
                  {(customer.city || customer.country) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">
                          {[customer.city, customer.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {segment && (
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Customer Segment</p>
                        <Badge variant="outline">{segment.name || 'Standard'}</Badge>
                      </div>
                    </div>
                  )}
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
                  No orders found for this customer
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Average Order Value:</span>
                    <span className="font-semibold">
                      {customer.total_orders && customer.lifetime_value ? 
                        formatCurrency(customer.lifetime_value / customer.total_orders) : 
                        formatCurrency(0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Spent:</span>
                    <span className="font-semibold">
                      {formatCurrency(customer.lifetime_value || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Orders:</span>
                    <span className="font-semibold">{customer.total_orders || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer ID:</span>
                    <span className="font-mono text-sm">{customer.uuid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration Date:</span>
                    <span className="font-semibold">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-semibold">
                      {new Date(customer.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {segment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Badge variant="outline" className="text-lg">
                        {segment.name || 'Standard'}
                      </Badge>
                    </div>
                    {segment.description && (
                      <p className="text-sm text-muted-foreground">
                        {segment.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}