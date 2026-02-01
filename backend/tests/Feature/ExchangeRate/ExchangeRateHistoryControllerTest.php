<?php

namespace Tests\Feature\ExchangeRate;

use App\Models\ExchangeRateHistory;
use App\Models\ExchangeRateProvider;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExchangeRateHistoryControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private int $tenantId;
    private $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);
        $this->tenantId = $this->tenant->id;

        // Create user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);
    }

    /** @test */
    public function it_retrieves_exchange_rate_history_with_pagination()
    {
        // Create provider
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create history records
        ExchangeRateHistory::factory()->count(25)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history?per_page=10');

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
                        'metadata',
                        'created_at',
                    ],
                ],
                'meta' => [
                    'current_page',
                    'from',
                    'last_page',
                    'per_page',
                    'to',
                    'total',
                ],
                'links',
            ])
            ->assertJsonPath('meta.per_page', 10)
            ->assertJsonPath('meta.total', 25);
    }

    /** @test */
    public function it_filters_history_by_date_range()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create records with different dates
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

        ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'created_at' => now()->subDays(1),
        ]);

        $dateFrom = now()->subDays(6)->format('Y-m-d');
        $dateTo = now()->subDays(2)->format('Y-m-d');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/tenant/exchange-rate-history?date_from={$dateFrom}&date_to={$dateTo}");

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    }

    /** @test */
    public function it_filters_history_by_provider()
    {
        $provider1 = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Provider 1',
            'code' => 'provider_1_' . uniqid(),
        ]);

        $provider2 = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Provider 2',
            'code' => 'provider_2_' . uniqid(),
        ]);

        // Create records for different providers
        ExchangeRateHistory::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider1->id,
        ]);

        ExchangeRateHistory::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider2->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/tenant/exchange-rate-history?provider_id={$provider1->uuid}");

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 3);
    }

    /** @test */
    public function it_filters_history_by_event_type()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create records with different event types
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

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history?event_type=rate_change');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 3);
    }

    /** @test */
    public function it_filters_history_by_source()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create records with different sources
        ExchangeRateHistory::factory()->count(4)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'source' => 'api',
        ]);

        ExchangeRateHistory::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'source' => 'manual',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history?source=api');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 4);
    }

    /** @test */
    public function it_orders_history_by_created_at_desc()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create records with specific timestamps
        $oldest = ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'created_at' => now()->subDays(3),
        ]);

        $middle = ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'created_at' => now()->subDays(2),
        ]);

        $newest = ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'created_at' => now()->subDays(1),
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history');

        $response->assertStatus(200);

        $data = $response->json('data');
        
        // Verify newest first
        $this->assertEquals($newest->uuid, $data[0]['uuid']);
        $this->assertEquals($middle->uuid, $data[1]['uuid']);
        $this->assertEquals($oldest->uuid, $data[2]['uuid']);
    }

    /** @test */
    public function it_enforces_tenant_isolation()
    {
        $otherTenant = TenantEloquentModel::factory()->create([
            'status' => 'active',
        ]);
        
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $otherProvider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        // Create records for both tenants
        ExchangeRateHistory::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
        ]);

        ExchangeRateHistory::factory()->count(5)->create([
            'tenant_id' => $otherTenant->id,
            'provider_id' => $otherProvider->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history');

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 3); // Only current tenant's records
    }

    /** @test */
    public function it_validates_query_parameters()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history?per_page=invalid');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    /** @test */
    public function it_validates_date_range()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history?date_from=2024-01-10&date_to=2024-01-05');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_to']);
    }

    /** @test */
    public function it_validates_event_type()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/tenant/exchange-rate-history?event_type=invalid_type');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['event_type']);
    }

    /** @test */
    public function it_combines_multiple_filters()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create various records
        ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'event_type' => 'rate_change',
            'source' => 'api',
            'created_at' => now()->subDays(5),
        ]);

        ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'event_type' => 'rate_change',
            'source' => 'manual',
            'created_at' => now()->subDays(5),
        ]);

        ExchangeRateHistory::factory()->create([
            'tenant_id' => $this->tenantId,
            'provider_id' => $provider->id,
            'event_type' => 'provider_switch',
            'source' => 'api',
            'created_at' => now()->subDays(5),
        ]);

        $dateFrom = now()->subDays(6)->format('Y-m-d');
        $dateTo = now()->subDays(4)->format('Y-m-d');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/tenant/exchange-rate-history?date_from={$dateFrom}&date_to={$dateTo}&event_type=rate_change&source=api");

        $response->assertStatus(200)
            ->assertJsonPath('meta.total', 1);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->getJson('/api/v1/tenant/exchange-rate-history');

        $response->assertStatus(401);
    }
}
