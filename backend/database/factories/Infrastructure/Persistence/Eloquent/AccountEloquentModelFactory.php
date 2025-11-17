<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Illuminate\Support\Facades\Hash;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Infrastructure\Persistence\Eloquent\AccountEloquentModel>
 */
class AccountEloquentModelFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = AccountEloquentModel::class;

    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'account_type' => 'platform_owner',
            'status' => 'active',
            'settings' => [],
            'avatar' => null,
            'last_login_at' => null,
        ];
    }

    /**
     * Indicate that the account is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    /**
     * Indicate that the account is suspended.
     */
    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    /**
     * Indicate that the account is a platform manager.
     */
    public function platformManager(): static
    {
        return $this->state(fn (array $attributes) => [
            'account_type' => 'platform_manager',
        ]);
    }

    /**
     * Indicate that the account is a platform owner.
     */
    public function platformOwner(): static
    {
        return $this->state(fn (array $attributes) => [
            'account_type' => 'platform_owner',
        ]);
    }

    /**
     * Indicate that the account has logged in recently.
     */
    public function recentlyLoggedIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'last_login_at' => now()->subHours(2),
        ]);
    }
}