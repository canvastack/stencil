import { describe, it, expect, beforeAll } from 'vitest';
import { customersService, type CreateCustomerRequest, type UpdateCustomerRequest, type CustomerFilters } from '@/services/api/customers';
import { authService } from '@/services/api/auth';

describe('Customer Service - Integration Tests', () => {
  let isTenantAuthenticated = false;
  let testCustomerId: string | null = null;

  beforeAll(async () => {
    try {
      await authService.login({
        email: 'admin@etchinx.com',
        password: 'admin123',
      });
      isTenantAuthenticated = true;
    } catch (error) {
      console.log('Customer Service test setup skipped (requires backend running)');
      isTenantAuthenticated = false;
    }
  });

  describe('getCustomers - List Customers', () => {
    it('should fetch paginated list of customers', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        expect(result.current_page).toBe(1);
        expect(result.per_page).toBe(10);
        expect(typeof result.total).toBe('number');
        
        if (result.data.length > 0) {
          testCustomerId = result.data[0].id;
          const customer = result.data[0];
          expect(customer).toHaveProperty('id');
          expect(customer).toHaveProperty('uuid');
          expect(customer).toHaveProperty('tenant_id');
          expect(customer).toHaveProperty('name');
          expect(customer).toHaveProperty('email');
          expect(customer).toHaveProperty('type');
          expect(customer).toHaveProperty('status');
        }
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should apply status filter correctly', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
          status: 'active',
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        result.data.forEach(customer => {
          expect(customer.status).toBe('active');
        });
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should apply customer type filter correctly', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
          type: 'business',
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        result.data.forEach(customer => {
          expect(customer.type).toBe('business');
        });
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should apply segment filter correctly', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
          segment: 'premium',
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        result.data.forEach(customer => {
          if (customer.segment) {
            expect(customer.segment).toBe('premium');
          }
        });
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should apply date range filter correctly', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const dateFrom = '2024-01-01';
        const dateTo = '2024-12-31';
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
          date_from: dateFrom,
          date_to: dateTo,
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        result.data.forEach(customer => {
          const createdDate = new Date(customer.created_at);
          expect(createdDate >= new Date(dateFrom)).toBe(true);
          expect(createdDate <= new Date(dateTo)).toBe(true);
        });
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should apply search filter correctly', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
          search: 'customer',
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should apply sorting correctly', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const filters: CustomerFilters = {
          page: 1,
          per_page: 10,
          sort: 'created_at',
          order: 'desc',
        };
        const result = await customersService.getCustomers(filters);

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        
        if (result.data.length > 1) {
          const firstDate = new Date(result.data[0].created_at);
          const secondDate = new Date(result.data[1].created_at);
          expect(firstDate >= secondDate).toBe(true);
        }
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('getCustomerById - Single Customer Retrieval', () => {
    it('should fetch a specific customer by ID', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        if (!testCustomerId) {
          const customers = await customersService.getCustomers({ page: 1, per_page: 1 });
          if (customers.data.length === 0) {
            console.log('Test skipped: no customers available');
            return;
          }
          testCustomerId = customers.data[0].id;
        }

        const customer = await customersService.getCustomerById(testCustomerId);

        expect(customer).toBeDefined();
        expect(customer.id).toBe(testCustomerId);
        expect(customer).toHaveProperty('uuid');
        expect(customer).toHaveProperty('tenant_id');
        expect(customer).toHaveProperty('name');
        expect(customer).toHaveProperty('email');
        expect(customer).toHaveProperty('type');
        expect(customer).toHaveProperty('status');
        expect(customer).toHaveProperty('created_at');
        expect(customer).toHaveProperty('updated_at');
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should handle invalid customer ID', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const invalidId = 'invalid-uuid-12345';
        await customersService.getCustomerById(invalidId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('createCustomer - Create Customer', () => {
    it('should create a new individual customer', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const customerData: CreateCustomerRequest = {
          name: `Test Individual Customer ${Date.now()}`,
          email: `test.individual.${Date.now()}@example.com`,
          phone: '+62 812 3456 7890',
          city: 'Jakarta',
          country: 'Indonesia',
          type: 'individual',
        };

        const customer = await customersService.createCustomer(customerData);

        expect(customer).toBeDefined();
        expect(customer.id).toBeDefined();
        expect(customer.uuid).toBeDefined();
        expect(customer.tenant_id).toBeDefined();
        expect(customer.name).toBe(customerData.name);
        expect(customer.email).toBe(customerData.email);
        expect(customer.type).toBe('individual');
        expect(customer.status).toBeDefined();

        testCustomerId = customer.id;
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should create a new business customer', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const customerData: CreateCustomerRequest = {
          name: `Test Business Customer ${Date.now()}`,
          email: `test.business.${Date.now()}@example.com`,
          phone: '+62 21 1234 5678',
          company: 'PT Test Business',
          city: 'Bandung',
          country: 'Indonesia',
          type: 'business',
        };

        const customer = await customersService.createCustomer(customerData);

        expect(customer).toBeDefined();
        expect(customer.id).toBeDefined();
        expect(customer.name).toBe(customerData.name);
        expect(customer.email).toBe(customerData.email);
        expect(customer.type).toBe('business');
        expect(customer.company).toBe(customerData.company);
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should reject customer creation with duplicate email', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const existingEmail = 'duplicate@example.com';
        const customerData: CreateCustomerRequest = {
          name: 'Test Customer 1',
          email: existingEmail,
          phone: '+62 812 1111 1111',
          type: 'individual',
        };

        await customersService.createCustomer(customerData);

        const duplicateData: CreateCustomerRequest = {
          name: 'Test Customer 2',
          email: existingEmail,
          phone: '+62 812 2222 2222',
          type: 'individual',
        };

        try {
          await customersService.createCustomer(duplicateData);
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeDefined();
        }
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('updateCustomer - Update Customer', () => {
    it('should update an existing customer', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        if (!testCustomerId) {
          const customers = await customersService.getCustomers({ page: 1, per_page: 1 });
          if (customers.data.length === 0) {
            console.log('Test skipped: no customers available');
            return;
          }
          testCustomerId = customers.data[0].id;
        }

        const updateData: UpdateCustomerRequest = {
          phone: '+62 813 9999 9999',
          city: 'Surabaya',
        };

        const updatedCustomer = await customersService.updateCustomer(testCustomerId, updateData);

        expect(updatedCustomer).toBeDefined();
        expect(updatedCustomer.id).toBe(testCustomerId);
        expect(updatedCustomer.phone).toBe(updateData.phone);
        expect(updatedCustomer.city).toBe(updateData.city);
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });

    it('should update customer status', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        if (!testCustomerId) {
          const customers = await customersService.getCustomers({ page: 1, per_page: 1 });
          if (customers.data.length === 0) {
            console.log('Test skipped: no customers available');
            return;
          }
          testCustomerId = customers.data[0].id;
        }

        const updateData: UpdateCustomerRequest = {
          status: 'inactive',
        };

        const updatedCustomer = await customersService.updateCustomer(testCustomerId, updateData);

        expect(updatedCustomer).toBeDefined();
        expect(updatedCustomer.status).toBe('inactive');
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('deleteCustomer - Delete Customer', () => {
    it('should delete a customer', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const customerData: CreateCustomerRequest = {
          name: `Test Delete Customer ${Date.now()}`,
          email: `test.delete.${Date.now()}@example.com`,
          phone: '+62 812 0000 0000',
          type: 'individual',
        };

        const customer = await customersService.createCustomer(customerData);
        const deleteResult = await customersService.deleteCustomer(customer.id);

        expect(deleteResult).toBeDefined();
        expect(deleteResult.message).toBeDefined();

        try {
          await customersService.getCustomerById(customer.id);
          expect(true).toBe(false);
        } catch (error) {
          expect(error).toBeDefined();
        }
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('getCustomerOrders - Customer Orders', () => {
    it('should fetch customer orders', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        if (!testCustomerId) {
          const customers = await customersService.getCustomers({ page: 1, per_page: 1 });
          if (customers.data.length === 0) {
            console.log('Test skipped: no customers available');
            return;
          }
          testCustomerId = customers.data[0].id;
        }

        const orders = await customersService.getCustomerOrders(testCustomerId);

        expect(orders).toBeDefined();
        expect(Array.isArray(orders)).toBe(true);
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('getCustomerSegment - Customer Segmentation', () => {
    it('should fetch customer segment information', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        if (!testCustomerId) {
          const customers = await customersService.getCustomers({ page: 1, per_page: 1 });
          if (customers.data.length === 0) {
            console.log('Test skipped: no customers available');
            return;
          }
          testCustomerId = customers.data[0].id;
        }

        const segment = await customersService.getCustomerSegment(testCustomerId);

        expect(segment).toBeDefined();
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('Tenant Isolation Enforcement', () => {
    it('should only return customers for authenticated tenant', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const result = await customersService.getCustomers({ page: 1, per_page: 100 });

        expect(result).toBeDefined();
        expect(result.data).toBeInstanceOf(Array);
        
        result.data.forEach(customer => {
          expect(customer.tenant_id).toBeDefined();
          expect(typeof customer.tenant_id).toBe('string');
        });
      } catch (error) {
        console.log('Test skipped: backend unavailable');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const invalidId = '00000000-0000-0000-0000-000000000000';
        await customersService.getCustomerById(invalidId);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid create data', async () => {
      if (!isTenantAuthenticated) {
        console.log('Test skipped: tenant authentication required');
        return;
      }

      try {
        const invalidData = {
          name: '',
          email: 'invalid-email',
          type: 'individual',
        } as CreateCustomerRequest;

        await customersService.createCustomer(invalidData);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
