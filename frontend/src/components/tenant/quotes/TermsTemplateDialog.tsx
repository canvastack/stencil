/**
 * Terms Template Dialog Component
 * 
 * Provides pre-defined terms and conditions templates in multiple languages
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

interface TermsTemplate {
  id: string;
  en: string;
}

const termsTemplates: TermsTemplate = {
  id: `<h3>Syarat dan Ketentuan Penawaran</h3>
<ol>
  <li><strong>Validitas Penawaran:</strong> Penawaran ini berlaku hingga tanggal yang tertera pada dokumen ini.</li>
  <li><strong>Harga:</strong> Harga yang tercantum sudah termasuk Pajak Pertambahan Nilai (PPN) 11%.</li>
  <li><strong>Pembayaran:</strong>
    <ul>
      <li>Down Payment (DP) 50% setelah Purchase Order (PO) diterima</li>
      <li>Pelunasan 50% sebelum pengiriman barang</li>
    </ul>
  </li>
  <li><strong>Waktu Pengerjaan:</strong> 7-14 hari kerja setelah DP diterima dan desain final disetujui oleh customer.</li>
  <li><strong>Revisi Desain:</strong> Maksimal 2 kali revisi desain tanpa biaya tambahan. Revisi lebih dari 2 kali akan dikenakan biaya tambahan.</li>
  <li><strong>Pengiriman:</strong> Biaya pengiriman ditanggung oleh pembeli. Estimasi waktu pengiriman tergantung lokasi dan jasa pengiriman yang dipilih.</li>
  <li><strong>Garansi Produk:</strong> Garansi 6 bulan untuk cacat produksi. Garansi tidak berlaku untuk kerusakan akibat pemakaian yang tidak sesuai.</li>
  <li><strong>Pembatalan Pesanan:</strong> Pembatalan pesanan setelah DP dibayarkan akan dikenakan biaya administrasi 20% dari total nilai pesanan.</li>
  <li><strong>Force Majeure:</strong> Kami tidak bertanggung jawab atas keterlambatan atau kegagalan pemenuhan pesanan akibat keadaan force majeure (bencana alam, perang, kebijakan pemerintah, dll).</li>
  <li><strong>Persetujuan:</strong> Dengan menerima penawaran ini, customer dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku.</li>
</ol>`,
  en: `<h3>Terms and Conditions of Quotation</h3>
<ol>
  <li><strong>Validity:</strong> This quotation is valid until the date stated in this document.</li>
  <li><strong>Price:</strong> All prices include 11% Value Added Tax (VAT).</li>
  <li><strong>Payment Terms:</strong>
    <ul>
      <li>50% down payment after Purchase Order (PO) received</li>
      <li>50% balance payment before delivery</li>
    </ul>
  </li>
  <li><strong>Lead Time:</strong> 7-14 working days after down payment received and final design approved by customer.</li>
  <li><strong>Design Revision:</strong> Maximum 2 design revisions at no additional cost. Additional revisions will incur extra charges.</li>
  <li><strong>Delivery:</strong> Shipping costs are borne by the buyer. Estimated delivery time depends on location and selected courier service.</li>
  <li><strong>Product Warranty:</strong> 6 months warranty for manufacturing defects. Warranty does not cover damage due to improper use.</li>
  <li><strong>Order Cancellation:</strong> Order cancellation after down payment will incur 20% administrative fee of total order value.</li>
  <li><strong>Force Majeure:</strong> We are not responsible for delays or failure to fulfill orders due to force majeure events (natural disasters, war, government policies, etc).</li>
  <li><strong>Agreement:</strong> By accepting this quotation, the customer is deemed to have read, understood, and agreed to all applicable terms and conditions.</li>
</ol>`
};

interface TermsTemplateDialogProps {
  onInsert: (content: string) => void;
}

export const TermsTemplateDialog: React.FC<TermsTemplateDialogProps> = ({ onInsert }) => {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'id' | 'en'>('id');

  const handleInsert = () => {
    const template = termsTemplates[selectedLanguage];
    onInsert(template);
    setOpen(false);
    // Reset language selection for next use
    setSelectedLanguage('id');
  };

  // Reset language when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setSelectedLanguage('id');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <p>Gunakan template syarat dan ketentuan</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Template Syarat dan Ketentuan
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
              dangerouslySetInnerHTML={{ __html: termsTemplates[selectedLanguage] }}
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
