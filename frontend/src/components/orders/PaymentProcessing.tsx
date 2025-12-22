import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  CreditCard, 
  Calculator, 
  AlertTriangle, 
  CheckCircle2,
  Banknote,
  Clock,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { Order, PaymentType, PaymentMethod } from '@/types/order';
import { OrderWorkflow } from '@/utils/orderWorkflow';

interface PaymentProcessingProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onPaymentProcessed: (orderId: string, paymentData: any) => Promise<void>;
  isLoading?: boolean;
}

export function PaymentProcessing({
  order,
  isOpen,
  onClose,
  onPaymentProcessed,
  isLoading = false
}: PaymentProcessingProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.DP50);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.Cash);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [customerMarkupPrice, setCustomerMarkupPrice] = useState<string>(
    order.customerPrice?.toString() || order.totalAmount.toString()
  );
  const [vendorCost, setVendorCost] = useState<string>(
    order.vendorCost?.toString() || ''
  );

  // Calculate payment amounts based on payment type
  const calculatePaymentAmounts = () => {
    const totalAmount = parseFloat(customerMarkupPrice) || order.totalAmount;
    const { downPayment, remainingAmount } = OrderWorkflow.calculatePaymentAmounts(
      totalAmount,
      paymentType
    );
    return { downPayment, remainingAmount, totalAmount };
  };

  // Calculate profit information
  const calculateProfitInfo = () => {
    const customerTotal = parseFloat(customerMarkupPrice) || order.totalAmount;
    const vendorTotal = parseFloat(vendorCost) || 0;
    const markupAmount = customerTotal - vendorTotal;
    const markupPercentage = vendorTotal > 0 ? (markupAmount / vendorTotal) * 100 : 0;

    return {
      customerTotal,
      vendorTotal,
      markupAmount,
      markupPercentage
    };
  };

  const { downPayment, remainingAmount, totalAmount } = calculatePaymentAmounts();
  const { markupAmount, markupPercentage } = calculateProfitInfo();

  // Set default paid amount when payment type changes
  React.useEffect(() => {
    if (paymentType === PaymentType.DP50) {
      setPaidAmount(downPayment.toString());
    } else {
      setPaidAmount(totalAmount.toString());
    }
  }, [paymentType, downPayment, totalAmount]);

  const handlePaymentProcess = async () => {
    const paidAmountNum = parseFloat(paidAmount);
    
    if (!paidAmountNum || paidAmountNum <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    // Validate payment amount for DP 50%
    if (paymentType === PaymentType.DP50) {
      const minDP = totalAmount * 0.5;
      if (paidAmountNum < minDP) {
        toast.error(`Minimum DP is 50% (Rp ${minDP.toLocaleString('id-ID')})`);
        return;
      }
    }

    // Validate full payment
    if (paymentType === PaymentType.Full100) {
      if (paidAmountNum !== totalAmount) {
        toast.error(`Full payment must be exactly Rp ${totalAmount.toLocaleString('id-ID')}`);
        return;
      }
    }

    const paymentData = {
      paymentType,
      paymentMethod,
      paidAmount: paidAmountNum,
      remainingAmount: paymentType === PaymentType.DP50 ? totalAmount - paidAmountNum : 0,
      customerPrice: parseFloat(customerMarkupPrice),
      vendorCost: parseFloat(vendorCost) || 0,
      markupAmount,
      notes: paymentNotes
    };

    try {
      await onPaymentProcessed(order.uuid || order.id, paymentData);
      
      // Reset form
      setPaidAmount('');
      setPaymentNotes('');
      onClose();
      
      toast.success('Payment processed successfully');
    } catch (error) {
      toast.error('Failed to process payment', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Processing - Order #{order.orderNumber}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Process customer payment according to PT CEX business model (DP 50% vs Full 100%)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Customer:</span>
                  <p>{order.customerName}</p>
                  <p className="text-muted-foreground">{order.customerEmail}</p>
                </div>
                <div>
                  <span className="font-medium">Items:</span>
                  <p>{order.items.length} item(s)</p>
                </div>
                <div>
                  <span className="font-medium">Status:</span>
                  <p>{OrderWorkflow.getStatusInfo(order.status).label}</p>
                </div>
              </div>
              {order.vendorName && (
                <div className="mt-3 p-2 bg-blue-50 rounded">
                  <span className="font-medium text-blue-800">Assigned Vendor:</span>
                  <span className="ml-2 text-blue-700">{order.vendorName}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pricing Setup */}
                <div className="space-y-3">
                  <div>
                    <Label>Customer Price (Markup)</Label>
                    <Input
                      type="number"
                      placeholder="Customer total price"
                      value={customerMarkupPrice}
                      onChange={(e) => setCustomerMarkupPrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Final price including markup for customer
                    </p>
                  </div>

                  <div>
                    <Label>Vendor Cost</Label>
                    <Input
                      type="number"
                      placeholder="Vendor production cost"
                      value={vendorCost}
                      onChange={(e) => setVendorCost(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cost to pay vendor for production
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Payment Type Selection */}
                <div>
                  <Label>Payment Type</Label>
                  <Select 
                    value={paymentType} 
                    onValueChange={(value) => setPaymentType(value as PaymentType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentType.DP50}>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <div>
                            <div className="font-medium">DP 50% - Account Payable</div>
                            <div className="text-xs text-muted-foreground">
                              Minimum 50% down payment, remaining after completion
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentType.Full100}>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <div>
                            <div className="font-medium">Full 100% - Account Receivable</div>
                            <div className="text-xs text-muted-foreground">
                              Complete payment upfront
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method */}
                <div>
                  <Label>Payment Method</Label>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PaymentMethod.Cash}>
                        <div className="flex items-center gap-2">
                          <Banknote className="w-4 h-4" />
                          Cash Payment
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentMethod.BankTransfer}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Bank Transfer
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentMethod.CreditCard}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Credit Card
                        </div>
                      </SelectItem>
                      <SelectItem value={PaymentMethod.Midtrans}>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Midtrans Gateway
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Paid Amount */}
                <div>
                  <Label>Amount Paid</Label>
                  <Input
                    type="number"
                    placeholder="Amount received from customer"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                {/* Payment Notes */}
                <div>
                  <Label>Payment Notes</Label>
                  <Textarea
                    placeholder="Add notes about payment verification, reference numbers, etc..."
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary & Business Logic */}
            <div className="space-y-4">
              {/* Profit Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Profitability Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Customer Price:</span>
                      <span className="font-semibold">
                        Rp {parseFloat(customerMarkupPrice || '0').toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Vendor Cost:</span>
                      <span className="font-medium text-red-600">
                        -Rp {parseFloat(vendorCost || '0').toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Gross Profit:</span>
                      <span className="font-bold text-green-600">
                        Rp {markupAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <span className="font-medium text-green-600">
                        {markupPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Payment Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold">
                        Rp {totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                    {paymentType === PaymentType.DP50 ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">DP (50% minimum):</span>
                          <span className="font-medium text-amber-600">
                            Rp {downPayment.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className="font-medium text-orange-600">
                            Rp {remainingAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="p-2 bg-amber-50 rounded text-xs text-amber-700">
                          <strong>Account Payable:</strong> Customer will pay remaining amount after production completion
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Full Payment:</span>
                          <span className="font-medium text-green-600">
                            Rp {totalAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="p-2 bg-green-50 rounded text-xs text-green-700">
                          <strong>Account Receivable:</strong> Full payment received upfront
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Validation */}
              {paidAmount && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {parseFloat(paidAmount) >= downPayment ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      )}
                      Payment Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount Paid:</span>
                        <span className="font-medium">
                          Rp {parseFloat(paidAmount).toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      {paymentType === PaymentType.DP50 && (
                        <>
                          <div className="flex justify-between">
                            <span>Required Minimum (50%):</span>
                            <span>Rp {downPayment.toLocaleString('id-ID')}</span>
                          </div>
                          {parseFloat(paidAmount) >= downPayment ? (
                            <div className="p-2 bg-green-50 text-green-700 rounded text-xs">
                              ✓ DP requirement satisfied
                            </div>
                          ) : (
                            <div className="p-2 bg-red-50 text-red-700 rounded text-xs">
                              ✗ Amount below minimum DP requirement
                            </div>
                          )}
                        </>
                      )}

                      {paymentType === PaymentType.Full100 && (
                        <>
                          {parseFloat(paidAmount) === totalAmount ? (
                            <div className="p-2 bg-green-50 text-green-700 rounded text-xs">
                              ✓ Full payment received
                            </div>
                          ) : (
                            <div className="p-2 bg-red-50 text-red-700 rounded text-xs">
                              ✗ Must pay exact total amount for full payment
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Business Process Information */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">PT CEX Business Process</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700 text-sm">
              <ul className="space-y-1">
                <li>• DP 50%: Customer pays minimum 50%, remaining after production completion</li>
                <li>• Full 100%: Customer pays complete amount upfront, production starts immediately</li>
                <li>• Vendor payment: Coordinated with customer payment schedule</li>
                <li>• Profit tracking: Real-time calculation of markup vs vendor cost</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handlePaymentProcess}
            disabled={!paidAmount || parseFloat(paidAmount) <= 0 || isLoading}
          >
            {isLoading ? 'Processing...' : 'Process Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PaymentProcessing;