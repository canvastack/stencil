<?php

namespace App\Infrastructure\Notifications\Channels;

use App\Infrastructure\Adapters\SMS\WhatsappGateway;
use Illuminate\Notifications\Notification;

class WhatsappChannel
{
    public function __construct(private WhatsappGateway $gateway)
    {
    }

    public function send($notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toWhatsapp')) {
            return;
        }

        $payload = $notification->toWhatsapp($notifiable);

        if (!is_array($payload)) {
            return;
        }

        $phone = $payload['to'] ?? '';
        $message = $payload['body'] ?? '';
        $metadata = $payload['metadata'] ?? [];

        if ($phone === '' || $message === '') {
            return;
        }

        $this->gateway->send($phone, $message, is_array($metadata) ? $metadata : []);
    }
}
