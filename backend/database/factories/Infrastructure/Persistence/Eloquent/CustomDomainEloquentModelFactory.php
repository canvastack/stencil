<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Str;

class CustomDomainEloquentModelFactory extends Factory
{
    protected $model = CustomDomainEloquentModel::class;

    public function definition(): array
    {
        return [
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => TenantEloquentModel::factory(),
            'domain_name' => fake()->unique()->domainName(),
            'is_verified' => false,
            'verification_method' => 'dns_txt',
            'verification_token' => Str::random(64),
            'verified_at' => null,
            'ssl_enabled' => false,
            'ssl_certificate_path' => null,
            'ssl_certificate_issued_at' => null,
            'ssl_certificate_expires_at' => null,
            'auto_renew_ssl' => true,
            'dns_provider' => null,
            'dns_record_id' => null,
            'dns_zone_id' => null,
            'status' => 'pending_verification',
            'redirect_to_https' => true,
            'www_redirect' => 'remove_www',
            'metadata' => [],
            'created_by' => null,
        ];
    }
    
    public function configure()
    {
        return $this->afterMaking(function (CustomDomainEloquentModel $domain) {
            if ($domain->is_verified && $domain->status === 'pending_verification') {
                $domain->status = 'verified';
                if (!$domain->verified_at) {
                    $domain->verified_at = now();
                }
            }
        });
    }

    public function verified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
            'verified_at' => now(),
            'status' => 'active',
        ]);
    }

    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => false,
            'verified_at' => null,
            'status' => 'pending_verification',
        ]);
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_verified' => true,
            'verified_at' => now(),
            'status' => 'active',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    public function withSsl(): static
    {
        return $this->state(fn (array $attributes) => [
            'ssl_enabled' => true,
            'ssl_certificate_issued_at' => now(),
            'ssl_certificate_expires_at' => now()->addMonths(3),
        ]);
    }

    public function dnsTxtVerification(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_method' => 'dns_txt',
        ]);
    }

    public function dnsCnameVerification(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_method' => 'dns_cname',
        ]);
    }

    public function fileVerification(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_method' => 'file_upload',
        ]);
    }
}
