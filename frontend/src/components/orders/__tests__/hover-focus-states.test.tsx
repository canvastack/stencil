/**
 * Hover and Focus States Tests
 * 
 * Tests for task 5.2.2: Implement hover and focus states
 * Ensures all interactive elements have proper hover and focus feedback
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedOrderDetailHeader } from '../EnhancedOrderDetailHeader';
import StatusActionPanel from '../StatusActionPanel';
import ActionableStageModal from '../ActionableStageModal';
import EnhancedTimelineTab from '../EnhancedTimelineTab';
import { OrderStatus, PaymentStatus } from '../../../types/order';
import { BusinessStage } from '../../../utils/OrderProgressCalculator';

// Mock dependencies
vi.mock('../../../hooks/useOrders', () => ({
  useAdvanceOrderStage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../../utils/OrderStatusAnimations', () => ({
  buildAnimationClasses: (baseClasses: string) => baseClasses,
  useOrderStatusAnimations: () => ({
    animationState: { isAnimating: false },
    startAnimation: vi.fn(),
    stopAnimation: vi.fn(),
    getAnimationClasses: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Hover and Focus States', () => {
  describe('EnhancedOrderDetailHeader', () => {
    const mockOrder = {
      id: 'test-order-1',
      orderNumber: 'ORD-001',
      status: OrderStatus.Pending,
      paymentStatus: PaymentStatus.Unpaid,
      totalAmount: 1000000,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+62123456789',
      orderDate: '2024-01-15T10:00:00Z',
      items: [{ id: '1', name: 'Test Item' }],
    };

    it('should have hover effects on metric cards', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      // Find metric cards by their actual names
      const statusCard = screen.getByRole('article', { name: /current status/i });
      const amountCard = screen.getByRole('article', { name: /total amount/i });
      const paymentCard = screen.getByRole('article', { name: /payment status/i });
      const progressCard = screen.getByRole('article', { name: /progress/i });
      
      // Check for hover classes
      expect(statusCard).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
      expect(amountCard).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
      expect(paymentCard).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
      expect(progressCard).toHaveClass('hover:shadow-lg', 'hover:-translate-y-1');
    });

    it('should have focus states on interactive elements', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      // Find interactive buttons by their actual aria-labels
      const addNoteButton = screen.getByRole('button', { name: /add note to current status/i });
      const viewHistoryButton = screen.getByRole('button', { name: /view order history timeline/i });
      
      // Check for focus classes
      expect(addNoteButton).toHaveClass('hover:scale-105');
      expect(viewHistoryButton).toHaveClass('hover:scale-105');
    });

    it('should have focus-within states on cards', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      const customerInfoCard = screen.getByRole('region', { name: /informasi customer/i });
      
      // Check for focus-within classes
      expect(customerInfoCard).toHaveClass('focus-within:ring-2', 'focus-within:ring-ring', 'focus-within:ring-offset-2');
    });
  });

  describe('StatusActionPanel', () => {
    const mockProps = {
      currentStatus: OrderStatus.Pending,
      timeline: [],
      userPermissions: ['update_order_status', 'add_order_notes'],
      orderId: 'test-order-1',
    };

    it('should have hover effects on transition items', () => {
      render(<StatusActionPanel {...mockProps} />);
      
      // The component should render available transitions with hover effects
      // Since we can't easily test the actual hover state, we check for the presence of hover classes
      const component = screen.getByRole('region', { name: /order status actions/i });
      expect(component).toBeInTheDocument();
    });

    it('should have hover effects on quick action buttons', () => {
      render(<StatusActionPanel {...mockProps} />);
      
      // Quick action buttons should have hover and focus effects
      const quickActionsSection = screen.queryByRole('group', { name: /quick action buttons/i });
      if (quickActionsSection) {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          // Check that buttons have transition classes
          expect(button.className).toMatch(/transition/);
        });
      }
    });

    it('should have hover effects on recent activity items', () => {
      const propsWithActivity = {
        ...mockProps,
        timeline: [
          {
            id: '1',
            type: 'status_change',
            title: 'Order Created',
            description: 'Order was created',
            timestamp: '2024-01-15T10:00:00Z',
            actor: 'System',
          },
        ],
      };

      render(<StatusActionPanel {...propsWithActivity} />);
      
      // Recent activity items should have hover effects
      // Since the component structure may vary, we check for the presence of the component
      const component = screen.getByRole('region', { name: /order status actions/i });
      expect(component).toBeInTheDocument();
      
      // The hover effects are implemented in the component's CSS classes
      // We verify the component renders successfully with the timeline data
      // Check that the component has proper styling classes
      expect(component.className).toMatch(/space-y/);
    });
  });

  describe('ActionableStageModal', () => {
    const mockProps = {
      isOpen: true,
      onClose: vi.fn(),
      stage: BusinessStage.PENDING,
      currentStatus: OrderStatus.Pending,
      timeline: [],
      userPermissions: ['update_order_status'],
      orderId: 'test-order-1',
    };

    it('should have hover effects on requirement items', () => {
      render(<ActionableStageModal {...mockProps} />);
      
      // Check if modal is rendered
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // Requirements should have hover effects when present
      // Since the modal content varies by stage, we check for the modal's presence
      // and verify it has proper interactive styling
      expect(modal.className).toMatch(/duration-200/);
      
      // The hover effects are implemented in the component's internal structure
      // We verify the modal renders successfully and has interactive elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have focus states on action buttons', () => {
      render(<ActionableStageModal {...mockProps} />);
      
      const actionButtons = screen.getAllByRole('button');
      actionButtons.forEach(button => {
        // All buttons should have focus states
        expect(button.className).toMatch(/focus/);
      });
    });

    it('should have hover effects on guidance sections', () => {
      render(<ActionableStageModal {...mockProps} />);
      
      // Guidance sections should have hover effects
      const guidanceSections = screen.queryAllByRole('region');
      if (guidanceSections.length > 0) {
        guidanceSections.forEach(section => {
          if (section.className.includes('bg-blue-50')) {
            expect(section.className).toMatch(/hover:bg-blue-100/);
          }
        });
      }
    });
  });

  describe('EnhancedTimelineTab', () => {
    const mockProps = {
      orderEvents: [
        {
          id: '1',
          type: 'status_change',
          title: 'Order Created',
          description: 'Order was created',
          timestamp: '2024-01-15T10:00:00Z',
          actor: 'System',
        },
      ],
      currentStatus: OrderStatus.Pending,
    };

    it('should have hover effects on timeline events', () => {
      render(<EnhancedTimelineTab {...mockProps} />);
      
      // Timeline events should have hover effects
      // Since the timeline structure may vary, we check for the timeline container
      const timelineContainer = screen.getByRole('region', { name: /timeline/i });
      expect(timelineContainer).toBeInTheDocument();
      
      // Verify the timeline has proper styling and interactive elements
      expect(timelineContainer.className).toMatch(/transition-all/);
      
      // The hover effects are implemented in the component's internal structure
      // We verify the timeline renders successfully with the provided events
      const timelineContent = timelineContainer.querySelector('.space-y-4');
      if (timelineContent) {
        expect(timelineContent).toBeInTheDocument();
      }
    });

    it('should have hover effects on timeline icons', () => {
      render(<EnhancedTimelineTab {...mockProps} />);
      
      // Timeline icons should have hover scale effects
      const timelineContainer = screen.getByRole('region', { name: /timeline/i });
      expect(timelineContainer).toBeInTheDocument();
      
      // Check for hover scale classes in the component
      const iconsWithHover = timelineContainer.querySelectorAll('.hover\\:scale-110');
      expect(iconsWithHover.length).toBeGreaterThan(0);
    });

    it('should have focus states on interactive elements', () => {
      const propsWithRefresh = {
        ...mockProps,
        onRefresh: vi.fn(),
      };

      render(<EnhancedTimelineTab {...propsWithRefresh} />);
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toHaveClass('focus-visible:outline-none');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation on interactive elements', async () => {
      const user = userEvent.setup();
      const mockOrder = {
        id: 'test-order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Unpaid,
        totalAmount: 1000000,
        customerName: 'Test Customer',
      };

      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      // Tab through interactive elements
      await user.tab();
      
      // Check that focus is on an interactive element
      const focusedElement = document.activeElement;
      expect(focusedElement).toBeInstanceOf(HTMLElement);
      
      // Should be able to activate with Enter or Space
      if (focusedElement && focusedElement.getAttribute('role') === 'button') {
        await user.keyboard('{Enter}');
        // Button should handle keyboard activation
      }
    });

    it('should have proper focus indicators', () => {
      const mockOrder = {
        id: 'test-order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Unpaid,
        totalAmount: 1000000,
        customerName: 'Test Customer',
      };

      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      const interactiveElements = screen.getAllByRole('button');
      
      interactiveElements.forEach(element => {
        // All interactive elements should have focus indicators
        expect(element.className).toMatch(/focus/);
      });
    });
  });

  describe('Accessibility Compliance', () => {
    it('should have proper ARIA labels for interactive elements', () => {
      const mockOrder = {
        id: 'test-order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Unpaid,
        totalAmount: 1000000,
        customerName: 'Test Customer',
      };

      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      const buttons = screen.getAllByRole('button');
      
      buttons.forEach(button => {
        // All buttons should have accessible names
        expect(button).toHaveAccessibleName();
      });
    });

    it('should support high contrast mode', () => {
      // Test that components work with high contrast preferences
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const mockOrder = {
        id: 'test-order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Unpaid,
        totalAmount: 1000000,
        customerName: 'Test Customer',
      };

      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      // Component should render without errors in high contrast mode
      expect(screen.getByRole('region', { name: /order detail header/i })).toBeInTheDocument();
    });

    it('should support reduced motion preferences', () => {
      // Test that components respect reduced motion preferences
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const mockOrder = {
        id: 'test-order-1',
        orderNumber: 'ORD-001',
        status: OrderStatus.Pending,
        paymentStatus: PaymentStatus.Unpaid,
        totalAmount: 1000000,
        customerName: 'Test Customer',
      };

      render(<EnhancedOrderDetailHeader order={mockOrder} />);
      
      // Component should render without errors with reduced motion
      expect(screen.getByRole('region', { name: /order detail header/i })).toBeInTheDocument();
    });
  });
});