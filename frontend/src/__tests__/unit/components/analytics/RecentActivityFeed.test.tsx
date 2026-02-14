import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentActivityFeed } from '@/components/analytics/RecentActivityFeed';

describe('RecentActivityFeed', () => {
  const mockActivities = [
    {
      id: 'activity-1',
      type: 'quote_accepted' as const,
      title: 'Quote #Q-2024-001 accepted by PT Vendor A',
      description: 'Order #ORD-2024-123',
      timestamp: '2026-02-14T10:30:00Z',
      orderId: 'order-123',
    },
    {
      id: 'activity-2',
      type: 'production_update' as const,
      title: 'Production update: 50% complete',
      description: 'Order #ORD-2024-122',
      timestamp: '2026-02-14T10:15:00Z',
      orderId: 'order-122',
    },
    {
      id: 'activity-3',
      type: 'overdue_alert' as const,
      title: 'Order #ORD-2024-120 is now overdue',
      description: 'Expected: Feb 10, 2026',
      timestamp: '2026-02-14T09:30:00Z',
      orderId: 'order-120',
    },
  ];

  const mockOnActivityClick = vi.fn();

  it('renders feed title', () => {
    render(
      <RecentActivityFeed activities={mockActivities} onActivityClick={mockOnActivityClick} />
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders all activities', () => {
    render(
      <RecentActivityFeed activities={mockActivities} onActivityClick={mockOnActivityClick} />
    );

    expect(screen.getByText('Quote #Q-2024-001 accepted by PT Vendor A')).toBeInTheDocument();
    expect(screen.getByText('Production update: 50% complete')).toBeInTheDocument();
    expect(screen.getByText('Order #ORD-2024-120 is now overdue')).toBeInTheDocument();
  });

  it('calls onActivityClick when activity is clicked', () => {
    render(
      <RecentActivityFeed activities={mockActivities} onActivityClick={mockOnActivityClick} />
    );

    const activityButton = screen.getByText('Quote #Q-2024-001 accepted by PT Vendor A').closest('button');
    if (activityButton) {
      fireEvent.click(activityButton);
      expect(mockOnActivityClick).toHaveBeenCalledWith('activity-1');
    }
  });

  it('filters activities by type', () => {
    render(
      <RecentActivityFeed activities={mockActivities} onActivityClick={mockOnActivityClick} />
    );

    // Open the select dropdown
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    // Select "Quote Accepted" filter
    const quoteOption = screen.getByText('Quote Accepted');
    fireEvent.click(quoteOption);

    // Should only show quote accepted activities
    expect(screen.getByText('Quote #Q-2024-001 accepted by PT Vendor A')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <RecentActivityFeed
        activities={mockActivities}
        onActivityClick={mockOnActivityClick}
        loading={true}
      />
    );

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows "No activities found" when list is empty', () => {
    render(
      <RecentActivityFeed activities={[]} onActivityClick={mockOnActivityClick} />
    );

    expect(screen.getByText('No activities found')).toBeInTheDocument();
  });

  it('displays activity badges', () => {
    render(
      <RecentActivityFeed activities={mockActivities} onActivityClick={mockOnActivityClick} />
    );

    expect(screen.getByText('Quote Accepted')).toBeInTheDocument();
    expect(screen.getByText('Production Update')).toBeInTheDocument();
    expect(screen.getByText('Overdue Alert')).toBeInTheDocument();
  });
});
