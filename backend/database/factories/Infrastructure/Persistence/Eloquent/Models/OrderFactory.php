<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        // Create tenant and customer with matching tenant_id for multi-tenant compliance
        $tenant = TenantEloquentModel::factory()->create();
        $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'tenant_id' => $tenant->id,
            'order_number' => 'ORD-' . strtoupper(Str::random(8)),
            'customer_id' => $customer->id,
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

    /**
     * Configure factory to handle tenant_id override when custom customer_id provided
     * 
     * MULTI-TENANT COMPLIANCE:
     * When test provides customer_id, automatically use matching tenant_id
     * to prevent cross-tenant relationship violations.
     */
    public function configure(): static
    {
        return $this->afterMaking(function (Order $order) {
            // If custom customer_id was provided, sync tenant_id
            $customer = Customer::find($order->customer_id);
            if ($customer) {
                $order->tenant_id = $customer->tenant_id;
            }
        });
    }

}
