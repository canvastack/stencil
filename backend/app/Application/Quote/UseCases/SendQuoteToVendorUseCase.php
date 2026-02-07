<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\SendQuoteToVendorCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Domain\Quote\Events\QuoteSentToVendor;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Send Quote To Vendor Use Case
 * 
 * Handles the business logic for sending a quote to a vendor.
 * Updates quote status, sends notifications, and dispatches domain events.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
final class SendQuoteToVendorUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Execute the use case
     * 
     * @param SendQuoteToVendorCommand $command
     * @return void
     * @throws \Exception If quote not found or vendor not found
     */
    public function execute(SendQuoteToVendorCommand $command): void
    {
        DB::transaction(function () use ($command) {
            // Find quote by UUID with tenant isolation
            $quote = $this->quoteRepository->findByUuid($command->quoteUuid, $command->tenantId);
            
            if (!$quote) {
                throw new \Exception("Quote not found: {$command->quoteUuid}");
            }
            
            // Find vendor
            $vendor = Vendor::where('id', $quote->getVendorId())
                ->where('tenant_id', $command->tenantId)
                ->first();
            
            if (!$vendor) {
                throw new \Exception("Vendor not found: {$quote->getVendorId()}");
            }
            
            // Mark quote as sent (this will update status and set sent_at timestamp)
            $quote->markAsSent();
            
            // Save quote with updated status
            $this->quoteRepository->save($quote);
            
            // Send notifications (email + in-app)
            try {
                $this->notificationService->sendQuoteNotification($quote, $vendor);
            } catch (\Exception $e) {
                // Log error but don't fail the transaction
                // The quote status was already updated successfully
                Log::error('Failed to send quote notification', [
                    'quote_uuid' => $quote->getUuid(),
                    'vendor_id' => $vendor->id,
                    'error' => $e->getMessage()
                ]);
            }
            
            // Dispatch domain event
            event(new QuoteSentToVendor($quote));
            
            Log::info('Quote sent to vendor successfully', [
                'quote_uuid' => $quote->getUuid(),
                'quote_number' => $quote->getQuoteNumber(),
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'tenant_id' => $command->tenantId
            ]);
        });
    }
}
