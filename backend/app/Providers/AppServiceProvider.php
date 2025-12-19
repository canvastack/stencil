<?php

namespace App\Providers;

use App\Domain\Content\Repositories\PlatformPageRepositoryInterface;
use App\Domain\Content\Repositories\TenantPageRepositoryInterface;
use App\Domain\Settings\Repositories\SettingsRepositoryInterface;
use App\Infrastructure\Repositories\PlatformPageRepository;
use App\Infrastructure\Repositories\TenantPageRepository;
use App\Infrastructure\Persistence\Repositories\SettingsRepository;
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
        
        // Settings Repository Binding
        $this->app->bind(SettingsRepositoryInterface::class, SettingsRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
