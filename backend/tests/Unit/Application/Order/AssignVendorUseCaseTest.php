<?php

namespace Tests\Unit\Application\Order;

use Tests\TestCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\Commands\AssignVendorCommand;
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

class AssignVendorUseCaseTest extends TestCase
{
    private AssignVendorUseCase $useCase;
    private OrderRepositoryInterface $orderRepository;
    private VendorRepositoryInterface $vendorRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->vendorRepository = Mockery::mock(VendorRepositoryInterface::class);
        $this->useCase = new AssignVendorUseCase($this->orderRepository, $this->vendorRepository);
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
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId
        );

        $order = new Order(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($tenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            orderNumber: new OrderNumber('ORD-001'),
            total: new OrderTotal(100000, 'IDR'),
            status: OrderStatus::SOURCING_VENDOR,
            items: []
        );

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
            ->andReturnUsing(function (Order $savedOrder) {
                $this->assertEquals(OrderStatus::VENDOR_NEGOTIATION, $savedOrder->getStatus());
                return $savedOrder;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals(OrderStatus::VENDOR_NEGOTIATION, $result->getStatus());
    }

    /** @test */
    public function it_fails_when_order_not_found(): void
    {
        $command = new AssignVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002'
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
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId
        );

        $order = new Order(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($otherTenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            orderNumber: new OrderNumber('ORD-001'),
            total: new OrderTotal(100000, 'IDR'),
            status: OrderStatus::SOURCING_VENDOR
        );

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($order);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('different tenant');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_vendor_not_found(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new AssignVendorCommand(
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId
        );

        $order = new Order(
            id: new UuidValueObject($orderId),
            tenantId: new UuidValueObject($tenantId),
            customerId: new UuidValueObject('880e8400-e29b-41d4-a716-446655440003'),
            orderNumber: new OrderNumber('ORD-001'),
            total: new OrderTotal(100000, 'IDR'),
            status: OrderStatus::SOURCING_VENDOR
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

    /** @test */
    public function it_fails_when_order_status_does_not_allow_vendor_assignment(): void
    {
        $tenantId = '550e8400-e29b-41d4-a716-446655440000';
        $orderId = '660e8400-e29b-41d4-a716-446655440001';
        $vendorId = '770e8400-e29b-41d4-a716-446655440002';

        $command = new AssignVendorCommand(
            tenantId: $tenantId,
            orderId: $orderId,
            vendorId: $vendorId
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
        $this->expectExceptionMessage('does not allow vendor assignment');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_tenant_id_is_empty(): void
    {
        $command = new AssignVendorCommand(
            tenantId: '',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002'
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Tenant ID is required');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_order_id_is_empty(): void
    {
        $command = new AssignVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '',
            vendorId: '770e8400-e29b-41d4-a716-446655440002'
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Order ID is required');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_vendor_id_is_empty(): void
    {
        $command = new AssignVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: ''
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor ID is required');

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
