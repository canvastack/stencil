<?php

namespace App\Mail\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeUserMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $user;
    public $tenantId;
    public $tenantName;
    public $tenantDomain;
    public $userRole;
    public $loginUrl;
    public $showCredentials;

    /**
     * Create a new message instance.
     */
    public function __construct($user, ?string $tenantId = null, array $options = [])
    {
        $this->user = $user;
        $this->tenantId = $tenantId;
        $this->tenantName = $options['tenant_name'] ?? null;
        $this->tenantDomain = $options['tenant_domain'] ?? null;
        $this->userRole = $options['user_role'] ?? 'User';
        $this->showCredentials = $options['show_credentials'] ?? true;
        
        // Build login URL based on user type
        $frontendUrl = config('app.frontend_url', config('app.url'));
        if ($tenantId) {
            $this->loginUrl = $frontendUrl . "/tenant/{$tenantId}/login";
        } else {
            $this->loginUrl = $frontendUrl . "/platform/login";
        }
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $organizationName = $this->tenantName ?? 'CanvaStack Platform';
        $subject = "Welcome to {$organizationName}! Your account is ready";
            
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
            view: 'emails.auth.welcome-user',
            text: 'emails.auth.welcome-user-text',
            with: [
                'user' => $this->user,
                'tenantId' => $this->tenantId,
                'tenantName' => $this->tenantName,
                'tenantDomain' => $this->tenantDomain,
                'userRole' => $this->userRole,
                'loginUrl' => $this->loginUrl,
                'showCredentials' => $this->showCredentials,
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
