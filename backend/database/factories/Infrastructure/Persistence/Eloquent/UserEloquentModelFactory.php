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
            'vendor_id' => null, // Default to null for non-vendor users
            'account_type' => 'tenant', // Default account type
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
            'failed_login_attempts' => 0,
            'last_failed_login_at' => null,
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

    /**
     * Create a vendor user with proper vendor_id UUID reference
     */
    public function vendor(): self
    {
        return $this->state(function (array $attributes) {
            // If vendor_id is provided and it's a Vendor model instance, extract UUID
            if (isset($attributes['vendor_id'])) {
                $vendorId = $attributes['vendor_id'];
                
                // If it's a Vendor model instance, get the UUID
                if (is_object($vendorId) && method_exists($vendorId, 'getAttribute')) {
                    $vendorId = $vendorId->getAttribute('uuid');
                }
                
                return [
                    'vendor_id' => $vendorId,
                    'account_type' => 'vendor',
                ];
            }
            
            return [
                'account_type' => 'vendor',
            ];
        });
    }

    /**
     * Create a platform admin user
     */
    public function platform(): self
    {
        return $this->state(fn () => [
            'account_type' => 'platform',
            'vendor_id' => null,
        ]);
    }
}
