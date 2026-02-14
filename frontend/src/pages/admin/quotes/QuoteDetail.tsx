/**
 * Quote Detail Page - Admin View
 * Clean design with tab system for Status History and Messages
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quoteService } from '@/services/tenant/quoteService';
import { messageService, type QuoteMessage } from '@/services/tenant/messageService';
import { generatePurchaseOrder, getPurchaseOrderPDFUrl, downloadPurchaseOrderPDF } from '@/services/purchaseOrderService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PDFViewerModal } from '@/components/admin/PDFViewerModal';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  Building2,
  Mail,
  Package,
  RefreshCw,
  XCircle,
  ExternalLink,
  Download,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { QuoteItemSpecificationsDisplay } from '@/components/tenant/quotes/QuoteItemSpecifications';
import { formatCurrency } from '@/utils/currency';
import CounterOfferDisplay from '@/components/admin/CounterOfferDisplay';
import AcceptCounterOfferModal from '@/components/admin/AcceptCounterOfferModal';
import AdminCounterOfferModal from '@/components/admin/AdminCounterOfferModal';
import { ProductionCountdown } from '@/components/quotes/ProductionCountdown';

export function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showAdminCounterDialog, setShowAdminCounterDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch quote data with order status and production progress
  const { data: quote, isLoading, error, refetch } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      try {
        const result = await quoteService.getQuote(id!);
        console.log('[QuoteDetail] Quote data received:', result);
        console.log('[QuoteDetail] Quote status:', result.status);
        console.log('[QuoteDetail] Response type:', result.response_type);
        console.log('[QuoteDetail] Has quote_details:', !!result.quote_details);
        console.log('[QuoteDetail] Has counter_offer:', !!result.quote_details?.counter_offer);
        
        // Log order status and production progress (post-acceptance workflow)
        console.log('[QuoteDetail] Order status:', result.order_status);
        console.log('[QuoteDetail] Order status label:', result.order_status_label);
        console.log('[QuoteDetail] Production progress:', result.production_progress);
        
        if (result.quote_details?.counter_offer) {
          console.log('[QuoteDetail] Counter offer data:', result.quote_details.counter_offer);
        }
        
        // Validate production progress data if quote is accepted
        if (result.status === 'accepted' && result.production_progress) {
          console.log('[QuoteDetail] Production progress validation:', {
            hasAcceptedDate: !!result.production_progress.accepted_date,
            hasExpectedDate: !!result.production_progress.expected_delivery_date,
            daysElapsed: result.production_progress.days_elapsed,
            daysRemaining: result.production_progress.days_remaining,
            progressPercentage: result.production_progress.progress_percentage,
            isOverdue: result.production_progress.is_overdue,
          });
        }
        
        return result;
      } catch (err: any) {
        console.error('[QuoteDetail] Error fetching quote:', err);
        throw err;
      }
    },
    enabled: !!id,
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  // Fetch messages data with smart polling
  // - Fast polling (5s) when active
  // - Slow polling (30s) after inactivity
  // - Stops when tab is not visible (saves resources)
  const { data: messagesData } = useQuery({
    queryKey: ['quote-messages', id],
    queryFn: async () => {
      try {
        const result = await messageService.getMessages(id!);
        console.log('[QuoteDetail] Messages data received:', result);
        return result;
      } catch (error: any) {
        // Silently fail for aborted requests (happens during navigation)
        if (error.code === 'ECONNABORTED' || error.message?.includes('aborted')) {
          console.log('[QuoteDetail] Messages request aborted (normal during navigation)');
          return { data: [], meta: { total: 0, unread_count: 0 } };
        }
        throw error;
      }
    },
    enabled: !!id && quote?.status !== 'draft', // Don't fetch messages for draft quotes
    retry: 1, // Only retry once on failure
    retryDelay: 1000, // Wait 1s before retry
    refetchInterval: (data) => {
      // Don't poll if tab is not visible
      if (document.hidden) return false;
      
      // Don't poll for draft quotes
      if (quote?.status === 'draft') return false;
      
      // Fast polling (5s) for first 2 minutes, then slow down to 30s
      const lastMessageAt = data?.meta?.last_message_at;
      const isRecentlyActive = lastMessageAt && typeof lastMessageAt === 'string'
        ? (Date.now() - new Date(lastMessageAt).getTime()) < 120000 
        : true;
      
      return isRecentlyActive ? 5000 : 30000;
    },
    refetchIntervalInBackground: false, // Stop polling when tab not visible (saves battery)
    staleTime: 3000, // Consider data stale after 3s
  });

  const messages: QuoteMessage[] = messagesData?.data || [];
  const unreadCount = messagesData?.meta?.unread_count || 0;

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
      return await messageService.sendMessage(id!, { message });
    },
    onSuccess: () => {
      setMessageText('');
      // Invalidate queries to force refetch
      queryClient.invalidateQueries({ queryKey: ['quote-messages', id] });
      toast({
        title: 'Success',
        description: 'Message sent successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Handle send message
  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  // Handle accept counter offer
  const handleAcceptCounter = async () => {
    if (!id) return;
    
    // Open modal instead of confirm
    setShowAcceptDialog(true);
  };

  // Handle accept confirmation from modal
  const handleAcceptConfirm = async (customerPrice: number, notes?: string) => {
    if (!id) return;

    setIsAccepting(true);
    try {
      await quoteService.acceptCounterOffer(id, customerPrice, notes);
      toast({
        title: 'Success',
        description: 'Counter offer accepted successfully. Order moved to customer quotation stage.',
      });
      setShowAcceptDialog(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to accept counter offer',
        variant: 'destructive',
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle reject counter offer
  const handleRejectCounter = async () => {
    if (!id) return;
    
    // Open modal instead of prompt
    setShowRejectDialog(true);
  };

  // Handle reject confirmation from modal
  const handleRejectConfirm = async () => {
    if (!id || !rejectionReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for rejection (minimum 10 characters)',
        variant: 'destructive',
      });
      return;
    }

    if (rejectionReason.trim().length < 10) {
      toast({
        title: 'Validation Error',
        description: 'Rejection reason must be at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsRejecting(true);
    try {
      await quoteService.rejectCounterOffer(id, rejectionReason);
      toast({
        title: 'Success',
        description: 'Counter offer rejected successfully. Vendor has been notified via email.',
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject counter offer',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Handle admin counter offer
  const handleAdminCounter = async () => {
    if (!id) return;
    
    // Open modal
    setShowAdminCounterDialog(true);
  };

  // Handle admin counter confirmation from modal
  const handleAdminCounterSubmit = async (data: {
    counter_offer_amount: number;
    items: Array<{
      product_id: string;
      admin_counter_unit_price: number;
      notes?: string;
    }>;
    notes?: string;
  }) => {
    if (!id) return;

    try {
      await quoteService.adminCounterOffer(id, data);
      toast({
        title: 'Success',
        description: 'Admin counter offer submitted successfully. Vendor has been notified via email.',
      });
      setShowAdminCounterDialog(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit admin counter offer',
        variant: 'destructive',
      });
      throw error; // Re-throw to let modal handle it
    }
  };

  // Handle send to vendor
  const handleSendToVendor = async () => {
    if (!id) return;
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
  
  // Calculate rejection count
  const rejectionCount = quote.quote_details?.rejection_history?.length || 0;
  const hasRejectionHistory = rejectionCount > 0;
  const maxRejectionsReached = rejectionCount >= 2;
  
  // Read-only if accepted, expired, cancelled, or max rejections reached
  const isReadOnly = ['accepted', 'expired', 'cancelled'].includes(quote.status) || maxRejectionsReached;
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();
  const hasCounterOffer = quote.status === 'countered' && quote.quote_details?.counter_offer;

  // Debug logging
  console.log('[QuoteDetail] Render state:', {
    status: quote.status,
    hasQuoteDetails: !!quote.quote_details,
    hasCounterOffer: !!quote.quote_details?.counter_offer,
    hasCounterOfferComputed: hasCounterOffer,
    counterOfferData: quote.quote_details?.counter_offer,
  });

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

      {/* Post-Acceptance Panel */}
      {quote.status === 'accepted' && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600 w-6 h-6" />
              <div>
                <CardTitle className="text-green-900 dark:text-green-100">
                  Quote Accepted by Vendor!
                </CardTitle>
                <CardDescription className="text-green-700 dark:text-green-300">
                  Vendor accepted on {quote.responded_at ? format(new Date(quote.responded_at), 'MMMM do, yyyy') : 'N/A'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agreed Terms */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
              <h4 className="font-semibold mb-3">Agreed Terms:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Price:</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(quote.latest_offer || quote.initial_offer || 0, quote.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Delivery:</p>
                  <p className="text-xl font-bold">
                    {quote.quote_details?.estimated_delivery_days || 'N/A'} days
                  </p>
                </div>
              </div>
            </div>

            {/* Production Timeline - with error handling */}
            {quote.responded_at && quote.quote_details?.estimated_delivery_days ? (
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Production Timeline
                </h4>
                <ProductionCountdown 
                  acceptedDate={quote.responded_at}
                  estimatedDays={quote.quote_details.estimated_delivery_days}
                />
              </div>
            ) : (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-900 dark:text-orange-100">
                  Production timeline information is not available. 
                  {!quote.responded_at && ' Missing acceptance date.'}
                  {!quote.quote_details?.estimated_delivery_days && ' Missing estimated delivery days.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Next Actions */}
            <div className="space-y-2">
              <h4 className="font-semibold">Next Steps:</h4>
              
              <Button 
                onClick={() => navigate(`/admin/orders/${quote.order_id}?openQuoteModal=true`)}
                className="w-full"
                size="lg"
              >
                <Package className="w-4 h-4 mr-2" />
                View Order & Advance to Customer Quote
              </Button>
              
              <GeneratePOButton quoteUuid={quote.uuid || quote.id} />
            </div>

            {/* Order Status Sync Info - with loading state */}
            {quote.order_status ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Order status: <strong>{quote.order_status_label || quote.order_status}</strong>
                  {quote.order_status === 'customer_quote' && (
                    <span className="text-green-600 ml-2">✓ Ready for customer quotation</span>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground">
                  Order status information is being synchronized...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Read-Only Notice with Status-Specific Styling */}
      {isReadOnly && quote.status !== 'sent' && (
        <Alert 
          variant={maxRejectionsReached ? 'destructive' : quote.status === 'rejected' ? 'destructive' : 'default'}
          className={
            quote.status === 'accepted' 
              ? 'border-green-200 bg-green-50 text-green-900 dark:border-green-700 dark:bg-green-950/50 dark:text-green-50'
              : maxRejectionsReached || quote.status === 'rejected'
              ? 'dark:border-red-700 dark:bg-red-950/50 dark:text-red-50'
              : quote.status === 'expired'
              ? 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-50'
              : 'border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-50'
          }
        >
          {quote.status === 'accepted' && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
          {(maxRejectionsReached || quote.status === 'rejected') && <XCircle className="h-4 w-4 dark:text-red-400" />}
          {quote.status === 'expired' && <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
          {quote.status === 'cancelled' && <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />}
          <AlertDescription className="dark:text-inherit">
            <strong className="font-semibold">
              {quote.status === 'accepted' && 'Quote Accepted'}
              {maxRejectionsReached && 'Quote Closed - Maximum Rejections Reached'}
              {!maxRejectionsReached && quote.status === 'rejected' && 'Quote Rejected'}
              {quote.status === 'expired' && 'Quote Expired'}
              {quote.status === 'cancelled' && 'Quote Cancelled'}
            </strong>
            {' - '}
            This quote is read-only and cannot be modified.
            {quote.status === 'accepted' && ' This quote has been accepted and is now being processed.'}
            {maxRejectionsReached && ' This vendor has been rejected twice and cannot submit more counter offers for this order. Please select a different vendor.'}
            {!maxRejectionsReached && quote.status === 'rejected' && ' This counter offer has been rejected. The vendor has been notified via email.'}
            {quote.status === 'expired' && ' This quote has expired and is no longer valid.'}
            {quote.status === 'cancelled' && ' This quote has been cancelled.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Rejection Notice - Show when status is 'sent' but has rejection history */}
      {quote.status === 'sent' && hasRejectionHistory && !maxRejectionsReached && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                Counter Offer Rejected - Awaiting Vendor Response
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                The vendor's counter offer has been rejected ({rejectionCount} of 2 rejections used). 
                This quote is temporarily read-only until the vendor submits a revised counter offer.
              </p>
              {rejectionCount === 1 && (
                <p className="text-sm text-orange-700 dark:text-orange-300 font-medium flex items-center gap-1.5 mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  This is the vendor's last chance to negotiate.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Rejection Reason Card - Show latest rejection reason */}
      {hasRejectionHistory && (
        <Card className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              {maxRejectionsReached ? 'Final Rejection' : 'Latest Rejection'} ({rejectionCount} of 2 rejections)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Show all rejection history */}
            {quote.quote_details?.rejection_history?.map((rejection: any, index: number) => (
              <div key={index} className={`${index > 0 ? 'pt-3 border-t border-red-200 dark:border-red-800' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                    Rejection {rejection.rejection_number} of 2
                  </p>
                  {rejection.rejected_at && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(rejection.rejected_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                </div>
                <p className="text-sm text-red-800 dark:text-red-100 whitespace-pre-wrap leading-relaxed">
                  {rejection.rejection_reason}
                </p>
              </div>
            ))}
            
            {/* Status message */}
            <div className="pt-3 border-t border-red-200 dark:border-red-800">
              {quote.status === 'sent' && !maxRejectionsReached && (
                <p className="text-xs text-orange-600 dark:text-orange-300 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {rejectionCount === 1 
                    ? 'Vendor has one more chance to submit a revised counter offer' 
                    : 'Waiting for vendor to submit a revised counter offer'}
                </p>
              )}
              {maxRejectionsReached && (
                <p className="text-xs text-red-600 dark:text-red-300 flex items-center gap-1 font-semibold">
                  <XCircle className="h-3 w-3" />
                  Maximum rejections reached. This vendor cannot submit more offers for this order. Please select a different vendor.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
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
                {hasCounterOffer && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Counter Offer Pending
                  </Badge>
                )}
                {isReadOnly && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Read-Only
                  </Badge>
                )}
              </div>
              <CardDescription>
                Created on {format(new Date(quote.created_at), 'PPP')}
                {hasCounterOffer && (
                  <span className="ml-2 text-orange-600 font-medium">
                    • Vendor has submitted a counter offer
                  </span>
                )}
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

      {/* Final Round Warning - Show when at max rounds */}
      {hasCounterOffer && (quote.round ?? 0) >= (quote.max_rounds ?? 5) && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 dark:text-red-100">
            <p className="font-semibold mb-2">🚫 Maximum Negotiation Rounds Reached!</p>
            <p className="text-sm">
              You have reached round {quote.round ?? 0} of maximum {quote.max_rounds ?? 5} rounds. 
              You cannot counter offer anymore.
              <strong className="block mt-2">Your Options:</strong>
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>Accept Counter Offer</strong> - Agreement reached, quote approved</li>
              <li><strong>Reject</strong> - Negotiation ends without agreement</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Final Round Warning - Show when approaching max rounds (round before last) */}
      {hasCounterOffer && (quote.round ?? 0) === ((quote.max_rounds ?? 5) - 1) && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <p className="font-semibold mb-2">⚠️ Warning: This is the final negotiation round!</p>
            <p className="text-sm">
              You are at round {quote.round ?? 0} of maximum {quote.max_rounds ?? 5} rounds. 
              If you counter offer again, it will be the final round ({quote.max_rounds ?? 5}). 
              <strong className="block mt-2">Your Options:</strong>
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>Accept Counter Offer</strong> - Agreement reached, quote approved</li>
              <li><strong>Counter Again</strong> - Final round, if rejected negotiation ends</li>
              <li><strong>Reject</strong> - Negotiation ends without agreement</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions Card - Sticky Header Style */}
      {!isReadOnly && (
        <div className="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Actions</h3>
              <p className="text-sm text-muted-foreground">
                {hasCounterOffer 
                  ? 'Review and respond to vendor counter offer' 
                  : 'Available actions for this quote'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Counter Offer Actions - Priority placement */}
              {hasCounterOffer && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAdminCounter}
                    className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Counter Offer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectCounter}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Counter Offer
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptCounter}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Accept Counter Offer
                  </Button>
                </>
              )}
              
              {/* Regular Quote Actions */}
              {!hasCounterOffer && (
                <>
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
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to Vendor
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
                </>
              )}
            </div>
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
          <TabsTrigger 
            value="messages" 
            disabled={quote.status === 'draft'}
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {quote.status === 'draft' && (
              <span className="ml-2 text-xs text-muted-foreground">(Send to vendor first)</span>
            )}
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

          {/* Vendor Response Section */}
          {quote.responded_at && quote.response_type && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-2">
                  {quote.response_type === 'accept' && (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-600">Vendor Accepted Quote</span>
                    </>
                  )}
                  {quote.response_type === 'reject' && (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-600">Vendor Rejected Quote</span>
                    </>
                  )}
                  {quote.response_type === 'counter' && (
                    <>
                      <RefreshCw className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-600">Vendor Counter Offer</span>
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  Responded on {format(new Date(quote.responded_at), 'MMMM do, yyyy \'at\' h:mm a')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Response Type Badge */}
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Response Type:</p>
                    {quote.response_type === 'accept' && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                    {quote.response_type === 'reject' && (
                      <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        Rejected
                      </Badge>
                    )}
                    {quote.response_type === 'counter' && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Counter Offer
                      </Badge>
                    )}
                  </div>

                  {/* Response Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    {/* Accepted Quote Details */}
                    {quote.response_type === 'accept' && quote.estimated_delivery_days && (
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Estimated Delivery
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {quote.estimated_delivery_days} {quote.estimated_delivery_days === 1 ? 'day' : 'days'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expected delivery time from vendor
                        </p>
                      </div>
                    )}

                    {/* Rejected Quote Details */}
                    {quote.response_type === 'reject' && quote.rejection_reason && (
                      <div className="md:col-span-2 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Rejection Reason
                        </p>
                        <p className="text-base text-red-900 dark:text-red-100">
                          {quote.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Counter Offer Details */}
                    {quote.response_type === 'counter' && quote.quote_details?.counter_offer && (
                      <div className="md:col-span-2">
                        <CounterOfferDisplay 
                          counterOffer={quote.quote_details.counter_offer}
                          showActions={false}
                        />
                      </div>
                    )}

                    {/* Legacy Counter Offer (fallback for old data) */}
                    {quote.response_type === 'counter' && quote.counter_offer_amount && !quote.quote_details?.counter_offer && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <RefreshCw className="w-4 h-4" />
                          Counter Offer Amount (Legacy)
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(quote.counter_offer_amount, quote.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vendor's proposed price (old format)
                        </p>
                      </div>
                    )}

                    {/* Response Timestamp */}
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Response Date
                      </p>
                      <p className="text-lg font-semibold">
                        {format(new Date(quote.responded_at), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(quote.responded_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        {/* LEFT: Total Profit */}
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
                        
                        {/* CENTER: Total Vendor Cost */}
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-1">Total Vendor Cost</p>
                          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">
                            {quote.items && quote.items.length > 0 ? (
                              formatCurrency(
                                quote.items.reduce((sum, item) => 
                                  sum + ((item.vendor_cost || 0) * (item.quantity || 0)), 0
                                ),
                                quote.currency
                              )
                            ) : '-'}
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                            Harga ke vendor
                          </p>
                        </div>
                        
                        {/* RIGHT: Total Amount */}
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
                          <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                            Harga ke customer
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center pt-3 border-t border-orange-200 dark:border-orange-800">
                        Excluding taxes & fees
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
          {/* Draft Status Alert */}
          {quote.status === 'draft' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Messages are disabled for draft quotes.</strong>
                {' '}
                You need to send this quote to the vendor first before you can communicate via messages.
                Click the "Send to Vendor" button in the Actions section above.
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages
                  </CardTitle>
                  <CardDescription>Communication with vendor about this quote</CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Badge variant="destructive">
                    {unreadCount} unread
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages list */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">
                        {quote.status === 'draft' 
                          ? 'Send the quote to vendor first to start messaging'
                          : 'Start a conversation with the vendor'
                        }
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      // Use sender_type from API response (from database)
                      const isAdmin = msg.sender_type === 'admin';
                      const senderName = msg.sender?.name || 'Unknown';
                      const senderInitial = senderName.charAt(0).toUpperCase();

                      return (
                        <div
                          key={msg.uuid}
                          className={`flex gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={isAdmin ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                              {senderInitial}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-sm font-medium">{senderName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(msg.created_at), 'MMM dd, HH:mm')}
                              </span>
                              {!msg.read_at && !isAdmin && (
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              )}
                            </div>
                            <div
                              className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                                isAdmin
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-white/20">
                                  <p className="text-xs opacity-80 mb-1">Attachments:</p>
                                  {msg.attachments.map((attachment, idx) => (
                                    <a
                                      key={idx}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs underline block hover:opacity-80"
                                    >
                                      {attachment.name}
                                    </a>
                                  ))}
                                </div>
                              )}
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
                  placeholder={quote.status === 'draft' ? 'Send quote to vendor first to enable messaging...' : 'Type your message...'}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[80px]"
                  disabled={quote.status === 'draft' || sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={quote.status === 'draft' || !messageText.trim() || sendMessageMutation.isPending}
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

      {/* Reject Counter Offer Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Reject Counter Offer
            </DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this counter offer. 
              The vendor will receive this explanation via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                Rejection Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="e.g., Price is too high for our budget. We need at least 20% discount to proceed with this order."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[120px]"
                disabled={isRejecting}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters. Current: {rejectionReason.length}
              </p>
            </div>

            {rejectionReason.trim().length > 0 && rejectionReason.trim().length < 10 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please provide at least 10 characters for the rejection reason.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isRejecting || rejectionReason.trim().length < 10}
            >
              {isRejecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept Counter Offer Modal */}
      {quote?.quote_details?.counter_offer && (
        <AcceptCounterOfferModal
          open={showAcceptDialog}
          onOpenChange={setShowAcceptDialog}
          vendorCounterOffer={quote.quote_details.counter_offer}
          onAccept={handleAcceptConfirm}
          isSubmitting={isAccepting}
        />
      )}

      {/* Admin Counter Offer Modal */}
      {quote && (
        <AdminCounterOfferModal
          isOpen={showAdminCounterDialog}
          onClose={() => setShowAdminCounterDialog(false)}
          quote={{
            uuid: quote.uuid || quote.id,
            quote_number: quote.quote_number,
            status: quote.status,
            round: quote.round || quote.revision_number || 1,
            quote_details: quote.quote_details,
            currency: quote.currency,
          }}
          onSuccess={() => refetch()}
          onSubmit={handleAdminCounterSubmit}
        />
      )}
    </div>
  );
}

/**
 * Generate PO Button Component
 */
function GeneratePOButton({ quoteUuid }: { quoteUuid: string }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [poData, setPoData] = useState<{ po_uuid: string; po_number: string; pdf_url: string } | null>(null);
  const [showPDFModal, setShowPDFModal] = useState(false);

  // Validate quoteUuid
  if (!quoteUuid) {
    console.error('[GeneratePOButton] quoteUuid is undefined or empty');
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Cannot generate PO: Quote ID is missing
        </AlertDescription>
      </Alert>
    );
  }

  const handleGeneratePO = async () => {
    try {
      setIsGenerating(true);
      
      console.log('[GeneratePOButton] Generating PO for quote:', quoteUuid);
      
      const response = await generatePurchaseOrder(quoteUuid, {
        payment_terms: 'Net 30',
        delivery_terms: 'FOB',
        send_to_vendor: false, // Don't send automatically
      });

      setPoData({
        po_uuid: response.data.po_uuid,
        po_number: response.data.po_number,
        pdf_url: response.data.pdf_url,
      });

      toast({
        title: 'Purchase Order Generated',
        description: `PO ${response.data.po_number} has been created successfully`,
      });
    } catch (error: any) {
      console.error('[GeneratePOButton] Failed to generate PO:', error);
      console.error('[GeneratePOButton] Error response:', error.response?.data);
      
      // Check if PO already exists
      if (error.response?.data?.data?.po_uuid) {
        setPoData({
          po_uuid: error.response.data.data.po_uuid,
          po_number: error.response.data.data.po_number,
          pdf_url: error.response.data.data.pdf_url,
        });
        
        toast({
          title: 'Purchase Order Already Exists',
          description: `PO ${error.response.data.data.po_number} was previously generated`,
        });
      } else {
        toast({
          title: 'Failed to Generate PO',
          description: error.response?.data?.message || error.message || 'An error occurred',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPO = async () => {
    if (poData?.po_uuid) {
      try {
        await downloadPurchaseOrderPDF(poData.po_uuid, `PO-${poData.po_number}.pdf`);
      } catch (error) {
        console.error('Failed to download PO:', error);
      }
    }
  };

  const handleViewPO = () => {
    setShowPDFModal(true);
  };

  if (poData) {
    return (
      <>
        <div className="space-y-2">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              Purchase Order <strong>{poData.po_number}</strong> generated successfully
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleViewPO}
              variant="default"
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2" />
              View PDF
            </Button>
            
            <Button 
              onClick={handleDownloadPO}
              variant="outline"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            
            <Button 
              onClick={() => window.open(`/admin/purchase-orders/${poData.po_uuid}`, '_blank')}
              variant="outline"
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>

        <PDFViewerModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          pdfUrl={getPurchaseOrderPDFUrl(poData.po_uuid)}
          title={`Purchase Order - ${poData.po_number}`}
          downloadFileName={`PO-${poData.po_number}.pdf`}
        />
      </>
    );
  }

  return (
    <Button 
      onClick={handleGeneratePO}
      variant="outline"
      className="w-full"
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Generating Purchase Order...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          Generate Purchase Order
        </>
      )}
    </Button>
  );
}

export default QuoteDetail;
