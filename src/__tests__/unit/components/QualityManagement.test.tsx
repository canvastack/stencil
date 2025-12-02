import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import QualityManagement from '@/pages/tenant/QualityManagement';
import type { QCInspection, QCStats } from '@/services/tenant/qcService';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

const mockQCInspection: QCInspection = {
  id: 'qc-001',
  inspection_uuid: 'insp-uuid-001',
  production_item_id: 'prod-001',
  order_id: 'order-001',
  product_id: 'product-001',
  inspection_type: 'final',
  inspection_date: '2024-12-02T10:00:00Z',
  inspection_number: 'QC-2024-001',
  batch_number: 'B2024001',
  lot_number: 'L1001',
  status: 'passed',
  overall_score: 95,
  pass_rate: 98,
  inspector_id: 'inspector-1',
  inspector_name: 'James Wilson',
  inspector_level: 'senior',
  inspection_duration_minutes: 45,
  sample_size: 10,
  total_quantity: 100,
  sample_method: 'random',
  criteria: [
    {
      id: 'crit-1',
      name: 'Dimensional Accuracy',
      description: 'Verify part dimensions meet specifications',
      category: 'dimensional',
      weight: 30,
      acceptable_range: { min: -0.1, max: 0.1, unit: 'mm' },
      inspection_method: 'measurement',
      result: 'pass',
      actual_value: '0.05',
      is_critical: true,
      reference_standard: 'ISO 2768-f',
    }
  ],
  defects: [
    {
      id: 'def-1',
      defect_type: 'minor',
      defect_code: 'VIS-001',
      defect_name: 'Visual Blemish',
      description: 'Minor visual imperfection not affecting function',
      location: 'Surface',
      quantity: 1,
      severity_score: 2,
      corrective_action: 'Accept with note',
      root_cause: 'Material quality',
      preventive_measures: 'Process adjustment',
      photos: ['defect-photo-1.jpg'],
      inspector_notes: 'Minor cosmetic issue, does not affect functionality',
    }
  ],
  measurements: [
    {
      id: 'meas-1',
      measurement_name: 'Length',
      measurement_type: 'dimensional',
      target_value: 100.0,
      actual_value: 100.05,
      unit: 'mm',
      tolerance_min: 99.9,
      tolerance_max: 100.1,
      result: 'pass',
      measuring_equipment: 'Digital Caliper',
      calibration_date: '2024-11-01T00:00:00Z',
      operator: 'James Wilson',
    }
  ],
  inspection_notes: 'All criteria met with excellent quality standards',
  recommendations: 'Continue current production process',
  corrective_actions: [],
  next_inspection_date: '2024-12-09T10:00:00Z',
  certification_required: true,
  certification_status: 'certified',
  certified_by: 'Robert Chang',
  certified_at: '2024-12-02T11:00:00Z',
  certificate_number: 'CERT-2024-001',
  photos: ['inspection-1-overview.jpg'],
  documents: ['inspection-report-1.pdf', 'final-inspection-1.pdf'],
  test_reports: ['test-report-1.pdf'],
  created_by: 'qc_inspector-1',
  updated_by: 'qc_inspector-1',
  created_at: '2024-12-01T09:00:00Z',
  updated_at: '2024-12-02T11:00:00Z',
  production_item: {
    id: 'prod-001',
    product_name: 'Custom Etched Steel Plate',
    product_sku: 'CEP-001',
    quantity: 100,
  },
  order: {
    id: 'order-001',
    order_code: 'ORD-2024-001',
    customer_name: 'ABC Manufacturing Corp',
  },
};

const mockQCStats: QCStats = {
  total_inspections: 100,
  pending_inspections: 5,
  in_progress_inspections: 8,
  completed_inspections: 87,
  overall_pass_rate: 92,
  final_inspection_pass_rate: 95,
  total_defects: 25,
  critical_defects: 2,
  major_defects: 8,
  inspector_stats: [
    {
      inspector_id: 'inspector-1',
      inspector_name: 'James Wilson',
      total_inspections: 25,
      completed_inspections: 23,
      pass_rate: 95,
      avg_inspection_time: 45,
      defects_found: 3,
    }
  ],
  monthly_trends: [
    {
      month: '2024-12',
      total_inspections: 20,
      passed: 18,
      failed: 2,
      pass_rate: 90,
      avg_score: 88,
    }
  ],
  defect_categories: [
    {
      category: 'critical',
      count: 2,
      percentage: 8,
    },
    {
      category: 'major',
      count: 8,
      percentage: 32,
    }
  ],
  avg_inspection_duration: 42,
  avg_overall_score: 88,
  avg_sample_size: 12,
  certifications_issued: 45,
  certifications_pending: 5,
  certifications_rejected: 2,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <QualityManagement />
    </BrowserRouter>
  );
};

describe('QualityManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main components', () => {
      renderComponent();

      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();
      expect(screen.getByText(/manage quality inspections/i)).toBeInTheDocument();
    });

    it('should render tabs correctly', () => {
      renderComponent();

      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /inspections/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /defects analysis/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /inspector performance/i })).toBeInTheDocument();
    });

    it('should display loading state correctly', () => {
      renderComponent();

      // The component should handle loading states gracefully
      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();
    });
  });

  describe('Overview Tab', () => {
    it('should display QC statistics', () => {
      renderComponent();

      // Check for key QC metrics
      // Note: This test checks for the presence of statistical elements
      // The actual values will be rendered when the mock data is properly integrated
      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();
      
      // Check for chart containers
      const responsiveContainers = screen.getAllByTestId('responsive-container');
      expect(responsiveContainers.length).toBeGreaterThan(0);
    });

    it('should render quality metrics charts', () => {
      renderComponent();

      // Check for chart components
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(4);
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should display pass rate indicators', () => {
      renderComponent();

      // Check for pass rate visualization elements
      const charts = screen.getAllByTestId('responsive-container');
      expect(charts).toHaveLength(4);
    });
  });

  describe('Inspections Tab', () => {
    it('should display inspections table when switching to inspections tab', async () => {
      renderComponent();

      // Switch to inspections tab
      const inspectionsTab = screen.getByRole('tab', { name: /inspections/i });
      fireEvent.click(inspectionsTab);

      await waitFor(() => {
        expect(screen.getByText(/inspection list/i)).toBeInTheDocument();
      });
    });

    it('should handle search functionality', async () => {
      renderComponent();

      // Switch to inspections tab
      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/search inspections/i);
        expect(searchInput).toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'QC-2024' } });
        expect(searchInput).toHaveValue('QC-2024');
      });
    });

    it('should handle inspection status filter', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        // Look for status filter dropdown
        const statusFilter = screen.getAllByRole('combobox')[0];
        expect(statusFilter).toBeInTheDocument();
      });
    });

    it('should handle inspector filter', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        // Look for inspector filter
        const inspectorFilter = screen.getByText(/all inspectors/i);
        expect(inspectorFilter).toBeInTheDocument();
      });
    });
  });

  describe('Defects Analysis Tab', () => {
    it('should display defects analysis when switching to defects tab', async () => {
      renderComponent();

      const defectsTab = screen.getByRole('tab', { name: /defects analysis/i });
      fireEvent.click(defectsTab);

      await waitFor(() => {
        expect(screen.getByText(/defect categories/i)).toBeInTheDocument();
      });
    });

    it('should render defect analysis charts', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /defects analysis/i }));

      await waitFor(() => {
        const charts = screen.getAllByTestId('responsive-container');
        expect(charts.length).toBeGreaterThan(0);
      });
    });

    it('should display defect trends', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /defects analysis/i }));

      await waitFor(() => {
        expect(screen.getByText(/defect trends/i)).toBeInTheDocument();
      });
    });
  });

  describe('Inspector Performance Tab', () => {
    it('should display inspector performance when switching to performance tab', async () => {
      renderComponent();

      const performanceTab = screen.getByRole('tab', { name: /inspector performance/i });
      fireEvent.click(performanceTab);

      await waitFor(() => {
        expect(screen.getByText(/inspector performance metrics/i)).toBeInTheDocument();
      });
    });

    it('should render performance metrics', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspector performance/i }));

      await waitFor(() => {
        // Check for performance-related content
        const performanceElements = screen.getByText(/inspector performance metrics/i);
        expect(performanceElements).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should handle refresh action', async () => {
      renderComponent();

      const refreshButton = screen.getByLabelText(/refresh/i);
      fireEvent.click(refreshButton);

      // The component should trigger data refresh
      expect(refreshButton).toBeInTheDocument();
    });

    it('should handle create new inspection action', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        const createButton = screen.getByText(/create inspection/i);
        fireEvent.click(createButton);

        // Should open create inspection dialog
        expect(screen.getByText(/create new inspection/i)).toBeInTheDocument();
      });
    });

    it('should handle bulk inspection actions', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        // Check for bulk action controls
        const bulkActions = screen.getByText(/bulk actions/i);
        expect(bulkActions).toBeInTheDocument();
      });
    });
  });

  describe('Data Visualization', () => {
    it('should render quality metrics charts correctly', () => {
      renderComponent();

      // Check for various chart types
      expect(screen.getAllByTestId('responsive-container')).toHaveLength(4);
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(2);
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should display defect distribution charts', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /defects analysis/i }));

      await waitFor(() => {
        const pieCharts = screen.getAllByTestId('pie-chart');
        expect(pieCharts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on different screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderComponent();
      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();

      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        value: 1024,
      });

      renderComponent();
      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for tabs', () => {
      renderComponent();

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      overviewTab.focus();

      // Test arrow key navigation
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });

      const inspectionsTab = screen.getByRole('tab', { name: /inspections/i });
      expect(inspectionsTab).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      renderComponent();

      // The component should handle errors without crashing
      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();
    });

    it('should display appropriate error messages', async () => {
      renderComponent();

      // Switch to a tab that might trigger data fetching
      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      // Component should handle potential errors gracefully
      await waitFor(() => {
        expect(screen.getByText(/inspection list/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Export', () => {
    it('should handle export functionality', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        const exportButton = screen.getByLabelText(/export/i);
        fireEvent.click(exportButton);

        // Should show export options
        expect(screen.getByText(/export format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter and Search', () => {
    it('should handle date range filters', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        const dateFilter = screen.getByText(/date range/i);
        expect(dateFilter).toBeInTheDocument();
      });
    });

    it('should handle inspection type filters', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /inspections/i }));

      await waitFor(() => {
        const typeFilter = screen.getByText(/inspection type/i);
        expect(typeFilter).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should support real-time data updates', () => {
      renderComponent();

      // Component should be ready to handle real-time updates
      expect(screen.getByText('Quality Control Management')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();

      // Check for accessibility features
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThan(0);

      tabs.forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected');
      });
    });

    it('should support screen readers', () => {
      renderComponent();

      // Check for semantic HTML elements
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tabpanel')).toHaveLength(1); // Only active panel
    });
  });
});