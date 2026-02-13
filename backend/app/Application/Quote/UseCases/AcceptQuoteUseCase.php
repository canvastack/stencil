<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\AcceptQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use InvalidArgumentException;

/**
 * AcceptQuoteUseCase
 * 
 * Handles vendor accepting a quote with delivery estimate.
 * 
 * Business Rules:
 * - Quote must belong to vendor
 * - Quote must be in respondable status (sent/pending_response)
 * - Quote must not be expired
 * - Estimated delivery days must be positive
 * - Updates quote status to accepted
 * - Sets closed_at timestamp
 * - Stores delivery estimate in quote_details
 * - Sends notifications to admins
 * - Creates audit log
 * - Dispatches domain events
 * 
 * Requirements: 6.2, 6.3, 6.4, 6.11, 6.12, 6.15, 18.3, 16.3
 */
final class AcceptQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Execute quote acceptance
     * 
     * @throws InvalidArgumentException If validation fails
     * @return array Quote data after acceptance
     */
    public function execute(AcceptQuoteCommand $command): array
    {
        return DB::transaction(function () use ($command) {
            // Load quote with tenant scoping
            $quote = $this->quoteRepository->findByUuid($command->quoteUuid, $command->tenantId);
            
            if (!$quote) {
                throw new InvalidArgumentException('Quote not found');
            }

            // Validate vendor ownership (Req 6.13)
            if ($quote->getVendorId() !== $command->vendorId) {
                throw new InvalidArgumentException('You do not have permission to respond to this quote');
            }

            // Validate quote can be responded to (Req 6.14)
            if (!$quote->canRespond()) {
                if ($quote->isExpired()) {
                    throw new QuoteExpiredException('This quote has expired and can no longer be responded to');
                }
                
                throw new InvalidStatusTransitionException(
                    'This quote cannot be accepted in its current status: ' . $quote->getStatus()->value
                );
            }

            // Validate estimated delivery days (Req 6.3)
            if ($command->estimatedDeliveryDays <= 0) {
                throw new InvalidArgumentException('Estimated delivery days must be a positive number');
            }

            // Store old values for audit
            $oldValues = [
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'closed_at' => $quote->getClosedAt()?->format('Y-m-d H:i:s'),
            ];

            // Accept quote using domain entity method (Req 6.2, 6.4)
            $quote->accept(
                $command->estimatedDeliveryDays,
                $command->notes,
                $command->userId
            );

            // Save quote
            $this->quoteRepository->save($quote);

            // Store new values for audit
            $newValues = [
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'closed_at' => $quote->getClosedAt()?->format('Y-m-d H:i:s'),
                'estimated_delivery_days' => $command->estimatedDeliveryDays,
            ];

            // Create audit log (Req 16.3)
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'quote_accepted',
                entityType: 'quote',
                entityId: $quote->getId(),
                userId: $command->userId,
                metadata: [
                    'quote_uuid' => $quote->getUuid(),
                    'user_type' => 'vendor',
                    'action_type' => 'quote_accepted',
                    'resource_type' => 'quote',
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'user_agent' => $command->userAgent,
                    'vendor_id' => $command->vendorId,
                    'estimated_delivery_days' => $command->estimatedDeliveryDays,
                    'notes' => $command->notes,
                ],
                ipAddress: $command->ipAddress
            );

            // Dispatch domain events (Req 6.15)
            foreach ($quote->getDomainEvents() as $event) {
                Event::dispatch($event);
            }
            $quote->clearDomainEvents();

            // Send notifications to admins (Req 18.3)
            // This will be handled by event listeners
            // Event: QuoteAccepted -> Listener: SendQuoteAcceptedNotification

            return [
                'quote_uuid' => $quote->getUuid(),
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'estimated_delivery_days' => $command->estimatedDeliveryDays,
                'notes' => $command->notes,
                'closed_at' => $quote->getClosedAt()?->format('Y-m-d H:i:s'),
            ];
        });
    }
}
