<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for various payment gateways
    | used in the CanvaStack Stencil platform for processing refunds
    | and other payment operations.
    |
    */

    'default_gateway' => env('PAYMENT_DEFAULT_GATEWAY', 'midtrans'),

    'gateways' => [
        'midtrans' => [
            'name' => 'Midtrans',
            'enabled' => env('MIDTRANS_ENABLED', true),
            'environment' => env('MIDTRANS_ENVIRONMENT', 'sandbox'), // sandbox or production
            'server_key' => env('MIDTRANS_SERVER_KEY'),
            'client_key' => env('MIDTRANS_CLIENT_KEY'),
            'base_url' => env('MIDTRANS_ENVIRONMENT', 'sandbox') === 'production'
                ? 'https://api.midtrans.com/v2'
                : 'https://api.sandbox.midtrans.com/v2',
            'timeout' => 30,
            'supports' => [
                'refunds' => true,
                'partial_refunds' => true,
                'status_check' => true,
            ],
            'fees' => [
                'refund_percentage' => 2.9, // 2.9%
                'refund_fixed' => 2000, // IDR 20
            ],
        ],

        'xendit' => [
            'name' => 'Xendit',
            'enabled' => env('XENDIT_ENABLED', true),
            'environment' => env('XENDIT_ENVIRONMENT', 'test'), // test or live
            'secret_key' => env('XENDIT_SECRET_KEY'),
            'public_key' => env('XENDIT_PUBLIC_KEY'),
            'base_url' => 'https://api.xendit.co',
            'webhook_token' => env('XENDIT_WEBHOOK_TOKEN'),
            'timeout' => 30,
            'supports' => [
                'refunds' => true,
                'partial_refunds' => true,
                'status_check' => true,
            ],
            'fees' => [
                'refund_percentage' => 2.9, // 2.9%
                'refund_fixed' => 0,
            ],
        ],

        'gopay' => [
            'name' => 'GoPay',
            'enabled' => env('GOPAY_ENABLED', false),
            'environment' => env('GOPAY_ENVIRONMENT', 'sandbox'),
            'partner_id' => env('GOPAY_PARTNER_ID'),
            'secret_key' => env('GOPAY_SECRET_KEY'),
            'base_url' => env('GOPAY_ENVIRONMENT', 'sandbox') === 'production'
                ? 'https://api.gopay.id'
                : 'https://sandbox-api.gopay.id',
            'timeout' => 30,
            'supports' => [
                'refunds' => true,
                'partial_refunds' => false,
                'status_check' => true,
            ],
            'fees' => [
                'refund_percentage' => 0,
                'refund_fixed' => 0,
            ],
        ],

        'bank_transfer' => [
            'name' => 'Bank Transfer',
            'enabled' => true,
            'manual_processing' => true,
            'supports' => [
                'refunds' => true,
                'partial_refunds' => true,
                'status_check' => false,
            ],
            'fees' => [
                'refund_percentage' => 0,
                'refund_fixed' => 5000, // IDR 50 admin fee
            ],
            'banks' => [
                'bca' => [
                    'name' => 'Bank Central Asia',
                    'code' => 'BCA',
                    'enabled' => true,
                ],
                'mandiri' => [
                    'name' => 'Bank Mandiri',
                    'code' => 'MANDIRI',
                    'enabled' => true,
                ],
                'bni' => [
                    'name' => 'Bank Negara Indonesia',
                    'code' => 'BNI',
                    'enabled' => true,
                ],
                'bri' => [
                    'name' => 'Bank Rakyat Indonesia',
                    'code' => 'BRI',
                    'enabled' => true,
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Refund Configuration
    |--------------------------------------------------------------------------
    */

    'refunds' => [
        'minimum_amount' => 1000, // IDR 10 minimum refund
        'maximum_amount' => 100000000, // IDR 1M maximum refund
        'processing_timeout' => 300, // 5 minutes
        'retry_attempts' => 3,
        'retry_delay' => 60, // seconds between retries
        
        'auto_approve_threshold' => 50000, // Auto approve refunds under IDR 500
        'manual_review_threshold' => 1000000, // Manual review for refunds over IDR 10K
        
        'default_method' => 'original_method',
        'allowed_methods' => [
            'original_method',
            'bank_transfer',
            'cash',
            'store_credit',
            'manual',
        ],
        
        'business_hours' => [
            'start' => '09:00',
            'end' => '17:00',
            'timezone' => 'Asia/Jakarta',
            'days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        ],
        
        'sla' => [
            'review_hours' => 24, // Hours to review refund request
            'processing_hours' => 48, // Hours to process approved refund
            'escalation_hours' => 72, // Hours before escalation
        ],
        
        'notifications' => [
            'customer' => [
                'request_submitted' => true,
                'request_approved' => true,
                'request_rejected' => true,
                'processing_started' => true,
                'processing_completed' => true,
                'processing_failed' => false, // Don't notify customer of failures
            ],
            'internal' => [
                'request_submitted' => true,
                'approval_required' => true,
                'processing_failed' => true,
                'escalation_required' => true,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Logging Configuration
    |--------------------------------------------------------------------------
    */

    'logging' => [
        'channel' => env('PAYMENT_LOG_CHANNEL', 'stack'),
        'level' => env('PAYMENT_LOG_LEVEL', 'info'),
        'log_requests' => env('PAYMENT_LOG_REQUESTS', true),
        'log_responses' => env('PAYMENT_LOG_RESPONSES', true),
        'log_sensitive_data' => env('PAYMENT_LOG_SENSITIVE', false), // Don't log sensitive data in production
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    */

    'security' => [
        'encryption_key' => env('PAYMENT_ENCRYPTION_KEY', env('APP_KEY')),
        'hash_algorithm' => 'sha256',
        'verify_ssl' => env('PAYMENT_VERIFY_SSL', true),
        'webhook_timeout' => 30,
        'max_refund_per_day' => 50, // Maximum refunds per tenant per day
        'ip_whitelist' => env('PAYMENT_IP_WHITELIST', ''),
    ],

    /*
    |--------------------------------------------------------------------------
    | Testing Configuration
    |--------------------------------------------------------------------------
    */

    'testing' => [
        'mock_gateway_responses' => env('PAYMENT_MOCK_RESPONSES', false),
        'simulate_failures' => env('PAYMENT_SIMULATE_FAILURES', false),
        'failure_rate' => env('PAYMENT_FAILURE_RATE', 15), // 15% failure rate for testing
        'test_cards' => [
            '4811111111111114' => 'success',
            '4911111111111113' => 'failure',
            '4811111111111115' => 'timeout',
        ],
    ],
];