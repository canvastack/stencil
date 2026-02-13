<?php

declare(strict_types=1);

namespace App\Domain\Quote\Listeners;

use App\Domain\Quote\Events\AdminCounteredQuoteEvent;
use App\Infrastructure\Services\Email\QuoteNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Spatie\Multitenancy\Jobs\TenantAware;

/**
 * Send Admin Counter Offer Notification Listener
 * 
 * Handles the AdminCounteredQuoteEvent domain event by:
 * - Sending email notification to vendor
 * - Logging the admin counter offer
 */
class SendAdminCounterOfferNotification implements ShouldQueue, TenantAware
{
    use InteractsWithQueue;

    public function __construct(
        private QuoteNotificationService $notificationService
    ) {}

    /**
     * Determine if the listener should be queued.
     */
    public function shouldQueue(): bool
    {
        // Don't queue in testing environment to avoid tenant issues
        return !app()->environment('testing');
    }

    /**
     * Handle the event.
     */
    public function handle(AdminCounteredQuoteEvent $event): void
    {
        try {
            $quote = $event->quote;

            // Log the admin counter offer
            Log::info('Admin countered vendor offer', [
                'quote_uuid' => $quote->getUuid(),
                'quote_number' => $quote->getQuoteNumber(),
                'vendor_id' => $quote->getVendorId(),
                'round' => $quote->getRound(),
                'admin_counter_total' => $quote->getQuoteDetails()['admin_counter_offer']['total_counter'] ?? null,
                'tenant_id' => $quote->getTenantId()
            ]);

            // Send email notification to vendor
            $this->notificationService->sendAdminCounterOfferNotification($quote);

            Log::info('Admin counter offer notification sent successfully', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_id' => $quote->getVendorId()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send admin counter offer notification', [
                'quote_uuid' => $event->quote->getUuid(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }
}
