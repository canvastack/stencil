<?php

namespace Tests\Feature\ExchangeRate;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\ExchangeRateHistory;
use App\Models\ExchangeRateProvider;
use App\Models\ExchangeRateSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderConversionPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private ExchangeRateProvider $provider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'uuid' => Str::uuid(),
            'name' => 'Test Tenant - Order Conversion',
            'slug' => 'test-tenant-order-conversion-' . time(),
            'domain' => 'test-order-conversion-' . time() . '.test',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);

        $this->customer = Customer::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Customer',
            'email' => 'test-' . time() . '@customer.com',
            'phone' => '1234567890',
            'status' => 'active',
        ]);

        $this->provider = ExchangeRateProvider::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Provider',
            'code' => 'test_provider_' . time(),
            'api_url' => 'https://test.com',
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);
    }

    public function test_property_order_rate_snapshot(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $exchangeRate = (float) (rand(14000, 16000) / 100);
            $amountUsdCents = rand(1000, 100000);
            $expectedIdrCents = (int) round($amountUsdCents * $exchangeRate);
            
            ExchangeRateSetting::updateOrCreate(
                ['tenant_id' => $this->tenant->id],
                [
                    'uuid' => Str::uuid(),
                    'mode' => 'manual',
                    'manual_rate' => $exchangeRate,
                    'current_rate' => $exchangeRate,
                    'auto_update_enabled' => false,
                ]
            );

            ExchangeRateHistory::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'rate' => $exchangeRate,
                'provider_id' => $this->provider->id,
                'source' => 'manual',
                'event_type' => 'rate_change',
            ]);

            $order = Order::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'order_number' => "ORD-" . date('Ymd') . "-" . str_pad($i, 6, '0', STR_PAD_LEFT),
                'status' => 'pending',
                'payment_status' => 'pending',
                'items' => [['product_id' => Str::uuid(), 'product_name' => 'Test Product', 'quantity' => 1, 'unit_price' => $amountUsdCents, 'total_price' => $amountUsdCents]],
                'total_amount' => $expectedIdrCents,
                'currency' => 'IDR',
                'exchange_rate' => $exchangeRate,
                'original_amount_usd' => $amountUsdCents,
                'converted_amount_idr' => $expectedIdrCents,
            ]);

            $order->refresh();
            $this->assertNotNull($order->exchange_rate);
            $this->assertEquals($exchangeRate, (float) $order->exchange_rate, '', 0.01);
            $this->assertNotNull($order->original_amount_usd);
            $this->assertEquals($amountUsdCents, $order->original_amount_usd);
            $this->assertNotNull($order->converted_amount_idr);
            $this->assertEquals($expectedIdrCents, $order->converted_amount_idr);
            $this->assertEquals((int) round($order->original_amount_usd * $order->exchange_rate), $order->converted_amount_idr);
        }
    }

    public function test_property_historical_order_immutability(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $initialRate = (float) (rand(14000, 16000) / 100);
            $amountUsdCents = rand(1000, 100000);
            $initialIdrCents = (int) round($amountUsdCents * $initialRate);
            
            $setting = ExchangeRateSetting::updateOrCreate(
                ['tenant_id' => $this->tenant->id],
                [
                    'uuid' => Str::uuid(),
                    'mode' => 'manual',
                    'manual_rate' => $initialRate,
                    'current_rate' => $initialRate,
                    'auto_update_enabled' => false,
                ]
            );

            $order = Order::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'order_number' => "ORD-IMM-" . date('Ymd') . "-" . str_pad($i, 6, '0', STR_PAD_LEFT),
                'status' => 'pending',
                'payment_status' => 'pending',
                'items' => [['product_id' => Str::uuid(), 'product_name' => 'Test Product', 'quantity' => 1, 'unit_price' => $amountUsdCents, 'total_price' => $amountUsdCents]],
                'total_amount' => $initialIdrCents,
                'currency' => 'IDR',
                'exchange_rate' => $initialRate,
                'original_amount_usd' => $amountUsdCents,
                'converted_amount_idr' => $initialIdrCents,
            ]);

            $originalExchangeRate = $order->exchange_rate;
            $originalAmountUsd = $order->original_amount_usd;
            $originalAmountIdr = $order->converted_amount_idr;
            $originalTotalAmount = $order->total_amount;

            $newRate = (float) (rand(14000, 16000) / 100);
            while (abs($newRate - $initialRate) < 1.0) {
                $newRate = (float) (rand(14000, 16000) / 100);
            }

            $setting->update(['manual_rate' => $newRate, 'current_rate' => $newRate]);

            ExchangeRateHistory::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'rate' => $newRate,
                'provider_id' => $this->provider->id,
                'source' => 'manual',
                'event_type' => 'rate_change',
            ]);

            $order->refresh();
            $this->assertEquals($originalExchangeRate, (float) $order->exchange_rate, '', 0.01);
            $this->assertEquals($originalAmountUsd, $order->original_amount_usd);
            $this->assertEquals($originalAmountIdr, $order->converted_amount_idr);
            $this->assertEquals($originalTotalAmount, $order->total_amount);
            $this->assertNotEquals($newRate, (float) $order->exchange_rate, '', 0.01);
            $this->assertEquals((int) round($order->original_amount_usd * $order->exchange_rate), $order->converted_amount_idr);
        }
    }
}
