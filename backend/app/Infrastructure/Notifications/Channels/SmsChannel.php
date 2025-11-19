<?php

namespace App\Infrastructure\Notifications\Channels;

use App\Infrastructure\Adapters\SMS\SmsGateway;
use Illuminate\Notifications\Notification;

class SmsChannel
{
    public function __construct(private SmsGateway $gateway)
    {
    }

    public function send($notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toSms')) {
            return;
        }

        $payload = $notification->toSms($notifiable);

        if (!is_array($payload)) {
            return;
        }

        $phone = $payload['to'] ?? '';
        $message = $payload['body'] ?? '';
        $context = $payload['context'] ?? [];

        if ($phone === '' || $message === '') {
            return;
        }

        $this->gateway->send($phone, $message, is_array($context) ? $context : []);
    }
}
