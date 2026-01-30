/**
 * Unit Tests for StageAdvancementModal Component
 * 
 * Tests the stage advancement modal functionality including:
 * - Basic rendering
 * - Hook integration
 * - Button states
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StageAdvancementModal from '@/components/orders/StageAdvancementModal';
import { OrderStatus } from '@/types/order';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the useAdvanceOrderStage hook
vi.mock('@/hooks/useOrders', () => ({
  useAdvanceOrderStage: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

// Mock the OrderProgressCalculator
vi.mock('@/utils/OrderProgressCalculator', () => ({
  OrderProgressCalculator: {
    calculateProgress: () => ({
      currentStage: 'vendor_sourcing',
      completedStages: ['vendor_sourcing'],
      nextStage: 'customer_quote',
    }),
    getStageInfo: () => ({
      indonesianLabel: 'Customer Quote',
      indonesianDescription: 'Preparing customer quote',
    }),
    estimateCompletionDays: () => 3,
  },
  BusinessStage: {
    VENDOR_SOURCING: 'vendor_sourcing',
    CUSTOMER_QUOTE: 'customer_quote',
    CUSTOMER_APPROVAL: 'customer_approval',
    PARTIAL_PAYMENT: 'partial_payment',
    FULL_PAYMENT: 'full_payment',
    IN_PRODUCTION: 'in_production',
    QUALITY_CONTROL: 'quality_control',
    SHIPPING: 'shipping',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  },
}));

// Mock the StatusColorSystem
vi.mock('@/utils/StatusColorSystem', () => ({
  StatusColorSystem: {
    getTimelineStageColor: () => ({
      tailwind: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
      },
    }),
  },
}));

describe('StageAdvancementModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    targetStage: 'customer_quote' as any,
    currentStatus: OrderStatus.VendorSourcing,
    currentStage: 'vendor_sourcing' as any,
    timeline: [],
    userPermissions: ['update_order_status'],
    orderId: 'test-order-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the modal with correct title', () => {
    render(<StageAdvancementModal {...defaultProps} />);
    
    expect(screen.getByText('Advance to Customer Quote')).toBeInTheDocument();
    expect(screen.getByText('Stage Advancement')).toBeInTheDocument();
  });

  it('returns null when targetStage is null', () => {
    const props = {
      ...defaultProps,
      targetStage: null,
    };
    
    const { container } = render(<StageAdvancementModal {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows notes field', () => {
    render(<StageAdvancementModal {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/Please provide a reason for advancing/)).toBeInTheDocument();
  });

  it('shows advance button', () => {
    render(<StageAdvancementModal {...defaultProps} />);
    
    expect(screen.getByRole('button', { name: /Advance Stage/i })).toBeInTheDocument();
  });

  it('handles modal close', () => {
    const mockOnClose = vi.fn();
    const props = {
      ...defaultProps,
      onClose: mockOnClose,
    };
    
    render(<StageAdvancementModal {...props} />);
    
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});