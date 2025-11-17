<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel>
 */
class TenantEloquentModelFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = TenantEloquentModel::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->company();
        $slug = Str::slug($name);
        
        return [
            'name' => $name,
            'slug' => $slug,
            'domain' => null, // Optional custom domain
            'status' => 'active',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(14), // 14 days trial
            'subscription_ends_at' => now()->addMonths(1),
            'created_by' => AccountEloquentModel::factory(),
            'settings' => [],
            'features' => [],
        ];
    }

    /**
     * Indicate that the tenant is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Indicate that the tenant is suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    /**
     * Indicate that the tenant is on trial.
     */
    public function onTrial(): static
    {
        return $this->state(fn (array $attributes) => [
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
            'subscription_ends_at' => null,
        ]);
    }

    /**
     * Indicate that the tenant's trial has expired.
     */
    public function trialExpired(): static
    {
        return $this->state(fn (array $attributes) => [
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->subDays(1),
            'subscription_ends_at' => null,
        ]);
    }

    /**
     * Indicate that the tenant's subscription has expired.
     */
    public function subscriptionExpired(): static
    {
        return $this->state(fn (array $attributes) => [
            'subscription_status' => 'active',
            'subscription_ends_at' => now()->subDays(1),
        ]);
    }

    /**
     * Indicate that the tenant has a custom domain.
     */
    public function withCustomDomain(): static
    {
        return $this->state(fn (array $attributes) => [
            'domain' => fake()->domainName(),
        ]);
    }
}