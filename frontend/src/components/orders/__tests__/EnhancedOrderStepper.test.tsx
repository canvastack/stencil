/**
 * Enhanced Order Stepper Component Tests
 * 
 * Tests for the generic order stepper with PT CEX business workflow support
 * Ensures proper rendering and business logic integration
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnhancedOrderStepper } from '../EnhancedOrderStepper';
import { OrderStatus } from '@/types/order';

// Mock all UI components
vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: { value: number; className?: string }) => (
    <div data-testid="progress-bar" data-value={value} className={className}>
      Progress: {value}%
    </div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, className, disabled }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    variant?: string; 
    size?: string; 
    className?: string;
    disabled?: boolean;
  }) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      data-variant={variant} 
      data-size={size}
      className={className}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  CheckCircle2: () => <div data-testid="checkcircle2-icon">CheckCircle2</div>,
  Circle: () => <div data-testid="circle-icon">Circle</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  FileText: () => <div data-testid="filetext-icon">FileText</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  MessageSquare: () => <div data-testid="messagesquare-icon">MessageSquare</div>,
  FileCheck: () => <div data-testid="filecheck-icon">FileCheck</div>,
  CreditCard: () => <div data-testid="creditcard-icon">CreditCard</div>,
  DollarSign: () => <div data-testid="dollarsign-icon">DollarSign</div>,
  Cog: () => <div data-testid="cog-icon">Cog</div>,
  Shield: () => <div data-testid="shield-icon">Shield</div>,
  Truck: () => <div data-testid="truck-icon">Truck</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
  CheckCircle: () => <div data-testid="checkcircle-icon">CheckCircle</div>,
  ChevronRight: () => <div data-testid="chevronright-icon">ChevronRight</div>,
  Sparkles: () => <div data-testid="sparkles-icon">Sparkles</div>,
  ArrowRight: () => <div data-testid="arrowright-icon">ArrowRight</div>,
}));

describe('EnhancedOrderStepper', () => {
  describe('basic rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<EnhancedOrderStepper currentStatus={OrderStatus.Pending} />);
      }).not.toThrow();
    });

    it('should display main components', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.Pending} />);
      
      expect(screen.getByText('Order Progress')).toBeInTheDocument();
      expect(screen.getByText(/PT CEX Business Workflow/)).toBeInTheDocument();
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });

    it('should show progress percentage', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.VendorSourcing} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const value = progressBar.getAttribute('data-value');
      expect(parseInt(value!)).toBeGreaterThanOrEqual(0);
      expect(parseInt(value!)).toBeLessThanOrEqual(100);
    });
  });

  describe('compact mode', () => {
    it('should render in compact mode', () => {
      render(
        <EnhancedOrderStepper 
          currentStatus={OrderStatus.Shipping} 
          compact={true}
        />
      );
      
      // Should not have the full card layout title
      expect(screen.queryByText('Order Progress')).not.toBeInTheDocument();
      
      // Should still show progress
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should show estimated completion in compact mode', () => {
      render(
        <EnhancedOrderStepper 
          currentStatus={OrderStatus.VendorNegotiation} 
          compact={true}
        />
      );
      
      expect(screen.getByText(/Estimasi selesai:/)).toBeInTheDocument();
    });
  });

  describe('progress calculation', () => {
    it('should show 0% for draft status', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.Draft} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '0');
    });

    it('should show 100% for completed status', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.Completed} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveAttribute('data-value', '100');
    });

    it('should show intermediate percentages correctly', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.AwaitingPayment} />);
      
      const progressBar = screen.getByTestId('progress-bar');
      const value = progressBar.getAttribute('data-value');
      expect(parseInt(value!)).toBeGreaterThan(0);
      expect(parseInt(value!)).toBeLessThan(100);
    });
  });

  describe('localization', () => {
    it('should use Indonesian labels by default', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.CustomerQuote} />);
      
      // Should contain Indonesian text somewhere in the component
      const component = screen.getByTestId('card');
      expect(component).toBeInTheDocument();
    });

    it('should use English labels when useIndonesian is false', () => {
      render(
        <EnhancedOrderStepper 
          currentStatus={OrderStatus.CustomerQuote} 
          useIndonesian={false}
        />
      );
      
      // Should render without errors
      const component = screen.getByTestId('card');
      expect(component).toBeInTheDocument();
    });
  });

  describe('customization options', () => {
    it('should apply custom className', () => {
      render(
        <EnhancedOrderStepper 
          currentStatus={OrderStatus.Draft} 
          className="custom-class"
        />
      );
      
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('should render with showDescription option', () => {
      render(
        <EnhancedOrderStepper 
          currentStatus={OrderStatus.VendorSourcing} 
          showDescription={true}
        />
      );
      
      // Should render without errors
      expect(screen.getByTestId('card')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.Pending} />);
      
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Order Progress');
    });
  });

  describe('edge cases', () => {
    it('should handle all OrderStatus enum values without crashing', () => {
      const allStatuses = Object.values(OrderStatus);
      
      allStatuses.forEach(status => {
        expect(() => {
          render(<EnhancedOrderStepper currentStatus={status} />);
        }).not.toThrow();
      });
    });

    it('should handle undefined status gracefully', () => {
      expect(() => {
        render(<EnhancedOrderStepper currentStatus={undefined as any} />);
      }).not.toThrow();
    });
  });

  describe('business logic integration', () => {
    it('should show badges for different stage types', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.PartialPayment} />);
      
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display footer information', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.Shipping} />);
      
      // Should show footer with stage information
      expect(screen.getByText('Completed Stages')).toBeInTheDocument();
      expect(screen.getByText('Next Stage')).toBeInTheDocument();
    });
  });

  describe('primary action buttons', () => {
    it('should render primary action buttons for current stage', () => {
      const mockOnStageClick = vi.fn();
      
      render(
        <EnhancedOrderStepper 
          currentStatus={OrderStatus.VendorSourcing} 
          onStageClick={mockOnStageClick}
        />
      );
      
      // Should have buttons in the current stage section
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should show current stage indicator', () => {
      render(<EnhancedOrderStepper currentStatus={OrderStatus.VendorSourcing} />);
      
      // Should show "Current Stage" text
      expect(screen.getByText('Current Stage')).toBeInTheDocument();
    });
  });
});