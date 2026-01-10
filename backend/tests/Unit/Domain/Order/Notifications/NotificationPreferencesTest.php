<?php

namespace Tests\Unit\Domain\Order\Notifications;

use App\Domain\Order\Notifications\OrderCreatedNotification;
use App\Domain\Order\Notifications\OrderShippedNotification;
use App\Infrastructure\Notifications\Channels\SmsChannel;
use App\Infrastructure\Notifications\Channels\WhatsappChannel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationPreferencesTest extends TestCase
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
        ]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 500000,
        ]);
    }

    public function test_channel_preference_management_whatsapp_enabled(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'channels' => ['whatsapp', 'email'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains(WhatsappChannel::class, $channels);
        $this->assertContains('mail', $channels);
    }

    public function test_channel_preference_management_sms_enabled(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'channels' => ['sms', 'email'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains(SmsChannel::class, $channels);
        $this->assertContains('mail', $channels);
    }

    public function test_disabled_channel_filtering_whatsapp(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'disabled' => ['whatsapp'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_disabled_channel_filtering_sms(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'disabled' => ['sms'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(SmsChannel::class, $channels);
        $this->assertContains(WhatsappChannel::class, $channels);
    }

    public function test_disabled_channel_filtering_multiple_channels(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'disabled' => ['whatsapp', 'sms'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
        $this->assertContains('mail', $channels);
    }

    public function test_customer_notification_opt_out_complete_disable(): void
    {
        $this->customer->update([
            'notification_preferences' => [
                'enabled' => false,
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_customer_notification_opt_out_via_metadata(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'enabled' => false,
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_phone_number_validation_valid_indonesian_number(): void
    {
        $this->customer->update(['phone' => '081234567890']);

        $notification = new OrderCreatedNotification($this->order);
        $whatsappPayload = $notification->toWhatsapp($this->customer);

        $this->assertNotNull($whatsappPayload);
        $this->assertStringStartsWith('+62', $whatsappPayload['to']);
        $this->assertEquals('+6281234567890', $whatsappPayload['to']);
    }

    public function test_phone_number_validation_international_format(): void
    {
        $this->customer->update(['phone' => '+6281234567890']);

        $notification = new OrderCreatedNotification($this->order);
        $whatsappPayload = $notification->toWhatsapp($this->customer);

        $this->assertNotNull($whatsappPayload);
        $this->assertEquals('+6281234567890', $whatsappPayload['to']);
    }

    public function test_phone_number_formatting_local_to_international(): void
    {
        $this->customer->update(['phone' => '0812345678']);

        $notification = new OrderCreatedNotification($this->order);
        $whatsappPayload = $notification->toWhatsapp($this->customer);

        $this->assertNotNull($whatsappPayload);
        $this->assertStringStartsWith('+62', $whatsappPayload['to']);
    }

    public function test_phone_number_validation_returns_null_for_invalid(): void
    {
        $this->customer->update(['phone' => 'invalid_phone']);

        $notification = new OrderCreatedNotification($this->order);
        $whatsappPayload = $notification->toWhatsapp($this->customer);

        $this->assertNull($whatsappPayload);
    }

    public function test_notification_not_sent_when_phone_empty(): void
    {
        $this->customer->update(['phone' => '']);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_notification_not_sent_when_phone_null(): void
    {
        $this->customer->update(['phone' => null]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_whatsapp_channel_disabled_by_config(): void
    {
        config()->set('services.whatsapp.enabled', false);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
    }

    public function test_sms_channel_disabled_by_config(): void
    {
        config()->set('services.sms.enabled', false);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_channel_preference_specific_channels(): void
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

        $this->assertContains(SmsChannel::class, $channels);
        $this->assertContains('mail', $channels);
        $this->assertNotContains(WhatsappChannel::class, $channels);
    }

    public function test_database_notification_channel_always_included(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'disabled' => ['whatsapp', 'sms'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('database', $channels);
    }

    public function test_mail_channel_always_included(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'channels' => ['sms'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains('mail', $channels);
    }

    public function test_multiple_notification_types_respect_preferences(): void
    {
        $this->customer->update([
            'metadata' => [
                'notifications' => [
                    'disabled' => ['whatsapp'],
                ],
            ],
        ]);

        $notifications = [
            new OrderCreatedNotification($this->order),
            new OrderShippedNotification($this->order),
        ];

        foreach ($notifications as $notification) {
            $channels = $notification->via($this->customer);
            $this->assertNotContains(WhatsappChannel::class, $channels);
            $this->assertContains(SmsChannel::class, $channels);
        }
    }

    public function test_metadata_notification_channels_array(): void
    {
        $this->customer->update([
            'metadata' => [
                'notification_channels' => ['email', 'whatsapp'],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains(WhatsappChannel::class, $channels);
        $this->assertContains('mail', $channels);
        $this->assertNotContains(SmsChannel::class, $channels);
    }

    public function test_fallback_to_default_preferences_when_none_set(): void
    {
        $this->customer->update([
            'notification_preferences' => null,
            'metadata' => null,
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
        $this->assertContains('mail', $channels);
    }

    public function test_preference_priority_metadata_over_preferences(): void
    {
        $this->customer->update([
            'notification_preferences' => [
                'channels' => ['email'],
            ],
            'metadata' => [
                'notifications' => [
                    'disabled' => ['whatsapp'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($this->order);
        $channels = $notification->via($this->customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_sms_payload_contains_phone_number(): void
    {
        $this->customer->update(['phone' => '081234567890']);

        $notification = new OrderCreatedNotification($this->order);
        $smsPayload = $notification->toSms($this->customer);

        $this->assertNotNull($smsPayload);
        $this->assertArrayHasKey('to', $smsPayload);
        $this->assertStringStartsWith('+62', $smsPayload['to']);
    }

    public function test_sms_payload_contains_message_body(): void
    {
        $this->customer->update(['phone' => '081234567890']);

        $notification = new OrderCreatedNotification($this->order);
        $smsPayload = $notification->toSms($this->customer);

        $this->assertNotNull($smsPayload);
        $this->assertArrayHasKey('body', $smsPayload);
        $this->assertNotEmpty($smsPayload['body']);
    }

    public function test_notification_context_includes_order_id(): void
    {
        $this->customer->update(['phone' => '081234567890']);

        $notification = new OrderCreatedNotification($this->order);
        $smsPayload = $notification->toSms($this->customer);

        $this->assertNotNull($smsPayload);
        $this->assertArrayHasKey('context', $smsPayload);
        $this->assertEquals($this->order->id, $smsPayload['context']['order_id']);
    }

    public function test_notification_context_includes_order_number(): void
    {
        $this->customer->update(['phone' => '081234567890']);

        $notification = new OrderCreatedNotification($this->order);
        $smsPayload = $notification->toSms($this->customer);

        $this->assertNotNull($smsPayload);
        $this->assertArrayHasKey('context', $smsPayload);
        $this->assertEquals($this->order->order_number, $smsPayload['context']['order_number']);
    }
}
