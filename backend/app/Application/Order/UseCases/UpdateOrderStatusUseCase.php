<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\UpdateOrderStatusCommand;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Order\Events\OrderStatusChanged;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use InvalidArgumentException;

/**
 * Update Order Status Use Case
 * 
 * Handles the business logic for updating order status.
 * Validates business rules and coordinates domain entities.
 * 
 * Database Integration:
 * - Updates record in orders table
 * - Validates status transitions
 * - Dispatches domain events
 */
class UpdateOrderStatusUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private EventDispatcher $eventDispatcher
    ) {}

    /**
     * Execute the use case
     */
    public function execute(UpdateOrderStatusCommand $command): PurchaseOrder
    {
        // 1. Validate command
        $errors = $command->validate();
        if (!empty($errors)) {
            throw new InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // 2. Find order
        $orderId = new UuidValueObject($command->orderId);
        $order = $this->orderRepository->findById($orderId);
        
        if (!$order) {
            throw new InvalidArgumentException('Order not found');
        }

        // 3. Validate tenant access
        $tenantId = new UuidValueObject($command->tenantId);
        if (!$order->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Order does not belong to this tenant');
        }

        // 4. Parse new status
        $newStatus = OrderStatus::from($command->newStatus);

        // 5. Update order status (domain logic handles validation)
        $order->changeStatus($newStatus, $command->reason);

        // 6. Save order
        $savedOrder = $this->orderRepository->save($order);

        // 7. Dispatch domain events
        foreach ($savedOrder->getDomainEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        // 8. Clear events after dispatching
        $savedOrder->clearDomainEvents();

        return $savedOrder;
    }
}