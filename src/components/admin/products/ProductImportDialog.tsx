import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import type { ImportResult } from '@/services/import/productImportService';

export interface ProductImportDialogProps {
  open: boolean;
  isImporting: boolean;
  file: File | null;
  result: ImportResult | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImportConfirm: () => void;
  onDownloadTemplate: () => void;
  onCancel: () => void;
}

export function ProductImportDialog({
  open,
  isImporting,
  file,
  result,
  fileInputRef,
  onFileSelect,
  onImportConfirm,
  onDownloadTemplate,
  onCancel,
}: ProductImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onCancel();
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Products</DialogTitle>
          <DialogDescription>
            Upload a CSV, Excel, or JSON file to bulk import products
          </DialogDescription>
        </DialogHeader>
        
        {!result ? (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={onFileSelect}
                className="hidden"
                id="import-file-input"
                disabled={isImporting}
                aria-label="Upload product import file (CSV, Excel, or JSON format)"
              />
              <label
                htmlFor="import-file-input"
                className={`cursor-pointer block ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">
                    {isImporting ? 'Processing file...' : 'Click to upload file'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: CSV, Excel (.xlsx, .xls), JSON
                  </p>
                </div>
                {isImporting && (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mt-3" />
                )}
              </label>
            </div>

            <div className="flex justify-center">
              <Button
                variant="link"
                size="sm"
                onClick={onDownloadTemplate}
                disabled={isImporting}
              >
                <Download className="w-3 h-3 mr-1" />
                Download Import Template
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Import Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Required columns: Name, Slug, Description, Category, Price</li>
                    <li>Product slugs must be unique and URL-friendly (lowercase, numbers, hyphens)</li>
                    <li>Prices must be positive numbers</li>
                    <li>Status: draft, published, or archived (optional, default: draft)</li>
                    <li>Featured: Yes/No (optional, default: No)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {file && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.success}</p>
                  <p className="text-sm text-muted-foreground">Valid Products</p>
                </div>
              </Card>
              <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{result.failed}</p>
                  <p className="text-sm text-muted-foreground">Invalid Rows</p>
                </div>
              </Card>
            </div>

            {result.errors.length > 0 && (
              <Card className="p-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Validation Errors
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-xs bg-white dark:bg-gray-900 p-2 rounded">
                        <p className="font-medium text-yellow-800 dark:text-yellow-200">
                          Row {error.row}:
                        </p>
                        <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 mt-1">
                          {error.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        And {result.errors.length - 10} more errors...
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {result.success > 0 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ {result.success} products are ready to be imported
                  {result.failed > 0 && `. ${result.failed} rows will be skipped due to errors.`}
                </p>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isImporting}
          >
            Cancel
          </Button>
          {result && result.success > 0 && (
            <Button
              onClick={onImportConfirm}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {result.success} Products
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
