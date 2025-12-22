import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions';
import { ProductExportService, type ExportFormat } from '@/services/export/productExportService';
import { ProductImportService, type ImportResult } from '@/services/import/productImportService';
import type { Product } from '@/types/product';

export interface UseProductExportImportProps {
  products: Product[];
  dispatch: React.Dispatch<any>;
}

export interface UseProductExportImportReturn {
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleExport: (format: ExportFormat) => Promise<void>;
  handleImportClick: () => void;
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImportConfirm: (importResult: ImportResult | null) => Promise<void>;
  handleDownloadTemplate: () => void;
  handleCancelImport: () => void;
}

export function useProductExportImport({
  products,
  dispatch,
}: UseProductExportImportProps): UseProductExportImportReturn {
  const { canAccess } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      dispatch({ type: 'SET_IS_EXPORTING', payload: true });
      
      if (products.length === 0) {
        toast.warning('No products to export');
        return;
      }
      
      ProductExportService.export(products, { format });
      
      toast.success(`Successfully exported ${products.length} products as ${format.toUpperCase()}`);
      dispatch({ type: 'CLOSE_EXPORT_DIALOG' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export products';
      toast.error(message);
      console.error('Product export failed', error);
    } finally {
      dispatch({ type: 'SET_IS_EXPORTING', payload: false });
    }
  }, [products, dispatch]);

  const handleImportClick = useCallback(() => {
    if (!canAccess('products.create')) {
      toast.error('You do not have permission to import products');
      return;
    }
    dispatch({ type: 'OPEN_IMPORT_DIALOG' });
  }, [canAccess, dispatch]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file format. Please upload CSV, Excel, or JSON file.');
      return;
    }
    
    dispatch({ type: 'SET_IMPORT_FILE', payload: file });
    
    try {
      dispatch({ type: 'SET_IS_IMPORTING', payload: true });
      
      const result = await ProductImportService.parseFile(file);
      dispatch({ type: 'SET_IMPORT_RESULT', payload: result });
      
      if (result.failed > 0) {
        toast.warning(`Parsed ${result.success} valid rows, ${result.failed} rows have errors`);
      } else {
        toast.success(`Successfully validated ${result.success} products`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse file';
      toast.error(message);
      console.error('Import parse failed', error);
      
      dispatch({ type: 'SET_IMPORT_FILE', payload: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      dispatch({ type: 'SET_IS_IMPORTING', payload: false });
    }
  }, [dispatch, fileInputRef]);

  const handleImportConfirm = useCallback(async (importResult: ImportResult | null) => {
    if (!importResult || importResult.data.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    try {
      dispatch({ type: 'SET_IS_IMPORTING', payload: true });
      
      toast.info(`This will import ${importResult.data.length} products. Backend integration coming soon.`);
      
      dispatch({ type: 'CLOSE_IMPORT_DIALOG' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import products';
      toast.error(message);
      console.error('Product import failed', error);
    } finally {
      dispatch({ type: 'SET_IS_IMPORTING', payload: false });
    }
  }, [dispatch, fileInputRef]);

  const handleDownloadTemplate = useCallback(() => {
    ProductImportService.generateTemplate();
    toast.success('Import template downloaded');
  }, []);

  const handleCancelImport = useCallback(() => {
    dispatch({ type: 'CLOSE_IMPORT_DIALOG' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [dispatch, fileInputRef]);

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
