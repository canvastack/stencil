<?php

return [
    'cloudflare' => [
        'enabled' => env('DNS_CLOUDFLARE_ENABLED', false),
        'api_token' => env('DNS_CLOUDFLARE_API_TOKEN'),
        'api_email' => env('DNS_CLOUDFLARE_API_EMAIL'),
        'api_key' => env('DNS_CLOUDFLARE_API_KEY'),
        'api_url' => env('DNS_CLOUDFLARE_API_URL', 'https://api.cloudflare.com/client/v4'),
        'default_ttl' => env('DNS_CLOUDFLARE_DEFAULT_TTL', 300),
        'proxied' => env('DNS_CLOUDFLARE_PROXIED', true),
    ],

    'route53' => [
        'enabled' => env('DNS_ROUTE53_ENABLED', false),
        'access_key_id' => env('DNS_ROUTE53_ACCESS_KEY_ID'),
        'secret_access_key' => env('DNS_ROUTE53_SECRET_ACCESS_KEY'),
        'region' => env('DNS_ROUTE53_REGION', 'us-east-1'),
        'default_ttl' => env('DNS_ROUTE53_DEFAULT_TTL', 300),
    ],

    'manual' => [
        'enabled' => true,
        'instructions_url' => env('DNS_MANUAL_INSTRUCTIONS_URL', 'https://docs.canvastack.com/dns-setup'),
    ],

    'default_provider' => env('DNS_DEFAULT_PROVIDER', 'manual'),

    'verification_record_prefix' => '_canva-verify',
    'verification_cname_suffix' => '.verify.canvastack.com',
];
