import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { Order, OrderStatus, PaymentType } from '@/types/order';
import { OrderWorkflow } from '@/utils/orderWorkflow';
import { toast } from 'sonner';

interface OrderStatusTransitionProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onTransition: (orderId: string, newStatus: OrderStatus, notes: string) => Promise<void>;
  isLoading?: boolean;
}

export function OrderStatusTransition({
  order,
  isOpen,
  onClose,
  onTransition,
  isLoading = false
}: OrderStatusTransitionProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [notes, setNotes] = useState('');

  const currentStatusInfo = OrderWorkflow.getStatusInfo(order.status);
  const validNextStatuses = OrderWorkflow.getValidNextStatuses(order.status);

  const handleTransition = async () => {
    if (!selectedStatus) {
      toast.error('Please select a status to transition to');
      return;
    }

    // Validate business rules
    const validation = OrderWorkflow.validateTransition(
      order.status,
      selectedStatus as OrderStatus,
      order
    );

    if (!validation.valid) {
      toast.error('Invalid transition', {
        description: validation.errors.join(', ')
      });
      return;
    }

    try {
      await onTransition(order.uuid || order.id, selectedStatus as OrderStatus, notes);
      setSelectedStatus('');
      setNotes('');
      onClose();
      toast.success('Order status updated successfully');
    } catch (error) {
      toast.error('Failed to update status', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getRequiredActions = () => {
    if (!selectedStatus) return [];
    return OrderWorkflow.getRequiredActions(selectedStatus as OrderStatus);
  };

  const getStatusPreview = (status: OrderStatus) => {
    const statusInfo = OrderWorkflow.getStatusInfo(status);
    return (
      <div className="flex items-center gap-2">
        <Badge className={statusInfo.color}>
          {statusInfo.label}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {statusInfo.phase} Phase
        </span>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-2">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {getStatusPreview(order.status)}
              <div className="text-sm text-muted-foreground ml-auto">
                Order #{order.orderNumber}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentStatusInfo.description}
            </p>
          </div>

          {/* Transition Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-muted-foreground" />
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status..." />
              </SelectTrigger>
              <SelectContent>
                {validNextStatuses.map(status => {
                  const statusInfo = OrderWorkflow.getStatusInfo(status);
                  return (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <span>{statusInfo.label}</span>
                        <span className="text-xs text-muted-foreground">
                          ({statusInfo.phase})
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedStatus && (
              <div className="p-3 border rounded-lg bg-blue-50">
                {getStatusPreview(selectedStatus as OrderStatus)}
                <p className="text-sm text-muted-foreground mt-2">
                  {OrderWorkflow.getStatusInfo(selectedStatus as OrderStatus).description}
                </p>
              </div>
            )}
          </div>

          {/* Required Actions */}
          {selectedStatus && getRequiredActions().length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Required Actions
              </Label>
              <div className="p-3 border rounded-lg bg-orange-50">
                <ul className="space-y-1">
                  {getRequiredActions().map((action, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Payment Type Warning for Payment Statuses */}
          {selectedStatus && (
            selectedStatus === OrderStatus.PartialPayment || 
            selectedStatus === OrderStatus.FullPayment
          ) && !order.paymentType && (
            <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Payment Type Required</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                You need to set payment type (DP 50% or Full 100%) before transitioning to this status.
                Please update the order details first.
              </p>
            </div>
          )}

          {/* Vendor Assignment Warning */}
          {selectedStatus === OrderStatus.VendorNegotiation && !order.vendorId && (
            <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Vendor Assignment Required</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                A vendor must be assigned before starting negotiations.
              </p>
            </div>
          )}

          {/* Transition Notes */}
          <div className="space-y-2">
            <Label>Transition Notes</Label>
            <Textarea
              placeholder="Add notes about this status change..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Business Cycle Information */}
          <div className="p-3 border rounded-lg bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Clock className="w-4 h-4" />
              PT CEX Business Workflow
            </div>
            <div className="text-xs text-muted-foreground">
              This order follows the complete etching business cycle from customer intake 
              through vendor sourcing, payment processing (DP 50% vs Full 100%), 
              production monitoring, to final delivery.
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransition} 
            disabled={!selectedStatus || isLoading}
          >
            {isLoading ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderStatusTransition;