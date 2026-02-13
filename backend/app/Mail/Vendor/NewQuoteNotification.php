<?php

namespace App\Mail\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewQuoteNotification extends Mailable
{
    use Queueable, SerializesModels;

    public string $vendorName;
    public array $quoteData;

    public function __construct(string $vendorName, array $quoteData)
    {
        $this->vendorName = $vendorName;
        $this->quoteData = $quoteData;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Quote Request - ' . ($this->quoteData['quote_number'] ?? 'N/A'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.new-quote',
            with: [
                'vendorName' => $this->vendorName,
                'quoteNumber' => $this->quoteData['quote_number'] ?? 'N/A',
                'orderNumber' => $this->quoteData['order_number'] ?? 'N/A',
                'customerName' => $this->quoteData['customer_name'] ?? 'N/A',
                'productName' => $this->quoteData['product_name'] ?? 'N/A',
                'expiresAt' => $this->quoteData['expires_at'] ?? null,
                'quoteUrl' => $this->quoteData['quote_url'] ?? '#',
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
