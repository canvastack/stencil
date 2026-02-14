import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsOverview } from '@/components/analytics/MetricsOverview';

describe('MetricsOverview', () => {
  const mockMetrics = {
    activeOrders: 24,
    activeOrdersChange: 12.5,
    onTimeDeliveryRate: 87.3,
    onTimeDeliveryRateChange: -3.2,
    avgProductionTime: 12.4,
    avgProductionTimeChange: -2.1,
    quoteAcceptanceRate: 73.5,
    quoteAcceptanceRateChange: 5.3,
  };

  it('renders all metric cards', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText('Active Orders')).toBeInTheDocument();
    expect(screen.getByText('On-Time Delivery')).toBeInTheDocument();
    expect(screen.getByText('Avg Production Time')).toBeInTheDocument();
    expect(screen.getByText('Quote Acceptance')).toBeInTheDocument();
  });

  it('displays metric values correctly', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('87.3%')).toBeInTheDocument();
    expect(screen.getByText('12.4 days')).toBeInTheDocument();
    expect(screen.getByText('73.5%')).toBeInTheDocument();
  });

  it('displays change percentages', () => {
    render(<MetricsOverview metrics={mockMetrics} />);

    expect(screen.getByText(/12.5% from last period/)).toBeInTheDocument();
    expect(screen.getByText(/3.2% from last period/)).toBeInTheDocument();
    expect(screen.getByText(/2.1% from last period/)).toBeInTheDocument();
    expect(screen.getByText(/5.3% from last period/)).toBeInTheDocument();
  });

  it('shows loading skeletons when loading', () => {
    const { container } = render(<MetricsOverview metrics={mockMetrics} loading={true} />);

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders without errors when metrics are zero', () => {
    const zeroMetrics = {
      activeOrders: 0,
      activeOrdersChange: 0,
      onTimeDeliveryRate: 0,
      onTimeDeliveryRateChange: 0,
      avgProductionTime: 0,
      avgProductionTimeChange: 0,
      quoteAcceptanceRate: 0,
      quoteAcceptanceRateChange: 0,
    };

    render(<MetricsOverview metrics={zeroMetrics} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });
});
