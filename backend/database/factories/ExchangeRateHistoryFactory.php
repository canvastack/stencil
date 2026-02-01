<?php

namespace Database\Factories;

use App\Models\ExchangeRateHistory;
use App\Models\ExchangeRateProvider;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExchangeRateHistoryFactory extends Factory
{
    protected $model = ExchangeRateHistory::class;

    public function definition(): array
    {
        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => TenantEloquentModel::factory(),
            'rate' => $this->faker->randomFloat(4, 14000, 16000),
            'provider_id' => ExchangeRateProvider::factory(),
            'source' => $this->faker->randomElement(['manual', 'api', 'cached']),
            'event_type' => $this->faker->randomElement(['rate_change', 'provider_switch', 'api_request', 'manual_update']),
            'metadata' => [
                'previous_rate' => $this->faker->optional()->randomFloat(4, 14000, 16000),
                'reason' => $this->faker->optional()->randomElement(['quota_exhausted', 'manual_change', 'scheduled_update']),
            ],
            'created_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }

    public function rateChange(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_type' => 'rate_change',
            'source' => 'api',
        ]);
    }

    public function providerSwitch(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_type' => 'provider_switch',
            'metadata' => [
                'old_provider' => $this->faker->word(),
                'new_provider' => $this->faker->word(),
                'reason' => 'quota_exhausted',
            ],
        ]);
    }

    public function apiRequest(): static
    {
        return $this->state(fn (array $attributes) => [
            'event_type' => 'api_request',
            'source' => 'api',
        ]);
    }

    public function manual(): static
    {
        return $this->state(fn (array $attributes) => [
            'source' => 'manual',
            'event_type' => 'manual_update',
        ]);
    }
}
