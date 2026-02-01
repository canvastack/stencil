/**
 * Internal Notes Template Dialog Component
 * 
 * Provides pre-defined internal notes templates in multiple languages
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InternalNotesTemplate {
  id: string;
  en: string;
}

const internalNotesTemplates: InternalNotesTemplate = {
  id: `<h3>Catatan Internal</h3>
<ul>
  <li><strong>Status Verifikasi:</strong> Menunggu verifikasi tim sales</li>
  <li><strong>Prioritas:</strong> Normal</li>
  <li><strong>Vendor yang Direkomendasikan:</strong> [Nama Vendor]</li>
  <li><strong>Estimasi Margin:</strong> [Persentase]%</li>
  <li><strong>Catatan Khusus:</strong>
    <ul>
      <li>Customer ini adalah repeat customer dengan track record pembayaran baik</li>
      <li>Perlu follow-up dalam 2 hari kerja</li>
      <li>Pastikan sample desain dikirim sebelum konfirmasi final</li>
    </ul>
  </li>
  <li><strong>Dokumen Terlampir:</strong>
    <ul>
      <li>Purchase Order (PO) dari customer</li>
      <li>Spesifikasi teknis produk</li>
      <li>Referensi desain</li>
    </ul>
  </li>
  <li><strong>Timeline Internal:</strong>
    <ul>
      <li>Review quote: 1 hari kerja</li>
      <li>Negosiasi dengan vendor: 2-3 hari kerja</li>
      <li>Finalisasi: 1 hari kerja</li>
    </ul>
  </li>
  <li><strong>Approval Required:</strong> Manager Sales (untuk nilai di atas Rp 10.000.000)</li>
  <li><strong>Follow-up Actions:</strong>
    <ul>
      <li>Hubungi customer untuk konfirmasi spesifikasi</li>
      <li>Request sample dari vendor</li>
      <li>Update status di sistem setelah approval</li>
    </ul>
  </li>
</ul>`,
  en: `<h3>Internal Notes</h3>
<ul>
  <li><strong>Verification Status:</strong> Awaiting sales team verification</li>
  <li><strong>Priority:</strong> Normal</li>
  <li><strong>Recommended Vendor:</strong> [Vendor Name]</li>
  <li><strong>Estimated Margin:</strong> [Percentage]%</li>
  <li><strong>Special Notes:</strong>
    <ul>
      <li>This is a repeat customer with good payment track record</li>
      <li>Follow-up required within 2 working days</li>
      <li>Ensure design sample is sent before final confirmation</li>
    </ul>
  </li>
  <li><strong>Attached Documents:</strong>
    <ul>
      <li>Purchase Order (PO) from customer</li>
      <li>Product technical specifications</li>
      <li>Design references</li>
    </ul>
  </li>
  <li><strong>Internal Timeline:</strong>
    <ul>
      <li>Quote review: 1 working day</li>
      <li>Vendor negotiation: 2-3 working days</li>
      <li>Finalization: 1 working day</li>
    </ul>
  </li>
  <li><strong>Approval Required:</strong> Sales Manager (for amounts above Rp 10,000,000)</li>
  <li><strong>Follow-up Actions:</strong>
    <ul>
      <li>Contact customer to confirm specifications</li>
      <li>Request sample from vendor</li>
      <li>Update system status after approval</li>
    </ul>
  </li>
</ul>`
};

interface InternalNotesTemplateDialogProps {
  onInsert: (content: string) => void;
}

export const InternalNotesTemplateDialog: React.FC<InternalNotesTemplateDialogProps> = ({ onInsert }) => {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'id' | 'en'>('id');

  const handleInsert = () => {
    const template = internalNotesTemplates[selectedLanguage];
    onInsert(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Template
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gunakan template catatan internal</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Catatan Internal
          </DialogTitle>
          <DialogDescription>
            Pilih bahasa dan preview template sebelum memasukkan ke form
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Bahasa / Language</Label>
            <Select value={selectedLanguage} onValueChange={(value: 'id' | 'en') => setSelectedLanguage(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div 
              className="border rounded-lg p-4 bg-muted/50 max-h-96 overflow-y-auto prose prose-sm dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: internalNotesTemplates[selectedLanguage] }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleInsert}>
            Gunakan Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
