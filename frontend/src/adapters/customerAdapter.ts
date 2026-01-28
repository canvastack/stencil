import type { Customer as ApiCustomer } from '@/services/api/customers';
import type { Customer as TypeCustomer } from '@/types/customer';

export function adaptApiCustomerToTypeCustomer(apiCustomer: ApiCustomer): TypeCustomer {
  return {
    id: apiCustomer.uuid || apiCustomer.id, // Use UUID as primary ID
    name: apiCustomer.name,
    email: apiCustomer.email,
    phone: apiCustomer.phone || '',
    company: apiCustomer.company,
    customerType: (apiCustomer.customerType || apiCustomer.type) as 'individual' | 'business',
    status: apiCustomer.status === 'suspended' ? 'blocked' : apiCustomer.status as 'active' | 'inactive',
    city: apiCustomer.address?.city || apiCustomer.city,
    totalOrders: apiCustomer.stats?.totalOrders || apiCustomer.total_orders || 0,
    totalSpent: apiCustomer.stats?.totalSpent || apiCustomer.total_spent || apiCustomer.lifetime_value || 0,
    createdAt: apiCustomer.timestamps?.createdAt || apiCustomer.created_at,
    updatedAt: apiCustomer.timestamps?.updatedAt || apiCustomer.updated_at,
    notes: apiCustomer.notes,
    taxId: apiCustomer.business?.taxId,
  };
}

export function adaptApiCustomersToTypeCustomers(apiCustomers: ApiCustomer[]): TypeCustomer[] {
  return apiCustomers.map(adaptApiCustomerToTypeCustomer);
}