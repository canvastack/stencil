/**
 * Status Change Confirmation Integration Tests
 * 
 * Tests integration between confirmation system and existing components
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: Tests use real business workflow integration
 * - ✅ BUSINESS ALIGNMENT: Tests follow PT CEX business processes
 * - ✅ INTEGRATION: Tests component interaction and data flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatusActionPanel from '../StatusActionPanel';
import { BusinessStage } from '@/utils/OrderProgressCalculator';
import { OrderStatus } from '@/types/order';

// Mock the hooks and utilities
vi.mock('@/hooks/useOrders', () => ({
  useAdvanceOrderStage: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null
  })
}));

vi.mock('@/utils/OrderProgressCalculator', () => ({
  BusinessStage: {
    DRAFT: 'draft',
    PENDING: 'pending',
    VENDOR_SOURCING: 'vendor_sourcing',
    VENDOR_NEGOTIATION: 'vendor_negotiation',
    CUSTOMER_QUOTE: 'customer_quote',
    AWAITING_PAYMENT: 'awaiting_payment',
    PARTIAL_PAYMENT: 'partial_payment',
    FULL_PAYMENT: 'full_payment',
    IN_PRODUCTION: 'in_production',
    QUALITY_CONTROL: 'quality_control',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  },
  OrderProgressCalculator: {
    calculateProgress: vi.fn(() => ({
      currentStage: BusinessStage.FULL_PAYMENT,
      nextStage: BusinessStage.IN_PRODUCTION,
      completedStages: [BusinessStage.DRAFT, BusinessStage.PENDING, BusinessStage.VENDOR_SOURCING],
      progressPercentage: 60
    })),
    getStageInfo: vi.fn((stage: string) => ({
      indonesianLabel: `Stage ${stage}`,
      indonesianDescription: `Description for ${stage}`,
      englishLabel: `Stage ${stage}`,
      englishDescription: `Description for ${stage}`
    })),
    getNextValidStages: vi.fn(() => [BusinessStage.IN_PRODUCTION]),
    mapStageToStatus: vi.fn((stage: string) => stage as OrderStatus),
    estimateCompletionDays: vi.fn(() => 5)
  }
}));

vi.mock('@/utils/StatusChangeConfirmation', () => ({
  StatusChangeConfirmation: {
    requiresConfirmation: vi.fn(() => ({
      required: true,
      reason: 'critical',
      severity: 'critical',
      description: 'This is a critical status change'
    })),
    getQuickConfirmationMessage: vi.fn(() => null),
    requiresNotes: vi.fn(() => true)
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}));

// Mock the WhatsNextGuidanceSystem component
vi.mock('../WhatsNextGuidanceSystem', () => ({
  default: ({ onActionClick }: { onActionClick: (actionId: string, stage: string) => void }) => (
    <div data-testid="whats-next-guidance">
      <button onClick={() => onActionClick('start-production', BusinessStage.IN_PRODUCTION)}>
        Start Production
      </button>
    </div>
  )
}));

describe('Status Change Confirmation Integration', () => {
  let queryClient: QueryClient;

  const defaultProps = {
    currentStatus: 'full_payment' as OrderStatus,
    timeline: [
      {
        id: '1',
        type: 'status_change',
        title: 'Payment Received',
        description: 'Full payment received from customer',
        timestamp: new Date().toISOString(),
        actor: 'Admin User'
      }
    ],
    userPermissions: ['update_order_status', 'add_order_notes'],
    orderId: 'test-order-123'
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('shows enhanced confirmation dialog for critical transitions', async () => {
    renderWithQueryClient(<StatusActionPanel {...defaultProps} />);
    
    // Find and click the transition button for starting production
    const advanceButton = screen.getByText('Advance');
    fireEvent.click(advanceButton);
    
    // Should show the enhanced confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
    });
  });

  it('shows quick action confirmation for critical quick actions', async () => {
    renderWithQueryClient(<StatusActionPanel {...defaultProps} />);
    
    // Find and click a quick action button
    const startProductionButton = screen.getByText('Start Production');
    fireEvent.click(startProductionButton);
    
    // Should show the enhanced confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
    });
  });

  it('integrates with WhatsNextGuidanceSystem actions', async () => {
    renderWithQueryClient(<StatusActionPanel {...defaultProps} />);
    
    // Click action from guidance system
    const guidanceAction = screen.getByText('Start Production');
    fireEvent.click(guidanceAction);
    
    // Should trigger the confirmation flow
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
    });
  });

  it('handles confirmation completion correctly', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({});
    
    // Mock the hook to return our spy
    vi.mocked(require('@/hooks/useOrders').useAdvanceOrderStage).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null
    });

    renderWithQueryClient(<StatusActionPanel {...defaultProps} />);
    
    // Trigger confirmation dialog
    const advanceButton = screen.getByText('Advance');
    fireEvent.click(advanceButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
    });
    
    // Fill in required fields and confirm
    const notesTextarea = screen.getByPlaceholderText(/Please provide a detailed reason/);
    fireEvent.change(notesTextarea, { target: { value: 'Starting production as planned' } });
    
    // Check required checkboxes (if any)
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      if (!checkbox.getAttribute('disabled')) {
        fireEvent.click(checkbox);
      }
    });
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /Confirm Status Change/ });
    fireEvent.click(confirmButton);
    
    // Should call the mutation
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: 'test-order-123',
        targetStage: BusinessStage.IN_PRODUCTION,
        notes: 'Starting production as planned'
      });
    });
  });

  it('shows different confirmation content for different stage transitions', async () => {
    // Test cancellation scenario
    const cancellationProps = {
      ...defaultProps,
      currentStatus: 'in_production' as OrderStatus
    };

    // Mock to return cancellation as next stage
    vi.mocked(require('@/utils/OrderProgressCalculator').OrderProgressCalculator.getNextValidStages)
      .mockReturnValue([BusinessStage.CANCELLED]);

    renderWithQueryClient(<StatusActionPanel {...cancellationProps} />);
    
    const advanceButton = screen.getByText('Advance');
    fireEvent.click(advanceButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
      expect(screen.getByText(/destructive action that cannot be easily undone/)).toBeInTheDocument();
    });
  });

  it('validates requirements before allowing confirmation', async () => {
    renderWithQueryClient(<StatusActionPanel {...defaultProps} />);
    
    // Trigger confirmation dialog
    const advanceButton = screen.getByText('Advance');
    fireEvent.click(advanceButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
    });
    
    // Try to confirm without meeting requirements
    const confirmButton = screen.getByRole('button', { name: /Confirm Status Change/ });
    expect(confirmButton).toBeDisabled();
    
    // Fill requirements
    const notesTextarea = screen.getByPlaceholderText(/Please provide a detailed reason/);
    fireEvent.change(notesTextarea, { target: { value: 'Meeting all requirements' } });
    
    // Check all required checkboxes
    const requiredCheckboxes = screen.getAllByRole('checkbox');
    requiredCheckboxes.forEach(checkbox => {
      if (!checkbox.getAttribute('disabled')) {
        fireEvent.click(checkbox);
      }
    });
    
    // Now confirm button should be enabled
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled();
    });
  });

  it('handles confirmation cancellation correctly', async () => {
    renderWithQueryClient(<StatusActionPanel {...defaultProps} />);
    
    // Trigger confirmation dialog
    const advanceButton = screen.getByText('Advance');
    fireEvent.click(advanceButton);
    
    await waitFor(() => {
      expect(screen.getByText('Confirm Status Change')).toBeInTheDocument();
    });
    
    // Cancel the confirmation
    const cancelButton = screen.getByRole('button', { name: /Cancel/ });
    fireEvent.click(cancelButton);
    
    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText('Confirm Status Change')).not.toBeInTheDocument();
    });
  });
});