<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\CreateCustomerQuoteCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class CreateCustomerQuoteUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function execute(CreateCustomerQuoteCommand $command): Order
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

        if ($order->getStatus() !== OrderStatus::VENDOR_NEGOTIATION) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow quote creation"
            );
        }

        $order->updateStatus(OrderStatus::CUSTOMER_QUOTE);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(CreateCustomerQuoteCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }

        if ($command->quotePrice < 0) {
            throw new InvalidArgumentException('Quote price must be non-negative');
        }

        if ($command->validityDaysInDays <= 0) {
            throw new InvalidArgumentException('Validity period must be greater than zero');
        }
    }
}
