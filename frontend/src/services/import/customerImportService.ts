import type { Customer } from '@/types/customer';

export interface ImportResult {
  success: boolean;
  data: Partial<Customer>[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

export class CustomerImportService {
  static async parseFile(file: File): Promise<ImportResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const result = this.parseCSVContent(content);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      if (file.type === 'application/json') {
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  private static parseCSVContent(content: string): ImportResult {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return {
        success: false,
        data: [],
        errors: ['File is empty'],
        totalRows: 0,
        validRows: 0
      };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);
    
    const requiredFields = ['name', 'email'];
    const missingFields = requiredFields.filter(field => 
      !headers.some(h => h.toLowerCase().includes(field.toLowerCase()))
    );

    if (missingFields.length > 0) {
      return {
        success: false,
        data: [],
        errors: [`Missing required fields: ${missingFields.join(', ')}`],
        totalRows: dataLines.length,
        validRows: 0
      };
    }

    const data: Partial<Customer>[] = [];
    const errors: string[] = [];
    let validRows = 0;

    dataLines.forEach((line, index) => {
      try {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length !== headers.length) {
          errors.push(`Row ${index + 2}: Column count mismatch`);
          return;
        }

        const customer: Partial<Customer> = {};
        
        headers.forEach((header, i) => {
          const value = values[i];
          const lowerHeader = header.toLowerCase();
          
          if (lowerHeader.includes('name')) {
            customer.name = value;
          } else if (lowerHeader.includes('email')) {
            customer.email = value;
          } else if (lowerHeader.includes('phone')) {
            customer.phone = value;
          } else if (lowerHeader.includes('company')) {
            customer.company = value;
          } else if (lowerHeader.includes('type')) {
            customer.customerType = value as 'individual' | 'business';
          } else if (lowerHeader.includes('status')) {
            customer.status = value as 'active' | 'inactive' | 'blocked';
          } else if (lowerHeader.includes('city')) {
            customer.city = value;
          }
        });

        // Validate required fields
        if (!customer.name || !customer.email) {
          errors.push(`Row ${index + 2}: Missing required fields (name, email)`);
          return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customer.email)) {
          errors.push(`Row ${index + 2}: Invalid email format`);
          return;
        }

        // Set defaults
        customer.customerType = customer.customerType || 'individual';
        customer.status = customer.status || 'active';
        customer.totalOrders = 0;
        customer.totalSpent = 0;

        data.push(customer);
        validRows++;
      } catch (error) {
        errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    });

    return {
      success: validRows > 0,
      data,
      errors,
      totalRows: dataLines.length,
      validRows
    };
  }

  static async importCustomers(importResult: ImportResult): Promise<void> {
    // Import customers via API
    const { customersService } = await import('@/services/api/customers');
    
    const importPromises = importResult.data.map(async (customerData) => {
      try {
        await customersService.createCustomer({
          name: customerData.name!,
          email: customerData.email!,
          phone: customerData.phone,
          city: customerData.city,
          company: customerData.company,
          type: customerData.customerType || 'individual'
        });
      } catch (error) {
        console.error('Failed to import customer:', customerData.name, error);
        throw error;
      }
    });

    await Promise.all(importPromises);
  }
}