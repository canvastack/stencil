import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorPerformanceTable } from '@/components/analytics/VendorPerformanceTable';

describe('VendorPerformanceTable', () => {
  const mockVendors = [
    {
      id: 'vendor-1',
      name: 'PT Vendor A',
      totalOrders: 45,
      onTimeDeliveryRate: 92.3,
      avgProductionTime: 11.2,
      qualityScore: 4.8,
      status: 'active' as const,
    },
    {
      id: 'vendor-2',
      name: 'PT Vendor B',
      totalOrders: 38,
      onTimeDeliveryRate: 85.0,
      avgProductionTime: 13.0,
      qualityScore: 4.5,
      status: 'active' as const,
    },
  ];

  const mockOnVendorClick = vi.fn();

  it('renders table title', () => {
    render(
      <VendorPerformanceTable vendors={mockVendors} onVendorClick={mockOnVendorClick} />
    );

    expect(screen.getByText('Vendor Performance')).toBeInTheDocument();
  });

  it('renders all vendor rows', () => {
    render(
      <VendorPerformanceTable vendors={mockVendors} onVendorClick={mockOnVendorClick} />
    );

    expect(screen.getByText('PT Vendor A')).toBeInTheDocument();
    expect(screen.getByText('PT Vendor B')).toBeInTheDocument();
  });

  it('displays vendor metrics correctly', () => {
    render(
      <VendorPerformanceTable vendors={mockVendors} onVendorClick={mockOnVendorClick} />
    );

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('92.3%')).toBeInTheDocument();
    expect(screen.getByText('11.2 days')).toBeInTheDocument();
    expect(screen.getByText('4.8/5')).toBeInTheDocument();
  });

  it('calls onVendorClick when row is clicked', () => {
    render(
      <VendorPerformanceTable vendors={mockVendors} onVendorClick={mockOnVendorClick} />
    );

    const vendorRow = screen.getByText('PT Vendor A').closest('tr');
    if (vendorRow) {
      fireEvent.click(vendorRow);
      expect(mockOnVendorClick).toHaveBeenCalledWith('vendor-1');
    }
  });

  it('filters vendors by search query', () => {
    render(
      <VendorPerformanceTable vendors={mockVendors} onVendorClick={mockOnVendorClick} />
    );

    const searchInput = screen.getByPlaceholderText('Search vendors...');
    fireEvent.change(searchInput, { target: { value: 'Vendor A' } });

    expect(screen.getByText('PT Vendor A')).toBeInTheDocument();
    expect(screen.queryByText('PT Vendor B')).not.toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(
      <VendorPerformanceTable
        vendors={mockVendors}
        onVendorClick={mockOnVendorClick}
        loading={true}
      />
    );

    const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows "No vendors found" when list is empty', () => {
    render(<VendorPerformanceTable vendors={[]} onVendorClick={mockOnVendorClick} />);

    expect(screen.getByText('No vendors found')).toBeInTheDocument();
  });

  it('renders pagination when provided', () => {
    const mockPagination = {
      currentPage: 1,
      perPage: 10,
      total: 50,
      lastPage: 5,
    };

    const mockOnPageChange = vi.fn();

    render(
      <VendorPerformanceTable
        vendors={mockVendors}
        onVendorClick={mockOnVendorClick}
        pagination={mockPagination}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });
});
