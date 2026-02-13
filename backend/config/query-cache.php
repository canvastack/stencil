<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Query Cache Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for query result caching to improve
    | API response times for the vendor portal. Caching is applied to frequently
    | accessed, relatively static data.
    |
    | Target: All API responses < 500ms
    | Requirements: 10.2.2 (Performance Optimization)
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Cache Driver
    |--------------------------------------------------------------------------
    |
    | The cache driver to use for query caching. Options: redis, memcached, file
    | Redis is recommended for production for best performance.
    |
    */
    'driver' => env('QUERY_CACHE_DRIVER', env('CACHE_DRIVER', 'redis')),

    /*
    |--------------------------------------------------------------------------
    | Default Cache TTL (Time To Live)
    |--------------------------------------------------------------------------
    |
    | Default time in seconds that query results should be cached.
    | Can be overridden per query type.
    |
    */
    'default_ttl' => env('QUERY_CACHE_TTL', 300), // 5 minutes

    /*
    |--------------------------------------------------------------------------
    | Cache Enabled
    |--------------------------------------------------------------------------
    |
    | Master switch to enable/disable query caching globally.
    | Set to false in development for easier debugging.
    |
    */
    'enabled' => env('QUERY_CACHE_ENABLED', env('APP_ENV') === 'production'),

    /*
    |--------------------------------------------------------------------------
    | Cache Key Prefix
    |--------------------------------------------------------------------------
    |
    | Prefix for all cache keys to avoid collisions with other cached data.
    |
    */
    'prefix' => env('QUERY_CACHE_PREFIX', 'query_cache'),

    /*
    |--------------------------------------------------------------------------
    | Query-Specific Cache Settings
    |--------------------------------------------------------------------------
    |
    | Configure cache TTL for specific query types. Longer TTL for data that
    | changes infrequently, shorter TTL for frequently updated data.
    |
    */
    'queries' => [
        // Vendor Profile (changes infrequently)
        'vendor_profile' => [
            'enabled' => true,
            'ttl' => 600, // 10 minutes
            'tags' => ['vendor', 'profile'],
        ],

        // Vendor Statistics (can be cached for a few minutes)
        'vendor_statistics' => [
            'enabled' => true,
            'ttl' => 180, // 3 minutes
            'tags' => ['vendor', 'statistics'],
        ],

        // Quote List (changes frequently, short cache)
        'quote_list' => [
            'enabled' => true,
            'ttl' => 60, // 1 minute
            'tags' => ['quote', 'list'],
        ],

        // Quote Detail (can be cached briefly)
        'quote_detail' => [
            'enabled' => true,
            'ttl' => 120, // 2 minutes
            'tags' => ['quote', 'detail'],
        ],

        // Message Thread (changes frequently, very short cache)
        'message_thread' => [
            'enabled' => true,
            'ttl' => 30, // 30 seconds
            'tags' => ['message', 'thread'],
        ],

        // Audit Logs (historical data, can be cached longer)
        'audit_logs' => [
            'enabled' => true,
            'ttl' => 300, // 5 minutes
            'tags' => ['audit', 'logs'],
        ],

        // Vendor Performance Metrics (expensive calculation, cache longer)
        'vendor_metrics' => [
            'enabled' => true,
            'ttl' => 900, // 15 minutes
            'tags' => ['vendor', 'metrics', 'performance'],
        ],

        // Expiring Quotes (time-sensitive, short cache)
        'expiring_quotes' => [
            'enabled' => true,
            'ttl' => 60, // 1 minute
            'tags' => ['quote', 'expiring'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Invalidation Events
    |--------------------------------------------------------------------------
    |
    | Define which events should trigger cache invalidation for specific tags.
    | This ensures cached data stays fresh when underlying data changes.
    |
    */
    'invalidation' => [
        // When vendor profile is updated, clear vendor-related caches
        'vendor.updated' => ['vendor', 'profile', 'statistics', 'metrics'],
        
        // When quote is created/updated, clear quote-related caches
        'quote.created' => ['quote', 'list', 'statistics'],
        'quote.updated' => ['quote', 'detail', 'list', 'statistics'],
        'quote.responded' => ['quote', 'detail', 'list', 'statistics', 'vendor', 'metrics'],
        'quote.expired' => ['quote', 'detail', 'list', 'expiring'],
        
        // When message is sent, clear message-related caches
        'message.sent' => ['message', 'thread'],
        
        // When audit log is created, clear audit-related caches
        'audit.logged' => ['audit', 'logs'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Cache Warming
    |--------------------------------------------------------------------------
    |
    | Configure automatic cache warming for frequently accessed data.
    | This pre-populates the cache to ensure fast first-request response times.
    |
    */
    'warming' => [
        'enabled' => env('QUERY_CACHE_WARMING_ENABLED', false),
        
        // Queries to warm on application boot
        'queries' => [
            // 'vendor_statistics',
            // 'vendor_metrics',
        ],
        
        // Schedule for cache warming (cron expression)
        'schedule' => '*/5 * * * *', // Every 5 minutes
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Monitoring
    |--------------------------------------------------------------------------
    |
    | Enable performance monitoring to track cache hit rates and query times.
    |
    */
    'monitoring' => [
        'enabled' => env('QUERY_CACHE_MONITORING_ENABLED', true),
        
        // Log slow queries (queries taking longer than threshold)
        'log_slow_queries' => true,
        'slow_query_threshold' => 500, // milliseconds
        
        // Track cache hit/miss rates
        'track_hit_rate' => true,
    ],
];
