import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { bulkOperationsService } from '@/services/api/bulkOperations';
import { toast } from 'sonner';
import type { BulkOperationJob } from '@/types/bulkOperations';

interface BulkOperationProgressProps {
  jobId: string;
  onComplete?: (job: BulkOperationJob) => void;
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
};

const getActionLabel = (action: string): string => {
  const labels: Record<string, string> = {
    update_status: 'Update Status',
    update_price: 'Update Price',
    update_category: 'Update Category',
    update_tags: 'Update Tags',
    update_stock: 'Update Stock',
    update_featured: 'Update Featured',
    duplicate: 'Duplicate',
    delete: 'Delete',
  };
  return labels[action] || action;
};

export const BulkOperationProgress: React.FC<BulkOperationProgressProps> = ({
  jobId,
  onComplete,
}) => {
  const { data: job, isLoading } = useQuery({
    queryKey: ['bulk-operation', jobId],
    queryFn: () => bulkOperationsService.getBulkOperation(jobId),
    refetchInterval: (data) => {
      if (!data) return 2000;
      
      if (data.status === 'completed' || data.status === 'failed' || data.status === 'partial') {
        return false;
      }
      
      return 2000;
    },
  });

  useEffect(() => {
    if (job && (job.status === 'completed' || job.status === 'failed' || job.status === 'partial')) {
      onComplete?.(job);
    }
  }, [job, onComplete]);

  const handleDownloadReport = async () => {
    try {
      const blob = await bulkOperationsService.downloadBulkOperationReport(jobId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-operation-${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  if (isLoading || !job) {
    return (
      <Dialog open={true}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const percentage = job.totalItems > 0
    ? Math.round((job.processedItems / job.totalItems) * 100)
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
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
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
    <Dialog open={true}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getActionLabel(job.action)} Progress
          </DialogTitle>
          <DialogDescription>
            Bulk operation for {job.totalItems} products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {job.status === 'completed'
                      ? 'Operation Completed'
                      : job.status === 'failed'
                      ? 'Operation Failed'
                      : job.status === 'partial'
                      ? 'Completed with Errors'
                      : 'Processing...'}
                  </span>
                  {getStatusBadge()}
                </div>

                {job.dryRun && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Dry run mode: No data will be modified.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {job.processedItems} / {job.totalItems} items ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{job.totalItems.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Successful</div>
                    <div className="text-2xl font-bold text-green-600">
                      {job.successfulItems.toLocaleString()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Failed</div>
                    <div className="text-2xl font-bold text-destructive">
                      {job.failedItems.toLocaleString()}
                    </div>
                  </div>
                </div>

                {job.status === 'processing' && job.processedItems > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated time remaining: {formatTime(
                        ((job.totalItems - job.processedItems) / job.processedItems) *
                          ((new Date().getTime() - new Date(job.startedAt || job.createdAt).getTime()) / 1000)
                      )}
                    </span>
                  </div>
                )}

                {job.status === 'completed' && (
                  <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900 dark:text-green-100">
                      Operation completed successfully! {job.successfulItems} products were updated.
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
                      Operation completed with errors. {job.successfulItems} products updated, {job.failedItems} failed.
                    </AlertDescription>
                  </Alert>
                )}

                {(job.status === 'completed' || job.status === 'partial') && job.failedItems > 0 && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadReport}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Report
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>Action: {getActionLabel(job.action)}</div>
            <div>Created: {new Date(job.createdAt).toLocaleString()}</div>
            {job.completedAt && (
              <div>Completed: {new Date(job.completedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
