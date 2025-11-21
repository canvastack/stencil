import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from '@/components/ui/lazy-components';
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
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'sonner';
import type { ColumnDef } from '@tanstack/react-table';
import { quotesService } from '@/services/api/quotes';
import type { OrderQuote, QuoteFilters, QuoteStatus, QuoteType } from '@/types/quote';

interface QuoteManagementProps {}

const QuoteManagement: React.FC<QuoteManagementProps> = () => {
  const [searchParams] = useSearchParams();
  const [quotes, setQuotes] = useState<OrderQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<OrderQuote | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<QuoteFilters>({
    page: 1,
    per_page: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Initialize filters from URL parameters
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (orderId) {
      setFilters(prev => ({ ...prev, order_id: orderId }));
    }
  }, [searchParams]);

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
    try {
      await quotesService.acceptQuote(quote.id);
      toast.success('Quote accepted successfully');
      fetchQuotes();
    } catch (error) {
      toast.error('Failed to accept quote');
    }
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
            <Button>
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
      </div>
    </LazyWrapper>
  );
};

export default QuoteManagement;