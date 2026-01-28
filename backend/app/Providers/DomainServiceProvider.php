<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\Rules\Repositories\RuleConfigurationRepositoryInterface;
use App\Domain\Shared\Rules\Repositories\RuleExecutionLogRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Repositories\PurchaseOrderRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\CustomerRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\VendorRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\RuleConfigurationRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\RuleExecutionLogRepository;
use App\Domain\Shared\Rules\BusinessRuleRegistry;
use App\Domain\Shared\Rules\BusinessRuleEngine;

/**
 * Domain Service Provider
 * 
 * Binds domain interfaces to their infrastructure implementations.
 * Part of the dependency injection configuration for hexagonal architecture.
 * 
 * Responsibilities:
 * - Repository interface bindings
 * - Domain service registrations
 * - Event listener registrations
 * - Business rules system registration
 */
class DomainServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Repository bindings
        $this->app->bind(OrderRepositoryInterface::class, PurchaseOrderRepository::class);
        $this->app->bind(CustomerRepositoryInterface::class, CustomerRepository::class);
        $this->app->bind(VendorRepositoryInterface::class, VendorRepository::class);
        $this->app->bind(\App\Domain\Product\Repositories\ProductRepositoryInterface::class, \App\Infrastructure\Persistence\Repositories\ProductEloquentRepository::class);
        
        // Business Rules System bindings
        $this->app->bind(RuleConfigurationRepositoryInterface::class, RuleConfigurationRepository::class);
        $this->app->bind(RuleExecutionLogRepositoryInterface::class, RuleExecutionLogRepository::class);
        
        // Event Dispatcher binding
        $this->app->bind(\App\Domain\Shared\Events\EventDispatcher::class, function ($app) {
            return new \App\Domain\Shared\Events\EventDispatcher($app['events']);
        });
        
        // Register Business Rule Registry as singleton
        $this->app->singleton(BusinessRuleRegistry::class, function ($app) {
            return new BusinessRuleRegistry();
        });
        
        // Register Business Rule Engine
        $this->app->bind(BusinessRuleEngine::class, function ($app) {
            return new BusinessRuleEngine(
                $app->make(BusinessRuleRegistry::class),
                $app->make(RuleConfigurationRepositoryInterface::class),
                $app->make(RuleExecutionLogRepositoryInterface::class)
            );
        });
        
        // Advanced Pricing Services
        $this->app->bind(\App\Domain\Pricing\Services\TaxCalculatorService::class);
        $this->app->bind(\App\Domain\Pricing\Services\DiscountEngine::class);
        $this->app->bind(\App\Domain\Pricing\Strategies\MarkupStrategyFactory::class);
        
        $this->app->bind(\App\Domain\Pricing\Services\PricingCalculatorService::class, function ($app) {
            return new \App\Domain\Pricing\Services\PricingCalculatorService(
                $app->make(\App\Domain\Pricing\Services\TaxCalculatorService::class),
                $app->make(\App\Domain\Pricing\Services\DiscountEngine::class),
                $app->make(\App\Domain\Pricing\Strategies\MarkupStrategyFactory::class)
            );
        });
        
        // Vendor Matching Services
        $this->app->bind(\App\Domain\Vendor\Services\VendorScoringEngine::class);
        $this->app->bind(\App\Domain\Vendor\Services\VendorCapabilityAnalyzer::class, function ($app) {
            return new \App\Domain\Vendor\Services\VendorCapabilityAnalyzer(
                $app->make(VendorRepositoryInterface::class)
            );
        });
        
        $this->app->bind(\App\Domain\Vendor\Services\VendorMatchingService::class, function ($app) {
            return new \App\Domain\Vendor\Services\VendorMatchingService(
                $app->make(\App\Domain\Vendor\Services\VendorScoringEngine::class),
                $app->make(\App\Domain\Vendor\Services\VendorCapabilityAnalyzer::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register domain event listeners here if needed
    }
}