<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShippingMethodFactory extends Factory
{
    protected $model = ShippingMethod::class;

    public function definition(): array
    {
        $carriers = ['JNE', 'JNT', 'SiCepat', 'Pos Indonesia', 'TIKI'];
        $types = ['standard', 'express', 'same_day', 'pickup', 'next_day'];
        $carrier = $this->faker->randomElement($carriers);
        $type = $this->faker->randomElement($types);
        $uniqueSuffix = uniqid();
        
        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => TenantEloquentModel::factory(),
            'name' => $carrier . ' ' . ucfirst($type),
            'code' => strtoupper($carrier) . '_' . strtoupper($type) . '_' . $uniqueSuffix,
            'description' => $this->faker->text(100),
            'carrier' => $carrier,
            'type' => $type,
            'service_areas' => [
                'cities' => $this->faker->randomElements(['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'], 3),
                'provinces' => $this->faker->randomElements(['DKI Jakarta', 'Jawa Barat', 'Jawa Timur', 'Sumatera Utara'], 2)
            ],
            'estimated_days_min' => $minDays = $this->faker->numberBetween(1, 3),
            'estimated_days_max' => $this->faker->numberBetween($minDays, $minDays + 5),
            'base_cost' => $this->faker->randomFloat(2, 5000, 50000),
            'cost_calculation' => [
                'method' => 'flat_rate',
                'per_kg_rate' => $this->faker->randomFloat(2, 1000, 5000),
                'minimum_charge' => $this->faker->randomFloat(2, 5000, 10000)
            ],
            'restrictions' => [
                'max_weight' => $this->faker->numberBetween(10, 100),
                'max_dimensions' => [
                    'length' => $this->faker->numberBetween(50, 200),
                    'width' => $this->faker->numberBetween(30, 100),
                    'height' => $this->faker->numberBetween(20, 80)
                ],
                'prohibited_items' => ['liquid', 'fragile', 'hazardous']
            ],
            'is_active' => $this->faker->boolean(85), // 85% chance of being active
            'is_default' => false,
            'sort_order' => $this->faker->numberBetween(1, 100),
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
            'is_active' => true,
        ]);
    }

    public function express(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'express',
            'estimated_days_min' => 1,
            'estimated_days_max' => 2,
            'base_cost' => $this->faker->randomFloat(2, 15000, 30000),
        ]);
    }

    public function standard(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'standard',
            'estimated_days_min' => 2,
            'estimated_days_max' => 5,
            'base_cost' => $this->faker->randomFloat(2, 5000, 15000),
        ]);
    }
}