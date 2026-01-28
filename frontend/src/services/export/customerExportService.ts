import type { Customer } from '@/types/customer';

export type ExportFormat = 'csv' | 'xlsx' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  selectedOnly?: boolean;
}

export class CustomerExportService {
  static export(customers: Customer[], options: ExportOptions): void {
    const { format } = options;
    
    switch (format) {
      case 'csv':
        this.exportAsCSV(customers);
        break;
      case 'xlsx':
        this.exportAsExcel(customers);
        break;
      case 'json':
        this.exportAsJSON(customers);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private static exportAsCSV(customers: Customer[]): void {
    const headers = [
      'Name',
      'Email', 
      'Phone',
      'Company',
      'Customer Type',
      'Status',
      'City',
      'Total Orders',
      'Total Spent',
      'Created At'
    ];

    const csvContent = [
      headers.join(','),
      ...customers.map(customer => [
        `"${customer.name}"`,
        `"${customer.email}"`,
        `"${customer.phone || ''}"`,
        `"${customer.company || ''}"`,
        `"${customer.customerType}"`,
        `"${customer.status}"`,
        `"${customer.city || ''}"`,
        customer.totalOrders,
        customer.totalSpent,
        `"${customer.createdAt}"`
      ].join(','))
    ].join('\n');

    this.downloadFile(csvContent, 'customers.csv', 'text/csv');
  }

  private static exportAsExcel(customers: Customer[]): void {
    // For now, export as CSV with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    const headers = [
      'Name',
      'Email', 
      'Phone',
      'Company',
      'Customer Type',
      'Status',
      'City',
      'Total Orders',
      'Total Spent',
      'Created At'
    ];

    const csvContent = [
      headers.join('\t'),
      ...customers.map(customer => [
        customer.name,
        customer.email,
        customer.phone || '',
        customer.company || '',
        customer.customerType,
        customer.status,
        customer.city || '',
        customer.totalOrders,
        customer.totalSpent,
        customer.createdAt
      ].join('\t'))
    ].join('\n');

    this.downloadFile(csvContent, 'customers.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }

  private static exportAsJSON(customers: Customer[]): void {
    const jsonContent = JSON.stringify(customers, null, 2);
    this.downloadFile(jsonContent, 'customers.json', 'application/json');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  static downloadTemplate(): void {
    const templateData = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        customerType: 'business',
        status: 'active',
        city: 'Jakarta'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+0987654321',
        company: '',
        customerType: 'individual',
        status: 'active',
        city: 'Surabaya'
      }
    ];

    this.exportAsCSV(templateData as Customer[]);
  }
}