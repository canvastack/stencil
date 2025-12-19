import * as XLSX from 'xlsx';
import { z } from 'zod';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; errors: string[] }>;
  data: ProductImportData[];
}

export interface ProductImportData {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  currency?: string;
  stock_quantity?: number;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  min_order_quantity?: number;
  price_unit?: string;
}

const productImportSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name too long'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().positive('Price must be positive'),
  currency: z.string().optional().default('IDR'),
  stock_quantity: z.number().int().nonnegative('Stock must be non-negative').optional().default(0),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  featured: z.boolean().optional().default(false),
  min_order_quantity: z.number().int().positive().optional().default(1),
  price_unit: z.string().optional().default('pcs'),
});

export class ProductImportService {
  /**
   * Parse and validate import file
   */
  static async parseFile(file: File): Promise<ImportResult> {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      return this.parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      return this.parseExcel(file);
    } else if (fileExtension === 'json') {
      return this.parseJSON(file);
    } else {
      throw new Error('Unsupported file format. Please upload CSV, Excel (.xlsx, .xls), or JSON file.');
    }
  }

  /**
   * Parse Excel file
   */
  private static async parseExcel(file: File): Promise<ImportResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      
      if (!workbook.SheetNames.length) {
        throw new Error('Excel file is empty');
      }
      
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData.length) {
        throw new Error('No data found in Excel file');
      }
      
      return this.validateAndTransform(jsonData);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No data found')) {
        throw error;
      }
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse CSV file
   */
  private static async parseCSV(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      
      if (!text.trim()) {
        throw new Error('CSV file is empty');
      }
      
      const workbook = XLSX.read(text, { type: 'string' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (!jsonData.length) {
        throw new Error('No data found in CSV file');
      }
      
      return this.validateAndTransform(jsonData);
    } catch (error) {
      if (error instanceof Error && error.message.includes('No data found')) {
        throw error;
      }
      throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse JSON file
   */
  private static async parseJSON(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      if (!Array.isArray(jsonData)) {
        throw new Error('JSON file must contain an array of products');
      }
      
      if (jsonData.length === 0) {
        throw new Error('JSON array is empty');
      }
      
      return this.validateAndTransform(jsonData);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      if (error instanceof Error && error.message.includes('array')) {
        throw error;
      }
      throw new Error(`Failed to parse JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate and transform data
   */
  private static validateAndTransform(data: any[]): ImportResult {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      data: [],
    };

    data.forEach((row, index) => {
      try {
        const normalizedRow = this.normalizeKeys(row);
        
        const validated = productImportSchema.parse(normalizedRow);
        
        result.data.push(validated);
        result.success++;
      } catch (error) {
        result.failed++;
        
        if (error instanceof z.ZodError) {
          result.errors.push({
            row: index + 2,
            errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          });
        } else {
          result.errors.push({
            row: index + 2,
            errors: [error instanceof Error ? error.message : 'Unknown validation error'],
          });
        }
      }
    });

    return result;
  }

  /**
   * Normalize object keys (handle case variations and spaces)
   */
  private static normalizeKeys(obj: any): any {
    const normalized: any = {};
    
    Object.keys(obj).forEach(key => {
      let normalizedKey = key
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      const keyMappings: Record<string, string> = {
        'productname': 'name',
        'productslug': 'slug',
        'productdescription': 'description',
        'productcategory': 'category',
        'productprice': 'price',
        'stockquantity': 'stock_quantity',
        'stock': 'stock_quantity',
        'minorder': 'min_order_quantity',
        'minorderqty': 'min_order_quantity',
        'priceperunit': 'price_unit',
        'unit': 'price_unit',
      };
      
      if (keyMappings[normalizedKey]) {
        normalizedKey = keyMappings[normalizedKey];
      }
      
      let value = obj[key];
      
      if (normalizedKey === 'price' || normalizedKey === 'stock_quantity' || normalizedKey === 'min_order_quantity') {
        value = Number(value);
      }
      
      if (normalizedKey === 'featured') {
        if (value === 'Yes' || value === 'yes' || value === 'TRUE' || value === 'true' || value === '1' || value === 1) {
          value = true;
        } else if (value === 'No' || value === 'no' || value === 'FALSE' || value === 'false' || value === '0' || value === 0) {
          value = false;
        } else {
          value = Boolean(value);
        }
      }
      
      normalized[normalizedKey] = value;
    });
    
    return normalized;
  }

  /**
   * Generate Excel template file
   */
  static generateTemplate(): void {
    const template = [
      {
        'Name': 'Example Product Name',
        'Slug': 'example-product-slug',
        'Description': 'This is a detailed product description with at least 10 characters',
        'Category': 'etching',
        'Price': 99.99,
        'Currency': 'IDR',
        'Stock Quantity': 100,
        'Status': 'published',
        'Featured': 'No',
        'Min Order Quantity': 1,
        'Price Unit': 'pcs',
      },
      {
        'Name': 'Custom Etching Plate',
        'Slug': 'custom-etching-plate',
        'Description': 'High-quality custom etching plate made from premium materials',
        'Category': 'custom',
        'Price': 250000,
        'Currency': 'IDR',
        'Stock Quantity': 50,
        'Status': 'published',
        'Featured': 'Yes',
        'Min Order Quantity': 5,
        'Price Unit': 'pcs',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    
    const columnWidths = [
      { wch: 25 },
      { wch: 25 },
      { wch: 50 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 12 },
    ];
    worksheet['!cols'] = columnWidths;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    XLSX.writeFile(workbook, 'product-import-template.xlsx');
  }

  /**
   * Get expected columns info
   */
  static getExpectedColumns(): Array<{ name: string; required: boolean; description: string }> {
    return [
      { name: 'Name', required: true, description: 'Product name (3-255 characters)' },
      { name: 'Slug', required: true, description: 'URL-friendly identifier (lowercase, numbers, hyphens only)' },
      { name: 'Description', required: true, description: 'Product description (min. 10 characters)' },
      { name: 'Category', required: true, description: 'Product category' },
      { name: 'Price', required: true, description: 'Product price (positive number)' },
      { name: 'Currency', required: false, description: 'Currency code (default: IDR)' },
      { name: 'Stock Quantity', required: false, description: 'Available stock (default: 0)' },
      { name: 'Status', required: false, description: 'draft, published, or archived (default: draft)' },
      { name: 'Featured', required: false, description: 'Yes/No (default: No)' },
      { name: 'Min Order Quantity', required: false, description: 'Minimum order quantity (default: 1)' },
      { name: 'Price Unit', required: false, description: 'Unit of measurement (default: pcs)' },
    ];
  }
}
