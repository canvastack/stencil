<?php

namespace App\Domain\Order\Mails;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuoteRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public string $vendorId,
        public float $quotedPrice,
        public int $leadTimeDays
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Quote Request for Order - ' . $this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mails.quote-request',
        );
    }
}
