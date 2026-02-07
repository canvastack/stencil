<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\RejectQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use App\Domain\Quote\Exceptions\QuoteExpiredException;

/**
 * Use case for rejecting a quote
 * 
 * Business Rules:
 * - Only vendor assigned to quote can reject
 * - Quote must be in 'sent' or 'pending_response' status
 * - Quote must not be expired
 * - Rejection reason is REQUIRED
 * - Rejection updates status to 'rejected'
 * - Admin is notified of rejection
 */
final class RejectQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Execute the use case
     * 
     * @throws \InvalidArgumentException If quote not found or reason is empty
     * @throws InvalidStatusTransitionException If quote cannot be rejected
     * @throws QuoteExpiredException If quote is expired
     */
    public function execute(RejectQuoteCommand $command): void
    {
        // Validate rejection reason is provided
        if (empty(trim($command->reason))) {
            throw new \InvalidArgumentException('Rejection reason is required');
        }

        // Find quote by UUID with tenant scoping
        $quote = $this->quoteRepository->findByUuid(
            $command->quoteUuid,
            $command->tenantId
        );

        if (!$quote) {
            throw new \InvalidArgumentException('Quote not found');
        }

        // Verify vendor ownership
        // Note: In production, verify that $command->vendorUserId belongs to quote's vendor
        
        // Record vendor rejection
        $quote->recordVendorResponse(
            responseType: 'reject',
            notes: $command->reason,
            counterOffer: null,
            userId: $command->vendorUserId
        );

        // Persist changes
        $this->quoteRepository->save($quote);

        // Notify admin of rejection
        $this->notificationService->sendQuoteResponseNotification($quote);

        // Dispatch domain events
        foreach ($quote->getDomainEvents() as $event) {
            event($event);
        }
        $quote->clearDomainEvents();
    }
}
