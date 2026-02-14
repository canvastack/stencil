/**
 * ProductionCountdown Component Tests
 * 
 * Tests for the ProductionCountdown component functionality
 * 
 * Test Coverage:
 * - Date calculations (elapsed, remaining, expected delivery)
 * - Overdue detection and warnings
 * - Approaching deadline warnings
 * - Progress percentage calculations
 * - Responsive behavior and styling
 * - Edge cases (0 days, negative days, large numbers)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductionCountdown } from '../ProductionCountdown';
import { addDays, subDays, format } from 'date-fns';

describe('ProductionCountdown', () => {
  // Mock current date for consistent testing
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-14T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Date Calculations', () => {
    it('renders date range correctly', () => {
      const acceptedDate = new Date('2024-01-01').toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('Accepted')).toBeInTheDocument();
      expect(screen.getByText('Expected')).toBeInTheDocument();
    });

    it('calculates days elapsed correctly', () => {
      const acceptedDate = subDays(new Date(), 5).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('Days Elapsed')).toBeInTheDocument();
      expect(screen.getByLabelText(/5 days have elapsed/i)).toBeInTheDocument();
    });

    it('calculates days remaining correctly', () => {
      const acceptedDate = subDays(new Date(), 5).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('Days Remaining')).toBeInTheDocument();
      expect(screen.getByLabelText(/5 days remaining/i)).toBeInTheDocument();
    });

    it('calculates expected delivery date correctly', () => {
      const acceptedDate = new Date('2024-01-01').toISOString();
      const estimatedDays = 10;
      const expectedDate = addDays(new Date('2024-01-01'), 10);
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const formattedExpected = format(expectedDate, 'MMM d, yyyy');
      expect(screen.getByText(formattedExpected)).toBeInTheDocument();
    });

    it('handles same-day acceptance (0 days elapsed)', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByLabelText(/0 days have elapsed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/10 days remaining/i)).toBeInTheDocument();
    });

    it('handles large estimated days correctly', () => {
      const acceptedDate = subDays(new Date(), 10).toISOString();
      const estimatedDays = 365;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByLabelText(/10 days have elapsed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/355 days remaining/i)).toBeInTheDocument();
    });
  });

  describe('Overdue Detection', () => {
    it('shows overdue warning when past deadline', () => {
      const acceptedDate = subDays(new Date(), 15).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText(/Production is/)).toBeInTheDocument();
      expect(screen.getByText(/5 days overdue/)).toBeInTheDocument();
    });

    it('shows correct overdue days count', () => {
      const acceptedDate = subDays(new Date(), 20).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText(/10 days overdue/)).toBeInTheDocument();
    });

    it('displays overdue alert with proper styling', () => {
      const acceptedDate = subDays(new Date(), 15).toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass('animate-in');
    });

    it('shows overdue on exact deadline day', () => {
      const acceptedDate = subDays(new Date(), 10).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      // On exact deadline day, days remaining = 0, which shows "Overdue"
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('shows overdue one day after deadline', () => {
      const acceptedDate = subDays(new Date(), 11).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText(/1 days overdue/)).toBeInTheDocument();
    });
  });

  describe('Approaching Deadline Warning', () => {
    it('shows approaching deadline warning when 3 days remaining', () => {
      const acceptedDate = subDays(new Date(), 7).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText(/Approaching deadline/)).toBeInTheDocument();
      expect(screen.getByText(/3 days/)).toBeInTheDocument();
    });

    it('shows approaching deadline warning when 2 days remaining', () => {
      const acceptedDate = subDays(new Date(), 8).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText(/Approaching deadline/)).toBeInTheDocument();
      expect(screen.getByText(/2 days/)).toBeInTheDocument();
    });

    it('shows approaching deadline warning when 1 day remaining', () => {
      const acceptedDate = subDays(new Date(), 9).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText(/Approaching deadline/)).toBeInTheDocument();
      expect(screen.getByText(/1 day/)).toBeInTheDocument();
    });

    it('does not show approaching deadline warning when 4 days remaining', () => {
      const acceptedDate = subDays(new Date(), 6).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.queryByText(/Approaching deadline/)).not.toBeInTheDocument();
    });

    it('does not show warnings when on track', () => {
      const acceptedDate = subDays(new Date(), 2).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.queryByText(/overdue/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Approaching deadline/)).not.toBeInTheDocument();
    });

    it('uses singular "day" for 1 day remaining', () => {
      const acceptedDate = subDays(new Date(), 9).toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      // Check for the alert message with singular "day"
      expect(screen.getByText(/Approaching deadline/)).toBeInTheDocument();
      
      // Find the alert and check its content
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(alert?.textContent).toContain('1 day remaining');
    });

    it('uses plural "days" for multiple days remaining', () => {
      const acceptedDate = subDays(new Date(), 8).toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      // Check for the alert message with plural "days"
      expect(screen.getByText(/Approaching deadline/)).toBeInTheDocument();
      
      // Find the alert and check its content
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(alert?.textContent).toContain('2 days remaining');
    });
  });

  describe('Progress Percentage Calculation', () => {
    it('calculates progress percentage correctly at 50%', () => {
      const acceptedDate = subDays(new Date(), 5).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('50% complete')).toBeInTheDocument();
    });

    it('calculates progress percentage correctly at 0%', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('0% complete')).toBeInTheDocument();
    });

    it('calculates progress percentage correctly at 25%', () => {
      const acceptedDate = subDays(new Date(), 3).toISOString();
      const estimatedDays = 12;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('25% complete')).toBeInTheDocument();
    });

    it('calculates progress percentage correctly at 75%', () => {
      const acceptedDate = subDays(new Date(), 6).toISOString();
      const estimatedDays = 8;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('75% complete')).toBeInTheDocument();
    });

    it('caps progress at 100% when overdue', () => {
      const acceptedDate = subDays(new Date(), 15).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });

    it('shows 100% on exact deadline', () => {
      const acceptedDate = subDays(new Date(), 10).toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByText('100% complete')).toBeInTheDocument();
    });

    it('rounds progress percentage to nearest integer', () => {
      const acceptedDate = subDays(new Date(), 4).toISOString();
      const estimatedDays = 11;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      // 4 / 11 = 36.36% rounds to 36%
      expect(screen.getByText('36% complete')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies custom className', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays}
          className="custom-class"
        />
      );
      
      const element = container.querySelector('.custom-class');
      expect(element).toBeInTheDocument();
    });

    it('renders with proper spacing classes', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const element = container.querySelector('.space-y-3');
      expect(element).toBeInTheDocument();
    });

    it('renders date range with flex layout', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const dateRange = container.querySelector('.flex.justify-between');
      expect(dateRange).toBeInTheDocument();
    });

    it('renders days counter with flex layout', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const counters = container.querySelectorAll('.flex.justify-between.items-center');
      expect(counters.length).toBeGreaterThan(0);
    });

    it('applies responsive text sizes', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const smallText = container.querySelector('.text-sm');
      const extraSmallText = container.querySelector('.text-xs');
      const largeText = container.querySelector('.text-2xl');
      
      expect(smallText).toBeInTheDocument();
      expect(extraSmallText).toBeInTheDocument();
      expect(largeText).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for accessibility', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByRole('region', { name: /production countdown/i })).toBeInTheDocument();
    });

    it('has ARIA labels for date range', () => {
      const acceptedDate = new Date('2024-01-01').toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByRole('group', { name: /production date range/i })).toBeInTheDocument();
    });

    it('has ARIA labels for progress', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByRole('group', { name: /production progress/i })).toBeInTheDocument();
    });

    it('has ARIA labels for timeline', () => {
      const acceptedDate = new Date().toISOString();
      const estimatedDays = 10;
      
      render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      expect(screen.getByRole('group', { name: /production timeline/i })).toBeInTheDocument();
    });

    it('has aria-live for overdue alert', () => {
      const acceptedDate = subDays(new Date(), 15).toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const alert = container.querySelector('[aria-live="polite"]');
      expect(alert).toBeInTheDocument();
    });

    it('has aria-live for approaching deadline alert', () => {
      const acceptedDate = subDays(new Date(), 8).toISOString();
      const estimatedDays = 10;
      
      const { container } = render(
        <ProductionCountdown 
          acceptedDate={acceptedDate} 
          estimatedDays={estimatedDays} 
        />
      );
      
      const alert = container.querySelector('[aria-live="polite"]');
      expect(alert).toBeInTheDocument();
    });
  });
});
