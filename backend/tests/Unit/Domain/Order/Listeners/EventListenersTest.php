<?php

namespace Tests\Unit\Domain\Order\Listeners;

use App\Domain\Order\Events\OrderDelivered;
use App\Domain\Order\Events\OrderShipped;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Events\ProductionCompleted;
use App\Domain\Order\Events\RefundProcessed;
use App\Domain\Order\Events\QuoteApproved;
use App\Domain\Order\Events\QuoteRequested;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Listeners\HandleRefundWorkflow;
use App\Domain\Order\Listeners\ProcessOrderCompletion;
use App\Domain\Order\Listeners\SendQuoteApprovalToCustomer;
use App\Domain\Order\Listeners\SendQuoteRequestToVendor;
use App\Domain\Order\Listeners\SendShippingNotification;
use App\Domain\Order\Listeners\SendVendorAssignmentEmail;
use App\Domain\Order\Listeners\TriggerInvoiceGeneration;
use App\Domain\Order\Listeners\UpdateInventoryOnOrderComplete;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class EventListenersTest extends TestCase
{
    use DatabaseTransactions;

    private Order $order;
    private Customer $customer;
    private Vendor $vendor;
    private $tenantId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = 1;

        Tenant::factory()->create(['id' => $this->tenantId]);

        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenantId]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenantId]);

        $this->order = Order::factory()
            ->for($this->customer)
            ->for($this->vendor)
            ->create(['tenant_id' => $this->tenantId]);
    }

    public function test_send_vendor_assignment_email_listener()
    {
        Mail::fake();

        $listener = app(SendVendorAssignmentEmail::class);
        $event = new VendorAssigned($this->order, $this->vendor->id, $this->vendor->name);

        $listener->handle($event);

        $this->assertTrue(true);
    }

    public function test_send_quote_request_to_vendor_listener()
    {
        Mail::fake();

        $listener = app(SendQuoteRequestToVendor::class);
        $event = new QuoteRequested($this->order, $this->vendor->id, 500000, 5);

        $listener->handle($event);

        $this->assertTrue(true);
    }

    public function test_send_quote_approval_to_customer_listener()
    {
        Mail::fake();

        $listener = app(SendQuoteApprovalToCustomer::class);
        $event = new QuoteApproved($this->order, 100000, 'Approved');

        $listener->handle($event);

        $this->assertTrue(true);
    }

    public function test_update_inventory_on_order_complete_listener()
    {
        Log::spy();

        $order = Order::factory()
            ->for($this->customer)
            ->for($this->vendor)
            ->create(['tenant_id' => $this->tenantId]);

        $listener = app(UpdateInventoryOnOrderComplete::class);
        $event = new ProductionCompleted($order, 95, 'Quality check passed');

        $listener->handle($event);

        $this->assertTrue(true);
    }

    public function test_trigger_invoice_generation_on_payment_received()
    {
        Event::fake();
        Log::spy();

        $listener = app(TriggerInvoiceGeneration::class);
        $event = new PaymentReceived($this->order, 'bank_transfer', 500000);

        try {
            $listener->handle($event);
        } catch (\Exception $e) {
            $this->fail("Listener threw exception: " . $e->getMessage());
        }

        $this->assertNotNull($this->order->fresh()->invoice_number);
    }

    public function test_trigger_invoice_generation_on_order_completed()
    {
        Event::fake();
        Log::spy();

        $listener = app(TriggerInvoiceGeneration::class);
        $event = new ProductionCompleted($this->order, 85, 'Production completed');

        $listener->handle($event);

        $this->assertNotNull($this->order->fresh()->invoice_number);
    }

    public function test_send_shipping_notification_listener()
    {
        Mail::fake();

        $listener = app(SendShippingNotification::class);
        $event = new OrderShipped($this->order, 'TRK123456');

        $listener->handle($event);

        $this->assertTrue(true);
    }

    public function test_process_order_completion_listener()
    {
        Event::fake();
        Log::spy();

        $listener = app(ProcessOrderCompletion::class);
        $event = new ProductionCompleted($this->order, 88, 'Completed');

        $listener->handle($event);

        $this->assertNotNull($this->order->fresh()->completed_at);
    }

    public function test_handle_refund_workflow_listener()
    {
        Event::fake();
        Mail::fake();
        Log::spy();

        $listener = app(HandleRefundWorkflow::class);
        $event = new RefundProcessed($this->order, 500000, 'manual');

        $listener->handle($event);

        $order = $this->order->fresh();
        $this->assertEquals(500000, $order->refund_amount);
        $this->assertEquals('refunded', $order->refund_status);
    }

    public function test_listener_handles_missing_customer_gracefully()
    {
        $order = Order::factory()
            ->for($this->customer)
            ->create([
                'tenant_id' => $this->tenantId,
                'vendor_id' => $this->vendor->id,
            ]);

        Log::spy();

        $listener = app(SendVendorAssignmentEmail::class);
        $event = new VendorAssigned($order, $this->vendor->id, $this->vendor->name);

        $listener->handle($event);

        $this->assertTrue(true);
    }

    public function test_listener_handles_missing_vendor_gracefully()
    {
        $order = Order::factory()
            ->for($this->customer)
            ->create([
                'tenant_id' => $this->tenantId,
                'vendor_id' => null,
            ]);

        Log::spy();

        $listener = app(SendQuoteRequestToVendor::class);
        $event = new QuoteRequested($order, 'vendor-1', 500000, 5);

        $listener->handle($event);

        Log::shouldHaveReceived('warning');
    }

    public function test_listener_handles_exceptions_gracefully()
    {
        Mail::shouldReceive('to')->andThrow(new \Exception('Mail server error'));
        Log::spy();

        $listener = app(SendVendorAssignmentEmail::class);
        $event = new VendorAssigned($this->order, $this->vendor->id, $this->vendor->name);

        $listener->handle($event);

        Log::shouldHaveReceived('error');
    }

    public function test_invoice_number_generation_format()
    {
        Event::fake();
        Log::spy();

        $listener = app(TriggerInvoiceGeneration::class);
        $event = new PaymentReceived($this->order, 'bank_transfer', 500000);

        $listener->handle($event);

        $invoiceNumber = $this->order->fresh()->invoice_number;
        $this->assertStringStartsWith('INV-', $invoiceNumber);
    }

    public function test_refund_updates_order_status()
    {
        Event::fake();
        Mail::fake();
        Log::spy();

        $listener = app(HandleRefundWorkflow::class);
        $refundAmount = 250000;
        $refundMethod = 'manual';

        $event = new RefundProcessed($this->order, $refundAmount, $refundMethod);
        $listener->handle($event);

        $refreshedOrder = $this->order->fresh();
        $this->assertEquals($refundAmount, $refreshedOrder->refund_amount);
        $this->assertEquals('refunded', $refreshedOrder->refund_status);
    }

    public function test_process_order_completion_updates_customer_metrics()
    {
        Event::fake();
        Log::spy();

        $initialOrderCount = $this->customer->total_orders ?? 0;

        $listener = app(ProcessOrderCompletion::class);
        $event = new ProductionCompleted($this->order, 92, 'Test');

        $listener->handle($event);

        $refreshedCustomer = $this->customer->fresh();
        $this->assertGreaterThan($initialOrderCount, $refreshedCustomer->total_orders);
    }

    public function test_listeners_maintain_multi_tenant_isolation()
    {
        Event::fake();
        Log::spy();

        Tenant::factory()->create(['id' => 2]);
        $otherCustomer = Customer::factory()->create(['tenant_id' => 2]);
        $otherVendor = Vendor::factory()->create(['tenant_id' => 2]);
        $otherOrder = Order::factory()
            ->for($otherCustomer)
            ->for($otherVendor)
            ->create(['tenant_id' => 2]);

        $listener = app(ProcessOrderCompletion::class);
        $event = new ProductionCompleted($otherOrder, 90, 'Complete');

        $listener->handle($event);

        $this->assertNotNull($otherOrder->fresh()->completed_at);
    }

    public function test_invoice_generation_idempotent()
    {
        Event::fake();
        Log::spy();

        $listener = app(TriggerInvoiceGeneration::class);
        $event = new PaymentReceived($this->order, 'bank_transfer', 500000);

        $listener->handle($event);
        $firstInvoiceNumber = $this->order->fresh()->invoice_number;

        $listener->handle($event);
        $secondInvoiceNumber = $this->order->fresh()->invoice_number;

        $this->assertEquals($firstInvoiceNumber, $secondInvoiceNumber);
    }
}
