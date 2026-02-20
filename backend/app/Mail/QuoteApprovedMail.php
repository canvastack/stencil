<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public CustomerQuote $quote,
        public string $paymentUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quote Approved - Payment Required - ' . $this->quote->quote_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.quote-approved',
            with: [
                'quote' => $this->quote,
                'paymentUrl' => $this->paymentUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
