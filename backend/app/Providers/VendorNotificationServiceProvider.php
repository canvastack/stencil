<?php

namespace App\Providers;

use App\Infrastructure\Services\Notification\VendorNotificationService;
use App\Infrastructure\Services\Email\EmailServiceInterface;
use App\Domain\Notification\Repositories\NotificationRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class VendorNotificationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(VendorNotificationService::class, function ($app) {
            return new VendorNotificationService(
                $app->make(EmailServiceInterface::class),
                $app->make(NotificationRepositoryInterface::class)
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
