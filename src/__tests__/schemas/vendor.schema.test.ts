import { describe, it, expect } from 'vitest';
import {
  createVendorSchema,
  updateVendorSchema,
  vendorFilterSchema,
} from '@/schemas/vendor.schema';

const validVendorBase = {
  name: 'PT. Vendor Indonesia',
  email: 'vendor@example.com',
  phone: '+62 812 3456 7890',
  contact_person: 'John Doe',
  category: 'Manufacturing',
  status: 'active' as const,
  payment_terms: 'Net 30',
  tax_id: '01.234.567.8-901.000',
};

describe('Vendor Schema Validation', () => {
  describe('createVendorSchema', () => {
    describe('name field', () => {
      it('should validate correct name', () => {
        const result = createVendorSchema.safeParse(validVendorBase);
        
        expect(result.success).toBe(true);
      });

      it('should reject name less than 3 characters', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          name: 'AB',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('minimal 3 karakter');
        }
      });

      it('should reject name more than 100 characters', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          name: 'A'.repeat(101),
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('maksimal 100 karakter');
        }
      });

      it('should reject empty name', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          name: '',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('email field', () => {
      it('should validate correct email', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          email: 'valid.email@example.com',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject invalid email format', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          email: 'invalid-email',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('tidak valid');
        }
      });

      it('should reject email without domain', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          email: 'vendor@',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('code field', () => {
      it('should accept valid vendor code', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          code: 'VEND-001',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept uppercase letters and numbers', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          code: 'ABC123',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject lowercase letters', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          code: 'vend-001',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('huruf besar');
        }
      });

      it('should accept empty string for optional code', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          code: '',
        });
        
        expect(result.success).toBe(true);
      });
    });

    describe('phone field', () => {
      it('should accept valid phone number', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          phone: '+62 812 3456 7890',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept phone with parentheses', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          phone: '(021) 1234-5678',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject phone less than 10 digits', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          phone: '12345',
        });
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('minimal 10');
        }
      });

      it('should reject invalid characters in phone', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          phone: '0812-abc-defg',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('status field', () => {
      it('should accept active status', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          status: 'active',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept all valid statuses', () => {
        const statuses = ['active', 'inactive', 'suspended', 'blacklisted'] as const;
        
        statuses.forEach(status => {
          const result = createVendorSchema.safeParse({
            ...validVendorBase,
            status,
          });
          
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid status', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          status: 'invalid-status',
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('company_size field', () => {
      it('should accept valid company sizes', () => {
        const sizes = ['small', 'medium', 'large'] as const;
        
        sizes.forEach(company_size => {
          const result = createVendorSchema.safeParse({
            ...validVendorBase,
            company_size,
          });
          
          expect(result.success).toBe(true);
        });
      });

      it('should reject invalid company size', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          company_size: 'enterprise',
        });
        
        expect(result.success).toBe(false);
      });

      it('should accept undefined company_size', () => {
        const result = createVendorSchema.safeParse(validVendorBase);
        
        expect(result.success).toBe(true);
      });
    });

    describe('rating field', () => {
      it('should accept rating between 0 and 5', () => {
        [0, 2.5, 5].forEach(rating => {
          const result = createVendorSchema.safeParse({
            ...validVendorBase,
            rating,
          });
          
          expect(result.success).toBe(true);
        });
      });

      it('should reject rating less than 0', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          rating: -1,
        });
        
        expect(result.success).toBe(false);
      });

      it('should reject rating greater than 5', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          rating: 6,
        });
        
        expect(result.success).toBe(false);
      });
    });

    describe('website field', () => {
      it('should accept valid website URL', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          website: 'https://example.com',
        });
        
        expect(result.success).toBe(true);
      });

      it('should accept http URLs', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          website: 'http://example.com',
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject invalid URL format', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          website: 'not-a-url',
        });
        
        expect(result.success).toBe(false);
      });

      it('should accept empty string for optional website', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          website: '',
        });
        
        expect(result.success).toBe(true);
      });
    });

    describe('latitude and longitude fields', () => {
      it('should accept valid coordinates', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          latitude: -6.2088,
          longitude: 106.8456,
        });
        
        expect(result.success).toBe(true);
      });

      it('should reject latitude outside range', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
          latitude: 91,
          longitude: 106.8456,
        });
        
        expect(result.success).toBe(false);
      });

      it('should reject longitude outside range', () => {
        const result = createVendorSchema.safeParse({
          ...validVendorBase,
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
