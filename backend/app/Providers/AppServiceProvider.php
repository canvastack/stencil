<?php

namespace App\Providers;

use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use App\Domain\Content\Repositories\TenantPageRepositoryInterface;
use App\Infrastructure\Repositories\PlatformPageRepository;
use App\Infrastructure\Repositories\TenantPageRepository;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Content Management Repository Bindings
        $this->app->bind(PlatformPageRepositoryInterface::class, PlatformPageRepository::class);
        $this->app->bind(TenantPageRepositoryInterface::class, TenantPageRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
