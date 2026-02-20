<?php

namespace App\Mail\Admin;

use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email notification when vendor acknowledges purchase order
 * 
 * Requirements: 20.7 - Track vendor acknowledgment
 */
class VendorAcknowledgedPurchaseOrderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public OrderDocument $purchaseOrder,
        public User $admin,
        public ?string $acknowledgmentNotes = null
    ) {
    }

    /**
     * Get the message envelope
     */
    public function envelope(): Envelope
    {
        $vendor = $this->purchaseOrder->order->customerQuote->vendorQuote->vendor;
        
        return new Envelope(
            subject: "Vendor Acknowledged PO: {$this->purchaseOrder->document_number}",
        );
    }

    /**
     * Get the message content definition
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.vendor-acknowledged-purchase-order',
            with: [
                'purchaseOrder' => $this->purchaseOrder,
                'admin' => $this->admin,
                'vendor' => $this->purchaseOrder->order->customerQuote->vendorQuote->vendor,
                'order' => $this->purchaseOrder->order,
                'acknowledgmentNotes' => $this->acknowledgmentNotes,
                'acknowledgedAt' => $this->purchaseOrder->acknowledged_at,
                'acknowledgedBy' => $this->purchaseOrder->acknowledgedBy,
            ],
        );
    }
}
