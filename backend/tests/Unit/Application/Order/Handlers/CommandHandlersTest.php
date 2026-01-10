<?php

namespace Tests\Unit\Application\Order\Handlers;

use Tests\TestCase;
use App\Application\Order\Handlers\Commands\AssignVendorHandler;
use App\Application\Order\Handlers\Commands\NegotiateWithVendorHandler;
use App\Application\Order\Handlers\Commands\CompleteOrderHandler;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\UseCases\CompleteOrderUseCase;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Application\Order\Commands\CompleteOrderCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Mockery;
use Illuminate\Support\Facades\Event;

class CommandHandlersTest extends TestCase
{
    private OrderRepositoryInterface $orderRepository;
    private VendorRepositoryInterface $vendorRepository;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->vendorRepository = Mockery::mock(VendorRepositoryInterface::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function assign_vendor_handler_delegates_to_use_case(): void
    {
        $useCase = new AssignVendorUseCase(
            $this->orderRepository,
            $this->vendorRepository
        );
        $handler = new AssignVendorHandler($useCase);

        $command = new AssignVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
        );

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getStatus')->andReturn(OrderStatus::VENDOR_SOURCING);
        $mockOrder->shouldReceive('setVendorId')->once()->andReturn($mockOrder);
        $mockOrder->shouldReceive('updateStatus')->andReturn($mockOrder);

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $mockVendor = Mockery::mock(Vendor::class);
        $mockVendor->shouldReceive('getTenantId')->andReturn(new UuidValueObject('550e8400-e29b-41d4-a716-446655440000'));
        $mockVendor->shouldReceive('isAvailable')->andReturn(true);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockVendor);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturn($mockOrder);

        $result = $handler->handle($command);

        $this->assertInstanceOf(Order::class, $result);
    }

    /** @test */
    public function negotiate_with_vendor_handler_delegates_to_use_case(): void
    {
        $useCase = new NegotiateWithVendorUseCase(
            $this->orderRepository,
            $this->vendorRepository
        );
        $handler = new NegotiateWithVendorHandler($useCase);

        $command = new NegotiateWithVendorCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            vendorId: '770e8400-e29b-41d4-a716-446655440002',
            quotedPrice: 50000.00,
            leadTimeInDays: 5,
        );

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getStatus')->andReturn(OrderStatus::VENDOR_NEGOTIATION);
        $mockOrder->shouldReceive('updateStatus')->andReturn($mockOrder);

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $mockVendor = Mockery::mock(Vendor::class);
        $mockVendor->shouldReceive('getTenantId')->andReturn(new UuidValueObject('550e8400-e29b-41d4-a716-446655440000'));
        $mockVendor->shouldReceive('isAvailable')->andReturn(true);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockVendor);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturn($mockOrder);

        $result = $handler->handle($command);

        $this->assertInstanceOf(Order::class, $result);
    }

    /** @test */
    public function complete_order_handler_delegates_to_use_case(): void
    {
        $useCase = new CompleteOrderUseCase($this->orderRepository);
        $handler = new CompleteOrderHandler($useCase);

        $command = new CompleteOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
        );

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getStatus')->andReturn(OrderStatus::SHIPPING);
        $mockOrder->shouldReceive('updateStatus')->andReturn($mockOrder);

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturn($mockOrder);

        $result = $handler->handle($command);

        $this->assertInstanceOf(Order::class, $result);
    }
}