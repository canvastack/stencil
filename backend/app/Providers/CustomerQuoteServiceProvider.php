<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// Domain Repository Interfaces
use App\Domain\CustomerQuote\Repositories\CustomerQuoteRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\ApprovalSettingsRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\DocumentRepositoryInterface;
use App\Domain\CustomerQuote\Repositories\DocumentTemplateRepositoryInterface;

// Infrastructure Repository Implementations
use App\Infrastructure\Persistence\Eloquent\Repositories\CustomerQuoteRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\ApprovalSettingsRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\DocumentRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\DocumentTemplateRepository;

// Domain Services
use App\Domain\CustomerQuote\Services\PricingCalculatorService;
use App\Domain\CustomerQuote\Services\TrustScoreCalculator;
use App\Domain\CustomerQuote\Services\QuoteExpirationChecker;
use App\Domain\CustomerQuote\Services\NegotiationRoundValidator;

// Application Services
use App\Application\CustomerQuote\Services\CustomerQuoteService;
use App\Application\CustomerQuote\Services\ApprovalService;
use App\Application\CustomerQuote\Services\NegotiationService;
use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Application\CustomerQuote\Services\PaymentTrackingService;
use App\Application\CustomerQuote\Services\CustomerNotificationService;
use App\Application\CustomerQuote\Services\CustomerQuoteMonitoringService;
use App\Application\CustomerQuote\Services\CustomerQuoteAlertingService;

// Infrastructure Services
use App\Infrastructure\Services\EmailService;
use App\Infrastructure\Services\PDFService;
use App\Infrastructure\Services\StorageService;

/**
 * Service Provider for Customer Quote & Approval Workflow
 * 
 * Binds domain interfaces to infrastructure implementations
 * Registers application services
 */
class CustomerQuoteServiceProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        // Bind Repository Interfaces to Implementations
        $this->app->bind(
            CustomerQuoteRepositoryInterface::class,
            CustomerQuoteRepository::class
        );

        $this->app->bind(
            ApprovalSettingsRepositoryInterface::class,
            ApprovalSettingsRepository::class
        );

        $this->app->bind(
            DocumentRepositoryInterface::class,
            DocumentRepository::class
        );

        $this->app->bind(
            DocumentTemplateRepositoryInterface::class,
            DocumentTemplateRepository::class
        );

        // Register Domain Services as Singletons
        $this->app->singleton(PricingCalculatorService::class);
        $this->app->singleton(TrustScoreCalculator::class);
        $this->app->singleton(QuoteExpirationChecker::class);
        $this->app->singleton(NegotiationRoundValidator::class);

        // Register Application Services
        $this->app->singleton(CustomerQuoteService::class);
        $this->app->singleton(ApprovalService::class);
        $this->app->singleton(NegotiationService::class);
        $this->app->singleton(DocumentGenerationService::class);
        $this->app->singleton(PaymentTrackingService::class);
        $this->app->singleton(CustomerNotificationService::class);
        $this->app->singleton(CustomerQuoteMonitoringService::class);
        $this->app->singleton(CustomerQuoteAlertingService::class);

        // Register Infrastructure Services
        $this->app->singleton(EmailService::class);
        $this->app->singleton(PDFService::class);
        $this->app->singleton(StorageService::class);
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        //
    }
}
