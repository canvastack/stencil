import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/lazy-components';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Search,
  Plus,
  Edit,
  Eye,
  Check,
  X,
  MessageSquare,
  FileText,
  Filter,
  Download,
  Send,
  ArrowUpDown,
  Info,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { quotesService } from '@/services/api/quotes';
import { ordersService } from '@/services/api/orders';
import type { OrderQuote, QuoteFilters, QuoteStatus, QuoteType } from '@/types/quote';
import type { Order } from '@/types/order';
import { QuoteForm } from '@/components/tenant/quotes/QuoteForm';
import type { CreateQuoteRequest, UpdateQuoteRequest } from '@/services/tenant/quoteService';

interface QuoteManagementProps {}

const QuoteManagement: React.FC<QuoteManagementProps> = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<OrderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<OrderQuote | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [quoteToAccept, setQuoteToAccept] = useState<OrderQuote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderContext, setOrderContext] = useState<Order | null>(null);
  const [filters, setFilters] = useState<QuoteFilters>({
    page: 1,
    per_page: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Initialize filters from URL parameters and fetch order context
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    console.log('🔍 QuoteManagement useEffect triggered, order_id:', orderId);
    
    if (orderId) {
      console.log('✅ Order ID detected in URL:', orderId);
      
      // Apply order_id filter
      setFilters(prev => ({ ...prev, order_id: orderId }));
      
      // Fetch order details for context
      fetchOrderContext(orderId);
      
      // Auto-open quote form modal when coming from order page
      // Use setTimeout to ensure component is fully mounted and LazyWrapper is ready
      console.log('⏰ Scheduling auto-open of quote form modal in 300ms');
      const timer = setTimeout(() => {
        console.log('🚀 Opening quote form modal now');
        setIsFormDialogOpen(true);
      }, 300);
      
      // Cleanup timeout on unmount
      return () => {
        console.log('🧹 Cleaning up auto-open timer');
        clearTimeout(timer);
      };
    }
  }, [searchParams]);

  // Debug: Log when isFormDialogOpen changes
  useEffect(() => {
    console.log('📊 isFormDialogOpen state changed to:', isFormDialogOpen);
  }, [isFormDialogOpen]);

  const fetchOrderContext = async (orderId: string) => {
    try {
      const order = await ordersService.getOrderById(orderId);
      setOrderContext(order);
    } catch (error) {
      console.error('Error fetching order context:', error);
      toast.error('Failed to load order context');
    }
  };

  // Fetch quotes on component mount and filter changes
  useEffect(() => {
    fetchQuotes();
  }, [filters]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesService.getQuotes(filters);
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast.error('Failed to load quotes');
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({
      ...prev,
      search: query,
      page: 1
    }));
  };

  const handleAcceptQuote = async (quote: OrderQuote) => {
    // Open confirmation dialog instead of accepting immediately
    setQuoteToAccept(quote);
    setIsAcceptDialogOpen(true);
  };

  const confirmAcceptQuote = async () => {
    if (!quoteToAccept) return;
    
    try {
      await quotesService.acceptQuote(quoteToAccept.id);
      toast.success('Quote accepted successfully');
      setIsAcceptDialogOpen(false);
      setQuoteToAccept(null);
      fetchQuotes();
      
      // If in order context, refresh order details
      if (orderContext) {
        fetchOrderContext(orderContext.uuid);
      }
    } catch (error) {
      toast.error('Failed to accept quote');
    }
  };

  const handleCreateQuote = async (data: CreateQuoteRequest) => {
    try {
      await quotesService.createQuote(data);
      toast.success('Quote created successfully');
      setIsFormDialogOpen(false);
      fetchQuotes();
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
      throw error;
    }
  };

  const calculateQuotationAmount = (vendorPrice: number): number => {
    // Apply 35% markup (30% markup + 5% operational cost)
    return vendorPrice * 1.35;
  };

  const handleRejectQuote = async (quote: OrderQuote, reason: string) => {
    try {
      await quotesService.rejectQuote(quote.id, reason);
      toast.success('Quote rejected');
      fetchQuotes();
    } catch (error) {
      toast.error('Failed to reject quote');
    }
  };

  const handleViewDetails = (quote: OrderQuote) => {
    setSelectedQuote(quote);
    setIsDetailDialogOpen(true);
  };

  const getStatusBadgeColor = (status: QuoteStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'revised': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'expired': return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getTypeBadgeColor = (type: QuoteType) => {
    switch (type) {
      case 'vendor_to_company': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'company_to_customer': return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const columns: ColumnDef<OrderQuote>[] = [
    {
      id: 'order_number',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      accessorFn: (row) => row.order?.order_number || 'N/A',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.order?.order_number || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => (
        <Badge className={getTypeBadgeColor(row.original.type)}>
          {row.original.type === 'vendor_to_company' ? 'From Vendor' : 'To Customer'}
        </Badge>
      ),
    },
    {
      id: 'vendor_customer',
      header: 'Vendor/Customer',
      cell: ({ row }) => (
        <div>
          {row.original.type === 'vendor_to_company' ? (
            <div className="text-sm">
              <div className="font-medium">{row.original.vendor?.name || 'N/A'}</div>
              <div className="text-muted-foreground">{row.original.vendor?.email}</div>
            </div>
          ) : (
            <div className="text-sm">
              <div className="font-medium">{row.original.customer?.name || 'N/A'}</div>
              <div className="text-muted-foreground">{row.original.customer?.email}</div>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quoted_price',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{formatCurrency(row.original.quoted_price)}</div>
          <div className="text-xs text-muted-foreground">
            Qty: {row.original.quantity}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={getStatusBadgeColor(row.original.status)}>
          {row.original.status.toUpperCase()}
        </Badge>
      ),
    },
    {
      accessorKey: 'valid_until',
      header: 'Valid Until',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.valid_until ? formatDate(row.original.valid_until) : 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {row.original.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700"
                onClick={() => handleAcceptQuote(row.original)}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleRejectQuote(row.original, 'Rejected by admin')}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <LazyWrapper>
      <div className="space-y-6">
        {/* Order Context Banner */}
        {orderContext && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertTitle className="text-blue-900 dark:text-blue-100">Order Context</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-blue-800 dark:text-blue-200">
                Managing quotes for Order <span className="font-semibold">#{orderContext.orderNumber}</span>
                {orderContext.customerName && ` - ${orderContext.customerName}`}
              </span>
              <Button 
                variant="link" 
                onClick={() => navigate(`/admin/orders/${orderContext.uuid}`)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Quote Management</h1>
            <p className="text-muted-foreground">
              Manage vendor and customer quotations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button onClick={() => setIsFormDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Quotes</p>
                <p className="text-2xl font-bold">{quotes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {quotes.filter(q => q.status === 'pending').length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {quotes.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-lg font-bold">
                  {formatCurrency(quotes.reduce((sum, q) => sum + q.quoted_price, 0))}
                </p>
              </div>
              <Download className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Quotes Table */}
        <Card>
          <div className="p-6">
            <DataTable
              columns={columns}
              data={quotes}
              loading={loading}
            />
          </div>
        </Card>

        {/* Quote Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Quote Details</DialogTitle>
            </DialogHeader>
            
            {selectedQuote && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Order Number
                      </Label>
                      <p className="text-lg font-semibold">
                        {selectedQuote.order?.order_number || 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Quote Type
                      </Label>
                      <Badge className={getTypeBadgeColor(selectedQuote.type)}>
                        {selectedQuote.type === 'vendor_to_company' ? 'From Vendor' : 'To Customer'}
                      </Badge>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Status
                      </Label>
                      <Badge className={getStatusBadgeColor(selectedQuote.status)}>
                        {selectedQuote.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Quoted Price
                      </Label>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(selectedQuote.quoted_price)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Quantity
                      </Label>
                      <p className="text-lg">{selectedQuote.quantity}</p>
                    </div>
                    
                    {selectedQuote.markup_percentage && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">
                          Markup
                        </Label>
                        <p className="text-lg">{selectedQuote.markup_percentage}%</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedQuote.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Description
                    </Label>
                    <p className="mt-1 text-sm">{selectedQuote.description}</p>
                  </div>
                )}
                
                {selectedQuote.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Notes
                    </Label>
                    <p className="mt-1 text-sm">{selectedQuote.notes}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <strong>Created:</strong> {formatDate(selectedQuote.created_at)}
                  </div>
                  <div>
                    <strong>Updated:</strong> {formatDate(selectedQuote.updated_at)}
                  </div>
                  {selectedQuote.valid_until && (
                    <div>
                      <strong>Valid Until:</strong> {formatDate(selectedQuote.valid_until)}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <div className="flex gap-2">
                {selectedQuote?.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => selectedQuote && handleAcceptQuote(selectedQuote)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => selectedQuote && handleRejectQuote(selectedQuote, 'Rejected by admin')}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quote Acceptance Confirmation Dialog */}
        <AlertDialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Quote Acceptance</AlertDialogTitle>
              <AlertDialogDescription>
                Please review the quote details before accepting. This action will sync the vendor pricing to the order.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            {quoteToAccept && (
              <div className="space-y-4 py-4">
                {/* Vendor Information */}
                {quoteToAccept.type === 'vendor_to_company' && quoteToAccept.vendor && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Vendor Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendor Name:</span>
                        <span className="font-medium">{quoteToAccept.vendor.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact:</span>
                        <span className="font-medium">{quoteToAccept.vendor.email}</span>
                      </div>
                      {quoteToAccept.vendor.contact_person && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Contact Person:</span>
                          <span className="font-medium">{quoteToAccept.vendor.contact_person}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Information */}
                {quoteToAccept.order && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Order Information</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Order Number:</span>
                        <span className="font-medium">{quoteToAccept.order.order_number}</span>
                      </div>
                      {quoteToAccept.order.customer_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium">{quoteToAccept.order.customer_name}</span>
                        </div>
                      )}
                      {quoteToAccept.order.product_name && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Product:</span>
                          <span className="font-medium">{quoteToAccept.order.product_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing Information */}
                <div className="rounded-lg border p-4 bg-primary/5">
                  <h4 className="font-semibold mb-3">Pricing Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Vendor Quoted Price:</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(quoteToAccept.quoted_price)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-medium">{quoteToAccept.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="font-medium">{formatCurrency(quoteToAccept.unit_price)}</span>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Markup (35%):</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(calculateQuotationAmount(quoteToAccept.quoted_price) - quoteToAccept.quoted_price)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold">Customer Quotation Amount:</span>
                        <span className="text-2xl font-bold text-green-600">
                          {formatCurrency(calculateQuotationAmount(quoteToAccept.quoted_price))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                {quoteToAccept.terms_conditions && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {quoteToAccept.terms_conditions}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {quoteToAccept.notes && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {quoteToAccept.notes}
                    </p>
                  </div>
                )}

                {/* Validity Information */}
                {quoteToAccept.valid_until && (
                  <div className="rounded-lg border p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <div className="text-sm">
                        <span className="font-medium text-yellow-900 dark:text-yellow-100">Valid Until: </span>
                        <span className="text-yellow-800 dark:text-yellow-200">{formatDate(quoteToAccept.valid_until)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAcceptQuote} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
                Accept Quote
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Quote Form Dialog */}
        <Dialog 
          open={isFormDialogOpen} 
          onOpenChange={(open) => {
            console.log('📋 Quote Form Dialog onOpenChange:', open);
            setIsFormDialogOpen(open);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {orderContext ? `Create Quote for Order #${orderContext.orderNumber}` : 'Create New Quote'}
              </DialogTitle>
            </DialogHeader>
            <QuoteForm
              onSubmit={handleCreateQuote}
              onCancel={() => {
                console.log('❌ Quote Form cancelled');
                setIsFormDialogOpen(false);
              }}
              loading={false}
            />
          </DialogContent>
        </Dialog>
      </div>
    </LazyWrapper>
  );
};

export default QuoteManagement;