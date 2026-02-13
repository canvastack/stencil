<?php

namespace App\Providers;

use App\Infrastructure\Services\Storage\FileStorageServiceInterface;
use App\Infrastructure\Services\Storage\LaravelFileStorageService;
use Illuminate\Support\ServiceProvider;

class FileStorageServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(FileStorageServiceInterface::class, function ($app) {
            return new LaravelFileStorageService();
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
