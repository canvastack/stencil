<?php

namespace Database\Factories;

use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateProvider;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExchangeRateSettingFactory extends Factory
{
    protected $model = ExchangeRateSetting::class;

    public function definition(): array
    {
        $mode = $this->faker->randomElement(['manual', 'auto']);
        
        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => TenantEloquentModel::factory(),
            'mode' => $mode,
            'manual_rate' => $mode === 'manual' ? $this->faker->randomFloat(4, 14000, 16000) : null,
            'current_rate' => $this->faker->randomFloat(4, 14000, 16000),
            'active_provider_id' => $mode === 'auto' ? ExchangeRateProvider::factory() : null,
            'auto_update_enabled' => $mode === 'auto',
            'auto_update_time' => $this->faker->time('H:i:s'),
            'last_updated_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ];
    }

    public function manual(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => 'manual',
            'manual_rate' => $this->faker->randomFloat(4, 14000, 16000),
            'active_provider_id' => null,
            'auto_update_enabled' => false,
        ]);
    }

    public function auto(): static
    {
        return $this->state(fn (array $attributes) => [
            'mode' => 'auto',
            'manual_rate' => null,
            'active_provider_id' => ExchangeRateProvider::factory(),
            'auto_update_enabled' => true,
        ]);
    }

    public function withRate(float $rate): static
    {
        return $this->state(fn (array $attributes) => [
            'current_rate' => $rate,
            'manual_rate' => $attributes['mode'] === 'manual' ? $rate : null,
        ]);
    }
}
