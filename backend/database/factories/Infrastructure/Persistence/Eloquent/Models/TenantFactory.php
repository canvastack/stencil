<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;

class TenantFactory extends Factory
{
    protected $model = TenantEloquentModel::class;

    public function definition(): array
    {
        $name = $this->faker->company();
        $uniqueSuffix = substr(md5(microtime() . rand()), 0, 10);

        return [
            'uuid' => Uuid::uuid4()->toString(),
            'name' => $name,
            'slug' => Str::slug($name) . '-' . $uniqueSuffix,
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
