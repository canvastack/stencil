import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Download, Printer, FileSpreadsheet, FileText, Loader2, StickyNote } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { ComparisonTable } from '@/components/products/ComparisonTable';
import { ComparisonNotesPanel } from '@/components/products/ComparisonNotesPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { comparisonService } from '@/services/api/comparison';
import type { ComparisonExportConfig } from '@/types/comparison';

export default function ProductComparison() {
  const navigate = useNavigate();
  const { comparedProducts, notes } = useProductComparison();
  const printRef = useRef<HTMLDivElement>(null);
  const [showNotes, setShowNotes] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const exportMutation = useMutation({
    mutationFn: async (format: 'pdf' | 'excel') => {
      const config: ComparisonExportConfig = {
        format,
        includeImages: true,
        includeNotes: notes.length > 0,
        includeMetadata: true,
        orientation: 'landscape',
      };

      const exportConfig = {
        productIds: comparedProducts.map(p => p.id),
        notes,
        highlightDifferences: true,
      };

      return await comparisonService.exportComparison(exportConfig, config);
    },
    onSuccess: async (job, format) => {
      toast.success(`${format.toUpperCase()} export started`, {
        description: 'Your file will download when ready',
      });

      const checkStatus = setInterval(async () => {
        try {
          const updatedJob = await comparisonService.getExportJob(job.id);
          
          if (updatedJob.status === 'completed') {
            clearInterval(checkStatus);
            const blob = await comparisonService.downloadExport(job.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = updatedJob.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Export downloaded successfully');
          } else if (updatedJob.status === 'failed') {
            clearInterval(checkStatus);
            toast.error('Export failed', {
              description: updatedJob.errorMessage || 'An error occurred',
            });
          }
        } catch (error) {
          console.error('Error checking export status:', error);
        }
      }, 2000);
    },
    onError: (error: any) => {
      toast.error('Failed to start export', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleExportPDF = async () => {
    if (comparedProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    exportMutation.mutate('pdf');
  };

  const handleExportExcel = async () => {
    if (comparedProducts.length === 0) {
      toast.error('No products to export');
      return;
    }

    exportMutation.mutate('excel');
  };

  return (
    <>
      <Helmet>
        <title>Product Comparison - CanvaStencil</title>
      </Helmet>

      <div className="min-h-screen bg-background" ref={printRef}>
        <div className="container mx-auto py-8 space-y-6">
          <div className="print:hidden">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold">Product Comparison</h1>
                    <p className="text-sm text-muted-foreground">
                      Compare products side-by-side to make the best decision
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={comparedProducts.length === 0 || exportMutation.isPending}
                      >
                        {exportMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Exporting...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Export
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExportPDF} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Export as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleExportExcel} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Export as Excel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="gap-2"
                    disabled={comparedProducts.length === 0}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotes(!showNotes)}
                    className="gap-2"
                    disabled={comparedProducts.length === 0}
                  >
                    <StickyNote className="h-4 w-4" />
                    {showNotes ? 'Hide' : 'Show'} Notes
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {showNotes && comparedProducts.length > 0 && (
            <ComparisonNotesPanel products={comparedProducts} />
          )}

          <ComparisonTable />

          {comparedProducts.length > 0 && (
            <Card className="p-6 print:hidden">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Need Help Deciding?</h3>
                <p className="text-muted-foreground">
                  Our product specialists can help you choose the best option for your needs.
                  Contact us for personalized recommendations.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => navigate('/tenant/contact')}>
                    Contact Sales
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/tenant/products')}>
                    Browse More Products
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
