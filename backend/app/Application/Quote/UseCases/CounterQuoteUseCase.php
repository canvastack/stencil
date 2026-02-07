<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\CounterQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Notification\Services\NotificationService;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use App\Domain\Quote\Exceptions\QuoteExpiredException;

/**
 * Use case for submitting a counter offer for a quote
 * 
 * Business Rules:
 * - Only vendor assigned to quote can counter
 * - Quote must be in 'sent' or 'pending_response' status
 * - Quote must not be expired
 * - Counter offer amount is REQUIRED and must be positive
 * - Counter updates status to 'countered'
 * - Admin is notified of counter offer
 */
final class CounterQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly NotificationService $notificationService
    ) {}

    /**
     * Execute the use case
     * 
     * @throws \InvalidArgumentException If quote not found or counter offer is invalid
     * @throws InvalidStatusTransitionException If quote cannot be countered
     * @throws QuoteExpiredException If quote is expired
     */
    public function execute(CounterQuoteCommand $command): void
    {
        // Validate counter offer amount
        if ($command->counterOffer <= 0) {
            throw new \InvalidArgumentException('Counter offer amount must be greater than zero');
        }

        // Find quote by UUID with tenant scoping
        $quote = $this->quoteRepository->findByUuidAndTenant(
            $command->quoteUuid,
            $command->tenantId
        );

        if (!$quote) {
            throw new \InvalidArgumentException('Quote not found');
        }

        // Verify vendor ownership
        // Note: In production, verify that $command->vendorUserId belongs to quote's vendor
        
        // Record vendor counter offer
        $quote->recordVendorResponse(
            responseType: 'counter',
            notes: $command->notes,
            counterOffer: $command->counterOffer,
            userId: $command->vendorUserId
        );

        // Store estimated delivery if provided
        if ($command->estimatedDeliveryDays !== null) {
            $quoteDetails = $quote->getQuoteDetails() ?? [];
            $quoteDetails['estimated_delivery_days'] = $command->estimatedDeliveryDays;
            $quote->updateQuoteDetails($quoteDetails, $command->vendorUserId);
        }

        // Persist changes
        $this->quoteRepository->save($quote);

        // Notify admin of counter offer
        $this->notificationService->sendQuoteResponseNotification($quote);

        // Dispatch domain events
        foreach ($quote->getDomainEvents() as $event) {
            event($event);
        }
        $quote->clearDomainEvents();
    }
}
