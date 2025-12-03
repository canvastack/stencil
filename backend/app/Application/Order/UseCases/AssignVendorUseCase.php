<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\AssignVendorCommand;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class AssignVendorUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private VendorRepositoryInterface $vendorRepository
    ) {}

    public function execute(AssignVendorCommand $command): Order
    {
        $this->validateInput($command);

        $tenantId = new UuidValueObject($command->tenantId);
        $orderId = new UuidValueObject($command->orderId);
        $vendorId = new UuidValueObject($command->vendorId);

        $order = $this->orderRepository->findById($orderId);
        if (!$order) {
            throw new InvalidArgumentException("Order not found with ID: {$command->orderId}");
        }

        if (!$order->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Order belongs to different tenant');
        }

        if (!$order->getStatus()->requiresVendor()) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow vendor assignment"
            );
        }

        $vendor = $this->vendorRepository->findById($vendorId);
        if (!$vendor) {
            throw new InvalidArgumentException("Vendor not found with ID: {$command->vendorId}");
        }

        if ($vendor->getTenantId() && !$vendor->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Vendor belongs to different tenant');
        }

        $order->updateStatus(OrderStatus::VENDOR_NEGOTIATION);

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(AssignVendorCommand $command): void
    {
        if (empty($command->tenantId)) {
            throw new InvalidArgumentException('Tenant ID is required');
        }

        if (empty($command->orderId)) {
            throw new InvalidArgumentException('Order ID is required');
        }

        if (empty($command->vendorId)) {
            throw new InvalidArgumentException('Vendor ID is required');
        }
    }
}
