<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\ExtendQuoteExpirationCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use DateTimeImmutable;

/**
 * Extend Quote Expiration Use Case
 * 
 * Handles the business logic for extending a quote's expiration date.
 * Validates the quote state, updates expiration, and notifies the vendor.
 * 
 * Requirements: 10.6
 */
final class ExtendQuoteExpirationUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Execute the use case
     * 
     * @param ExtendQuoteExpirationCommand $command
     * @return void
     * @throws \Exception If quote not found or validation fails
     */
    public function execute(ExtendQuoteExpirationCommand $command): void
    {
        DB::transaction(function () use ($command) {
            // Find quote by UUID
            $quote = $this->quoteRepository->findByUuid(
                $command->quoteUuid,
                $command->tenantId
            );
            
            if (!$quote) {
                throw new \Exception("Quote not found: {$command->quoteUuid}");
            }
            
            // Verify tenant isolation
            if ($quote->getTenantId() !== $command->tenantId) {
                throw new \Exception("Quote does not belong to tenant: {$command->tenantId}");
            }
            
            // Validate new expiration date is in the future
            $now = new DateTimeImmutable();
            if ($command->newExpiresAt <= $now) {
                throw new \InvalidArgumentException('New expiration date must be in the future');
            }
            
            // Validate quote is expired or near expiration
            $currentExpiresAt = $quote->getExpiresAt();
            if ($currentExpiresAt === null) {
                throw new \Exception('Quote does not have an expiration date');
            }
            
            // Check if quote is expired or expiring within 7 days
            $sevenDaysFromNow = $now->modify('+7 days');
            $isExpiredOrNearExpiration = $currentExpiresAt <= $sevenDaysFromNow;
            
            if (!$isExpiredOrNearExpiration) {
                throw new \Exception('Quote expiration can only be extended if expired or expiring within 7 days');
            }
            
            // Extend expiration
            $quote->extendExpiration($command->newExpiresAt, $command->userId);
            
            // Save quote with updated expiration
            $this->quoteRepository->save($quote);
            
            // Find vendor for notification
            $vendor = Vendor::where('id', $quote->getVendorId())
                ->where('tenant_id', $command->tenantId)
                ->first();
            
            if ($vendor) {
                // Send notification to vendor
                try {
                    $this->notificationService->sendQuoteExtendedNotification($quote, $vendor);
                } catch (\Exception $e) {
                    // Log error but don't fail the transaction
                    Log::error('Failed to send quote extended notification', [
                        'quote_uuid' => $quote->getUuid(),
                        'vendor_id' => $vendor->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            Log::info('Quote expiration extended successfully', [
                'quote_uuid' => $quote->getUuid(),
                'quote_number' => $quote->getQuoteNumber(),
                'old_expires_at' => $currentExpiresAt->format('Y-m-d H:i:s'),
                'new_expires_at' => $command->newExpiresAt->format('Y-m-d H:i:s'),
                'extended_by_user_id' => $command->userId,
                'tenant_id' => $command->tenantId
            ]);
        });
    }
}
