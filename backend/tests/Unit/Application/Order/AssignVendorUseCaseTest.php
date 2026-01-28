<?php

namespace Tests\Unit\Application\Order;

use Tests\TestCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use Mockery;
use InvalidArgumentException;
use DateTimeImmutable;

class AssignVendorUseCaseTest extends TestCase
{
    private AssignVendorUseCase $useCase;
    private OrderRepositoryInterface $orderRepository;
    private VendorRepositoryInterface $vendorRepository;
    private EventDispatcher $eventDispatcher;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->vendorRepository = Mockery::mock(VendorRepositoryInterface::class);
        $this->eventDispatcher = Mockery::mock(EventDispatcher::class);
        $this->useCase = new AssignVendorUseCase(
            $this->orderRepository, 
            $this->vendorRepository,
            $this->eventDispatcher
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_assigns_vendor_to_order_successfully(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new AssignVendorCommand(
            orderUuid: $orderId,
            vendorUuid: $vendorId,
            quotedPrice: 10000000, // 100,000 IDR in cents
            leadTimeDays: 14
        );

        $order = $this->createMockOrder($orderId, $tenantId, OrderStatus::VENDOR_SOURCING);
        $vendor = $this->createMockVendor($vendorId, $tenantId);

        $this->orderRepository
            ->shouldReceive('findById')
            ->withArgs(function ($idArg) use ($orderId) {
                return $idArg instanceof UuidValueObject && $idArg->getValue() === $orderId;
            })
            ->once()
            ->andReturn($order);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->withArgs(function ($idArg) use ($vendorId) {
                return $idArg instanceof UuidValueObject && $idArg->getValue() === $vendorId;
            })
            ->once()
            ->andReturn($vendor);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (PurchaseOrder $savedOrder) {
                $this->assertEquals(OrderStatus::VENDOR_NEGOTIATION, $savedOrder->getStatus());
                return $savedOrder;
            });

        $this->eventDispatcher
            ->shouldReceive('dispatch')
            ->atLeast()
            ->once();

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(PurchaseOrder::class, $result);
        $this->assertEquals(OrderStatus::VENDOR_NEGOTIATION, $result->getStatus());
    }

    /** @test */
    public function it_fails_when_order_not_found(): void
    {
        $command = new AssignVendorCommand(
            orderUuid: '660e8400-e29b-41d4-a716-446655440001',
            vendorUuid: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 10000000,
            leadTimeDays: 14
        );

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn(null);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Order not found');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_order_belongs_to_different_tenant(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $otherTenantId = '990e8400-e29b-41d4-a716-446655440099';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new AssignVendorCommand(
            orderUuid: $orderId,
            vendorUuid: $vendorId,
            quotedPrice: 10000000,
            leadTimeDays: 14
        );

        $order = $this->createMockOrder($orderId, $otherTenantId, OrderStatus::VENDOR_SOURCING);
        $vendor = $this->createMockVendor($vendorId, $tenantId); // Different tenant

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($order);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($vendor);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor does not belong to this tenant');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_vendor_not_found(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new AssignVendorCommand(
            orderUuid: $orderId,
            vendorUuid: $vendorId,
            quotedPrice: 10000000,
            leadTimeDays: 14
        );

        $order = $this->createMockOrder($orderId, $tenantId, OrderStatus::VENDOR_SOURCING);

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($order);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn(null);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_order_status_does_not_allow_vendor_assignment(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new AssignVendorCommand(
            orderUuid: $orderId,
            vendorUuid: $vendorId,
            quotedPrice: 10000000,
            leadTimeDays: 14
        );

        $order = $this->createMockOrder($orderId, $tenantId, OrderStatus::COMPLETED);

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($order);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('does not allow vendor assignment');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_order_uuid_is_empty(): void
    {
        $command = new AssignVendorCommand(
            orderUuid: '',
            vendorUuid: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 10000000,
            leadTimeDays: 14
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Order UUID is required');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_vendor_uuid_is_empty(): void
    {
        $command = new AssignVendorCommand(
            orderUuid: '660e8400-e29b-41d4-a716-446655440001',
            vendorUuid: '',
            quotedPrice: 10000000,
            leadTimeDays: 14
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor UUID is required');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_quoted_price_is_negative(): void
    {
        $command = new AssignVendorCommand(
            orderUuid: '660e8400-e29b-41d4-a716-446655440001',
            vendorUuid: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: -1000,
            leadTimeDays: 14
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quoted price cannot be negative');

        $this->useCase->execute($command);
    }

    private function createMockOrder(string $orderId, string $tenantId, OrderStatus $status): PurchaseOrder
    {
        return PurchaseOrder::reconstitute(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($tenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            vendorId: null,
            orderNumber: 'ORD-001',
            status: $status,
            paymentStatus: PaymentStatus::UNPAID,
            totalAmount: Money::fromCents(10000000), // 100000 IDR
            downPaymentAmount: Money::fromCents(5000000), // 50000 IDR
            totalPaidAmount: Money::fromCents(0),
            items: [],
            shippingAddress: new Address('Test Street', 'Test City', 'Test State', '12345', 'ID'),
            billingAddress: new Address('Test Street', 'Test City', 'Test State', '12345', 'ID'),
            requiredDeliveryDate: new DateTimeImmutable('+30 days'),
            customerNotes: 'Test notes',
            specifications: [],
            timeline: Timeline::forOrderProduction(new DateTimeImmutable(), 30),
            metadata: [],
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable()
        );
    }

    private function createMockVendor(string $vendorId, string $tenantId): Vendor
    {
        return Vendor::reconstitute(
            id: new UuidValueObject($vendorId),
            tenantId: new UuidValueObject($tenantId),
            name: 'Test Vendor',
            email: 'vendor@test.com',
            phone: '+62123456789',
            company: 'Test Vendor Company',
            address: null,
            contactInfo: null,
            capabilities: ['etching', 'engraving'],
            certifications: [],
            rating: 4.5,
            metadata: [],
            status: 'active',
            createdAt: new DateTimeImmutable(),
            updatedAt: new DateTimeImmutable()
        );
    }
}
