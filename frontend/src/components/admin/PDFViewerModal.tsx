/**
 * PDF Viewer Modal Component
 * Displays PDF in a modal dialog with download option
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title: string;
  downloadFileName?: string;
}

export function PDFViewerModal({ 
  isOpen, 
  onClose, 
  pdfUrl, 
  title,
  downloadFileName = 'document.pdf'
}: PDFViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Cleanup blob URL when modal closes
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setError(null);
      return;
    }

    // Fetch PDF as blob and create object URL
    const fetchPDF = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('auth_token');
        
        // Extract UUID from URL
        const urlParts = pdfUrl.split('/');
        const uuidIndex = urlParts.findIndex(part => part === 'purchase-orders') + 1;
        const uuid = urlParts[uuidIndex];
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
        
        const response = await axios.get(
          `${API_BASE_URL}/tenant/purchase-orders/${uuid}/download`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
          }
        );

        // Create blob URL
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load PDF:', err);
        setError('Failed to load PDF. Please try again.');
        setIsLoading(false);
      }
    };

    fetchPDF();

    // Cleanup on unmount
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, pdfUrl]);

  const handleDownload = async () => {
    try {
      // Extract PO UUID from URL
      const urlParts = pdfUrl.split('/');
      const uuidIndex = urlParts.findIndex(part => part === 'purchase-orders') + 1;
      const poUuid = urlParts[uuidIndex];
      
      if (!poUuid) {
        console.error('Failed to extract PO UUID from URL');
        return;
      }
      
      // Import the download function
      const { downloadPurchaseOrderPDF } = await import('@/services/purchaseOrderService');
      await downloadPurchaseOrderPDF(poUuid, downloadFileName);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!blobUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={onClose} variant="outline">Close</Button>
              </div>
            </div>
          )}
          
          {blobUrl && !error && (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title={title}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
