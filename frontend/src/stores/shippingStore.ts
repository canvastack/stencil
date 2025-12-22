import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Shipment, 
  ShippingMethod,
  ShippingStats,
  ShipmentListParams, 
  CreateShipmentRequest, 
  UpdateShipmentRequest,
  CreateShippingMethodRequest,
  UpdateShippingMethodRequest
} from '@/services/tenant/shippingService';
import { shippingService } from '@/services/tenant/shippingService';

interface ShippingState {
  // Data
  shipments: Shipment[];
  selectedShipment: Shipment | null;
  shippingMethods: ShippingMethod[];
  selectedMethod: ShippingMethod | null;
  stats: ShippingStats | null;
  dashboardSummary: any | null;

  // UI State
  loading: boolean;
  shipmentsLoading: boolean;
  shipmentLoading: boolean;
  methodsLoading: boolean;
  methodLoading: boolean;
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
  filters: ShipmentListParams;

  // Selection
  selectedShipmentIds: string[];
  selectedMethodIds: string[];

  // Actions - Data Management
  setShipments: (shipments: Shipment[]) => void;
  setSelectedShipment: (shipment: Shipment | null) => void;
  setShippingMethods: (methods: ShippingMethod[]) => void;
  setSelectedMethod: (method: ShippingMethod | null) => void;
  setStats: (stats: ShippingStats | null) => void;
  setDashboardSummary: (summary: any | null) => void;

  // Actions - UI State
  setLoading: (loading: boolean) => void;
  setShipmentsLoading: (loading: boolean) => void;
  setShipmentLoading: (loading: boolean) => void;
  setMethodsLoading: (loading: boolean) => void;
  setMethodLoading: (loading: boolean) => void;
  setStatsLoading: (loading: boolean) => void;
  setDashboardLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Pagination & Filters
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: number) => void;
  setTotalCount: (count: number) => void;
  setPerPage: (perPage: number) => void;
  setFilters: (filters: ShipmentListParams) => void;
  updateFilters: (filters: Partial<ShipmentListParams>) => void;
  resetFilters: () => void;

  // Actions - Selection
  setSelectedShipmentIds: (ids: string[]) => void;
  toggleShipmentSelection: (id: string) => void;
  selectAllShipments: () => void;
  clearShipmentSelection: () => void;
  setSelectedMethodIds: (ids: string[]) => void;
  toggleMethodSelection: (id: string) => void;
  clearMethodSelection: () => void;

  // Actions - API Operations - Shipments
  fetchShipments: (params?: ShipmentListParams) => Promise<void>;
  fetchShipment: (id: string) => Promise<void>;
  createShipment: (data: CreateShipmentRequest) => Promise<Shipment>;
  updateShipment: (id: string, data: UpdateShipmentRequest) => Promise<Shipment>;
  cancelShipment: (id: string, reason?: string) => Promise<Shipment>;
  processShipment: (id: string) => Promise<Shipment>;
  
  // Actions - API Operations - Shipping Methods
  fetchShippingMethods: (params?: any) => Promise<void>;
  createShippingMethod: (data: CreateShippingMethodRequest) => Promise<ShippingMethod>;
  updateShippingMethod: (id: string, data: UpdateShippingMethodRequest) => Promise<ShippingMethod>;
  deleteShippingMethod: (id: string) => Promise<void>;

  // Actions - Statistics & Reports
  fetchShippingStats: (params?: any) => Promise<void>;
  fetchDashboardSummary: () => Promise<void>;

  // Actions - Bulk Operations
  bulkUpdateShipments: (ids: string[], data: any) => Promise<{ success: Shipment[]; failed: Array<{ id: string; error: string }> }>;

  // Actions - Utility
  refreshData: () => Promise<void>;
  reset: () => void;
}

const initialFilters: ShipmentListParams = {
  page: 1,
  per_page: 20,
  search: '',
  status: undefined,
  carrier: undefined,
  sort_by: 'created_at',
  sort_order: 'desc',
};

export const useShippingStore = create<ShippingState>()(
  persist(
    (set, get) => ({
      // Initial Data State
      shipments: [],
      selectedShipment: null,
      shippingMethods: [],
      selectedMethod: null,
      stats: null,
      dashboardSummary: null,

      // Initial UI State
      loading: false,
      shipmentsLoading: false,
      shipmentLoading: false,
      methodsLoading: false,
      methodLoading: false,
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
      selectedShipmentIds: [],
      selectedMethodIds: [],

      // Data Management Actions
      setShipments: (shipments) => set({ shipments }),
      setSelectedShipment: (shipment) => set({ selectedShipment: shipment }),
      setShippingMethods: (methods) => set({ shippingMethods: methods }),
      setSelectedMethod: (method) => set({ selectedMethod: method }),
      setStats: (stats) => set({ stats }),
      setDashboardSummary: (summary) => set({ dashboardSummary: summary }),

      // UI State Actions
      setLoading: (loading) => set({ loading }),
      setShipmentsLoading: (loading) => set({ shipmentsLoading: loading }),
      setShipmentLoading: (loading) => set({ shipmentLoading: loading }),
      setMethodsLoading: (loading) => set({ methodsLoading: loading }),
      setMethodLoading: (loading) => set({ methodLoading: loading }),
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
      setSelectedShipmentIds: (ids) => set({ selectedShipmentIds: ids }),
      toggleShipmentSelection: (id) => set(state => ({
        selectedShipmentIds: state.selectedShipmentIds.includes(id)
          ? state.selectedShipmentIds.filter(shipmentId => shipmentId !== id)
          : [...state.selectedShipmentIds, id]
      })),
      selectAllShipments: () => set(state => ({ 
        selectedShipmentIds: state.shipments.map(shipment => shipment.id) 
      })),
      clearShipmentSelection: () => set({ selectedShipmentIds: [] }),
      setSelectedMethodIds: (ids) => set({ selectedMethodIds: ids }),
      toggleMethodSelection: (id) => set(state => ({
        selectedMethodIds: state.selectedMethodIds.includes(id)
          ? state.selectedMethodIds.filter(methodId => methodId !== id)
          : [...state.selectedMethodIds, id]
      })),
      clearMethodSelection: () => set({ selectedMethodIds: [] }),

      // API Operations - Shipments
      fetchShipments: async (params) => {
        const state = get();
        const queryParams = params || state.filters;
        
        set({ shipmentsLoading: true, error: null });
        try {
          const response = await shippingService.getShipments({
            ...queryParams,
            page: state.currentPage,
            per_page: state.perPage,
          });
          
          set({
            shipments: response.data,
            totalPages: response.meta.last_page,
            totalCount: response.meta.total,
            currentPage: response.meta.current_page,
            shipmentsLoading: false,
          });
        } catch (error: any) {
          set({
            shipmentsLoading: false,
            error: error.response?.data?.message || 'Failed to fetch shipments',
          });
          throw error;
        }
      },

      fetchShipment: async (id) => {
        set({ shipmentLoading: true, error: null });
        try {
          const shipment = await shippingService.getShipment(id);
          set({
            selectedShipment: shipment,
            shipmentLoading: false,
          });
        } catch (error: any) {
          set({
            shipmentLoading: false,
            error: error.response?.data?.message || 'Failed to fetch shipment',
          });
          throw error;
        }
      },

      createShipment: async (data) => {
        set({ loading: true, error: null });
        try {
          const newShipment = await shippingService.createShipment(data);
          set(state => ({
            shipments: [newShipment, ...state.shipments],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return newShipment;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to create shipment',
          });
          throw error;
        }
      },

      updateShipment: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedShipment = await shippingService.updateShipment(id, data);
          set(state => ({
            shipments: state.shipments.map(shipment => 
              shipment.id === id ? updatedShipment : shipment
            ),
            selectedShipment: state.selectedShipment?.id === id ? updatedShipment : state.selectedShipment,
            loading: false,
          }));
          return updatedShipment;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to update shipment',
          });
          throw error;
        }
      },

      cancelShipment: async (id, reason) => {
        set({ loading: true, error: null });
        try {
          const cancelledShipment = await shippingService.cancelShipment(id, reason);
          set(state => ({
            shipments: state.shipments.map(shipment => 
              shipment.id === id ? cancelledShipment : shipment
            ),
            selectedShipment: state.selectedShipment?.id === id ? cancelledShipment : state.selectedShipment,
            loading: false,
          }));
          return cancelledShipment;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to cancel shipment',
          });
          throw error;
        }
      },

      processShipment: async (id) => {
        set({ loading: true, error: null });
        try {
          const processedShipment = await shippingService.processShipment(id);
          set(state => ({
            shipments: state.shipments.map(shipment => 
              shipment.id === id ? processedShipment : shipment
            ),
            selectedShipment: state.selectedShipment?.id === id ? processedShipment : state.selectedShipment,
            loading: false,
          }));
          return processedShipment;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to process shipment',
          });
          throw error;
        }
      },

      // API Operations - Shipping Methods
      fetchShippingMethods: async (params) => {
        set({ methodsLoading: true, error: null });
        try {
          const methods = await shippingService.getShippingMethods(params);
          set({
            shippingMethods: methods,
            methodsLoading: false,
          });
        } catch (error: any) {
          set({
            methodsLoading: false,
            error: error.response?.data?.message || 'Failed to fetch shipping methods',
          });
          throw error;
        }
      },

      createShippingMethod: async (data) => {
        set({ loading: true, error: null });
        try {
          const newMethod = await shippingService.createShippingMethod(data);
          set(state => ({
            shippingMethods: [newMethod, ...state.shippingMethods],
            loading: false,
          }));
          return newMethod;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to create shipping method',
          });
          throw error;
        }
      },

      updateShippingMethod: async (id, data) => {
        set({ loading: true, error: null });
        try {
          const updatedMethod = await shippingService.updateShippingMethod(id, data);
          set(state => ({
            shippingMethods: state.shippingMethods.map(method => 
              method.id === id ? updatedMethod : method
            ),
            selectedMethod: state.selectedMethod?.id === id ? updatedMethod : state.selectedMethod,
            loading: false,
          }));
          return updatedMethod;
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to update shipping method',
          });
          throw error;
        }
      },

      deleteShippingMethod: async (id) => {
        set({ loading: true, error: null });
        try {
          await shippingService.deleteShippingMethod(id);
          set(state => ({
            shippingMethods: state.shippingMethods.filter(method => method.id !== id),
            selectedMethod: state.selectedMethod?.id === id ? null : state.selectedMethod,
            selectedMethodIds: state.selectedMethodIds.filter(methodId => methodId !== id),
            loading: false,
          }));
        } catch (error: any) {
          set({
            loading: false,
            error: error.response?.data?.message || 'Failed to delete shipping method',
          });
          throw error;
        }
      },

      // Statistics & Reports
      fetchShippingStats: async (params) => {
        set({ statsLoading: true, error: null });
        try {
          const stats = await shippingService.getShippingStats(params);
          set({
            stats,
            statsLoading: false,
          });
        } catch (error: any) {
          set({
            statsLoading: false,
            error: error.response?.data?.message || 'Failed to fetch shipping statistics',
          });
          throw error;
        }
      },

      fetchDashboardSummary: async () => {
        set({ dashboardLoading: true, error: null });
        try {
          const summary = await shippingService.getDashboardSummary();
          set({
            dashboardSummary: summary,
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

      // Bulk Operations
      bulkUpdateShipments: async (ids, data) => {
        set({ bulkActionLoading: true, error: null });
        try {
          const result = await shippingService.bulkUpdateShipments(ids, data);
          
          // Update local state for successful updates
          if (result.success.length > 0) {
            set(state => ({
              shipments: state.shipments.map(shipment => {
                const updatedShipment = result.success.find(s => s.id === shipment.id);
                return updatedShipment || shipment;
              }),
              bulkActionLoading: false,
            }));
          } else {
            set({ bulkActionLoading: false });
          }
          
          return result;
        } catch (error: any) {
          set({
            bulkActionLoading: false,
            error: error.response?.data?.message || 'Failed to bulk update shipments',
          });
          throw error;
        }
      },

      // Utility Actions
      refreshData: async () => {
        const { fetchShipments, fetchShippingMethods, fetchShippingStats, fetchDashboardSummary } = get();
        await Promise.all([
          fetchShipments(),
          fetchShippingMethods(),
          fetchShippingStats(),
          fetchDashboardSummary(),
        ]);
      },

      reset: () => set({
        shipments: [],
        selectedShipment: null,
        shippingMethods: [],
        selectedMethod: null,
        stats: null,
        dashboardSummary: null,
        loading: false,
        shipmentsLoading: false,
        shipmentLoading: false,
        methodsLoading: false,
        methodLoading: false,
        statsLoading: false,
        dashboardLoading: false,
        bulkActionLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        perPage: 20,
        filters: initialFilters,
        selectedShipmentIds: [],
        selectedMethodIds: [],
      }),
    }),
    {
      name: 'shipping-store',
      // Only persist non-sensitive data
      partialize: (state) => ({ 
        filters: state.filters,
        perPage: state.perPage
      }),
    }
  )
);