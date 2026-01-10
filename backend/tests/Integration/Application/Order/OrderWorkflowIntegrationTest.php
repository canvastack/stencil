<?php

namespace Tests\Integration\Application\Order;

use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class OrderWorkflowIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    private OrderRepositoryInterface $orderRepository;
    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private NegotiateWithVendorUseCase $negotiateWithVendorUseCase;

    private TenantEloquentModel $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->orderRepository = app(OrderRepositoryInterface::class);
        $this->createPurchaseOrderUseCase = app(CreatePurchaseOrderUseCase::class);
        $this->assignVendorUseCase = app(AssignVendorUseCase::class);
        $this->negotiateWithVendorUseCase = app(NegotiateWithVendorUseCase::class);

        Event::fake();

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /** @test */
    public function complete_order_workflow_from_creation_to_assignment(): void
    {
        $command = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 2,
                    'unit_price' => 50000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($command);

        $this->assertNotNull($order);
        $this->assertEquals(100000.00, $order->total_amount);
        $this->assertEquals('IDR', $order->currency);
        $this->assertEquals('pending', $order->status);

        $refreshedOrder = Order::where('uuid', $order->getId())->first();
        $this->assertNotNull($refreshedOrder);
        $this->assertEquals($this->customer->id, $refreshedOrder->customer_id);
    }

    /** @test */
    public function order_workflow_with_vendor_assignment(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $assignedOrder = $this->assignVendorUseCase->execute($assignCommand);

        $this->assertNotNull($assignedOrder);
        $this->assertEquals($this->vendor->id, $assignedOrder->vendor_id);

        $refreshedOrder = Order::where('uuid', $order->getId())->first();
        $this->assertEquals($this->vendor->id, $refreshedOrder->vendor_id);
    }

    /** @test */
    public function order_workflow_with_vendor_negotiation(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $this->assignVendorUseCase->execute($assignCommand);

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 95000.00,
            leadTimeDays: 5
        );

        $negotiatedOrder = $this->negotiateWithVendorUseCase->execute($negotiateCommand);

        $this->assertNotNull($negotiatedOrder);
        $this->assertEquals('negotiating', $negotiatedOrder->status);

        $refreshedOrder = Order::where('uuid', $order->getId())->first();
        $this->assertEquals('negotiating', $refreshedOrder->status);
    }

    /** @test */
    public function multiple_orders_for_same_customer(): void
    {
        $items1 = [
            [
                'product_id' => $this->product->uuid,
                'quantity' => 1,
                'unit_price' => 50000.00,
            ]
        ];

        $command1 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 50000.00,
            currency: 'IDR',
            items: $items1
        );

        $order1 = $this->createPurchaseOrderUseCase->execute($command1);

        $command2 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 2,
                    'unit_price' => 50000.00,
                ]
            ]
        );

        $order2 = $this->createPurchaseOrderUseCase->execute($command2);

        $this->assertNotNull($order1);
        $this->assertNotNull($order2);
        $this->assertNotEquals($order1->getId(), $order2->getId());

        $customerOrders = Order::where('customer_id', $this->customer->id)
            ->where('tenant_id', $this->tenant->id)
            ->get();

        $this->assertCount(2, $customerOrders);
    }

    /** @test */
    public function order_workflow_respects_tenant_isolation(): void
    {
        $tenantB = TenantEloquentModel::factory()->create();
        $customerB = Customer::factory()->create(['tenant_id' => $tenantB->id]);
        $productB = Product::factory()->create(['tenant_id' => $tenantB->id]);

        $command1 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order1 = $this->createPurchaseOrderUseCase->execute($command1);

        $command2 = new CreatePurchaseOrderCommand(
            tenantId: $tenantB->uuid,
            customerId: $customerB->uuid,
            totalAmount: 200000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $productB->uuid,
                    'quantity' => 2,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order2 = $this->createPurchaseOrderUseCase->execute($command2);

        $this->assertEquals($this->tenant->id, $order1->tenant_id);
        $this->assertEquals($tenantB->id, $order2->tenant_id);

        $tenantAOrders = Order::where('tenant_id', $this->tenant->id)->get();
        $tenantBOrders = Order::where('tenant_id', $tenantB->id)->get();

        $this->assertCount(1, $tenantAOrders);
        $this->assertCount(1, $tenantBOrders);
    }
}
