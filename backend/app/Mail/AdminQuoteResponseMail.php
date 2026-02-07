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

class AdminQuoteResponseMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $quote;
    public $vendor;
    public $admin;
    public $viewUrl;
    public $responseLabel;

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
        
        // Get response label
        $this->responseLabel = match($quote->getResponseType()) {
            'accept' => 'accepted',
            'reject' => 'rejected',
            'counter' => 'countered',
            default => 'responded to'
        };
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vendor Response - ' . $this->quote->getQuoteNumber(),
            from: config('mail.from.address', 'noreply@canvastack.com'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.admin.quote-response',
            text: 'emails.admin.quote-response-text',
            with: [
                'quote' => $this->quote,
                'vendor' => $this->vendor,
                'admin' => $this->admin,
                'viewUrl' => $this->viewUrl,
                'quoteNumber' => $this->quote->getQuoteNumber(),
                'responseLabel' => $this->responseLabel,
                'responseNotes' => $this->quote->getResponseNotes(),
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
