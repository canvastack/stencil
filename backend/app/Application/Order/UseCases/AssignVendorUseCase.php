<?php

namespace App\Application\Order\UseCases;

use App\Application\Order\Commands\AssignVendorCommand;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Order\Events\VendorAssigned;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use InvalidArgumentException;

/**
 * Assign Vendor Use Case
 * 
 * Handles the business logic for assigning vendors to orders.
 * Validates vendor capabilities and creates negotiation records.
 * 
 * Database Integration:
 * - Updates orders.vendor_id field
 * - Creates record in order_vendor_negotiations table
 * - Updates order status to vendor_negotiation
 */
class AssignVendorUseCase
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository,
        private VendorRepositoryInterface $vendorRepository,
        private EventDispatcher $eventDispatcher
    ) {}

    /**
     * Execute the use case
     */
    public function execute(AssignVendorCommand $command): PurchaseOrder
    {
        // 1. Validate command
        $errors = $command->validate();
        if (!empty($errors)) {
            throw new InvalidArgumentException('Validation failed: ' . implode(', ', $errors));
        }

        // 2. Find and validate order
        $orderUuid = new UuidValueObject($command->orderUuid);
        $order = $this->orderRepository->findById($orderUuid);
        
        if (!$order) {
            throw new InvalidArgumentException('Order not found');
        }

        // 3. Validate order status allows vendor assignment
        if (!$order->canAssignVendor()) {
            throw new InvalidArgumentException(
                "Order status {$order->getStatus()->value} does not allow vendor assignment"
            );
        }

        // 4. Find and validate vendor
        $vendorUuid = new UuidValueObject($command->vendorUuid);
        $vendor = $this->vendorRepository->findById($vendorUuid);
        
        if (!$vendor) {
            throw new InvalidArgumentException('Vendor not found');
        }

        // 5. Validate vendor belongs to same tenant
        if (!$vendor->getTenantId()->equals($order->getTenantId())) {
            throw new InvalidArgumentException('Vendor does not belong to this tenant');
        }

        // 6. Validate vendor is active
        if (!$vendor->isActive()) {
            throw new InvalidArgumentException('Vendor is not active');
        }

        // 7. Create vendor quote
        $quotedPrice = Money::fromCents($command->quotedPrice);
        $vendorQuote = $this->createVendorQuote(
            $command,
            $quotedPrice,
            $vendor
        );

        // 8. Assign vendor to order
        $order->assignVendor($vendorUuid, $vendorQuote);

        // 9. Save order
        $savedOrder = $this->orderRepository->save($order);

        // 10. Dispatch domain events
        $this->eventDispatcher->dispatch(new VendorAssigned(
            $savedOrder,
            $vendorUuid,
            $vendorQuote
        ));

        return $savedOrder;
    }

    /**
     * Create vendor quote object
     */
    private function createVendorQuote(
        AssignVendorCommand $command,
        Money $quotedPrice,
        $vendor
    ): array {
        return [
            'vendor_id' => $command->vendorUuid,
            'vendor_name' => $vendor->getName(),
            'quoted_price' => $quotedPrice->getAmountInCents(),
            'currency' => $quotedPrice->getCurrency(),
            'lead_time_days' => $command->leadTimeDays,
            'estimated_delivery' => $command->getEstimatedDeliveryDate(),
            'terms' => $command->getNegotiationTerms(),
            'quote_date' => now()->toISOString(),
            'status' => 'pending_acceptance',
            'notes' => $command->notes,
            'vendor_rating' => $vendor->getRating(),
            'vendor_specializations' => $vendor->getSpecializations(),
        ];
    }

    /**
     * Validate vendor capabilities against order requirements
     */
    private function validateVendorCapabilities($vendor, PurchaseOrder $order): bool
    {
        // Check if vendor has required specializations
        $orderRequirements = $order->getSpecifications();
        $vendorSpecializations = $vendor->getSpecializations();

        // PT CEX business rule: vendor must have etching capability
        if (!in_array('etching', $vendorSpecializations)) {
            return false;
        }

        // Check material capabilities
        if (isset($orderRequirements['material'])) {
            $requiredMaterial = $orderRequirements['material'];
            $vendorMaterials = $vendor->getSupportedMaterials();
            
            if (!in_array($requiredMaterial, $vendorMaterials)) {
                return false;
            }
        }

        // Check minimum order value
        $vendorMinOrder = $vendor->getMinimumOrderValue();
        if ($vendorMinOrder && $order->getTotalAmount()->isLessThan($vendorMinOrder)) {
            return false;
        }

        return true;
    }
}