/**
 * Status Change Confirmation Utility
 * 
 * Determines when status changes require confirmation and provides
 * configuration for the confirmation dialog system.
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All rules based on real business workflow
 * - ✅ BUSINESS ALIGNMENT: Follows PT CEX business process requirements
 * - ✅ RISK MANAGEMENT: Appropriate confirmation for critical changes
 * - ✅ USER SAFETY: Prevents accidental destructive actions
 */

import { BusinessStage, OrderProgressCalculator } from './OrderProgressCalculator';

export interface ConfirmationConfig {
  required: boolean;
  reason: 'critical' | 'destructive' | 'financial' | 'customer_impact' | 'vendor_impact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export class StatusChangeConfirmation {
  
  /**
   * Determine if a status change requires confirmation
   */
  static requiresConfirmation(
    fromStage: BusinessStage,
    toStage: BusinessStage,
    context?: {
      hasPayment?: boolean;
      inProduction?: boolean;
      customerNotified?: boolean;
      vendorEngaged?: boolean;
    }
  ): ConfirmationConfig {
    
    // Check for destructive actions (cannot be undone)
    if (this.isDestructiveAction(toStage)) {
      return {
        required: true,
        reason: 'destructive',
        severity: 'critical',
        description: `${OrderProgressCalculator.getStageInfo(toStage).indonesianLabel} is a permanent action that cannot be undone.`
      };
    }

    // Check for critical workflow transitions
    if (this.isCriticalTransition(fromStage, toStage)) {
      return this.getCriticalTransitionConfig(fromStage, toStage, context);
    }

    // Check for financial impact transitions
    if (this.hasFinancialImpact(fromStage, toStage, context)) {
      return {
        required: true,
        reason: 'financial',
        severity: 'high',
        description: 'This change has significant financial implications and requires confirmation.'
      };
    }

    // Check for customer impact transitions
    if (this.hasCustomerImpact(fromStage, toStage)) {
      return {
        required: true,
        reason: 'customer_impact',
        severity: 'medium',
        description: 'This change will affect the customer experience and requires confirmation.'
      };
    }

    // Check for vendor impact transitions
    if (this.hasVendorImpact(fromStage, toStage, context)) {
      return {
        required: true,
        reason: 'vendor_impact',
        severity: 'medium',
        description: 'This change will affect vendor operations and requires confirmation.'
      };
    }

    // No confirmation required
    return {
      required: false,
      reason: 'critical',
      severity: 'low',
      description: 'Standard workflow progression.'
    };
  }

  /**
   * Check if the target stage is a destructive action
   */
  private static isDestructiveAction(toStage: BusinessStage): boolean {
    const destructiveStages = new Set([
      BusinessStage.COMPLETED, // Final completion is destructive (can't easily undo)
    ]);
    
    return destructiveStages.has(toStage);
  }

  /**
   * Check if this is a critical workflow transition
   */
  private static isCriticalTransition(fromStage: BusinessStage, toStage: BusinessStage): boolean {
    const criticalTransitions = new Set([
      // Production initiation - point of no return
      `${BusinessStage.FULL_PAYMENT}->${BusinessStage.IN_PRODUCTION}`,
      `${BusinessStage.PARTIAL_PAYMENT}->${BusinessStage.IN_PRODUCTION}`,
      
      // Quality control decisions
      `${BusinessStage.IN_PRODUCTION}->${BusinessStage.QUALITY_CONTROL}`,
      `${BusinessStage.QUALITY_CONTROL}->${BusinessStage.SHIPPING}`,
      `${BusinessStage.QUALITY_CONTROL}->${BusinessStage.IN_PRODUCTION}`, // QC rejection
      
      // Shipping and delivery
      `${BusinessStage.SHIPPING}->${BusinessStage.COMPLETED}`,
      
      // Backwards transitions (rejections/revisions)
      `${BusinessStage.CUSTOMER_QUOTE}->${BusinessStage.VENDOR_NEGOTIATION}`, // Quote rejected
      `${BusinessStage.AWAITING_PAYMENT}->${BusinessStage.CUSTOMER_QUOTE}`, // Payment issues
    ]);

    const transitionKey = `${fromStage}->${toStage}`;
    return criticalTransitions.has(transitionKey);
  }

  /**
   * Get configuration for critical transitions
   */
  private static getCriticalTransitionConfig(
    fromStage: BusinessStage,
    toStage: BusinessStage,
    _context?: any
  ): ConfirmationConfig {
    const transitionKey = `${fromStage}->${toStage}`;

    switch (transitionKey) {
      case `${BusinessStage.FULL_PAYMENT}->${BusinessStage.IN_PRODUCTION}`:
      case `${BusinessStage.PARTIAL_PAYMENT}->${BusinessStage.IN_PRODUCTION}`:
        return {
          required: true,
          reason: 'critical',
          severity: 'critical',
          description: 'Starting production commits resources and may incur costs. Cancellation after this point may result in penalties.'
        };

      case `${BusinessStage.QUALITY_CONTROL}->${BusinessStage.IN_PRODUCTION}`:
        return {
          required: true,
          reason: 'critical',
          severity: 'high',
          description: 'Rejecting quality control will restart production. This may cause delays and additional costs.'
        };

      case `${BusinessStage.SHIPPING}->${BusinessStage.COMPLETED}`:
        return {
          required: true,
          reason: 'customer_impact',
          severity: 'medium',
          description: 'Marking as completed will finalize the order and trigger customer satisfaction processes.'
        };

      default:
        return {
          required: true,
          reason: 'critical',
          severity: 'high',
          description: 'This is a critical workflow transition that requires confirmation.'
        };
    }
  }

  /**
   * Check if transition has financial impact
   */
  private static hasFinancialImpact(
    _fromStage: BusinessStage,
    toStage: BusinessStage,
    _context?: any
  ): boolean {
    // Payment-related transitions
    const paymentStages = [
      BusinessStage.AWAITING_PAYMENT,
      BusinessStage.PARTIAL_PAYMENT,
      BusinessStage.FULL_PAYMENT
    ];

    if (paymentStages.includes(toStage)) {
      return true;
    }

    // Production-related transitions with financial commitment
    if (toStage === BusinessStage.IN_PRODUCTION) {
      return true;
    }

    return false;
  }

  /**
   * Check if transition has customer impact
   */
  private static hasCustomerImpact(_fromStage: BusinessStage, toStage: BusinessStage): boolean {
    const customerImpactTransitions = [
      BusinessStage.SHIPPING,
      BusinessStage.COMPLETED
    ];

    return customerImpactTransitions.includes(toStage);
  }

  /**
   * Check if transition has vendor impact
   */
  private static hasVendorImpact(
    fromStage: BusinessStage,
    toStage: BusinessStage,
    _context?: any
  ): boolean {
    // Starting production affects vendor
    if (toStage === 'in_production' as BusinessStage) {
      return true;
    }

    // QC rejection affects vendor (going back to production from QC)
    if (fromStage === BusinessStage.QUALITY_CONTROL && toStage === 'in_production' as BusinessStage) {
      return true;
    }

    // Note: Cancellation is handled at OrderStatus level, not BusinessStage level
    // BusinessStage represents the business workflow progression only

    return false;
  }

  /**
   * Get quick confirmation for simple status changes
   */
  static getQuickConfirmationMessage(
    fromStage: BusinessStage,
    toStage: BusinessStage
  ): string | null {
    const fromInfo = OrderProgressCalculator.getStageInfo(fromStage);
    const toInfo = OrderProgressCalculator.getStageInfo(toStage);

    // For non-critical transitions, provide a simple confirmation message
    if (!this.requiresConfirmation(fromStage, toStage).required) {
      return `Advance order from ${fromInfo.indonesianLabel} to ${toInfo.indonesianLabel}?`;
    }

    return null; // Use full confirmation dialog for critical changes
  }

  /**
   * Get confirmation button text based on severity
   */
  static getConfirmationButtonText(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (severity) {
      case 'critical':
        return 'I Understand - Proceed';
      case 'high':
        return 'Confirm Change';
      case 'medium':
        return 'Proceed';
      case 'low':
      default:
        return 'Continue';
    }
  }

  /**
   * Get minimum note length requirement based on severity
   */
  static getMinimumNoteLength(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    switch (severity) {
      case 'critical':
        return 20; // Require detailed explanation
      case 'high':
        return 10; // Require some explanation
      case 'medium':
        return 5;  // Brief note required
      case 'low':
      default:
        return 0;  // No note required
    }
  }

  /**
   * Check if notes are required for this transition
   */
  static requiresNotes(fromStage: BusinessStage, toStage: BusinessStage): boolean {
    const config = this.requiresConfirmation(fromStage, toStage);
    return config.required && (config.severity === 'high' || config.severity === 'critical');
  }

  /**
   * Get stage-specific validation rules
   */
  static getValidationRules(
    fromStage: BusinessStage,
    toStage: BusinessStage
  ): {
    requiresNotes: boolean;
    minimumNoteLength: number;
    requiresRiskAcknowledgment: boolean;
    requiresRequirementCheck: boolean;
  } {
    const config = this.requiresConfirmation(fromStage, toStage);
    
    return {
      requiresNotes: this.requiresNotes(fromStage, toStage),
      minimumNoteLength: this.getMinimumNoteLength(config.severity),
      requiresRiskAcknowledgment: config.severity === 'critical' || config.reason === 'destructive',
      requiresRequirementCheck: config.severity === 'high' || config.severity === 'critical'
    };
  }
}

export default StatusChangeConfirmation;