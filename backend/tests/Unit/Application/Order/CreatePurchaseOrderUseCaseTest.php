<?php

namespace Tests\Unit\Application\Order;

use Tests\TestCase;
use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Mockery;
use InvalidArgumentException;
use Illuminate\Support\Facades\Event;

class CreatePurchaseOrderUseCaseTest extends TestCase
{
    private CreatePurchaseOrderUseCase $useCase;
    private OrderRepositoryInterface $orderRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        Event::fake();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->useCase = new CreatePurchaseOrderUseCase($this->orderRepository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_creates_order_successfully(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                    'quantity' => 2,
                    'unit_price' => 50000.00,
                ]
            ]
        );

        $this->orderRepository
            ->shouldReceive('existsByOrderNumber')
            ->once()
            ->andReturn(false);

        $savedOrder = null;
        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (Order $order) {
                $this->assertEquals(OrderStatus::PENDING, $order->getStatus());
                $this->assertEquals(100000.00, $order->getTotal()->getAmount());
                $this->assertEquals('IDR', $order->getTotal()->getCurrency());
                return $order;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals(OrderStatus::PENDING, $result->getStatus());
        $this->assertEquals(100000.00, $result->getTotal()->getAmount());
    }

    /** @test */
    public function it_fails_when_order_number_already_exists(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                    'quantity' => 2,
                    'unit_price' => 50000.00,
                ]
            ],
            orderNumber: 'ORD-20241201120000-ABC123'
        );

        $this->orderRepository
            ->shouldReceive('existsByOrderNumber')
            ->once()
            ->andReturn(true);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('already exists');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_tenant_id_is_empty(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
                'unit_price' => 50000.00,
            ]]
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Tenant ID is required');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_customer_id_is_empty(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
                'unit_price' => 50000.00,
            ]]
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Customer ID is required');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_total_amount_is_negative(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: -100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
                'unit_price' => 50000.00,
            ]]
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('must be non-negative');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_items_array_is_empty(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: []
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('at least one item');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_item_missing_required_fields(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
            ]]
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('product_id, quantity, and unit_price');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_item_quantity_is_zero(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 0,
                'unit_price' => 50000.00,
            ]]
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('quantity must be greater than zero');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_fails_when_item_unit_price_is_negative(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
                'unit_price' => -50000.00,
            ]]
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('unit price must be non-negative');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_creates_order_with_shipping_and_billing_address(): void
    {
        $shippingAddress = [
            'street' => 'Jl. Main St',
            'city' => 'Jakarta',
            'postal_code' => '12345',
            'country' => 'Indonesia',
        ];

        $billingAddress = [
            'street' => 'Jl. Bill St',
            'city' => 'Surabaya',
            'postal_code' => '54321',
            'country' => 'Indonesia',
        ];

        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
                'unit_price' => 50000.00,
            ]],
            shippingAddress: $shippingAddress,
            billingAddress: $billingAddress,
            notes: 'Test notes'
        );

        $this->orderRepository
            ->shouldReceive('existsByOrderNumber')
            ->once()
            ->andReturn(false);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (Order $order) {
                return $order;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(Order::class, $result);
    }

    /** @test */
    public function it_creates_order_with_default_currency(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            items: [[
                'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                'quantity' => 2,
                'unit_price' => 50000.00,
            ]]
        );

        $this->orderRepository
            ->shouldReceive('existsByOrderNumber')
            ->once()
            ->andReturn(false);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (Order $order) {
                return $order;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals('IDR', $result->getTotal()->getCurrency());
    }
}
