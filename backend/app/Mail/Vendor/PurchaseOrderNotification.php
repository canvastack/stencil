<?php

namespace App\Mail\Vendor;

use App\Models\VendorPurchaseOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class PurchaseOrderNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public VendorPurchaseOrder $purchaseOrder;
    public string $vendorName;
    public string $portalUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(VendorPurchaseOrder $purchaseOrder)
    {
        $this->purchaseOrder = $purchaseOrder;
        $this->vendorName = $purchaseOrder->vendor->name ?? 'Vendor';
        
        // Build portal URL
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $this->portalUrl = $frontendUrl . "/vendor/purchase-orders/{$purchaseOrder->uuid}";
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Purchase Order - ' . $this->purchaseOrder->po_number,
            from: config('mail.from.address', 'noreply@canvastack.com'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.purchase-order',
            text: 'emails.vendor.purchase-order-text',
            with: [
                'vendorName' => $this->vendorName,
                'poNumber' => $this->purchaseOrder->po_number,
                'orderNumber' => $this->purchaseOrder->order->order_number ?? 'N/A',
                'issueDate' => $this->purchaseOrder->issue_date->format('F j, Y'),
                'expectedDeliveryDate' => $this->purchaseOrder->expected_delivery_date->format('F j, Y'),
                'grandTotal' => $this->purchaseOrder->grand_total,
                'currency' => $this->purchaseOrder->order->currency ?? 'IDR',
                'portalUrl' => $this->portalUrl,
                'deliveryDays' => $this->purchaseOrder->expected_delivery_date->diffInDays($this->purchaseOrder->issue_date),
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
        
        // Attach PDF if it exists
        if ($this->purchaseOrder->pdf_path && Storage::disk('local')->exists($this->purchaseOrder->pdf_path)) {
            $attachments[] = Attachment::fromStorageDisk('local', $this->purchaseOrder->pdf_path)
                ->as($this->purchaseOrder->po_number . '.pdf')
                ->withMime('application/pdf');
        }
        
        return $attachments;
    }
}
