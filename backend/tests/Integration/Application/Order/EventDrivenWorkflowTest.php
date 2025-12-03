<?php

namespace Tests\Integration\Application\Order;

use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Events\QuoteRequested;
use App\Domain\Order\Events\QuoteApproved;
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EventDrivenWorkflowTest extends TestCase
{
    use DatabaseTransactions;

    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private NegotiateWithVendorUseCase $negotiateWithVendorUseCase;

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

        $this->tenant = Tenant::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /** @test */
    public function order_creation_dispatches_order_created_event(): void
    {
        Event::fake();

        $command = new CreatePurchaseOrderCommand(
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

        $order = $this->createPurchaseOrderUseCase->execute($command);

        Event::assertDispatched(OrderCreated::class, function ($event) use ($order) {
            return $event->order->uuid === $order->getId() &&
                   $event->order->customer_id === $this->customer->id;
        });
    }

    /** @test */
    public function vendor_assignment_dispatches_vendor_assigned_event(): void
    {
        Event::fake();

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

        Event::fake();

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $assignedOrder = $this->assignVendorUseCase->execute($assignCommand);

        Event::assertDispatched(VendorAssigned::class, function ($event) use ($assignedOrder, $order) {
            return $event->order->uuid === $order->getId() &&
                   $event->order->vendor_id === $this->vendor->id;
        });
    }

    /** @test */
    public function negotiation_dispatches_quote_requested_event(): void
    {
        Event::fake();

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

        Event::fake();

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 95000.00,
            leadTimeDays: 5
        );

        $this->negotiateWithVendorUseCase->execute($negotiateCommand);

        Event::assertDispatched(QuoteRequested::class, function ($event) {
            return $event->order->uuid !== null &&
                   $event->quotedPrice === 95000.00 &&
                   $event->leadTimeDays === 5;
        });
    }

    /** @test */
    public function complete_event_driven_workflow(): void
    {
        Event::fake();
        Mail::fake();

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

        Event::assertDispatched(OrderCreated::class);

        Event::fake();

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $this->assignVendorUseCase->execute($assignCommand);

        Event::assertDispatched(VendorAssigned::class);

        Event::fake();

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 95000.00,
            leadTimeDays: 5
        );

        $this->negotiateWithVendorUseCase->execute($negotiateCommand);

        Event::assertDispatched(QuoteRequested::class);
    }

    /** @test */
    public function multiple_events_in_workflow_sequence(): void
    {
        Event::fake();

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

        $createdEventDispatched = Event::dispatched(OrderCreated::class, function ($event) use ($order) {
            return $event->order->uuid === $order->getId();
        });

        $this->assertTrue($createdEventDispatched);

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor->uuid,
            tenantId: $this->tenant->uuid
        );

        $this->assignVendorUseCase->execute($assignCommand);

        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        $assignCommand2 = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $vendor2->uuid,
            tenantId: $this->tenant->uuid
        );

        $this->assignVendorUseCase->execute($assignCommand2);

        Event::assertDispatchedTimes(VendorAssigned::class, 2);
    }

    /** @test */
    public function event_data_maintains_tenant_isolation(): void
    {
        Event::fake();

        $tenantB = Tenant::factory()->create();
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
                    'quantity' => 1,
                    'unit_price' => 200000.00,
                ]
            ]
        );

        $order2 = $this->createPurchaseOrderUseCase->execute($command2);

        $tenantAEventFound = Event::dispatched(OrderCreated::class, function ($event) use ($order1) {
            return $event->order->uuid === $order1->getId() &&
                   $event->order->tenant_id === $this->tenant->id;
        });

        $tenantBEventFound = Event::dispatched(OrderCreated::class, function ($event) use ($order2) {
            return $event->order->uuid === $order2->getId() &&
                   $event->order->tenant_id === $tenantB->id;
        });

        $this->assertTrue($tenantAEventFound);
        $this->assertTrue($tenantBEventFound);
    }
}
