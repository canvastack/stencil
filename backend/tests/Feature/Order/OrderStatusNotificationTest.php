<?php

namespace Tests\Feature\Order;

use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Listeners\OrderStatusChangedListener;
use App\Domain\Order\Listeners\BroadcastOrderStatusChanged;
use App\Events\OrderStatusChangedBroadcast;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OrderStatusNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test tenant
        $this->tenant = TenantEloquentModel::factory()->create();
        
        // Set current tenant context for multitenancy
        $this->tenant->makeCurrent();
        
        // Create test customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        // Create test admin user
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        // Create test order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'pending',
        ]);
    }

    /** @test */
    public function it_dispatches_order_status_changed_event_when_status_updates()
    {
        // Don't fake events for this test - we want to see if they're actually dispatched
        $eventDispatched = false;
        
        // Listen for the domain event
        Event::listen(\App\Domain\Order\Events\OrderStatusChanged::class, function ($event) use (&$eventDispatched) {
            $eventDispatched = true;
        });

        // Update order status
        $this->order->update(['status' => 'customer_quote']);

        // Assert that the domain event was dispatched
        $this->assertTrue($eventDispatched, 'OrderStatusChanged event was not dispatched');
    }

    /** @test */
    public function it_sends_notifications_when_order_status_changes()
    {
        Notification::fake();

        $event = new OrderStatusChanged(
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->order->uuid),
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->tenant->uuid),
            'pending',
            'shipped', // Use a status that triggers email notifications
            $this->adminUser->uuid,
            'Order shipped by admin'
        );

        $listener = new OrderStatusChangedListener();
        $listener->handle($event);

        // Assert notification was sent to customer
        Notification::assertSentTo(
            $this->customer,
            \App\Domain\Order\Notifications\OrderStatusChangedNotification::class
        );
    }

    /** @test */
    public function it_broadcasts_order_status_changes_for_real_time_updates()
    {
        Event::fake();

        $event = new OrderStatusChanged(
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->order->uuid),
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->tenant->uuid),
            'pending',
            'customer_quote',
            $this->adminUser->uuid,
            'Order status changed by admin'
        );

        $listener = new BroadcastOrderStatusChanged();
        $listener->handle($event);

        // Assert broadcast event was dispatched
        Event::assertDispatched(OrderStatusChangedBroadcast::class, function ($broadcastEvent) {
            return $broadcastEvent->broadcastWith()['order']['uuid'] === $this->order->uuid
                && $broadcastEvent->broadcastWith()['status_change']['old_status'] === 'pending'
                && $broadcastEvent->broadcastWith()['status_change']['new_status'] === 'customer_quote';
        });
    }

    /** @test */
    public function it_creates_in_app_notifications_for_relevant_users()
    {
        $event = new OrderStatusChanged(
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->order->uuid),
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->tenant->uuid),
            'pending',
            'customer_quote',
            $this->adminUser->uuid,
            'Order status changed by admin'
        );

        $listener = new OrderStatusChangedListener();
        $listener->handle($event);

        // Check that in-app notification was created in the laravel_notifications table
        $this->assertDatabaseHas('laravel_notifications', [
            'notifiable_type' => get_class($this->customer),
            'notifiable_id' => $this->customer->id,
            'type' => \App\Domain\Order\Notifications\OrderStatusChangedNotification::class,
        ]);
    }

    /** @test */
    public function it_only_sends_email_notifications_for_configured_statuses()
    {
        Notification::fake();

        // Test with non-email status
        $event = new OrderStatusChanged(
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->order->uuid),
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->tenant->uuid),
            'pending',
            'vendor_sourcing', // This should not trigger email
            $this->adminUser->uuid
        );

        $listener = new OrderStatusChangedListener();
        $listener->handle($event);

        // Should not send email notification for non-critical status
        Notification::assertNotSentTo(
            $this->customer,
            \App\Domain\Order\Notifications\OrderStatusChangedNotification::class
        );

        // Test with email status
        $emailEvent = new OrderStatusChanged(
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->order->uuid),
            new \App\Domain\Shared\ValueObjects\UuidValueObject($this->tenant->uuid),
            'in_production',
            'shipped', // This should trigger email (use 'shipped' not 'shipping')
            $this->adminUser->uuid
        );

        $listener->handle($emailEvent);

        // Should send email notification for critical status
        Notification::assertSentTo(
            $this->customer,
            \App\Domain\Order\Notifications\OrderStatusChangedNotification::class
        );
    }

    /** @test */
    public function notification_api_returns_user_notifications()
    {
        // Create some test notifications for the admin user using the custom table
        $this->adminUser->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => \App\Domain\Order\Notifications\OrderStatusChangedNotification::class,
            'data' => [
                'order_id' => $this->order->id,
                'order_uuid' => $this->order->uuid,
                'order_number' => $this->order->order_number,
                'old_status' => 'pending',
                'new_status' => 'customer_quote',
                'message' => 'Order status updated',
            ],
            'read_at' => null,
        ]);

        // Authenticate as admin user
        $this->actingAs($this->adminUser, 'sanctum');

        // Call notifications API
        $response = $this->getJson('/api/v1/tenant/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'notifications' => [
                    '*' => [
                        'id',
                        'type',
                        'data',
                        'read_at',
                        'created_at',
                    ]
                ],
                'pagination',
                'unread_count'
            ]);
    }
}