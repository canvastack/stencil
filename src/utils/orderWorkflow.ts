import { OrderStatus, PaymentType } from '@/types/order';

/**
 * PT CEX Business Workflow - Order Status Transitions
 * Based on docs/ARCHITECTURE/BUSINESS_HEXAGONAL_PLAN/BUSINESS_CYCLE_PLAN.md
 */
export class OrderWorkflow {
  /**
   * Valid status transitions according to PT CEX business cycle
   */
  private static readonly ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.Draft]: [OrderStatus.Pending],
    
    [OrderStatus.Pending]: [
      OrderStatus.VendorSourcing,  // Choose vendor path
      OrderStatus.CustomerQuote,   // Skip vendor (direct internal quote)
      OrderStatus.Cancelled        // Cancel if needed
    ],
    
    [OrderStatus.VendorSourcing]: [
      OrderStatus.VendorNegotiation,
      OrderStatus.Cancelled
    ],
    
    [OrderStatus.VendorNegotiation]: [
      OrderStatus.CustomerQuote,    // Vendor accepted, create customer quote
      OrderStatus.VendorSourcing,   // Vendor rejected, find new vendor
      OrderStatus.Cancelled         // Cancel if no suitable vendor
    ],
    
    [OrderStatus.CustomerQuote]: [
      OrderStatus.AwaitingPayment,  // Customer accepted quote
      OrderStatus.VendorNegotiation, // Customer requested changes
      OrderStatus.Cancelled         // Customer rejected
    ],
    
    [OrderStatus.AwaitingPayment]: [
      OrderStatus.PartialPayment,   // Customer paid DP 50%
      OrderStatus.FullPayment,      // Customer paid Full 100%
      OrderStatus.Cancelled         // Customer cancelled
    ],
    
    [OrderStatus.PartialPayment]: [
      OrderStatus.InProduction,     // Production started after DP
      OrderStatus.Cancelled         // Can still cancel with DP refund
    ],
    
    [OrderStatus.FullPayment]: [
      OrderStatus.InProduction      // Production started after full payment
    ],
    
    [OrderStatus.InProduction]: [
      OrderStatus.QualityControl    // Production completed
    ],
    
    [OrderStatus.QualityControl]: [
      OrderStatus.Shipping,         // Quality passed
      OrderStatus.InProduction      // Quality failed, back to production
    ],
    
    [OrderStatus.Shipping]: [
      OrderStatus.Completed         // Delivered to customer
    ],
    
    [OrderStatus.Completed]: [
      OrderStatus.Refunded          // Only if issues found later
    ],
    
    [OrderStatus.Cancelled]: [],    // Terminal state
    [OrderStatus.Refunded]: []      // Terminal state
  };

  /**
   * Check if status transition is valid
   */
  static canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const allowedTransitions = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get all valid next statuses for current status
   */
  static getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    return this.ALLOWED_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Get status display information
   */
  static getStatusInfo(status: OrderStatus): { 
    label: string; 
    description: string; 
    color: string;
    phase: string;
  } {
    const statusMap = {
      [OrderStatus.Draft]: {
        label: 'Draft',
        description: 'Order being prepared by admin',
        color: 'bg-gray-100 text-gray-800',
        phase: 'Initial'
      },
      [OrderStatus.Pending]: {
        label: 'Pending Review',
        description: 'Order submitted, waiting for admin review',
        color: 'bg-yellow-100 text-yellow-800',
        phase: 'Initial'
      },
      [OrderStatus.VendorSourcing]: {
        label: 'Sourcing Vendor',
        description: 'Finding suitable vendor for production',
        color: 'bg-blue-100 text-blue-800',
        phase: 'Vendor'
      },
      [OrderStatus.VendorNegotiation]: {
        label: 'Vendor Negotiation',
        description: 'Negotiating price and terms with vendor',
        color: 'bg-purple-100 text-purple-800',
        phase: 'Vendor'
      },
      [OrderStatus.CustomerQuote]: {
        label: 'Customer Quotation',
        description: 'Quote sent to customer for approval',
        color: 'bg-indigo-100 text-indigo-800',
        phase: 'Customer'
      },
      [OrderStatus.AwaitingPayment]: {
        label: 'Awaiting Payment',
        description: 'Waiting for customer payment (DP 50% or Full 100%)',
        color: 'bg-orange-100 text-orange-800',
        phase: 'Payment'
      },
      [OrderStatus.PartialPayment]: {
        label: 'DP Received (50%)',
        description: 'Down payment received - Account Payable',
        color: 'bg-amber-100 text-amber-800',
        phase: 'Payment'
      },
      [OrderStatus.FullPayment]: {
        label: 'Full Payment',
        description: 'Full payment received - Account Receivable',
        color: 'bg-green-100 text-green-800',
        phase: 'Payment'
      },
      [OrderStatus.InProduction]: {
        label: 'In Production',
        description: 'Order being manufactured by vendor/internal',
        color: 'bg-blue-100 text-blue-800',
        phase: 'Production'
      },
      [OrderStatus.QualityControl]: {
        label: 'Quality Control',
        description: 'Production completed, quality checking',
        color: 'bg-purple-100 text-purple-800',
        phase: 'Production'
      },
      [OrderStatus.Shipping]: {
        label: 'Shipping',
        description: 'Order shipped to customer',
        color: 'bg-indigo-100 text-indigo-800',
        phase: 'Delivery'
      },
      [OrderStatus.Completed]: {
        label: 'Completed',
        description: 'Order delivered successfully',
        color: 'bg-green-100 text-green-800',
        phase: 'Complete'
      },
      [OrderStatus.Cancelled]: {
        label: 'Cancelled',
        description: 'Order cancelled by customer or admin',
        color: 'bg-red-100 text-red-800',
        phase: 'Cancelled'
      },
      [OrderStatus.Refunded]: {
        label: 'Refunded',
        description: 'Order refunded to customer',
        color: 'bg-gray-100 text-gray-800',
        phase: 'Refunded'
      }
    };

    return statusMap[status] || {
      label: status,
      description: 'Unknown status',
      color: 'bg-gray-100 text-gray-800',
      phase: 'Unknown'
    };
  }

  /**
   * Calculate payment amounts based on payment type
   */
  static calculatePaymentAmounts(
    totalAmount: number, 
    paymentType: PaymentType
  ): { downPayment: number; remainingAmount: number } {
    if (paymentType === PaymentType.DP50) {
      const downPayment = Math.round(totalAmount * 0.5);
      return {
        downPayment,
        remainingAmount: totalAmount - downPayment
      };
    } else {
      return {
        downPayment: totalAmount,
        remainingAmount: 0
      };
    }
  }

  /**
   * Validate business rules for status transitions
   */
  static validateTransition(
    currentStatus: OrderStatus, 
    newStatus: OrderStatus,
    orderData: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if transition is allowed
    if (!this.canTransitionTo(currentStatus, newStatus)) {
      errors.push(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    // Business rule validations
    switch (newStatus) {
      case OrderStatus.VendorNegotiation:
        if (!orderData.vendorId) {
          errors.push('Vendor must be selected before negotiation');
        }
        break;

      case OrderStatus.CustomerQuote:
        if (!orderData.vendorCost && !orderData.customerPrice) {
          errors.push('Pricing information required before customer quote');
        }
        break;

      case OrderStatus.PartialPayment:
      case OrderStatus.FullPayment:
        if (!orderData.paymentType) {
          errors.push('Payment type must be specified');
        }
        break;

      case OrderStatus.InProduction:
        if (!orderData.productionStart) {
          errors.push('Production start date must be set');
        }
        break;

      case OrderStatus.Shipping:
        if (!orderData.shippingAddress) {
          errors.push('Shipping address required');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get required actions for status transition
   */
  static getRequiredActions(newStatus: OrderStatus): string[] {
    const actionMap: Record<OrderStatus, string[]> = {
      [OrderStatus.VendorSourcing]: ['Select vendor from database', 'Send RFQ to vendor'],
      [OrderStatus.VendorNegotiation]: ['Update vendor pricing', 'Set production timeline'],
      [OrderStatus.CustomerQuote]: ['Calculate markup price', 'Generate customer quote'],
      [OrderStatus.AwaitingPayment]: ['Send invoice to customer', 'Set payment deadline'],
      [OrderStatus.PartialPayment]: ['Verify DP payment', 'Update payment records'],
      [OrderStatus.FullPayment]: ['Verify full payment', 'Update payment records'],
      [OrderStatus.InProduction]: ['Notify vendor to start', 'Set production timeline'],
      [OrderStatus.QualityControl]: ['Inspect quality', 'Approve/reject production'],
      [OrderStatus.Shipping]: ['Arrange shipping', 'Generate tracking number'],
      [OrderStatus.Completed]: ['Confirm delivery', 'Request customer feedback'],
      [OrderStatus.Cancelled]: ['Process cancellation', 'Handle refunds if needed'],
      [OrderStatus.Refunded]: ['Process refund', 'Update financial records']
    };

    return actionMap[newStatus] || [];
  }
}

export default OrderWorkflow;