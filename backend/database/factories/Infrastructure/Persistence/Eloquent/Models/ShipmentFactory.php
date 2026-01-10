<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Shipment;
use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShipmentFactory extends Factory
{
    protected $model = Shipment::class;

    public function definition(): array
    {
        $statuses = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'failed', 'cancelled'];
        $status = $this->faker->randomElement($statuses);
        
        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => TenantEloquentModel::factory(),
            'order_id' => Order::factory(),
            'shipping_method_id' => ShippingMethod::factory(),
            'tracking_number' => $this->faker->regexify('[A-Z]{2}[0-9]{10}[A-Z]{2}'),
            'carrier_reference' => $this->faker->optional()->regexify('[A-Z0-9]{8}'),
            'status' => $status,
            'shipping_address' => [
                'name' => $this->faker->name(),
                'phone' => $this->faker->phoneNumber(),
                'address' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
                'postal_code' => $this->faker->postcode(),
                'country' => 'Indonesia',
            ],
            'return_address' => [
                'name' => $this->faker->company(),
                'phone' => $this->faker->phoneNumber(),
                'address' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
                'postal_code' => $this->faker->postcode(),
                'country' => 'Indonesia',
            ],
            'weight_kg' => $this->faker->randomFloat(3, 0.1, 10.0),
            'dimensions' => [
                'length' => $this->faker->numberBetween(10, 100),
                'width' => $this->faker->numberBetween(10, 80),
                'height' => $this->faker->numberBetween(5, 50),
            ],
            'shipping_cost' => $this->faker->randomFloat(2, 10000, 100000),
            'currency' => 'IDR',
            'items' => [
                [
                    'name' => $this->faker->words(3, true),
                    'quantity' => $this->faker->numberBetween(1, 10),
                    'weight' => $this->faker->randomFloat(2, 0.1, 5.0),
                ],
            ],
            'special_instructions' => $this->faker->optional()->sentence(),
            'shipped_at' => $status !== 'pending' ? $this->faker->dateTimeBetween('-7 days', 'now') : null,
            'estimated_delivery' => $this->faker->dateTimeBetween('now', '+14 days'),
            'delivered_at' => $status === 'delivered' ? $this->faker->dateTimeBetween('-3 days', 'now') : null,
            'tracking_events' => $this->generateTrackingEvents($status),
            'metadata' => [
                'insurance' => $this->faker->boolean(),
                'signature_required' => $this->faker->boolean(),
                'pickup_location' => $this->faker->optional()->address(),
            ],
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'shipped_at' => null,
            'delivered_at' => null,
            'estimated_delivery' => null,
            'tracking_events' => null,
        ]);
    }

    public function processing(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'processing',
            'shipped_at' => null,
            'delivered_at' => null,
            'tracking_events' => [
                [
                    'timestamp' => now()->subHours(2)->toISOString(),
                    'status' => 'processing',
                    'description' => 'Package is being processed at our facility',
                    'location' => 'Jakarta Sorting Center',
                ]
            ],
        ]);
    }

    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'shipped',
            'shipped_at' => now()->subHours(6),
            'delivered_at' => null,
            'tracking_events' => [
                [
                    'timestamp' => now()->subHours(6)->toISOString(),
                    'status' => 'shipped',
                    'description' => 'Package has been shipped',
                    'location' => 'Jakarta Distribution Center',
                ]
            ],
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'delivered',
            'shipped_at' => now()->subDays(3),
            'delivered_at' => now()->subHours(2),
            'tracking_events' => [
                [
                    'timestamp' => now()->subDays(3)->toISOString(),
                    'status' => 'shipped',
                    'description' => 'Package has been shipped',
                    'location' => 'Jakarta Distribution Center',
                ],
                [
                    'timestamp' => now()->subDays(2)->toISOString(),
                    'status' => 'in_transit',
                    'description' => 'Package is in transit',
                    'location' => 'Surabaya Distribution Center',
                ],
                [
                    'timestamp' => now()->subHours(2)->toISOString(),
                    'status' => 'delivered',
                    'description' => 'Package has been delivered',
                    'location' => 'Destination Address',
                ]
            ],
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'shipped_at' => null,
            'delivered_at' => null,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'failed',
            'shipped_at' => $this->faker->dateTimeBetween('-7 days', '-1 day'),
            'delivered_at' => null,
            'tracking_events' => [
                [
                    'timestamp' => now()->subDays(1)->toISOString(),
                    'status' => 'failed',
                    'description' => 'Delivery failed - recipient not available',
                    'location' => 'Local Delivery Hub',
                ]
            ],
        ]);
    }

    private function generateTrackingEvents(string $status): ?array
    {
        if ($status === 'pending') {
            return null;
        }

        $events = [];
        
        if (in_array($status, ['processing', 'shipped', 'in_transit', 'delivered', 'failed'])) {
            $events[] = [
                'timestamp' => now()->subDays(2)->toISOString(),
                'status' => 'processing',
                'description' => 'Package is being processed',
                'location' => 'Sorting Center',
            ];
        }

        if (in_array($status, ['shipped', 'in_transit', 'delivered'])) {
            $events[] = [
                'timestamp' => now()->subDay()->toISOString(),
                'status' => 'shipped',
                'description' => 'Package has been shipped',
                'location' => 'Distribution Center',
            ];
        }

        if (in_array($status, ['in_transit', 'delivered'])) {
            $events[] = [
                'timestamp' => now()->subHours(12)->toISOString(),
                'status' => 'in_transit',
                'description' => 'Package is in transit',
                'location' => 'Transit Hub',
            ];
        }

        if ($status === 'delivered') {
            $events[] = [
                'timestamp' => now()->subHours(2)->toISOString(),
                'status' => 'delivered',
                'description' => 'Package delivered successfully',
                'location' => 'Destination',
            ];
        }

        return $events;
    }
}