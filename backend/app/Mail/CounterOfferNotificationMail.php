<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CounterOfferNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public CustomerQuote $quote,
        public string $adminUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Counter Offer Received - ' . $this->quote->quote_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.counter-offer-notification',
            with: [
                'quote' => $this->quote,
                'adminUrl' => $this->adminUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
