<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\UpdateProductionProgressCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class UpdateProductionProgressUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(UpdateProductionProgressCommand $command): Order
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

        if ($order->getStatus() !== OrderStatus::IN_PRODUCTION && 
            $order->getStatus() !== OrderStatus::QUALITY_CHECK) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow production updates"
            );
        }

        if ($command->progressPercentage >= 100) {
            $order->updateStatus(OrderStatus::QUALITY_CHECK);
        }

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(UpdateProductionProgressCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }

        if ($command->progressPercentage < 0 || $command->progressPercentage > 100) {
            throw new InvalidArgumentException('Progress percentage must be between 0 and 100');
        }
    }
}
