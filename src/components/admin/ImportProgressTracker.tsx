import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Download,
} from 'lucide-react';
import { importExportService } from '@/services/api/importExport';
import { toast } from 'sonner';
import type { ImportJob } from '@/types/importExport';
import { cn } from '@/lib/utils';

interface ImportProgressTrackerProps {
  jobId: string;
  onComplete?: (job: ImportJob) => void;
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
};

export const ImportProgressTracker: React.FC<ImportProgressTrackerProps> = ({
  jobId,
  onComplete,
}) => {
  const [pollingInterval, setPollingInterval] = useState(2000);

  const { data: job, isLoading } = useQuery({
    queryKey: ['import-job', jobId],
    queryFn: () => importExportService.getImportJob(jobId),
    refetchInterval: (data) => {
      if (!data) return pollingInterval;
      
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
        return false;
      }
      
      return pollingInterval;
    },
  });

  useEffect(() => {
    if (job && (job.status === 'completed' || job.status === 'failed' || job.status === 'partial')) {
      onComplete?.(job);
    }
  }, [job, onComplete]);

  const handleDownloadErrorLog = async () => {
    try {
      const blob = await importExportService.downloadErrorLog(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `import-errors-${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Error log berhasil didownload');
    } catch (error) {
      toast.error('Gagal mendownload error log');
    }
  };

  if (isLoading || !job) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const percentage = job.totalRows > 0
    ? Math.round((job.processedRows / job.totalRows) * 100)
    : 0;

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'processing':
      case 'validating':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      validating: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      partial: 'secondary',
    };

    return (
      <Badge variant={variants[job.status] || 'outline'}>
        {job.status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-semibold">
                  {job.status === 'completed'
                    ? 'Import Selesai'
                    : job.status === 'failed'
                    ? 'Import Gagal'
                    : job.status === 'partial'
                    ? 'Import Selesai dengan Error'
                    : job.status === 'validating'
                    ? 'Validating...'
                    : 'Processing...'}
                </span>
              </div>
              {getStatusBadge()}
            </div>

            {job.dryRun && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Ini adalah dry run. Tidak ada data yang diubah.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {job.processedRows} / {job.totalRows} rows ({percentage}%)
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Rows</div>
                <div className="text-2xl font-bold">{job.totalRows.toLocaleString()}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Successful</div>
                <div className="text-2xl font-bold text-green-600">
                  {job.successfulRows.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold text-destructive">
                  {job.failedRows.toLocaleString()}
                </div>
              </div>
            </div>

            {job.status === 'processing' && job.processedRows > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Estimated time remaining: {formatTime(
                    ((job.totalRows - job.processedRows) / job.processedRows) *
                      ((new Date().getTime() - new Date(job.startedAt || job.createdAt).getTime()) / 1000)
                  )}
                </span>
              </div>
            )}

            {job.status === 'completed' && (
              <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  Import berhasil diselesaikan! {job.successfulRows} produk telah diimport.
                </AlertDescription>
              </Alert>
            )}

            {job.status === 'failed' && job.errorMessage && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{job.errorMessage}</AlertDescription>
              </Alert>
            )}

            {job.status === 'partial' && (
              <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                  Import selesai dengan beberapa error. {job.successfulRows} produk berhasil, {job.failedRows} gagal.
                </AlertDescription>
              </Alert>
            )}

            {job.errorLogUrl && job.failedRows > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadErrorLog}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Error Log
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground space-y-1">
        <div>File: {job.fileName}</div>
        <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
        {job.completedAt && (
          <div>Completed: {new Date(job.completedAt).toLocaleString()}</div>
        )}
      </div>
    </div>
  );
};
