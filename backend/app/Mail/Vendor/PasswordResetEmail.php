<?php

namespace App\Mail\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetEmail extends Mailable
{
    use Queueable, SerializesModels;

    public string $vendorName;
    public string $resetToken;
    public string $resetUrl;

    public function __construct(string $vendorName, string $resetToken, string $resetUrl)
    {
        $this->vendorName = $vendorName;
        $this->resetToken = $resetToken;
        $this->resetUrl = $resetUrl;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Reset Your Vendor Portal Password',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.password-reset',
            with: [
                'vendorName' => $this->vendorName,
                'resetToken' => $this->resetToken,
                'resetUrl' => $this->resetUrl,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
