<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\HandleCustomerApprovalCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class HandleCustomerApprovalUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(HandleCustomerApprovalCommand $command): Order
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

        if ($order->getStatus() !== OrderStatus::CUSTOMER_QUOTE) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow approval handling"
            );
        }

        $newStatus = $command->approved ? OrderStatus::AWAITING_PAYMENT : OrderStatus::VENDOR_NEGOTIATION;
        $order->updateStatus($newStatus);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(HandleCustomerApprovalCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }
    }
}
