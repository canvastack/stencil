import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  Trash2,
  FileX,
  Info,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportError {
  row: number;
  field: string;
  message: string;
  value: string;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  warnings: ImportError[];
}

interface BulkOperation {
  id: string;
  type: 'import' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  progress: number;
  createdAt: string;
  result?: ImportResult;
}

export default function ProductBulk() {
  const { products, isLoading, fetchProducts } = useProducts();
  const [activeTab, setActiveTab] = useState('import');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [recentOperations, setRecentOperations] = useState<BulkOperation[]>([
    {
      id: '1',
      type: 'import',
      status: 'completed',
      fileName: 'products_batch_1.xlsx',
      progress: 100,
      createdAt: '2025-12-09T10:30:00Z',
      result: {
        totalRows: 150,
        successCount: 145,
        errorCount: 5,
        errors: [
          { row: 12, field: 'price', message: 'Price must be a positive number', value: '-100' },
          { row: 25, field: 'category', message: 'Category does not exist', value: 'invalid-category' },
        ],
        warnings: []
      }
    },
    {
      id: '2',
      type: 'export',
      status: 'completed',
      fileName: 'all_products_export.csv',
      progress: 100,
      createdAt: '2025-12-08T15:45:00Z'
    },
  ]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid CSV or Excel file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadFile(file);
      toast.success('File selected successfully');
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create a fake input event to reuse the upload logic
      const fakeEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileUpload(fakeEvent);
    }
  }, [handleFileUpload]);

  const simulateImport = useCallback(async () => {
    if (!uploadFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Simulate result
    const mockResult: ImportResult = {
      totalRows: 50,
      successCount: 47,
      errorCount: 3,
      errors: [
        { row: 5, field: 'name', message: 'Product name is required', value: '' },
        { row: 12, field: 'price', message: 'Invalid price format', value: 'abc' },
        { row: 28, field: 'category', message: 'Category does not exist', value: 'unknown' },
      ],
      warnings: [
        { row: 15, field: 'description', message: 'Description is too long, truncated', value: 'Very long description...' },
      ]
    };

    setImportResult(mockResult);
    setIsProcessing(false);
    setIsResultDialogOpen(true);

    // Add to recent operations
    const newOperation: BulkOperation = {
      id: Date.now().toString(),
      type: 'import',
      status: 'completed',
      fileName: uploadFile.name,
      progress: 100,
      createdAt: new Date().toISOString(),
      result: mockResult
    };

    setRecentOperations(prev => [newOperation, ...prev]);
    toast.success('Import completed successfully');
  }, [uploadFile]);

  const simulateExport = useCallback(async (format: 'csv' | 'xlsx') => {
    setIsProcessing(true);
    setProgress(0);

    // Simulate export processing
    for (let i = 0; i <= 100; i += 20) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Add to recent operations
    const newOperation: BulkOperation = {
      id: Date.now().toString(),
      type: 'export',
      status: 'completed',
      fileName: `products_export_${new Date().getTime()}.${format}`,
      progress: 100,
      createdAt: new Date().toISOString()
    };

    setRecentOperations(prev => [newOperation, ...prev]);
    setIsProcessing(false);
    toast.success(`Products exported successfully as ${format.toUpperCase()}`);
  }, []);

  const downloadTemplate = useCallback((format: 'csv' | 'xlsx') => {
    // In a real app, this would download an actual template file
    const link = document.createElement('a');
    link.href = '#';
    link.download = `product_import_template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Template downloaded as ${format.toUpperCase()}`);
  }, []);

  const getStatusIcon = (status: BulkOperation['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <FileSpreadsheet className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: BulkOperation['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bulk Product Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Import and export products in bulk using CSV or Excel files
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Import Products</TabsTrigger>
          <TabsTrigger value="export">Export Products</TabsTrigger>
          <TabsTrigger value="history">Operation History</TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-6">
          {/* Import Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Import Instructions
              </CardTitle>
              <CardDescription>
                Follow these guidelines for successful product import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Required Fields</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Product Name</li>
                    <li>• SKU (unique)</li>
                    <li>• Price</li>
                    <li>• Category</li>
                    <li>• Status (draft/published)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Optional Fields</h4>
                  <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• Description</li>
                    <li>• Stock Quantity</li>
                    <li>• Weight</li>
                    <li>• Dimensions</li>
                    <li>• Images (URLs)</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('csv')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('xlsx')}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Excel Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Product File</CardTitle>
              <CardDescription>
                Select a CSV or Excel file containing your product data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop your file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV and Excel files up to 10MB
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadFile && (
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-medium">{uploadFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUploadFile(null)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing...</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={simulateImport}
                  disabled={!uploadFile || isProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Start Import
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={!uploadFile || isProcessing}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-4xl">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold">Data Preview</h3>
                        <p className="text-sm text-gray-500">
                          Preview the first 5 rows of your import file
                        </p>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">SKU</th>
                              <th className="px-4 py-2 text-left">Price</th>
                              <th className="px-4 py-2 text-left">Category</th>
                              <th className="px-4 py-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t">
                              <td className="px-4 py-2">Custom Etched Glass</td>
                              <td className="px-4 py-2">SKU-001</td>
                              <td className="px-4 py-2">150000</td>
                              <td className="px-4 py-2">etching</td>
                              <td className="px-4 py-2">published</td>
                            </tr>
                            <tr className="border-t">
                              <td className="px-4 py-2">Trophy Engraving</td>
                              <td className="px-4 py-2">SKU-002</td>
                              <td className="px-4 py-2">200000</td>
                              <td className="px-4 py-2">awards</td>
                              <td className="px-4 py-2">draft</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <AlertDialogAction>Close</AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Products
              </CardTitle>
              <CardDescription>
                Download your product data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Options */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Export Options</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="export-format">File Format</Label>
                      <Select defaultValue="xlsx">
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                          <SelectItem value="csv">CSV (.csv)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="export-status">Product Status</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="published">Published Only</SelectItem>
                          <SelectItem value="draft">Draft Only</SelectItem>
                          <SelectItem value="archived">Archived Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="export-category">Category Filter</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="etching">Etching</SelectItem>
                          <SelectItem value="awards">Awards</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Field Selection */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Include Fields</h4>
                  
                  <div className="space-y-2">
                    {[
                      'Product Name',
                      'SKU',
                      'Description',
                      'Price',
                      'Category',
                      'Stock Quantity',
                      'Status',
                      'Images',
                      'Created Date',
                      'Updated Date'
                    ].map((field) => (
                      <div key={field} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={field}
                          defaultChecked
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={field} className="text-sm">
                          {field}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Exporting...</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => simulateExport('xlsx')}
                  disabled={isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => simulateExport('csv')}
                  disabled={isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Operations</CardTitle>
              <CardDescription>
                View history of import and export operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOperations.map((operation) => (
                  <div
                    key={operation.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(operation.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{operation.fileName}</span>
                          {getStatusBadge(operation.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{operation.type}</span>
                          <span>•</span>
                          <span>
                            {new Date(operation.createdAt).toLocaleDateString()} at{' '}
                            {new Date(operation.createdAt).toLocaleTimeString()}
                          </span>
                          {operation.result && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">
                                {operation.result.successCount} successful
                              </span>
                              {operation.result.errorCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-red-600">
                                    {operation.result.errorCount} errors
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {operation.result && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImportResult(operation.result!);
                            setIsResultDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      )}
                      
                      {operation.type === 'export' && operation.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {recentOperations.length === 0 && (
                  <div className="text-center py-8">
                    <FileX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No operations yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your import and export history will appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Import Result Dialog */}
      <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              Summary of the import operation
            </DialogDescription>
          </DialogHeader>
          
          {importResult && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResult.totalRows}
                    </div>
                    <div className="text-sm text-gray-500">Total Rows</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.successCount}
                    </div>
                    <div className="text-sm text-gray-500">Successful</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {importResult.errorCount}
                    </div>
                    <div className="text-sm text-gray-500">Errors</div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Errors ({importResult.errors.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                      >
                        <div className="font-medium">Row {error.row}, Field: {error.field}</div>
                        <div className="text-red-600">{error.message}</div>
                        <div className="text-gray-500">Value: "{error.value}"</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings ({importResult.warnings.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {importResult.warnings.map((warning, index) => (
                      <div
                        key={index}
                        className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
                      >
                        <div className="font-medium">Row {warning.row}, Field: {warning.field}</div>
                        <div className="text-yellow-600">{warning.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResultDialogOpen(false)}>
              Close
            </Button>
            {importResult && importResult.errorCount > 0 && (
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Download Error Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}