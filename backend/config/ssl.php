<?php

return [
    'enabled' => env('SSL_ENABLED', true),

    'provider' => env('SSL_PROVIDER', 'letsencrypt'),

    'letsencrypt' => [
        'environment' => env('LETSENCRYPT_ENVIRONMENT', 'production'),
        'email' => env('LETSENCRYPT_EMAIL', env('MAIL_FROM_ADDRESS')),
        
        'directory_urls' => [
            'production' => 'https://acme-v02.api.letsencrypt.org/directory',
            'staging' => 'https://acme-staging-v02.api.letsencrypt.org/directory',
        ],

        'key_size' => env('SSL_KEY_SIZE', 4096),

        'challenge_type' => env('SSL_CHALLENGE_TYPE', 'http-01'),
        
        'timeout' => env('SSL_TIMEOUT', 300),
    ],

    'storage' => [
        'disk' => env('SSL_STORAGE_DISK', 'local'),
        'path' => env('SSL_STORAGE_PATH', 'ssl'),
        
        'account_key_path' => 'account.key',
        'account_pub_path' => 'account.pub',
        
        'domain_path_format' => 'domains/{domain}',
        
        'certificate_file' => 'certificate.pem',
        'private_key_file' => 'private.key',
        'fullchain_file' => 'fullchain.pem',
        'chain_file' => 'chain.pem',
    ],

    'renewal' => [
        'enabled' => env('SSL_AUTO_RENEW_ENABLED', true),
        
        'days_before_expiry' => env('SSL_RENEWAL_DAYS_BEFORE_EXPIRY', 30),
        
        'schedule' => env('SSL_RENEWAL_SCHEDULE', '0 2 * * *'),
        
        'retry_attempts' => env('SSL_RENEWAL_RETRY_ATTEMPTS', 3),
        'retry_delay' => env('SSL_RENEWAL_RETRY_DELAY', 3600),
        
        'notification_email' => env('SSL_RENEWAL_NOTIFICATION_EMAIL', env('MAIL_FROM_ADDRESS')),
        
        'failure_notification_enabled' => env('SSL_RENEWAL_FAILURE_NOTIFICATION_ENABLED', true),
    ],

    'validation' => [
        'challenge_directory' => env('SSL_CHALLENGE_DIRECTORY', storage_path('app/acme-challenges')),
        
        'dns_propagation_check_interval' => 60,
        'dns_propagation_max_wait' => 3600,
        
        'http_challenge_port' => env('SSL_HTTP_CHALLENGE_PORT', 80),
        'http_challenge_timeout' => 30,
    ],

    'security' => [
        'encrypt_private_keys' => env('SSL_ENCRYPT_PRIVATE_KEYS', true),
        
        'min_key_size' => 2048,
        
        'allowed_key_types' => ['RSA', 'ECDSA'],
        
        'hsts_max_age' => env('SSL_HSTS_MAX_AGE', 31536000),
        'hsts_include_subdomains' => env('SSL_HSTS_INCLUDE_SUBDOMAINS', true),
        'hsts_preload' => env('SSL_HSTS_PRELOAD', true),
    ],

    'monitoring' => [
        'enabled' => env('SSL_MONITORING_ENABLED', true),
        
        'alert_days_before_expiry' => env('SSL_ALERT_DAYS_BEFORE_EXPIRY', 7),
        
        'log_channel' => env('SSL_LOG_CHANNEL', 'stack'),
    ],

    'rate_limits' => [
        'certificates_per_domain_per_week' => 50,
        'duplicate_certificates_per_week' => 5,
        
        'enforce_rate_limits' => env('SSL_ENFORCE_RATE_LIMITS', true),
    ],

    'force_https' => [
        'enabled' => env('SSL_FORCE_HTTPS', true),
        
        'redirect_status_code' => 301,
        
        'excluded_paths' => [
            '.well-known/acme-challenge/*',
            'health',
            'api/health',
        ],
    ],
];
