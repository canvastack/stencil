import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { ComparisonTable } from '@/components/products/ComparisonTable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProductComparison() {
  const navigate = useNavigate();
  const { comparedProducts } = useProductComparison();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = (autoTableModule as any).default || (autoTableModule as any);

      const doc = new (jsPDF as any)('l', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.text('Product Comparison', 14, 20);
      doc.setFontSize(11);
      doc.text(`Comparing ${comparedProducts.length} products`, 14, 28);

      const headers = [['Product', ...comparedProducts.map(p => p.name)]];
      
      const rows = [
        ['Price', ...comparedProducts.map(p => `${p.currency || 'IDR'} ${p.price.toLocaleString()}`)],
        ['Min Order', ...comparedProducts.map(p => `${p.minOrder || 0} ${p.priceUnit || 'pcs'}`)],
        ['Lead Time', ...comparedProducts.map(p => p.leadTime || 'N/A')],
        ['Material', ...comparedProducts.map(p => p.material || 'N/A')],
        ['Category', ...comparedProducts.map(p => p.category?.name || 'N/A')],
        ['Availability', ...comparedProducts.map(p => p.availability || 'in-stock')],
      ];

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 35,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });

      doc.save(`product-comparison-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Export PDF error:', error);
      toast.error('Failed to export PDF');
    }
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    className="gap-2"
                    disabled={comparedProducts.length === 0}
                  >
                    <Download className="h-4 w-4" />
                    Export PDF
                  </Button>
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
                </div>
              </div>
            </Card>
          </div>

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
