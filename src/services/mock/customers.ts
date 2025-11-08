import { Customer, CustomerFilters, CustomerFormData, CustomerType, CustomerStatus } from '@/types/customer';

let mockCustomers: Customer[] = [];

export function getCustomers(filters?: CustomerFilters): Customer[] {
  let filtered = [...mockCustomers];

  if (!filters) return filtered;

  if (filters.customerType) {
    filtered = filtered.filter(c => c.customerType === filters.customerType);
  }

  if (filters.status) {
    filtered = filtered.filter(c => c.status === filters.status);
  }

  if (filters.city) {
    filtered = filtered.filter(c => c.city === filters.city);
  }

  if (filters.province) {
    filtered = filtered.filter(c => c.province === filters.province);
  }

  if (filters.minOrders !== undefined) {
    filtered = filtered.filter(c => c.totalOrders >= filters.minOrders!);
  }

  if (filters.minSpent !== undefined) {
    filtered = filtered.filter(c => c.totalSpent >= filters.minSpent!);
  }

  if (filters.dateFrom) {
    filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(filters.dateFrom!));
  }

  if (filters.dateTo) {
    filtered = filtered.filter(c => new Date(c.createdAt) <= new Date(filters.dateTo!));
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.phone.includes(filters.search!) ||
      (c.company && c.company.toLowerCase().includes(searchLower))
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

export function getCustomerById(id: string): Customer | undefined {
  return mockCustomers.find(c => c.id === id);
}

export function getCustomerByEmail(email: string): Customer | undefined {
  return mockCustomers.find(c => c.email === email);
}

export function createCustomer(data: CustomerFormData): Customer {
  const newCustomer: Customer = {
    id: `cust-${Date.now()}`,
    name: data.name,
    email: data.email,
    phone: data.phone,
    company: data.company,
    customerType: data.customerType,
    status: data.status || 'active',
    location: data.location,
    address: data.address,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    totalOrders: 0,
    totalSpent: 0,
    notes: data.notes,
    taxId: data.taxId,
    businessLicense: data.businessLicense,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockCustomers.push(newCustomer);
  return newCustomer;
}

export function updateCustomer(id: string, data: Partial<Customer>): Customer {
  const index = mockCustomers.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error(`Customer with id ${id} not found`);
  }
  
  const updatedCustomer: Customer = {
    ...mockCustomers[index],
    ...data,
    id: mockCustomers[index].id,
    updatedAt: new Date().toISOString(),
  };
  
  mockCustomers[index] = updatedCustomer;
  return updatedCustomer;
}

export function updateCustomerStatus(id: string, status: CustomerStatus): Customer {
  return updateCustomer(id, { status });
}

export function deleteCustomer(id: string): boolean {
  const index = mockCustomers.findIndex(c => c.id === id);
  if (index === -1) {
    return false;
  }
  
  mockCustomers.splice(index, 1);
  return true;
}

export function getActiveCustomers(): Customer[] {
  return mockCustomers.filter(c => c.status === 'active');
}

export function getTopCustomers(limit = 10): Customer[] {
  return mockCustomers
    .filter(c => c.status === 'active')
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

export function resetCustomers(): void {
  mockCustomers = [];
}
