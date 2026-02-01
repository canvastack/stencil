<?php

namespace Tests\Feature\ExchangeRate;

use Tests\TestCase;
use App\Models\User;
use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateProvider;
use App\Models\ExchangeRateHistory;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Comprehensive Feature Tests for Exchange Rate API Endpoints
 * 
 * This test suite validates:
 * - Settings CRUD operations (Requirements 1.1, 1.4)
 * - Provider CRUD operations (Requirements 9.1, 9.2)
 * - History retrieval and filtering (Requirements 8.4)
 * - Tenant isolation (Requirement 11.2)
 * - Authentication and authorization
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class ExchangeRateApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $otherTenantUser;
    private int $tenantId;
    private int $otherTenantId;
    private $tenant;
    private $otherTenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create first tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);
        $this->tenantId = $this->tenant->id;

        // Create second tenant for isolation tests
        $this->otherTenant = TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);
        $this->otherTenantId = $this->otherTenant->id;

        // Create users for both tenants
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $this->otherTenantUser = User::factory()->create([
            'tenant_id' => $this->otherTenantId,
        ]);
    }

    // ========================================
    // Authentication Tests
    // ========================================

    /** @test */
    public function settings_endpoint_requires_authentication()
    {
        $response = $this->getJson('/api/v1/tenant/exchange-rate-settings');
        $response->assertStatus(401);
    }

    /** @test */
    public function provider_list_endpoint_requires_authentication()
    {
        $response = $this->getJson('/api/v1/tenant/exchange-rate-providers');
        $response->assertStatus(401);
    }

    /** @test */
    public function provider_create_endpoint_requires_authentication()
    {
        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            'name' => 'Test Provider',
        ]);
        $response->assertStatus(401);
    }

    /** @test */
    public function provider_update_endpoint_requires_authentication()
    {
        $response = $this->putJson('/api/v1/tenant/exchange-rate-providers/some-uuid', [
            'priority' => 5,
        ]);
        $response->assertStatus(401);
    }

    /** @test */
    public function provider_delete_endpoint_requires_authentication()
    {
        $response = $this->deleteJson('/api/v1/tenant/exchange-rate-providers/some-uuid');
        $response->assertStatus(401);
    }

    /** @test */
    public function history_endpoint_requires_authentication()
    {
        $response = $this->getJson('/api/v1/tenant/exchange-rate-history');
        $response->assertStatus(401);
    }

    // ========================================
    // Settings CRUD Tests (Requirement 1.1, 1.4)
    // ========================================

    /** @test */
    public function authenticated_user_can_retrieve_settings()
    {
        Sanctum::actingAs($this->user);

        ExchangeRateSetting::create([
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
                ],
            ]);
    }

    /** @test */
    public function authenticated_user_can_update_settings()
    {
        Sanctum::actingAs($this->user);

        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'current_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'manual',
            'manual_rate' => 15500.0000,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Exchange rate settings updated successfully',
            ]);

        $this->assertDatabaseHas('exchange_rate_settings', [
            'tenant_id' => $this->tenantId,
            'manual_rate' => 15500.0000,
        ]);
    }

    /** @test */
    public function settings_update_validates_input()
    {
        Sanctum::actingAs($this->user);

        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->putJson('/api/v1/tenant/exchange-rate-settings', [
            'mode' => 'invalid_mode',
            'manual_rate' => -100,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mode', 'manual_rate']);
    }

    // ========================================
    // Provider CRUD Tests (Requirement 9.1, 9.2)
    // ========================================

    /** @test */
    public function authenticated_user_can_list_providers()
    {
        Sanctum::actingAs($this->user);

        ExchangeRateProvider::create([
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

        $response = $this->getJson('/api/v1/tenant/exchange-rate-providers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'uuid',
                        'name',
                        'code',
                        'priority',
                        'is_enabled',
                    ],
                ],
            ]);
    }

    /** @test */
    public function authenticated_user_can_create_provider()
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            'name' => 'New Provider',
            'code' => 'new-provider',
            'api_url' => 'https://api.newprovider.com',
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
                ],
            ]);

        $this->assertDatabaseHas('exchange_rate_providers', [
            'tenant_id' => $this->tenantId,
            'name' => 'New Provider',
        ]);
    }

    /** @test */
    public function provider_creation_validates_required_fields()
    {
        Sanctum::actingAs($this->user);

        $response = $this->postJson('/api/v1/tenant/exchange-rate-providers', [
            // Missing required fields
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'name',
                'code',
                'api_url',
                'requires_api_key',
                'is_unlimited',
                'monthly_quota',
                'priority',
            ]);
    }

    /** @test */
    public function authenticated_user_can_update_provider()
    {
        Sanctum::actingAs($this->user);

        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Test Provider',
            'code' => 'test-provider',
            'api_url' => 'https://api.test.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->putJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}", [
            'priority' => 5,
            'is_enabled' => false,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $provider->uuid,
            'priority' => 5,
            'is_enabled' => false,
        ]);
    }

    /** @test */
    public function authenticated_user_can_delete_provider()
    {
        Sanctum::actingAs($this->user);

        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Test Provider',
            'code' => 'test-provider',
            'api_url' => 'https://api.test.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->deleteJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('exchange_rate_providers', [
            'uuid' => $provider->uuid,
        ]);
    }

    /** @test */
    public function cannot_delete_active_provider()
    {
        Sanctum::actingAs($this->user);

        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Active Provider',
            'code' => 'active-provider',
            'api_url' => 'https://api.test.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Set as active provider
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'auto',
            'active_provider_id' => $provider->id,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->deleteJson("/api/v1/tenant/exchange-rate-providers/{$provider->uuid}");

        $response->assertStatus(422);

        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $provider->uuid,
        ]);
    }

    // ========================================
    // History Retrieval and Filtering Tests (Requirement 8.4)
    // ========================================

    /** @test */
    public function authenticated_user_can_retrieve_history()
    {
        Sanctum::actingAs($this->user);

        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        ExchangeRateHistory::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-history');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'uuid',
                        'rate',
                        'provider',
                        'source',
                        'event_type',
                        'created_at',
                    ],
                ],
                'meta',
            ])
            ->assertJsonPath('meta.total', 5);
    }

    /** @test */
    public function history_can_be_filtered_by_date_range()
    {
        Sanctum::actingAs($this->user);

        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'created_at' => now()->subDays(10),
        ]);

        ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'created_at' => now()->subDays(5),
        ]);

        $dateFrom = now()->subDays(6)->format('Y-m-d');
        $dateTo = now()->subDays(4)->format('Y-m-d');

        $response = $this->getJson("/api/v1/tenant/exchange-rate-history?date_from={$dateFrom}&date_to={$dateTo}");

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    }

    /** @test */
    public function history_can_be_filtered_by_provider()
    {
        Sanctum::actingAs($this->user);

        $provider1 = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $provider2 = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        ExchangeRateHistory::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider1->id,
        ]);

        ExchangeRateHistory::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider2->id,
        ]);

        $response = $this->getJson("/api/v1/tenant/exchange-rate-history?provider_id={$provider1->uuid}");

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 3);
    }

    /** @test */
    public function history_can_be_filtered_by_event_type()
    {
        Sanctum::actingAs($this->user);

        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        ExchangeRateHistory::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'event_type' => 'rate_change',
        ]);

        ExchangeRateHistory::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'event_type' => 'provider_switch',
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-history?event_type=rate_change');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 3);
    }

    /** @test */
    public function history_validates_filter_parameters()
    {
        Sanctum::actingAs($this->user);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-history?event_type=invalid_type');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_type']);
    }

    // ========================================
    // Tenant Isolation Tests (Requirement 11.2)
    // ========================================

    /** @test */
    public function settings_are_isolated_by_tenant()
    {
        Sanctum::actingAs($this->user);

        // Create settings for both tenants
        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'current_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        ExchangeRateSetting::create([
            'tenant_id' => $this->otherTenantId,
            'mode' => 'manual',
            'manual_rate' => 20000.0000,
            'current_rate' => 20000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-settings');

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'manual_rate' => '15000.0000',
                ],
            ])
            ->assertJsonMissing([
                'manual_rate' => '20000.0000',
            ]);
    }

    /** @test */
    public function providers_are_isolated_by_tenant()
    {
        Sanctum::actingAs($this->user);

        // Create providers for both tenants
        $myProvider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'My Provider',
            'code' => 'my-provider',
            'api_url' => 'https://api.mine.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $otherProvider = ExchangeRateProvider::create([
            'tenant_id' => $this->otherTenantId,
            'name' => 'Other Provider',
            'code' => 'other-provider',
            'api_url' => 'https://api.other.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-providers');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->assertEquals($myProvider->uuid, $response->json('data.0.uuid'));
    }

    /** @test */
    public function cannot_update_other_tenant_provider()
    {
        Sanctum::actingAs($this->user);

        $otherProvider = ExchangeRateProvider::create([
            'tenant_id' => $this->otherTenantId,
            'name' => 'Other Provider',
            'code' => 'other-provider',
            'api_url' => 'https://api.other.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->putJson("/api/v1/tenant/exchange-rate-providers/{$otherProvider->uuid}", [
            'priority' => 5,
        ]);

        $response->assertStatus(404);

        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $otherProvider->uuid,
            'priority' => 1, // Unchanged
        ]);
    }

    /** @test */
    public function cannot_delete_other_tenant_provider()
    {
        Sanctum::actingAs($this->user);

        $otherProvider = ExchangeRateProvider::create([
            'tenant_id' => $this->otherTenantId,
            'name' => 'Other Provider',
            'code' => 'other-provider',
            'api_url' => 'https://api.other.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->deleteJson("/api/v1/tenant/exchange-rate-providers/{$otherProvider->uuid}");

        $response->assertStatus(404);

        $this->assertDatabaseHas('exchange_rate_providers', [
            'uuid' => $otherProvider->uuid,
        ]);
    }

    /** @test */
    public function history_is_isolated_by_tenant()
    {
        Sanctum::actingAs($this->user);

        $myProvider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $otherProvider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->otherTenantId,
        ]);

        // Create history for both tenants
        ExchangeRateHistory::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $myProvider->id,
        ]);

        ExchangeRateHistory::factory()->count(5)->create([
            'tenant_id' => $this->otherTenantId,
            'provider_id' => $otherProvider->id,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-history');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 3); // Only current tenant's records
    }

    // ========================================
    // Authorization Tests
    // ========================================

    /** @test */
    public function user_from_different_tenant_cannot_access_settings()
    {
        Sanctum::actingAs($this->otherTenantUser);

        ExchangeRateSetting::create([
            'tenant_id' => $this->tenantId,
            'mode' => 'manual',
            'manual_rate' => 15000.0000,
            'current_rate' => 15000.0000,
            'auto_update_enabled' => true,
            'auto_update_time' => '00:00:00',
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-settings');

        // Should get their own tenant's settings (or create default)
        $response->assertStatus(200);
        
        // Verify they don't see the other tenant's rate
        $response->assertJsonMissing([
            'manual_rate' => '15000.0000',
        ]);
    }

    /** @test */
    public function user_from_different_tenant_cannot_see_providers()
    {
        Sanctum::actingAs($this->otherTenantUser);

        ExchangeRateProvider::create([
            'tenant_id' => $this->tenantId,
            'name' => 'Tenant 1 Provider',
            'code' => 'tenant-1-provider',
            'api_url' => 'https://api.test.com',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-providers');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data'); // No providers for other tenant
    }

    /** @test */
    public function user_from_different_tenant_cannot_see_history()
    {
        Sanctum::actingAs($this->otherTenantUser);

        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        ExchangeRateHistory::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
        ]);

        $response = $this->getJson('/api/v1/tenant/exchange-rate-history');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 0); // No history for other tenant
    }
}
