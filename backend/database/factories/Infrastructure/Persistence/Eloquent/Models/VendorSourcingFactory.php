<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class VendorSourcingFactory extends Factory
{
    protected $model = VendorSourcing::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'order_id' => Order::factory(),
            'title' => $this->faker->sentence(),
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['active', 'negotiating', 'completed', 'cancelled']),
            'assigned_vendor' => null,
            'requirements' => [
                'material' => $this->faker->randomElement(['stainless_steel', 'brass', 'aluminum']),
                'dimensions' => $this->faker->randomElement(['10x15cm', '20x30cm', '15x20cm']),
                'quantity' => $this->faker->numberBetween(1, 100),
            ],
            'responses' => $this->faker->numberBetween(0, 5),
            'best_quote' => $this->faker->randomFloat(2, 100000, 10000000),
        ];
    }
}
