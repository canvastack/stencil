import React, { useState, useEffect } from 'react';
import { usePaymentStore } from '@/stores/paymentStore';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  FileText,
  Calculator,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { Payment, CreatePaymentRequest } from '@/services/tenant/paymentService';
import { formatCurrency } from '@/utils/currency';

interface PaymentFormProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  invoiceId?: string;
  orderId?: string;
  customerId?: string;
  initialAmount?: number;
  onSuccess?: (payment: Payment) => void;
  onCancel?: () => void;
  mode?: 'create' | 'from_invoice' | 'from_order';
}

const paymentMethodConfig = {
  bank_transfer: {
    label: 'Bank Transfer',
    icon: Building,
    description: 'Transfer via bank account',
    fields: ['bank_name', 'account_number', 'account_holder_name'],
    color: 'bg-blue-100 text-blue-800',
  },
  credit_card: {
    label: 'Credit Card',
    icon: CreditCard,
    description: 'Visa, Mastercard, American Express',
    fields: ['card_number', 'card_expiry', 'card_cvv'],
    color: 'bg-green-100 text-green-800',
  },
  debit_card: {
    label: 'Debit Card',
    icon: CreditCard,
    description: 'Debit card payment',
    fields: ['card_number', 'card_expiry', 'card_cvv'],
    color: 'bg-purple-100 text-purple-800',
  },
  cash: {
    label: 'Cash',
    icon: Banknote,
    description: 'Cash payment',
    fields: [],
    color: 'bg-yellow-100 text-yellow-800',
  },
  check: {
    label: 'Check',
    icon: FileText,
    description: 'Check payment',
    fields: ['check_number', 'bank_name'],
    color: 'bg-gray-100 text-gray-800',
  },
  digital_wallet: {
    label: 'Digital Wallet',
    icon: Smartphone,
    description: 'E-wallet payment',
    fields: ['wallet_provider', 'wallet_account'],
    color: 'bg-orange-100 text-orange-800',
  },
  gopay: {
    label: 'GoPay',
    icon: Smartphone,
    description: 'GoPay payment',
    fields: ['phone_number'],
    color: 'bg-green-100 text-green-800',
  },
  ovo: {
    label: 'OVO',
    icon: Smartphone,
    description: 'OVO payment',
    fields: ['phone_number'],
    color: 'bg-purple-100 text-purple-800',
  },
  dana: {
    label: 'DANA',
    icon: Smartphone,
    description: 'DANA payment',
    fields: ['phone_number'],
    color: 'bg-blue-100 text-blue-800',
  },
  shopeepay: {
    label: 'ShopeePay',
    icon: Smartphone,
    description: 'ShopeePay payment',
    fields: ['phone_number'],
    color: 'bg-orange-100 text-orange-800',
  },
  paypal: {
    label: 'PayPal',
    icon: CreditCard,
    description: 'PayPal payment',
    fields: ['paypal_email'],
    color: 'bg-blue-100 text-blue-800',
  },
  crypto: {
    label: 'Cryptocurrency',
    icon: DollarSign,
    description: 'Bitcoin, Ethereum, etc.',
    fields: ['crypto_type', 'wallet_address'],
    color: 'bg-yellow-100 text-yellow-800',
  },
};

export const PaymentForm = ({
  open = false,
  onOpenChange,
  invoiceId,
  orderId,
  customerId,
  initialAmount,
  onSuccess,
  onCancel,
  mode = 'create'
}: PaymentFormProps) => {
  const { toast } = useToast();
  
  const {
    loading,
    paymentGateways,
    createPayment,
    createFromInvoice,
    createFromOrder,
    fetchPaymentGateways,
  } = usePaymentStore();
  
  const { fetchInvoice } = useInvoiceStore();

  const [formData, setFormData] = useState<Partial<CreatePaymentRequest>>({
    amount: initialAmount || 0,
    currency: 'IDR',
    payment_method: 'bank_transfer',
    auto_verify: false,
  });
  
  const [paymentDetails, setPaymentDetails] = useState<Record<string, any>>({});
  const [selectedGateway, setSelectedGateway] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [invoice, setInvoice] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);

  // Load payment gateways and related data on mount
  useEffect(() => {
    fetchPaymentGateways();
    
    if (invoiceId && mode === 'from_invoice') {
      fetchInvoice(invoiceId).then((invoiceData) => {
        if (invoiceData) {
          setInvoice(invoiceData);
          setFormData(prev => ({
            ...prev,
            customer_id: invoiceData.customer_id,
            amount: initialAmount || invoiceData.balance_due,
            description: `Payment for Invoice ${invoiceData.invoice_number}`,
          }));
        }
      });
    }
    
    if (customerId) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
      }));
    }
  }, [fetchPaymentGateways, fetchInvoice, invoiceId, orderId, customerId, initialAmount, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePaymentDetailsChange = (field: string, value: any) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    // Validate payment method specific fields
    const method = formData.payment_method;
    if (method && paymentMethodConfig[method]) {
      const requiredFields = paymentMethodConfig[method].fields;
      requiredFields.forEach(field => {
        if (!paymentDetails[field]) {
          newErrors[field] = `${field.replace('_', ' ')} is required for ${paymentMethodConfig[method].label}`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const paymentData = {
        ...formData,
        ...paymentDetails,
        payment_gateway: selectedGateway || undefined,
      } as CreatePaymentRequest;

      let payment: Payment | null = null;

      if (mode === 'from_invoice' && invoiceId) {
        payment = await createFromInvoice(invoiceId, {
          payment_method: paymentData.payment_method!,
          payment_gateway: paymentData.payment_gateway,
          amount: paymentData.amount,
          notes: paymentData.notes,
          auto_verify: paymentData.auto_verify,
        });
      } else if (mode === 'from_order' && orderId) {
        payment = await createFromOrder(orderId, {
          payment_method: paymentData.payment_method!,
          payment_gateway: paymentData.payment_gateway,
          amount: paymentData.amount,
          notes: paymentData.notes,
          auto_verify: paymentData.auto_verify,
        });
      } else {
        payment = await createPayment(paymentData);
      }

      if (payment) {
        toast({
          title: 'Success',
          description: 'Payment created successfully',
        });
        onSuccess?.(payment);
        onOpenChange?.(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create payment',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      amount: initialAmount || 0,
      currency: 'IDR',
      payment_method: 'bank_transfer',
      auto_verify: false,
    });
    setPaymentDetails({});
    setErrors({});
    onCancel?.();
    onOpenChange?.(false);
  };

  const renderPaymentMethodFields = () => {
    const method = formData.payment_method;
    if (!method || !paymentMethodConfig[method]) return null;

    const config = paymentMethodConfig[method];
    
    return (
      <div className="space-y-4">
        {config.fields.includes('bank_name') && (
          <div className="space-y-2">
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input
              id="bank_name"
              value={paymentDetails.bank_name || ''}
              onChange={(e) => handlePaymentDetailsChange('bank_name', e.target.value)}
              placeholder="Enter bank name"
              className={errors.bank_name ? 'border-destructive' : ''}
            />
            {errors.bank_name && (
              <p className="text-sm text-destructive">{errors.bank_name}</p>
            )}
          </div>
        )}

        {config.fields.includes('account_number') && (
          <div className="space-y-2">
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              value={paymentDetails.account_number || ''}
              onChange={(e) => handlePaymentDetailsChange('account_number', e.target.value)}
              placeholder="Enter account number"
              className={errors.account_number ? 'border-destructive' : ''}
            />
            {errors.account_number && (
              <p className="text-sm text-destructive">{errors.account_number}</p>
            )}
          </div>
        )}

        {config.fields.includes('account_holder_name') && (
          <div className="space-y-2">
            <Label htmlFor="account_holder_name">Account Holder Name</Label>
            <Input
              id="account_holder_name"
              value={paymentDetails.account_holder_name || ''}
              onChange={(e) => handlePaymentDetailsChange('account_holder_name', e.target.value)}
              placeholder="Enter account holder name"
              className={errors.account_holder_name ? 'border-destructive' : ''}
            />
            {errors.account_holder_name && (
              <p className="text-sm text-destructive">{errors.account_holder_name}</p>
            )}
          </div>
        )}

        {config.fields.includes('phone_number') && (
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={paymentDetails.phone_number || ''}
              onChange={(e) => handlePaymentDetailsChange('phone_number', e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone_number ? 'border-destructive' : ''}
            />
            {errors.phone_number && (
              <p className="text-sm text-destructive">{errors.phone_number}</p>
            )}
          </div>
        )}

        {config.fields.includes('wallet_provider') && (
          <div className="space-y-2">
            <Label htmlFor="wallet_provider">Wallet Provider</Label>
            <Select
              value={paymentDetails.wallet_provider || ''}
              onValueChange={(value) => handlePaymentDetailsChange('wallet_provider', value)}
            >
              <SelectTrigger className={errors.wallet_provider ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select wallet provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gopay">GoPay</SelectItem>
                <SelectItem value="ovo">OVO</SelectItem>
                <SelectItem value="dana">DANA</SelectItem>
                <SelectItem value="shopeepay">ShopeePay</SelectItem>
                <SelectItem value="linkaja">LinkAja</SelectItem>
                <SelectItem value="jenius">Jenius</SelectItem>
              </SelectContent>
            </Select>
            {errors.wallet_provider && (
              <p className="text-sm text-destructive">{errors.wallet_provider}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderPaymentGateways = () => {
    const method = formData.payment_method;
    const availableGateways = paymentGateways.filter(gateway => 
      gateway.status === 'active' && 
      gateway.supported_methods.includes(method!)
    );

    if (availableGateways.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label htmlFor="gateway">Payment Gateway (Optional)</Label>
        <Select
          value={selectedGateway}
          onValueChange={setSelectedGateway}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select payment gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Gateway (Manual)</SelectItem>
            {availableGateways.map((gateway) => (
              <SelectItem key={gateway.id} value={gateway.id}>
                {gateway.name} - {gateway.provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'from_invoice' && 'Create Payment from Invoice'}
            {mode === 'from_order' && 'Create Payment from Order'}
            {mode === 'create' && 'Create New Payment'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'from_invoice' && invoice && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Invoice: {invoice.invoice_number}</span>
                  <Badge variant="outline">
                    {formatCurrency(invoice.balance_due)} remaining
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Customer: {invoice.customer_name}
                </p>
              </div>
            )}
            {mode === 'create' && 'Create a new payment record for processing.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className={errors.amount ? 'border-destructive' : ''}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency || 'IDR'}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="SGD">SGD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Payment description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Payment Method</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(paymentMethodConfig).map(([method, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.payment_method === method;
                    
                    return (
                      <Card
                        key={method}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? 'ring-2 ring-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleInputChange('payment_method', method)}
                      >
                        <CardContent className="p-4 text-center">
                          <Icon className="w-6 h-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {config.description}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {renderPaymentMethodFields()}
              {renderPaymentGateways()}
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle 
                className="text-lg cursor-pointer flex items-center justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                Advanced Options
                <Button variant="ghost" size="sm">
                  {showAdvanced ? 'Hide' : 'Show'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_verify"
                    checked={formData.auto_verify || false}
                    onCheckedChange={(checked) => handleInputChange('auto_verify', checked)}
                  />
                  <Label htmlFor="auto_verify">Auto-verify payment</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Scheduled Date (Optional)</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={formData.scheduled_date || ''}
                    onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};