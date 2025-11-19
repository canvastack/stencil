<?php

namespace Tests\Unit\Domain\Order\Notifications;

use App\Domain\Order\Notifications\OrderCreatedNotification;
use App\Infrastructure\Notifications\Channels\SmsChannel;
use App\Infrastructure\Notifications\Channels\WhatsappChannel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Tests\TestCase;

class OrderNotificationChannelsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.whatsapp.enabled', true);
        config()->set('services.sms.enabled', true);
        config()->set('app.frontend_url', 'https://example.com');
    }

    public function test_via_includes_whatsapp_and_sms_when_enabled(): void
    {
        $order = $this->makeOrder();
        $customer = $this->makeCustomer();

        $notification = new OrderCreatedNotification($order);

        $channels = $notification->via($customer);

        $this->assertContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_via_excludes_whatsapp_when_customer_disables_channel(): void
    {
        $order = $this->makeOrder();
        $customer = $this->makeCustomer([
            'metadata' => [
                'notifications' => [
                    'disabled' => ['whatsapp'],
                ],
            ],
        ]);

        $notification = new OrderCreatedNotification($order);

        $channels = $notification->via($customer);

        $this->assertNotContains(WhatsappChannel::class, $channels);
        $this->assertContains(SmsChannel::class, $channels);
    }

    public function test_whatsapp_payload_contains_expected_context(): void
    {
        $order = $this->makeOrder([
            'id' => 99,
            'order_number' => 'ORD-456',
            'total_amount' => 200000,
        ]);

        $customer = $this->makeCustomer([
            'phone' => '081234567890',
        ]);

        $notification = new OrderCreatedNotification($order);

        $payload = $notification->toWhatsapp($customer);

        $this->assertNotNull($payload);
        $this->assertStringStartsWith('+62', $payload['to']);
        $this->assertStringContainsString('ORD-456', $payload['body']);
        $this->assertSame('https://example.com/orders/99', $payload['metadata']['order_url']);
    }

    private function makeOrder(array $attributes = []): Order
    {
        $order = new Order();
        $order->id = $attributes['id'] ?? 1;
        $order->order_number = $attributes['order_number'] ?? 'ORD-123';
        $order->status = $attributes['status'] ?? 'created';
        $order->total_amount = $attributes['total_amount'] ?? 150000;
        $order->total_paid_amount = $attributes['total_paid_amount'] ?? 0;

        return $order;
    }

    private function makeCustomer(array $attributes = []): Customer
    {
        $customer = new Customer();
        $customer->name = $attributes['name'] ?? 'Customer';
        $customer->phone = $attributes['phone'] ?? '081234567890';

        if (array_key_exists('metadata', $attributes)) {
            $customer->metadata = $attributes['metadata'];
        }

        if (array_key_exists('notification_preferences', $attributes)) {
            $customer->notification_preferences = $attributes['notification_preferences'];
        }

        return $customer;
    }
}
