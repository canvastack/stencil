/**
 * Quote Detail Page - Admin View
 * Clean design with tab system for Status History and Messages
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { quoteService } from '@/services/tenant/quoteService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Send,
  FileText,
  Trash2,
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Edit,
  Home,
  Loader2,
  Building2,
  Mail,
  Package,
  RefreshCw,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { QuoteItemSpecificationsDisplay } from '@/components/tenant/quotes/QuoteItemSpecifications';
import { formatCurrency } from '@/utils/currency';

export function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch quote data
  const { data: quote, isLoading, error, refetch } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const result = await quoteService.getQuote(id!);
      console.log('[QuoteDetail] Quote data received:', result);
      return result;
    },
    enabled: !!id,
  });

  // Mock messages data
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: { name: string; role: 'admin' | 'vendor' };
    message: string;
    timestamp: string;
    read: boolean;
  }>>([
    {
      id: '1',
      sender: { name: 'Admin User', role: 'admin' },
      message: 'Quote has been sent to vendor for review.',
      timestamp: new Date().toISOString(),
      read: true,
    },
  ]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return { message };
    },
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: { name: 'Admin User', role: 'admin' },
          message: data.message,
          timestamp: new Date().toISOString(),
          read: true,
        },
      ]);
      setMessageText('');
      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });
    },
  });

  // Handle send message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  // Handle send to vendor
  const handleSendToVendor = async () => {
    if (!id) return;
    setIsSending(true);
    try {
      await quoteService.sendQuote(id);
      toast({
        title: 'Success',
        description: 'Quote sent to vendor successfully',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send quote to vendor',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle delete quote
  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this quote?')) return;
    setIsDeleting(true);
    try {
      await quoteService.deleteQuote(id);
      toast({
        title: 'Success',
        description: 'Quote deleted successfully',
      });
      navigate('/admin/quotes');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete quote',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle generate PDF
  const handleGeneratePDF = async () => {
    if (!id) return;
    try {
      const blob = await quoteService.generatePDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote?.quote_number || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Success',
        description: 'PDF generated successfully',
      });
    } catch (error: any) {
      console.error('[QuoteDetail] PDF generation error:', error);
      
      // Check if it's a "not implemented" error
      if (error.response?.status === 501 || error.response?.data?.message?.includes('not yet implemented')) {
        toast({
          title: 'Feature Not Available',
          description: 'PDF generation is not yet implemented. Please contact support.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to generate PDF',
          variant: 'destructive',
        });
      }
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    type StatusConfig = { label: string; className: string; icon: any };
    const statusConfig: Record<string, StatusConfig> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: FileText },
      open: { label: 'Open', className: 'bg-blue-100 text-blue-800', icon: FileText },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800', icon: Send },
      countered: { label: 'Countered', className: 'bg-orange-100 text-orange-800', icon: RefreshCw },
      accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800', icon: XCircle },
      expired: { label: 'Expired', className: 'bg-gray-100 text-gray-600', icon: Clock },
    };
    const defaultConfig: StatusConfig = { label: 'Draft', className: 'bg-gray-100 text-gray-800', icon: FileText };
    const config: StatusConfig = statusConfig[status] ?? defaultConfig;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Format status history
  const formatStatusHistory = () => {
    if (!quote?.history || quote.history.length === 0) {
      return [
        {
          action: 'Quote created',
          timestamp: quote?.created_at || new Date().toISOString(),
          user_name: quote?.created_by || 'System',
          notes: null,
        },
      ];
    }
    return quote.history;
  };

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-8 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-8 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-muted animate-pulse rounded" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Header Card Skeleton */}
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-4 w-40 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-40 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 pt-4 border-t">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>

        {/* Actions Skeleton */}
        <div className="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-32 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !quote) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Quote Details</h1>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Quote</h2>
          <p className="text-muted-foreground mb-6">
            {error ? 'Failed to load quote' : 'Quote not found'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/admin/quotes')}>
              Back to Quotes
            </Button>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Determine available actions
  const canEdit = quote.status === 'draft';
  const canSendToVendor = quote.status === 'draft' || quote.status === 'open';
  const canDelete = quote.status === 'draft';
  const isReadOnly = ['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status);
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span>/</span>
        <Link to="/admin/quotes" className="hover:text-foreground transition-colors">
          Quotes
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{quote.quote_number}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/quotes')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Quote Details
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage quote {quote.quote_number}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/quotes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quotes
        </Button>
      </div>

      {/* Expired Warning */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote expired on {new Date(quote.valid_until).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} and can no longer be modified.
          </AlertDescription>
        </Alert>
      )}

      {/* Read-Only Notice */}
      {isReadOnly && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>This quote is read-only.</strong>
            {' '}
            {quote.status === 'accepted' && 'This quote has been accepted.'}
            {quote.status === 'rejected' && 'This quote has been rejected.'}
            {quote.status === 'expired' && 'This quote has expired.'}
            {quote.status === 'cancelled' && 'This quote has been cancelled.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Card */}
      <Card>
        <CardHeader className="space-y-4">
          {/* Top Row: Quote Number, Status, Validity Period */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{quote.quote_number}</CardTitle>
                {getStatusBadge(quote.status)}
                {isReadOnly && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Read-Only
                  </Badge>
                )}
              </div>
              <CardDescription>
                Created on {format(new Date(quote.created_at), 'PPP')}
              </CardDescription>
            </div>
            <div className="text-left md:text-right">
              <p className="text-sm text-muted-foreground mb-2 flex items-center justify-end gap-1">
                <Calendar className="w-4 h-4" />
                Validity Period
              </p>
              <div className="flex items-center gap-1.5 justify-end">
                
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center justify-end gap-1">
                    <Clock className="w-4 h-4" /> Valid Until:
                  </p>
                  <p className="font-semibold">
                    {format(new Date(quote.valid_until), 'MMMM do, yyyy')}
                  </p>
                  {isExpired && (
                    <Badge variant="destructive" className="mt-1">Expired</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Exchange Rate, Total Profit, Total Amount */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            {/* Exchange Rate - Left */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Exchange Rate</p>
              <p className="text-base font-semibold">
                1 USD = Rp 16,773
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Exchange rate: 1 USD = Rp 16,773
              </p>
            </div>

            {/* Total Profit - Center */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Profit</p>
              {(() => {
                const totalProfit = quote.items?.reduce((sum, item) => {
                  const qty = item.quantity || 0;
                  const unit = item.unit_price || 0;
                  const vendor = item.vendor_cost || 0;
                  return sum + ((unit - vendor) * qty);
                }, 0) || 0;
                const totalVendorCost = quote.items?.reduce((sum, item) => 
                  sum + ((item.vendor_cost || 0) * (item.quantity || 0)), 0
                ) || 0;
                const profitMargin = totalVendorCost > 0 ? (totalProfit / totalVendorCost) * 100 : 0;
                const USD_RATE = 16773;
                const usdProfit = totalProfit / USD_RATE;
                const isPositive = totalProfit > 0;

                return (
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(totalProfit, quote.currency)}
                      </p>
                      {isPositive && (
                        <span className="text-green-600 text-xl">↗</span>
                      )}
                    </div>
                    {totalProfit > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground mt-1">
                          ≈ ${usdProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <span>↗</span>
                          {profitMargin.toFixed(1)}% margin
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Total Amount - Right */}
            <div className="text-left md:text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-orange-600">
                {(() => {
                  const total = quote.grand_total && quote.grand_total > 0 
                    ? quote.grand_total 
                    : quote.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
                  return total > 0 ? formatCurrency(total, quote.currency) : (
                    <span className="text-base text-muted-foreground font-normal">Not calculated</span>
                  );
                })()}
              </p>
              {(() => {
                const total = quote.grand_total && quote.grand_total > 0 
                  ? quote.grand_total 
                  : quote.items?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
                const USD_RATE = 16773; // Should come from exchange rate system
                const usdAmount = total / USD_RATE;
                return total > 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    ≈ ${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                ) : null;
              })()}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Actions Card - Sticky Header Style */}
      {!isReadOnly && (
        <div className="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold">Actions</h3>
              <p className="text-sm text-muted-foreground">Available actions for this quote</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/quotes/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Quote
              </Button>
            )}
            {canSendToVendor && (
              <Button 
                size="sm"
                onClick={handleSendToVendor} 
                disabled={isSending}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send to Vendor'}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleGeneratePDF}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate PDF
            </Button>
            {canDelete && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDelete} 
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Quote'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">
            <FileText className="w-4 h-4 mr-2" />
            Quote Details
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            Status History
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Quote Details */}
        <TabsContent value="details" className="space-y-6">
          {/* Quote Information & Order Information - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quote Information - Left */}
            {(quote.title || quote.description) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Quote Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quote.title && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Title</p>
                      <p className="text-base">{quote.title}</p>
                    </div>
                  )}
                  {quote.description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                      <p className="text-base text-muted-foreground">{quote.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Order Information - Right */}
            {quote.order_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Order Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Related Order</p>
                        <p className="font-medium">Order #{quote.order_id}</p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/admin/orders/${quote.order_id}`}>
                          View Order
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Customer & Vendor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{quote.customer.name}</p>
                </div>
                {quote.customer.company && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Company</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <p>{quote.customer.company}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${quote.customer.email}`} className="text-primary hover:underline">
                      {quote.customer.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium">{quote.vendor.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Company</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <p>{quote.vendor.company}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${quote.vendor.email}`} className="text-primary hover:underline">
                      {quote.vendor.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Quote Items
              </CardTitle>
              <CardDescription>
                {quote.items?.length || 0} item(s) in this quote
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!quote.items || quote.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No items in this quote</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quote.items.map((item, index) => {
                    const quantity = item.quantity || 0;
                    const unitPrice = item.unit_price || 0;
                    const vendorCost = item.vendor_cost || 0;
                    const totalPrice = item.total_price || (quantity * unitPrice);
                    const totalVendorCost = vendorCost * quantity;
                    const profitPerPiece = unitPrice - vendorCost;
                    const totalProfit = profitPerPiece * quantity;
                    const profitPercent = vendorCost > 0 ? ((profitPerPiece / vendorCost) * 100) : 0;

                    return (
                      <div key={item.id || index} className="border rounded-lg p-4 space-y-4">
                        {/* Item Header with Product Title */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3 flex-1">
                            <Package className="w-12 h-12 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-xl">{item.description || 'No description'}</p>
                              <p className="text-sm text-muted-foreground">Product from order</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Subtotal</p>
                            <p className="text-xl font-bold text-orange-600">
                              {totalPrice > 0 ? formatCurrency(totalPrice, quote.currency) : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Specifications - Moved up */}
                        {item.specifications && Object.keys(item.specifications).length > 0 && (
                          <div className="pt-4 border-t">
                            <p className="text-sm font-semibold text-muted-foreground mb-3">Product Specifications</p>
                            <QuoteItemSpecificationsDisplay
                              specifications={item.specifications}
                              formSchema={item.form_schema}
                            />
                          </div>
                        )}

                        {/* Pricing Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                            <p className="font-semibold text-lg">{quantity > 0 ? quantity.toLocaleString() : '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Vendor Cost (IDR)</p>
                            <p className="font-semibold">
                              {vendorCost > 0 ? formatCurrency(vendorCost, quote.currency) : '-'}
                            </p>
                            <p className="text-xs text-amber-600">
                              Cost from vendor (for profit calculation per piece)
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Unit Price (IDR)</p>
                            <p className="font-semibold">
                              {unitPrice > 0 ? formatCurrency(unitPrice, quote.currency) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Profit Margin Per Piece</p>
                            <p className="font-semibold text-green-600">
                              {profitPerPiece > 0 ? `+${formatCurrency(profitPerPiece, quote.currency)}` : '-'}
                            </p>
                            <p className="text-xs text-green-600">
                              {profitPercent > 0 ? `↗ ${profitPercent.toFixed(1)}% margin` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Total Summary Box */}
                        <div className="border-2 border-blue-500/30 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Total (Qty: {quantity})
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Vendor Cost:</p>
                              <p className="font-bold text-lg">
                                {totalVendorCost > 0 ? formatCurrency(totalVendorCost, quote.currency) : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Unit Price:</p>
                              <p className="font-bold text-lg">
                                {totalPrice > 0 ? formatCurrency(totalPrice, quote.currency) : '-'}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-blue-500/20">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium flex items-center gap-1">
                                <span className="text-green-600">↗</span>
                                Total Profit:
                              </p>
                              <p className="font-bold text-xl text-green-600">
                                {totalProfit > 0 ? `+${formatCurrency(totalProfit, quote.currency)}` : '-'}
                                {profitPercent > 0 && (
                                  <span className="text-sm ml-2">({profitPercent.toFixed(1)}%)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <div className="pt-3 border-t">
                            <p className="text-sm font-semibold text-muted-foreground mb-2">Notes</p>
                            <p className="text-sm bg-muted/50 p-3 rounded">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Grand Total Summary */}
                  <div className="border-t-2 pt-6 mt-6">
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-lg p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
                          <p className="text-2xl font-bold text-green-600">
                            {quote.items && quote.items.length > 0 ? (
                              `+${formatCurrency(
                                quote.items.reduce((sum, item) => {
                                  const qty = item.quantity || 0;
                                  const unit = item.unit_price || 0;
                                  const vendor = item.vendor_cost || 0;
                                  return sum + ((unit - vendor) * qty);
                                }, 0),
                                quote.currency
                              )}`
                            ) : '-'}
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            {quote.items && quote.items.length > 0 && (() => {
                              const totalVendor = quote.items.reduce((sum, item) => 
                                sum + ((item.vendor_cost || 0) * (item.quantity || 0)), 0
                              );
                              const totalProfit = quote.items.reduce((sum, item) => {
                                const qty = item.quantity || 0;
                                const unit = item.unit_price || 0;
                                const vendor = item.vendor_cost || 0;
                                return sum + ((unit - vendor) * qty);
                              }, 0);
                              const margin = totalVendor > 0 ? (totalProfit / totalVendor) * 100 : 0;
                              return `↗ ${margin.toFixed(1)}% margin`;
                            })()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                          <p className="text-3xl font-bold text-orange-600">
                            {quote.grand_total && quote.grand_total > 0 ? (
                              formatCurrency(quote.grand_total, quote.currency)
                            ) : quote.items && quote.items.length > 0 ? (
                              formatCurrency(
                                quote.items.reduce((sum, item) => sum + (item.total_price || 0), 0),
                                quote.currency
                              )
                            ) : (
                              <span className="text-base text-muted-foreground font-normal">Not calculated</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center pt-3 border-t border-orange-200 dark:border-orange-800">
                        Excluding taxes and fees
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Terms & Conditions and Internal Notes - Nested Tabs */}
          {(quote.terms_and_conditions || quote.notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Information</CardTitle>
                <CardDescription>Terms, conditions, and internal notes</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="terms" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="terms" disabled={!quote.terms_and_conditions}>
                      <FileText className="w-4 h-4 mr-2" />
                      Terms & Conditions
                    </TabsTrigger>
                    <TabsTrigger value="notes" disabled={!quote.notes}>
                      <FileText className="w-4 h-4 mr-2" />
                      Internal Notes
                    </TabsTrigger>
                  </TabsList>
                  
                  {quote.terms_and_conditions && (
                    <TabsContent value="terms" className="mt-4">
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: quote.terms_and_conditions }}
                      />
                    </TabsContent>
                  )}
                  
                  {quote.notes && (
                    <TabsContent value="notes" className="mt-4">
                      <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>Admin Only:</strong> These notes are only visible to admin users and will not be shared with customers or vendors.
                        </p>
                      </div>
                      <div 
                        className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: quote.notes }}
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Status History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status History Timeline
              </CardTitle>
              <CardDescription>Complete timeline of quote status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative space-y-6">
                {formatStatusHistory().map((entry, index) => {
                  const isLast = index === formatStatusHistory().length - 1;
                  const isCurrent = index === 0;

                  return (
                    <div key={index} className="flex gap-4 relative">
                      {!isLast && (
                        <div className="absolute left-[15px] top-[32px] bottom-[-24px] w-0.5 bg-border" />
                      )}

                      <div className={`
                        relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2
                        ${isCurrent
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground'
                        }
                      `}>
                        <Clock className="h-4 w-4" />
                      </div>

                      <div className="flex-1 pb-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                              {entry.action}
                            </p>
                            {entry.user_name && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {entry.user_name}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                          <time className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                          </time>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Messages */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages
              </CardTitle>
              <CardDescription>Communication with vendor about this quote</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages list */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Start a conversation with the vendor</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isAdmin = msg.sender.role === 'admin';

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {msg.sender.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{msg.sender.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.timestamp), 'MMM dd, HH:mm')}
                              </span>
                            </div>
                            <div
                              className={`inline-block rounded-lg px-4 py-2 ${
                                isAdmin
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default QuoteDetail;
