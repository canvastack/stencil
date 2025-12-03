<?php

namespace App\Domain\Order\Mails;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VendorAssignmentMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public Vendor $vendor
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Assigned to You - ' . $this->order->order_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mails.vendor-assignment',
        );
    }
}
