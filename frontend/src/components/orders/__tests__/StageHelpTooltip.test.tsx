/**
 * StageHelpTooltip Component Tests
 * 
 * Tests the stage help tooltip functionality
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StageHelpTooltip from '../StageHelpTooltip';
import { BusinessStage } from '@/utils/OrderProgressCalculator';

// Mock the tooltip provider
vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-provider">{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}));

describe('StageHelpTooltip', () => {
  it('renders children without tooltip for simple stages', () => {
    render(
      <StageHelpTooltip stage={BusinessStage.DRAFT}>
        <button>Test Button</button>
      </StageHelpTooltip>
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
    // Should not render tooltip for simple stages
    expect(screen.queryByTestId('tooltip-provider')).not.toBeInTheDocument();
  });

  it('renders tooltip for complex stages', () => {
    render(
      <StageHelpTooltip stage={BusinessStage.VENDOR_SOURCING}>
        <button>Test Button</button>
      </StageHelpTooltip>
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-provider')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip-content')).toBeInTheDocument();
  });

  it('shows appropriate content for vendor sourcing stage', () => {
    render(
      <StageHelpTooltip stage={BusinessStage.VENDOR_SOURCING}>
        <button>Test Button</button>
      </StageHelpTooltip>
    );
    
    expect(screen.getByText('Pencarian Vendor')).toBeInTheDocument();
    expect(screen.getByText('complex')).toBeInTheDocument();
    expect(screen.getByText('Key Points:')).toBeInTheDocument();
  });

  it('shows appropriate content for vendor negotiation stage', () => {
    render(
      <StageHelpTooltip stage={BusinessStage.VENDOR_NEGOTIATION}>
        <button>Test Button</button>
      </StageHelpTooltip>
    );
    
    expect(screen.getByText('Negosiasi Vendor')).toBeInTheDocument();
    expect(screen.getByText('complex')).toBeInTheDocument();
    expect(screen.getByText('Common Issues:')).toBeInTheDocument();
    expect(screen.getByText('Tips:')).toBeInTheDocument();
  });

  it('shows moderate complexity for appropriate stages', () => {
    render(
      <StageHelpTooltip stage={BusinessStage.CUSTOMER_QUOTE}>
        <button>Test Button</button>
      </StageHelpTooltip>
    );
    
    expect(screen.getByText('Quote Customer')).toBeInTheDocument();
    expect(screen.getByText('moderate')).toBeInTheDocument();
  });

  it('includes help indicator text', () => {
    render(
      <StageHelpTooltip stage={BusinessStage.VENDOR_SOURCING}>
        <button>Test Button</button>
      </StageHelpTooltip>
    );
    
    expect(screen.getByText('Click stage for detailed actions')).toBeInTheDocument();
  });
});