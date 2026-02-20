<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class CustomerQuoteFactory extends Factory
{
    protected $model = CustomerQuote::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid(),
            'tenant_id' => 1,
            'order_id' => Order::factory(),
            'vendor_quote_id' => VendorQuote::factory(),
            'quote_number' => 'CQ-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT),
            'title' => 'Customer Quotation',
            'vendor_total_cost' => 1000000, // 10,000 IDR in cents
            'base_profit_amount' => 200000, // 2,000 IDR in cents
            'base_profit_percentage' => 20.00,
            'subtotal' => 1200000,
            'tax_rate' => 11.00,
            'tax_amount' => 132000,
            'grand_total' => 1332000,
            'total_profit_amount' => 200000,
            'total_profit_percentage' => 20.00,
            'currency' => 'IDR',
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'DP 50% + Balance 50%',
            'delivery_timeline' => '7-14 working days',
            'terms_and_conditions' => 'Standard terms and conditions apply',
            'status' => 'draft',
            'counter_offer_round' => 0,
            'max_negotiation_rounds' => 3,
            'response_token' => Str::uuid(),
            'history' => json_encode([]),
            'metadata' => json_encode([]),
            'created_by' => 1, // Default admin user
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
            'sent_at' => now(),
        ]);
    }

    public function accepted(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'accepted',
            'approved_at' => now(),
            'approval_method' => 'auto',
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'rejected_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'valid_until' => now()->subDays(1),
        ]);
    }
}
