<?php

declare(strict_types=1);

namespace App\Domain\Quote\Listeners;

use App\Domain\Quote\Events\VendorRespondedToQuote;
use App\Infrastructure\Services\Notification\VendorNotificationService;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * SendVendorResponseNotification Listener
 * 
 * Listens to VendorRespondedToQuote event and sends notifications to admins.
 * 
 * Requirements: 18.3, 18.4, 18.5, 18.6, 18.7, 18.8
 */
class SendVendorResponseNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly VendorNotificationService $notificationService
    ) {}

    /**
     * Handle the event
     */
    public function handle(VendorRespondedToQuote $event): void
    {
        try {
            $quote = $event->quote;
            $responseType = $event->responseType;

            // Load vendor from database using integer ID
            $vendor = Vendor::where('id', $quote->getVendorId())
                ->where('tenant_id', $quote->getTenantId())
                ->firstOrFail();

            // Generate quote URL for admin
            $quoteUrl = config('app.url') . "/admin/quotes/{$quote->getUuid()}";

            // Send notification to admins
            $this->notificationService->notifyAdminsOfVendorResponse(
                quote: $quote,
                vendor: $vendor,
                responseType: $responseType,
                quoteUrl: $quoteUrl
            );

            Log::info('Vendor response notification sent successfully', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'response_type' => $responseType
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send vendor response notification', [
                'quote_uuid' => $event->quote->getUuid(),
                'response_type' => $event->responseType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure
     */
    public function failed(VendorRespondedToQuote $event, \Throwable $exception): void
    {
        Log::error('Vendor response notification job failed permanently', [
            'quote_uuid' => $event->quote->getUuid(),
            'response_type' => $event->responseType,
            'error' => $exception->getMessage()
        ]);
    }
}
