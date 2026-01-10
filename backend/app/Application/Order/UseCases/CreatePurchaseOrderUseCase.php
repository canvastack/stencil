<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\ValueObjects\OrderNumber;
use App\Domain\Order\ValueObjects\OrderTotal;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class CreatePurchaseOrderUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(CreatePurchaseOrderCommand $command): Order
    {
        $this->validateInput($command);
        
        $tenantId = new UuidValueObject($command->tenantId);
        $customerId = new UuidValueObject($command->customerId);

        $orderNumber = new OrderNumber($command->orderNumber);

        if ($this->orderRepository->existsByOrderNumber($tenantId, $orderNumber)) {
            throw new InvalidArgumentException("Order number '{$command->orderNumber}' already exists");
        }

        $orderTotal = new OrderTotal($command->totalAmount, $command->currency);

        $order = new Order(
            id: new UuidValueObject($command->id),
            tenantId: $tenantId,
            customerId: $customerId,
            orderNumber: $orderNumber,
            total: $orderTotal,
            status: OrderStatus::PENDING,
            items: $command->items,
            shippingAddress: $command->shippingAddress,
            billingAddress: $command->billingAddress,
            notes: $command->notes,
        );

        $savedOrder = $this->orderRepository->save($order);

        $eloquentOrder = new \App\Infrastructure\Persistence\Eloquent\Models\Order($savedOrder->toArray());
        $eloquentOrder->exists = true;
        
        OrderCreated::dispatch($eloquentOrder);

        return $savedOrder;
    }

    private function validateInput(CreatePurchaseOrderCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->customerId)) {
            throw new InvalidArgumentException('Customer ID is required');
        }

        if ($command->totalAmount < 0) {
            throw new InvalidArgumentException('Total amount must be non-negative');
        }

        if (empty($command->currency)) {
            throw new InvalidArgumentException('Currency is required');
        }

        if (!is_array($command->items) || empty($command->items)) {
            throw new InvalidArgumentException('Order must contain at least one item');
        }

        foreach ($command->items as $item) {
            if (!isset($item['product_id'], $item['quantity'], $item['unit_price'])) {
                throw new InvalidArgumentException('Each item must have product_id, quantity, and unit_price');
            }

            if ($item['quantity'] <= 0) {
                throw new InvalidArgumentException('Item quantity must be greater than zero');
            }

            if ($item['unit_price'] < 0) {
                throw new InvalidArgumentException('Item unit price must be non-negative');
            }
        }
    }
}
