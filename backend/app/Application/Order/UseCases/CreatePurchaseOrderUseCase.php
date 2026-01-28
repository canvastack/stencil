<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Domain\Order\Events\OrderCreated;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use InvalidArgumentException;

/**
 * Create Purchase Order Use Case
 * 
 * Handles the business logic for creating new purchase orders.
 * Validates business rules and coordinates domain entities.
 * 
 * Database Integration:
 * - Creates record in orders table
 * - Validates customer exists
 * - Generates unique order number
 * - Dispatches domain events
 */
class CreatePurchaseOrderUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private CustomerRepositoryInterface $customerRepository,
        private EventDispatcher $eventDispatcher
    ) {}

    /**
     * Execute the use case
     */
    public function execute(CreatePurchaseOrderCommand $command): PurchaseOrder
    {
        // 1. Validate command
        $errors = $command->validate();
        if (!empty($errors)) {
            throw new InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // 2. Validate tenant and customer exist
        $tenantId = new UuidValueObject($command->tenantId);
        $customerId = new UuidValueObject($command->customerId);
        
        $customer = $this->customerRepository->findById($customerId);
        if (!$customer) {
            throw new InvalidArgumentException('Customer not found');
        }

        // 3. Validate customer belongs to tenant
        if (!$customer->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Customer does not belong to this tenant');
        }

        // 4. Generate unique order number
        $orderNumber = $this->generateOrderNumber($tenantId);

        // 5. Create value objects
        $totalAmount = Money::fromCents($command->getTotalAmountInCents());
        $deliveryAddress = Address::fromArray(json_decode($command->getDeliveryAddress(), true));
        $billingAddress = $command->billingAddress 
            ? Address::fromArray(json_decode($command->billingAddress, true))
            : $deliveryAddress;

        // 6. Create timeline for order
        $requiredDeliveryDate = new \DateTimeImmutable($command->getRequiredDeliveryDate());
        $estimatedDays = $this->calculateEstimatedDays($command->items);
        $timeline = Timeline::forOrderProduction(
            new \DateTimeImmutable(),
            $estimatedDays
        );

        // 7. Create order entity
        $order = PurchaseOrder::create(
            tenantId: $tenantId,
            customerId: $customerId,
            orderNumber: $orderNumber,
            items: $command->getValidatedItems(),
            totalAmount: $totalAmount,
            deliveryAddress: $deliveryAddress,
            billingAddress: $billingAddress,
            requiredDeliveryDate: $requiredDeliveryDate,
            customerNotes: $command->customerNotes,
            specifications: $command->specifications,
            timeline: $timeline,
            metadata: $command->metadata
        );

        // 8. Save order
        $savedOrder = $this->orderRepository->save($order);

        // 9. Dispatch domain events
        $this->eventDispatcher->dispatch(new OrderCreated($savedOrder));

        return $savedOrder;
    }

    /**
     * Generate unique order number for tenant
     */
    private function generateOrderNumber(UuidValueObject $tenantId): string
    {
        $prefix = 'ORD';
        $date = date('Ymd');
        
        // Use microseconds and random suffix for uniqueness
        $microtime = substr(microtime(), 2, 6);
        $randomSuffix = strtoupper(substr(uniqid(), -4));
        
        $orderNumber = sprintf('%s-%s-%s-%s', $prefix, $date, $microtime, $randomSuffix);
        
        // Double-check uniqueness (very unlikely to collide with this format)
        $exists = $this->orderRepository->existsByOrderNumber($tenantId, $orderNumber);
        if ($exists) {
            // Fallback to UUID-based if somehow collision occurs
            $uuidSuffix = strtoupper(substr(str_replace('-', '', UuidValueObject::generate()->getValue()), -8));
            $orderNumber = sprintf('%s-%s-%s', $prefix, $date, $uuidSuffix);
        }

        return $orderNumber;
    }

    /**
     * Calculate estimated production days based on items
     */
    private function calculateEstimatedDays(array $items): int
    {
        $baseDays = 7; // Base production time
        $complexityDays = 0;

        foreach ($items as $item) {
            // Add complexity based on customization
            if (!empty($item['customization'])) {
                $complexityDays += 2;
            }

            // Add time based on quantity
            $quantity = $item['quantity'] ?? 1;
            if ($quantity > 10) {
                $complexityDays += ceil($quantity / 10);
            }
        }

        // PT CEX business rule: minimum 5 days, maximum 30 days
        return min(max($baseDays + $complexityDays, 5), 30);
    }
}