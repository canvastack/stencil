/**
 * Guidance System Integration Tests
 * 
 * Tests the integration between guidance components and existing order components
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BusinessStage, OrderProgressCalculator } from '@/utils/OrderProgressCalculator';
import { OrderStatus } from '@/types/order';

// Mock the hooks
vi.mock('@/hooks/useOrders', () => ({
  useAdvanceOrderStage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

// Mock the tooltip provider
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Guidance System Integration', () => {
  it('OrderProgressCalculator provides correct stage information', () => {
    const progressInfo = OrderProgressCalculator.calculateProgress(OrderStatus.VendorSourcing);
    
    expect(progressInfo.currentStage).toBe(BusinessStage.VENDOR_SOURCING);
    expect(progressInfo.completedStages).toContain(BusinessStage.DRAFT);
    expect(progressInfo.completedStages).toContain(BusinessStage.PENDING);
    expect(progressInfo.nextStage).toBe(BusinessStage.VENDOR_NEGOTIATION);
  });

  it('provides stage information for all business stages', () => {
    const allStages = OrderProgressCalculator.getAllStageInfo();
    
    expect(allStages).toHaveLength(12); // All business stages
    expect(allStages[0].stage).toBe(BusinessStage.DRAFT);
    expect(allStages[11].stage).toBe(BusinessStage.COMPLETED);
  });

  it('calculates estimated completion days correctly', () => {
    const draftDays = OrderProgressCalculator.estimateCompletionDays(BusinessStage.DRAFT);
    const completedDays = OrderProgressCalculator.estimateCompletionDays(BusinessStage.COMPLETED);
    
    expect(draftDays).toBeGreaterThan(completedDays);
    expect(completedDays).toBe(0);
  });

  it('identifies complex stages correctly', () => {
    const vendorSourcingInfo = OrderProgressCalculator.getStageInfo(BusinessStage.VENDOR_SOURCING);
    const draftInfo = OrderProgressCalculator.getStageInfo(BusinessStage.DRAFT);
    
    expect(vendorSourcingInfo.requiresVendor).toBe(true);
    expect(draftInfo.requiresVendor).toBe(false);
  });

  it('provides next valid stages correctly', () => {
    const nextStages = OrderProgressCalculator.getNextValidStages(BusinessStage.AWAITING_PAYMENT);
    
    expect(nextStages).toContain(BusinessStage.PARTIAL_PAYMENT);
    expect(nextStages).toContain(BusinessStage.FULL_PAYMENT);
  });

  it('validates stage transitions correctly', () => {
    const validTransition = OrderProgressCalculator.canTransitionToStage(
      BusinessStage.PENDING,
      BusinessStage.VENDOR_SOURCING
    );
    
    const invalidTransition = OrderProgressCalculator.canTransitionToStage(
      BusinessStage.DRAFT,
      BusinessStage.COMPLETED
    );
    
    expect(validTransition).toBe(true);
    expect(invalidTransition).toBe(false);
  });

  it('provides appropriate guidance for different stage states', () => {
    // Test that different stages have different guidance content
    const draftInfo = OrderProgressCalculator.getStageInfo(BusinessStage.DRAFT);
    const vendorSourcingInfo = OrderProgressCalculator.getStageInfo(BusinessStage.VENDOR_SOURCING);
    
    expect(draftInfo.indonesianLabel).toBe('Pesanan Diterima');
    expect(vendorSourcingInfo.indonesianLabel).toBe('Pencarian Vendor');
    
    expect(draftInfo.indonesianDescription).not.toBe(vendorSourcingInfo.indonesianDescription);
  });
});