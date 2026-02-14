import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryStatusChart } from '@/components/analytics/DeliveryStatusChart';

describe('DeliveryStatusChart', () => {
  const mockData = [
    { status: 'on_track' as const, count: 11, percentage: 45.8 },
    { status: 'approaching' as const, count: 6, percentage: 25.0 },
    { status: 'overdue' as const, count: 4, percentage: 16.7 },
    { status: 'completed' as const, count: 3, percentage: 12.5 },
  ];

  const mockOnStatusClick = vi.fn();

  it('renders chart title', () => {
    render(
      <DeliveryStatusChart data={mockData} onStatusClick={mockOnStatusClick} />
    );

    expect(screen.getByText('Delivery Status Distribution')).toBeInTheDocument();
  });

  it('displays total orders count', () => {
    render(
      <DeliveryStatusChart data={mockData} onStatusClick={mockOnStatusClick} />
    );

    const totalOrders = mockData.reduce((sum, item) => sum + item.count, 0);
    expect(screen.getByText(totalOrders.toString())).toBeInTheDocument();
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <DeliveryStatusChart
        data={mockData}
        onStatusClick={mockOnStatusClick}
        loading={true}
      />
    );

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders chart with empty data', () => {
    render(
      <DeliveryStatusChart data={[]} onStatusClick={mockOnStatusClick} />
    );

    expect(screen.getByText('Delivery Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays all status categories in legend', () => {
    render(
      <DeliveryStatusChart data={mockData} onStatusClick={mockOnStatusClick} />
    );

    expect(screen.getByText('On Track')).toBeInTheDocument();
    expect(screen.getByText('Approaching Deadline')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
