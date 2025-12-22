import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  AlertCircle,
  CheckCircle,
  Download,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { importExportService } from '@/services/api/importExport';
import { ImportProgressTracker } from './ImportProgressTracker';
import { ImportErrorReport } from './ImportErrorReport';
import type {
  ImportConfig,
  ImportJob,
  ImportValidationResult,
} from '@/types/importExport';
import { cn } from '@/lib/utils';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

const ACCEPTED_FORMATS = {
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/json': ['.json'],
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const ImportDialog: React.FC<ImportDialogProps> = ({
  open,
  onOpenChange,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [skipErrors, setSkipErrors] = useState(true);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null);
  const [step, setStep] = useState<'upload' | 'validate' | 'import' | 'progress'>('upload');

  const downloadTemplateMutation = useMutation({
    mutationFn: async (format: 'csv' | 'excel') => {
      return await importExportService.downloadTemplate(format);
    },
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-import-template.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Template berhasil didownload');
    },
    onError: () => {
      toast.error('Gagal mendownload template');
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (config: ImportConfig) => {
      return await importExportService.validateImport(config);
    },
    onSuccess: (result) => {
      setValidationResult(result);
      setStep('validate');
      
      if (result.valid) {
        toast.success('Validasi berhasil', {
          description: `${result.validRows} baris valid dari ${result.totalRows} total baris`,
        });
      } else {
        toast.warning('Validasi menemukan error', {
          description: `${result.invalidRows} baris memiliki error`,
        });
      }
    },
    onError: (error: any) => {
      toast.error('Validasi gagal', {
        description: error?.message || 'Terjadi kesalahan saat validasi',
      });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (config: ImportConfig) => {
      return await importExportService.createImportJob(config);
    },
    onSuccess: (job) => {
      setCurrentJob(job);
      setStep('progress');
      
      if (job.dryRun) {
        toast.info('Dry run selesai', {
          description: 'Tidak ada data yang diubah. Review hasil validasi sebelum import sebenarnya.',
        });
      } else {
        toast.success('Import dimulai', {
          description: 'Proses import sedang berjalan...',
        });
      }
    },
    onError: (error: any) => {
      toast.error('Import gagal', {
        description: error?.message || 'Terjadi kesalahan saat memulai import',
      });
    },
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    const validExtensions = ['.csv', '.xlsx', '.xls', '.json'];
    const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      toast.error('Format file tidak didukung', {
        description: 'Gunakan format CSV, Excel, atau JSON',
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast.error('File terlalu besar', {
        description: 'Maksimal ukuran file adalah 10 MB',
      });
      return;
    }

    setFile(selectedFile);
    setValidationResult(null);
    setStep('upload');
  };

  const handleRemoveFile = () => {
    setFile(null);
    setValidationResult(null);
    setStep('upload');
  };

  const handleValidate = () => {
    if (!file) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    const format = file.name.endsWith('.json')
      ? 'json'
      : file.name.endsWith('.csv')
      ? 'csv'
      : 'excel';

    const config: ImportConfig = {
      file,
      format,
      dryRun: true,
    };

    validateMutation.mutate(config);
  };

  const handleImport = (actualImport = false) => {
    if (!file) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    const format = file.name.endsWith('.json')
      ? 'json'
      : file.name.endsWith('.csv')
      ? 'csv'
      : 'excel';

    const config: ImportConfig = {
      file,
      format,
      dryRun: actualImport ? false : dryRun,
      updateExisting,
      skipErrors,
      batchSize: 100,
    };

    importMutation.mutate(config);
  };

  const handleClose = () => {
    if (step === 'progress' && currentJob && currentJob.status === 'processing') {
      toast.error('Import sedang berjalan', {
        description: 'Tunggu hingga import selesai sebelum menutup dialog',
      });
      return;
    }

    setFile(null);
    setValidationResult(null);
    setCurrentJob(null);
    setStep('upload');
    setDryRun(true);
    setUpdateExisting(false);
    setSkipErrors(true);
    onOpenChange(false);
  };

  const handleImportComplete = (job: ImportJob) => {
    if (!job.dryRun && job.status === 'completed') {
      toast.success('Import selesai', {
        description: `${job.successfulRows} produk berhasil diimport`,
      });
      onImportComplete?.();
      setTimeout(() => handleClose(), 1000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Products
          </DialogTitle>
          <DialogDescription>
            Upload file CSV, Excel, atau JSON untuk import produk. 
            Download template terlebih dahulu jika diperlukan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'upload' && (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplateMutation.mutate('csv')}
                  disabled={downloadTemplateMutation.isPending}
                >
                  {downloadTemplateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download CSV Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplateMutation.mutate('excel')}
                  disabled={downloadTemplateMutation.isPending}
                >
                  {downloadTemplateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download Excel Template
                </Button>
              </div>

              <Separator />

              {!file ? (
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted hover:border-muted-foreground/50'
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Drop file disini atau klik untuk browse
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Support: CSV, Excel (.xlsx, .xls), JSON (Max 10 MB)
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".csv,.xlsx,.xls,.json"
                    onChange={handleFileInput}
                  />
                  <Button asChild>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select File
                    </label>
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {file.name.endsWith('.json') ? (
                        <FileJson className="h-10 w-10 text-blue-500 flex-shrink-0" />
                      ) : (
                        <FileSpreadsheet className="h-10 w-10 text-green-500 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label>Import Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dry-run"
                      checked={dryRun}
                      onCheckedChange={(checked) => setDryRun(!!checked)}
                    />
                    <Label htmlFor="dry-run" className="cursor-pointer text-sm">
                      Dry run (validasi saja, tidak import data)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="update-existing"
                      checked={updateExisting}
                      onCheckedChange={(checked) => setUpdateExisting(!!checked)}
                    />
                    <Label htmlFor="update-existing" className="cursor-pointer text-sm">
                      Update produk yang sudah ada
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="skip-errors"
                      checked={skipErrors}
                      onCheckedChange={(checked) => setSkipErrors(!!checked)}
                    />
                    <Label htmlFor="skip-errors" className="cursor-pointer text-sm">
                      Skip baris yang error dan lanjutkan import
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 'validate' && validationResult && (
            <div className="space-y-4">
              <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
                {validationResult.valid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {validationResult.valid
                    ? `Validasi berhasil! ${validationResult.validRows} dari ${validationResult.totalRows} baris siap diimport.`
                    : `Ditemukan ${validationResult.invalidRows} baris dengan error dari ${validationResult.totalRows} total baris.`}
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Total Rows</div>
                  <div className="text-2xl font-bold">{validationResult.totalRows}</div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Valid Rows</div>
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.validRows}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Invalid Rows</div>
                  <div className="text-2xl font-bold text-destructive">
                    {validationResult.invalidRows}
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Warnings</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {validationResult.warnings.length}
                  </div>
                </div>
              </div>

              {(validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
                <ImportErrorReport validationResult={validationResult} />
              )}
            </div>
          )}

          {step === 'progress' && currentJob && (
            <ImportProgressTracker
              jobId={currentJob.id}
              onComplete={handleImportComplete}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {step === 'progress' && currentJob?.status === 'processing' ? 'Keep Running' : 'Cancel'}
          </Button>
          
          {step === 'upload' && (
            <Button
              onClick={handleValidate}
              disabled={!file || validateMutation.isPending}
            >
              {validateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Validate
            </Button>
          )}

          {step === 'validate' && validationResult && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep('upload')}
              >
                Back
              </Button>
              <Button
                onClick={() => handleImport(true)}
                disabled={importMutation.isPending || (!validationResult.valid && !skipErrors)}
              >
                {importMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {dryRun ? 'Run Dry Import' : 'Start Import'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
