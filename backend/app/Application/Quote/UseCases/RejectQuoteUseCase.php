<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\RejectQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use InvalidArgumentException;

/**
 * RejectQuoteUseCase
 * 
 * Handles vendor rejecting a quote with reason.
 * 
 * Business Rules:
 * - Quote must belong to vendor
 * - Quote must be in respondable status (sent/pending_response)
 * - Quote must not be expired
 * - Rejection reason must not be empty
 * - Updates quote status to rejected
 * - Sets closed_at timestamp
 * - Stores rejection reason in quote_details
 * - Sends notifications to admins
 * - Creates audit log
 * - Dispatches domain events
 * 
 * Requirements: 6.5, 6.6, 6.7, 6.11, 6.12, 6.15, 18.4, 16.3
 */
final class RejectQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Execute quote rejection
     * 
     * @throws InvalidArgumentException If validation fails
     * @return array Quote data after rejection
     */
    public function execute(RejectQuoteCommand $command): array
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
                    'This quote cannot be rejected in its current status: ' . $quote->getStatus()->value
                );
            }

            // Validate rejection reason (Req 6.6)
            if (empty(trim($command->rejectionReason))) {
                throw new InvalidArgumentException('Rejection reason is required and cannot be empty');
            }

            if (strlen($command->rejectionReason) > 500) {
                throw new InvalidArgumentException('Rejection reason cannot exceed 500 characters');
            }

            // Store old values for audit
            $oldValues = [
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'closed_at' => $quote->getClosedAt()?->format('Y-m-d H:i:s'),
            ];

            // Reject quote using domain entity method (Req 6.5, 6.7)
            $quote->reject(
                $command->rejectionReason,
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
                'rejection_reason' => $command->rejectionReason,
            ];

            // Create audit log (Req 16.3)
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'quote_rejected',
                entityType: 'quote',
                entityId: $quote->getId(),
                userId: $command->userId,
                metadata: [
                    'quote_uuid' => $quote->getUuid(),
                    'user_type' => 'vendor',
                    'action_type' => 'quote_rejected',
                    'resource_type' => 'quote',
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'vendor_id' => $command->vendorId,
                    'rejection_reason' => $command->rejectionReason,
                    'user_agent' => $command->userAgent,
                ],
                ipAddress: $command->ipAddress
            );

            // Dispatch domain events (Req 6.15)
            foreach ($quote->getDomainEvents() as $event) {
                Event::dispatch($event);
            }
            $quote->clearDomainEvents();

            // Send notifications to admins (Req 18.4)
            // This will be handled by event listeners
            // Event: QuoteRejected -> Listener: SendQuoteRejectedNotification

            return [
                'quote_uuid' => $quote->getUuid(),
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'rejection_reason' => $command->rejectionReason,
                'closed_at' => $quote->getClosedAt()?->format('Y-m-d H:i:s'),
            ];
        });
    }
}
