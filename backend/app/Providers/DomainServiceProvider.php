<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Domain Repository Interfaces
use App\Domain\Tenant\Repositories\TenantRepositoryInterface;
use App\Domain\Tenant\Repositories\DomainMappingRepositoryInterface;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Product\Repositories\ProductRepositoryInterface;
use App\Domain\Product\Repositories\ProductCategoryRepositoryInterface;
use App\Domain\Product\Repositories\ProductVariantRepositoryInterface;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;

// Infrastructure Repository Implementations
use App\Infrastructure\Persistence\Repositories\TenantEloquentRepository;
use App\Infrastructure\Persistence\Repositories\DomainMappingEloquentRepository;
use App\Infrastructure\Persistence\Repositories\CustomerEloquentRepository;
use App\Infrastructure\Persistence\Repositories\ProductEloquentRepository;
use App\Infrastructure\Persistence\Repositories\ProductCategoryEloquentRepository;
use App\Infrastructure\Persistence\Repositories\ProductVariantEloquentRepository;
use App\Infrastructure\Persistence\Repositories\OrderEloquentRepository;
use App\Infrastructure\Persistence\Repositories\VendorEloquentRepository;

// Eloquent Models
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\DomainMappingEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\ProductVariant;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Domain\Shipping\Services\ShippingService;
use App\Domain\Media\Services\MediaService;

class DomainServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind Repository Interfaces to Eloquent Implementations
        $this->bindRepositories();
        
        // Register Domain Services
        $this->registerDomainServices();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configure multi-tenancy
        $this->configureTenantIsolation();
    }

    /**
     * Bind all repository interfaces to their Eloquent implementations
     */
    private function bindRepositories(): void
    {
        // Tenant Domain
        $this->app->bind(TenantRepositoryInterface::class, function ($app) {
            return new TenantEloquentRepository(new TenantEloquentModel());
        });

        $this->app->bind(DomainMappingRepositoryInterface::class, function ($app) {
            return new DomainMappingEloquentRepository(new DomainMappingEloquentModel());
        });

        // Customer Domain
        $this->app->bind(CustomerRepositoryInterface::class, function ($app) {
            return new CustomerEloquentRepository(new Customer());
        });

        // Product Domain
        $this->app->bind(ProductRepositoryInterface::class, function ($app) {
            return new ProductEloquentRepository(new Product());
        });

        $this->app->bind(ProductCategoryRepositoryInterface::class, function ($app) {
            return new ProductCategoryEloquentRepository(new ProductCategory());
        });

        $this->app->bind(ProductVariantRepositoryInterface::class, function ($app) {
            return new ProductVariantEloquentRepository(new ProductVariant());
        });

        // Order Domain
        $this->app->bind(OrderRepositoryInterface::class, function ($app) {
            return new OrderEloquentRepository(new Order());
        });

        // Vendor Domain
        $this->app->bind(VendorRepositoryInterface::class, function ($app) {
            return new VendorEloquentRepository(new Vendor());
        });
    }

    /**
     * Register domain services
     */
    private function registerDomainServices(): void
    {
        // Tenant Services
        $this->app->singleton('tenant.context', function ($app) {
            return new \stdClass(); // Placeholder for tenant context service
        });

        // Domain Event Dispatcher
        $this->app->singleton('domain.events', function ($app) {
            return $app['events']; // Use Laravel's event dispatcher
        });

        // UUID Generator Service
        $this->app->bind('uuid.generator', function ($app) {
            return new class {
                public function generate(): string {
                    return \Illuminate\Support\Str::uuid()->toString();
                }
            };
        });

        // Shipping Services
        $this->app->singleton(ShippingService::class, function ($app) {
            return new ShippingService();
        });

        // Media Services
        $this->app->singleton(MediaService::class, function ($app) {
            return new MediaService();
        });
    }

    /**
     * Configure tenant isolation for multi-tenancy
     */
    private function configureTenantIsolation(): void
    {
        // Register global scopes for tenant isolation
        if ($this->app->runningInConsole()) {
            return; // Skip for console commands
        }

        // Apply tenant context when available
        $this->app->resolving(function ($object, $app) {
            if ($object instanceof \Illuminate\Database\Eloquent\Model) {
                $this->applyTenantScope($object);
            }
        });
    }

    /**
     * Apply tenant scope to models
     */
    private function applyTenantScope($model): void
    {
        $tenantAwareModels = [
            Customer::class,
            Product::class,
            Order::class,
            Vendor::class,
        ];

        if (in_array(get_class($model), $tenantAwareModels)) {
            // Tenant scope will be applied via global scopes in models
            // This is handled in the model's booted() method
        }
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array<int, string>
     */
    public function provides(): array
    {
        return [
            TenantRepositoryInterface::class,
            DomainMappingRepositoryInterface::class,
            CustomerRepositoryInterface::class,
            ProductRepositoryInterface::class,
            ProductCategoryRepositoryInterface::class,
            ProductVariantRepositoryInterface::class,
            OrderRepositoryInterface::class,
            VendorRepositoryInterface::class,
            'tenant.context',
            'domain.events',
            'uuid.generator',
            ShippingService::class,
            MediaService::class,
        ];
    }
}