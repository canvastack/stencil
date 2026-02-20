import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerQuoteApi } from '@/services/api/customerQuoteApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentListProps {
  quoteUuid: string;
}

export function DocumentList({ quoteUuid }: DocumentListProps) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<number | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['quote-documents', quoteUuid],
    queryFn: async () => {
      const response = await customerQuoteApi.getDocuments(quoteUuid);
      return response.data;
    },
  });

  const handleDownload = async (documentId: number, filename: string) => {
    setDownloading(documentId);
    try {
      const response = await customerQuoteApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: 'Success', description: 'Document downloaded' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download document', variant: 'destructive' });
    } finally {
      setDownloading(null);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quotation: 'Quotation',
      proforma_invoice: 'Proforma Invoice',
      tax_invoice: 'Tax Invoice',
      purchase_order: 'Purchase Order',
      delivery_note: 'Delivery Note',
      receipt: 'Receipt',
    };
    return labels[type] || type;
  };

  const getDocumentTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      quotation: 'bg-blue-100 text-blue-800',
      proforma_invoice: 'bg-purple-100 text-purple-800',
      tax_invoice: 'bg-green-100 text-green-800',
      purchase_order: 'bg-orange-100 text-orange-800',
      delivery_note: 'bg-yellow-100 text-yellow-800',
      receipt: 'bg-pink-100 text-pink-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  const docs = documents?.data || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No documents generated yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc: any) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.document_number}</span>
                      <Badge className={getDocumentTypeBadge(doc.document_type)}>
                        {getDocumentTypeLabel(doc.document_type)}
                      </Badge>
                      {doc.version > 1 && (
                        <Badge variant="outline">v{doc.version}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generated on {format(new Date(doc.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(doc.id, `${doc.document_number}.pdf`)}
                  disabled={downloading === doc.id}
                >
                  {downloading === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
