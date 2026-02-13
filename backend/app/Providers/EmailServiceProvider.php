<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Infrastructure\Services\Email\EmailServiceInterface;
use App\Infrastructure\Services\Email\LaravelEmailService;

/**
 * Email Service Provider
 * 
 * Binds EmailService implementation to the container.
 * Requirements: 7.1-7.16
 */
class EmailServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(EmailServiceInterface::class, function ($app) {
            return new LaravelEmailService();
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
