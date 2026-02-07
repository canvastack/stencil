<?php

declare(strict_types=1);

namespace App\Application\Quote\UseCases;

use App\Application\Quote\Commands\CreateQuoteCommand;
use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

/**
 * Use case for creating a new quote
 * 
 * Business Rules:
 * - Order, vendor, and product must exist in the same tenant
 * - Quote is created with initial status 'draft'
 * - Expiration date is set to 30 days from creation (configurable)
 * - QuoteCreatedEvent is dispatched after successful creation
 * 
 * Validates: Requirements 4.1, 4.3
 */
final class CreateQuoteUseCase
{
    public function __construct(
        private readonly QuoteRepositoryInterface $quoteRepository
    ) {}

    /**
     * Execute the use case
     * 
     * @throws \InvalidArgumentException If related entities don't exist
     * @throws \RuntimeException If quote creation fails
     */
    public function execute(CreateQuoteCommand $command): Quote
    {
        // Validate related entities exist and belong to the same tenant
        $this->validateRelatedEntities(
            $command->tenantId,
            $command->orderId,
            $command->vendorId,
            $command->productId
        );

        // Build quote details with product and specifications
        $quoteDetails = [
            'items' => [
                [
                    'product_id' => $command->productId,
                    'quantity' => $command->quantity,
                    'specifications' => $command->specifications,
                    'notes' => $command->notes,
                ]
            ]
        ];

        // Create quote entity with initial status 'draft'
        $quote = Quote::create(
            tenantId: $command->tenantId,
            orderId: $command->orderId,
            vendorId: $command->vendorId,
            productId: $command->productId,
            quantity: $command->quantity,
            specifications: $command->specifications,
            notes: $command->notes,
            initialOffer: null, // Will be set when vendor responds
            quoteDetails: $quoteDetails,
            currency: 'IDR',
            expiresAt: null // Will use default 30 days
        );

        // Persist to database
        $savedQuote = $this->quoteRepository->save($quote);

        // Dispatch domain events
        foreach ($savedQuote->getDomainEvents() as $event) {
            event($event);
        }
        $savedQuote->clearDomainEvents();

        return $savedQuote;
    }

    /**
     * Validate that related entities exist and belong to the same tenant
     * 
     * @throws \InvalidArgumentException If any entity doesn't exist or belongs to different tenant
     */
    private function validateRelatedEntities(
        int $tenantId,
        int $orderId,
        int $vendorId,
        int $productId
    ): void {
        // Validate order exists and belongs to tenant
        $order = Order::where('tenant_id', $tenantId)
            ->where('id', $orderId)
            ->first();

        if (!$order) {
            throw new \InvalidArgumentException(
                "Order with ID {$orderId} not found in tenant {$tenantId}"
            );
        }

        // Validate vendor exists and belongs to tenant
        $vendor = Vendor::where('tenant_id', $tenantId)
            ->where('id', $vendorId)
            ->first();

        if (!$vendor) {
            throw new \InvalidArgumentException(
                "Vendor with ID {$vendorId} not found in tenant {$tenantId}"
            );
        }

        // Validate product exists and belongs to tenant
        $product = Product::where('tenant_id', $tenantId)
            ->where('id', $productId)
            ->first();

        if (!$product) {
            throw new \InvalidArgumentException(
                "Product with ID {$productId} not found in tenant {$tenantId}"
            );
        }
    }
}
