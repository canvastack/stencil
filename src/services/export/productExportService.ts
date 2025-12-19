import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Product } from '@/types/product';

export type ExportFormat = 'xlsx' | 'csv' | 'json' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeColumns?: string[];
  filename?: string;
}

export interface ExportColumn {
  key: keyof Product | string;
  header: string;
  formatter?: (value: any, product: Product) => string | number;
}

const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: 'uuid', header: 'ID' },
  { key: 'name', header: 'Product Name' },
  { key: 'slug', header: 'Slug' },
  { 
    key: 'category', 
    header: 'Category',
    formatter: (value) => {
      if (!value) return '-';
      if (typeof value === 'object' && value.name) return value.name;
      return String(value);
    }
  },
  { 
    key: 'price', 
    header: 'Price',
    formatter: (value, product) => {
      if (!value) return '0';
      const currency = product.currency || 'IDR';
      return `${currency} ${Number(value).toLocaleString('id-ID')}`;
    }
  },
  { 
    key: 'stock_quantity', 
    header: 'Stock',
    formatter: (value) => value ?? 0
  },
  { 
    key: 'status', 
    header: 'Status',
    formatter: (value) => {
      if (!value) return 'draft';
      return String(value).charAt(0).toUpperCase() + String(value).slice(1);
    }
  },
  { 
    key: 'featured', 
    header: 'Featured',
    formatter: (value) => value ? 'Yes' : 'No'
  },
  { 
    key: 'created_at', 
    header: 'Created At',
    formatter: (value) => {
      if (!value) return '-';
      try {
        return new Date(value).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      } catch {
        return String(value);
      }
    }
  },
];

export class ProductExportService {
  /**
   * Export products to specified format
   */
  static export(
    products: Product[], 
    options: ExportOptions = { format: 'xlsx' }
  ): void {
    const { format, filename } = options;
    
    if (!products || products.length === 0) {
      throw new Error('No products to export');
    }

    const defaultFilename = `products-${new Date().toISOString().split('T')[0]}`;
    const finalFilename = filename || defaultFilename;
    
    switch (format) {
      case 'xlsx':
        this.exportToExcel(products, finalFilename);
        break;
      case 'csv':
        this.exportToCSV(products, finalFilename);
        break;
      case 'json':
        this.exportToJSON(products, finalFilename);
        break;
      case 'pdf':
        this.exportToPDF(products, finalFilename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Prepare data for export with proper formatting
   */
  private static prepareData(products: Product[]): Record<string, any>[] {
    return products.map(product => {
      const row: Record<string, any> = {};
      
      DEFAULT_COLUMNS.forEach(col => {
        const value = this.getNestedValue(product, col.key);
        row[col.header] = col.formatter 
          ? col.formatter(value, product)
          : this.formatCellValue(value);
      });
      
      return row;
    });
  }

  /**
   * Get nested property value from object
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Format cell value for export
   */
  private static formatCellValue(value: any): any {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  }

  /**
   * Export to Excel format (.xlsx)
   */
  private static exportToExcel(products: Product[], filename: string): void {
    const data = this.prepareData(products);
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Auto-size columns
    const columnWidths = DEFAULT_COLUMNS.map(col => ({
      wch: Math.max(
        col.header.length,
        ...data.map(row => String(row[col.header] || '').length)
      ) + 2
    }));
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    const blob = new Blob(
      [excelBuffer], 
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );
    
    saveAs(blob, `${filename}.xlsx`);
  }

  /**
   * Export to CSV format (.csv)
   */
  private static exportToCSV(products: Product[], filename: string): void {
    const data = this.prepareData(products);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Add BOM for UTF-8 encoding (Excel compatibility)
    const BOM = '\uFEFF';
    const blob = new Blob(
      [BOM + csv], 
      { type: 'text/csv;charset=utf-8;' }
    );
    
    saveAs(blob, `${filename}.csv`);
  }

  /**
   * Export to JSON format (.json)
   */
  private static exportToJSON(products: Product[], filename: string): void {
    const json = JSON.stringify(products, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    
    saveAs(blob, `${filename}.json`);
  }

  /**
   * Export to PDF format (.pdf)
   */
  private static exportToPDF(products: Product[], filename: string): void {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Title
    doc.setFontSize(18);
    doc.text('Product Catalog', 14, 15);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated on ${new Date().toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      14,
      22
    );
    doc.text(`Total Products: ${products.length}`, 14, 27);

    // Prepare table data
    const tableData = this.prepareData(products);
    const headers = DEFAULT_COLUMNS.map(col => col.header);
    const rows = tableData.map(row => 
      DEFAULT_COLUMNS.map(col => String(row[col.header] || ''))
    );

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 32,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // Blue-500
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Gray-50
      },
      margin: { top: 32, right: 14, bottom: 14, left: 14 },
      columnStyles: {
        0: { cellWidth: 30 }, // ID
        1: { cellWidth: 50 }, // Name
        2: { cellWidth: 35 }, // Slug
        3: { cellWidth: 25 }, // Category
        4: { cellWidth: 30 }, // Price
        5: { cellWidth: 15 }, // Stock
        6: { cellWidth: 20 }, // Status
        7: { cellWidth: 20 }, // Featured
        8: { cellWidth: 30 }, // Created At
      },
      didDrawPage: (data) => {
        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      },
    });

    // Save PDF
    doc.save(`${filename}.pdf`);
  }

  /**
   * Get export format metadata
   */
  static getFormatInfo(format: ExportFormat): {
    label: string;
    extension: string;
    description: string;
    recommended: boolean;
  } {
    const formats = {
      xlsx: {
        label: 'Excel',
        extension: '.xlsx',
        description: 'Excel spreadsheet format with formatting',
        recommended: true,
      },
      csv: {
        label: 'CSV',
        extension: '.csv',
        description: 'Comma-separated values (universal compatibility)',
        recommended: false,
      },
      json: {
        label: 'JSON',
        extension: '.json',
        description: 'JSON format for developers and APIs',
        recommended: false,
      },
      pdf: {
        label: 'PDF',
        extension: '.pdf',
        description: 'PDF document for printing and sharing',
        recommended: false,
      },
    };

    return formats[format] || formats.xlsx;
  }
}
