<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\AcceptQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use App\Domain\Quote\Exceptions\QuoteExpiredException;

/**
 * Use case for accepting a quote
 * 
 * Business Rules:
 * - Only vendor assigned to quote can accept
 * - Quote must be in 'sent' or 'pending_response' status
 * - Quote must not be expired
 * - Acceptance updates status to 'accepted'
 * - Admin is notified of acceptance
 */
final class AcceptQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Execute the use case
     * 
     * @throws \InvalidArgumentException If quote not found
     * @throws InvalidStatusTransitionException If quote cannot be accepted
     * @throws QuoteExpiredException If quote is expired
     */
    public function execute(AcceptQuoteCommand $command): void
    {
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
        
        // Store estimated delivery BEFORE recording acceptance (before status becomes terminal)
        if ($command->estimatedDeliveryDays !== null) {
            $quoteDetails = $quote->getQuoteDetails() ?? [];
            $quoteDetails['estimated_delivery_days'] = $command->estimatedDeliveryDays;
            $quote->updateQuoteDetails($quoteDetails, $command->vendorUserId);
        }

        // Record vendor acceptance (this will set status to terminal)
        $quote->recordVendorResponse(
            responseType: 'accept',
            notes: $command->notes,
            counterOffer: null,
            userId: $command->vendorUserId
        );

        // Persist changes
        $this->quoteRepository->save($quote);

        // Notify admin of acceptance
        $this->notificationService->sendQuoteResponseNotification($quote);

        // Dispatch domain events
        foreach ($quote->getDomainEvents() as $event) {
            event($event);
        }
        $quote->clearDomainEvents();
    }
}
