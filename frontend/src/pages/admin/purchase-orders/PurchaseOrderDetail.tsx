/**
 * Purchase Order Detail Page - Admin View
 */

import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPurchaseOrder, getPurchaseOrderPDFUrl, downloadPurchaseOrderPDF, sendPurchaseOrderToVendor } from '@/services/purchaseOrderService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PDFViewerModal } from '@/components/admin/PDFViewerModal';
import {
  ArrowLeft,
  FileText,
  Download,
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Home,
  Building2,
  Mail,
  Package,
  DollarSign,
  Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';

export function PurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  // Fetch PO data
  const { data: po, isLoading, error, refetch } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      try {
        const result = await getPurchaseOrder(id!);
        console.log('[PO Detail] PO data received:', result);
        return result;
      } catch (err: any) {
        console.error('[PO Detail] Error fetching PO:', err);
        throw err;
      }
    },
    enabled: !!id,
    retry: 2,
    staleTime: 30000,
  });

  // Handle download PDF
  const handleDownloadPDF = async () => {
    if (!id) return;
    try {
      await downloadPurchaseOrderPDF(id, `PO-${po?.po_number || id}.pdf`);
      toast({
        title: 'Downloading PDF',
        description: 'Purchase Order PDF is being downloaded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  // Handle view PDF
  const handleViewPDF = () => {
    setShowPDFModal(true);
  };

  // Handle send to vendor
  const handleSendToVendor = async () => {
    if (!id || !confirm('Send this Purchase Order to vendor via email?')) return;
    setIsSending(true);
    try {
      await sendPurchaseOrderToVendor(id);
      toast({
        title: 'Success',
        description: 'Purchase Order sent to vendor successfully',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send Purchase Order',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', className: 'bg-purple-100 text-purple-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] ?? { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !po) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Purchase Order Details</h1>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Purchase Order</h2>
          <p className="text-muted-foreground mb-6">
            {error ? 'Failed to load purchase order' : 'Purchase order not found'}
          </p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const canSend = po.status === 'draft';

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/dashboard" className="hover:text-foreground transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{po.po_number}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Purchase Order Details
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage purchase order {po.po_number}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button onClick={handleViewPDF} variant="default">
          <Eye className="w-4 h-4 mr-2" />
          View PDF
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        {canSend && (
          <Button onClick={handleSendToVendor} disabled={isSending}>
            <Send className="w-4 h-4 mr-2" />
            {isSending ? 'Sending...' : 'Send to Vendor'}
          </Button>
        )}
      </div>

      {/* Sent Confirmation */}
      {po.sent_at && (
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            Purchase Order sent to vendor on {format(new Date(po.sent_at), 'MMMM do, yyyy \'at\' h:mm a')}
          </AlertDescription>
        </Alert>
      )}

      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl">{po.po_number}</CardTitle>
                {getStatusBadge(po.status)}
              </div>
              <CardDescription>
                Created on {format(new Date(po.created_at), 'PPP')}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(po.total_amount, po.currency)}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vendor & Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <p className="font-medium">{po.vendor.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${po.vendor.email}`} className="text-primary hover:underline">
                  {po.vendor.email}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-medium">{po.order.order_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Expected Delivery</p>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <p>
                  {po.expected_delivery_date 
                    ? format(new Date(po.expected_delivery_date), 'MMMM do, yyyy')
                    : 'Not specified'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Terms & Notes */}
      {(po.payment_terms || po.delivery_terms || po.notes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Terms & Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {po.payment_terms && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Terms</p>
                <p>{po.payment_terms}</p>
              </div>
            )}
            {po.delivery_terms && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Terms</p>
                <p>{po.delivery_terms}</p>
              </div>
            )}
            {po.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer Modal */}
      {id && (
        <PDFViewerModal
          isOpen={showPDFModal}
          onClose={() => setShowPDFModal(false)}
          pdfUrl={getPurchaseOrderPDFUrl(id)}
          title={`Purchase Order - ${po?.po_number || id}`}
          downloadFileName={`PO-${po?.po_number || id}.pdf`}
        />
      )}
    </div>
  );
}

export default PurchaseOrderDetail;
