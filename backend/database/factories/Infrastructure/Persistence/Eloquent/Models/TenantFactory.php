<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = $this->faker->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
            'domain' => null,
            'status' => 'active',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(14),
            'subscription_ends_at' => now()->addMonths(1),
            'created_by' => null,
            'settings' => [],
            'features' => [],
        ];
    }
}
