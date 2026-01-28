<?php

namespace Tests\Unit\Application\Order\Handlers;

use Tests\TestCase;
use App\Application\Order\Handlers\Queries\GetOrderQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrdersByStatusQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrdersByCustomerQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrderAnalyticsQueryHandler;
use App\Application\Order\Handlers\Queries\GetOrderHistoryQueryHandler;
use App\Application\Order\Queries\GetOrderQuery;
use App\Application\Order\Queries\GetOrdersByStatusQuery;
use App\Application\Order\Queries\GetOrdersByCustomerQuery;
use App\Application\Order\Queries\GetOrderAnalyticsQuery;
use App\Application\Order\Queries\GetOrderHistoryQuery;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Mockery;

class QueryHandlersTest extends TestCase
{
    private OrderRepositoryInterface $orderRepository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function get_order_query_handler_returns_order_by_id(): void
    {
        $handler = new GetOrderQueryHandler($this->orderRepository);
        
        $query = new GetOrderQuery(
            orderUuid: '660e8400-e29b-41d4-a716-446655440001',
            tenantId: '550e8400-e29b-41d4-a716-446655440000'
        );

        $mockOrder = Mockery::mock(PurchaseOrder::class);
        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->with(Mockery::type(UuidValueObject::class))
            ->andReturn($mockOrder);

        $result = $handler->handle($query);

        $this->assertInstanceOf(PurchaseOrder::class, $result);
    }

    /** @test */
    public function get_orders_by_status_query_handler_returns_paginated_orders(): void
    {
        $handler = new GetOrdersByStatusQueryHandler($this->orderRepository);
        
        $query = new GetOrdersByStatusQuery(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            status: OrderStatus::COMPLETED->value,
            page: 1,
            perPage: 15,
        );

        $mockOrders = array_fill(0, 20, Mockery::mock(PurchaseOrder::class));
        
        $this->orderRepository
            ->shouldReceive('findByStatus')
            ->once()
            ->andReturn($mockOrders);

        $result = $handler->handle($query);

        $this->assertIsArray($result);
        $this->assertCount(15, $result);
    }

    /** @test */
    public function get_orders_by_status_query_handler_handles_pagination(): void
    {
        $handler = new GetOrdersByStatusQueryHandler($this->orderRepository);
        
        $query = new GetOrdersByStatusQuery(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            status: OrderStatus::PENDING->value,
            page: 2,
            perPage: 10,
        );

        $mockOrders = array_fill(0, 25, Mockery::mock(PurchaseOrder::class));
        
        $this->orderRepository
            ->shouldReceive('findByStatus')
            ->once()
            ->andReturn($mockOrders);

        $result = $handler->handle($query);

        $this->assertIsArray($result);
        $this->assertCount(10, $result);
    }

    /** @test */
    public function get_orders_by_customer_query_handler_returns_customer_orders(): void
    {
        $handler = new GetOrdersByCustomerQueryHandler($this->orderRepository);
        
        $query = new GetOrdersByCustomerQuery(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            page: 1,
            perPage: 15,
        );

        $mockOrders = array_fill(0, 5, Mockery::mock(PurchaseOrder::class));
        
        $this->orderRepository
            ->shouldReceive('findByCustomerId')
            ->once()
            ->andReturn($mockOrders);

        $result = $handler->handle($query);

        $this->assertIsArray($result);
        $this->assertCount(5, $result);
    }

    /** @test */
    public function get_order_analytics_query_handler_returns_analytics(): void
    {
        $handler = new GetOrderAnalyticsQueryHandler($this->orderRepository);
        
        $query = new GetOrderAnalyticsQuery(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            year: 2024,
            month: 12,
        );

        $this->orderRepository
            ->shouldReceive('getMonthlyRevenue')
            ->once()
            ->andReturn(1000000.00);

        $this->orderRepository
            ->shouldReceive('countByTenantId')
            ->once()
            ->andReturn(50);

        $result = $handler->handle($query);

        $this->assertIsArray($result);
        $this->assertEquals(1000000.00, $result['revenue']);
        $this->assertEquals(50, $result['total_orders']);
        $this->assertEquals(2024, $result['year']);
        $this->assertEquals(12, $result['month']);
    }

    /** @test */
    public function get_order_history_query_handler_returns_recent_orders(): void
    {
        $handler = new GetOrderHistoryQueryHandler($this->orderRepository);
        
        $query = new GetOrderHistoryQuery(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            orderId: '660e8400-e29b-41d4-a716-446655440001',
            limit: 10,
        );

        $mockOrder = Mockery::mock(PurchaseOrder::class);
        $mockOrder->shouldReceive('getId->getValue')->andReturn('test-id');
        $mockOrder->shouldReceive('getOrderNumber')->andReturn('ORD-123');
        
        $mockStatus = OrderStatus::COMPLETED;
        $mockOrder->shouldReceive('getStatus')->andReturn($mockStatus);
        
        $mockOrder->shouldReceive('getTotalAmount->getAmountInCents')->andReturn(10000000);
        $mockOrder->shouldReceive('getTotalAmount->getCurrency')->andReturn('IDR');
        $mockOrder->shouldReceive('getCreatedAt->format')->andReturn('2024-12-03 10:00:00');
        $mockOrder->shouldReceive('getUpdatedAt->format')->andReturn('2024-12-03 11:00:00');

        $mockOrders = array_fill(0, 5, $mockOrder);
        
        $this->orderRepository
            ->shouldReceive('getRecent')
            ->once()
            ->with(Mockery::type(UuidValueObject::class), 10)
            ->andReturn($mockOrders);

        $result = $handler->handle($query);

        $this->assertIsArray($result);
        $this->assertCount(5, $result);
        $this->assertArrayHasKey('order_number', $result[0]);
        $this->assertEquals('ORD-123', $result[0]['order_number']);
    }
}
