import { z } from 'zod';

export const createVendorSchema = z.object({
  name: z.string()
    .min(3, 'Nama vendor minimal 3 karakter')
    .max(100, 'Nama vendor maksimal 100 karakter'),
  
  code: z.string()
    .min(2, 'Kode vendor minimal 2 karakter')
    .max(20, 'Kode vendor maksimal 20 karakter')
    .regex(/^[A-Z0-9-]+$/, 'Kode hanya boleh huruf besar, angka, dan tanda strip')
    .optional()
    .or(z.literal('')),
  
  company: z.string()
    .min(3, 'Nama perusahaan minimal 3 karakter')
    .max(100, 'Nama perusahaan maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Format email tidak valid')
    .max(100, 'Email maksimal 100 karakter'),
  
  phone: z.string()
    .min(10, 'Nomor telepon minimal 10 digit')
    .max(50, 'Nomor telepon maksimal 50 digit')
    .regex(/^[0-9+\-\s()]+$/, 'Format nomor telepon tidak valid'),
  
  contact_person: z.string()
    .min(3, 'Nama kontak minimal 3 karakter')
    .max(255, 'Nama kontak maksimal 255 karakter'),
  
  address: z.string()
    .min(10, 'Alamat minimal 10 karakter')
    .max(500, 'Alamat maksimal 500 karakter')
    .optional()
    .or(z.literal('')),
  
  city: z.string()
    .min(2, 'Nama kota minimal 2 karakter')
    .max(100, 'Nama kota maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  industry: z.string()
    .min(2, 'Industri minimal 2 karakter')
    .max(100, 'Industri maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  category: z.string()
    .min(2, 'Kategori minimal 2 karakter')
    .max(100, 'Kategori maksimal 100 karakter'),
  
  status: z.enum(['active', 'inactive', 'suspended', 'blacklisted'], {
    errorMap: () => ({ message: 'Status tidak valid' }),
  }),
  
  company_size: z.enum(['small', 'medium', 'large'], {
    errorMap: () => ({ message: 'Ukuran perusahaan tidak valid' }),
  }).optional(),
  
  rating: z.number()
    .min(0, 'Rating minimal 0')
    .max(5, 'Rating maksimal 5')
    .optional(),
  
  total_orders: z.number()
    .int('Total orders harus bilangan bulat')
    .min(0, 'Total orders tidak boleh negatif')
    .optional(),
  
  payment_terms: z.string()
    .min(1, 'Payment terms wajib diisi')
    .max(100, 'Payment terms maksimal 100 karakter'),
  
  tax_id: z.string()
    .min(1, 'Tax ID / NPWP wajib diisi')
    .max(100, 'Tax ID maksimal 100 karakter'),
  
  bank_account: z.string()
    .max(100, 'Nomor rekening maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  bank_name: z.string()
    .max(100, 'Nama bank maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  province: z.string()
    .max(100, 'Provinsi maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  website: z.string()
    .url('Format website tidak valid')
    .max(200, 'Website maksimal 200 karakter')
    .optional()
    .or(z.literal('')),
  
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    city: z.string().optional(),
    district: z.string().optional(),
    subdistrict: z.string().optional(),
    village: z.string().optional(),
    municipality: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  
  latitude: z.number()
    .min(-90, 'Latitude harus antara -90 dan 90')
    .max(90, 'Latitude harus antara -90 dan 90')
    .optional(),
  
  longitude: z.number()
    .min(-180, 'Longitude harus antara -180 dan 180')
    .max(180, 'Longitude harus antara -180 dan 180')
    .optional(),
  
  country: z.string()
    .max(100, 'Negara maksimal 100 karakter')
    .optional()
    .or(z.literal('')),
  
  notes: z.string()
    .max(1000, 'Catatan maksimal 1000 karakter')
    .optional()
    .or(z.literal('')),
});

export const updateVendorSchema = createVendorSchema.extend({
  total_value: z.number()
    .int('Total value harus bilangan bulat')
    .min(0, 'Total value tidak boleh negatif')
    .optional(),
}).partial();

export type CreateVendorFormData = z.infer<typeof createVendorSchema>;
export type UpdateVendorFormData = z.infer<typeof updateVendorSchema>;

export const vendorFilterSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'active', 'inactive', 'suspended', 'blacklisted']).optional(),
  rating: z.enum(['all', '5', '4', '3', '2', '1']).optional(),
  company_size: z.enum(['all', 'small', 'medium', 'large']).optional(),
});

export type VendorFilterData = z.infer<typeof vendorFilterSchema>;

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().nullable(),
  company: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  contact_person: z.string().nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  industry: z.string().nullable(),
  status: z.enum(['active', 'inactive', 'suspended', 'blacklisted']),
  company_size: z.enum(['small', 'medium', 'large']).nullable(),
  rating: z.number().nullable(),
  total_orders: z.number().nullable(),
  payment_terms: z.string().nullable(),
  tax_id: z.string().nullable(),
  bank_account: z.string().nullable(),
  bank_name: z.string().nullable(),
  website: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  province: z.string().nullable(),
  country: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});
