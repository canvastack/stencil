import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductionTimelineChart } from '@/components/analytics/ProductionTimelineChart';

describe('ProductionTimelineChart', () => {
  const mockData = [
    { date: '2026-02-01', accepted: 12, completed: 10, overdue: 2 },
    { date: '2026-02-02', accepted: 15, completed: 13, overdue: 1 },
    { date: '2026-02-03', accepted: 10, completed: 11, overdue: 0 },
  ];

  const mockOnTimeRangeChange = vi.fn();

  it('renders chart title', () => {
    render(
      <ProductionTimelineChart
        data={mockData}
        timeRange="30d"
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );

    expect(screen.getByText('Production Timeline')).toBeInTheDocument();
  });

  it('renders all time range buttons', () => {
    render(
      <ProductionTimelineChart
        data={mockData}
        timeRange="30d"
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );

    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
  });

  it('calls onTimeRangeChange when button is clicked', () => {
    render(
      <ProductionTimelineChart
        data={mockData}
        timeRange="30d"
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );

    const button7d = screen.getByText('7D');
    fireEvent.click(button7d);

    expect(mockOnTimeRangeChange).toHaveBeenCalledWith('7d');
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <ProductionTimelineChart
        data={mockData}
        timeRange="30d"
        onTimeRangeChange={mockOnTimeRangeChange}
        loading={true}
      />
    );

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders chart with empty data', () => {
    render(
      <ProductionTimelineChart
        data={[]}
        timeRange="30d"
        onTimeRangeChange={mockOnTimeRangeChange}
      />
    );

    expect(screen.getByText('Production Timeline')).toBeInTheDocument();
  });
});
