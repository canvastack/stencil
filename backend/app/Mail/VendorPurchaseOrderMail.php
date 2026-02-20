<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Vendor Purchase Order Email
 * 
 * Sent to vendor when a purchase order is generated and sent
 * 
 * Requirements: 20.4
 */
class VendorPurchaseOrderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tenantId;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public OrderDocument $purchaseOrder
    ) {
        // Store tenant ID for queue context
        $this->tenantId = $purchaseOrder->tenant_id;

        // Load relationships
        $this->purchaseOrder->load([
            'order.customer',
            'order.customerQuote.vendorQuote.vendor',
            'order.tenant'
        ]);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Purchase Order - ' . $this->purchaseOrder->document_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor-purchase-order',
            with: [
                'documentNumber' => $this->purchaseOrder->document_number,
                'orderNumber' => $this->purchaseOrder->order->order_number,
                'vendorName' => $this->purchaseOrder->order->customerQuote->vendorQuote->vendor->name,
                'companyName' => $this->purchaseOrder->order->tenant->name ?? 'PT Custom Etching Xenial',
                'deliveryDeadline' => $this->purchaseOrder->metadata['delivery_deadline'] ?? 'As specified in PO',
                'portalUrl' => config('app.vendor_portal_url') . '/purchase-orders/' . $this->purchaseOrder->uuid,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        // Attach PDF if file exists
        if ($this->purchaseOrder->file_path && \Storage::exists($this->purchaseOrder->file_path)) {
            $attachments[] = Attachment::fromStorage($this->purchaseOrder->file_path)
                ->as($this->purchaseOrder->document_number . '.pdf')
                ->withMime('application/pdf');
        }

        return $attachments;
    }
}
