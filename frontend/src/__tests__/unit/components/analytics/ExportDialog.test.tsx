import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from '@/components/analytics/ExportDialog';
import { AnalyticsExportService } from '@/services/export/analyticsExportService';
import type { AnalyticsExportData } from '@/services/export/analyticsExportService';

// Mock the export service
vi.mock('@/services/export/analyticsExportService', () => ({
  AnalyticsExportService: {
    export: vi.fn(),
    getFormatInfo: vi.fn((format) => ({
      label: format.toUpperCase(),
      extension: `.${format}`,
      description: `${format} format`,
      icon: '📊',
    })),
  },
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('ExportDialog', () => {
  const mockData: AnalyticsExportData = {
    metrics: {
      activeOrders: 24,
      activeOrdersChange: 12.5,
      onTimeDeliveryRate: 87.3,
      onTimeDeliveryRateChange: -3.2,
      avgProductionTime: 12.4,
      avgProductionTimeChange: -2.1,
      quoteAcceptanceRate: 73.5,
      quoteAcceptanceRateChange: 5.3,
    },
    timeline: [
      { date: '2026-02-01', accepted: 12, completed: 10, overdue: 2 },
      { date: '2026-02-02', accepted: 15, completed: 13, overdue: 1 },
    ],
    vendors: [
      {
        id: 'vendor-1',
        name: 'PT Vendor A',
        totalOrders: 45,
        onTimeDeliveryRate: 92.3,
        avgProductionTime: 11.2,
        qualityScore: 4.8,
        status: 'active',
      },
    ],
    deliveryStatus: [
      { status: 'on_track', count: 11, percentage: 45.8 },
      { status: 'approaching', count: 6, percentage: 25.0 },
    ],
    activities: [
      {
        id: 'activity-1',
        type: 'quote_accepted',
        title: 'Quote accepted',
        description: 'Order #123',
        timestamp: '2026-02-14T10:00:00Z',
      },
    ],
  };

  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export dialog when open', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    expect(screen.getByText('Export Analytics Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Choose a format to export/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ExportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    expect(screen.queryByText('Export Analytics Dashboard')).not.toBeInTheDocument();
  });

  it('displays all export format options', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument();
    expect(screen.getByText('CSV (.csv)')).toBeInTheDocument();
    expect(screen.getByText('PDF (.pdf)')).toBeInTheDocument();
  });

  it('allows selecting different export formats', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    const csvOption = screen.getByLabelText('CSV (.csv)');
    fireEvent.click(csvOption);

    expect(csvOption).toBeChecked();
  });

  it('displays export content information', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    expect(screen.getByText('Export will include:')).toBeInTheDocument();
    expect(screen.getByText(/Overview metrics with trends/)).toBeInTheDocument();
    expect(screen.getByText(/Production timeline data/)).toBeInTheDocument();
    expect(screen.getByText(/Vendor performance statistics/)).toBeInTheDocument();
  });

  it('calls export service when export button is clicked', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    const exportButton = screen.getByRole('button', { name: /^Export$/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(AnalyticsExportService.export).toHaveBeenCalledWith(
        expect.objectContaining({
          metrics: mockData.metrics,
          timeline: mockData.timeline,
          vendors: mockData.vendors,
          deliveryStatus: mockData.deliveryStatus,
          activities: mockData.activities,
          timeRange: '30d',
        }),
        expect.objectContaining({
          format: 'xlsx',
          filename: expect.stringContaining('analytics-dashboard'),
        })
      );
    });
  });

  it('closes dialog after successful export', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('handles export errors gracefully', async () => {
    const { toast } = await import('sonner');
    
    // Mock export to throw error
    vi.mocked(AnalyticsExportService.export).mockImplementation(() => {
      throw new Error('Export failed');
    });

    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to export dashboard. Please try again.');
    });
  });

  it('allows canceling the export', () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('exports with selected format', async () => {
    render(
      <ExportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        data={mockData}
        timeRange="30d"
      />
    );

    // Select PDF format
    const pdfOption = screen.getByLabelText('PDF (.pdf)');
    fireEvent.click(pdfOption);

    const exportButton = screen.getByRole('button', { name: /Export/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(AnalyticsExportService.export).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          format: 'pdf',
        })
      );
    });
  });
});
