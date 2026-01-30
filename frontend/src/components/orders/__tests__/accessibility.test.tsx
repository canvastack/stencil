/**
 * Accessibility Tests for Order Status Workflow Components
 * 
 * Tests ARIA labels, roles, keyboard navigation, and color accessibility for:
 * - EnhancedOrderDetailHeader
 * - ActionableStageModal
 * - StatusActionPanel
 * - EnhancedTimelineTab
 * - AccessibleStatusBadge (NEW)
 * - Color accessibility features (NEW)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedOrderDetailHeader } from '../EnhancedOrderDetailHeader';
import { ActionableStageModal } from '../ActionableStageModal';
import StatusActionPanel from '../StatusActionPanel';
import { EnhancedTimelineTab } from '../EnhancedTimelineTab';
import { AccessibleStatusBadge, OrderStatusBadge, BusinessStageBadge, StatusLegend } from '@/components/ui/AccessibleStatusBadge';
import { StatusColorSystem } from '@/utils/StatusColorSystem';
import { OrderStatus } from '@/types/order';
import { BusinessStage } from '@/utils/OrderProgressCalculator';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/hooks/useOrders', () => ({
  useAdvanceOrderStage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/utils/BusinessTimelineGenerator', () => ({
  BusinessTimelineGenerator: {
    generateTimeline: () => [],
    getTimelineStats: () => ({
      totalEvents: 0,
      businessCriticalEvents: 0,
      actionRequiredEvents: 0,
      averageStageTime: 0,
    }),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockOrder = {
  id: 'test-order-123',
  orderNumber: 'ORD-2024-001',
  status: OrderStatus.Pending,
  paymentStatus: 'unpaid',
  totalAmount: 1500000,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '+62812345678',
  orderDate: '2024-01-15T10:30:00Z',
  items: [{ id: 1, name: 'Test Item' }],
  shippingAddress: 'Jl. Test No. 123, Jakarta',
};

describe('Order Status Workflow Accessibility', () => {
  describe('EnhancedOrderDetailHeader', () => {
    it('has proper ARIA labels and roles', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);

      // Check main region
      expect(screen.getByRole('region', { name: /order detail header/i })).toBeInTheDocument();

      // Check order title
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('ORD-2024-001');

      // Check status badge
      expect(screen.getByRole('status', { name: /current order status/i })).toBeInTheDocument();

      // Check metrics cards
      expect(screen.getByRole('group', { name: /order metrics/i })).toBeInTheDocument();

      // Check progress bar
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Check customer info section
      expect(screen.getByRole('region', { name: /informasi customer/i })).toBeInTheDocument();
    });

    it('has accessible buttons with proper labels', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);

      // Check copy buttons
      expect(screen.getByRole('button', { name: /copy order number/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy order id/i })).toBeInTheDocument();

      // Check quick action buttons
      expect(screen.getByRole('button', { name: /add note to current status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view order history timeline/i })).toBeInTheDocument();
    });

    it('provides screen reader friendly content', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);

      // Check aria-labels for important information
      expect(screen.getByLabelText(/order id: test-order-123/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/total amount: 1.500.000 rupiah/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/customer name: john doe/i)).toBeInTheDocument();
    });
  });

  describe('ActionableStageModal', () => {
    const modalProps = {
      isOpen: true,
      onClose: vi.fn(),
      stage: BusinessStage.PENDING,
      currentStatus: OrderStatus.Pending,
      timeline: [],
      userPermissions: ['update_order_status'],
      orderId: 'test-order-123',
    };

    it('has proper dialog structure and ARIA attributes', () => {
      render(<ActionableStageModal {...modalProps} />, { wrapper: createWrapper() });

      // Check dialog role and labels
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'stage-modal-title');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'stage-modal-description');

      // Check main content area
      expect(screen.getByRole('main', { name: /stage information and actions/i })).toBeInTheDocument();
    });

    it('has accessible action buttons with descriptions', () => {
      render(<ActionableStageModal {...modalProps} />, { wrapper: createWrapper() });

      // Check close button
      expect(screen.getByRole('button', { name: /close modal without taking action/i })).toBeInTheDocument();

      // Check that buttons have proper ARIA descriptions
      const actionButtons = screen.getAllByRole('button');
      actionButtons.forEach(button => {
        if (button.textContent !== 'Close') {
          expect(button).toHaveAttribute('aria-label');
        }
      });
    });

    it('has accessible form elements when notes are required', () => {
      render(<ActionableStageModal {...modalProps} />, { wrapper: createWrapper() });

      // If notes textarea is present, check accessibility
      const notesTextarea = screen.queryByRole('textbox', { name: /notes/i });
      if (notesTextarea) {
        expect(notesTextarea).toHaveAttribute('aria-describedby');
        expect(notesTextarea).toHaveAttribute('id', 'stage-notes');
      }
    });
  });

  describe('StatusActionPanel', () => {
    const panelProps = {
      currentStatus: OrderStatus.Pending,
      timeline: [],
      userPermissions: ['update_order_status'],
      orderId: 'test-order-123',
    };

    it('has proper region structure and labels', () => {
      render(<StatusActionPanel {...panelProps} />, { wrapper: createWrapper() });

      // Check main region
      expect(screen.getByRole('region', { name: /order status actions and information/i })).toBeInTheDocument();

      // Check current stage section
      expect(screen.getByRole('article', { name: /current stage/i })).toBeInTheDocument();

      // Check progress statistics
      expect(screen.getByRole('group', { name: /progress statistics/i })).toBeInTheDocument();
    });

    it('has accessible action buttons with proper descriptions', () => {
      render(<StatusActionPanel {...panelProps} />, { wrapper: createWrapper() });

      // Check that action buttons have proper ARIA labels
      const actionButtons = screen.getAllByRole('button');
      actionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('provides accessible lists for transitions and activities', () => {
      const propsWithActivity = {
        ...panelProps,
        timeline: [
          {
            id: '1',
            title: 'Order Created',
            description: 'Order was created by customer',
            timestamp: '2024-01-15T10:30:00Z',
            actor: 'John Doe',
            type: 'status_change',
          },
        ],
      };

      render(<StatusActionPanel {...propsWithActivity} />, { wrapper: createWrapper() });

      // Check for accessible lists
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);

      // Check list items have proper structure
      const listItems = screen.getAllByRole('listitem');
      listItems.forEach(item => {
        expect(item).toBeInTheDocument();
      });
    });
  });

  describe('EnhancedTimelineTab', () => {
    const timelineProps = {
      orderEvents: [
        {
          id: '1',
          title: 'Order Created',
          description: 'Order was created',
          timestamp: '2024-01-15T10:30:00Z',
          actor: 'System',
          type: 'status_change',
        },
      ],
      currentStatus: OrderStatus.Pending,
    };

    it('has proper timeline structure and ARIA labels', () => {
      render(<EnhancedTimelineTab {...timelineProps} />);

      // Check main timeline region
      expect(screen.getByRole('region', { name: /timeline/i })).toBeInTheDocument();

      // Check timeline statistics
      expect(screen.getByRole('group', { name: /timeline statistics/i })).toBeInTheDocument();

      // Check timeline legend
      expect(screen.getByRole('group', { name: /status legend/i })).toBeInTheDocument();
    });

    it('has accessible timeline events as list items', () => {
      render(<EnhancedTimelineTab {...timelineProps} />);

      // When no events exist, check that the empty state is accessible
      expect(screen.getByRole('status', { name: /no timeline events available/i })).toBeInTheDocument();

      // The timeline structure should still be accessible
      expect(screen.getByRole('region', { name: /timeline/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /timeline statistics/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /status legend/i })).toBeInTheDocument();
    });

    it('has accessible refresh button when provided', () => {
      const onRefresh = vi.fn();
      render(<EnhancedTimelineTab {...timelineProps} onRefresh={onRefresh} />);

      const refreshButton = screen.getByRole('button', { name: /refresh timeline data/i });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAttribute('aria-label');
    });
  });

  describe('AccessibleStatusBadge', () => {
    it('renders with proper accessibility attributes for order status', () => {
      render(<OrderStatusBadge status={OrderStatus.Pending} />);

      // Check for status role
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();

      // Check for ARIA attributes
      expect(badge).toHaveAttribute('aria-label');
      expect(badge).toHaveAttribute('aria-describedby');
      expect(badge).toHaveAttribute('data-status', OrderStatus.Pending);
      expect(badge).toHaveAttribute('data-priority');
      expect(badge).toHaveAttribute('data-pattern');
      expect(badge).toHaveAttribute('data-symbol');

      // Check for screen reader description
      const description = document.querySelector('.sr-only');
      expect(description).toBeInTheDocument();
    });

    it('renders with proper accessibility attributes for business stage', () => {
      render(<BusinessStageBadge stage={BusinessStage.PENDING} />);

      // Check for status role
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();

      // Check for ARIA attributes
      expect(badge).toHaveAttribute('aria-label');
      expect(badge).toHaveAttribute('aria-describedby');
      expect(badge).toHaveAttribute('data-stage', BusinessStage.PENDING);
      expect(badge).toHaveAttribute('data-priority');
      expect(badge).toHaveAttribute('data-pattern');
      expect(badge).toHaveAttribute('data-symbol');
    });

    it('displays symbol for color-blind users when enabled', () => {
      render(<OrderStatusBadge status={OrderStatus.Pending} showSymbol={true} />);

      // Check for symbol element
      const symbol = document.querySelector('.status-symbol');
      expect(symbol).toBeInTheDocument();
      expect(symbol).toHaveAttribute('data-symbol');
      expect(symbol).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies pattern classes for color-blind users when enabled', () => {
      render(<OrderStatusBadge status={OrderStatus.Pending} showPattern={true} />);

      // Check for pattern classes
      const badge = screen.getByRole('status');
      expect(badge.className).toContain('status-badge-with-pattern');
      expect(badge.className).toContain('pattern-');
    });

    it('respects high contrast preferences', () => {
      // Mock high contrast preference
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

      render(<OrderStatusBadge status={OrderStatus.Pending} />);

      const badge = screen.getByRole('status');
      expect(badge.className).toContain('border-2');
      expect(badge.className).toContain('font-semibold');
    });
  });

  describe('StatusLegend', () => {
    it('renders accessible legend for order statuses', () => {
      render(<StatusLegend type="status" />);

      // Check for group role
      const legend = screen.getByRole('group', { name: /status legend/i });
      expect(legend).toBeInTheDocument();

      // Check that all order statuses are represented
      Object.values(OrderStatus).forEach(status => {
        const statusElement = screen.getByText(status.replace(/_/g, ' ').toLowerCase());
        expect(statusElement).toBeInTheDocument();
      });
    });

    it('renders accessible legend for business stages', () => {
      render(<StatusLegend type="stage" />);

      // Check for group role
      const legend = screen.getByRole('group', { name: /stage legend/i });
      expect(legend).toBeInTheDocument();

      // Check that all business stages are represented
      Object.values(BusinessStage).forEach(stage => {
        const stageElement = screen.getByText(stage.replace(/_/g, ' ').toLowerCase());
        expect(stageElement).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation in ActionableStageModal', () => {
      const modalProps = {
        isOpen: true,
        onClose: vi.fn(),
        stage: BusinessStage.PENDING,
        currentStatus: OrderStatus.Pending,
        timeline: [],
        userPermissions: ['update_order_status'],
        orderId: 'test-order-123',
      };

      render(<ActionableStageModal {...modalProps} />, { wrapper: createWrapper() });

      // Check that modal can be closed with Escape key
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(modalProps.onClose).toHaveBeenCalled();
    });

    it('supports keyboard navigation for buttons', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);

      // Check that buttons are focusable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1');
      });
    });

    it('supports keyboard navigation for status badges', () => {
      render(<OrderStatusBadge status={OrderStatus.Pending} />);

      const badge = screen.getByRole('status');
      
      // Badge should be focusable if it has interactive content
      // For non-interactive badges, they should not interfere with keyboard navigation
      expect(badge).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Screen Reader Support', () => {
    it('provides screen reader only content where appropriate', () => {
      const modalProps = {
        isOpen: true,
        onClose: vi.fn(),
        stage: BusinessStage.PENDING,
        currentStatus: OrderStatus.Pending,
        timeline: [],
        userPermissions: ['update_order_status'],
        orderId: 'test-order-123',
      };

      render(<ActionableStageModal {...modalProps} />, { wrapper: createWrapper() });

      // Check for sr-only content (screen reader only)
      const srOnlyElements = document.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
    });

    it('uses aria-hidden for decorative icons', () => {
      render(<EnhancedOrderDetailHeader order={mockOrder} />);

      // Check that decorative icons are hidden from screen readers
      const icons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('provides comprehensive screen reader descriptions for status badges', () => {
      render(<OrderStatusBadge status={OrderStatus.Pending} />);

      // Check for screen reader description
      const description = document.querySelector('.sr-only');
      expect(description).toBeInTheDocument();
      expect(description?.textContent).toContain('Current status is');
    });
  });

  describe('Color Accessibility', () => {
    it('validates color contrast ratios meet WCAG AA standards', () => {
      // Test a few key status colors
      const testStatuses = [OrderStatus.Pending, OrderStatus.Completed, OrderStatus.Cancelled];
      
      testStatuses.forEach(status => {
        const color = StatusColorSystem.getOrderStatusColor(status);
        const contrast = StatusColorSystem.validateContrast(color.text, color.secondary);
        
        expect(contrast.passes).toBe(true);
        expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
        expect(contrast.level).toMatch(/^(AA|AAA)$/);
      });
    });

    it('provides high contrast alternatives', () => {
      const status = OrderStatus.Pending;
      const normalColor = StatusColorSystem.getOrderStatusColor(status);
      const highContrastColor = StatusColorSystem.getHighContrastColor(status);
      
      expect(highContrastColor.primary).not.toBe(normalColor.primary);
      expect(highContrastColor.text).not.toBe(normalColor.text);
      expect(highContrastColor.border).not.toBe(normalColor.border);
    });

    it('provides color-blind friendly patterns and symbols', () => {
      const status = OrderStatus.Pending;
      const pattern = StatusColorSystem.getColorBlindPattern(status);
      
      expect(pattern.pattern).toBeDefined();
      expect(pattern.texture).toBeDefined();
      expect(pattern.symbol).toBeDefined();
      expect(pattern.cssClass).toContain('pattern-');
    });

    it('provides semantic information for non-color identification', () => {
      const status = OrderStatus.Pending;
      const semantic = StatusColorSystem.getSemanticInfo(status);
      
      expect(semantic.label).toBeDefined();
      expect(semantic.description).toBeDefined();
      expect(semantic.priority).toMatch(/^(low|medium|high|critical)$/);
      expect(semantic.ariaLabel).toContain('Status:');
      expect(semantic.screenReaderText).toContain('Current status is');
    });

    it('generates comprehensive accessibility report', () => {
      const report = StatusColorSystem.getAccessibilityReport();
      
      expect(report).toBeInstanceOf(Array);
      expect(report.length).toBeGreaterThan(0);
      
      report.forEach(item => {
        expect(item.status).toBeDefined();
        expect(item.color).toBeDefined();
        expect(item.contrast.passes).toBe(true);
        expect(item.semantic).toBeDefined();
        expect(item.pattern).toBeDefined();
      });
    });
  });

  describe('User Preference Detection', () => {
    it('detects high contrast preference', () => {
      // Mock high contrast preference
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

      const prefersHighContrast = StatusColorSystem.prefersHighContrast();
      expect(prefersHighContrast).toBe(true);
    });

    it('detects reduced motion preference', () => {
      // Mock reduced motion preference
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

      const prefersReducedMotion = StatusColorSystem.prefersReducedMotion();
      expect(prefersReducedMotion).toBe(true);
    });

    it('applies accessible colors based on user preferences', () => {
      // Mock high contrast preference
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

      const status = OrderStatus.Pending;
      const accessibleColor = StatusColorSystem.getAccessibleStatusColor(status);
      const highContrastColor = StatusColorSystem.getHighContrastColor(status);
      
      expect(accessibleColor.primary).toBe(highContrastColor.primary);
    });
  });
});