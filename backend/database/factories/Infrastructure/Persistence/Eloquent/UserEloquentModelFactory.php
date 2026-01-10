<?php

declare(strict_types=1);

namespace Database\Factories\Infrastructure\Persistence\Eloquent;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserEloquentModelFactory extends Factory
{
    protected $model = UserEloquentModel::class;

    public function definition(): array
    {
        return [
            'tenant_id' => TenantEloquentModel::factory(),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('Password123!'),
            'phone' => $this->faker->e164PhoneNumber(),
            'status' => 'active',
            'department' => $this->faker->randomElement(['Sales', 'Operations', 'Finance', 'Marketing', 'Procurement']),
            'location' => [
                'address' => $this->faker->streetAddress(),
                'city' => $this->faker->city(),
                'province' => $this->faker->state(),
            ],
            'last_login_at' => now()->subDays($this->faker->numberBetween(0, 10)),
            'remember_token' => Str::random(10),
        ];
    }

    public function inactive(): self
    {
        return $this->state(fn () => ['status' => 'inactive']);
    }

    public function suspended(): self
    {
        return $this->state(fn () => ['status' => 'suspended']);
    }
}
