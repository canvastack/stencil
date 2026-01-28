<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use InvalidArgumentException;

class NegotiateWithVendorUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private VendorRepositoryInterface $vendorRepository
    ) {}

    public function execute(NegotiateWithVendorCommand $command): PurchaseOrder
    {
        $this->validateInput($command);
        
        $this->validatePricingAndLeadTime($command);

        $tenantId = new UuidValueObject($command->tenantId);
        $orderId = new UuidValueObject($command->orderId);
        $vendorId = new UuidValueObject($command->vendorId);

        $order = $this->orderRepository->findById($orderId);
        if (!$order) {
            throw new InvalidArgumentException('Order not found');
        }

        if (!$order->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Order belongs to different tenant');
        }

        if ($order->getStatus() !== OrderStatus::VENDOR_NEGOTIATION && 
            $order->getStatus() !== OrderStatus::VENDOR_SOURCING) {
            throw new InvalidArgumentException(
                "Order status '{$order->getStatus()->value}' does not allow negotiation"
            );
        }

        $vendor = $this->vendorRepository->findById($vendorId);
        if (!$vendor) {
            throw new InvalidArgumentException('Vendor not found');
        }

        if ($vendor->getTenantId() && !$vendor->getTenantId()->equals($tenantId)) {
            throw new InvalidArgumentException('Vendor belongs to different tenant');
        }

        // Only change status if not already in vendor negotiation
        if ($order->getStatus() !== OrderStatus::VENDOR_NEGOTIATION) {
            $order->changeStatus(OrderStatus::VENDOR_NEGOTIATION);
        }

        $savedOrder = $this->orderRepository->save($order);

        return $savedOrder;
    }

    private function validateInput(NegotiateWithVendorCommand $command): void
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

    private function validatePricingAndLeadTime(NegotiateWithVendorCommand $command): void
    {
        if ($command->quotedPrice < 0) {
            throw new InvalidArgumentException('Quoted price cannot be negative');
        }

        if ($command->leadTimeInDays <= 0) {
            throw new InvalidArgumentException('Lead time must be greater than 0');
        }
    }
}
