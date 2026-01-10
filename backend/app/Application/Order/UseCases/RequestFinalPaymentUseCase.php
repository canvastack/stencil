<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\RequestFinalPaymentCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class RequestFinalPaymentUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(RequestFinalPaymentCommand $command): Order
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

        if ($order->getStatus() !== OrderStatus::QUALITY_CONTROL &&
            $order->getStatus() !== OrderStatus::SHIPPING) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow final payment request"
            );
        }

        if ($command->finalAmount < 0) {
            throw new InvalidArgumentException('Final amount must be non-negative');
        }

        $order->updateStatus(OrderStatus::SHIPPING);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(RequestFinalPaymentCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }
    }
}
