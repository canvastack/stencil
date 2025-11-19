<?php

namespace App\Infrastructure\Adapters\SMS;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsappGateway
{
    public function send(string $phone, string $message, array $metadata = []): void
    {
        $config = config('services.whatsapp', []);

        if (!Arr::get($config, 'enabled')) {
            return;
        }

        if ($phone === '' || $message === '') {
            return;
        }

        $endpoint = rtrim((string) Arr::get($config, 'endpoint', ''), '/');
        $token = (string) Arr::get($config, 'token', '');
        $phoneNumberId = (string) Arr::get($config, 'phone_number_id', '');

        if ($endpoint === '' || $token === '' || $phoneNumberId === '') {
            return;
        }

        $url = $endpoint . '/' . $phoneNumberId . '/messages';

        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $phone,
            'type' => 'text',
            'text' => [
                'preview_url' => Arr::get($metadata, 'preview_url', false),
                'body' => $message,
            ],
        ];

        try {
            $response = Http::withToken($token)->post($url, $payload);

            if ($response->failed()) {
                Log::warning('whatsapp_gateway_failed', [
                    'phone' => $phone,
                    'status' => $response->status(),
                    'context' => $metadata,
                ]);
            }
        } catch (Throwable $exception) {
            Log::error('whatsapp_gateway_exception', [
                'phone' => $phone,
                'error' => $exception->getMessage(),
                'context' => $metadata,
            ]);
        }
    }
}
