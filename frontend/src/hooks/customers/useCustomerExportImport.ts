import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { CustomerExportService, type ExportFormat } from '@/services/export/customerExportService';
import { CustomerImportService, type ImportResult } from '@/services/import/customerImportService';
import type { Customer } from '@/types/customer';

export interface UseCustomerExportImportProps {
  customers: Customer[];
  selectedCustomers?: Set<string>;
  onImportSuccess?: () => void;
}

export interface UseCustomerExportImportReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleExport: (format: ExportFormat, selectedOnly?: boolean) => Promise<void>;
  handleImportClick: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<ImportResult | null>;
  handleImportConfirm: (importResult: ImportResult | null) => Promise<void>;
  handleDownloadTemplate: () => void;
  handleCancelImport: () => void;
}

export function useCustomerExportImport({
  customers,
  selectedCustomers,
  onImportSuccess,
}: UseCustomerExportImportProps): UseCustomerExportImportReturn {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async (format: ExportFormat, selectedOnly = false) => {
    try {
      let customersToExport = customers;
      
      if (selectedOnly && selectedCustomers && selectedCustomers.size > 0) {
        customersToExport = customers.filter(customer => selectedCustomers.has(customer.id));
      }
      
      if (customersToExport.length === 0) {
        toast.warning('No customers to export');
        return;
      }
      
      CustomerExportService.export(customersToExport, { format, selectedOnly });
      
      const count = selectedOnly ? selectedCustomers?.size || 0 : customers.length;
      toast.success(`Successfully exported ${count} customers as ${format.toUpperCase()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export customers';
      toast.error(message);
      console.error('Customer export failed', error);
    }
  }, [customers, selectedCustomers]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>): Promise<ImportResult | null> => {
    const file = event.target.files?.[0];
    if (!file) {
      return null;
    }
    
    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/json'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error('Please select a CSV or JSON file');
      return null;
    }
    
    try {
      const result = await CustomerImportService.parseFile(file);
      
      if (!result.success) {
        toast.error(`Import failed: ${result.errors.join(', ')}`);
        return null;
      }
      
      if (result.errors.length > 0) {
        toast.warning(`Import completed with ${result.errors.length} warnings`);
      }
      
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      toast.error(message);
      console.error('File parsing failed', error);
      return null;
    }
  }, []);

  const handleImportConfirm = useCallback(async (importResult: ImportResult | null) => {
    if (!importResult) {
      return;
    }
    
    try {
      await CustomerImportService.importCustomers(importResult);
      toast.success(`Successfully imported ${importResult.validRows} customers`);
      onImportSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import customers';
      toast.error(message);
      console.error('Customer import failed', error);
    }
  }, [onImportSuccess]);

  const handleDownloadTemplate = useCallback(() => {
    CustomerExportService.downloadTemplate();
    toast.info('Customer import template downloaded');
  }, []);

  const handleCancelImport = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    fileInputRef,
    handleExport,
    handleImportClick,
    handleFileSelect,
    handleImportConfirm,
    handleDownloadTemplate,
    handleCancelImport,
  };
}