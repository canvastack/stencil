import { describe, it, expect } from 'vitest';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorFilterSchema,
} from '@/schemas/vendor.schema';

describe('Vendor Schema Validation', () => {
  describe('createVendorSchema', () => {
    describe('name field', () => {
      it('should validate correct name', () => {
        const result = createVendorSchema.safeParse({
          name: 'PT. Vendor Indonesia',
          email: 'vendor@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject name less than 3 characters', () => {
        const result = createVendorSchema.safeParse({
          name: 'AB',
          email: 'vendor@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('minimal 3 karakter');
        }
      });

      it('should reject name more than 100 characters', () => {
        const result = createVendorSchema.safeParse({
          name: 'A'.repeat(101),
          email: 'vendor@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('maksimal 100 karakter');
        }
      });

      it('should reject empty name', () => {
        const result = createVendorSchema.safeParse({
          name: '',
          email: 'vendor@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('email field', () => {
      it('should validate correct email', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'valid.email@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject invalid email format', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'invalid-email',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('tidak valid');
        }
      });

      it('should reject email without domain', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('code field', () => {
      it('should accept valid vendor code', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          code: 'VEND-001',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept uppercase letters and numbers', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          code: 'ABC123',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject lowercase letters', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          code: 'vend-001',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('huruf besar');
        }
      });

      it('should accept empty string for optional code', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          code: '',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });
    });

    describe('phone field', () => {
      it('should accept valid phone number', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          phone: '+62 812 3456 7890',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept phone with parentheses', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          phone: '(021) 1234-5678',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject phone less than 10 digits', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          phone: '12345',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('minimal 10');
        }
      });

      it('should reject invalid characters in phone', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          phone: '0812-abc-defg',
          status: 'active',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('status field', () => {
      it('should accept active status', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept all valid statuses', () => {
        const statuses = ['active', 'inactive', 'suspended', 'blacklisted'];
        
        statuses.forEach(status => {
          const result = createVendorSchema.safeParse({
            name: 'Vendor Name',
            email: 'vendor@example.com',
            status,
          });
          
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid status', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'invalid-status',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('company_size field', () => {
      it('should accept valid company sizes', () => {
        const sizes = ['small', 'medium', 'large'];
        
        sizes.forEach(company_size => {
          const result = createVendorSchema.safeParse({
            name: 'Vendor Name',
            email: 'vendor@example.com',
            status: 'active',
            company_size,
          });
          
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid company size', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          company_size: 'enterprise',
        });
        
        expect(result.success).toBe(false);
      });

      it('should accept undefined company_size', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });
    });

    describe('rating field', () => {
      it('should accept rating between 0 and 5', () => {
        [0, 2.5, 5].forEach(rating => {
          const result = createVendorSchema.safeParse({
            name: 'Vendor Name',
            email: 'vendor@example.com',
            status: 'active',
            rating,
          });
          
          expect(result.success).toBe(true);
        });
      });

      it('should reject rating less than 0', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          rating: -1,
        });
        
        expect(result.success).toBe(false);
      });

      it('should reject rating greater than 5', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          rating: 6,
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('website field', () => {
      it('should accept valid website URL', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          website: 'https://example.com',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept http URLs', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          website: 'http://example.com',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject invalid URL format', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          website: 'not-a-url',
        });
        
        expect(result.success).toBe(false);
      });

      it('should accept empty string for optional website', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          website: '',
        });
        
        expect(result.success).toBe(true);
      });
    });

    describe('latitude and longitude fields', () => {
      it('should accept valid coordinates', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          latitude: -6.2088,
          longitude: 106.8456,
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject latitude outside range', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          latitude: 91,
          longitude: 106.8456,
        });
        
        expect(result.success).toBe(false);
      });

      it('should reject longitude outside range', () => {
        const result = createVendorSchema.safeParse({
          name: 'Vendor Name',
          email: 'vendor@example.com',
          status: 'active',
          latitude: -6.2088,
          longitude: 181,
        });
        
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateVendorSchema', () => {
    it('should allow partial updates', () => {
      const result = updateVendorSchema.safeParse({
        name: 'Updated Name',
      });
      
      expect(result.success).toBe(true);
    });

    it('should allow updating only email', () => {
      const result = updateVendorSchema.safeParse({
        email: 'new-email@example.com',
      });
      
      expect(result.success).toBe(true);
    });

    it('should still validate field constraints', () => {
      const result = updateVendorSchema.safeParse({
        email: 'invalid-email',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('vendorFilterSchema', () => {
    it('should accept valid filter data', () => {
      const result = vendorFilterSchema.safeParse({
        search: 'vendor name',
        status: 'active',
        rating: '5',
        company_size: 'large',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept partial filters', () => {
      const result = vendorFilterSchema.safeParse({
        search: 'vendor',
      });
      
      expect(result.success).toBe(true);
    });

    it('should accept "all" values', () => {
      const result = vendorFilterSchema.safeParse({
        status: 'all',
        rating: 'all',
        company_size: 'all',
      });
      
      expect(result.success).toBe(true);
    });
  });
});
