<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerQuoteMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public CustomerQuote $quote,
        public string $portalUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Quotation - ' . $this->quote->quote_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.customer-quote',
            with: [
                'quote' => $this->quote,
                'portalUrl' => $this->portalUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
