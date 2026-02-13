<?php

namespace App\Mail\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteResponseNotification extends Mailable
{
    use Queueable, SerializesModels;

    public string $responseType;
    public array $quoteData;

    public function __construct(string $responseType, array $quoteData)
    {
        $this->responseType = $responseType;
        $this->quoteData = $quoteData;
    }

    public function envelope(): Envelope
    {
        $responseLabel = ucfirst($this->responseType);
        return new Envelope(
            subject: "Quote {$responseLabel} - " . ($this->quoteData['quote_number'] ?? 'N/A'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.quote-response',
            with: [
                'responseType' => $this->responseType,
                'quoteNumber' => $this->quoteData['quote_number'] ?? 'N/A',
                'vendorName' => $this->quoteData['vendor_name'] ?? 'N/A',
                'orderNumber' => $this->quoteData['order_number'] ?? 'N/A',
                'quoteUrl' => $this->quoteData['quote_url'] ?? '#',
                // Response-specific details
                'estimatedDeliveryDays' => $this->quoteData['estimated_delivery_days'] ?? null,
                'rejectionReason' => $this->quoteData['rejection_reason'] ?? null,
                'counterOfferAmount' => $this->quoteData['counter_offer_amount'] ?? null,
                'notes' => $this->quoteData['notes'] ?? null,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
