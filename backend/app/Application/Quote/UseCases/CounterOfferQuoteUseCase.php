<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\CounterOfferQuoteCommand;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Domain\Quote\Exceptions\QuoteExpiredException;
use App\Domain\Quote\Exceptions\InvalidStatusTransitionException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use InvalidArgumentException;

/**
 * CounterOfferQuoteUseCase
 * 
 * Handles vendor submitting a counter offer on a quote.
 * Supports item-by-item pricing with detailed breakdown.
 * 
 * Business Rules:
 * - Quote must belong to vendor
 * - Quote must be in respondable status (sent/pending_response/countered)
 * - Quote must not be expired
 * - All items in counter offer must exist in original quote
 * - Counter offer prices must be positive
 * - Updates quote status to countered
 * - Increments round number
 * - Updates latest_offer to total counter amount
 * - Does NOT set closed_at (negotiation continues)
 * - Stores detailed counter offer in quote_details
 * - Sends notifications to admins
 * - Creates audit log
 * - Dispatches domain events
 * 
 * Requirements: 6.8, 6.9, 6.10, 6.11, 6.12, 6.15, 18.5, 16.3
 */
final class CounterOfferQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository,
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Execute counter offer submission
     * 
     * @throws InvalidArgumentException If validation fails
     * @return array Quote data after counter offer
     */
    public function execute(CounterOfferQuoteCommand $command): array
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

            // Validate quote can be countered (Req 6.14)
            // Use canCounter() which checks both canRespond() AND max rounds
            if (!$quote->canCounter()) {
                if ($quote->isExpired()) {
                    throw new QuoteExpiredException('This quote has expired and can no longer be responded to');
                }
                
                // Check if at max rounds
                $quoteDetails = $quote->getQuoteDetails() ?? [];
                $maxRounds = $quoteDetails['max_rounds'] ?? 5;
                if ($quote->getRound() >= $maxRounds) {
                    throw new InvalidStatusTransitionException(
                        'Maximum negotiation rounds reached. You can only accept or reject at this point.'
                    );
                }
                
                throw new InvalidStatusTransitionException(
                    'This quote cannot receive a counter offer in its current status: ' . $quote->getStatus()->value
                );
            }

            // Get quote details to access original items
            $quoteDetails = $quote->getQuoteDetails() ?? [];
            $originalItems = $quoteDetails['items'] ?? [];
            
            if (empty($originalItems)) {
                throw new InvalidArgumentException('Quote has no items to counter offer');
            }

            // Validate and process counter offer items
            $counterOfferItems = $this->processCounterOfferItems(
                $command->items,
                $originalItems
            );

            // Calculate total counter offer amount
            $totalCounterAmount = array_sum(array_column($counterOfferItems, 'counter_total_price'));

            // Validate total is positive
            if ($totalCounterAmount <= 0) {
                throw new InvalidArgumentException('Total counter offer amount must be greater than 0');
            }

            // Store old values for audit
            $oldValues = [
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'latest_offer' => $quote->getLatestOffer(),
                'round' => $quote->getRound(),
            ];

            // Submit counter offer using domain entity method (Req 6.8, 6.10)
            $quote->counterOffer(
                $totalCounterAmount,
                $command->notes,
                $command->userId
            );

            // Store detailed counter offer in quote_details
            $quoteDetails['counter_offer'] = [
                'items' => $counterOfferItems,
                'total_counter' => $totalCounterAmount,
                'notes' => $command->notes,
                'estimated_delivery_days' => $command->estimatedDeliveryDays,
                'submitted_at' => now()->toIso8601String(),
            ];
            
            $quote->updateQuoteDetails($quoteDetails, $command->userId);

            // Save quote
            $this->quoteRepository->save($quote);

            // Store new values for audit
            $newValues = [
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'latest_offer' => $quote->getLatestOffer(),
                'round' => $quote->getRound(),
                'counter_offer_total' => $totalCounterAmount,
                'counter_offer_items_count' => count($counterOfferItems),
            ];

            // Create audit log (Req 16.3)
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'quote_counter_offer',
                entityType: 'quote',
                entityId: $quote->getId(),
                userId: $command->userId,
                metadata: [
                    'quote_uuid' => $quote->getUuid(),
                    'user_type' => 'vendor',
                    'action_type' => 'quote_counter_offer',
                    'resource_type' => 'quote',
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'vendor_id' => $command->vendorId,
                    'counter_offer_details' => [
                        'items' => $counterOfferItems,
                        'total' => $totalCounterAmount,
                        'notes' => $command->notes,
                        'estimated_delivery_days' => $command->estimatedDeliveryDays,
                    ],
                    'round' => $quote->getRound(),
                    'user_agent' => $command->userAgent,
                ],
                ipAddress: $command->ipAddress
            );

            // Dispatch domain events (Req 6.15)
            foreach ($quote->getDomainEvents() as $event) {
                Event::dispatch($event);
            }
            $quote->clearDomainEvents();

            // Send notifications to admins (Req 18.5)
            // This will be handled by event listeners
            // Event: QuoteCountered -> Listener: SendQuoteCounterOfferNotification

            return [
                'quote_uuid' => $quote->getUuid(),
                'status' => $quote->getStatus()->value,
                'responded_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
                'response_type' => $quote->getResponseType(),
                'counter_offer_details' => [
                    'items' => $counterOfferItems,
                    'total_counter' => $totalCounterAmount,
                    'notes' => $command->notes,
                    'estimated_delivery_days' => $command->estimatedDeliveryDays,
                ],
                'latest_offer' => $quote->getLatestOffer(),
                'round' => $quote->getRound(),
                'closed_at' => $quote->getClosedAt()?->format('Y-m-d H:i:s'), // Should be null
            ];
        });
    }

    /**
     * Process and validate counter offer items
     * 
     * SECURITY: Uses vendor_cost as original price, NOT unit_price (customer pricing)
     * 
     * @param array<int, array{product_id: string, counter_unit_price: float, notes?: string}> $counterItems
     * @param array<int, array{product_id: string, description: string, quantity: int, vendor_cost: int, total_vendor_cost: int}> $originalItems
     * @return array<int, array{product_id: string, product_name: string, quantity: int, original_unit_price: int, counter_unit_price: int, counter_total_price: int, notes?: string}>
     */
    private function processCounterOfferItems(array $counterItems, array $originalItems): array
    {
        // Create lookup map for original items
        $originalItemsMap = [];
        foreach ($originalItems as $item) {
            $originalItemsMap[$item['product_id']] = $item;
        }

        $processedItems = [];

        foreach ($counterItems as $counterItem) {
            $productId = $counterItem['product_id'];
            
            // Validate product exists in original quote
            if (!isset($originalItemsMap[$productId])) {
                throw new InvalidArgumentException("Product ID {$productId} not found in original quote");
            }

            $originalItem = $originalItemsMap[$productId];
            
            // Validate counter price is positive
            $counterUnitPrice = (int) round($counterItem['counter_unit_price']);
            if ($counterUnitPrice <= 0) {
                throw new InvalidArgumentException("Counter price for product {$productId} must be greater than 0");
            }

            // Calculate counter total price
            $quantity = $originalItem['quantity'];
            $counterTotalPrice = $counterUnitPrice * $quantity;

            $processedItems[] = [
                'product_id' => $productId,
                'product_name' => $originalItem['description'] ?? 'Unknown Product',
                'quantity' => $quantity,
                // SECURITY: Use vendor_cost as original price, NOT unit_price (customer pricing)
                'original_unit_price' => $originalItem['vendor_cost'] ?? 0,
                'original_total_price' => $originalItem['total_vendor_cost'] ?? 0,
                'counter_unit_price' => $counterUnitPrice,
                'counter_total_price' => $counterTotalPrice,
                'difference_amount' => $counterTotalPrice - ($originalItem['total_vendor_cost'] ?? 0),
                'notes' => $counterItem['notes'] ?? null,
            ];
        }

        // Validate all original items have counter offers
        if (count($processedItems) !== count($originalItems)) {
            throw new InvalidArgumentException('All items in the quote must have counter offers');
        }

        return $processedItems;
    }
}
