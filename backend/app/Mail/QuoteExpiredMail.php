<?php

namespace App\Mail;

use App\Domain\Quote\Entities\Quote;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteExpiredMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $quote;
    public $vendor;
    public $admin;
    public $viewUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Quote $quote, Vendor $vendor, User $admin)
    {
        $this->quote = $quote;
        $this->vendor = $vendor;
        $this->admin = $admin;
        
        // Build view URL for admin
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $this->viewUrl = $frontendUrl . "/admin/quotes/{$quote->getUuid()}";
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quote Expired - ' . $this->quote->getQuoteNumber(),
            from: config('mail.from.address', 'noreply@canvastack.com'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.quote-expired',
            text: 'emails.admin.quote-expired-text',
            with: [
                'quote' => $this->quote,
                'vendor' => $this->vendor,
                'admin' => $this->admin,
                'viewUrl' => $this->viewUrl,
                'quoteNumber' => $this->quote->getQuoteNumber(),
                'expiresAt' => $this->quote->getExpiresAt(),
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
