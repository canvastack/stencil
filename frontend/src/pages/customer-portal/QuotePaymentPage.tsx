import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { customerPortalApi } from '@/services/api/customerPortalApi';
import { useCustomerAuth } from '@/contexts/CustomerAuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Label,
  Textarea,
} from '@/components/ui/lazy-components';
import {
  CreditCard,
  Building2,
  Wallet,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  Copy,
  Upload,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/currency';

type PaymentMethod = 'midtrans' | 'xendit' | 'bank_transfer';

interface BankAccount {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

const BANK_ACCOUNTS: BankAccount[] = [
  {
    bank_name: 'BCA',
    account_number: '1234567890',
    account_holder: 'PT Custom Etching Xenial',
  },
  {
    bank_name: 'Mandiri',
    account_number: '0987654321',
    account_holder: 'PT Custom Etching Xenial',
  },
  {
    bank_name: 'BNI',
    account_number: '5555666677',
    account_holder: 'PT Custom Etching Xenial',
  },
];

export default function QuotePaymentPage() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { customer } = useCustomerAuth();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBankTransferModal, setShowBankTransferModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null);
  const [transferProof, setTransferProof] = useState<File | null>(null);
  const [transferNotes, setTransferNotes] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [transferTime, setTransferTime] = useState(new Date().toTimeString().slice(0, 5));

  // Fetch quote details
  const { data: quoteData, isLoading } = useQuery({
    queryKey: ['quote-payment', uuid],
    queryFn: async () => {
      const response = await customerPortalApi.getMyQuoteById(uuid!);
      return response.data;
    },
    enabled: !!uuid,
  });

  const quote = quoteData?.data;

  /**
   * Handle payment method selection
   */
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };

  /**
   * Copy to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  /**
   * Handle file upload
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      setTransferProof(file);
    }
  };

  /**
   * Submit bank transfer proof
   */
  const submitBankTransferMutation = useMutation({
    mutationFn: async () => {
      if (!transferProof) {
        throw new Error('Please upload transfer proof');
      }
      if (!selectedBank) {
        throw new Error('Please select destination bank account');
      }

      const formData = new FormData();
      formData.append('quote_uuid', uuid!);
      formData.append('payment_method', 'bank_transfer');
      formData.append('transfer_proof', transferProof);
      formData.append('notes', transferNotes);
      formData.append('amount', grandTotal.toString());
      formData.append('destination_bank', selectedBank.bank_name);
      formData.append('destination_account_number', selectedBank.account_number);
      formData.append('destination_account_holder', selectedBank.account_holder);
      formData.append('transfer_date', transferDate);
      formData.append('transfer_time', transferTime);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/public/customers/quotes/payment/bank-transfer`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('customer_auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit payment proof');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Payment proof submitted successfully! We will verify within 1-2 hours.');
      setShowBankTransferModal(false);
      navigate(`/customer/quotes/${uuid}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit payment proof');
    },
  });

  /**
   * Process payment
   */
  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // For bank transfer, show modal with bank details
    if (selectedMethod === 'bank_transfer') {
      setShowBankTransferModal(true);
      return;
    }

    setIsProcessing(true);

    try {
      // TODO: Implement actual payment gateway integration
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      toast.success('Payment initiated successfully!');
      navigate(`/customer/quotes/${uuid}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-4 md:p-6">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h3 className="text-lg font-semibold mb-2">Quote Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The quote you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/customer/quotes')}>
              Back to Quotes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const grandTotal = quote.pricing?.grand_total || 0;
  const currency = quote.pricing?.currency || 'IDR';

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/customer/quotes/${uuid}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quote
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Methods - Left Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose how you'd like to pay for this quote
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Midtrans */}
              <button
                onClick={() => handleMethodSelect('midtrans')}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  "hover:border-primary hover:bg-accent",
                  selectedMethod === 'midtrans'
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">Midtrans Payment Gateway</h3>
                      {selectedMethod === 'midtrans' && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Credit Card, Debit Card, E-Wallet (GoPay, OVO, DANA)
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">Instant</Badge>
                      <Badge variant="secondary" className="text-xs">Secure</Badge>
                    </div>
                  </div>
                </div>
              </button>

              {/* Xendit */}
              <button
                onClick={() => handleMethodSelect('xendit')}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  "hover:border-primary hover:bg-accent",
                  selectedMethod === 'xendit'
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Wallet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">Xendit Payment</h3>
                      {selectedMethod === 'xendit' && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Virtual Account, E-Wallet, QRIS, Retail Outlets
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">Flexible</Badge>
                      <Badge variant="secondary" className="text-xs">Multiple Options</Badge>
                    </div>
                  </div>
                </div>
              </button>

              {/* Bank Transfer */}
              <button
                onClick={() => handleMethodSelect('bank_transfer')}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all text-left",
                  "hover:border-primary hover:bg-accent",
                  selectedMethod === 'bank_transfer'
                    ? "border-primary bg-accent"
                    : "border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <Building2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">Bank Transfer</h3>
                      {selectedMethod === 'bank_transfer' && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      BCA, Mandiri, BNI, BRI - Manual verification
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        1-2 hours
                      </Badge>
                      <Badge variant="secondary" className="text-xs">Manual</Badge>
                    </div>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Secure Payment</h4>
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary - Right Column */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quote Info */}
              <div>
                <p className="text-sm text-muted-foreground">Quote Number</p>
                <p className="font-semibold">{quote.quote_number}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{customer?.name}</p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(quote.pricing?.subtotal || 0, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax ({quote.pricing?.tax_rate}%)</span>
                  <span>{formatCurrency(quote.pricing?.tax_amount || 0, currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatCurrency(quote.pricing?.shipping_cost || 0, currency)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(grandTotal, currency)}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay {formatCurrency(grandTotal, currency)}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By proceeding, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bank Transfer Modal */}
      <Dialog open={showBankTransferModal} onOpenChange={setShowBankTransferModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bank Transfer Payment</DialogTitle>
            <DialogDescription>
              Transfer to one of our bank accounts and upload the proof
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bank Accounts */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Select Destination Bank Account *</h3>
              {BANK_ACCOUNTS.map((bank, index) => (
                <Card 
                  key={index}
                  className={cn(
                    "border-2 transition-all cursor-pointer hover:border-primary",
                    selectedBank?.bank_name === bank.bank_name 
                      ? "border-primary bg-primary/5" 
                      : "border-border"
                  )}
                  onClick={() => setSelectedBank(bank)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          <span className="font-bold text-lg">{bank.bank_name}</span>
                          {selectedBank?.bank_name === bank.bank_name && (
                            <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Account Number</p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono text-lg font-semibold">{bank.account_number}</p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(bank.account_number)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Account Holder</p>
                          <p className="font-semibold">{bank.account_holder}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Transfer Amount */}
            <Card className="bg-primary/5 border-primary">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Transfer Amount</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(grandTotal, currency)}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(grandTotal.toString())}
                    className="mt-2"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Amount
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upload Proof */}
            <div className="space-y-3">
              <Label htmlFor="transfer-proof">Upload Transfer Proof *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Input
                  id="transfer-proof"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="transfer-proof"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {transferProof ? (
                    <>
                      <FileText className="w-12 h-12 text-green-600" />
                      <p className="font-semibold">{transferProof.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(transferProof.size / 1024).toFixed(2)} KB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <p className="font-semibold">Click to upload transfer proof</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Transfer Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="transfer-date">Transfer Date *</Label>
                <Input
                  id="transfer-date"
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transfer-time">Transfer Time *</Label>
                <Input
                  id="transfer-time"
                  type="time"
                  value={transferTime}
                  onChange={(e) => setTransferTime(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="transfer-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="transfer-notes"
                placeholder="e.g., Transfer from account ending in 1234"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Instructions */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Important Instructions
                </h4>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Transfer the EXACT amount shown above</li>
                  <li>Upload clear photo of transfer receipt</li>
                  <li>Verification takes 1-2 hours during business hours</li>
                  <li>You'll receive confirmation via email and notification</li>
                </ul>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBankTransferModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => submitBankTransferMutation.mutate()}
                disabled={!transferProof || !selectedBank || submitBankTransferMutation.isPending}
                className="flex-1"
              >
                {submitBankTransferMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Submit Payment Proof
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
