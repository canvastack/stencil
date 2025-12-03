<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\VerifyCustomerPaymentCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class VerifyCustomerPaymentUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(VerifyCustomerPaymentCommand $command): Order
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

        if ($order->getStatus() !== OrderStatus::WAITING_PAYMENT) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow payment verification"
            );
        }

        if ($command->paidAmount < 0) {
            throw new InvalidArgumentException('Paid amount must be non-negative');
        }

        $order->updateStatus(OrderStatus::PAYMENT_RECEIVED);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(VerifyCustomerPaymentCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }

        if (empty($command->paymentMethod)) {
            throw new InvalidArgumentException('Payment method is required');
        }
    }
}
