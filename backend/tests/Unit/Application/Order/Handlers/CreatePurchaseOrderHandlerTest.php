<?php

namespace Tests\Unit\Application\Order\Handlers;

use Tests\TestCase;
use App\Application\Order\Handlers\Commands\CreatePurchaseOrderHandler;
use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Contracts\Events\Dispatcher as EventDispatcher;
use Mockery;
use Illuminate\Support\Facades\Event;

class CreatePurchaseOrderHandlerTest extends TestCase
{
    private CreatePurchaseOrderHandler $handler;
    private CreatePurchaseOrderUseCase $useCase;
    private OrderRepositoryInterface $orderRepository;
    private CustomerRepositoryInterface $customerRepository;
    private EventDispatcher $eventDispatcher;

    protected function setUp(): void
    {
        parent::setUp();
        Event::fake();
        
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->customerRepository = Mockery::mock(CustomerRepositoryInterface::class);
        $this->eventDispatcher = Mockery::mock(EventDispatcher::class);
        
        $this->useCase = new CreatePurchaseOrderUseCase(
            $this->orderRepository,
            $this->customerRepository,
            $this->eventDispatcher
        );
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
        $tenantId = UuidValueObject::generate();
        $customerId = UuidValueObject::generate();
        
        $command = new CreatePurchaseOrderCommand(
            tenantId: $tenantId->getValue(),
            customerId: $customerId->getValue(),
            totalAmount: 100000.0,
            currency: 'IDR',
            items: [
                [
                    'product_id' => 'prod-123',
                    'quantity' => 2,
                    'price' => 50000
                ]
            ],
            specifications: [],
            deliveryAddress: json_encode([
                'street' => 'Jl. Sudirman No. 123',
                'city' => 'Jakarta Pusat',
                'state' => 'DKI Jakarta',
                'postal_code' => '10220',
                'country' => 'ID'
            ]),
            requiredDeliveryDate: (new \DateTime('+30 days'))->format('Y-m-d H:i:s')
        );

        // Mock customer
        $customer = Customer::create(
            tenantId: $tenantId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+62812345678'
        );

        $this->customerRepository
            ->shouldReceive('findById')
            ->once()
            ->with(Mockery::on(function ($id) use ($customerId) {
                return $id->equals($customerId);
            }))
            ->andReturn($customer);

        $this->orderRepository
            ->shouldReceive('existsByOrderNumber')
            ->once()
            ->andReturn(false);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (PurchaseOrder $order) {
                return $order;
            });

        $this->eventDispatcher
            ->shouldReceive('dispatch')
            ->once();

        $result = $this->handler->handle($command);

        $this->assertInstanceOf(PurchaseOrder::class, $result);
        $this->assertEquals(OrderStatus::PENDING, $result->getStatus());
        $this->assertEquals($tenantId, $result->getTenantId());
        $this->assertEquals($customerId, $result->getCustomerId());
    }

    /** @test */
    public function it_returns_order_from_use_case(): void
    {
        $tenantId = UuidValueObject::generate();
        $customerId = UuidValueObject::generate();
        
        $command = new CreatePurchaseOrderCommand(
            tenantId: $tenantId->getValue(),
            customerId: $customerId->getValue(),
            totalAmount: 75000.0,
            currency: 'IDR',
            items: [
                [
                    'product_id' => 'prod-456',
                    'quantity' => 1,
                    'price' => 75000
                ]
            ],
            specifications: [],
            deliveryAddress: json_encode([
                'street' => 'Jl. Thamrin No. 456',
                'city' => 'Jakarta Selatan',
                'state' => 'DKI Jakarta',
                'postal_code' => '12190',
                'country' => 'ID'
            ]),
            requiredDeliveryDate: (new \DateTime('+45 days'))->format('Y-m-d H:i:s')
        );

        // Mock customer
        $customer = Customer::create(
            tenantId: $tenantId,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+62812345679'
        );

        $this->customerRepository
            ->shouldReceive('findById')
            ->once()
            ->with(Mockery::on(function ($id) use ($customerId) {
                return $id->equals($customerId);
            }))
            ->andReturn($customer);

        $this->orderRepository
            ->shouldReceive('existsByOrderNumber')
            ->once()
            ->andReturn(false);

        $this->orderRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (PurchaseOrder $order) {
                return $order;
            });

        $this->eventDispatcher
            ->shouldReceive('dispatch')
            ->once();

        $result = $this->handler->handle($command);

        $this->assertEquals($tenantId, $result->getTenantId());
        $this->assertEquals($customerId, $result->getCustomerId());
    }
}