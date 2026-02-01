<?php

namespace Tests\Feature\ExchangeRate;

use Tests\TestCase;
use App\Models\User;
use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class ExchangeRateSettingsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private int $tenantId;
    private $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test tenant
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);
        $this->tenantId = $this->tenant->id;

        // Create a test user with tenant_id
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function it_can_get_exchange_rate_settings()
    {
        // Create settings for the tenant
        $settings = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'current_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'uuid',
                    'mode',
                    'manual_rate',
                    'current_rate',
                    'active_provider_id',
                    'active_provider',
                    'auto_update_enabled',
                    'auto_update_time',
                    'last_updated_at',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'data' => [
                    'mode' => 'manual',
                    'manual_rate' => '15000.0000',
                    'current_rate' => '15000.0000',
                ],
            ]);
    }

    /** @test */
    public function it_creates_default_settings_if_none_exist()
    {
        $response = $this->getJson('/api/v1/tenant/exchange-rate-settings');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'uuid',
                    'mode',
                    'manual_rate',
                    'current_rate',
                ],
            ])
            ->assertJson([
                'data' => [
                    'mode' => 'manual',
                ],
            ]);

        // Verify settings were created in database
        $this->assertDatabaseHas('exchange_rate_settings', [
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
        ]);
    }

    /** @test */
    public function it_can_update_settings_to_manual_mode()
    {
        // Create initial settings
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            'manual_rate' => 15500.5000,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Exchange rate settings updated successfully',
                'data' => [
                    'mode' => 'manual',
                    'manual_rate' => '15500.5000',
                    'current_rate' => '15500.5000',
                ],
            ]);

        $this->assertDatabaseHas('exchange_rate_settings', [
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15500.5000,
            'current_rate' => 15500.5000,
        ]);
    }

    /** @test */
    public function it_can_update_settings_to_auto_mode()
    {
        // Create initial settings
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        // Create a provider
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'exchangerate-api.com',
            'code' => 'exchangerate-api',
            'api_url' => 'https://v6.exchangerate-api.com/v6',
            'api_key' => 'test-key',
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'auto',
            'active_provider_id' => $provider->uuid,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Exchange rate settings updated successfully',
                'data' => [
                    'mode' => 'auto',
                    'active_provider_id' => $provider->uuid,
                ],
            ]);

        $this->assertDatabaseHas('exchange_rate_settings', [
            'tenant_id' => $this->tenantId,
            'mode' => 'auto',
            'active_provider_id' => $provider->id, // Use internal ID, not UUID
        ]);
    }

    /** @test */
    public function it_requires_manual_rate_when_mode_is_manual()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'auto',
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            // Missing manual_rate
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['manual_rate']);
    }

    /** @test */
    public function it_requires_active_provider_when_mode_is_auto()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'auto',
            // Missing active_provider_id
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['active_provider_id']);
    }

    /** @test */
    public function it_validates_manual_rate_is_numeric()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            'manual_rate' => 'not-a-number',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['manual_rate']);
    }

    /** @test */
    public function it_validates_manual_rate_is_positive()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            'manual_rate' => -100,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['manual_rate']);
    }

    /** @test */
    public function it_validates_mode_is_valid()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'invalid-mode',
            'manual_rate' => 15000,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mode']);
    }

    /** @test */
    public function it_validates_provider_exists_and_is_enabled()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        // Create a disabled provider
        $disabledProvider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'disabled-provider',
            'code' => 'disabled-provider',
            'api_url' => 'https://example.com',
            'monthly_quota' => 1000,
            'priority' => 1,
            'is_enabled' => false,
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'auto',
            'active_provider_id' => $disabledProvider->uuid,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Selected provider is not available or not enabled',
            ]);
    }

    /** @test */
    public function it_can_update_auto_update_settings()
    {
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            'manual_rate' => 15000,
            'auto_update_enabled' => false,
            'auto_update_time' => '12:00:00',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('exchange_rate_settings', [
            'tenant_id' => $this->tenantId,
            'auto_update_enabled' => false,
            'auto_update_time' => '12:00:00',
        ]);
    }

    /** @test */
    public function it_updates_last_updated_at_timestamp()
    {
        $settings = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
            'last_updated_at' => now()->subDays(1),
        ]);

        $oldTimestamp = $settings->last_updated_at;

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            'manual_rate' => 15500,
        ]);

        $response->assertStatus(200);

        $settings->refresh();
        $this->assertNotEquals($oldTimestamp, $settings->last_updated_at);
    }

    /** @test */
    public function it_scopes_settings_to_tenant()
    {
        // Create another tenant
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);
        $otherTenantId = $otherTenant->id;

        // Create settings for another tenant
        ExchangeRateSetting::create([
            'tenant_id' => $otherTenantId,
            'mode' => 'manual',
            'manual_rate' => 20000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        // Create settings for current tenant
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-settings');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'manual_rate' => '15000.0000',
                ],
            ]);

        // Should not return other tenant's settings
        $response->assertJsonMissing([
            'manual_rate' => '20000.0000',
        ]);
    }
}
