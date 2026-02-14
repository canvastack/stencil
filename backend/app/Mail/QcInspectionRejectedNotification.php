<?php

namespace App\Mail;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Models\OrderQcInspection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QcInspectionRejectedNotification extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public OrderQcInspection $inspection,
        public Order $order
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quality Control Inspection Failed - Order #' . $this->order->order_number,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.qc-inspection-rejected',
            with: [
                'inspection' => $this->inspection,
                'order' => $this->order,
                'vendor' => $this->order->vendor,
                'reworkDeadline' => $this->inspection->rework_deadline?->format('F d, Y'),
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
