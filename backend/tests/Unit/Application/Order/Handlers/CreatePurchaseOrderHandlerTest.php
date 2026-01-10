<?php

namespace Tests\Unit\Application\Order\Handlers;

use Tests\TestCase;
use App\Application\Order\Handlers\Commands\CreatePurchaseOrderHandler;
use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use Mockery;
use Illuminate\Support\Facades\Event;

class CreatePurchaseOrderHandlerTest extends TestCase
{
    private CreatePurchaseOrderHandler $handler;
    private CreatePurchaseOrderUseCase $useCase;
    private OrderRepositoryInterface $orderRepository;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->useCase = new CreatePurchaseOrderUseCase($this->orderRepository);
        $this->handler = new CreatePurchaseOrderHandler($this->useCase);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_handles_create_purchase_order_command(): void
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

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (Order $order) {
                return $order;
            });

        $result = $this->handler->handle($command);

        $this->assertInstanceOf(Order::class, $result);
        $this->assertEquals(OrderStatus::PENDING, $result->getStatus());
        $this->assertEquals(100000.00, $result->getTotal()->getAmount());
    }

    /** @test */
    public function it_returns_order_from_use_case(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 50000.00,
            currency: 'USD',
            items: [
                [
                    'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                    'quantity' => 1,
                    'unit_price' => 50000.00,
                ]
            ]
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

        $result = $this->handler->handle($command);

        $this->assertEquals('USD', $result->getTotal()->getCurrency());
    }
}