<?php

namespace Database\Factories\Infrastructure\Persistence\Eloquent;

use App\Infrastructure\Persistence\Eloquent\UrlAccessAnalyticEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use Illuminate\Database\Eloquent\Factories\Factory;

class UrlAccessAnalyticEloquentModelFactory extends Factory
{
    protected $model = UrlAccessAnalyticEloquentModel::class;

    public function definition(): array
    {
        $urlPatterns = ['subdomain', 'path', 'custom_domain', 'unknown'];
        $httpStatusCodes = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];
        $countryCodes = ['ID', 'US', 'SG', 'MY', 'TH', 'PH', 'VN', 'JP', 'KR', 'CN', 'IN', 'AU', 'GB', 'DE', 'FR', 'CA', 'BR', 'MX', 'IT', 'ES'];
        $cities = ['Jakarta', 'New York', 'Singapore', 'Kuala Lumpur', 'Bangkok', 'Manila', 'Ho Chi Minh', 'Tokyo', 'Seoul', 'Shanghai'];
        $userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
            'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Googlebot/2.1',
            'Mozilla/5.0 (Linux; Android 11)',
        ];

        $tenant = TenantEloquentModel::inRandomOrder()->first() 
            ?? TenantEloquentModel::factory()->create();

        return [
            'tenant_id' => $tenant->id,
            'url_config_id' => null,
            'accessed_url' => $this->faker->url(),
            'url_pattern_used' => $this->faker->randomElement($urlPatterns),
            'ip_address' => $this->faker->ipv4(),
            'user_agent' => $this->faker->randomElement($userAgents),
            'referrer' => $this->faker->boolean(60) ? $this->faker->url() : null,
            'country_code' => $this->faker->boolean(80) ? $this->faker->randomElement($countryCodes) : null,
            'city' => $this->faker->boolean(70) ? $this->faker->randomElement($cities) : null,
            'http_status_code' => $this->faker->randomElement($httpStatusCodes),
            'response_time_ms' => $this->faker->numberBetween(10, 500),
            'accessed_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }

    public function successful(): static
    {
        return $this->state(fn (array $attributes) => [
            'http_status_code' => $this->faker->randomElement([200, 201, 204]),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
            'http_status_code' => $this->faker->randomElement([400, 401, 403, 404, 500]),
        ]);
    }

    public function fast(): static
    {
        return $this->state(fn (array $attributes) => [
            'response_time_ms' => $this->faker->numberBetween(10, 50),
        ]);
    }

    public function slow(): static
    {
        return $this->state(fn (array $attributes) => [
            'response_time_ms' => $this->faker->numberBetween(200, 1000),
        ]);
    }

    public function fromCountry(string $countryCode, ?string $city = null): static
    {
        return $this->state(fn (array $attributes) => [
            'country_code' => $countryCode,
            'city' => $city ?? $this->faker->city(),
        ]);
    }

    public function mobile(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        ]);
    }

    public function desktop(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ]);
    }

    public function tablet(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_agent' => 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        ]);
    }

    public function bot(): static
    {
        return $this->state(fn (array $attributes) => [
            'user_agent' => 'Googlebot/2.1',
        ]);
    }

    public function withReferrer(string $referrer): static
    {
        return $this->state(fn (array $attributes) => [
            'referrer' => $referrer,
        ]);
    }

    public function forTenant(int $tenantId): static
    {
        return $this->state(fn (array $attributes) => [
            'tenant_id' => $tenantId,
        ]);
    }

    public function forUrlConfig(int $urlConfigId): static
    {
        return $this->state(fn (array $attributes) => [
            'url_config_id' => $urlConfigId,
        ]);
    }

    public function usingPattern(string $pattern): static
    {
        return $this->state(fn (array $attributes) => [
            'url_pattern_used' => $pattern,
        ]);
    }

    public function recent(): static
    {
        return $this->state(fn (array $attributes) => [
            'accessed_at' => $this->faker->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    public function old(): static
    {
        return $this->state(fn (array $attributes) => [
            'accessed_at' => $this->faker->dateTimeBetween('-90 days', '-30 days'),
        ]);
    }
}
