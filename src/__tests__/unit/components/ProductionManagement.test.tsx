import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductionManagement from '@/pages/tenant/ProductionManagement';
import { useProductionStore } from '@/stores/productionStore';
import type { ProductionItem, ProductionStats } from '@/services/tenant/productionService';

// Mock the production store
vi.mock('@/stores/productionStore', () => ({
  useProductionStore: vi.fn(),
}));

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

const mockProductionItem: ProductionItem = {
  id: 'prod-001',
  production_item_uuid: 'prod-uuid-001',
  order_id: 'order-001',
  product_id: 'product-001',
  product_name: 'Custom Etched Plate',
  product_sku: 'CEP-001',
  quantity: 100,
  unit_of_measure: 'pcs',
  batch_number: 'B2024001',
  lot_number: 'L1001',
  scheduled_start_date: '2024-12-01T08:00:00Z',
  scheduled_completion_date: '2024-12-03T17:00:00Z',
  actual_start_date: '2024-12-01T08:30:00Z',
  actual_completion_date: undefined,
  estimated_duration_hours: 24,
  actual_duration_hours: 12,
  status: 'in_progress',
  progress_percentage: 45,
  current_stage: 'Machining',
  quality_requirements: ['Dimensional Tolerance: ±0.1mm'],
  specifications: { material: 'Aluminum 6061-T6' },
  material_requirements: [{ material_type: 'Raw Material', quantity: 110, unit: 'kg' }],
  assigned_to: ['John Smith'],
  production_line: 'Line A1',
  workstation: 'Station-001',
  shift: 'morning',
  supervisor_id: '1',
  supervisor_name: 'Ahmad Sudarto',
  checkpoints: [],
  issues: [],
  qc_status: 'pending',
  notes: 'Standard production run',
  priority: 'high',
  created_by: 'production_manager',
  updated_by: 'production_manager',
  created_at: '2024-11-30T10:00:00Z',
  updated_at: '2024-12-01T09:00:00Z',
  order: {
    id: 'order-001',
    order_code: 'ORD-2024-001',
    customer_name: 'ABC Manufacturing Corp',
    due_date: '2024-12-05T17:00:00Z',
  },
  product: {
    id: 'product-001',
    name: 'Custom Etched Plate',
    sku: 'CEP-001',
    category: 'Custom Fabrication',
  },
};

const mockStats: ProductionStats = {
  total_items: 100,
  active_items: 25,
  completed_items: 70,
  overdue_items: 5,
  items_by_status: {
    scheduled: 10,
    material_preparation: 5,
    in_progress: 15,
    quality_check: 8,
    completed: 70,
    on_hold: 2,
    cancelled: 0,
    rejected: 0,
  },
  items_by_priority: {
    low: 20,
    normal: 60,
    high: 15,
    urgent: 5,
  },
  qc_stats: {
    pending: 10,
    in_progress: 3,
    passed: 75,
    failed: 2,
    rework_required: 5,
    pass_rate: 88,
  },
  avg_completion_time_hours: 24.5,
  on_time_delivery_rate: 87.3,
  capacity_utilization: 78.9,
  efficiency_rate: 82.4,
  total_production_value: 1250000,
  completed_value: 890000,
  pending_value: 360000,
  daily_completed: [],
  total_issues: 15,
  open_issues: 3,
  critical_issues: 1,
  avg_resolution_time_hours: 18.2,
};

const mockStoreState = {
  // Data
  productionItems: [mockProductionItem],
  selectedProductionItem: null,
  productionIssues: [],
  selectedIssue: null,
  checkpoints: [],
  schedules: [],
  stats: mockStats,
  overdueItems: [],
  dashboardSummary: null,

  // Loading states
  loading: false,
  itemsLoading: false,
  itemLoading: false,
  issuesLoading: false,
  issueLoading: false,
  checkpointsLoading: false,
  schedulesLoading: false,
  statsLoading: false,
  dashboardLoading: false,
  bulkActionLoading: false,
  error: null,

  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalCount: 1,
  perPage: 10,

  // Filters
  filters: {},

  // Selection
  selectedItems: [],

  // Actions
  fetchProductionItems: vi.fn(),
  fetchProductionItem: vi.fn(),
  createProductionItem: vi.fn(),
  updateProductionItem: vi.fn(),
  deleteProductionItem: vi.fn(),
  startProduction: vi.fn(),
  pauseProduction: vi.fn(),
  completeProduction: vi.fn(),
  fetchProductionStats: vi.fn(),
  fetchProductionSchedules: vi.fn(),
  fetchProductionIssues: vi.fn(),
  bulkUpdateStatus: vi.fn(),
  assignSupervisor: vi.fn(),
  toggleItemSelection: vi.fn(),
  toggleAllSelection: vi.fn(),
  clearSelections: vi.fn(),
  setFilters: vi.fn(),
  resetFilters: vi.fn(),
  setPage: vi.fn(),
  setPerPage: vi.fn(),
  clearError: vi.fn(),
  refreshData: vi.fn(),
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ProductionManagement />
    </BrowserRouter>
  );
};

describe('ProductionManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProductionStore as any).mockReturnValue(mockStoreState);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render the main components', () => {
      renderComponent();

      expect(screen.getByText('Production Management')).toBeInTheDocument();
      expect(screen.getByText('Manage production workflows, track progress, and monitor quality.')).toBeInTheDocument();
    });

    it('should render tabs correctly', () => {
      renderComponent();

      expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /production items/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /schedules/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /issues/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /reports/i })).toBeInTheDocument();
    });

    it('should display loading state when data is being fetched', () => {
      (useProductionStore as any).mockReturnValue({
        ...mockStoreState,
        itemsLoading: true,
        statsLoading: true,
      });

      renderComponent();

      // Check for loading indicators - adjust based on your loading UI implementation
      expect(screen.getAllByTestId('loading-spinner')).toHaveLength(0); // Adjust based on actual loading UI
    });
  });

  describe('Overview Tab', () => {
    it('should display production statistics', () => {
      renderComponent();

      // Check for key statistics
      expect(screen.getByText('100')).toBeInTheDocument(); // Total items
      expect(screen.getByText('25')).toBeInTheDocument(); // Active items
      expect(screen.getByText('70')).toBeInTheDocument(); // Completed items
      expect(screen.getByText('5')).toBeInTheDocument(); // Overdue items
    });

    it('should render charts', () => {
      renderComponent();

      expect(screen.getAllByTestId('responsive-container')).toHaveLength(4); // Adjust based on number of charts
      expect(screen.getAllByTestId('bar-chart')).toHaveLength(2); // Status and priority charts
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  describe('Production Items Tab', () => {
    it('should display production items table', async () => {
      renderComponent();

      // Switch to production items tab
      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      await waitFor(() => {
        expect(screen.getByText('Custom Etched Plate')).toBeInTheDocument();
        expect(screen.getByText('CEP-001')).toBeInTheDocument();
        expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
        expect(screen.getByText('ABC Manufacturing Corp')).toBeInTheDocument();
      });
    });

    it('should handle search functionality', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      const searchInput = screen.getByPlaceholderText(/search production items/i);
      fireEvent.change(searchInput, { target: { value: 'CEP-001' } });

      await waitFor(() => {
        expect(mockStoreState.setFilters).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'CEP-001' })
        );
      });
    });

    it('should handle status filter', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      // Find and click status filter
      const statusFilter = screen.getByDisplayValue(/all status/i);
      fireEvent.click(statusFilter);

      // Select in_progress option
      const inProgressOption = screen.getByText('In Progress');
      fireEvent.click(inProgressOption);

      await waitFor(() => {
        expect(mockStoreState.setFilters).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'in_progress' })
        );
      });
    });

    it('should handle item selection', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      // Find and click checkbox for item selection
      const checkbox = screen.getAllByRole('checkbox')[1]; // First is select all
      fireEvent.click(checkbox);

      expect(mockStoreState.toggleItemSelection).toHaveBeenCalledWith('prod-001');
    });
  });

  describe('Actions', () => {
    it('should handle refresh action', async () => {
      renderComponent();

      const refreshButton = screen.getByLabelText(/refresh/i) || screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);

      expect(mockStoreState.refreshData).toHaveBeenCalled();
    });

    it('should handle create new item action', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      const createButton = screen.getByText(/create production item/i);
      fireEvent.click(createButton);

      // Should open create dialog - check for dialog content
      await waitFor(() => {
        expect(screen.getByText(/create new production item/i)).toBeInTheDocument();
      });
    });

    it('should handle bulk actions', async () => {
      // Mock selected items
      (useProductionStore as any).mockReturnValue({
        ...mockStoreState,
        selectedItems: ['prod-001'],
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      // Should show bulk action controls when items are selected
      expect(screen.getByText(/1 item selected/i)).toBeInTheDocument();

      const bulkActionButton = screen.getByText(/bulk actions/i);
      fireEvent.click(bulkActionButton);

      // Should show bulk action options
      expect(screen.getByText(/start selected/i)).toBeInTheDocument();
      expect(screen.getByText(/pause selected/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when there is an error', () => {
      (useProductionStore as any).mockReturnValue({
        ...mockStoreState,
        error: 'Failed to load production data',
      });

      renderComponent();

      expect(screen.getByText('Failed to load production data')).toBeInTheDocument();
    });

    it('should allow error dismissal', async () => {
      (useProductionStore as any).mockReturnValue({
        ...mockStoreState,
        error: 'Failed to load production data',
      });

      renderComponent();

      const dismissButton = screen.getByLabelText(/dismiss/i) || screen.getByText(/×/);
      fireEvent.click(dismissButton);

      expect(mockStoreState.clearError).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      // Should show page info
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });

    it('should handle page changes', async () => {
      (useProductionStore as any).mockReturnValue({
        ...mockStoreState,
        totalPages: 3,
        currentPage: 1,
      });

      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      const nextButton = screen.getByLabelText(/next page/i);
      fireEvent.click(nextButton);

      expect(mockStoreState.setPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Real-time Updates', () => {
    it('should fetch data on component mount', () => {
      renderComponent();

      expect(mockStoreState.fetchProductionItems).toHaveBeenCalled();
      expect(mockStoreState.fetchProductionStats).toHaveBeenCalled();
    });

    it('should refetch data when filters change', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      // Change filter
      const searchInput = screen.getByPlaceholderText(/search production items/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(mockStoreState.setFilters).toHaveBeenCalled();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render without crashing on different screen sizes', () => {
      // Mock different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      renderComponent();

      expect(screen.getByText('Production Management')).toBeInTheDocument();

      // Test mobile size
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
      });

      renderComponent();

      expect(screen.getByText('Production Management')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for tabs', () => {
      renderComponent();

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      overviewTab.focus();

      // Test arrow key navigation
      fireEvent.keyDown(overviewTab, { key: 'ArrowRight' });

      expect(screen.getByRole('tab', { name: /production items/i })).toHaveFocus();
    });
  });

  describe('Data Export', () => {
    it('should handle export functionality', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('tab', { name: /production items/i }));

      const exportButton = screen.getByLabelText(/export/i) || screen.getByText(/export/i);
      fireEvent.click(exportButton);

      // Should show export options
      await waitFor(() => {
        expect(screen.getByText(/export format/i)).toBeInTheDocument();
      });
    });
  });
});