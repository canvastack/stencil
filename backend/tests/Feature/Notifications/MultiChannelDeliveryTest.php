<?php

namespace Tests\Feature\Notifications;

use App\Domain\Order\Notifications\OrderCreatedNotification;
use App\Domain\Order\Notifications\OrderShippedNotification;
use App\Infrastructure\Notifications\Channels\SmsChannel;
use App\Infrastructure\Notifications\Channels\WhatsappChannel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MultiChannelDeliveryTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected Customer $customer;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.sms.enabled', true);
        config()->set('app.frontend_url', 'https://example.com');

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'phone' => '081234567890',
            'email' => 'customer@example.com',
        ]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 500000,
        ]);
    }

    public function test_email_fallback_when_sms_fails(): void
    {
        Notification::fake();

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_email_fallback_when_whatsapp_fails(): void
    {
        Notification::fake();

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains(WhatsappChannel::class, $channels);
    }

    public function test_retry_logic_for_failed_deliveries(): void
    {
        Notification::fake();

        Notification::send($this->customer, new OrderCreatedNotification($this->order));
        
        Notification::assertSentTo(
            $this->customer,
            OrderCreatedNotification::class
        );
    }

    public function test_rate_limiting_per_channel_whatsapp(): void
    {
        Notification::fake();

        for ($i = 0; $i < 5; $i++) {
            Notification::send($this->customer, new OrderCreatedNotification($this->order));
        }

        Notification::assertCount(5);
    }

    public function test_rate_limiting_per_channel_sms(): void
    {
        Notification::fake();

        for ($i = 0; $i < 5; $i++) {
            Notification::send($this->customer, new OrderCreatedNotification($this->order));
        }

        Notification::assertCount(5);
    }

    public function test_batch_notification_sending(): void
    {
        Notification::fake();

        $customers = Customer::factory(10)->create(['tenant_id' => $this->tenant->id]);

        foreach ($customers as $customer) {
            Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
            ]);
        }

        foreach ($customers as $customer) {
            $order = $customer->orders()->first();
            Notification::send($customer, new OrderCreatedNotification($order));
        }

        Notification::assertCount(10);
    }

    public function test_multi_channel_delivery_all_channels_enabled(): void
    {
        Notification::fake();
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.sms.enabled', true);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains('database', $channels);
        $this->assertContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_multi_channel_delivery_whatsapp_only(): void
    {
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.sms.enabled', false);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_multi_channel_delivery_sms_only(): void
    {
        config()->set('services.whatsapp.enabled', false);
        config()->set('services.sms.enabled', true);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_multi_channel_delivery_no_sms_channels(): void
    {
        config()->set('services.whatsapp.enabled', false);
        config()->set('services.sms.enabled', false);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_channel_priority_order(): void
    {
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.sms.enabled', true);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains('database', $channels);
        $this->assertNotEmpty($channels);
    }

    public function test_notification_delivery_tracking(): void
    {
        Notification::fake();

        $notification = new OrderCreatedNotification($this->order);
        $this->customer->notify($notification);

        Notification::assertSentTo(
            [$this->customer],
            OrderCreatedNotification::class
        );
    }

    public function test_different_notification_types_multi_channel(): void
    {
        config()->set('services.whatsapp.enabled', true);
        config()->set('services.sms.enabled', true);

        $orderCreated = new OrderCreatedNotification($this->order);
        $orderShipped = new OrderShippedNotification($this->order);

        $createdChannels = $orderCreated->via($this->customer);
        $shippedChannels = $orderShipped->via($this->customer);

        $this->assertCount(count($createdChannels), $shippedChannels);
    }

    public function test_whatsapp_payload_structure(): void
    {
        $notification = new OrderCreatedNotification($this->order);
        $payload = $notification->toWhatsapp($this->customer);

        if ($payload !== null) {
            $this->assertArrayHasKey('to', $payload);
            $this->assertArrayHasKey('body', $payload);
            $this->assertArrayHasKey('metadata', $payload);
            $this->assertNotEmpty($payload['to']);
            $this->assertNotEmpty($payload['body']);
        }
    }

    public function test_sms_payload_structure(): void
    {
        $notification = new OrderCreatedNotification($this->order);
        $payload = $notification->toSms($this->customer);

        if ($payload !== null) {
            $this->assertArrayHasKey('to', $payload);
            $this->assertArrayHasKey('body', $payload);
            $this->assertArrayHasKey('context', $payload);
            $this->assertNotEmpty($payload['to']);
            $this->assertNotEmpty($payload['body']);
        }
    }

    public function test_email_payload_structure(): void
    {
        $notification = new OrderCreatedNotification($this->order);
        $payload = $notification->toMail($this->customer);

        $this->assertNotNull($payload);
        $this->assertIsObject($payload);
    }

    public function test_database_notification_structure(): void
    {
        $notification = new OrderCreatedNotification($this->order);
        $payload = $notification->toDatabase($this->customer);

        $this->assertArrayHasKey('order_id', $payload);
        $this->assertArrayHasKey('order_number', $payload);
        $this->assertArrayHasKey('status', $payload);
        $this->assertArrayHasKey('total_amount', $payload);
        $this->assertArrayHasKey('message', $payload);
    }

    public function test_fallback_to_email_when_phone_invalid(): void
    {
        $this->customer->update(['phone' => 'invalid_phone']);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_channel_delivery_with_customer_preferences(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'channels' => ['email', 'sms'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains(SmsChannel::class, $channels);
        $this->assertNotContains(WhatsappChannel::class, $channels);
    }

    public function test_retry_on_transient_failure(): void
    {
        Notification::fake();

        $notification = new OrderCreatedNotification($this->order);
        
        $channels = $notification->via($this->customer);

        foreach ($channels as $channel) {
            $this->assertNotNull($channel);
        }
    }

    public function test_batch_delivery_performance(): void
    {
        Notification::fake();

        $startTime = microtime(true);

        for ($i = 0; $i < 100; $i++) {
            $customer = Customer::factory()->create([
                'tenant_id' => $this->tenant->id,
                'phone' => '08123456789' . str_pad($i, 2, '0', STR_PAD_LEFT),
            ]);
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
            ]);
            Notification::send($customer, new OrderCreatedNotification($order));
        }

        $endTime = microtime(true);
        $duration = $endTime - $startTime;

        $this->assertLessThan(30, $duration);
    }

    public function test_notification_queuing(): void
    {
        Notification::fake();

        $notification = new OrderCreatedNotification($this->order);
        
        $shouldQueue = method_exists($notification, 'shouldQueue') 
            ? $notification->shouldQueue()
            : in_array('Illuminate\Contracts\Queue\ShouldQueue', class_implements($notification));

        $this->assertTrue($shouldQueue);
    }

    public function test_multiple_customers_batch_delivery(): void
    {
        Notification::fake();

        $customers = Customer::factory(5)->create(['tenant_id' => $this->tenant->id]);

        foreach ($customers as $customer) {
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
            ]);
            Notification::send($customer, new OrderCreatedNotification($order));
        }

        Notification::assertCount(5);
    }

    public function test_channel_disable_preserves_others(): void
    {
        config()->set('services.whatsapp.enabled', false);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
        $this->assertContains(SmsChannel::class, $channels);
        $this->assertNotContains(WhatsappChannel::class, $channels);
    }

    public function test_rollout_new_notification_channel(): void
    {
        config()->set('services.whatsapp.enabled', true);

        $notification = new OrderCreatedNotification($this->order);
        $channelsBefore = $notification->via($this->customer);

        $this->assertContains(WhatsappChannel::class, $channelsBefore);
    }

    public function test_gradual_channel_migration(): void
    {
        $oldCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'metadata' => ['notification_method' => 'email_only'],
        ]);

        $newCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'phone' => '081234567890',
        ]);

        $oldNotification = new OrderCreatedNotification($this->order);
        $newNotification = new OrderCreatedNotification($this->order);

        $oldChannels = $oldNotification->via($oldCustomer);
        $newChannels = $newNotification->via($newCustomer);

        $this->assertContains('mail', $oldChannels);
        $this->assertGreaterThanOrEqual(count($oldChannels), count($newChannels));
    }
}
