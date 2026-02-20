<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerQuoteExpiredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public CustomerQuote $quote,
        public ?string $contactUrl = null
    ) {
        // Set default contact URL if not provided
        if (!$this->contactUrl) {
            $frontendUrl = config('app.frontend_url', config('app.url'));
            $this->contactUrl = $frontendUrl . '/contact';
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quote Expired - ' . $this->quote->quote_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.quote-expired',
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
