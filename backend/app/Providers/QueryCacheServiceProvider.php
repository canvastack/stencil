<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\QueryCacheService;
use Illuminate\Support\ServiceProvider;

/**
 * Query Cache Service Provider
 * 
 * Registers the QueryCacheService for dependency injection.
 * 
 * Requirements: 10.2.2 (Performance Optimization)
 */
class QueryCacheServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(QueryCacheService::class, function ($app) {
            return new QueryCacheService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Publish configuration file
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/../../config/query-cache.php' => config_path('query-cache.php'),
            ], 'query-cache-config');
        }
    }
}
