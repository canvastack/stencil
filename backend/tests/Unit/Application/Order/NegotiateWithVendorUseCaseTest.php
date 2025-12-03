<?php

namespace Tests\Unit\Application\Order;

use Tests\TestCase;
use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\ValueObjects\OrderNumber;
use App\Domain\Order\ValueObjects\OrderTotal;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Vendor\Enums\VendorStatus;
use App\Domain\Vendor\ValueObjects\VendorName;
use App\Domain\Vendor\ValueObjects\VendorEmail;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Mockery;
use InvalidArgumentException;

class NegotiateWithVendorUseCaseTest extends TestCase
{
    private NegotiateWithVendorUseCase $useCase;
    private OrderRepositoryInterface $orderRepository;
    private VendorRepositoryInterface $vendorRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->vendorRepository = Mockery::mock(VendorRepositoryInterface::class);
        $this->useCase = new NegotiateWithVendorUseCase($this->orderRepository, $this->vendorRepository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_negotiates_with_vendor_successfully(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new NegotiateWithVendorCommand(
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId,
            quotedPrice: 85000.00,
            leadTimeInDays: 14
        );

        $order = new Order(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($tenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            orderNumber: new OrderNumber('ORD-001'),
            total: new OrderTotal(100000, 'IDR'),
            status: OrderStatus::VENDOR_NEGOTIATION,
            items: []
        );

        $vendor = $this->createMockVendor($vendorId, $tenantId);

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($order);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($vendor);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (Order $savedOrder) {
                return $savedOrder;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals(OrderStatus::VENDOR_NEGOTIATION, $result->getStatus());
    }

    /** @test */
    public function it_fails_when_order_not_found(): void
    {
        $command = new NegotiateWithVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 85000.00,
            leadTimeInDays: 14
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
    public function it_fails_when_order_status_does_not_allow_negotiation(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';

        $command = new NegotiateWithVendorCommand(
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 85000.00,
            leadTimeInDays: 14
        );

        $order = new Order(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($tenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            orderNumber: new OrderNumber('ORD-001'),
            total: new OrderTotal(100000, 'IDR'),
            status: OrderStatus::COMPLETED
        );

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($order);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('does not allow vendor negotiation');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_quoted_price_is_negative(): void
    {
        $command = new NegotiateWithVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: -85000.00,
            leadTimeInDays: 14
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quoted price must be non-negative');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_lead_time_is_invalid(): void
    {
        $command = new NegotiateWithVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 85000.00,
            leadTimeInDays: 0
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Lead time must be greater than zero');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_vendor_not_found(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';

        $command = new NegotiateWithVendorCommand(
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 85000.00,
            leadTimeInDays: 14
        );

        $order = new Order(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($tenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            orderNumber: new OrderNumber('ORD-001'),
            total: new OrderTotal(100000, 'IDR'),
            status: OrderStatus::VENDOR_NEGOTIATION
        );

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

    private function createMockVendor(string $vendorId, string $tenantId): Vendor
    {
        return new Vendor(
            id: new UuidValueObject($vendorId),
            tenantId: new UuidValueObject($tenantId),
            name: new VendorName('Test Vendor'),
            email: new VendorEmail('vendor@test.com'),
            status: VendorStatus::ACTIVE
        );
    }
}
