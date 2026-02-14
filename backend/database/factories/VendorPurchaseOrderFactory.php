<?php

namespace Database\Factories;

use App\Models\VendorPurchaseOrder;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\VendorPurchaseOrder>
 */
class VendorPurchaseOrderFactory extends Factory
{
    protected $model = VendorPurchaseOrder::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(5000000, 50000000); // Rp 50,000 - 500,000 in cents
        $tax = (int) ($subtotal * 0.11); // 11% PPN
        $shipping = 0;
        $discount = 0;
        $grandTotal = $subtotal + $tax + $shipping - $discount;

        $issueDate = $this->faker->dateTimeBetween('-30 days', 'now');
        $validityDate = (clone $issueDate)->modify('+30 days');
        $expectedDeliveryDate = (clone $issueDate)->modify('+18 days');

        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => TenantEloquentModel::factory(),
            'order_id' => Order::factory(),
            'quote_id' => OrderVendorNegotiation::factory(),
            'vendor_id' => UserEloquentModel::factory(),
            'po_number' => 'PO-' . $issueDate->format('Ym') . '-' . str_pad($this->faker->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'issue_date' => $issueDate,
            'validity_date' => $validityDate,
            'expected_delivery_date' => $expectedDeliveryDate,
            'delivery_address' => json_encode([
                'company' => 'PT Custom Etching Xenial',
                'street' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'state' => 'DKI Jakarta',
                'postal_code' => $this->faker->postcode(),
                'country' => 'Indonesia',
            ]),
            'delivery_method' => $this->faker->randomElement(['courier', 'pickup', 'freight']),
            'special_instructions' => $this->faker->optional()->sentence(),
            'subtotal' => $subtotal,
            'discount' => $discount,
            'tax' => $tax,
            'shipping' => $shipping,
            'grand_total' => $grandTotal,
            'payment_method' => $this->faker->randomElement(['bank_transfer', 'cash', 'other']),
            'payment_schedule' => [
                'down_payment_percentage' => 50,
                'balance_on_delivery' => true,
            ],
            'status' => 'draft',
            'pdf_path' => null,
            'pdf_generated_at' => null,
            'created_by' => UserEloquentModel::factory(),
            'sent_at' => null,
            'accepted_at' => null,
            'accepted_by' => null,
        ];
    }

    /**
     * Indicate that the purchase order has been sent.
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
            'sent_at' => $this->faker->dateTimeBetween($attributes['issue_date'], 'now'),
        ]);
    }

    /**
     * Indicate that the purchase order has been accepted.
     */
    public function accepted(): static
    {
        return $this->state(function (array $attributes) {
            $sentAt = $attributes['sent_at'] ?? $attributes['issue_date'];
            $acceptedAt = $this->faker->dateTimeBetween($sentAt, 'now');

            return [
                'status' => 'accepted',
                'sent_at' => $sentAt,
                'accepted_at' => $acceptedAt,
                'accepted_by' => UserEloquentModel::factory(),
            ];
        });
    }

    /**
     * Indicate that the purchase order has been completed.
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $sentAt = $attributes['sent_at'] ?? $attributes['issue_date'];
            $acceptedAt = $attributes['accepted_at'] ?? $this->faker->dateTimeBetween($sentAt, 'now');

            return [
                'status' => 'completed',
                'sent_at' => $sentAt,
                'accepted_at' => $acceptedAt,
                'accepted_by' => UserEloquentModel::factory(),
            ];
        });
    }

    /**
     * Indicate that the purchase order has been cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }

    /**
     * Indicate that the purchase order is overdue.
     */
    public function overdue(): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_delivery_date' => $this->faker->dateTimeBetween('-10 days', '-1 day'),
            'status' => 'accepted',
        ]);
    }

    /**
     * Indicate that the purchase order has no estimated delivery date.
     * Useful for testing notifications that need to set this field manually.
     */
    public function withoutEstimatedDeliveryDate(): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_delivery_date' => null,
        ]);
    }
}
