<?php

namespace App\Providers;

use App\Infrastructure\Services\Audit\AuditLogServiceInterface;
use App\Infrastructure\Services\Audit\LaravelAuditLogService;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class AuditLogServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(AuditLogServiceInterface::class, function ($app) {
            return new LaravelAuditLogService(
                $app->make(AuditLogRepositoryInterface::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
