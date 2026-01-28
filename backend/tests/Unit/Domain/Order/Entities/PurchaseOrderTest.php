<?php

namespace Tests\Unit\Domain\Order\Entities;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Events\OrderStatusChanged;
use DateTimeImmutable;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class PurchaseOrderTest extends TestCase
{
    private UuidValueObject $tenantId;
    private UuidValueObject $customerId;
    private UuidValueObject $vendorId;
    private array $items;
    private Money $totalAmount;
    private Address $deliveryAddress;
    private Address $billingAddress;
    private DateTimeImmutable $requiredDeliveryDate;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = UuidValueObject::generate();
        $this->customerId = UuidValueObject::generate();
        $this->vendorId = UuidValueObject::generate();
        
        $this->items = [
            [
                'product_id' => 'prod-123',
                'quantity' => 2,
                'unit_price' => 50000, // 500.00 IDR in cents
                'total_price' => 100000, // 1000.00 IDR in cents
                'specifications' => ['material' => 'steel'],
                'customization' => ['engraving' => 'Custom text'],
            ]
        ];
        
        $this->totalAmount = Money::fromCents(100000); // 1000.00 IDR
        
        $this->deliveryAddress = new Address(
            'Jl. Sudirman No. 123',
            'Jakarta Pusat',
            'DKI Jakarta',
            '10220',
            'ID'
        );
        
        $this->billingAddress = new Address(
            'Jl. Thamrin No. 456',
            'Jakarta Pusat',
            'DKI Jakarta',
            '10230',
            'ID'
        );
        
        $this->requiredDeliveryDate = new DateTimeImmutable('+30 days');
    }

    /** @test */
    public function it_can_create_new_purchase_order()
    {
        // Act
        $order = PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $this->customerId,
            orderNumber: 'ORD-20240101-0001',
            items: $this->items,
            totalAmount: $this->totalAmount,
            deliveryAddress: $this->deliveryAddress,
            billingAddress: $this->billingAddress,
            requiredDeliveryDate: $this->requiredDeliveryDate,
            customerNotes: 'Test order notes',
            specifications: ['urgency' => 'normal'],
            metadata: ['source' => 'web']
        );

        // Assert
        $this->assertInstanceOf(PurchaseOrder::class, $order);
        $this->assertEquals($this->tenantId, $order->getTenantId());
        $this->assertEquals($this->customerId, $order->getCustomerId());
        $this->assertEquals('ORD-20240101-0001', $order->getOrderNumber());
        $this->assertEquals(OrderStatus::PENDING, $order->getStatus());
        $this->assertEquals(PaymentStatus::UNPAID, $order->getPaymentStatus());
        $this->assertTrue($order->getTotalAmount()->equals($this->totalAmount));
        $this->assertEquals($this->items, $order->getItems());
        $this->assertEquals('Test order notes', $order->getCustomerNotes());
        
        // Check domain events
        $events = $order->getDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(OrderCreated::class, $events[0]);
    }

    /** @test */
    public function it_calculates_down_payment_as_50_percent()
    {
        // Act
        $order = $this->createTestOrder();

        // Assert
        $expectedDownPayment = $this->totalAmount->percentage(50);
        $this->assertTrue($order->getDownPaymentAmount()->equals($expectedDownPayment));
    }

    /** @test */
    public function it_can_assign_vendor_when_status_allows()
    {
        // Arrange
        $order = $this->createTestOrder();
        $vendorQuote = [
            'vendor_price' => 80000,
            'delivery_days' => 14,
            'quality_guarantee' => true,
        ];

        // Act
        $order->assignVendor($this->vendorId, $vendorQuote);

        // Assert
        $this->assertEquals($this->vendorId, $order->getVendorId());
        $this->assertEquals(OrderStatus::VENDOR_NEGOTIATION, $order->getStatus());
        
        // Check domain events
        $events = $order->getDomainEvents();
        $this->assertCount(2, $events); // OrderCreated + VendorAssigned
        $this->assertInstanceOf(VendorAssigned::class, $events[1]);
    }

    /** @test */
    public function it_throws_exception_when_assigning_vendor_with_invalid_status()
    {
        // Arrange
        $order = $this->createTestOrder();
        
        // Move to a status that doesn't allow vendor assignment (use valid transition path)
        $order->changeStatus(OrderStatus::VENDOR_SOURCING);
        $order->changeStatus(OrderStatus::CUSTOMER_QUOTE);
        $order->changeStatus(OrderStatus::AWAITING_PAYMENT);
        $order->changeStatus(OrderStatus::FULL_PAYMENT);
        $order->changeStatus(OrderStatus::IN_PRODUCTION);
        
        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot assign vendor to order in status: in_production');
        
        $order->assignVendor($this->vendorId, []);
    }

    /** @test */
    public function it_can_record_payment()
    {
        // Arrange
        $order = $this->createTestOrder();
        
        // Move to payment-accepting status
        $order->changeStatus(OrderStatus::VENDOR_SOURCING);
        $order->changeStatus(OrderStatus::CUSTOMER_QUOTE);
        $order->changeStatus(OrderStatus::AWAITING_PAYMENT);
        
        $paymentAmount = Money::fromCents(50000); // 500.00 IDR (50% down payment)

        // Act
        $order->recordPayment($paymentAmount, 'bank_transfer', 'TXN-123456');

        // Assert
        $this->assertTrue($order->getTotalPaidAmount()->equals($paymentAmount));
        $this->assertEquals(PaymentStatus::PARTIALLY_PAID, $order->getPaymentStatus());
        
        // Check domain events
        $events = $order->getDomainEvents();
        $this->assertCount(6, $events); // OrderCreated + 3 OrderStatusChanged + OrderStatusChanged (partial payment) + PaymentReceived
        $this->assertInstanceOf(PaymentReceived::class, $events[5]);
    }

    /** @test */
    public function it_updates_payment_status_to_paid_when_full_amount_received()
    {
        // Arrange
        $order = $this->createTestOrder();
        $fullPayment = $this->totalAmount;

        // Act
        $order->recordPayment($fullPayment, 'bank_transfer', 'TXN-123456');

        // Assert
        $this->assertTrue($order->getTotalPaidAmount()->equals($this->totalAmount));
        $this->assertEquals(PaymentStatus::PAID, $order->getPaymentStatus());
    }

    /** @test */
    public function it_throws_exception_when_payment_exceeds_remaining_balance()
    {
        // Arrange
        $order = $this->createTestOrder();
        $excessivePayment = Money::fromCents(150000); // More than total amount

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount');
        
        $order->recordPayment($excessivePayment, 'bank_transfer', 'TXN-123456');
    }

    /** @test */
    public function it_throws_exception_when_payment_amount_is_zero_or_negative()
    {
        // Arrange
        $order = $this->createTestOrder();
        $zeroPayment = Money::fromCents(0);

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount must be positive');
        
        $order->recordPayment($zeroPayment, 'bank_transfer', 'TXN-123456');
    }

    /** @test */
    public function it_can_change_status_with_valid_transition()
    {
        // Arrange
        $order = $this->createTestOrder();

        // Act - Use valid transition from PENDING to VENDOR_SOURCING
        $order->changeStatus(OrderStatus::VENDOR_SOURCING, 'Starting vendor sourcing');

        // Assert
        $this->assertEquals(OrderStatus::VENDOR_SOURCING, $order->getStatus());
        
        // Check domain events
        $events = $order->getDomainEvents();
        $this->assertCount(2, $events); // OrderCreated + OrderStatusChanged
        $this->assertInstanceOf(OrderStatusChanged::class, $events[1]);
    }

    /** @test */
    public function it_calculates_remaining_amount_correctly()
    {
        // Arrange
        $order = $this->createTestOrder();
        $partialPayment = Money::fromCents(30000); // 300.00 IDR
        $order->recordPayment($partialPayment, 'bank_transfer', 'TXN-123456');

        // Act
        $remainingAmount = $order->getRemainingAmount();

        // Assert
        $expectedRemaining = Money::fromCents(70000); // 700.00 IDR
        $this->assertTrue($remainingAmount->equals($expectedRemaining));
    }

    /** @test */
    public function it_detects_overdue_orders()
    {
        // Arrange
        $pastDate = new DateTimeImmutable('-5 days');
        $order = PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $this->customerId,
            orderNumber: 'ORD-20240101-0001',
            items: $this->items,
            totalAmount: $this->totalAmount,
            deliveryAddress: $this->deliveryAddress,
            billingAddress: $this->billingAddress,
            requiredDeliveryDate: $pastDate
        );

        // Act & Assert
        $this->assertTrue($order->isOverdue());
    }

    /** @test */
    public function it_does_not_detect_overdue_for_completed_orders()
    {
        // Arrange
        $pastDate = new DateTimeImmutable('-5 days');
        $order = PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $this->customerId,
            orderNumber: 'ORD-20240101-0001',
            items: $this->items,
            totalAmount: $this->totalAmount,
            deliveryAddress: $this->deliveryAddress,
            billingAddress: $this->billingAddress,
            requiredDeliveryDate: $pastDate
        );
        
        // Use valid transition path: PENDING -> VENDOR_SOURCING -> CUSTOMER_QUOTE -> AWAITING_PAYMENT -> FULL_PAYMENT -> IN_PRODUCTION -> QUALITY_CONTROL -> SHIPPING -> COMPLETED
        $order->changeStatus(OrderStatus::VENDOR_SOURCING);
        $order->changeStatus(OrderStatus::CUSTOMER_QUOTE);
        $order->changeStatus(OrderStatus::AWAITING_PAYMENT);
        $order->changeStatus(OrderStatus::FULL_PAYMENT);
        $order->changeStatus(OrderStatus::IN_PRODUCTION);
        $order->changeStatus(OrderStatus::QUALITY_CONTROL);
        $order->changeStatus(OrderStatus::SHIPPING);
        $order->changeStatus(OrderStatus::COMPLETED);

        // Act & Assert
        $this->assertFalse($order->isOverdue());
    }

    /** @test */
    public function it_can_check_vendor_assignment_capability()
    {
        // Arrange
        $order = $this->createTestOrder();

        // Act & Assert
        $this->assertTrue($order->canAssignVendor());
        
        // Change to status that doesn't allow vendor assignment (use valid transition path)
        $order->changeStatus(OrderStatus::VENDOR_SOURCING);
        $order->changeStatus(OrderStatus::CUSTOMER_QUOTE);
        $order->changeStatus(OrderStatus::AWAITING_PAYMENT);
        $order->changeStatus(OrderStatus::FULL_PAYMENT);
        $order->changeStatus(OrderStatus::IN_PRODUCTION);
        $order->changeStatus(OrderStatus::QUALITY_CONTROL);
        $order->changeStatus(OrderStatus::SHIPPING);
        $order->changeStatus(OrderStatus::COMPLETED);
        $this->assertFalse($order->canAssignVendor());
    }

    /** @test */
    public function it_can_check_payment_capability()
    {
        // Arrange
        $order = $this->createTestOrder();
        
        // Move to payment-accepting status
        $order->changeStatus(OrderStatus::VENDOR_SOURCING);
        $order->changeStatus(OrderStatus::CUSTOMER_QUOTE);
        $order->changeStatus(OrderStatus::AWAITING_PAYMENT);

        // Act & Assert
        $this->assertTrue($order->canReceivePayment());
        
        // Pay full amount
        $order->recordPayment($this->totalAmount, 'bank_transfer', 'TXN-123456');
        $this->assertFalse($order->canReceivePayment());
    }

    /** @test */
    public function it_clears_domain_events()
    {
        // Arrange
        $order = $this->createTestOrder();
        $this->assertCount(1, $order->getDomainEvents());

        // Act
        $order->clearDomainEvents();

        // Assert
        $this->assertCount(0, $order->getDomainEvents());
    }

    private function createTestOrder(): PurchaseOrder
    {
        return PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $this->customerId,
            orderNumber: 'ORD-20240101-0001',
            items: $this->items,
            totalAmount: $this->totalAmount,
            deliveryAddress: $this->deliveryAddress,
            billingAddress: $this->billingAddress,
            requiredDeliveryDate: $this->requiredDeliveryDate
        );
    }
}