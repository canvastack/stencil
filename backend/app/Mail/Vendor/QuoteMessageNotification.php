<?php

namespace App\Mail\Vendor;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteMessageNotification extends Mailable
{
    use Queueable, SerializesModels;

    public string $recipientType; // 'admin' or 'vendor'
    public array $messageData;

    /**
     * Create a new message instance.
     *
     * @param string $recipientType 'admin' or 'vendor'
     * @param array $messageData Message and quote data
     */
    public function __construct(string $recipientType, array $messageData)
    {
        $this->recipientType = $recipientType;
        $this->messageData = $messageData;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $quoteNumber = $this->messageData['quote_number'] ?? 'N/A';
        $senderName = $this->messageData['sender_name'] ?? 'Unknown';
        
        return new Envelope(
            subject: "New Message on Quote {$quoteNumber} from {$senderName}",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.vendor.quote-message',
            with: [
                'recipientType' => $this->recipientType,
                'recipientName' => $this->messageData['recipient_name'] ?? 'User',
                'senderName' => $this->messageData['sender_name'] ?? 'Unknown',
                'senderType' => $this->messageData['sender_type'] ?? 'unknown',
                'quoteNumber' => $this->messageData['quote_number'] ?? 'N/A',
                'orderNumber' => $this->messageData['order_number'] ?? 'N/A',
                'messagePreview' => $this->messageData['message_preview'] ?? '',
                'messageContent' => $this->messageData['message_content'] ?? '',
                'hasAttachments' => $this->messageData['has_attachments'] ?? false,
                'attachmentCount' => $this->messageData['attachment_count'] ?? 0,
                'quoteUrl' => $this->messageData['quote_url'] ?? '#',
                'sentAt' => $this->messageData['sent_at'] ?? now(),
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
