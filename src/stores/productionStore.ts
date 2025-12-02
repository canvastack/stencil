import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ProductionItem, 
  ProductionIssue,
  ProductionCheckpoint,
  ProductionSchedule,
  ProductionListParams, 
  CreateProductionItemRequest, 
  UpdateProductionItemRequest,
  CreateProductionIssueRequest,
  UpdateProductionIssueRequest,
  ProductionStats
} from '@/services/tenant/productionService';
import { productionService } from '@/services/tenant/productionService';

interface ProductionState {
  // Data
  productionItems: ProductionItem[];
  selectedProductionItem: ProductionItem | null;
  productionIssues: ProductionIssue[];
  selectedIssue: ProductionIssue | null;
  checkpoints: ProductionCheckpoint[];
  schedules: ProductionSchedule[];
  stats: ProductionStats | null;
  overdueItems: ProductionItem[];
  dashboardSummary: any | null;

  // UI State
  loading: boolean;
  itemsLoading: boolean;
  itemLoading: boolean;
  issuesLoading: boolean;
  issueLoading: boolean;
  checkpointsLoading: boolean;
  schedulesLoading: boolean;
  statsLoading: boolean;
  dashboardLoading: boolean;
  bulkActionLoading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;

  // Filters
  filters: ProductionListParams;

  // Selection
  selectedItemIds: string[];
  selectedIssueIds: string[];

  // Actions - Data Management
  setProductionItems: (items: ProductionItem[]) => void;
  setSelectedProductionItem: (item: ProductionItem | null) => void;
  setProductionIssues: (issues: ProductionIssue[]) => void;
  setSelectedIssue: (issue: ProductionIssue | null) => void;
  setCheckpoints: (checkpoints: ProductionCheckpoint[]) => void;
  setSchedules: (schedules: ProductionSchedule[]) => void;
  setStats: (stats: ProductionStats | null) => void;
  setOverdueItems: (items: ProductionItem[]) => void;
  setDashboardSummary: (summary: any | null) => void;

  // Actions - UI State
  setLoading: (loading: boolean) => void;
  setItemsLoading: (loading: boolean) => void;
  setItemLoading: (loading: boolean) => void;
  setIssuesLoading: (loading: boolean) => void;
  setIssueLoading: (loading: boolean) => void;
  setCheckpointsLoading: (loading: boolean) => void;
  setSchedulesLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setDashboardLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Pagination & Filters
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTotalCount: (count: number) => void;
  setPerPage: (perPage: number) => void;
  setFilters: (filters: ProductionListParams) => void;
  updateFilters: (filters: Partial<ProductionListParams>) => void;
  resetFilters: () => void;

  // Actions - Selection
  setSelectedItemIds: (ids: string[]) => void;
  toggleItemSelection: (id: string) => void;
  selectAllItems: () => void;
  clearItemSelection: () => void;
  setSelectedIssueIds: (ids: string[]) => void;
  toggleIssueSelection: (id: string) => void;
  clearIssueSelection: () => void;

  // Actions - API Operations
  fetchProductionItems: (params?: ProductionListParams) => Promise<void>;
  fetchProductionItem: (id: string) => Promise<void>;
  createProductionItem: (data: CreateProductionItemRequest) => Promise<ProductionItem>;
  updateProductionItem: (id: string, data: UpdateProductionItemRequest) => Promise<ProductionItem>;
  deleteProductionItem: (id: string) => Promise<void>;
  startProduction: (id: string, data: any) => Promise<ProductionItem>;
  completeProduction: (id: string, data: any) => Promise<ProductionItem>;
  updateProgress: (id: string, data: any) => Promise<ProductionItem>;

  // Actions - Issues Management
  fetchProductionIssues: (params?: any) => Promise<void>;
  createProductionIssue: (data: CreateProductionIssueRequest) => Promise<ProductionIssue>;
  updateProductionIssue: (id: string, data: UpdateProductionIssueRequest) => Promise<ProductionIssue>;
  resolveProductionIssue: (id: string, data: any) => Promise<ProductionIssue>;
  escalateProductionIssue: (id: string, data: any) => Promise<ProductionIssue>;

  // Actions - Checkpoints Management
  fetchProductionCheckpoints: (itemId: string) => Promise<void>;
  updateCheckpoint: (itemId: string, checkpointId: string, data: any) => Promise<ProductionCheckpoint>;

  // Actions - Schedule Management
  fetchProductionSchedule: (params: any) => Promise<void>;
  updateProductionSchedule: (date: string, data: any) => Promise<ProductionSchedule>;

  // Actions - Statistics & Reports
  fetchProductionStats: (params?: any) => Promise<void>;
  fetchOverdueItems: () => Promise<void>;
  fetchDashboardSummary: () => Promise<void>;
  generateProductionReport: (data: any) => Promise<any>;
  exportProductionReport: (id: string, format: 'pdf' | 'excel' | 'csv') => Promise<Blob>;

  // Actions - Bulk Operations
  bulkUpdateProductionItems: (ids: string[], data: any) => Promise<{ success: ProductionItem[]; failed: Array<{ id: string; error: string }> }>;

  // Actions - Utility
  refreshData: () => Promise<void>;
  reset: () => void;
}

const initialFilters: ProductionListParams = {
  page: 1,
  per_page: 20,
  search: '',
  status: undefined,
  qc_status: undefined,
  priority: undefined,
  sort_by: 'created_at',
  sort_order: 'desc',
};

export const useProductionStore = create<ProductionState>()(
  persist(
    (set, get) => ({
      // Initial Data State
      productionItems: [],
      selectedProductionItem: null,
      productionIssues: [],
      selectedIssue: null,
      checkpoints: [],
      schedules: [],
      stats: null,
      overdueItems: [],
      dashboardSummary: null,

      // Initial UI State
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

      // Initial Pagination
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      perPage: 20,

      // Initial Filters
      filters: initialFilters,

      // Initial Selection
      selectedItemIds: [],
      selectedIssueIds: [],

      // Data Management Actions
      setProductionItems: (items) => set({ productionItems: items }),
      setSelectedProductionItem: (item) => set({ selectedProductionItem: item }),
      setProductionIssues: (issues) => set({ productionIssues: issues }),
      setSelectedIssue: (issue) => set({ selectedIssue: issue }),
      setCheckpoints: (checkpoints) => set({ checkpoints }),
      setSchedules: (schedules) => set({ schedules }),
      setStats: (stats) => set({ stats }),
      setOverdueItems: (items) => set({ overdueItems: items }),
      setDashboardSummary: (summary) => set({ dashboardSummary: summary }),

      // UI State Actions
      setLoading: (loading) => set({ loading }),
      setItemsLoading: (loading) => set({ itemsLoading: loading }),
      setItemLoading: (loading) => set({ itemLoading: loading }),
      setIssuesLoading: (loading) => set({ issuesLoading: loading }),
      setIssueLoading: (loading) => set({ issueLoading: loading }),
      setCheckpointsLoading: (loading) => set({ checkpointsLoading: loading }),
      setSchedulesLoading: (loading) => set({ schedulesLoading: loading }),
      setStatsLoading: (loading) => set({ statsLoading: loading }),
      setDashboardLoading: (loading) => set({ dashboardLoading: loading }),
      setBulkActionLoading: (loading) => set({ bulkActionLoading: loading }),
      setError: (error) => set({ error }),

      // Pagination & Filter Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setTotalPages: (pages) => set({ totalPages: pages }),
      setTotalCount: (count) => set({ totalCount: count }),
      setPerPage: (perPage) => set({ perPage }),
      setFilters: (filters) => set({ filters }),
      updateFilters: (newFilters) => set(state => ({ 
        filters: { ...state.filters, ...newFilters },
        currentPage: 1 // Reset to first page when filters change
      })),
      resetFilters: () => set({ filters: initialFilters, currentPage: 1 }),

      // Selection Actions
      setSelectedItemIds: (ids) => set({ selectedItemIds: ids }),
      toggleItemSelection: (id) => set(state => ({
        selectedItemIds: state.selectedItemIds.includes(id)
          ? state.selectedItemIds.filter(itemId => itemId !== id)
          : [...state.selectedItemIds, id]
      })),
      selectAllItems: () => set(state => ({ 
        selectedItemIds: state.productionItems.map(item => item.id) 
      })),
      clearItemSelection: () => set({ selectedItemIds: [] }),
      setSelectedIssueIds: (ids) => set({ selectedIssueIds: ids }),
      toggleIssueSelection: (id) => set(state => ({
        selectedIssueIds: state.selectedIssueIds.includes(id)
          ? state.selectedIssueIds.filter(issueId => issueId !== id)
          : [...state.selectedIssueIds, id]
      })),
      clearIssueSelection: () => set({ selectedIssueIds: [] }),

      // API Operations - Production Items
      fetchProductionItems: async (params) => {
        const state = get();
        const queryParams = params || state.filters;
        
        set({ itemsLoading: true, error: null });
        try {
          const response = await productionService.getProductionItems({
            ...queryParams,
            page: state.currentPage,
            per_page: state.perPage,
          });
          
          set({
            productionItems: response.data,
            totalPages: response.meta.last_page,
            totalCount: response.meta.total,
            currentPage: response.meta.current_page,
            itemsLoading: false,
          });
        } catch (error: any) {
          set({
            itemsLoading: false,
            error: error.response?.data?.message || 'Failed to fetch production items',
          });
          throw error;
        }
      },

      fetchProductionItem: async (id) => {
        set({ itemLoading: true, error: null });
        try {
          const item = await productionService.getProductionItem(id);
          set({
            selectedProductionItem: item,
            itemLoading: false,
          });
        } catch (error: any) {
          set({
            itemLoading: false,
            error: error.response?.data?.message || 'Failed to fetch production item',
          });
          throw error;
        }
      },

      createProductionItem: async (data) => {
        set({ loading: true, error: null });
        try {
          const newItem = await productionService.createProductionItem(data);
          set(state => ({
            productionItems: [newItem, ...state.productionItems],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return newItem;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to create production item',
          });
          throw error;
        }
      },

      updateProductionItem: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedItem = await productionService.updateProductionItem(id, data);
          set(state => ({
            productionItems: state.productionItems.map(item => 
              item.id === id ? updatedItem : item
            ),
            selectedProductionItem: state.selectedProductionItem?.id === id ? updatedItem : state.selectedProductionItem,
            loading: false,
          }));
          return updatedItem;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to update production item',
          });
          throw error;
        }
      },

      deleteProductionItem: async (id) => {
        set({ loading: true, error: null });
        try {
          await productionService.deleteProductionItem(id);
          set(state => ({
            productionItems: state.productionItems.filter(item => item.id !== id),
            selectedProductionItem: state.selectedProductionItem?.id === id ? null : state.selectedProductionItem,
            selectedItemIds: state.selectedItemIds.filter(itemId => itemId !== id),
            totalCount: state.totalCount - 1,
            loading: false,
          }));
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to delete production item',
          });
          throw error;
        }
      },

      startProduction: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedItem = await productionService.startProduction(id, data);
          set(state => ({
            productionItems: state.productionItems.map(item => 
              item.id === id ? updatedItem : item
            ),
            selectedProductionItem: state.selectedProductionItem?.id === id ? updatedItem : state.selectedProductionItem,
            loading: false,
          }));
          return updatedItem;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to start production',
          });
          throw error;
        }
      },

      completeProduction: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedItem = await productionService.completeProduction(id, data);
          set(state => ({
            productionItems: state.productionItems.map(item => 
              item.id === id ? updatedItem : item
            ),
            selectedProductionItem: state.selectedProductionItem?.id === id ? updatedItem : state.selectedProductionItem,
            loading: false,
          }));
          return updatedItem;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to complete production',
          });
          throw error;
        }
      },

      updateProgress: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedItem = await productionService.updateProgress(id, data);
          set(state => ({
            productionItems: state.productionItems.map(item => 
              item.id === id ? updatedItem : item
            ),
            selectedProductionItem: state.selectedProductionItem?.id === id ? updatedItem : state.selectedProductionItem,
            loading: false,
          }));
          return updatedItem;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to update progress',
          });
          throw error;
        }
      },

      // Issues Management
      fetchProductionIssues: async (params = {}) => {
        set({ issuesLoading: true, error: null });
        try {
          const issues = await productionService.getProductionIssues(params);
          set({
            productionIssues: issues,
            issuesLoading: false,
          });
        } catch (error: any) {
          set({
            issuesLoading: false,
            error: error.response?.data?.message || 'Failed to fetch production issues',
          });
          throw error;
        }
      },

      createProductionIssue: async (data) => {
        set({ issueLoading: true, error: null });
        try {
          const newIssue = await productionService.createProductionIssue(data);
          set(state => ({
            productionIssues: [newIssue, ...state.productionIssues],
            issueLoading: false,
          }));
          return newIssue;
        } catch (error: any) {
          set({
            issueLoading: false,
            error: error.response?.data?.message || 'Failed to create production issue',
          });
          throw error;
        }
      },

      updateProductionIssue: async (id, data) => {
        set({ issueLoading: true, error: null });
        try {
          const updatedIssue = await productionService.updateProductionIssue(id, data);
          set(state => ({
            productionIssues: state.productionIssues.map(issue => 
              issue.id === id ? updatedIssue : issue
            ),
            selectedIssue: state.selectedIssue?.id === id ? updatedIssue : state.selectedIssue,
            issueLoading: false,
          }));
          return updatedIssue;
        } catch (error: any) {
          set({
            issueLoading: false,
            error: error.response?.data?.message || 'Failed to update production issue',
          });
          throw error;
        }
      },

      resolveProductionIssue: async (id, data) => {
        set({ issueLoading: true, error: null });
        try {
          const resolvedIssue = await productionService.resolveProductionIssue(id, data);
          set(state => ({
            productionIssues: state.productionIssues.map(issue => 
              issue.id === id ? resolvedIssue : issue
            ),
            selectedIssue: state.selectedIssue?.id === id ? resolvedIssue : state.selectedIssue,
            issueLoading: false,
          }));
          return resolvedIssue;
        } catch (error: any) {
          set({
            issueLoading: false,
            error: error.response?.data?.message || 'Failed to resolve production issue',
          });
          throw error;
        }
      },

      escalateProductionIssue: async (id, data) => {
        set({ issueLoading: true, error: null });
        try {
          const escalatedIssue = await productionService.escalateProductionIssue(id, data);
          set(state => ({
            productionIssues: state.productionIssues.map(issue => 
              issue.id === id ? escalatedIssue : issue
            ),
            selectedIssue: state.selectedIssue?.id === id ? escalatedIssue : state.selectedIssue,
            issueLoading: false,
          }));
          return escalatedIssue;
        } catch (error: any) {
          set({
            issueLoading: false,
            error: error.response?.data?.message || 'Failed to escalate production issue',
          });
          throw error;
        }
      },

      // Checkpoints Management
      fetchProductionCheckpoints: async (itemId) => {
        set({ checkpointsLoading: true, error: null });
        try {
          const checkpoints = await productionService.getProductionCheckpoints(itemId);
          set({
            checkpoints,
            checkpointsLoading: false,
          });
        } catch (error: any) {
          set({
            checkpointsLoading: false,
            error: error.response?.data?.message || 'Failed to fetch production checkpoints',
          });
          throw error;
        }
      },

      updateCheckpoint: async (itemId, checkpointId, data) => {
        set({ checkpointsLoading: true, error: null });
        try {
          const updatedCheckpoint = await productionService.updateCheckpoint(itemId, checkpointId, data);
          set(state => ({
            checkpoints: state.checkpoints.map(checkpoint => 
              checkpoint.id === checkpointId ? updatedCheckpoint : checkpoint
            ),
            checkpointsLoading: false,
          }));
          return updatedCheckpoint;
        } catch (error: any) {
          set({
            checkpointsLoading: false,
            error: error.response?.data?.message || 'Failed to update checkpoint',
          });
          throw error;
        }
      },

      // Schedule Management
      fetchProductionSchedule: async (params) => {
        set({ schedulesLoading: true, error: null });
        try {
          const schedules = await productionService.getProductionSchedule(params);
          set({
            schedules,
            schedulesLoading: false,
          });
        } catch (error: any) {
          set({
            schedulesLoading: false,
            error: error.response?.data?.message || 'Failed to fetch production schedule',
          });
          throw error;
        }
      },

      updateProductionSchedule: async (date, data) => {
        set({ schedulesLoading: true, error: null });
        try {
          const updatedSchedule = await productionService.updateProductionSchedule(date, data);
          set(state => ({
            schedules: state.schedules.map(schedule => 
              schedule.date === date ? updatedSchedule : schedule
            ),
            schedulesLoading: false,
          }));
          return updatedSchedule;
        } catch (error: any) {
          set({
            schedulesLoading: false,
            error: error.response?.data?.message || 'Failed to update production schedule',
          });
          throw error;
        }
      },

      // Statistics & Reports
      fetchProductionStats: async (params = {}) => {
        set({ statsLoading: true, error: null });
        try {
          const stats = await productionService.getProductionStats(params);
          set({
            stats,
            statsLoading: false,
          });
        } catch (error: any) {
          set({
            statsLoading: false,
            error: error.response?.data?.message || 'Failed to fetch production statistics',
          });
          throw error;
        }
      },

      fetchOverdueItems: async () => {
        set({ loading: true, error: null });
        try {
          const overdueItems = await productionService.getOverdueItems();
          set({
            overdueItems,
            loading: false,
          });
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to fetch overdue items',
          });
          throw error;
        }
      },

      fetchDashboardSummary: async () => {
        set({ dashboardLoading: true, error: null });
        try {
          const dashboardSummary = await productionService.getDashboardSummary();
          set({
            dashboardSummary,
            dashboardLoading: false,
          });
        } catch (error: any) {
          set({
            dashboardLoading: false,
            error: error.response?.data?.message || 'Failed to fetch dashboard summary',
          });
          throw error;
        }
      },

      generateProductionReport: async (data) => {
        set({ loading: true, error: null });
        try {
          const report = await productionService.generateProductionReport(data);
          set({ loading: false });
          return report;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to generate production report',
          });
          throw error;
        }
      },

      exportProductionReport: async (id, format) => {
        set({ loading: true, error: null });
        try {
          const blob = await productionService.exportProductionReport(id, format);
          set({ loading: false });
          return blob;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to export production report',
          });
          throw error;
        }
      },

      // Bulk Operations
      bulkUpdateProductionItems: async (ids, data) => {
        set({ bulkActionLoading: true, error: null });
        try {
          const result = await productionService.bulkUpdateProductionItems(ids, data);
          
          // Update the production items in the store
          set(state => ({
            productionItems: state.productionItems.map(item => {
              const updatedItem = result.success.find(updated => updated.id === item.id);
              return updatedItem || item;
            }),
            selectedItemIds: [], // Clear selection after bulk update
            bulkActionLoading: false,
          }));
          
          return result;
        } catch (error: any) {
          set({
            bulkActionLoading: false,
            error: error.response?.data?.message || 'Failed to bulk update production items',
          });
          throw error;
        }
      },

      // Utility Actions
      refreshData: async () => {
        const state = get();
        try {
          await Promise.all([
            state.fetchProductionItems(),
            state.fetchProductionStats(),
            state.fetchDashboardSummary(),
            state.fetchOverdueItems(),
          ]);
        } catch (error) {
          // Individual fetch errors are handled in their respective methods
        }
      },

      reset: () => set({
        productionItems: [],
        selectedProductionItem: null,
        productionIssues: [],
        selectedIssue: null,
        checkpoints: [],
        schedules: [],
        stats: null,
        overdueItems: [],
        dashboardSummary: null,
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
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        perPage: 20,
        filters: initialFilters,
        selectedItemIds: [],
        selectedIssueIds: [],
      }),
    }),
    {
      name: 'production-store',
      partialize: (state) => ({
        // Only persist filters and UI preferences
        filters: state.filters,
        perPage: state.perPage,
      }),
    }
  )
);