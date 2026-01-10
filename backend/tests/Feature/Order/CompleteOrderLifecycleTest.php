<?php

namespace Tests\Feature\Order;

use App\Application\Order\UseCases\{
    CreatePurchaseOrderUseCase,
    AssignVendorUseCase,
    NegotiateWithVendorUseCase,
    HandleCustomerApprovalUseCase,
    VerifyCustomerPaymentUseCase,
    UpdateProductionProgressUseCase,
    ShipOrderUseCase,
    CompleteOrderUseCase,
    CancelOrderUseCase
};
use App\Application\Order\Commands\{
    CreatePurchaseOrderCommand,
    AssignVendorCommand,
    NegotiateWithVendorCommand,
    HandleCustomerApprovalCommand,
    VerifyCustomerPaymentCommand,
    UpdateProductionProgressCommand,
    ShipOrderCommand,
    CompleteOrderCommand,
    CancelOrderCommand
};
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Vendor};
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CompleteOrderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private NegotiateWithVendorUseCase $negotiateWithVendorUseCase;
    private HandleCustomerApprovalUseCase $handleCustomerApprovalUseCase;
    private VerifyCustomerPaymentUseCase $verifyCustomerPaymentUseCase;
    private UpdateProductionProgressUseCase $updateProductionProgressUseCase;
    private ShipOrderUseCase $shipOrderUseCase;
    private CompleteOrderUseCase $completeOrderUseCase;
    private CancelOrderUseCase $cancelOrderUseCase;

    private TenantEloquentModel $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createPurchaseOrderUseCase = app(CreatePurchaseOrderUseCase::class);
        $this->assignVendorUseCase = app(AssignVendorUseCase::class);
        $this->negotiateWithVendorUseCase = app(NegotiateWithVendorUseCase::class);
        $this->handleCustomerApprovalUseCase = app(HandleCustomerApprovalUseCase::class);
        $this->verifyCustomerPaymentUseCase = app(VerifyCustomerPaymentUseCase::class);
        $this->updateProductionProgressUseCase = app(UpdateProductionProgressUseCase::class);
        $this->shipOrderUseCase = app(ShipOrderUseCase::class);
        $this->completeOrderUseCase = app(CompleteOrderUseCase::class);
        $this->cancelOrderUseCase = app(CancelOrderUseCase::class);

        Event::fake();

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /** @test */
    public function complete_order_workflow_from_creation_to_completion(): void
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
        $this->assertEquals('pending', $order->getStatus()->value);

        Order::where('uuid', $order->getId())->update(['status' => 'vendor_sourcing']);

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);
        $this->assertEquals('vendor_negotiation', $order->getStatus()->value);

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            vendorId: $this->vendor->uuid,
            quotedPrice: 95000.00,
            leadTimeInDays: 5
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand);
        $this->assertEquals('vendor_negotiation', $order->getStatus()->value);

        Order::where('uuid', $order->getId())->update(['status' => 'customer_quote']);

        $approvalCommand = new HandleCustomerApprovalCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            approved: true
        );

        $order = $this->handleCustomerApprovalUseCase->execute($approvalCommand);
        $this->assertEquals('awaiting_payment', $order->getStatus()->value);

        $paymentCommand = new VerifyCustomerPaymentCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            paidAmount: 100000.00,
            paymentMethod: 'bank_transfer'
        );

        $order = $this->verifyCustomerPaymentUseCase->execute($paymentCommand);
        $this->assertEquals('full_payment', $order->getStatus()->value);

        $order->updateStatus(\App\Domain\Order\Enums\OrderStatus::IN_PRODUCTION);
        $orderRepository = app(\App\Domain\Order\Repositories\OrderRepositoryInterface::class);
        $order = $orderRepository->save($order);

        $productionCommand = new UpdateProductionProgressCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            progressPercentage: 100,
            status: 'completed'
        );

        $order = $this->updateProductionProgressUseCase->execute($productionCommand);
        $this->assertEquals('quality_control', $order->getStatus()->value);

        $order->updateStatus(\App\Domain\Order\Enums\OrderStatus::SHIPPING);
        $orderRepository = app(\App\Domain\Order\Repositories\OrderRepositoryInterface::class);
        $order = $orderRepository->save($order);

        $shipCommand = new ShipOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            trackingNumber: 'TRK-2025-001',
            shippingProvider: 'DHL'
        );

        $order = $this->shipOrderUseCase->execute($shipCommand);
        $this->assertEquals('shipping', $order->getStatus()->value);

        $completeCommand = new CompleteOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid
        );

        $order = $this->completeOrderUseCase->execute($completeCommand);
        $this->assertEquals('completed', $order->getStatus()->value);

        $finalOrder = Order::where('uuid', $order->getId())->first();
        $this->assertNotNull($finalOrder->completed_at);
        $this->assertEquals('completed', $finalOrder->status);
    }

    /** @test */
    public function order_can_be_cancelled_at_pending_stage(): void
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

        $cancelCommand = new CancelOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            cancellationReason: 'Customer requested cancellation'
        );

        $cancelledOrder = $this->cancelOrderUseCase->execute($cancelCommand);
        $this->assertEquals('cancelled', $cancelledOrder->getStatus()->value);
    }

    /** @test */
    public function order_can_be_cancelled_after_approval(): void
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

        Order::where('uuid', $order->getId())->update(['status' => 'vendor_sourcing']);

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            vendorId: $this->vendor->uuid,
            quotedPrice: 95000.00,
            leadTimeInDays: 5
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand);

        Order::where('uuid', $order->getId())->update(['status' => 'customer_quote']);

        $approvalCommand = new HandleCustomerApprovalCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            approved: true
        );

        $order = $this->handleCustomerApprovalUseCase->execute($approvalCommand);

        $cancelCommand = new CancelOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            cancellationReason: 'Production not started yet'
        );

        $cancelledOrder = $this->cancelOrderUseCase->execute($cancelCommand);
        $this->assertEquals('cancelled', $cancelledOrder->getStatus()->value);
    }

    /** @test */
    public function multiple_products_in_single_order(): void
    {
        $product2 = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 300000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 2,
                    'unit_price' => 100000.00,
                ],
                [
                    'product_id' => $product2->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);
        $this->assertEquals(300000.00, $order->getTotal()->getAmount());
    }

    /** @test */
    public function order_lifecycle_respects_tenant_isolation(): void
    {
        $tenantB = TenantEloquentModel::factory()->create();
        $customerB = Customer::factory()->create(['tenant_id' => $tenantB->id]);
        $vendorB = Vendor::factory()->create(['tenant_id' => $tenantB->id]);
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
                    'quantity' => 1,
                    'unit_price' => 200000.00,
                ]
            ]
        );

        $order2 = $this->createPurchaseOrderUseCase->execute($command2);

        $this->assertEquals($this->tenant->uuid, $order1->getTenantId()->getValue());
        $this->assertEquals($tenantB->uuid, $order2->getTenantId()->getValue());

        $tenantAOrders = Order::where('tenant_id', $this->tenant->id)->get();
        $tenantBOrders = Order::where('tenant_id', $tenantB->id)->get();

        $this->assertCount(1, $tenantAOrders);
        $this->assertCount(1, $tenantBOrders);
    }

    /** @test */
    public function concurrent_orders_for_different_customers(): void
    {
        $customer2 = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

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

        $command2 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $customer2->uuid,
            totalAmount: 150000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 150000.00,
                ]
            ]
        );

        $order1 = $this->createPurchaseOrderUseCase->execute($command1);
        $order2 = $this->createPurchaseOrderUseCase->execute($command2);

        $this->assertNotEquals($order1->getId()->getValue(), $order2->getId()->getValue());
        $this->assertEquals($this->customer->uuid, $order1->getCustomerId()->getValue());
        $this->assertEquals($customer2->uuid, $order2->getCustomerId()->getValue());

        $allOrders = Order::where('tenant_id', $this->tenant->id)->get();
        $this->assertCount(2, $allOrders);
    }
}
