import apiClient from './client';
import { tenantApiClient } from '@/services/api/tenantApiClient';
import * as mockInventory from '@/services/mock/inventory';
import {
  InventoryItem,
  InventoryLocation,
  InventoryReservation,
  InventoryReconciliation,
  PaginatedResponse,
} from '@/types/inventory';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

type QueryValue = string | number | boolean | undefined | null;

type QueryParams = Record<string, QueryValue>;

export interface InventoryItemFilters {
  search?: string;
  category?: string;
  activeOnly?: boolean;
  page?: number;
  perPage?: number;
}

export interface InventoryLocationFilters {
  activeOnly?: boolean;
  type?: string;
}

export interface InventoryReservationFilters {
  status?: string;
  referenceType?: string;
  page?: number;
  perPage?: number;
}

export interface InventoryReconciliationFilters {
  status?: string;
  inventoryItemId?: number;
  page?: number;
  perPage?: number;
}

export interface InventoryLocationInput {
  locationCode?: string;
  locationName?: string;
  description?: string | null;
  parentLocationId?: number | null;
  locationLevel?: number | null;
  locationType?: string;
  address?: InventoryLocation['address'];
  capacity?: InventoryLocation['capacity'];
  environment?: InventoryLocation['environment'];
  securityLevel?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
  operationalHours?: InventoryLocation['operationalHours'];
  contactInformation?: InventoryLocation['contactInformation'];
}

export type CreateInventoryLocationPayload = InventoryLocationInput & {
  locationCode: string;
  locationName: string;
};

export type UpdateInventoryLocationPayload = InventoryLocationInput;

export interface SetLocationStockPayload {
  quantity: number;
  reason?: string;
}

export interface AdjustLocationStockPayload {
  difference: number;
  reason?: string;
}

export interface TransferInventoryStockPayload {
  fromLocationId: number;
  toLocationId: number;
  quantity: number;
  reason?: string;
}

export interface ReserveInventoryStockPayload {
  quantity: number;
  locationId?: number | null;
  referenceType: string;
  referenceId: string;
  expiresAt?: string | null;
}

export interface ReleaseInventoryReservationPayload {
  reason?: string;
}

export interface RunInventoryReconciliationPayload {
  source?: string;
  async?: boolean;
}

const cleanPayload = (payload: QueryParams): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

const buildItemQuery = (filters?: InventoryItemFilters): QueryParams => {
  if (!filters) {
    return {};
  }
  return cleanPayload({
    search: filters.search,
    category: filters.category,
    active_only: filters.activeOnly,
    page: filters.page,
    per_page: filters.perPage,
  });
};

const buildLocationQuery = (filters?: InventoryLocationFilters): QueryParams => {
  if (!filters) {
    return {};
  }
  return cleanPayload({
    active_only: filters.activeOnly,
    type: filters.type,
  });
};

const buildReservationQuery = (filters?: InventoryReservationFilters): QueryParams => {
  if (!filters) {
    return {};
  }
  return cleanPayload({
    status: filters.status,
    reference_type: filters.referenceType,
    page: filters.page,
    per_page: filters.perPage,
  });
};

const buildReconciliationQuery = (filters?: InventoryReconciliationFilters): QueryParams => {
  if (!filters) {
    return {};
  }
  return cleanPayload({
    status: filters.status,
    inventory_item_id: filters.inventoryItemId,
    page: filters.page,
    per_page: filters.perPage,
  });
};

const mapLocationPayload = (payload: InventoryLocationInput): Record<string, unknown> => {
  const address = payload.address ?? {};
  const capacity = payload.capacity ?? {};
  const environment = payload.environment ?? {};

  return cleanPayload({
    location_code: payload.locationCode,
    location_name: payload.locationName,
    description: payload.description,
    parent_location_id: payload.parentLocationId,
    location_level: payload.locationLevel,
    location_type: payload.locationType,
    address_line_1: address.line1,
    address_line_2: address.line2,
    city: address.city,
    state_province: address.stateProvince,
    postal_code: address.postalCode,
    country: address.country,
    total_capacity: capacity.total,
    used_capacity: capacity.used,
    capacity_unit: capacity.unit,
    temperature_controlled: environment.temperatureControlled,
    temperature_min: environment.temperatureMin,
    temperature_max: environment.temperatureMax,
    humidity_controlled: environment.humidityControlled,
    humidity_max: environment.humidityMax,
    security_level: payload.securityLevel,
    is_active: payload.isActive,
    is_primary: payload.isPrimary,
    operational_hours: payload.operationalHours,
    contact_information: payload.contactInformation,
  });
};

export async function getInventoryItems(filters?: InventoryItemFilters): Promise<PaginatedResponse<InventoryItem>> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.getInventoryItems(filters));
  }

  try {
    const response = await apiClient.get<PaginatedResponse<InventoryItem>>('/tenant/inventory/items', {
      params: buildItemQuery(filters),
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch inventory items, falling back to mock data:', error);
    return mockInventory.getInventoryItems(filters);
  }
}

export async function getInventoryItem(itemId: number): Promise<InventoryItem | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.getInventoryItem(itemId));
  }

  try {
    const response = await apiClient.get<{ data: InventoryItem }>(`/tenant/inventory/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch inventory item, falling back to mock data:', error);
    return mockInventory.getInventoryItem(itemId);
  }
}

export async function getInventoryLocations(filters?: InventoryLocationFilters): Promise<InventoryLocation[]> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.getInventoryLocations(filters));
  }

  try {
    const response = await apiClient.get<{ data: InventoryLocation[] }>('/tenant/inventory/locations', {
      params: buildLocationQuery(filters),
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch inventory locations, falling back to mock data:', error);
    return mockInventory.getInventoryLocations(filters);
  }
}

export async function createInventoryLocation(payload: CreateInventoryLocationPayload): Promise<InventoryLocation> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.createInventoryLocation(payload));
  }

  try {
    const response = await apiClient.post<{ data: InventoryLocation }>('/tenant/inventory/locations', mapLocationPayload(payload));
    return response.data;
  } catch (error) {
    console.error('Failed to create inventory location, falling back to mock data:', error);
    return mockInventory.createInventoryLocation(payload);
  }
}

export async function updateInventoryLocation(id: number, payload: UpdateInventoryLocationPayload): Promise<InventoryLocation | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.updateInventoryLocation(id, payload));
  }

  try {
    const response = await apiClient.put<{ data: InventoryLocation }>(`/tenant/inventory/locations/${id}`, mapLocationPayload(payload));
    return response.data;
  } catch (error) {
    console.error('Failed to update inventory location, falling back to mock data:', error);
    return mockInventory.updateInventoryLocation(id, payload);
  }
}

export async function setLocationStock(productId: number, locationId: number, payload: SetLocationStockPayload): Promise<InventoryItem | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.setLocationStock(productId, locationId, payload));
  }

  try {
    const response = await apiClient.post<{ data: InventoryItem }>(
      `/tenant/inventory/items/${productId}/locations/${locationId}/stock`,
      cleanPayload({ quantity: payload.quantity, reason: payload.reason })
    );
    return response.data;
  } catch (error) {
    console.error('Failed to set location stock, falling back to mock data:', error);
    return mockInventory.setLocationStock(productId, locationId, payload);
  }
}

export async function adjustLocationStock(productId: number, locationId: number, payload: AdjustLocationStockPayload): Promise<InventoryItem | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.adjustLocationStock(productId, locationId, payload));
  }

  try {
    const response = await apiClient.post<{ data: InventoryItem }>(
      `/tenant/inventory/items/${productId}/locations/${locationId}/adjust`,
      cleanPayload({ difference: payload.difference, reason: payload.reason })
    );
    return response.data;
  } catch (error) {
    console.error('Failed to adjust location stock, falling back to mock data:', error);
    return mockInventory.adjustLocationStock(productId, locationId, payload);
  }
}

export async function transferInventoryStock(productId: number, payload: TransferInventoryStockPayload): Promise<InventoryItem | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.transferInventoryStock(productId, payload));
  }

  try {
    const response = await apiClient.post<{ data: InventoryItem }>(
      `/tenant/inventory/items/${productId}/transfer`,
      cleanPayload({
        from_location_id: payload.fromLocationId,
        to_location_id: payload.toLocationId,
        quantity: payload.quantity,
        reason: payload.reason,
      })
    );
    return response.data;
  } catch (error) {
    console.error('Failed to transfer inventory stock, falling back to mock data:', error);
    return mockInventory.transferInventoryStock(productId, payload);
  }
}

export async function reserveInventoryStock(productId: number, payload: ReserveInventoryStockPayload): Promise<InventoryReservation | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.reserveInventoryStock(productId, payload));
  }

  try {
    const response = await apiClient.post<{ data: InventoryReservation }>(
      `/tenant/inventory/items/${productId}/reserve`,
      cleanPayload({
        quantity: payload.quantity,
        location_id: payload.locationId,
        reference_type: payload.referenceType,
        reference_id: payload.referenceId,
        expires_at: payload.expiresAt,
      })
    );
    return response.data;
  } catch (error) {
    console.error('Failed to reserve inventory stock, falling back to mock data:', error);
    return mockInventory.reserveInventoryStock(productId, payload);
  }
}

export async function releaseInventoryReservation(reservationId: number, payload?: ReleaseInventoryReservationPayload): Promise<InventoryReservation | undefined> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.releaseInventoryReservation(reservationId, payload));
  }

  try {
    const response = await apiClient.post<{ data: InventoryReservation }>(
      `/tenant/inventory/reservations/${reservationId}/release`,
      cleanPayload({ reason: payload?.reason })
    );
    return response.data;
  } catch (error) {
    console.error('Failed to release inventory reservation, falling back to mock data:', error);
    return mockInventory.releaseInventoryReservation(reservationId, payload);
  }
}

export async function getInventoryReservations(filters?: InventoryReservationFilters): Promise<PaginatedResponse<InventoryReservation>> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.getInventoryReservations(filters));
  }

  try {
    const response = await apiClient.get<PaginatedResponse<InventoryReservation>>('/tenant/inventory/reservations', {
      params: buildReservationQuery(filters),
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch inventory reservations, falling back to mock data:', error);
    return mockInventory.getInventoryReservations(filters);
  }
}

export async function getInventoryReconciliations(filters?: InventoryReconciliationFilters): Promise<PaginatedResponse<InventoryReconciliation>> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.getInventoryReconciliations(filters));
  }

  try {
    const response = await apiClient.get<PaginatedResponse<InventoryReconciliation>>('/tenant/inventory/reconciliations', {
      params: buildReconciliationQuery(filters),
    });
    return response;
  } catch (error) {
    console.error('Failed to fetch inventory reconciliations, falling back to mock data:', error);
    return mockInventory.getInventoryReconciliations(filters);
  }
}

export async function runInventoryReconciliation(payload?: RunInventoryReconciliationPayload): Promise<{ status: 'queued' | 'completed' }> {
  if (USE_MOCK) {
    return Promise.resolve(mockInventory.runInventoryReconciliation(payload));
  }

  try {
    const response = await apiClient.post<{ status: 'queued' | 'completed' }>(
      '/tenant/inventory/reconciliations/run',
      cleanPayload({
        source: payload?.source,
        async: payload?.async,
      })
    );
    return response;
  } catch (error) {
    console.error('Failed to run inventory reconciliation, falling back to mock data:', error);
    return mockInventory.runInventoryReconciliation(payload);
  }
}

// Export service instance
export const inventoryService = {
  getItems: getInventoryItems,
  getItemById: getInventoryItem,
  getLocations: getInventoryLocations,
  createLocation: createInventoryLocation,
  updateLocation: updateInventoryLocation,
  deleteLocation: async (id: number) => {
    try {
      await tenantApiClient.delete(`/inventory/locations/${id}`);
      return { message: 'Location deleted successfully' };
    } catch (error) {
      console.error('Failed to delete location:', error);
      throw error;
    }
  },
  getLocationStock: async (productId: number, locationId: number) => {
    try {
      return await tenantApiClient.get(`/inventory/items/product/${productId}/location/${locationId}`);
    } catch (error) {
      console.error('Failed to get location stock:', error);
      throw error;
    }
  },
  setLocationStock: setLocationStock,
  adjustLocationStock: adjustLocationStock,
  transferStock: transferInventoryStock,
  getReservations: getInventoryReservations,
  reserveStock: reserveInventoryStock,
  releaseReservation: releaseInventoryReservation,
  getReconciliations: getInventoryReconciliations,
  runReconciliation: runInventoryReconciliation
};
