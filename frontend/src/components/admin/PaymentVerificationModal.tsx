import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';

interface PaymentDetail {
  uuid: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  customer: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    tax_id: string | null;
  };
  quote_number: string | null;
  order_number: string | null;
  bank_details: {
    destination_bank: string | null;
    destination_account_number: string | null;
    destination_account_holder: string | null;
    transfer_datetime: string | null;
  };
  financial: {
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    shipping_cost: number;
    handling_fee: number;
    grand_total: number;
    vendor_cost: number;
    profit_amount: number;
    profit_percentage: number;
  };
  payment_proof_url: string | null;
  payment_proof_download_url: string | null;
  payment_notes: string | null;
  submitted_at: string;
  waiting_time: string;
  waiting_minutes: number;
}

interface PaymentVerificationModalProps {
  paymentUuid: string;
  isOpen: boolean;
  onClose: () => void;
  onVerificationComplete: () => void;
}

export default function PaymentVerificationModal({
  paymentUuid,
  isOpen,
  onClose,
  onVerificationComplete,
}: PaymentVerificationModalProps) {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (isOpen && paymentUuid) {
      loadPaymentDetail();
    }
  }, [isOpen, paymentUuid]);

  const loadPaymentDetail = async () => {
    try {
      setLoading(true);
      const response = await tenantApiClient.get(`/admin/payment-verification/${paymentUuid}`) as any;
      
      if (response && response.success) {
        setPayment(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load payment detail:', error);
      toast.error(error.message || 'Failed to load payment detail');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!payment) return;

    try {
      setProcessing(true);
      const response = await tenantApiClient.post(`/admin/payment-verification/${payment.uuid}/approve`, {
        verification_notes: verificationNotes,
      }) as any;

      if (response && response.success) {
        toast.success('Payment approved successfully');
        onVerificationComplete();
      }
    } catch (error: any) {
      console.error('Failed to approve payment:', error);
      toast.error(error.message || 'Failed to approve payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!payment || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(true);
      const response = await tenantApiClient.post(`/admin/payment-verification/${payment.uuid}/reject`, {
        rejection_reason: rejectionReason,
      }) as any;

      if (response && response.success) {
        toast.success('Payment rejected');
        onVerificationComplete();
      }
    } catch (error: any) {
      console.error('Failed to reject payment:', error);
      toast.error(error.message || 'Failed to reject payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading payment details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payment) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Verification</DialogTitle>
          <DialogDescription>
            Review payment details and verify the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Info */}
          <div>
            <h3 className="font-semibold mb-2">Transaction Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Reference Number</p>
                <p className="font-medium">{payment.reference}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant="outline">{payment.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Quote Number</p>
                <p className="font-medium">{payment.quote_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Waiting Time</p>
                <p className="font-medium">{payment.waiting_time} ({payment.waiting_minutes} minutes)</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{payment.customer.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{payment.customer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{payment.customer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax ID (NPWP)</p>
                <p className="font-medium">{payment.customer.tax_id || 'N/A'}</p>
              </div>
              {payment.customer.address && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{payment.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Bank Transfer Details */}
          <div>
            <h3 className="font-semibold mb-2">Bank Transfer Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Destination Bank</p>
                <p className="font-medium">{payment.bank_details.destination_bank || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Number</p>
                <p className="font-medium">{payment.bank_details.destination_account_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Holder</p>
                <p className="font-medium">{payment.bank_details.destination_account_holder || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Transfer Date & Time</p>
                <p className="font-medium">
                  {payment.bank_details.transfer_datetime
                    ? new Date(payment.bank_details.transfer_datetime).toLocaleString('id-ID')
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Breakdown */}
          <div>
            <h3 className="font-semibold mb-2">Financial Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(payment.financial.subtotal, payment.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({payment.financial.tax_rate}%)</span>
                <span className="font-medium">{formatCurrency(payment.financial.tax_amount, payment.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping Cost</span>
                <span className="font-medium">{formatCurrency(payment.financial.shipping_cost, payment.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total</span>
                <span>{formatCurrency(payment.financial.grand_total, payment.currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Vendor Cost</span>
                <span>{formatCurrency(payment.financial.vendor_cost, payment.currency)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">Profit</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(payment.financial.profit_amount, payment.currency)} ({Number(payment.financial.profit_percentage || 0).toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Proof */}
          <div>
            <h3 className="font-semibold mb-2">Payment Proof</h3>
            {payment.payment_proof_url ? (
              <div className="space-y-2">
                <img
                  src={payment.payment_proof_url}
                  alt="Payment Proof"
                  className="w-full max-h-96 object-contain border rounded-lg"
                  onError={(e) => {
                    console.error('Image failed to load:', payment.payment_proof_url);
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" font-size="16"%3EImage failed to load%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Open base64 image in new tab
                      const newWindow = window.open();
                      if (newWindow) {
                        newWindow.document.write(`<img src="${payment.payment_proof_url}" style="max-width: 100%; height: auto;" />`);
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        // Convert base64 data URL to blob and download
                        const link = document.createElement('a');
                        link.href = payment.payment_proof_url!;
                        link.download = `payment-proof-${payment.reference}.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        toast.success('Download started');
                      } catch (error) {
                        console.error('Download failed:', error);
                        toast.error('Failed to download payment proof');
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No payment proof uploaded</p>
            )}
          </div>

          {payment.payment_notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Customer Notes</h3>
                <p className="text-sm text-muted-foreground">{payment.payment_notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Verification Actions */}
          {!showRejectForm ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
                <Textarea
                  id="verification-notes"
                  placeholder="Add any notes about this verification..."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  disabled={processing}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Approving...' : 'Approve Payment'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="rejection-reason">Rejection Reason (Required)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this payment is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="border-red-300 focus:border-red-500"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
