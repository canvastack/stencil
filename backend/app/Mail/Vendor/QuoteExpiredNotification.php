<?php

namespace App\Mail\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteExpiredNotification extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipient;
    public array $quoteData;

    /**
     * Create a new message instance.
     *
     * @param string $recipient Either 'vendor' or 'admin'
     * @param array $quoteData Quote information
     */
    public function __construct(string $recipient, array $quoteData)
    {
        $this->recipient = $recipient;
        $this->quoteData = $quoteData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quote Expired - ' . ($this->quoteData['quote_number'] ?? 'N/A'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $view = $this->recipient === 'vendor' 
            ? 'emails.vendor.quote-expired-vendor'
            : 'emails.vendor.quote-expired-admin';

        $data = [
            'quoteNumber' => $this->quoteData['quote_number'] ?? 'N/A',
            'orderNumber' => $this->quoteData['order_number'] ?? 'N/A',
            'customerName' => $this->quoteData['customer_name'] ?? 'N/A',
            'productName' => $this->quoteData['product_name'] ?? 'N/A',
            'expiresAt' => $this->quoteData['expires_at'] ?? null,
        ];

        // Add recipient-specific data
        if ($this->recipient === 'vendor') {
            $data['vendorName'] = $this->quoteData['vendor_name'] ?? 'N/A';
            $data['portalUrl'] = $this->quoteData['portal_url'] ?? '#';
        } else {
            $data['vendorName'] = $this->quoteData['vendor_name'] ?? 'N/A';
            $data['quoteUrl'] = $this->quoteData['quote_url'] ?? '#';
        }

        return new Content(
            view: $view,
            with: $data,
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
