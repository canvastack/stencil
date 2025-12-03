<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\ShipOrderCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class ShipOrderUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(ShipOrderCommand $command): Order
    {
        $this->validateInput($command);

        $tenantId = new UuidValueObject($command->tenantId);
        $orderId = new UuidValueObject($command->orderId);

        $order = $this->orderRepository->findById($orderId);
        if (!$order) {
            throw new InvalidArgumentException("Order not found with ID: {$command->orderId}");
        }

        if (!$order->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Order belongs to different tenant');
        }

        if ($order->getStatus() !== OrderStatus::READY_TO_SHIP) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow shipping"
            );
        }

        $order->updateStatus(OrderStatus::SHIPPED);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(ShipOrderCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }

        if (empty($command->trackingNumber)) {
            throw new InvalidArgumentException('Tracking number is required');
        }

        if (empty($command->shippingProvider)) {
            throw new InvalidArgumentException('Shipping provider is required');
        }
    }
}
