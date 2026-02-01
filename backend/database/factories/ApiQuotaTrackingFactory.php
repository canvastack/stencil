<?php

namespace Database\Factories;

use App\Models\ApiQuotaTracking;
use App\Models\ExchangeRateProvider;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApiQuotaTrackingFactory extends Factory
{
    protected $model = ApiQuotaTracking::class;

    public function definition(): array
    {
        $quotaLimit = $this->faker->randomElement([300, 1000, 1500]);
        $requestsMade = $this->faker->numberBetween(0, $quotaLimit);
        
        return [
            'uuid' => $this->faker->uuid(),
            'provider_id' => ExchangeRateProvider::factory(),
            'requests_made' => $requestsMade,
            'quota_limit' => $quotaLimit,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ];
    }

    public function currentMonth(): static
    {
        return $this->state(fn (array $attributes) => [
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);
    }

    public function exhausted(): static
    {
        return $this->state(fn (array $attributes) => [
            'requests_made' => $attributes['quota_limit'],
        ]);
    }

    public function atWarning(): static
    {
        return $this->state(fn (array $attributes) => [
            'requests_made' => $attributes['quota_limit'] - 40, // 40 remaining
        ]);
    }

    public function atCritical(): static
    {
        return $this->state(fn (array $attributes) => [
            'requests_made' => $attributes['quota_limit'] - 10, // 10 remaining
        ]);
    }

    public function withUsage(int $requestsMade): static
    {
        return $this->state(fn (array $attributes) => [
            'requests_made' => $requestsMade,
        ]);
    }
}
