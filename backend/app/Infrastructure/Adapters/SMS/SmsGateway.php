<?php

namespace App\Infrastructure\Adapters\SMS;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class SmsGateway
{
    public function send(string $phone, string $message, array $context = []): void
    {
        $config = config('services.sms', []);

        if (!Arr::get($config, 'enabled')) {
            return;
        }

        if ($phone === '' || $message === '') {
            return;
        }

        $endpoint = (string) Arr::get($config, 'endpoint', '');
        $token = (string) Arr::get($config, 'token', '');
        $sender = Arr::get($config, 'sender');

        if ($endpoint === '' || $token === '') {
            return;
        }

        $payload = [
            'to' => $phone,
            'message' => $message,
        ];

        if (!empty($sender)) {
            $payload['sender'] = $sender;
        }

        try {
            $response = Http::withToken($token)->post($endpoint, $payload);

            if ($response->failed()) {
                Log::warning('sms_gateway_failed', [
                    'phone' => $phone,
                    'status' => $response->status(),
                    'context' => $context,
                ]);
            }
        } catch (Throwable $exception) {
            Log::error('sms_gateway_exception', [
                'phone' => $phone,
                'error' => $exception->getMessage(),
                'context' => $context,
            ]);
        }
    }
}
