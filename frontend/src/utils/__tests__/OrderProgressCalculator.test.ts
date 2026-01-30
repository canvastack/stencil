/**
 * OrderProgressCalculator Unit Tests
 * 
 * Comprehensive test suite for PT CEX business workflow calculations
 * Ensures accurate progress tracking and business logic compliance
 */

import { describe, it, expect } from 'vitest';
import { OrderProgressCalculator, BusinessStage } from '../OrderProgressCalculator';
import { OrderStatus } from '@/types/order';

describe('OrderProgressCalculator', () => {
  describe('calculateProgress()', () => {
    it('should calculate progress for draft status', () => {
      const result = OrderProgressCalculator.calculateProgress(OrderStatus.Draft);

      expect(result.currentStage).toBe(BusinessStage.DRAFT);
      expect(result.completedStages).toEqual([]);
      expect(result.nextStage).toBe(BusinessStage.PENDING);
      expect(result.progressPercentage).toBe(0);
      expect(result.stageIndex).toBe(0);
      expect(result.isTerminal).toBe(false);
      expect(result.canProgress).toBe(true);
    });

    it('should calculate progress for pending status', () => {
      const result = OrderProgressCalculator.calculateProgress(OrderStatus.Pending);

      expect(result.currentStage).toBe(BusinessStage.PENDING);
      expect(result.completedStages).toEqual([BusinessStage.DRAFT]);
      expect(result.nextStage).toBe(BusinessStage.VENDOR_SOURCING);
      expect(result.progressPercentage).toBe(9); // 1/11 * 100
      expect(result.stageIndex).toBe(1);
      expect(result.isTerminal).toBe(false);
      expect(result.canProgress).toBe(true);
    });

    it('should calculate progress for vendor sourcing', () => {
      const result = OrderProgressCalculator.calculateProgress(OrderStatus.VendorSourcing);

      expect(result.currentStage).toBe(BusinessStage.VENDOR_SOURCING);
      expect(result.completedStages).toEqual([
        BusinessStage.DRAFT,
        BusinessStage.PENDING
      ]);
      expect(result.nextStage).toBe(BusinessStage.VENDOR_NEGOTIATION);
      expect(result.progressPercentage).toBe(18); // 2/11 * 100
    });

    it('should calculate progress for completed status', () => {
      const result = OrderProgressCalculator.calculateProgress(OrderStatus.Completed);

      expect(result.currentStage).toBe(BusinessStage.COMPLETED);
      expect(result.completedStages).toHaveLength(11); // All previous stages
      expect(result.nextStage).toBe(null);
      expect(result.progressPercentage).toBe(100);
      expect(result.isTerminal).toBe(true);
      expect(result.canProgress).toBe(false);
    });

    it('should handle cancelled status', () => {
      const result = OrderProgressCalculator.calculateProgress(OrderStatus.Cancelled);

      expect(result.currentStage).toBe(BusinessStage.DRAFT);
      expect(result.completedStages).toEqual([]);
      expect(result.nextStage).toBe(null);
      expect(result.progressPercentage).toBe(0);
      expect(result.isTerminal).toBe(true);
      expect(result.canProgress).toBe(false);
    });

    it('should handle refunded status', () => {
      const result = OrderProgressCalculator.calculateProgress(OrderStatus.Refunded);

      expect(result.currentStage).toBe(BusinessStage.DRAFT);
      expect(result.completedStages).toEqual([]);
      expect(result.nextStage).toBe(null);
      expect(result.progressPercentage).toBe(100); // Refund implies completion
      expect(result.isTerminal).toBe(true);
      expect(result.canProgress).toBe(false);
    });
  });

  describe('mapStatusToStage()', () => {
    it('should map all OrderStatus values to business stages', () => {
      const mappings = [
        { status: OrderStatus.New, stage: BusinessStage.DRAFT },
        { status: OrderStatus.Draft, stage: BusinessStage.DRAFT },
        { status: OrderStatus.Pending, stage: BusinessStage.PENDING },
        { status: OrderStatus.VendorSourcing, stage: BusinessStage.VENDOR_SOURCING },
        { status: OrderStatus.VendorNegotiation, stage: BusinessStage.VENDOR_NEGOTIATION },
        { status: OrderStatus.CustomerQuote, stage: BusinessStage.CUSTOMER_QUOTE },
        { status: OrderStatus.AwaitingPayment, stage: BusinessStage.AWAITING_PAYMENT },
        { status: OrderStatus.PartialPayment, stage: BusinessStage.PARTIAL_PAYMENT },
        { status: OrderStatus.FullPayment, stage: BusinessStage.FULL_PAYMENT },
        { status: OrderStatus.InProduction, stage: BusinessStage.IN_PRODUCTION },
        { status: OrderStatus.QualityControl, stage: BusinessStage.QUALITY_CONTROL },
        { status: OrderStatus.Shipping, stage: BusinessStage.SHIPPING },
        { status: OrderStatus.Completed, stage: BusinessStage.COMPLETED },
      ];

      mappings.forEach(({ status, stage }) => {
        expect(OrderProgressCalculator.mapStatusToStage(status)).toBe(stage);
      });
    });

    it('should handle invalid status gracefully', () => {
      // Should not throw, but return DRAFT as fallback
      const result = OrderProgressCalculator.mapStatusToStage('invalid_status' as OrderStatus);
      expect(result).toBe(BusinessStage.DRAFT);
    });
  });

  describe('getStageInfo()', () => {
    it('should return complete stage information', () => {
      const info = OrderProgressCalculator.getStageInfo(BusinessStage.VENDOR_SOURCING);

      expect(info).toMatchObject({
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
      });
    });

    it('should identify payment stages correctly', () => {
      const paymentStages = [
        BusinessStage.AWAITING_PAYMENT,
        BusinessStage.PARTIAL_PAYMENT,
        BusinessStage.FULL_PAYMENT,
      ];

      paymentStages.forEach(stage => {
        const info = OrderProgressCalculator.getStageInfo(stage);
        expect(info.isPaymentStage).toBe(true);
      });
    });

    it('should identify production stages correctly', () => {
      const productionStages = [
        BusinessStage.IN_PRODUCTION,
        BusinessStage.QUALITY_CONTROL,
        BusinessStage.SHIPPING,
      ];

      productionStages.forEach(stage => {
        const info = OrderProgressCalculator.getStageInfo(stage);
        expect(info.isProductionStage).toBe(true);
      });
    });

    it('should throw error for invalid stage', () => {
      expect(() => {
        OrderProgressCalculator.getStageInfo('invalid_stage' as BusinessStage);
      }).toThrow('No stage information found for');
    });
  });

  describe('getBusinessFlow()', () => {
    it('should return complete business flow', () => {
      const flow = OrderProgressCalculator.getBusinessFlow();

      expect(flow).toHaveLength(12);
      expect(flow[0]).toBe(BusinessStage.DRAFT);
      expect(flow[11]).toBe(BusinessStage.COMPLETED);
    });

    it('should return a copy of the flow (immutable)', () => {
      const flow1 = OrderProgressCalculator.getBusinessFlow();
      const flow2 = OrderProgressCalculator.getBusinessFlow();

      expect(flow1).toEqual(flow2);
      expect(flow1).not.toBe(flow2); // Different instances
    });
  });

  describe('getAllStageInfo()', () => {
    it('should return information for all stages', () => {
      const allInfo = OrderProgressCalculator.getAllStageInfo();

      expect(allInfo).toHaveLength(12);
      expect(allInfo[0].stage).toBe(BusinessStage.DRAFT);
      expect(allInfo[11].stage).toBe(BusinessStage.COMPLETED);
    });
  });

  describe('Stage Classification Methods', () => {
    it('should correctly identify vendor requirement', () => {
      expect(OrderProgressCalculator.stageRequiresVendor(BusinessStage.DRAFT)).toBe(false);
      expect(OrderProgressCalculator.stageRequiresVendor(BusinessStage.PENDING)).toBe(false);
      expect(OrderProgressCalculator.stageRequiresVendor(BusinessStage.VENDOR_SOURCING)).toBe(true);
      expect(OrderProgressCalculator.stageRequiresVendor(BusinessStage.IN_PRODUCTION)).toBe(true);
    });

    it('should correctly identify payment stages', () => {
      expect(OrderProgressCalculator.isPaymentStage(BusinessStage.AWAITING_PAYMENT)).toBe(true);
      expect(OrderProgressCalculator.isPaymentStage(BusinessStage.PARTIAL_PAYMENT)).toBe(true);
      expect(OrderProgressCalculator.isPaymentStage(BusinessStage.FULL_PAYMENT)).toBe(true);
      expect(OrderProgressCalculator.isPaymentStage(BusinessStage.IN_PRODUCTION)).toBe(false);
    });

    it('should correctly identify production stages', () => {
      expect(OrderProgressCalculator.isProductionStage(BusinessStage.IN_PRODUCTION)).toBe(true);
      expect(OrderProgressCalculator.isProductionStage(BusinessStage.QUALITY_CONTROL)).toBe(true);
      expect(OrderProgressCalculator.isProductionStage(BusinessStage.SHIPPING)).toBe(true);
      expect(OrderProgressCalculator.isProductionStage(BusinessStage.AWAITING_PAYMENT)).toBe(false);
    });
  });

  describe('getNextValidStages()', () => {
    it('should return next stage for normal progression', () => {
      const nextStages = OrderProgressCalculator.getNextValidStages(BusinessStage.PENDING);
      expect(nextStages).toContain(BusinessStage.VENDOR_SOURCING);
    });

    it('should handle payment stage branching', () => {
      const nextStages = OrderProgressCalculator.getNextValidStages(BusinessStage.AWAITING_PAYMENT);
      expect(nextStages).toContain(BusinessStage.PARTIAL_PAYMENT);
      expect(nextStages).toContain(BusinessStage.FULL_PAYMENT);
    });

    it('should handle quality control fallback', () => {
      const nextStages = OrderProgressCalculator.getNextValidStages(BusinessStage.QUALITY_CONTROL);
      expect(nextStages).toContain(BusinessStage.SHIPPING);
      expect(nextStages).toContain(BusinessStage.IN_PRODUCTION); // Can go back if QC fails
    });

    it('should return empty array for completed stage', () => {
      const nextStages = OrderProgressCalculator.getNextValidStages(BusinessStage.COMPLETED);
      expect(nextStages).toEqual([]);
    });
  });

  describe('estimateCompletionDays()', () => {
    it('should return decreasing estimates as stages progress', () => {
      const draftDays = OrderProgressCalculator.estimateCompletionDays(BusinessStage.DRAFT);
      const productionDays = OrderProgressCalculator.estimateCompletionDays(BusinessStage.IN_PRODUCTION);
      const completedDays = OrderProgressCalculator.estimateCompletionDays(BusinessStage.COMPLETED);

      expect(draftDays).toBeGreaterThan(productionDays);
      expect(productionDays).toBeGreaterThan(completedDays);
      expect(completedDays).toBe(0);
    });

    it('should return reasonable estimates for each stage', () => {
      expect(OrderProgressCalculator.estimateCompletionDays(BusinessStage.DRAFT)).toBe(21);
      expect(OrderProgressCalculator.estimateCompletionDays(BusinessStage.IN_PRODUCTION)).toBe(5);
      expect(OrderProgressCalculator.estimateCompletionDays(BusinessStage.SHIPPING)).toBe(1);
    });
  });

  describe('getStageProgressPercentage()', () => {
    it('should return correct percentages for each stage', () => {
      expect(OrderProgressCalculator.getStageProgressPercentage(BusinessStage.DRAFT)).toBe(0);
      expect(OrderProgressCalculator.getStageProgressPercentage(BusinessStage.PENDING)).toBe(9);
      expect(OrderProgressCalculator.getStageProgressPercentage(BusinessStage.COMPLETED)).toBe(100);
    });

    it('should return 0 for invalid stage', () => {
      expect(OrderProgressCalculator.getStageProgressPercentage('invalid' as BusinessStage)).toBe(0);
    });
  });

  describe('Stage Transition Validation', () => {
    it('should validate normal forward transitions', () => {
      expect(OrderProgressCalculator.canTransitionToStage(
        BusinessStage.DRAFT,
        BusinessStage.PENDING
      )).toBe(true);

      expect(OrderProgressCalculator.canTransitionToStage(
        BusinessStage.VENDOR_SOURCING,
        BusinessStage.VENDOR_NEGOTIATION
      )).toBe(true);
    });

    it('should validate payment branching transitions', () => {
      expect(OrderProgressCalculator.canTransitionToStage(
        BusinessStage.AWAITING_PAYMENT,
        BusinessStage.PARTIAL_PAYMENT
      )).toBe(true);

      expect(OrderProgressCalculator.canTransitionToStage(
        BusinessStage.AWAITING_PAYMENT,
        BusinessStage.FULL_PAYMENT
      )).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(OrderProgressCalculator.canTransitionToStage(
        BusinessStage.DRAFT,
        BusinessStage.IN_PRODUCTION
      )).toBe(false);

      expect(OrderProgressCalculator.canTransitionToStage(
        BusinessStage.COMPLETED,
        BusinessStage.DRAFT
      )).toBe(false);
    });

    it('should provide meaningful transition reasons', () => {
      const validReason = OrderProgressCalculator.getTransitionReason(
        BusinessStage.DRAFT,
        BusinessStage.PENDING
      );
      expect(validReason).toBe('Valid transition');

      const invalidReason = OrderProgressCalculator.getTransitionReason(
        BusinessStage.DRAFT,
        BusinessStage.COMPLETED
      );
      expect(invalidReason).toContain('Cannot transition from');
      expect(invalidReason).toContain('PT CEX business workflow');
    });
  });

  describe('Business Logic Compliance', () => {
    it('should follow PT CEX business cycle order', () => {
      const flow = OrderProgressCalculator.getBusinessFlow();
      
      // Verify the exact business workflow sequence
      expect(flow[0]).toBe(BusinessStage.DRAFT);
      expect(flow[1]).toBe(BusinessStage.PENDING);
      expect(flow[2]).toBe(BusinessStage.VENDOR_SOURCING);
      expect(flow[3]).toBe(BusinessStage.VENDOR_NEGOTIATION);
      expect(flow[4]).toBe(BusinessStage.CUSTOMER_QUOTE);
      expect(flow[5]).toBe(BusinessStage.AWAITING_PAYMENT);
      expect(flow[6]).toBe(BusinessStage.PARTIAL_PAYMENT);
      expect(flow[7]).toBe(BusinessStage.FULL_PAYMENT);
      expect(flow[8]).toBe(BusinessStage.IN_PRODUCTION);
      expect(flow[9]).toBe(BusinessStage.QUALITY_CONTROL);
      expect(flow[10]).toBe(BusinessStage.SHIPPING);
      expect(flow[11]).toBe(BusinessStage.COMPLETED);
    });

    it('should have Indonesian labels for all stages', () => {
      const allInfo = OrderProgressCalculator.getAllStageInfo();
      
      allInfo.forEach(info => {
        expect(info.indonesianLabel).toBeTruthy();
        expect(info.indonesianDescription).toBeTruthy();
        expect(info.indonesianLabel.length).toBeGreaterThan(0);
        expect(info.indonesianDescription.length).toBeGreaterThan(0);
      });
    });

    it('should correctly identify vendor-dependent stages', () => {
      const vendorStages = OrderProgressCalculator.getAllStageInfo()
        .filter(info => info.requiresVendor)
        .map(info => info.stage);

      // Vendor is required from sourcing onwards
      expect(vendorStages).toContain(BusinessStage.VENDOR_SOURCING);
      expect(vendorStages).toContain(BusinessStage.VENDOR_NEGOTIATION);
      expect(vendorStages).toContain(BusinessStage.IN_PRODUCTION);
      expect(vendorStages).toContain(BusinessStage.COMPLETED);

      // Vendor not required in initial stages
      expect(vendorStages).not.toContain(BusinessStage.DRAFT);
      expect(vendorStages).not.toContain(BusinessStage.PENDING);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all OrderStatus enum values', () => {
      const allStatuses = Object.values(OrderStatus);
      
      allStatuses.forEach(status => {
        expect(() => {
          OrderProgressCalculator.calculateProgress(status);
        }).not.toThrow();
      });
    });

    it('should maintain consistency between progress calculations', () => {
      const status = OrderStatus.VendorNegotiation;
      const progress1 = OrderProgressCalculator.calculateProgress(status);
      const progress2 = OrderProgressCalculator.calculateProgress(status);
      
      expect(progress1).toEqual(progress2);
    });

    it('should handle percentage calculations correctly', () => {
      const allStatuses = Object.values(OrderStatus).filter(
        status => status !== OrderStatus.Cancelled && status !== OrderStatus.Refunded
      );
      
      allStatuses.forEach(status => {
        const progress = OrderProgressCalculator.calculateProgress(status);
        expect(progress.progressPercentage).toBeGreaterThanOrEqual(0);
        expect(progress.progressPercentage).toBeLessThanOrEqual(100);
      });
    });
  });
});