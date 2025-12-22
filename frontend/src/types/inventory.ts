export interface InventoryAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface InventoryCapacity {
  total?: number | null;
  used?: number | null;
  unit?: string | null;
}

export interface InventoryEnvironment {
  temperatureControlled: boolean;
  temperatureMin?: number | null;
  temperatureMax?: number | null;
  humidityControlled: boolean;
  humidityMax?: number | null;
}

export interface InventoryLocation {
  id: number;
  uuid: string;
  modelUuid: string;
  tenantId: number;
  locationCode: string;
  locationName: string;
  description?: string | null;
  parentLocationId?: number | null;
  locationLevel?: number | null;
  locationType: string;
  isActive: boolean;
  isPrimary: boolean;
  address: InventoryAddress;
  capacity: InventoryCapacity;
  environment: InventoryEnvironment;
  securityLevel?: string | null;
  operationalHours?: Record<string, unknown> | null;
  contactInformation?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryItemLocation {
  id: number;
  uuid: string;
  inventoryItemId: number;
  inventoryLocationId: number;
  stockOnHand: number;
  stockReserved: number;
  stockAvailable: number;
  stockDamaged: number;
  stockInTransit: number;
  lastCountedAt?: string | null;
  lastReconciledAt?: string | null;
  location?: InventoryLocation;
}

export interface InventoryAlert {
  id: number;
  uuid: string;
  inventoryItemId: number;
  inventoryLocationId: number | null;
  alertType: string;
  severity: string;
  message: string;
  triggeredQuantity?: number | null;
  thresholdQuantity?: number | null;
  resolved: boolean;
  resolvedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryItem {
  id: number;
  uuid: string;
  modelUuid: string;
  tenantId: number;
  productId: number | null;
  itemCode: string;
  itemName: string;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  itemType: string;
  unitOfMeasure: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
  onOrderStock: number;
  minimumStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  valuationMethod: string;
  isActive: boolean;
  isDiscontinued: boolean;
  alerts?: InventoryAlert[];
  locations?: InventoryItemLocation[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface InventoryReservation {
  id: number;
  uuid: string;
  inventoryItemId: number;
  inventoryLocationId: number | null;
  quantity: number;
  status: string;
  reservedForType: string;
  reservedForId: string;
  reservedAt?: string | null;
  expiresAt?: string | null;
  releasedAt?: string | null;
  metadata?: Record<string, unknown> | null;
  location?: InventoryLocation;
}

export interface InventoryReconciliation {
  id: number;
  uuid: string;
  inventoryItemId: number;
  inventoryLocationId: number | null;
  expectedQuantity: number;
  countedQuantity: number;
  varianceQuantity: number;
  varianceValue: number;
  status: string;
  source?: string | null;
  initiatedBy?: number | null;
  initiatedAt?: string | null;
  resolvedBy?: number | null;
  resolvedAt?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  links: {
    next?: string | null;
    prev?: string | null;
  };
}
