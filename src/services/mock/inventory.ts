import { InventoryItem, InventoryItemLocation, InventoryLocation, InventoryReservation, InventoryReconciliation, PaginatedResponse } from '@/types/inventory';

type InventoryItemFilters = {
  search?: string;
  category?: string;
  activeOnly?: boolean;
  page?: number;
  perPage?: number;
};

type InventoryLocationFilters = {
  activeOnly?: boolean;
  type?: string;
};

type InventoryReservationFilters = {
  status?: string;
  referenceType?: string;
  page?: number;
  perPage?: number;
};

type InventoryReconciliationFilters = {
  status?: string;
  inventoryItemId?: number;
  page?: number;
  perPage?: number;
};

const isoNow = () => new Date().toISOString();

let locationCounter = 3;
let reservationCounter = 2;

const mockLocations: InventoryLocation[] = [
  {
    id: 1,
    uuid: 'loc-uuid-1',
    modelUuid: 'loc-model-1',
    tenantId: 1,
    locationCode: 'WH-A',
    locationName: 'Warehouse A',
    description: 'Primary warehouse hub',
    parentLocationId: null,
    locationLevel: 1,
    locationType: 'warehouse',
    isActive: true,
    isPrimary: true,
    address: {
      line1: 'Jl. Gatot Subroto No. 12',
      line2: null,
      city: 'Jakarta',
      stateProvince: 'DKI Jakarta',
      postalCode: '10270',
      country: 'Indonesia',
    },
    capacity: {
      total: 500,
      used: 320,
      unit: 'pallet',
    },
    environment: {
      temperatureControlled: false,
      temperatureMin: null,
      temperatureMax: null,
      humidityControlled: false,
      humidityMax: null,
    },
    securityLevel: 'standard',
    operationalHours: {
      monday: { open: '08:00', close: '17:00' },
      tuesday: { open: '08:00', close: '17:00' },
      wednesday: { open: '08:00', close: '17:00' },
      thursday: { open: '08:00', close: '17:00' },
      friday: { open: '08:00', close: '16:00' },
    },
    contactInformation: {
      name: 'Adi Permana',
      phone: '+6281234567890',
      email: 'warehouse-a@tenant.local',
    },
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
  {
    id: 2,
    uuid: 'loc-uuid-2',
    modelUuid: 'loc-model-2',
    tenantId: 1,
    locationCode: 'WH-B',
    locationName: 'Warehouse B',
    description: 'Secondary storage',
    parentLocationId: null,
    locationLevel: 1,
    locationType: 'warehouse',
    isActive: true,
    isPrimary: false,
    address: {
      line1: 'Jl. Kuningan Barat No. 7',
      line2: null,
      city: 'Jakarta',
      stateProvince: 'DKI Jakarta',
      postalCode: '12910',
      country: 'Indonesia',
    },
    capacity: {
      total: 300,
      used: 120,
      unit: 'pallet',
    },
    environment: {
      temperatureControlled: true,
      temperatureMin: 18,
      temperatureMax: 24,
      humidityControlled: true,
      humidityMax: 65,
    },
    securityLevel: 'high',
    operationalHours: {
      monday: { open: '08:00', close: '18:00' },
      tuesday: { open: '08:00', close: '18:00' },
      wednesday: { open: '08:00', close: '18:00' },
      thursday: { open: '08:00', close: '18:00' },
      friday: { open: '08:00', close: '18:00' },
    },
    contactInformation: {
      name: 'Siti Rahma',
      phone: '+6281333344455',
      email: 'warehouse-b@tenant.local',
    },
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
  {
    id: 3,
    uuid: 'loc-uuid-3',
    modelUuid: 'loc-model-3',
    tenantId: 1,
    locationCode: 'QC-1',
    locationName: 'Quality Control Zone',
    description: 'Inspection and quality control',
    parentLocationId: null,
    locationLevel: 2,
    locationType: 'quality_control',
    isActive: true,
    isPrimary: false,
    address: {
      line1: 'Jl. Senayan No. 5',
      line2: null,
      city: 'Jakarta',
      stateProvince: 'DKI Jakarta',
      postalCode: '10270',
      country: 'Indonesia',
    },
    capacity: {
      total: 80,
      used: 20,
      unit: 'rack',
    },
    environment: {
      temperatureControlled: true,
      temperatureMin: 20,
      temperatureMax: 23,
      humidityControlled: true,
      humidityMax: 55,
    },
    securityLevel: 'medium',
    operationalHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
    },
    contactInformation: {
      name: 'Rudi Hartono',
      phone: '+628155667788',
      email: 'qc@tenant.local',
    },
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
];

const mockItemLocations = (itemId: number): InventoryItemLocation[] => {
  if (itemId === 1) {
    return [
      {
        id: 1,
        uuid: 'item-loc-1',
        inventoryItemId: 1,
        inventoryLocationId: 1,
        stockOnHand: 100,
        stockReserved: 10,
        stockAvailable: 90,
        stockDamaged: 0,
        stockInTransit: 0,
        lastCountedAt: null,
        lastReconciledAt: isoNow(),
        location: mockLocations[0],
      },
      {
        id: 2,
        uuid: 'item-loc-2',
        inventoryItemId: 1,
        inventoryLocationId: 2,
        stockOnHand: 50,
        stockReserved: 10,
        stockAvailable: 40,
        stockDamaged: 0,
        stockInTransit: 0,
        lastCountedAt: null,
        lastReconciledAt: isoNow(),
        location: mockLocations[1],
      },
    ];
  }

  return [
    {
      id: 3,
      uuid: 'item-loc-3',
      inventoryItemId: 2,
      inventoryLocationId: 1,
      stockOnHand: 30,
      stockReserved: 5,
      stockAvailable: 25,
      stockDamaged: 0,
      stockInTransit: 0,
      lastCountedAt: null,
      lastReconciledAt: isoNow(),
      location: mockLocations[0],
    },
    {
      id: 4,
      uuid: 'item-loc-4',
      inventoryItemId: 2,
      inventoryLocationId: 3,
      stockOnHand: 20,
      stockReserved: 0,
      stockAvailable: 20,
      stockDamaged: 0,
      stockInTransit: 0,
      lastCountedAt: null,
      lastReconciledAt: isoNow(),
      location: mockLocations[2],
    },
  ];
};

const mockItems: InventoryItem[] = [
  {
    id: 1,
    uuid: 'item-uuid-1',
    modelUuid: 'item-model-1',
    tenantId: 1,
    productId: 101,
    itemCode: 'MAT-ETCH-001',
    itemName: 'Copper Plate 1mm',
    description: 'High quality copper plates for etching',
    category: 'Materials',
    subcategory: 'Metals',
    itemType: 'material',
    unitOfMeasure: 'pcs',
    currentStock: 150,
    availableStock: 130,
    reservedStock: 20,
    onOrderStock: 40,
    minimumStockLevel: 30,
    reorderPoint: 45,
    reorderQuantity: 80,
    valuationMethod: 'FIFO',
    isActive: true,
    isDiscontinued: false,
    alerts: [],
    locations: mockItemLocations(1),
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
  {
    id: 2,
    uuid: 'item-uuid-2',
    modelUuid: 'item-model-2',
    tenantId: 1,
    productId: 102,
    itemCode: 'CHEM-ETCH-002',
    itemName: 'Etching Solution Pack',
    description: 'Chemical solution set for etching process',
    category: 'Consumables',
    subcategory: 'Chemicals',
    itemType: 'consumable',
    unitOfMeasure: 'set',
    currentStock: 50,
    availableStock: 45,
    reservedStock: 5,
    onOrderStock: 20,
    minimumStockLevel: 15,
    reorderPoint: 20,
    reorderQuantity: 40,
    valuationMethod: 'FIFO',
    isActive: true,
    isDiscontinued: false,
    alerts: [],
    locations: mockItemLocations(2),
    createdAt: isoNow(),
    updatedAt: isoNow(),
  },
];

const mockReservations: InventoryReservation[] = [
  {
    id: 1,
    uuid: 'res-uuid-1',
    inventoryItemId: 1,
    inventoryLocationId: 1,
    quantity: 10,
    status: 'active',
    reservedForType: 'order',
    reservedForId: 'ORD-2025-0001',
    reservedAt: isoNow(),
    expiresAt: null,
    releasedAt: null,
    metadata: null,
    location: mockLocations[0],
  },
  {
    id: 2,
    uuid: 'res-uuid-2',
    inventoryItemId: 1,
    inventoryLocationId: 2,
    quantity: 10,
    status: 'active',
    reservedForType: 'project',
    reservedForId: 'PRJ-ETCH-08',
    reservedAt: isoNow(),
    expiresAt: null,
    releasedAt: null,
    metadata: null,
    location: mockLocations[1],
  },
];

const mockReconciliations: InventoryReconciliation[] = [
  {
    id: 1,
    uuid: 'rec-uuid-1',
    inventoryItemId: 1,
    inventoryLocationId: 1,
    expectedQuantity: 150,
    countedQuantity: 148,
    varianceQuantity: -2,
    varianceValue: -300000,
    status: 'open',
    source: 'cycle_count',
    initiatedBy: 11,
    initiatedAt: isoNow(),
    resolvedBy: null,
    resolvedAt: null,
    metadata: { note: 'Minor shrinkage detected' },
  },
  {
    id: 2,
    uuid: 'rec-uuid-2',
    inventoryItemId: 2,
    inventoryLocationId: 3,
    expectedQuantity: 50,
    countedQuantity: 51,
    varianceQuantity: 1,
    varianceValue: 150000,
    status: 'resolved',
    source: 'seed',
    initiatedBy: 12,
    initiatedAt: isoNow(),
    resolvedBy: 12,
    resolvedAt: isoNow(),
    metadata: { note: 'Packaging adjustment' },
  },
];

const paginate = <T>(items: T[], filters?: { page?: number; perPage?: number }): PaginatedResponse<T> => {
  const page = filters?.page ?? 1;
  const perPage = filters?.perPage ?? items.length || 1;
  const start = (page - 1) * perPage;
  const paginated = items.slice(start, start + perPage);

  return {
    data: paginated,
    meta: {
      total: items.length,
      per_page: perPage,
      current_page: page,
      last_page: Math.max(1, Math.ceil(items.length / perPage)),
    },
    links: {
      next: page * perPage < items.length ? `?page=${page + 1}&per_page=${perPage}` : null,
      prev: page > 1 ? `?page=${page - 1}&per_page=${perPage}` : null,
    },
  };
};

const recalcItemBalances = (item: InventoryItem) => {
  const totals = item.locations?.reduce(
    (acc, loc) => {
      acc.onHand += loc.stockOnHand;
      acc.reserved += loc.stockReserved;
      acc.available += loc.stockAvailable;
      return acc;
    },
    { onHand: 0, reserved: 0, available: 0 }
  );

  item.currentStock = totals?.onHand ?? 0;
  item.reservedStock = totals?.reserved ?? 0;
  item.availableStock = totals?.available ?? 0;
  item.updatedAt = isoNow();
};

const findItemById = (productId: number): InventoryItem | undefined =>
  mockItems.find((item) => item.productId === productId || item.id === productId);

const findLocationById = (locationId: number): InventoryLocation | undefined =>
  mockLocations.find((loc) => loc.id === locationId);

const ensureItemLocation = (item: InventoryItem, locationId: number): InventoryItemLocation => {
  if (!item.locations) {
    item.locations = [];
  }
  let entry = item.locations.find((loc) => loc.inventoryLocationId === locationId);
  if (!entry) {
    const location = findLocationById(locationId);
    entry = {
      id: Date.now(),
      uuid: `item-loc-${Date.now()}`,
      inventoryItemId: item.id,
      inventoryLocationId: locationId,
      stockOnHand: 0,
      stockReserved: 0,
      stockAvailable: 0,
      stockDamaged: 0,
      stockInTransit: 0,
      lastCountedAt: null,
      lastReconciledAt: isoNow(),
      location,
    };
    item.locations.push(entry);
  }
  if (!entry.location) {
    entry.location = findLocationById(locationId);
  }
  return entry;
};

export function getInventoryItems(filters?: InventoryItemFilters): PaginatedResponse<InventoryItem> {
  let items = [...mockItems];

  if (filters?.search) {
    const term = filters.search.toLowerCase();
    items = items.filter((item) => item.itemCode.toLowerCase().includes(term) || item.itemName.toLowerCase().includes(term));
  }

  if (filters?.category) {
    items = items.filter((item) => item.category?.toLowerCase() === filters.category?.toLowerCase());
  }

  if (filters?.activeOnly) {
    items = items.filter((item) => item.isActive);
  }

  return paginate(items, filters);
}

export function getInventoryItem(id: number): InventoryItem | undefined {
  return mockItems.find((item) => item.id === id || item.productId === id);
}

export function getInventoryLocations(filters?: InventoryLocationFilters): InventoryLocation[] {
  let locations = [...mockLocations];
  if (filters?.activeOnly) {
    locations = locations.filter((loc) => loc.isActive);
  }
  if (filters?.type) {
    locations = locations.filter((loc) => loc.locationType === filters.type);
  }
  return locations;
}

export function createInventoryLocation(payload: Partial<InventoryLocation>): InventoryLocation {
  locationCounter += 1;
  const now = isoNow();
  const location: InventoryLocation = {
    id: locationCounter,
    uuid: `loc-uuid-${locationCounter}`,
    modelUuid: `loc-model-${locationCounter}`,
    tenantId: 1,
    locationCode: payload.locationCode ?? `LOC-${String(locationCounter).padStart(3, '0')}`,
    locationName: payload.locationName ?? `Location ${locationCounter}`,
    description: payload.description ?? null,
    parentLocationId: payload.parentLocationId ?? null,
    locationLevel: payload.locationLevel ?? 1,
    locationType: payload.locationType ?? 'warehouse',
    isActive: payload.isActive ?? true,
    isPrimary: payload.isPrimary ?? false,
    address: payload.address ?? {
      line1: null,
      line2: null,
      city: null,
      stateProvince: null,
      postalCode: null,
      country: 'Indonesia',
    },
    capacity: payload.capacity ?? {
      total: null,
      used: null,
      unit: 'pallet',
    },
    environment: payload.environment ?? {
      temperatureControlled: false,
      temperatureMin: null,
      temperatureMax: null,
      humidityControlled: false,
      humidityMax: null,
    },
    securityLevel: payload.securityLevel ?? 'standard',
    operationalHours: payload.operationalHours ?? null,
    contactInformation: payload.contactInformation ?? null,
    createdAt: now,
    updatedAt: now,
  };

  mockLocations.push(location);
  return location;
}

export function updateInventoryLocation(id: number, payload: Partial<InventoryLocation>): InventoryLocation | undefined {
  const location = findLocationById(id);
  if (!location) {
    return undefined;
  }

  location.locationName = payload.locationName ?? location.locationName;
  location.description = payload.description ?? location.description;
  location.locationType = payload.locationType ?? location.locationType;
  location.address = payload.address ?? location.address;
  location.capacity = payload.capacity ?? location.capacity;
  location.environment = payload.environment ?? location.environment;
  location.securityLevel = payload.securityLevel ?? location.securityLevel;
  location.isActive = payload.isActive ?? location.isActive;
  location.isPrimary = payload.isPrimary ?? location.isPrimary;
  location.operationalHours = payload.operationalHours ?? location.operationalHours;
  location.contactInformation = payload.contactInformation ?? location.contactInformation;
  location.updatedAt = isoNow();

  return location;
}

export function setLocationStock(productId: number, locationId: number, payload: { quantity: number; reason?: string }): InventoryItem | undefined {
  const item = findItemById(productId);
  const location = findLocationById(locationId);
  if (!item || !location) {
    return undefined;
  }

  const entry = ensureItemLocation(item, locationId);
  entry.stockOnHand = payload.quantity;
  entry.stockReserved = entry.stockReserved ?? 0;
  entry.stockAvailable = Math.max(payload.quantity - entry.stockReserved, 0);
  entry.lastReconciledAt = isoNow();
  entry.location = location;

  recalcItemBalances(item);
  return item;
}

export function adjustLocationStock(productId: number, locationId: number, payload: { difference: number; reason?: string }): InventoryItem | undefined {
  if (payload.difference === 0) {
    return findItemById(productId);
  }

  const item = findItemById(productId);
  const location = findLocationById(locationId);
  if (!item || !location) {
    return undefined;
  }

  const entry = ensureItemLocation(item, locationId);
  const newQuantity = entry.stockOnHand + payload.difference;
  entry.stockOnHand = Math.max(newQuantity, 0);
  entry.stockAvailable = Math.max(entry.stockOnHand - entry.stockReserved, 0);
  entry.lastReconciledAt = isoNow();
  entry.location = location;

  recalcItemBalances(item);
  return item;
}

export function transferInventoryStock(productId: number, payload: { fromLocationId: number; toLocationId: number; quantity: number; reason?: string }): InventoryItem | undefined {
  if (payload.quantity <= 0 || payload.fromLocationId === payload.toLocationId) {
    return findItemById(productId);
  }

  const item = findItemById(productId);
  const fromLocation = findLocationById(payload.fromLocationId);
  const toLocation = findLocationById(payload.toLocationId);
  if (!item || !fromLocation || !toLocation) {
    return undefined;
  }

  const fromEntry = ensureItemLocation(item, payload.fromLocationId);
  if (fromEntry.stockOnHand < payload.quantity) {
    return item;
  }

  const toEntry = ensureItemLocation(item, payload.toLocationId);
  fromEntry.stockOnHand -= payload.quantity;
  fromEntry.stockAvailable = Math.max(fromEntry.stockOnHand - fromEntry.stockReserved, 0);
  fromEntry.location = fromLocation;

  toEntry.stockOnHand += payload.quantity;
  toEntry.stockAvailable = Math.max(toEntry.stockOnHand - toEntry.stockReserved, 0);
  toEntry.location = toLocation;

  recalcItemBalances(item);
  return item;
}

export function reserveInventoryStock(productId: number, payload: { quantity: number; locationId?: number | null; referenceType: string; referenceId: string; expiresAt?: string | null }): InventoryReservation | undefined {
  const item = findItemById(productId);
  if (!item) {
    return undefined;
  }

  const location = payload.locationId ? findLocationById(payload.locationId) : null;
  const entry = payload.locationId ? ensureItemLocation(item, payload.locationId) : undefined;
  const available = payload.locationId ? entry?.stockAvailable ?? 0 : item.availableStock;
  if (available < payload.quantity) {
    return undefined;
  }

  if (entry) {
    entry.stockReserved += payload.quantity;
    entry.stockAvailable = Math.max(entry.stockOnHand - entry.stockReserved, 0);
  }
  item.reservedStock += payload.quantity;
  item.availableStock = Math.max(item.currentStock - item.reservedStock, 0);

  reservationCounter += 1;
  const reservation: InventoryReservation = {
    id: reservationCounter,
    uuid: `res-uuid-${reservationCounter}`,
    inventoryItemId: item.id,
    inventoryLocationId: location?.id ?? null,
    quantity: payload.quantity,
    status: 'active',
    reservedForType: payload.referenceType,
    reservedForId: payload.referenceId,
    reservedAt: isoNow(),
    expiresAt: payload.expiresAt ?? null,
    releasedAt: null,
    metadata: null,
    location,
  };

  mockReservations.push(reservation);
  recalcItemBalances(item);
  return reservation;
}

export function releaseInventoryReservation(reservationId: number, payload?: { reason?: string }): InventoryReservation | undefined {
  const reservation = mockReservations.find((res) => res.id === reservationId);
  if (!reservation || reservation.status !== 'active') {
    return reservation;
  }

  reservation.status = 'released';
  reservation.releasedAt = isoNow();
  if (payload?.reason) {
    reservation.metadata = { ...(reservation.metadata ?? {}), reason: payload.reason };
  }

  const item = mockItems.find((it) => it.id === reservation.inventoryItemId);
  if (item) {
    item.reservedStock = Math.max(item.reservedStock - reservation.quantity, 0);
    const entry = reservation.inventoryLocationId ? ensureItemLocation(item, reservation.inventoryLocationId) : undefined;
    if (entry) {
      entry.stockReserved = Math.max(entry.stockReserved - reservation.quantity, 0);
      entry.stockAvailable = Math.max(entry.stockOnHand - entry.stockReserved, 0);
    }
    recalcItemBalances(item);
  }

  return reservation;
}

export function getInventoryReservations(filters?: InventoryReservationFilters): PaginatedResponse<InventoryReservation> {
  let reservations = [...mockReservations];
  if (filters?.status) {
    reservations = reservations.filter((res) => res.status === filters.status);
  }
  if (filters?.referenceType) {
    reservations = reservations.filter((res) => res.reservedForType === filters.referenceType);
  }
  return paginate(reservations, filters);
}

export function getInventoryReconciliations(filters?: InventoryReconciliationFilters): PaginatedResponse<InventoryReconciliation> {
  let reconciliations = [...mockReconciliations];
  if (filters?.status) {
    reconciliations = reconciliations.filter((rec) => rec.status === filters.status);
  }
  if (filters?.inventoryItemId) {
    reconciliations = reconciliations.filter((rec) => rec.inventoryItemId === filters.inventoryItemId);
  }
  return paginate(reconciliations, filters);
}

export function runInventoryReconciliation(payload?: { source?: string; async?: boolean }): { status: 'queued' | 'completed' } {
  return { status: payload?.async ? 'queued' : 'completed' };
}
