<?php

namespace Database\Factories;

use App\Models\ExchangeRateProvider;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExchangeRateProviderFactory extends Factory
{
    protected $model = ExchangeRateProvider::class;

    public function definition(): array
    {
        $providers = [
            ['name' => 'exchangerate-api.com', 'code' => 'exchangerate_api'],
            ['name' => 'currencyapi.com', 'code' => 'currencyapi'],
            ['name' => 'fawazahmed0', 'code' => 'fawazahmed0'],
            ['name' => 'frankfurter.app', 'code' => 'frankfurter'],
        ];

        $provider = $this->faker->randomElement($providers);
        
        // Add unique suffix to avoid constraint violations in tests
        $uniqueCode = $provider['code'] . '_' . uniqid();

        return [
            'uuid' => $this->faker->uuid(),
            'tenant_id' => TenantEloquentModel::factory(),
            'name' => $provider['name'],
            'code' => $uniqueCode,
            'api_url' => $this->faker->url(),
            'api_key' => $this->faker->optional()->uuid(),
            'requires_api_key' => $this->faker->boolean(50),
            'is_unlimited' => $this->faker->boolean(30),
            'monthly_quota' => $this->faker->randomElement([0, 300, 1500]),
            'priority' => $this->faker->numberBetween(1, 10),
            'is_enabled' => $this->faker->boolean(80),
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ];
    }

    public function enabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_enabled' => true,
        ]);
    }

    public function disabled(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_enabled' => false,
        ]);
    }

    public function unlimited(): static
    {
        return $this->state(fn (array $attributes) => [
            'monthly_quota' => 0,
        ]);
    }

    public function withQuota(int $quota): static
    {
        return $this->state(fn (array $attributes) => [
            'monthly_quota' => $quota,
        ]);
    }
}
