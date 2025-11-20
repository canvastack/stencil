<?php

namespace App\Infrastructure\Notifications\Auth;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetMail extends Mailable
{
    use SerializesModels;

    public $user;
    public $token;
    public $tenantId;
    public $resetUrl;
    public $expiresIn;

    /**
     * Create a new message instance.
     */
    public function __construct($user, string $token, ?string $tenantId = null)
    {
        $this->user = $user;
        $this->token = $token;
        $this->tenantId = $tenantId;
        $this->expiresIn = 2; // 2 hours
        
        // Generate reset URL
        $this->resetUrl = $this->generateResetUrl($token, $tenantId);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->tenantId 
            ? 'Reset Your Password - Tenant Account'
            : 'Reset Your Password - Platform Account';

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.auth.password-reset',
            text: 'emails.auth.password-reset-text',
            with: [
                'user' => $this->user,
                'resetUrl' => $this->resetUrl,
                'expiresIn' => $this->expiresIn,
                'tenantId' => $this->tenantId,
                'appName' => config('app.name'),
            ],
        );
    }

    /**
     * Generate password reset URL
     */
    private function generateResetUrl(string $token, ?string $tenantId): string
    {
        $baseUrl = config('app.frontend_url', config('app.url'));
        
        if ($tenantId) {
            // Tenant password reset URL
            return "{$baseUrl}/tenant/{$tenantId}/reset-password?token={$token}&email=" . urlencode($this->user->email);
        } else {
            // Platform password reset URL
            return "{$baseUrl}/admin/reset-password?token={$token}&email=" . urlencode($this->user->email);
        }
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