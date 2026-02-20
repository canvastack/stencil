<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerEmailVerificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Customer $customer;
    public string $verificationUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(Customer $customer)
    {
        $this->customer = $customer;
        
        // Build verification URL for customer portal
        $frontendUrl = config('app.frontend_url', config('app.url'));
        $this->verificationUrl = $frontendUrl . "/customer/verify-email/{$customer->registration_token}";
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $tenantName = 'CanvaStencil';
        
        try {
            if ($this->customer->tenant) {
                $tenantName = $this->customer->tenant->name ?? 'CanvaStencil';
            }
        } catch (\Exception $e) {
            // Fallback to default
        }
        
        return new Envelope(
            subject: 'Verify Your Email - ' . $tenantName,
            from: config('mail.from.address', 'noreply@canvastencil.com'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.customer.email-verification',
            text: 'emails.customer.email-verification-text',
            with: [
                'customer' => $this->customer,
                'verificationUrl' => $this->verificationUrl,
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
