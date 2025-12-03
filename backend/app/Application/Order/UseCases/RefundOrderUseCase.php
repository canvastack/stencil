<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\RefundOrderCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class RefundOrderUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(RefundOrderCommand $command): Order
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

        if (!$order->getStatus()->canBeRefunded()) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow refund"
            );
        }

        if ($command->refundAmount < 0) {
            throw new InvalidArgumentException('Refund amount must be non-negative');
        }

        $order->updateStatus(OrderStatus::REFUNDED);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(RefundOrderCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }
    }
}
