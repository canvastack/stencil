<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\AdminCounterOfferCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use InvalidArgumentException;

/**
 * AdminCounterOfferUseCase
 * 
 * Handles admin countering vendor's counter offer.
 * Enables two-way negotiation between admin and vendor.
 * 
 * Business Rules:
 * - Quote must be in 'countered' status
 * - Admin counter must be different from vendor's counter
 * - Cannot exceed max negotiation rounds (default: 5)
 * - Updates quote status to 'admin_countered'
 * - Tracks negotiation history
 * - Sends email notification to vendor
 */
final class AdminCounterOfferUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Execute admin counter offer
     * 
     * @throws InvalidArgumentException If validation fails
     * @throws InvalidStatusTransitionException If quote status invalid
     * @return array Quote data after counter offer
     */
    public function execute(AdminCounterOfferCommand $command): array
    {
        return DB::transaction(function () use ($command) {
            // Load quote with tenant scoping
            $quote = $this->quoteRepository->findByUuid($command->quoteUuid, $command->tenantId);
            
            if (!$quote) {
                throw new InvalidArgumentException('Quote not found');
            }

            // Validate quote can be countered
            if ($quote->getStatus()->value !== 'countered') {
                throw new InvalidStatusTransitionException(
                    'Can only counter when vendor has submitted counter offer. Current status: ' . $quote->getStatus()->value
                );
            }

            // Check if expired
            if ($quote->isExpired()) {
                throw new QuoteExpiredException('This quote has expired and can no longer be modified');
            }

            // Validate admin counter amount
            if ($command->adminCounterOffer <= 0) {
                throw new InvalidArgumentException('Admin counter offer must be greater than 0');
            }

            // Get vendor's latest counter offer from quote_details
            $quoteDetails = $quote->getQuoteDetails() ?? [];
            $vendorCounterOffer = $quoteDetails['counter_offer']['total_amount'] ?? 0;

            // Validate admin counter is different from vendor's counter
            if ($command->adminCounterOffer === $vendorCounterOffer) {
                throw new InvalidArgumentException('Admin counter offer must be different from vendor\'s counter offer');
            }

            // Check max negotiation rounds
            $maxRounds = $quoteDetails['max_rounds'] ?? 5;
            $currentRound = $quote->getRound();
            
            if ($currentRound >= $maxRounds) {
                throw new InvalidArgumentException(
                    "Maximum negotiation rounds ({$maxRounds}) reached. Cannot counter anymore."
                );
            }

            // Store old values for audit
            $oldValues = [
                'status' => $quote->getStatus()->value,
                'latest_offer' => $quote->getLatestOffer(),
                'round' => $quote->getRound(),
            ];

            // Prepare admin counter offer structure
            $adminCounterOfferData = [
                'items' => $command->items,
                'total_counter' => $command->adminCounterOffer,
                'notes' => $command->notes,
            ];

            // Admin counter offer using domain entity method
            $quote->adminCounterOffer(
                $adminCounterOfferData,
                $command->notes,
                $command->userId
            );

            // Save quote
            $this->quoteRepository->save($quote);

            // Store new values for audit
            $newValues = [
                'status' => $quote->getStatus()->value,
                'latest_offer' => $quote->getLatestOffer(),
                'admin_counter_offer' => $command->adminCounterOffer,
                'round' => $quote->getRound(),
            ];

            // Create audit log
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'admin_counter_offer',
                entityType: 'quote',
                entityId: $quote->getId(),
                userId: $command->userId,
                metadata: [
                    'quote_uuid' => $quote->getUuid(),
                    'user_type' => 'admin',
                    'action_type' => 'admin_counter_offer',
                    'resource_type' => 'quote',
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'user_agent' => $command->userAgent,
                    'admin_counter_offer' => $command->adminCounterOffer,
                    'items' => $command->items,
                    'notes' => $command->notes,
                ],
                ipAddress: $command->ipAddress
            );

            // Dispatch domain events
            foreach ($quote->getDomainEvents() as $event) {
                Event::dispatch($event);
            }
            $quote->clearDomainEvents();

            return [
                'quote_uuid' => $quote->getUuid(),
                'status' => $quote->getStatus()->value,
                'admin_counter_offer' => $command->adminCounterOffer,
                'latest_offer' => $quote->getLatestOffer(),
                'round' => $quote->getRound(),
                'sent_at' => now()->toDateTimeString(),
            ];
        });
    }
}
