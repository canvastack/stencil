<?php

namespace Database\Factories;

use App\Models\InstalledPlugin;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InstalledPlugin>
 */
class InstalledPluginFactory extends Factory
{
    protected $model = InstalledPlugin::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $tenant = TenantEloquentModel::factory()->create();

        return [
            'uuid' => (string) Str::uuid(),
            'tenant_id' => $tenant->uuid,
            'plugin_name' => fake()->slug(2),
            'plugin_version' => fake()->semver(),
            'display_name' => fake()->words(3, true),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected', 'active', 'suspended', 'expired']),
            'manifest' => [
                'name' => fake()->slug(2),
                'version' => fake()->semver(),
                'display_name' => fake()->words(3, true),
                'description' => fake()->sentence(),
                'author' => fake()->name(),
            ],
            'migrations_run' => [],
            'settings' => [],
            'installed_at' => now(),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'suspended',
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'expired',
            'expires_at' => now()->subDays(1),
        ]);
    }
}
