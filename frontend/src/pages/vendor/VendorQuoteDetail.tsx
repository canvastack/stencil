/**
 * VendorQuoteDetail Page
 * 
 * Displays complete quote details with customer, order, and product information.
 * Allows vendors to respond to quotes (accept, reject, counter offer).
 * Includes message thread for communication with admin.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 10.7
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import vendorApi from '@/services/api/vendorApi';
import QuoteStatusBadge from '@/components/vendor/QuoteStatusBadge';
import QuoteResponseForm, { type QuoteResponseData } from '@/components/vendor/QuoteResponseForm';
import MessageThread from '@/components/vendor/MessageThread';
import CounterOfferSummary from '@/components/vendor/CounterOfferSummary';
import AdminCounterOfferDisplay from '@/components/vendor/AdminCounterOfferDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { QuoteDetail, QuoteMessage } from '@/types/vendor/portal';
import { useSmartPolling } from '@/hooks/useSmartPolling';

type ResponseAction = 'accept' | 'reject' | 'counter' | null;

export default function VendorQuoteDetail() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();

  // State
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [messages, setMessages] = useState<QuoteMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeResponseAction, setActiveResponseAction] = useState<ResponseAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  /**
   * Fetch quote details
   */
  const fetchQuoteDetail = async () => {
    if (!uuid) return;

    try {
      setLoading(true);
      setError(null);

      const response = await vendorApi.getQuoteDetail(uuid);

      if (response.success) {
        setQuote(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch quote detail:', err);
      setError(err.message || 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch messages
   */
  const fetchMessages = async () => {
    if (!uuid) return;

    try {
      const response = await vendorApi.getMessages(uuid);
      
      console.log('[VendorQuoteDetail] Messages response:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        length: response.data?.length,
        response
      });

      // API returns { message, data: [...], pagination }
      if (Array.isArray(response.data)) {
        setMessages(response.data);
        console.log('[VendorQuoteDetail] Set messages:', response.data.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch messages:', err);
      // Don't set error state for messages - just log it
      // This prevents the entire page from breaking if messages fail to load
      if (err.code === 'ECONNABORTED') {
        console.warn('[VendorQuoteDetail] Messages request timed out - this is non-critical');
      }
    }
  };

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchQuoteDetail();
    fetchMessages();
  }, [uuid]);

  /**
   * Check if quote is expired
   * Parse expires_at carefully to handle timezone issues
   * MUST be defined before useSmartPolling
   */
  const isExpired = quote?.expires_at ? (() => {
    try {
      // Backend now returns ISO 8601 with timezone: "2026-02-12T23:09:26+07:00"
      // Or old format: "2026-02-12 23:09:26"
      let expiresAt: Date;
      
      if (quote.expires_at.includes('T')) {
        // ISO 8601 format - parse directly
        expiresAt = new Date(quote.expires_at);
      } else {
        // Old format with space - replace with T
        expiresAt = new Date(quote.expires_at.replace(' ', 'T'));
      }
      
      const now = new Date();
      const expired = expiresAt < now;
      
      console.log('[VendorQuoteDetail] Expiry check:', {
        expiresAtRaw: quote.expires_at,
        expiresAtParsed: expiresAt.toISOString(),
        expiresAtLocal: expiresAt.toLocaleString(),
        now: now.toISOString(),
        nowLocal: now.toLocaleString(),
        expired,
        diff: Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60) + ' minutes'
      });
      
      return expired;
    } catch (e) {
      console.error('Failed to parse expires_at:', quote.expires_at, e);
      return false; // If parsing fails, assume not expired
    }
  })() : false;

  /**
   * Smart polling for real-time messages
   * - Fast polling (5s) when active
   * - Slow polling (30s) after 1 minute inactivity
   * - Stops polling when tab is not visible (saves resources)
   */
  const { markActivity } = useSmartPolling({
    onPoll: fetchMessages,
    fastInterval: 5000,      // 5 seconds when active
    slowInterval: 30000,     // 30 seconds when inactive
    inactivityThreshold: 60000, // Switch to slow after 1 minute
    enabled: !!uuid && !isExpired, // Only poll if quote exists and not expired
    pollInBackground: false, // Stop polling when tab not visible (saves battery)
  });

  /**
   * Handle quote response submission
   */
  const handleResponseSubmit = async (data: QuoteResponseData) => {
    if (!uuid) return;

    try {
      setIsSubmitting(true);
      setError(null);

      if (data.responseType === 'accept') {
        await vendorApi.acceptQuote(uuid, {
          estimated_delivery_days: data.estimatedDeliveryDays || 0,
          notes: data.notes,
        });
      } else if (data.responseType === 'reject') {
        await vendorApi.rejectQuote(uuid, {
          rejection_reason: data.rejectionReason || '',
        });
      } else if (data.responseType === 'counter') {
        await vendorApi.counterOffer(uuid, {
          items: data.counterOfferItems || [],
          notes: data.notes,
          estimated_delivery_days: data.estimatedDeliveryDays,
        });
      }

      // Refresh quote data
      await fetchQuoteDetail();
      setActiveResponseAction(null);
    } catch (err: any) {
      console.error('Failed to submit response:', err);
      setError(err.message || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle send message
   */
  const handleSendMessage = async (message: string, attachments?: File[]) => {
    if (!uuid) return;

    try {
      setIsSendingMessage(true);

      await vendorApi.sendMessage(uuid, {
        message,
        attachments,
      });

      // Refresh messages immediately
      await fetchMessages();
      
      // Mark activity to reset to fast polling
      markActivity();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * Check if vendor can respond
   * Allow response for: draft, open, sent, pending_response, admin_countered
   * Also allow re-submission after rejection if rejection_count < 2
   */
  const rejectionHistory = quote?.quote_details?.rejection_history || [];
  const rejectionCount = rejectionHistory.length;
  const maxRejectionsReached = rejectionCount >= 2;
  const latestRejection = rejectionHistory.length > 0 ? rejectionHistory[rejectionHistory.length - 1] : null;
  
  // Check if max negotiation rounds reached
  const maxRounds = quote?.max_rounds || 5;
  const currentRound = quote?.round || 1;
  const maxRoundsReached = currentRound >= maxRounds;
  
  // Can counter offer (not at max rounds)
  const canCounter = quote && 
    (quote.status === 'draft' || quote.status === 'open' || quote.status === 'sent' || quote.status === 'pending_response' || quote.status === 'admin_countered') && 
    !isExpired &&
    !maxRejectionsReached &&
    !maxRoundsReached;
  
  // Can accept or reject (even at max rounds if admin has countered)
  const canAcceptOrReject = quote && 
    (quote.status === 'sent' || quote.status === 'pending_response' || quote.status === 'admin_countered') && 
    !isExpired &&
    !maxRejectionsReached;
  
  // Can respond (either counter or accept/reject)
  const canRespond = canCounter || canAcceptOrReject;

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error && !quote) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-4">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Error Loading Quote</h3>
            </div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => fetchQuoteDetail()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={() => navigate('/vendor/quotes')} variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quotes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendor/quotes')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotes
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{quote.quote_number}</h1>
            <p className="text-muted-foreground">Quote Details</p>
          </div>
        </div>
        <QuoteStatusBadge status={quote.status} isExpired={isExpired} />
      </div>

      {/* Expired Warning */}
      {isExpired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This quote expired {formatDistanceToNow(new Date(quote.expires_at!), { addSuffix: true })}.
            You can no longer respond to this quote.
          </AlertDescription>
        </Alert>
      )}

      {/* Maximum Rejections Reached Warning */}
      {maxRejectionsReached && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Maksimal penolakan tercapai (2 dari 2).</strong> Counter offer Anda untuk quote ini telah ditolak dua kali. 
            Anda tidak dapat mengajukan penawaran lagi untuk order ini. Admin harus memilih vendor yang berbeda.
          </AlertDescription>
        </Alert>
      )}

      {/* Rejection History Card - Show all rejections */}
      {rejectionHistory.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              {maxRejectionsReached ? 'Penolakan Final' : 'Riwayat Penolakan'} ({rejectionCount} dari 2 penolakan)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Show all rejection history */}
            {rejectionHistory.map((rejection: any, index: number) => (
              <div key={index} className={`${index > 0 ? 'pt-3 border-t border-red-200 dark:border-red-800' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                    Penolakan {rejection.rejection_number} dari 2
                  </p>
                  {rejection.rejected_at && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(rejection.rejected_at).toLocaleString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-900 p-3 rounded border border-red-200 dark:border-red-800">
                  <p className="text-xs text-muted-foreground mb-1">Alasan Penolakan:</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {rejection.rejection_reason}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Status message */}
            <div className="pt-3 border-t border-red-200 dark:border-red-800">
              {quote.status === 'sent' && !maxRejectionsReached && (
                <Alert className="border-orange-500 bg-orange-100 dark:bg-orange-950/50">
                  <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <AlertDescription className="text-orange-900 dark:text-orange-100">
                    <strong>Anda masih memiliki 1 kesempatan lagi</strong> untuk mengajukan counter offer yang direvisi. 
                    Silakan tinjau alasan penolakan di atas dan ajukan penawaran baru dengan harga yang lebih kompetitif.
                  </AlertDescription>
                </Alert>
              )}
              {maxRejectionsReached && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Maksimal penolakan tercapai.</strong> Anda tidak dapat mengajukan counter offer lagi untuk order ini. 
                    Admin harus memilih vendor yang berbeda.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejection Notice - Show when rejected but can still resubmit (REMOVED - replaced by card above) */}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Final Round Warning - Show when at max rounds */}
      {quote.status === 'admin_countered' && currentRound >= maxRounds && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 dark:text-red-100">
            <p className="font-semibold mb-2">🚫 Maksimal Round Negosiasi Tercapai!</p>
            <p className="text-sm">
              Anda telah mencapai round {currentRound} dari maksimal {maxRounds} round negosiasi. 
              Anda tidak dapat melakukan counter offer lagi.
              <strong className="block mt-2">Pilihan Anda:</strong>
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>Terima Counter Admin</strong> - Kesepakatan tercapai, quote disetujui</li>
              <li><strong>Tolak</strong> - Negosiasi berakhir tanpa kesepakatan</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Final Round Warning - Show when approaching max rounds (round before last) */}
      {quote.status === 'admin_countered' && currentRound === maxRounds - 1 && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950/30">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <p className="font-semibold mb-2">⚠️ Peringatan: Ini adalah round terakhir negosiasi!</p>
            <p className="text-sm">
              Anda berada di round {currentRound} dari maksimal {maxRounds} round. 
              Jika Anda melakukan counter offer lagi, itu akan menjadi round terakhir ({maxRounds}). 
              <strong className="block mt-2">Pilihan Anda:</strong>
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li><strong>Terima Counter Admin</strong> - Kesepakatan tercapai, quote disetujui</li>
              <li><strong>Counter Lagi</strong> - Round terakhir, jika ditolak negosiasi berakhir</li>
              <li><strong>Tolak</strong> - Negosiasi berakhir tanpa kesepakatan</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Admin Counter Offer Display - Show when admin has countered */}
      {quote.status === 'admin_countered' && quote.admin_counter_offer && (
        <AdminCounterOfferDisplay
          adminCounterOffer={quote.admin_counter_offer}
          currentRound={quote.current_round || quote.round}
          maxRounds={quote.max_rounds || 5}
        />
      )}

      {/* Original Quote Pricing Display - Show after rejection */}
      {rejectionHistory.length > 0 && canRespond && !activeResponseAction && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Harga Asli PT CEX (Original Quote)
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Anda dapat menerima harga asli ini atau mengajukan counter offer baru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              Rp {(quote.initial_offer || 0).toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ini adalah harga asli yang ditawarkan PT CEX sebelum negosiasi. 
              Anda masih dapat menerima harga ini dengan klik tombol "Terima Harga Asli" di bawah.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Response Actions - Sticky Header Style (matching admin panel) */}
      {canRespond && !activeResponseAction && (
        <div className="sticky top-0 z-10 -mx-6 px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg shadow-gray-200/20 dark:shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Actions</h3>
              <p className="text-sm text-muted-foreground">
                {quote.status === 'admin_countered'
                  ? 'Admin telah counter offer Anda - pilih response'
                  : rejectionHistory.length > 0 
                    ? 'Pilih untuk menerima harga asli atau ajukan counter offer baru'
                    : 'Available actions for this quote'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setActiveResponseAction('accept')}
                variant="default"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {quote.status === 'admin_countered'
                  ? 'Terima Counter Admin'
                  : rejectionHistory.length > 0 
                    ? 'Terima Harga Asli' 
                    : 'Accept Quote'
                }
              </Button>
              {canCounter && (
                <Button
                  onClick={() => setActiveResponseAction('counter')}
                  variant="outline"
                  size="sm"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  {quote.status === 'admin_countered'
                    ? 'Counter Lagi'
                    : rejectionHistory.length > 0 
                      ? 'Counter Offer Baru' 
                      : 'Counter Offer'
                  }
                </Button>
              )}
              <Button
                onClick={() => setActiveResponseAction('reject')}
                variant="destructive"
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Tolak
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Response Form */}
      {activeResponseAction && (
        <QuoteResponseForm
          responseType={activeResponseAction}
          quoteItems={quote.items || []}
          isExpired={isExpired}
          hasResponded={false}
          onSubmit={handleResponseSubmit}
          onCancel={() => setActiveResponseAction(null)}
          isSubmitting={isSubmitting}
          originalOffer={quote.initial_offer}
          hasRejectionHistory={rejectionHistory.length > 0}
          adminCounterOffer={quote.admin_counter_offer?.total_admin_counter}
          isAdminCountered={quote.status === 'admin_countered'}
        />
      )}

      {/* Tabs Navigation */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">
            <FileText className="w-4 h-4 mr-2" />
            Quote Details
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages
            {messages.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {messages.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Quote Details */}
        <TabsContent value="details" className="space-y-6">
          {/* Customer & Order Information */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{quote.customer.name}</p>
                </div>
                {quote.customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${quote.customer.email}`} className="text-sm hover:underline">
                      {quote.customer.email}
                    </a>
                  </div>
                )}
                {quote.customer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${quote.customer.phone}`} className="text-sm hover:underline">
                      {quote.customer.phone}
                    </a>
                  </div>
                )}
                {quote.customer.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{quote.customer.company}</p>
                  </div>
                )}
                {quote.customer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{quote.customer.address}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-medium">{quote.order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge variant="outline">{quote.order.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(quote.order.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Vendor Cost</p>
                  <p className="font-medium text-lg text-green-600">
                    Rp {(quote.items?.reduce((sum, item) => sum + (item.vendor_cost * item.quantity), 0) || 0).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total harga yang ditawarkan PT CEX kepada vendor
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quote Items
              </CardTitle>
              <CardDescription>
                Daftar produk yang diminta dengan harga vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {quote.items && quote.items.length > 0 ? (
                <div className="space-y-4">
                  {quote.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.description || item.product_name || 'Product'}</h4>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                        <Badge variant="secondary">
                          Qty: {item.quantity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Vendor Cost/Unit</p>
                          <p className="font-medium">Rp {item.vendor_cost.toLocaleString('id-ID')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantity</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Vendor Cost</p>
                          <p className="font-medium text-green-600">
                            Rp {(item.vendor_cost * item.quantity).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Product ID</p>
                          <p className="font-medium">{item.product_id || 'N/A'}</p>
                        </div>
                      </div>

                      {item.specifications && Object.keys(item.specifications).length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Specifications</p>
                          <div className="bg-muted p-3 rounded-lg">
                            <pre className="text-xs whitespace-pre-wrap">
                              {JSON.stringify(item.specifications, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Total Summary */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between text-lg font-semibold">
                      <span>Total Vendor Cost:</span>
                      <span className="text-green-600">
                        Rp {(quote.items.reduce((sum, item) => sum + (item.vendor_cost * item.quantity), 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      Ini adalah total harga yang PT CEX tawarkan kepada Anda sebagai vendor
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No items found in this quote</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Information - Legacy (if no items) */}
          {(!quote.items || quote.items.length === 0) && quote.product && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Product Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Product Name</p>
                    <p className="font-medium">{quote.product?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{quote.product?.sku || 'N/A'}</p>
                  </div>
                </div>

                {quote.product?.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{quote.product.description}</p>
                  </div>
                )}

                {quote.quote_details.product_specifications && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Specifications</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <pre className="text-sm whitespace-pre-wrap">
                        {JSON.stringify(quote.quote_details.product_specifications, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                </span>
              </div>
              {quote.sent_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sent to Vendor</span>
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(new Date(quote.sent_at), { addSuffix: true })}
                  </span>
                </div>
              )}
              {quote.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {isExpired ? 'Expired' : 'Expires'}
                  </span>
                  <span className={`text-sm font-medium ${isExpired ? 'text-destructive' : ''}`}>
                    {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}
                  </span>
                </div>
              )}
              {quote.responded_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Responded</span>
                  <span className="text-sm font-medium">
                    {formatDistanceToNow(new Date(quote.responded_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Counter Offer Summary (if submitted) */}
          {quote.status === 'countered' && quote.quote_details?.counter_offer && (
            <CounterOfferSummary counterOffer={quote.quote_details.counter_offer} />
          )}

          {/* Admin Notes */}
          {quote.quote_details.admin_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{quote.quote_details.admin_notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 2: Messages */}
        <TabsContent value="messages">
          <MessageThread
            messages={messages}
            onSendMessage={handleSendMessage}
            isSending={isSendingMessage}
            isExpired={isExpired}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
