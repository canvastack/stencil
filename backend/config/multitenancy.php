<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Tenant Model
    |--------------------------------------------------------------------------
    |
    | This is the model used for tenant identification.
    |
    */
    'tenant_model' => \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class,
    
    /*
    |--------------------------------------------------------------------------
    | Tenant Finder
    |--------------------------------------------------------------------------
    |
    | This class is responsible for finding the tenant for a given request.
    |
    */
    'tenant_finder' => \App\Infrastructure\Services\TenantFinder::class,
    
    /*
    |--------------------------------------------------------------------------
    | Database Switching
    |--------------------------------------------------------------------------
    |
    | When enabled, the package will switch the default database connection
    | to the tenant's database connection.
    |
    */
    'switch_tenant_database' => false, // Using single DB with tenant_id
    
    /*
    |--------------------------------------------------------------------------
    | Queue Configuration
    |--------------------------------------------------------------------------
    |
    | When enabled, all queued jobs will be tenant-aware.
    |
    */
    'queues_are_tenant_aware_by_default' => true,
    
    /*
    |--------------------------------------------------------------------------
    | Tenant Artisan Commands
    |--------------------------------------------------------------------------
    |
    | These artisan commands will be made tenant-aware.
    |
    */
    'tenant_artisan_commands' => [
        'migrate',
        'migrate:rollback',
        'migrate:status',
        'db:seed',
        'queue:work',
        'queue:restart',
        'cache:clear',
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Tenant Switch Tasks
    |--------------------------------------------------------------------------
    |
    | These tasks will be run whenever a tenant is switched.
    |
    */
    'switch_tenant_tasks' => [
        // Not using database switching for single-DB architecture
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    |
    | Various security-related configurations for tenant isolation.
    |
    */
    'tenant_isolation' => [
        'strict_mode' => true,
        'audit_all_queries' => env('TENANT_AUDIT_QUERIES', false),
        'forbidden_cross_tenant_relations' => true,
        'auto_scope_queries' => true,
    ],
    
    /*
    |--------------------------------------------------------------------------
    | URL Management
    |--------------------------------------------------------------------------
    |
    | Configuration for how tenants are identified via URLs.
    |
    */
    'url_management' => [
        'custom_domains_enabled' => true,
        'subdomain_enabled' => true,
        'subdirectory_enabled' => true,
        'api_header_enabled' => true,
        'default_domain' => env('APP_DOMAIN', 'canvastencil.com'),
        'reserved_domains' => [
            'www',
            'api',
            'admin',
            'mail',
            'email',
            'smtp',
            'ftp',
            'cdn',
            'assets',
            'static',
            'app',
            'mobile',
            'm',
            'test',
            'dev',
            'staging',
            'preview',
            'demo'
        ],
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Cache Configuration
    |--------------------------------------------------------------------------
    |
    | Tenant-specific cache settings.
    |
    */
    'cache' => [
        'tenant_cache_prefix' => true,
        'cache_tenant_data' => true,
        'tenant_data_ttl' => 3600, // 1 hour
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Domain Verification
    |--------------------------------------------------------------------------
    |
    | Settings for custom domain verification.
    |
    */
    'domain_verification' => [
        'enabled' => true,
        'dns_timeout' => 30,
        'ssl_verification_enabled' => true,
        'auto_ssl_provisioning' => false,
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Tenant Limits
    |--------------------------------------------------------------------------
    |
    | Global limits for tenant resources.
    |
    */
    'tenant_limits' => [
        'max_domains_per_tenant' => 5,
        'max_users_per_tenant' => 1000,
        'max_products_per_tenant' => 10000,
        'max_storage_mb' => 5120, // 5GB
    ],
    
    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable/disable various multi-tenancy features.
    |
    */
    'features' => [
        'domain_mapping' => true,
        'tenant_analytics' => true,
        'tenant_backup' => true,
        'tenant_themes' => true,
        'tenant_plugins' => true,
    ],
];