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
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
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

    private Tenant $tenant;
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

        $this->tenant = Tenant::factory()->create();
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
        $this->assertEquals('pending', $order->status);

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);
        $this->assertEquals($this->vendor->id, $order->vendor_id);

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 95000.00,
            leadTimeDays: 5
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand);
        $this->assertEquals('negotiating', $order->status);

        $approvalCommand = new HandleCustomerApprovalCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            approvalStatus: 'approved',
            approvalNotes: 'Approved by customer'
        );

        $order = $this->handleCustomerApprovalUseCase->execute($approvalCommand);
        $this->assertEquals('approved', $order->status);

        $paymentCommand = new VerifyCustomerPaymentCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            paidAmount: 100000.00,
            paymentMethod: 'bank_transfer'
        );

        $order = $this->verifyCustomerPaymentUseCase->execute($paymentCommand);
        $this->assertEquals('payment_received', $order->status);

        $productionCommand = new UpdateProductionProgressCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            progressPercentage: 100,
            status: 'completed'
        );

        $order = $this->updateProductionProgressUseCase->execute($productionCommand);
        $this->assertEquals('production_completed', $order->status);

        $shipCommand = new ShipOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            trackingNumber: 'TRK-2025-001',
            carrier: 'DHL'
        );

        $order = $this->shipOrderUseCase->execute($shipCommand);
        $this->assertEquals('shipped', $order->status);

        $completeCommand = new CompleteOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid
        );

        $order = $this->completeOrderUseCase->execute($completeCommand);
        $this->assertEquals('completed', $order->status);

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
            reason: 'Customer requested cancellation'
        );

        $cancelledOrder = $this->cancelOrderUseCase->execute($cancelCommand);
        $this->assertEquals('cancelled', $cancelledOrder->status);
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

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 95000.00,
            leadTimeDays: 5
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand);

        $approvalCommand = new HandleCustomerApprovalCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            approvalStatus: 'approved',
            approvalNotes: 'Approved by customer'
        );

        $order = $this->handleCustomerApprovalUseCase->execute($approvalCommand);

        $cancelCommand = new CancelOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            reason: 'Production not started yet'
        );

        $cancelledOrder = $this->cancelOrderUseCase->execute($cancelCommand);
        $this->assertEquals('cancelled', $cancelledOrder->status);
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
        $this->assertEquals(300000.00, $order->total_amount);
    }

    /** @test */
    public function order_lifecycle_respects_tenant_isolation(): void
    {
        $tenantB = Tenant::factory()->create();
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

        $this->assertEquals($this->tenant->id, $order1->tenant_id);
        $this->assertEquals($tenantB->id, $order2->tenant_id);

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

        $this->assertNotEquals($order1->getId(), $order2->getId());
        $this->assertEquals($this->customer->id, $order1->customer_id);
        $this->assertEquals($customer2->id, $order2->customer_id);

        $allOrders = Order::where('tenant_id', $this->tenant->id)->get();
        $this->assertCount(2, $allOrders);
    }
}
