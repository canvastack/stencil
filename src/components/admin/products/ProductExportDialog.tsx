import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, FileText, FileJson, Loader2 } from 'lucide-react';
import type { ExportFormat } from '@/services/export/productExportService';

export interface ProductExportDialogProps {
  open: boolean;
  isExporting: boolean;
  productCount: number;
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
}

export function ProductExportDialog({
  open,
  isExporting,
  productCount,
  onExport,
  onClose,
}: ProductExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Products</DialogTitle>
          <DialogDescription>
            Choose a format to export {productCount} products
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onExport('xlsx')}
            disabled={isExporting}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">Excel (.xlsx)</div>
              <div className="text-xs text-muted-foreground">Excel spreadsheet with formatting</div>
            </div>
            <Badge variant="secondary" className="ml-2">Recommended</Badge>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onExport('csv')}
            disabled={isExporting}
          >
            <FileText className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">CSV (.csv)</div>
              <div className="text-xs text-muted-foreground">Universal format for spreadsheet apps</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onExport('pdf')}
            disabled={isExporting}
          >
            <FileText className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">PDF (.pdf)</div>
              <div className="text-xs text-muted-foreground">Printable document format</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => onExport('json')}
            disabled={isExporting}
          >
            <FileJson className="w-4 h-4 mr-2" />
            <div className="flex-1 text-left">
              <div className="font-medium">JSON (.json)</div>
              <div className="text-xs text-muted-foreground">Developer-friendly format for APIs</div>
            </div>
          </Button>
        </div>
        
        {isExporting && (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Exporting products...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
