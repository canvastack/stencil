/**
 * Order Progress Calculator
 * 
 * Calculates order progress based on business workflow
 * Provides stage mapping, completion percentage, and business flow logic
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All calculations based on real order status
 * - ✅ BUSINESS ALIGNMENT: Follows business cycle plan
 * - ✅ STATUS CONSISTENCY: Uses backend-aligned OrderStatus enum
 * - ✅ GENERIC NAMING: Scalable for multi-tenant use
 */

import { OrderStatus } from '@/types/order';

export enum BusinessStage {
  DRAFT = 'draft',
  PENDING = 'pending',
  VENDOR_SOURCING = 'vendor_sourcing',
  VENDOR_NEGOTIATION = 'vendor_negotiation',
  CUSTOMER_QUOTE = 'customer_quote',
  AWAITING_PAYMENT = 'awaiting_payment',
  PARTIAL_PAYMENT = 'partial_payment',
  FULL_PAYMENT = 'full_payment',
  IN_PRODUCTION = 'in_production',
  QUALITY_CONTROL = 'quality_control',
  SHIPPING = 'shipping',
  COMPLETED = 'completed'
}

export interface OrderProgressInfo {
  currentStage: BusinessStage;
  completedStages: BusinessStage[];
  nextStage: BusinessStage | null;
  progressPercentage: number;
  stageIndex: number;
  totalStages: number;
  isTerminal: boolean;
  canProgress: boolean;
}

export interface BusinessStageInfo {
  stage: BusinessStage;
  label: string;
  description: string;
  indonesianLabel: string;
  indonesianDescription: string;
  icon: string;
  color: string;
  isPaymentStage: boolean;
  isProductionStage: boolean;
  requiresVendor: boolean;
}

export class OrderProgressCalculator {
  /**
   * Business Flow - Complete workflow stages
   * Aligned with business cycle plan and backend OrderStatus enum
   */
  private static readonly BUSINESS_FLOW: BusinessStage[] = [
    BusinessStage.DRAFT,           // 1. Pesanan diterima, menunggu review admin
    BusinessStage.PENDING,         // 2. Review admin, siap diproses
    BusinessStage.VENDOR_SOURCING, // 3. Mencari vendor yang sesuai
    BusinessStage.VENDOR_NEGOTIATION, // 4. Negosiasi harga dengan vendor
    BusinessStage.CUSTOMER_QUOTE,  // 5. Quote dikirim ke customer
    BusinessStage.AWAITING_PAYMENT, // 6. Menunggu pembayaran customer
    BusinessStage.PARTIAL_PAYMENT, // 7. DP 50% diterima (optional)
    BusinessStage.FULL_PAYMENT,    // 8. Pembayaran lunas
    BusinessStage.IN_PRODUCTION,   // 9. Dalam produksi oleh vendor
    BusinessStage.QUALITY_CONTROL, // 10. Quality control check
    BusinessStage.SHIPPING,        // 11. Dalam pengiriman
    BusinessStage.COMPLETED,       // 12. Selesai dan diterima customer
  ];

  /**
   * Business stage information with labels and descriptions
   */
  private static readonly STAGE_INFO: Record<BusinessStage, BusinessStageInfo> = {
    [BusinessStage.DRAFT]: {
      stage: BusinessStage.DRAFT,
      label: 'Draft Order',
      description: 'Order received, awaiting admin review',
      indonesianLabel: 'Pesanan Diterima',
      indonesianDescription: 'Pesanan diterima, menunggu review admin',
      icon: 'FileText',
      color: 'gray',
      isPaymentStage: false,
      isProductionStage: false,
      requiresVendor: false,
    },
    [BusinessStage.PENDING]: {
      stage: BusinessStage.PENDING,
      label: 'Pending Review',
      description: 'Admin review completed, ready for processing',
      indonesianLabel: 'Review Admin',
      indonesianDescription: 'Review admin selesai, siap diproses',
      icon: 'Clock',
      color: 'yellow',
      isPaymentStage: false,
      isProductionStage: false,
      requiresVendor: false,
    },
    [BusinessStage.VENDOR_SOURCING]: {
      stage: BusinessStage.VENDOR_SOURCING,
      label: 'Vendor Sourcing',
      description: 'Finding suitable vendor for production',
      indonesianLabel: 'Pencarian Vendor',
      indonesianDescription: 'Mencari vendor yang sesuai untuk produksi',
      icon: 'Search',
      color: 'blue',
      isPaymentStage: false,
      isProductionStage: false,
      requiresVendor: true,
    },
    [BusinessStage.VENDOR_NEGOTIATION]: {
      stage: BusinessStage.VENDOR_NEGOTIATION,
      label: 'Vendor Negotiation',
      description: 'Negotiating price and terms with vendor',
      indonesianLabel: 'Negosiasi dengan Vendor',
      indonesianDescription: 'Negosiasi harga dan syarat dengan vendor',
      icon: 'MessageSquare',
      color: 'indigo',
      isPaymentStage: false,
      isProductionStage: false,
      requiresVendor: true,
    },
    [BusinessStage.CUSTOMER_QUOTE]: {
      stage: BusinessStage.CUSTOMER_QUOTE,
      label: 'Customer Quote',
      description: 'Quote sent to customer for approval',
      indonesianLabel: 'Quote ke Customer',
      indonesianDescription: 'Quote dikirim ke customer untuk persetujuan',
      icon: 'FileCheck',
      color: 'purple',
      isPaymentStage: false,
      isProductionStage: false,
      requiresVendor: true,
    },
    [BusinessStage.AWAITING_PAYMENT]: {
      stage: BusinessStage.AWAITING_PAYMENT,
      label: 'Awaiting Payment',
      description: 'Waiting for customer payment',
      indonesianLabel: 'Menunggu Pembayaran',
      indonesianDescription: 'Menunggu pembayaran dari customer',
      icon: 'CreditCard',
      color: 'orange',
      isPaymentStage: true,
      isProductionStage: false,
      requiresVendor: true,
    },
    [BusinessStage.PARTIAL_PAYMENT]: {
      stage: BusinessStage.PARTIAL_PAYMENT,
      label: 'Partial Payment',
      description: 'DP 50% received from customer',
      indonesianLabel: 'DP Diterima',
      indonesianDescription: 'DP 50% diterima dari customer',
      icon: 'DollarSign',
      color: 'amber',
      isPaymentStage: true,
      isProductionStage: false,
      requiresVendor: true,
    },
    [BusinessStage.FULL_PAYMENT]: {
      stage: BusinessStage.FULL_PAYMENT,
      label: 'Payment Complete',
      description: 'Full payment received, ready for production',
      indonesianLabel: 'Pembayaran Lunas',
      indonesianDescription: 'Pembayaran lunas, siap produksi',
      icon: 'CheckCircle',
      color: 'green',
      isPaymentStage: true,
      isProductionStage: false,
      requiresVendor: true,
    },
    [BusinessStage.IN_PRODUCTION]: {
      stage: BusinessStage.IN_PRODUCTION,
      label: 'In Production',
      description: 'Order being produced by vendor',
      indonesianLabel: 'Dalam Produksi',
      indonesianDescription: 'Pesanan sedang diproduksi oleh vendor',
      icon: 'Cog',
      color: 'blue',
      isPaymentStage: false,
      isProductionStage: true,
      requiresVendor: true,
    },
    [BusinessStage.QUALITY_CONTROL]: {
      stage: BusinessStage.QUALITY_CONTROL,
      label: 'Quality Control',
      description: 'Product quality inspection',
      indonesianLabel: 'Quality Control',
      indonesianDescription: 'Pemeriksaan kualitas produk',
      icon: 'Shield',
      color: 'indigo',
      isPaymentStage: false,
      isProductionStage: true,
      requiresVendor: true,
    },
    [BusinessStage.SHIPPING]: {
      stage: BusinessStage.SHIPPING,
      label: 'Shipping',
      description: 'Order being shipped to customer',
      indonesianLabel: 'Dalam Pengiriman',
      indonesianDescription: 'Pesanan sedang dikirim ke customer',
      icon: 'Truck',
      color: 'cyan',
      isPaymentStage: false,
      isProductionStage: true,
      requiresVendor: true,
    },
    [BusinessStage.COMPLETED]: {
      stage: BusinessStage.COMPLETED,
      label: 'Completed',
      description: 'Order completed and accepted by customer',
      indonesianLabel: 'Selesai',
      indonesianDescription: 'Pesanan selesai dan diterima customer',
      icon: 'CheckCircle2',
      color: 'green',
      isPaymentStage: false,
      isProductionStage: false,
      requiresVendor: true,
    },
  };

  /**
   * Map OrderStatus to BusinessStage
   */
  private static readonly STATUS_TO_STAGE_MAP: Record<OrderStatus, BusinessStage> = {
    [OrderStatus.New]: BusinessStage.DRAFT,
    [OrderStatus.Draft]: BusinessStage.DRAFT,
    [OrderStatus.Pending]: BusinessStage.PENDING,
    [OrderStatus.VendorSourcing]: BusinessStage.VENDOR_SOURCING,
    [OrderStatus.VendorNegotiation]: BusinessStage.VENDOR_NEGOTIATION,
    [OrderStatus.CustomerQuote]: BusinessStage.CUSTOMER_QUOTE,
    [OrderStatus.AwaitingPayment]: BusinessStage.AWAITING_PAYMENT,
    [OrderStatus.PartialPayment]: BusinessStage.PARTIAL_PAYMENT,
    [OrderStatus.FullPayment]: BusinessStage.FULL_PAYMENT,
    [OrderStatus.Processing]: BusinessStage.IN_PRODUCTION, // Legacy status - maps to IN_PRODUCTION
    [OrderStatus.InProduction]: BusinessStage.IN_PRODUCTION,
    [OrderStatus.QualityControl]: BusinessStage.QUALITY_CONTROL,
    [OrderStatus.Shipping]: BusinessStage.SHIPPING,
    [OrderStatus.Completed]: BusinessStage.COMPLETED,
    // Terminal statuses map to their closest equivalent
    [OrderStatus.Cancelled]: BusinessStage.DRAFT, // Cancelled can happen at any stage
    [OrderStatus.Refunded]: BusinessStage.COMPLETED, // Refunded implies completion first
  };

  /**
   * Calculate order progress based on current status
   */
  static calculateProgress(currentStatus: OrderStatus): OrderProgressInfo {
    // Handle terminal statuses
    if (currentStatus === OrderStatus.Cancelled || currentStatus === OrderStatus.Refunded) {
      return this.handleTerminalStatus(currentStatus);
    }

    const currentStage = this.mapStatusToStage(currentStatus);
    const currentIndex = this.BUSINESS_FLOW.indexOf(currentStage);
    
    if (currentIndex === -1) {
      throw new Error(`Invalid business stage: ${currentStage}`);
    }

    const completedStages = this.BUSINESS_FLOW.slice(0, currentIndex);
    const nextStage = currentIndex < this.BUSINESS_FLOW.length - 1 
      ? this.BUSINESS_FLOW[currentIndex + 1] 
      : null;
    
    const progressPercentage = Math.round((currentIndex / (this.BUSINESS_FLOW.length - 1)) * 100);
    const isTerminal = currentIndex === this.BUSINESS_FLOW.length - 1;
    const canProgress = !isTerminal && nextStage !== null;

    return {
      currentStage,
      completedStages,
      nextStage,
      progressPercentage,
      stageIndex: currentIndex,
      totalStages: this.BUSINESS_FLOW.length,
      isTerminal,
      canProgress,
    };
  }

  /**
   * Handle terminal statuses (cancelled, refunded)
   */
  private static handleTerminalStatus(status: OrderStatus): OrderProgressInfo {
    return {
      currentStage: BusinessStage.DRAFT, // Default stage for terminal
      completedStages: [],
      nextStage: null,
      progressPercentage: status === OrderStatus.Refunded ? 100 : 0,
      stageIndex: -1,
      totalStages: this.BUSINESS_FLOW.length,
      isTerminal: true,
      canProgress: false,
    };
  }

  /**
   * Map OrderStatus to BusinessStage
   */
  static mapStatusToStage(status: OrderStatus): BusinessStage {
    const stage = this.STATUS_TO_STAGE_MAP[status];
    if (!stage) {
      // Handle invalid status gracefully by defaulting to DRAFT
      console.warn(`No business stage mapping found for status: ${status}, defaulting to DRAFT`);
      return BusinessStage.DRAFT;
    }
    return stage;
  }

  /**
   * Get stage information
   */
  static getStageInfo(stage: BusinessStage): BusinessStageInfo {
    const info = this.STAGE_INFO[stage];
    if (!info) {
      throw new Error(`No stage information found for: ${stage}`);
    }
    return info;
  }

  /**
   * Get all business flow stages
   */
  static getBusinessFlow(): BusinessStage[] {
    return [...this.BUSINESS_FLOW];
  }

  /**
   * Get all stage information
   */
  static getAllStageInfo(): BusinessStageInfo[] {
    return this.BUSINESS_FLOW.map(stage => this.getStageInfo(stage));
  }

  /**
   * Check if stage requires vendor assignment
   */
  static stageRequiresVendor(stage: BusinessStage): boolean {
    return this.getStageInfo(stage).requiresVendor;
  }

  /**
   * Check if stage is payment-related
   */
  static isPaymentStage(stage: BusinessStage): boolean {
    return this.getStageInfo(stage).isPaymentStage;
  }

  /**
   * Check if stage is production-related
   */
  static isProductionStage(stage: BusinessStage): boolean {
    return this.getStageInfo(stage).isProductionStage;
  }

  /**
   * Get next valid stages from current stage
   */
  static getNextValidStages(currentStage: BusinessStage): BusinessStage[] {
    const currentIndex = this.BUSINESS_FLOW.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === this.BUSINESS_FLOW.length - 1) {
      return [];
    }

    // Generally, can progress to next stage or stay in current
    const nextStages: BusinessStage[] = [];
    
    // Can always progress to next stage
    if (currentIndex < this.BUSINESS_FLOW.length - 1) {
      nextStages.push(this.BUSINESS_FLOW[currentIndex + 1]);
    }

    // Special cases for business logic
    switch (currentStage) {
      case BusinessStage.AWAITING_PAYMENT:
        // Can go to either partial or full payment
        nextStages.push(BusinessStage.PARTIAL_PAYMENT);
        nextStages.push(BusinessStage.FULL_PAYMENT);
        break;
      
      case BusinessStage.PARTIAL_PAYMENT:
        // Must complete payment before production
        nextStages.push(BusinessStage.FULL_PAYMENT);
        break;
      
      case BusinessStage.QUALITY_CONTROL:
        // Can go back to production if QC fails
        nextStages.push(BusinessStage.IN_PRODUCTION);
        break;
    }

    // Remove duplicates and return
    return [...new Set(nextStages)];
  }

  /**
   * Calculate estimated completion time based on current stage
   */
  static estimateCompletionDays(currentStage: BusinessStage): number {
    const stageEstimates: Record<BusinessStage, number> = {
      [BusinessStage.DRAFT]: 21, // 3 weeks total
      [BusinessStage.PENDING]: 18, // 2.5 weeks
      [BusinessStage.VENDOR_SOURCING]: 15, // 2 weeks
      [BusinessStage.VENDOR_NEGOTIATION]: 12, // 1.5 weeks
      [BusinessStage.CUSTOMER_QUOTE]: 10, // 1.5 weeks
      [BusinessStage.AWAITING_PAYMENT]: 8, // 1 week
      [BusinessStage.PARTIAL_PAYMENT]: 7, // 1 week
      [BusinessStage.FULL_PAYMENT]: 7, // 1 week
      [BusinessStage.IN_PRODUCTION]: 5, // 5 days
      [BusinessStage.QUALITY_CONTROL]: 2, // 2 days
      [BusinessStage.SHIPPING]: 1, // 1 day
      [BusinessStage.COMPLETED]: 0, // Done
    };

    return stageEstimates[currentStage] || 0;
  }

  /**
   * Get stage progress percentage within the overall workflow
   */
  static getStageProgressPercentage(stage: BusinessStage): number {
    const index = this.BUSINESS_FLOW.indexOf(stage);
    if (index === -1) return 0;
    
    return Math.round((index / (this.BUSINESS_FLOW.length - 1)) * 100);
  }

  /**
   * Validate stage transition
   */
  static canTransitionToStage(
    currentStage: BusinessStage, 
    targetStage: BusinessStage
  ): boolean {
    const validNextStages = this.getNextValidStages(currentStage);
    return validNextStages.includes(targetStage);
  }

  /**
   * Get human-readable stage transition reason
   */
  static getTransitionReason(
    currentStage: BusinessStage, 
    targetStage: BusinessStage
  ): string {
    if (this.canTransitionToStage(currentStage, targetStage)) {
      return 'Valid transition';
    }

    const currentInfo = this.getStageInfo(currentStage);
    const targetInfo = this.getStageInfo(targetStage);
    
    return `Cannot transition from ${currentInfo.indonesianLabel} to ${targetInfo.indonesianLabel}. Please follow the business workflow.`;
  }

  /**
   * Map timeline event to business stage (for timeline integration)
   */
  static mapEventToStage(event: any): BusinessStage | null {
    if (!event || !event.type) return null;
    
    // Map different event types to business stages
    switch (event.type) {
      case 'order_created':
        return BusinessStage.DRAFT;
      case 'admin_review':
        return BusinessStage.PENDING;
      case 'vendor_sourcing':
        return BusinessStage.VENDOR_SOURCING;
      case 'vendor_negotiation':
        return BusinessStage.VENDOR_NEGOTIATION;
      case 'customer_quote':
        return BusinessStage.CUSTOMER_QUOTE;
      case 'payment_pending':
        return BusinessStage.AWAITING_PAYMENT;
      case 'partial_payment':
        return BusinessStage.PARTIAL_PAYMENT;
      case 'full_payment':
        return BusinessStage.FULL_PAYMENT;
      case 'production_start':
        return BusinessStage.IN_PRODUCTION;
      case 'quality_control':
        return BusinessStage.QUALITY_CONTROL;
      case 'shipping':
        return BusinessStage.SHIPPING;
      case 'completed':
        return BusinessStage.COMPLETED;
      default:
        return null;
    }
  }

  /**
   * Get next stage from current stage
   */
  static getNextStage(currentStage: BusinessStage): BusinessStage | null {
    const currentIndex = this.BUSINESS_FLOW.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === this.BUSINESS_FLOW.length - 1) {
      return null;
    }
    return this.BUSINESS_FLOW[currentIndex + 1];
  }

  /**
   * Map business stage to order status
   */
  static mapStageToStatus(stage: BusinessStage): OrderStatus {
    // Reverse mapping from stage to status
    for (const [status, mappedStage] of Object.entries(this.STATUS_TO_STAGE_MAP)) {
      if (mappedStage === stage) {
        return status as OrderStatus;
      }
    }
    return OrderStatus.Draft; // Default fallback
  }
}