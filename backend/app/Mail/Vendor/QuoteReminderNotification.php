<?php

namespace App\Mail\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteReminderNotification extends Mailable
{
    use Queueable, SerializesModels;

    public string $vendorName;
    public array $quoteData;
    public int $daysRemaining;

    /**
     * Create a new message instance.
     *
     * @param string $vendorName Vendor company name
     * @param array $quoteData Quote information
     * @param int $daysRemaining Days until expiration
     */
    public function __construct(string $vendorName, array $quoteData, int $daysRemaining)
    {
        $this->vendorName = $vendorName;
        $this->quoteData = $quoteData;
        $this->daysRemaining = $daysRemaining;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reminder: Quote Expiring Soon - ' . ($this->quoteData['quote_number'] ?? 'N/A'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.quote-reminder',
            with: [
                'vendorName' => $this->vendorName,
                'quoteNumber' => $this->quoteData['quote_number'] ?? 'N/A',
                'orderNumber' => $this->quoteData['order_number'] ?? 'N/A',
                'customerName' => $this->quoteData['customer_name'] ?? 'N/A',
                'productName' => $this->quoteData['product_name'] ?? 'N/A',
                'expiresAt' => $this->quoteData['expires_at'] ?? null,
                'quoteUrl' => $this->quoteData['quote_url'] ?? '#',
                'daysRemaining' => $this->daysRemaining,
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
        return [];
    }
}
