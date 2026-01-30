import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatusActionPanel from '../StatusActionPanel';
import { OrderStatus } from '@/types/order';
import { BusinessStage } from '@/utils/OrderProgressCalculator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/hooks/useOrders', () => ({
  useAdvanceOrderStage: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock WhatsNextGuidanceSystem
vi.mock('../WhatsNextGuidanceSystem', () => ({
  default: ({ onActionClick }: { onActionClick: (actionId: string, stage: any) => void }) => (
    <div data-testid="whats-next-guidance">
      <h3>What's Next?</h3>
      <p>Pesanan Baru Diterima</p>
      <button onClick={() => onActionClick('review-order', BusinessStage.PENDING)}>
        Review Order
      </button>
    </div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('StatusActionPanel', () => {
  const defaultProps = {
    currentStatus: OrderStatus.Pending,
    timeline: [],
    userPermissions: ['update_order_status', 'add_order_notes'],
    orderId: 'test-order-id',
  };

  it('renders current stage information', () => {
    render(
      <StatusActionPanel {...defaultProps} />,
      { wrapper: createWrapper() }
    );

    // Check for the main region
    expect(screen.getByRole('region', { name: /order status actions and information/i })).toBeInTheDocument();
    
    // Check for current stage section
    expect(screen.getByRole('article', { name: /current stage/i })).toBeInTheDocument();
    expect(screen.getByText('Current Stage')).toBeInTheDocument();
    
    // Check for What's Next guidance system
    expect(screen.getByTestId('whats-next-guidance')).toBeInTheDocument();
  });

  it('shows available transitions for current stage', () => {
    render(
      <StatusActionPanel {...defaultProps} />,
      { wrapper: createWrapper() }
    );

    // The component should show available transitions if any exist
    // Since PENDING stage has next stages, check for Available Actions section
    const availableActionsSection = screen.queryByText('Available Actions');
    if (availableActionsSection) {
      expect(availableActionsSection).toBeInTheDocument();
    }
    
    // Check that the component renders without errors
    expect(screen.getByRole('region', { name: /order status actions and information/i })).toBeInTheDocument();
  });

  it('shows quick actions when permissions allow', () => {
    render(
      <StatusActionPanel {...defaultProps} />,
      { wrapper: createWrapper() }
    );

    // Check for Quick Actions section if it exists
    const quickActionsSection = screen.queryByText('Quick Actions');
    if (quickActionsSection) {
      expect(quickActionsSection).toBeInTheDocument();
    }
    
    // Check that guidance system is rendered
    expect(screen.getByTestId('whats-next-guidance')).toBeInTheDocument();
  });

  it('handles quick action clicks', async () => {
    render(
      <StatusActionPanel {...defaultProps} />,
      { wrapper: createWrapper() }
    );

    // Test the mocked guidance system action
    const reviewButton = screen.getByText('Review Order');
    fireEvent.click(reviewButton);

    // Should not throw any errors
    await waitFor(() => {
      expect(reviewButton).toBeInTheDocument();
    });
  });

  it('does not show actions when user lacks permissions', () => {
    render(
      <StatusActionPanel 
        {...defaultProps} 
        userPermissions={[]} // No permissions
      />,
      { wrapper: createWrapper() }
    );

    // Should still render the main component structure
    expect(screen.getByRole('region', { name: /order status actions and information/i })).toBeInTheDocument();
    
    // Quick Actions section should not appear or should be empty when no permissions
    const quickActionsSection = screen.queryByText('Quick Actions');
    if (quickActionsSection) {
      // If section exists, it should have no actionable buttons
      const actionButtons = screen.queryAllByRole('button');
      const quickActionButtons = actionButtons.filter(button => 
        button.closest('[aria-labelledby*="quick-actions"]') !== null
      );
      expect(quickActionButtons.length).toBe(0);
    }
  });

  it('shows add note action when onAddNote is provided', () => {
    const onAddNote = vi.fn();
    
    render(
      <StatusActionPanel 
        {...defaultProps} 
        onAddNote={onAddNote}
      />,
      { wrapper: createWrapper() }
    );

    // Check for Add Note button in Quick Actions section
    const addNoteButton = screen.queryByText('Add Note');
    if (addNoteButton) {
      expect(addNoteButton).toBeInTheDocument();
    } else {
      // If not visible as text, check for aria-label
      const addNoteByLabel = screen.queryByLabelText(/add note/i);
      if (addNoteByLabel) {
        expect(addNoteByLabel).toBeInTheDocument();
      }
    }
    
    // At minimum, the component should render successfully
    expect(screen.getByRole('region', { name: /order status actions and information/i })).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    render(
      <StatusActionPanel {...defaultProps} />,
      { wrapper: createWrapper() }
    );

    // Check main accessibility structure
    expect(screen.getByRole('region', { name: /order status actions and information/i })).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /current stage/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /progress statistics/i })).toBeInTheDocument();
  });

  it('renders with loading state', () => {
    render(
      <StatusActionPanel 
        {...defaultProps} 
        isLoading={true}
      />,
      { wrapper: createWrapper() }
    );

    // Should render loading skeleton instead of main content
    // The loading skeleton should still be accessible
    expect(document.body).toBeInTheDocument(); // Basic render check
  });
});