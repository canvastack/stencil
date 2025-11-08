import { Vendor, VendorFilters, VendorFormData, VendorStatus } from '@/types/vendor';
import vendorsData from './data/vendors.json';

let mockVendors: Vendor[] = [...vendorsData];

export function getVendors(filters?: VendorFilters): Vendor[] {
  let filtered = [...mockVendors];

  if (!filters) return filtered;

  if (filters.category) {
    filtered = filtered.filter(v => v.category === filters.category);
  }

  if (filters.status) {
    filtered = filtered.filter(v => v.status === filters.status);
  }

  if (filters.city) {
    filtered = filtered.filter(v => v.location?.city === filters.city);
  }

  if (filters.province) {
    filtered = filtered.filter(v => v.location?.province === filters.province);
  }

  if (filters.minRating !== undefined) {
    filtered = filtered.filter(v => v.rating >= filters.minRating!);
  }

  if (filters.specializations && filters.specializations.length > 0) {
    filtered = filtered.filter(v => 
      v.specializations && v.specializations.some(spec => 
        filters.specializations!.includes(spec)
      )
    );
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(v => 
      v.name.toLowerCase().includes(searchLower) ||
      v.code.toLowerCase().includes(searchLower) ||
      v.email.toLowerCase().includes(searchLower) ||
      v.contactPerson.toLowerCase().includes(searchLower)
    );
  }

  if (filters.offset !== undefined) {
    filtered = filtered.slice(filters.offset);
  }

  if (filters.limit !== undefined) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function getVendorById(id: string): Vendor | undefined {
  return mockVendors.find(v => v.id === id);
}

export function getVendorByCode(code: string): Vendor | undefined {
  return mockVendors.find(v => v.code === code);
}

export function createVendor(data: VendorFormData): Vendor {
  const newVendor: Vendor = {
    id: `vend-${Date.now()}`,
    name: data.name,
    code: data.code,
    email: data.email,
    phone: data.phone,
    contactPerson: data.contactPerson,
    category: data.category,
    status: data.status || 'active',
    rating: 0,
    totalOrders: 0,
    location: data.location,
    address: data.address,
    notes: data.notes || '',
    paymentTerms: data.paymentTerms,
    taxId: data.taxId,
    bankAccount: data.bankAccount,
    bankName: data.bankName,
    specializations: data.specializations,
    leadTime: data.leadTime,
    minimumOrder: data.minimumOrder,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockVendors.push(newVendor);
  return newVendor;
}

export function updateVendor(id: string, data: Partial<Vendor>): Vendor {
  const index = mockVendors.findIndex(v => v.id === id);
  if (index === -1) {
    throw new Error(`Vendor with id ${id} not found`);
  }
  
  const updatedVendor: Vendor = {
    ...mockVendors[index],
    ...data,
    id: mockVendors[index].id,
    updatedAt: new Date().toISOString(),
  };
  
  mockVendors[index] = updatedVendor;
  return updatedVendor;
}

export function updateVendorStatus(id: string, status: VendorStatus): Vendor {
  return updateVendor(id, { status });
}

export function updateVendorRating(id: string, rating: number): Vendor {
  if (rating < 0 || rating > 5) {
    throw new Error('Rating must be between 0 and 5');
  }
  return updateVendor(id, { rating });
}

export function deleteVendor(id: string): boolean {
  const index = mockVendors.findIndex(v => v.id === id);
  if (index === -1) {
    return false;
  }
  
  mockVendors.splice(index, 1);
  return true;
}

export function getActiveVendors(): Vendor[] {
  return mockVendors.filter(v => v.status === 'active');
}

export function getTopVendors(limit = 10): Vendor[] {
  return mockVendors
    .filter(v => v.status === 'active')
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function getVendorsBySpecialization(specialization: string): Vendor[] {
  return mockVendors.filter(v => 
    v.status === 'active' && 
    v.specializations && 
    v.specializations.includes(specialization)
  );
}

export function resetVendors(): void {
  mockVendors = [];
}
