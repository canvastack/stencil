import { z } from 'zod';

const baseProductSchema = z.object({
  name: z.string()
    .min(3, 'Product name must be at least 3 characters')
    .max(255, 'Product name must be less than 255 characters'),
  
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters')
    .max(255, 'Slug must be less than 255 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  
  longDescription: z.string()
    .max(5000, 'Long description must be less than 5000 characters')
    .optional()
    .or(z.literal('')),
  
  images: z.array(z.string().url('Invalid image URL'))
    .min(1, 'At least one image is required')
    .max(10, 'Maximum 10 images allowed'),
  
  category: z.string()
    .min(1, 'Category is required'),
  
  subcategory: z.string()
    .optional()
    .or(z.literal('')),
  
  tags: z.array(z.string())
    .optional(),
  
  material: z.string()
    .min(1, 'Material is required')
    .max(255, 'Material must be less than 255 characters'),
  
  price: z.number()
    .positive('Price must be positive')
    .max(999999999, 'Price is too high'),
  
  currency: z.string()
    .length(3, 'Currency must be 3 characters (e.g., USD, IDR)')
    .optional()
    .or(z.literal('')),
  
  priceUnit: z.string()
    .max(50, 'Price unit must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  
  minOrder: z.number()
    .int('Minimum order must be a whole number')
    .positive('Minimum order must be positive')
    .optional(),
  
  maxOrder: z.number()
    .int('Maximum order must be a whole number')
    .positive('Maximum order must be positive')
    .optional(),
  
  leadTime: z.string()
    .max(100, 'Lead time must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  
  availability: z.enum(['in-stock', 'out-of-stock', 'pre-order'], {
    errorMap: () => ({ message: 'Invalid availability status' }),
  }).optional(),
  
  features: z.array(z.string())
    .max(20, 'Maximum 20 features allowed')
    .optional(),
  
  specifications: z.record(z.any())
    .optional(),
  
  customizationOptions: z.array(z.object({
    name: z.string().min(1, 'Option name is required'),
    type: z.enum(['text', 'select', 'color', 'image']),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  }))
    .max(10, 'Maximum 10 customization options allowed')
    .optional(),
  
  seoTitle: z.string()
    .max(60, 'SEO title must be less than 60 characters')
    .optional()
    .or(z.literal('')),
  
  seoDescription: z.string()
    .max(160, 'SEO description must be less than 160 characters')
    .optional()
    .or(z.literal('')),
  
  seoKeywords: z.array(z.string())
    .max(10, 'Maximum 10 SEO keywords allowed')
    .optional(),
  
  status: z.enum(['draft', 'published', 'archived'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }).optional(),
  
  stockQuantity: z.number()
    .int('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .max(999999, 'Stock quantity exceeds maximum allowed value')
    .optional()
    .or(z.literal(null)),
});

export const createProductSchema = baseProductSchema.refine(
  (data) => {
    if (data.minOrder && data.maxOrder) {
      return data.maxOrder >= data.minOrder;
    }
    return true;
  },
  {
    message: 'Maximum order must be greater than or equal to minimum order',
    path: ['maxOrder'],
  }
);

export const updateProductSchema = baseProductSchema.partial().refine(
  (data) => {
    if (data.minOrder && data.maxOrder) {
      return data.maxOrder >= data.minOrder;
    }
    return true;
  },
  {
    message: 'Maximum order must be greater than or equal to minimum order',
    path: ['maxOrder'],
  }
);

export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;

export const productFilterSchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  featured: z.boolean().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  inStock: z.boolean().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
});

export type ProductFilterData = z.infer<typeof productFilterSchema>;
