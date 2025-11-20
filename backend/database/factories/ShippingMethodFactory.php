<?php

namespace Database\Factories;

use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShippingMethodFactory extends Factory
{
    protected $model = ShippingMethod::class;

    public function definition(): array
    {
        $carriers = ['JNE', 'JNT', 'SiCepat', 'Tiki', 'POS'];
        $carrier = fake()->randomElement($carriers);
        $type = fake()->randomElement(['standard', 'express', 'same_day']);

        $typeConfig = match($type) {
            'standard' => [
                'estimated_days_min' => 3,
                'estimated_days_max' => 7,
                'base_cost' => 15000,
            ],
            'express' => [
                'estimated_days_min' => 1,
                'estimated_days_max' => 2,
                'base_cost' => 50000,
            ],
            'same_day' => [
                'estimated_days_min' => 0,
                'estimated_days_max' => 1,
                'base_cost' => 100000,
            ]
        };

        return [
            'uuid' => fake()->uuid(),
            'tenant_id' => null,
            'name' => "{$carrier} {$type}",
            'code' => strtoupper($carrier) . '_' . strtoupper($type),
            'description' => fake()->sentence(),
            'carrier' => $carrier,
            'type' => $type,
            'service_areas' => ['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah'],
            'estimated_days_min' => $typeConfig['estimated_days_min'],
            'estimated_days_max' => $typeConfig['estimated_days_max'],
            'base_cost' => $typeConfig['base_cost'],
            'cost_calculation' => [
                'per_kg' => fake()->numberBetween(1000, 5000),
                'per_km' => fake()->numberBetween(100, 500),
                'minimum_cost' => $typeConfig['base_cost'],
            ],
            'restrictions' => [
                'max_weight_kg' => fake()->numberBetween(20, 100),
                'max_dimensions_cm' => [
                    'length' => 200,
                    'width' => 150,
                    'height' => 100,
                ]
            ],
            'is_active' => true,
            'is_default' => false,
            'sort_order' => 0,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }

    public function default(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
