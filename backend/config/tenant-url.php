<?php

return [
    'detection' => [
        'subdomain' => [
            'enabled' => env('TENANT_URL_SUBDOMAIN_ENABLED', true),
            'base_domain' => env('APP_BASE_DOMAIN', 'stencil.canvastack.com'),
            'excluded_subdomains' => ['www', 'api', 'admin', 'platform', 'mail'],
        ],

        'path' => [
            'enabled' => env('TENANT_URL_PATH_ENABLED', true),
            'prefix' => env('TENANT_URL_PATH_PREFIX', 't'),
        ],

        'custom_domain' => [
            'enabled' => env('TENANT_URL_CUSTOM_DOMAIN_ENABLED', true),
        ],
    ],

    'cache' => [
        'enabled' => env('TENANT_URL_CACHE_ENABLED', true),
        'driver' => env('TENANT_URL_CACHE_DRIVER', 'redis'),
        'prefix' => 'tenant_url:',
        'ttl' => env('TENANT_URL_CACHE_TTL', 3600),

        'warm' => [
            'enabled' => true,
            'frequency' => '*/15 * * * *',
        ],
    ],

    'fallback' => [
        'redirect_to' => env('TENANT_URL_FALLBACK_URL', 'https://www.stencil.canvastack.com'),
        'show_404' => env('TENANT_URL_FALLBACK_404', false),
        'log_failures' => true,
    ],

    'monitoring' => [
        'enabled' => env('TENANT_URL_MONITORING_ENABLED', true),
        'log_slow_resolutions' => true,
        'slow_threshold_ms' => 10,
    ],

    'analytics' => [
        'enabled' => env('TENANT_URL_ANALYTICS_ENABLED', true),
        
        'geo_location' => [
            'enabled' => env('TENANT_URL_GEO_LOCATION_ENABLED', true),
            'provider' => env('TENANT_URL_GEO_PROVIDER', 'ipapi'),
            'api_key' => env('TENANT_URL_GEO_API_KEY'),
        ],

        'track' => [
            'ip_address' => true,
            'user_agent' => true,
            'referrer' => true,
            'response_time' => true,
        ],

        'exclude_paths' => [
            'api/health',
            'api/test-permissions-debug',
        ],

        'performance' => [
            'query_cache_ttl' => 300,
            'aggregate_cache_ttl' => 600,
        ],
    ],
];
