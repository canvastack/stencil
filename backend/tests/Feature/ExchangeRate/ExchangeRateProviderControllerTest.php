<?php

namespace Tests\Feature\ExchangeRate;

use Tests\TestCase;
use App\Models\User;
use App\Models\ExchangeRateProvider;
use App\Models\ExchangeRateSetting;
use App\Application\ExchangeRate\Services\ProviderManagementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Mockery;

class ExchangeRateProviderControllerTest extends TestCase
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
    public function it_can_list_all_providers()
    {
        // Create test providers
        $provider1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'ExchangeRate-API',
            'code' => 'exchangerate-api',
            'api_url' => 'https://v6.exchangerate-api.com/v6',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $provider2 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 2,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-providers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'uuid',
                        'name',
                        'code',
                        'api_url',
                        'requires_api_key',
                        'has_api_key',
                        'is_unlimited',
                        'monthly_quota',
                        'priority',
                        'is_enabled',
                        'warning_threshold',
                        'critical_threshold',
                        'remaining_quota',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ])
            ->assertJsonCount(2, 'data');

        // Verify priority ordering (provider1 should come first)
        $this->assertEquals($provider1->uuid, $response->json('data.0.uuid'));
        $this->assertEquals($provider2->uuid, $response->json('data.1.uuid'));
    }

    /** @test */
    public function it_can_create_a_provider_without_api_key()
    {
        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'uuid',
                    'name',
                    'code',
                    'api_url',
                    'requires_api_key',
                    'has_api_key',
                    'is_unlimited',
                    'monthly_quota',
                    'priority',
                    'is_enabled',
                    'warning_threshold',
                    'critical_threshold',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'data' => [
                    'name' => 'Frankfurter',
                    'code' => 'frankfurter',
                    'requires_api_key' => false,
                    'has_api_key' => false,
                    'is_unlimited' => true,
                ],
            ]);

        // Verify in database
        $this->assertDatabaseHas('exchange_rate_providers', [
            'tenant_id' => $this->tenantId,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
        ]);
    }

    /** @test */
    public function it_can_create_a_provider_with_valid_api_key()
    {
        // Mock the ProviderManagementService
        $mockService = Mockery::mock(ProviderManagementService::class);
        $mockService->shouldReceive('validateApiKey')
            ->once()
            ->andReturn(true);

        $this->app->instance(ProviderManagementService::class, $mockService);

        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            'name' => 'ExchangeRate-API',
            'code' => 'exchangerate-api',
            'api_url' => 'https://v6.exchangerate-api.com/v6',
            'api_key' => 'test-api-key-123',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'data' => [
                    'name' => 'ExchangeRate-API',
                    'requires_api_key' => true,
                    'has_api_key' => true,
                ],
            ]);
    }

    /** @test */
    public function it_rejects_provider_creation_with_invalid_api_key()
    {
        // Mock the ProviderManagementService to throw exception
        $mockService = Mockery::mock(ProviderManagementService::class);
        $mockService->shouldReceive('validateApiKey')
            ->once()
            ->andThrow(new \Exception('API key validation failed for ExchangeRate-API: Invalid API key'));

        $this->app->instance(ProviderManagementService::class, $mockService);

        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            'name' => 'ExchangeRate-API',
            'code' => 'exchangerate-api',
            'api_url' => 'https://v6.exchangerate-api.com/v6',
            'api_key' => 'invalid-key',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'errors' => [
                    'api_key',
                ],
            ]);

        // Verify provider was not created
        $this->assertDatabaseMissing('exchange_rate_providers', [
            'tenant_id' => $this->tenantId,
            'name' => 'ExchangeRate-API',
        ]);
    }

    /** @test */
    public function it_rejects_duplicate_provider_names()
    {
        // Create existing provider
        ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            'name' => 'Frankfurter',
            'code' => 'frankfurter-2',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 2,
            'is_enabled' => true,
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'errors' => [
                    'name',
                ],
            ]);
    }

    /** @test */
    public function it_validates_required_fields_on_creation()
    {
        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            // Missing required fields
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'errors' => [
                    'name',
                    'code',
                    'api_url',
                    'requires_api_key',
                    'is_unlimited',
                    'monthly_quota',
                    'priority',
                ],
            ]);
    }

    /** @test */
    public function it_can_update_a_provider()
    {
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $response = $this->putJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}", [
            'priority' => 5,
            'is_enabled' => false,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'uuid' => $provider->uuid,
                    'priority' => 5,
                    'is_enabled' => false,
                ],
            ]);

        // Verify in database
        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $provider->uuid,
            'priority' => 5,
            'is_enabled' => false,
        ]);
    }

    /** @test */
    public function it_can_update_provider_with_valid_api_key()
    {
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'ExchangeRate-API',
            'code' => 'exchangerate-api',
            'api_url' => 'https://v6.exchangerate-api.com/v6',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Mock the ProviderManagementService
        $mockService = Mockery::mock(ProviderManagementService::class);
        $mockService->shouldReceive('validateApiKey')
            ->once()
            ->andReturn(true);

        $this->app->instance(ProviderManagementService::class, $mockService);

        $response = $this->putJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}", [
            'api_key' => 'new-valid-key',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_api_key' => true,
                ],
            ]);
    }

    /** @test */
    public function it_rejects_update_with_invalid_api_key()
    {
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'ExchangeRate-API',
            'code' => 'exchangerate-api',
            'api_url' => 'https://v6.exchangerate-api.com/v6',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Mock the ProviderManagementService to throw exception
        $mockService = Mockery::mock(ProviderManagementService::class);
        $mockService->shouldReceive('validateApiKey')
            ->once()
            ->andThrow(new \Exception('API key validation failed'));

        $this->app->instance(ProviderManagementService::class, $mockService);

        $response = $this->putJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}", [
            'api_key' => 'invalid-key',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'errors' => [
                    'api_key',
                ],
            ]);
    }

    /** @test */
    public function it_returns_404_when_updating_non_existent_provider()
    {
        $response = $this->putJson('/api/v1/tenant/exchange-rate-providers/non-existent-uuid', [
            'priority' => 5,
        ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function it_can_delete_a_provider()
    {
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->deleteJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Exchange rate provider deleted successfully',
            ]);

        // Verify deleted from database
        $this->assertDatabaseMissing('exchange_rate_providers', [
            'uuid' => $provider->uuid,
        ]);
    }

    /** @test */
    public function it_prevents_deletion_of_active_provider()
    {
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Set provider as active
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'auto',
            'active_provider_id' => $provider->id,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->deleteJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}");

        $response->assertStatus(422)
            ->assertJsonStructure([
                'message',
                'errors' => [
                    'provider',
                ],
            ]);

        // Verify provider still exists
        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $provider->uuid,
        ]);
    }

    /** @test */
    public function it_returns_404_when_deleting_non_existent_provider()
    {
        $response = $this->deleteJson('/api/v1/tenant/exchange-rate-providers/non-existent-uuid');

        $response->assertStatus(404);
    }

    /** @test */
    public function it_enforces_tenant_isolation_on_list()
    {
        // Create provider for current tenant
        $provider1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Provider 1',
            'code' => 'provider-1',
            'api_url' => 'https://api.example.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create another tenant and provider
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);

        $provider2 = ExchangeRateProvider::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Provider 2',
            'code' => 'provider-2',
            'api_url' => 'https://api.example.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-providers');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // Verify only current tenant's provider is returned
        $this->assertEquals($provider1->uuid, $response->json('data.0.uuid'));
    }

    /** @test */
    public function it_enforces_tenant_isolation_on_update()
    {
        // Create another tenant and provider
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);

        $otherProvider = ExchangeRateProvider::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Provider',
            'code' => 'other-provider',
            'api_url' => 'https://api.example.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Try to update other tenant's provider
        $response = $this->putJson("/api/v1/tenant/exchange-rate-providers/{$otherProvider->uuid}", [
            'priority' => 5,
        ]);

        $response->assertStatus(404);

        // Verify provider was not updated
        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $otherProvider->uuid,
            'priority' => 1, // Original value
        ]);
    }

    /** @test */
    public function it_enforces_tenant_isolation_on_delete()
    {
        // Create another tenant and provider
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);

        $otherProvider = ExchangeRateProvider::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Provider',
            'code' => 'other-provider',
            'api_url' => 'https://api.example.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Try to delete other tenant's provider
        $response = $this->deleteJson("/api/v1/tenant/exchange-rate-providers/{$otherProvider->uuid}");

        $response->assertStatus(404);

        // Verify provider still exists
        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $otherProvider->uuid,
        ]);
    }
}

