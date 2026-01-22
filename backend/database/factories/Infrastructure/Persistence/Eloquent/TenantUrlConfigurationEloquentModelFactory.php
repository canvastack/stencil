<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use Illuminate\Support\Str;

class TenantUrlConfigurationEloquentModelFactory extends Factory
{
    protected $model = TenantUrlConfigurationEloquentModel::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => TenantEloquentModel::factory(),
            'url_pattern' => 'subdomain',
            'is_primary' => true,
            'is_enabled' => true,
            'subdomain' => null,
            'url_path' => null,
            'custom_domain_id' => null,
            'force_https' => true,
            'redirect_to_primary' => false,
            'meta_title' => null,
            'meta_description' => null,
            'og_image_url' => null,
        ];
    }

    public function subdomain(string $subdomain): static
    {
        return $this->state(fn (array $attributes) => [
            'url_pattern' => 'subdomain',
            'subdomain' => $subdomain,
            'url_path' => null,
            'custom_domain_id' => null,
        ]);
    }

    public function path(string $path): static
    {
        return $this->state(fn (array $attributes) => [
            'url_pattern' => 'path',
            'subdomain' => null,
            'url_path' => $path,
            'custom_domain_id' => null,
        ]);
    }

    public function customDomain(?int $customDomainId = null): static
    {
        return $this->state(fn (array $attributes) => [
            'url_pattern' => 'custom_domain',
            'subdomain' => null,
            'url_path' => null,
            'custom_domain_id' => $customDomainId ?? CustomDomainEloquentModel::factory(),
        ]);
    }

    public function primary(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_primary' => true,
        ]);
    }

    public function secondary(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_primary' => false,
        ]);
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
}
