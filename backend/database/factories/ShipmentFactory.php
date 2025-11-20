<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\Shipment;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShipmentFactory extends Factory
{
    protected $model = Shipment::class;

    public function definition(): array
    {
        $status = fake()->randomElement(['pending', 'processing', 'shipped', 'in_transit', 'delivered']);
        $shippedAt = $status !== 'pending' ? now()->subDays(fake()->numberBetween(1, 5)) : null;
        $estimatedDelivery = $shippedAt ? $shippedAt->addDays(fake()->numberBetween(3, 7)) : now()->addDays(fake()->numberBetween(3, 7));
        $deliveredAt = $status === 'delivered' ? $estimatedDelivery->subDays(fake()->numberBetween(0, 2)) : null;

        return [
            'uuid' => fake()->uuid(),
            'tenant_id' => null,
            'order_id' => null,
            'shipping_method_id' => null,
            'tracking_number' => fake()->optional(0.8)->regexify('[A-Z]{2}\d{8}'),
            'carrier_reference' => fake()->optional(0.6)->bothify('CR?????????'),
            'status' => $status,
            'shipping_address' => [
                'recipient_name' => fake()->name(),
                'address_line_1' => fake()->streetAddress(),
                'address_line_2' => fake()->optional(0.3)->secondaryAddress(),
                'city' => fake()->city(),
                'state_province' => fake()->state(),
                'postal_code' => fake()->postcode(),
                'country_code' => 'IDN',
                'phone' => fake()->phoneNumber(),
            ],
            'return_address' => [
                'company_name' => fake()->company(),
                'address_line_1' => fake()->streetAddress(),
                'city' => 'Jakarta',
                'state_province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'country_code' => 'IDN',
            ],
            'weight_kg' => fake()->randomFloat(2, 0.5, 20),
            'dimensions' => [
                'length' => fake()->numberBetween(10, 100),
                'width' => fake()->numberBetween(10, 80),
                'height' => fake()->numberBetween(5, 50),
            ],
            'shipping_cost' => fake()->randomFloat(2, 10000, 500000),
            'currency' => 'IDR',
            'items' => [
                [
                    'product_id' => fake()->numberBetween(1, 100),
                    'name' => fake()->word(),
                    'sku' => fake()->bothify('SKU-????-##'),
                    'quantity' => fake()->numberBetween(1, 5),
                    'weight_kg' => fake()->randomFloat(2, 0.1, 5),
                ]
            ],
            'special_instructions' => fake()->optional(0.3)->text(100),
            'shipped_at' => $shippedAt,
            'estimated_delivery' => $estimatedDelivery,
            'delivered_at' => $deliveredAt,
            'tracking_events' => $this->generateTrackingEvents($status, $shippedAt),
            'metadata' => [
                'insurance' => fake()->boolean(30),
                'fragile' => fake()->boolean(20),
            ],
        ];
    }

    private function generateTrackingEvents(string $status, ?\DateTime $shippedAt): array
    {
        $events = [];

        if ($status === 'pending') {
            return $events;
        }

        $baseTime = $shippedAt ?? now();
        $events[] = [
            'status' => 'picked_up',
            'description' => 'Package picked up from sender',
            'location' => 'Jakarta',
            'timestamp' => $baseTime->toIso8601String(),
        ];

        if (in_array($status, ['shipped', 'in_transit', 'delivered'])) {
            $events[] = [
                'status' => 'in_transit',
                'description' => 'Package in transit',
                'location' => 'Jakarta Sorting Center',
                'timestamp' => $baseTime->addHours(6)->toIso8601String(),
            ];
        }

        if ($status === 'delivered') {
            $events[] = [
                'status' => 'delivered',
                'description' => 'Package delivered',
                'location' => 'Destination',
                'timestamp' => $baseTime->addDays(3)->toIso8601String(),
            ];
        }

        return $events;
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'tracking_number' => null,
            'shipped_at' => null,
            'tracking_events' => [],
        ]);
    }

    public function shipped(): static
    {
        $shippedAt = now()->subDays(2);
        return $this->state(fn (array $attributes) => [
            'status' => 'shipped',
            'shipped_at' => $shippedAt,
            'tracking_events' => [
                [
                    'status' => 'picked_up',
                    'description' => 'Package picked up',
                    'location' => 'Jakarta',
                    'timestamp' => $shippedAt->toIso8601String(),
                ]
            ]
        ]);
    }

    public function delivered(): static
    {
        $shippedAt = now()->subDays(5);
        $deliveredAt = now()->subDays(2);
        return $this->state(fn (array $attributes) => [
            'status' => 'delivered',
            'shipped_at' => $shippedAt,
            'delivered_at' => $deliveredAt,
            'tracking_events' => [
                [
                    'status' => 'picked_up',
                    'description' => 'Package picked up',
                    'location' => 'Jakarta',
                    'timestamp' => $shippedAt->toIso8601String(),
                ],
                [
                    'status' => 'delivered',
                    'description' => 'Package delivered',
                    'location' => 'Destination',
                    'timestamp' => $deliveredAt->toIso8601String(),
                ]
            ]
        ]);
    }
}
