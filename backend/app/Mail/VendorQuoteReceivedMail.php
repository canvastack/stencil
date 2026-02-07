<?php

namespace App\Mail;

use App\Domain\Quote\Entities\Quote;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VendorQuoteReceivedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $quote;
    public $vendor;
    public $viewUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Quote $quote, Vendor $vendor)
    {
        $this->quote = $quote;
        $this->vendor = $vendor;
        
        // Build view URL for vendor
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $this->viewUrl = $frontendUrl . "/vendor/quotes/{$quote->getUuid()}";
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'New Quote Request - ' . $this->quote->getQuoteNumber(),
            from: config('mail.from.address', 'noreply@canvastack.com'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.quote-received',
            text: 'emails.vendor.quote-received-text',
            with: [
                'quote' => $this->quote,
                'vendor' => $this->vendor,
                'viewUrl' => $this->viewUrl,
                'quoteNumber' => $this->quote->getQuoteNumber(),
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
