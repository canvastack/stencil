<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $payment;
    public $status; // 'approved' or 'rejected'
    public $notes;
    public $rejectionReason;

    /**
     * Create a new message instance.
     */
    public function __construct($payment, $status, $notes = null, $rejectionReason = null)
    {
        $this->payment = $payment;
        $this->status = $status;
        $this->notes = $notes;
        $this->rejectionReason = $rejectionReason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->status === 'approved' 
            ? 'Payment Verified - ' . $this->payment->reference
            : 'Payment Verification Failed - ' . $this->payment->reference;

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
            view: 'emails.payment-verification',
            with: [
                'payment' => $this->payment,
                'status' => $this->status,
                'notes' => $this->notes,
                'rejectionReason' => $this->rejectionReason,
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
