<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $tenantFactory = Tenant::factory();

        return [
            'tenant_id' => $tenantFactory,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'customer_id' => Customer::factory()->for($tenantFactory, 'tenant'),
            'vendor_id' => null,
            'status' => 'new',
            'payment_status' => 'unpaid',
            'production_type' => 'standard',
            'items' => [
                [
                    'sku' => Str::upper($this->faker->bothify('SKU-####')),
                    'name' => $this->faker->sentence(3),
                    'quantity' => 1,
                    'price' => 100000,
                ],
            ],
            'subtotal' => 100000,
            'tax' => 0,
            'shipping_cost' => 0,
            'discount' => 0,
            'total_amount' => 100000,
            'down_payment_amount' => 30000,
            'total_paid_amount' => 0,
            'total_disbursed_amount' => 0,
            'currency' => 'IDR',
            'shipping_address' => [
                'line1' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
                'postal_code' => $this->faker->postcode(),
            ],
            'billing_address' => [
                'line1' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
                'postal_code' => $this->faker->postcode(),
            ],
            'customer_notes' => $this->faker->optional()->sentence(),
            'internal_notes' => null,
            'payment_method' => null,
            'payment_date' => null,
            'down_payment_due_at' => null,
            'down_payment_paid_at' => null,
            'estimated_delivery' => null,
            'shipped_at' => null,
            'delivered_at' => null,
            'tracking_number' => null,
            'payment_schedule' => null,
            'metadata' => [
                'sla' => null,
                'payments' => null,
            ],
        ];
    }
}
