<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerNotification;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Application\CustomerQuote\Services\CustomerNotificationService;

class CustomerNotificationTest extends TestCase
{
    use RefreshDatabase;

    private CustomerNotificationService $notificationService;
    private TenantEloquentModel $tenant;
    private Customer $customer;
    private Order $order;
    private CustomerQuote $quote;

    protected function setUp(): void
    {
        parent::setUp();

        $this->notificationService = app(CustomerNotificationService::class);

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        // Create quote manually
        $this->quote = CustomerQuote::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => 1, // Dummy vendor quote ID
            'quote_number' => 'CQ-2026-TEST',
            'title' => 'Test Quote',
            'vendor_total_cost' => 1000000,
            'base_profit_amount' => 200000,
            'base_profit_percentage' => 20.00,
            'subtotal' => 1200000,
            'tax_rate' => 11.00,
            'tax_amount' => 132000,
            'grand_total' => 1332000,
            'total_profit_amount' => 200000,
            'total_profit_percentage' => 20.00,
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'DP 50% + Balance 50%',
            'status' => 'draft',
        ]);
    }

    /** @test */
    public function it_creates_quote_sent_notification()
    {
        $notification = $this->notificationService->notifyQuoteSent($this->quote);

        $this->assertInstanceOf(CustomerNotification::class, $notification);
        $this->assertEquals('quote_sent', $notification->type);
        $this->assertEquals($this->customer->id, $notification->customer_id);
        $this->assertEquals($this->quote->id, $notification->customer_quote_id);
        $this->assertFalse($notification->is_read);
        $this->assertEquals('high', $notification->priority);
    }

    /** @test */
    public function it_creates_quote_accepted_notification()
    {
        $notification = $this->notificationService->notifyQuoteAccepted($this->quote);

        $this->assertInstanceOf(CustomerNotification::class, $notification);
        $this->assertEquals('quote_accepted', $notification->type);
        $this->assertEquals($this->customer->id, $notification->customer_id);
        $this->assertFalse($notification->is_read);
    }

    /** @test */
    public function it_gets_unread_notifications()
    {
        // Create multiple notifications
        $this->notificationService->notifyQuoteSent($this->quote);
        $this->notificationService->notifyQuoteAccepted($this->quote);

        $unread = $this->notificationService->getUnreadNotifications(
            $this->customer->id,
            $this->tenant->id
        );

        $this->assertCount(2, $unread);
    }

    /** @test */
    public function it_marks_notification_as_read()
    {
        $notification = $this->notificationService->notifyQuoteSent($this->quote);

        $this->assertFalse($notification->is_read);

        $success = $this->notificationService->markAsRead(
            $notification->uuid,
            $this->customer->id,
            $this->tenant->id
        );

        $this->assertTrue($success);

        $notification->refresh();
        $this->assertTrue($notification->is_read);
        $this->assertNotNull($notification->read_at);
    }

    /** @test */
    public function it_marks_all_notifications_as_read()
    {
        // Create multiple notifications
        $this->notificationService->notifyQuoteSent($this->quote);
        $this->notificationService->notifyQuoteAccepted($this->quote);

        $count = $this->notificationService->markAllAsRead(
            $this->customer->id,
            $this->tenant->id
        );

        $this->assertEquals(2, $count);

        $unreadCount = $this->notificationService->getUnreadCount(
            $this->customer->id,
            $this->tenant->id
        );

        $this->assertEquals(0, $unreadCount);
    }

    /** @test */
    public function it_deletes_notification()
    {
        $notification = $this->notificationService->notifyQuoteSent($this->quote);

        $success = $this->notificationService->deleteNotification(
            $notification->uuid,
            $this->customer->id,
            $this->tenant->id
        );

        $this->assertTrue($success);

        $this->assertDatabaseMissing('customer_notifications', [
            'uuid' => $notification->uuid,
        ]);
    }

    /** @test */
    public function it_gets_unread_count()
    {
        $this->notificationService->notifyQuoteSent($this->quote);
        $this->notificationService->notifyQuoteAccepted($this->quote);

        $count = $this->notificationService->getUnreadCount(
            $this->customer->id,
            $this->tenant->id
        );

        $this->assertEquals(2, $count);
    }
}
