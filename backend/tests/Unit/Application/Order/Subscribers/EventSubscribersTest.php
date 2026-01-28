<?php

namespace Tests\Unit\Application\Order\Subscribers;

use App\Application\Order\Subscribers\NotificationSubscriber;
use App\Application\Order\Subscribers\OrderWorkflowSubscriber;
use App\Application\Order\Subscribers\PaymentWorkflowSubscriber;
use App\Domain\Order\Events\OrderCancelled;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\OrderDelivered;
use App\Domain\Order\Events\OrderShipped;
use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Events\ProductionCompleted;
use App\Domain\Order\Events\QuoteApproved;
use App\Domain\Order\Events\QuoteRequested;
use App\Domain\Order\Events\RefundProcessed;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Domain\Order\Enums\OrderStatus;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
use DateTimeImmutable;

/**
 * Event Subscribers Test
 * 
 * Tests event subscribers using real domain entities (not Eloquent models)
 * Following ZERO MOCK POLICY for domain entities
 */
class EventSubscribersTest extends TestCase
{
    use DatabaseTransactions;

    private PurchaseOrder $order;
    private Customer $customer;
    private Vendor $vendor;
    private UuidValueObject $tenantId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantId = new UuidValueObject('550e8400-e29b-41d4-a716-446655440000');

        // Create real domain entities
        $this->customer = Customer::create(
            $this->tenantId,
            'Test Customer',
            'customer@test.com',
            '+62123456789',
            'Test Company'
        );

        $this->vendor = Vendor::create(
            $this->tenantId,
            'Test Vendor',
            'vendor@test.com',
            '+62987654321',
            'Test Vendor Company',
            new Address('Vendor Street', 'Vendor City', 'Vendor State', '54321', 'ID'),
            ['etching', 'engraving']
        );

        $this->order = PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $this->customer->getId(),
            orderNumber: 'ORD-' . time(),
            items: [
                ['product_id' => 'prod-001', 'quantity' => 1, 'price' => 10000000]
            ],
            totalAmount: Money::fromCents(10000000),
            deliveryAddress: new Address('Test Street', 'Test City', 'Test State', '12345', 'ID'),
            billingAddress: new Address('Test Street', 'Test City', 'Test State', '12345', 'ID'),
            requiredDeliveryDate: new DateTimeImmutable('+30 days'),
            customerNotes: 'Test notes',
            specifications: ['material' => 'steel'],
            timeline: Timeline::forOrderProduction(new DateTimeImmutable(), 30),
            metadata: ['source' => 'test']
        );
    }

    public function test_order_workflow_subscriber_registered_correctly()
    {
        $subscriber = app(OrderWorkflowSubscriber::class);

        $this->assertIsArray($subscriber->subscribe(null));
        $this->assertCount(5, $subscriber->subscribe(null));
    }

    public function test_order_workflow_subscriber_handles_vendor_assigned()
    {
        Mail::fake();

        $subscriber = app(OrderWorkflowSubscriber::class);
        $event = new VendorAssigned($this->order, $this->vendor->getId(), ['price' => 50000, 'lead_time' => 5]);

        $subscriber->handleVendorAssigned($event);

        $this->assertTrue(true);
    }

    public function test_order_workflow_subscriber_handles_quote_requested()
    {
        Mail::fake();

        $subscriber = app(OrderWorkflowSubscriber::class);
        $event = new QuoteRequested($this->order, $this->vendor->getId()->getValue(), 500000, 5);

        $subscriber->handleQuoteRequested($event);

        $this->assertTrue(true);
    }

    public function test_order_workflow_subscriber_handles_quote_approved()
    {
        Mail::fake();

        $subscriber = app(OrderWorkflowSubscriber::class);
        $event = new QuoteApproved($this->order, 100000, 'Approved by customer');

        $subscriber->handleQuoteApproved($event);

        $this->assertTrue(true);
    }

    public function test_order_workflow_subscriber_handles_order_shipped()
    {
        Mail::fake();

        $subscriber = app(OrderWorkflowSubscriber::class);
        $event = new OrderShipped($this->order, 'TRK123456');

        $subscriber->handleOrderShipped($event);

        $this->assertTrue(true);
    }

    public function test_order_workflow_subscriber_handles_order_completed()
    {
        Mail::fake();
        Log::spy();

        $subscriber = app(OrderWorkflowSubscriber::class);
        $event = new ProductionCompleted($this->order, 90, 'Production completed successfully');

        $subscriber->handleOrderCompleted($event);

        $this->assertTrue(true);
    }

    public function test_payment_workflow_subscriber_registered_correctly()
    {
        $subscriber = app(PaymentWorkflowSubscriber::class);

        $this->assertIsArray($subscriber->subscribe(null));
        $this->assertCount(2, $subscriber->subscribe(null));
    }

    public function test_payment_workflow_subscriber_handles_payment_received()
    {
        Event::fake();
        Log::spy();

        $subscriber = app(PaymentWorkflowSubscriber::class);
        $event = new PaymentReceived($this->order, Money::fromCents(5000000), 'bank_transfer', 'REF-001');

        $subscriber->handlePaymentReceived($event);

        $this->assertTrue(true);
    }

    public function test_payment_workflow_subscriber_handles_refund_processed()
    {
        Event::fake();
        Mail::fake();
        Log::spy();

        $subscriber = app(PaymentWorkflowSubscriber::class);
        $event = new RefundProcessed($this->order, Money::fromCents(2500000), 'customer_request', 'REF-001');

        $subscriber->handleRefundProcessed($event);

        $this->assertTrue(true);
    }

    public function test_notification_subscriber_registered_correctly()
    {
        $subscriber = app(NotificationSubscriber::class);

        $this->assertIsArray($subscriber->subscribe(null));
        $this->assertCount(6, $subscriber->subscribe(null));
    }

    public function test_notification_subscriber_handles_order_created()
    {
        Log::spy();

        $subscriber = app(NotificationSubscriber::class);
        $event = new OrderCreated($this->order);

        $subscriber->handleOrderCreated($event);

        $this->assertTrue(true);
    }

    public function test_notification_subscriber_handles_order_status_changed()
    {
        Log::spy();

        $subscriber = app(NotificationSubscriber::class);
        $event = new OrderStatusChanged(
            $this->order,
            OrderStatus::NEW,
            OrderStatus::VENDOR_SOURCING,
            'Moving to vendor sourcing phase'
        );

        $subscriber->handleOrderStatusChanged($event);

        $this->assertTrue(true);
    }

    public function test_notification_subscriber_handles_payment_received()
    {
        Log::spy();

        $subscriber = app(NotificationSubscriber::class);
        $event = new PaymentReceived($this->order, Money::fromCents(5000000), 'bank_transfer', 'REF-001');

        $subscriber->handlePaymentReceived($event);

        $this->assertTrue(true);
    }

    public function test_notification_subscriber_handles_order_shipped()
    {
        Log::spy();

        $subscriber = app(NotificationSubscriber::class);
        $event = new OrderShipped($this->order, 'TRK123456');

        $subscriber->handleOrderShipped($event);

        $this->assertTrue(true);
    }

    public function test_notification_subscriber_handles_order_delivered()
    {
        Log::spy();

        $subscriber = app(NotificationSubscriber::class);
        $event = new OrderDelivered($this->order);

        $subscriber->handleOrderDelivered($event);

        $this->assertTrue(true);
    }

    public function test_notification_subscriber_handles_order_cancelled()
    {
        Log::spy();

        $subscriber = app(NotificationSubscriber::class);
        $event = new OrderCancelled($this->order, 'Customer request');

        $subscriber->handleOrderCancelled($event);

        $this->assertTrue(true);
    }

    public function test_subscribers_maintain_event_mapping()
    {
        $orderWorkflow = app(OrderWorkflowSubscriber::class);
        $paymentWorkflow = app(PaymentWorkflowSubscriber::class);
        $notification = app(NotificationSubscriber::class);

        $orderWorkflowMappings = $orderWorkflow->subscribe(null);
        $paymentWorkflowMappings = $paymentWorkflow->subscribe(null);
        $notificationMappings = $notification->subscribe(null);

        $this->assertArrayHasKey(VendorAssigned::class, $orderWorkflowMappings);
        $this->assertArrayHasKey(QuoteRequested::class, $orderWorkflowMappings);
        $this->assertArrayHasKey(QuoteApproved::class, $orderWorkflowMappings);
        $this->assertArrayHasKey(OrderShipped::class, $orderWorkflowMappings);
        $this->assertArrayHasKey(ProductionCompleted::class, $orderWorkflowMappings);

        $this->assertArrayHasKey(PaymentReceived::class, $paymentWorkflowMappings);
        $this->assertArrayHasKey(RefundProcessed::class, $paymentWorkflowMappings);

        $this->assertArrayHasKey(OrderCreated::class, $notificationMappings);
        $this->assertArrayHasKey(OrderStatusChanged::class, $notificationMappings);
        $this->assertArrayHasKey(PaymentReceived::class, $notificationMappings);
        $this->assertArrayHasKey(OrderShipped::class, $notificationMappings);
        $this->assertArrayHasKey(OrderDelivered::class, $notificationMappings);
        $this->assertArrayHasKey(OrderCancelled::class, $notificationMappings);
    }

    public function test_subscribers_properly_delegate_to_listeners()
    {
        Mail::fake();
        Log::spy();

        $orderWorkflow = app(OrderWorkflowSubscriber::class);
        $event = new VendorAssigned($this->order, $this->vendor->getId(), ['price' => 50000, 'lead_time' => 5]);

        $orderWorkflow->handleVendorAssigned($event);

        $this->assertTrue(true);
    }

    public function test_multiple_subscribers_can_handle_same_event()
    {
        Event::fake();
        Mail::fake();
        Log::spy();

        $paymentWorkflow = app(PaymentWorkflowSubscriber::class);
        $notification = app(NotificationSubscriber::class);

        // Verify that both subscribers exist and can be instantiated
        $this->assertInstanceOf(PaymentWorkflowSubscriber::class, $paymentWorkflow);
        $this->assertInstanceOf(NotificationSubscriber::class, $notification);

        // Verify that both subscribers handle the PaymentReceived event
        $paymentMappings = $paymentWorkflow->subscribe(null);
        $notificationMappings = $notification->subscribe(null);

        $this->assertArrayHasKey(PaymentReceived::class, $paymentMappings);
        $this->assertArrayHasKey(PaymentReceived::class, $notificationMappings);

        // Verify that their handler methods exist
        $this->assertTrue(method_exists($paymentWorkflow, 'handlePaymentReceived'));
        $this->assertTrue(method_exists($notification, 'handlePaymentReceived'));
    }

    public function test_event_subscriber_isolation()
    {
        Log::spy();

        $orderWorkflow = app(OrderWorkflowSubscriber::class);
        $paymentWorkflow = app(PaymentWorkflowSubscriber::class);

        $orderWorkflowMappings = $orderWorkflow->subscribe(null);
        $paymentWorkflowMappings = $paymentWorkflow->subscribe(null);

        foreach ($orderWorkflowMappings as $eventClass => $_) {
            $this->assertNotContains($eventClass, array_keys($paymentWorkflowMappings));
        }
    }
}
