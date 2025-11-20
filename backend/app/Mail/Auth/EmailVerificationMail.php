<?php

namespace App\Mail\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmailVerificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $token;
    public $tenantId;
    public $verificationUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($user, string $token, ?string $tenantId = null)
    {
        $this->user = $user;
        $this->token = $token;
        $this->tenantId = $tenantId;
        
        // Build verification URL based on user type
        $frontendUrl = config('app.frontend_url', config('app.url'));
        if ($tenantId) {
            $this->verificationUrl = $frontendUrl . "/tenant/{$tenantId}/verify-email?token={$token}&email=" . urlencode($user->email);
        } else {
            $this->verificationUrl = $frontendUrl . "/platform/verify-email?token={$token}&email=" . urlencode($user->email);
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->tenantId 
            ? 'Verify Your Email - ' . ($this->user->tenant->name ?? 'CanvaStack')
            : 'Verify Your Email - CanvaStack Platform';
            
        return new Envelope(
            subject: $subject,
            from: config('mail.from.address', 'noreply@canvastack.com'),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.auth.email-verification',
            text: 'emails.auth.email-verification-text',
            with: [
                'user' => $this->user,
                'token' => $this->token,
                'tenantId' => $this->tenantId,
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
