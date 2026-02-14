import { useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { AnalyticsExportService, type ExportFormat, type AnalyticsExportData } from '@/services/export/analyticsExportService';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AnalyticsExportData;
  timeRange?: string;
}

export function ExportDialog({ open, onOpenChange, data, timeRange }: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('xlsx');
  const [isExporting, setIsExporting] = useState(false);

  const formats: Array<{ value: ExportFormat; icon: React.ReactNode; label: string; description: string }> = [
    {
      value: 'xlsx',
      icon: <FileSpreadsheet className="h-5 w-5 text-green-600" />,
      label: 'Excel (.xlsx)',
      description: 'Excel spreadsheet with multiple sheets - Best for data analysis',
    },
    {
      value: 'csv',
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      label: 'CSV (.csv)',
      description: 'Comma-separated values - Universal compatibility',
    },
    {
      value: 'pdf',
      icon: <FileType className="h-5 w-5 text-red-600" />,
      label: 'PDF (.pdf)',
      description: 'PDF document - Best for printing and sharing',
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Add metadata to export data
      const exportData: AnalyticsExportData = {
        ...data,
        timeRange: timeRange || '30 days',
        generatedAt: new Date().toLocaleString(),
      };

      // Perform export
      AnalyticsExportService.export(exportData, {
        format: selectedFormat,
        filename: `analytics-dashboard-${new Date().toISOString().split('T')[0]}`,
      });

      toast.success(`Dashboard exported successfully as ${selectedFormat.toUpperCase()}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export dashboard. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Analytics Dashboard</DialogTitle>
          <DialogDescription>
            Choose a format to export your analytics data. The export will include all current dashboard data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label className="text-base font-semibold mb-3 block">Export Format</Label>
          <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
            <div className="space-y-3">
              {formats.map((format) => (
                <div
                  key={format.value}
                  className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedFormat === format.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedFormat(format.value)}
                >
                  <RadioGroupItem value={format.value} id={format.value} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {format.icon}
                      <Label
                        htmlFor={format.value}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {format.label}
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">{format.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="rounded-lg bg-muted p-3 text-sm">
          <p className="font-medium mb-1">Export will include:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Overview metrics with trends</li>
            <li>Production timeline data</li>
            <li>Vendor performance statistics</li>
            <li>Delivery status distribution</li>
            <li>Recent activity log</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
