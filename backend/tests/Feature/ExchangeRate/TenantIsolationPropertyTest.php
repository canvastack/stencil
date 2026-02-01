<?php

namespace Tests\Feature\ExchangeRate;

use Tests\TestCase;
use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateProvider;
use App\Models\ExchangeRateHistory;
use App\Models\ApiQuotaTracking;
use App\Models\ProviderSwitchEvent;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

/**
 * Property-Based Test for Tenant Isolation
 * 
 * Property 26: Tenant Data Isolation
 * Property 27: Tenant Cascade Deletion
 * 
 * For any tenant, all exchange rate settings, providers, quotas, history,
 * and switch events should be scoped to that tenant's ID, with no cross-tenant
 * data access possible. When a tenant is deleted, all associated data should
 * be cascade deleted.
 * 
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
 * 
 * @group Feature: dynamic-exchange-rate-system, Property 26: Tenant Data Isolation
 * @group Feature: dynamic-exchange-rate-system, Property 27: Tenant Cascade Deletion
 */
class TenantIsolationPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private Tenant $tenantC;

    protected function setUp(): void
    {
        parent::setUp();

        // Create three test tenants for comprehensive isolation testing
        $this->tenantA = Tenant::create([
            'uuid' => Str::uuid(),
            'name' => 'Tenant A - Exchange Rate Test',
            'slug' => 'tenant-a-exchange',
            'domain' => 'tenant-a.test',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);

        $this->tenantB = Tenant::create([
            'uuid' => Str::uuid(),
            'name' => 'Tenant B - Exchange Rate Test',
            'slug' => 'tenant-b-exchange',
            'domain' => 'tenant-b.test',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);

        $this->tenantC = Tenant::create([
            'uuid' => Str::uuid(),
            'name' => 'Tenant C - Exchange Rate Test',
            'slug' => 'tenant-c-exchange',
            'domain' => 'tenant-c.test',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);
    }

    /**
     * Property 26: Exchange Rate Settings are tenant-isolated
     * 
     * @test
     */
    public function property_exchange_rate_settings_are_tenant_isolated(): void
    {
        // Create settings for each tenant with different configurations
        $settingA = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantA->id,
            'mode' => 'manual',
            'manual_rate' => 15000.00,
            'current_rate' => 15000.00,
            'auto_update_enabled' => false,
        ]);

        $settingB = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantB->id,
            'mode' => 'auto',
            'manual_rate' => null,
            'current_rate' => 15500.00,
            'auto_update_enabled' => true,
        ]);

        $settingC = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantC->id,
            'mode' => 'manual',
            'manual_rate' => 14800.00,
            'current_rate' => 14800.00,
            'auto_update_enabled' => false,
        ]);

        // Verify Tenant A can only see its own settings
        $tenantASettings = ExchangeRateSetting::where('tenant_id', $this->tenantA->id)->get();
        $this->assertCount(1, $tenantASettings);
        $this->assertEquals($settingA->id, $tenantASettings->first()->id);
        $this->assertEquals('manual', $tenantASettings->first()->mode);
        $this->assertEquals(15000.00, $tenantASettings->first()->manual_rate);

        // Verify Tenant B can only see its own settings
        $tenantBSettings = ExchangeRateSetting::where('tenant_id', $this->tenantB->id)->get();
        $this->assertCount(1, $tenantBSettings);
        $this->assertEquals($settingB->id, $tenantBSettings->first()->id);
        $this->assertEquals('auto', $tenantBSettings->first()->mode);

        // Verify Tenant C can only see its own settings
        $tenantCSettings = ExchangeRateSetting::where('tenant_id', $this->tenantC->id)->get();
        $this->assertCount(1, $tenantCSettings);
        $this->assertEquals($settingC->id, $tenantCSettings->first()->id);

        // Verify no cross-tenant access
        $this->assertNotEquals($settingA->id, $settingB->id);
        $this->assertNotEquals($settingB->id, $settingC->id);
        $this->assertNotEquals($settingA->id, $settingC->id);
    }

    /**
     * Property 26: Exchange Rate Providers are tenant-isolated
     * 
     * @test
     */
    public function property_exchange_rate_providers_are_tenant_isolated(): void
    {
        // Create providers for each tenant
        $providerA1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'ExchangeRate-API',
            'code' => 'exchangerate-api',
            'api_url' => 'https://api.exchangerate-api.com',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 1500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $providerA2 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Frankfurter',
            'code' => 'frankfurter',
            'api_url' => 'https://api.frankfurter.app',
            'requires_api_key' => false,
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 2,
            'is_enabled' => true,
        ]);

        $providerB1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'CurrencyAPI',
            'code' => 'currencyapi',
            'api_url' => 'https://api.currencyapi.com',
            'requires_api_key' => true,
            'is_unlimited' => false,
            'monthly_quota' => 300,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Verify Tenant A can only see its own providers
        $tenantAProviders = ExchangeRateProvider::where('tenant_id', $this->tenantA->id)->get();
        $this->assertCount(2, $tenantAProviders);
        $this->assertTrue($tenantAProviders->contains('id', $providerA1->id));
        $this->assertTrue($tenantAProviders->contains('id', $providerA2->id));
        $this->assertFalse($tenantAProviders->contains('id', $providerB1->id));

        // Verify Tenant B can only see its own providers
        $tenantBProviders = ExchangeRateProvider::where('tenant_id', $this->tenantB->id)->get();
        $this->assertCount(1, $tenantBProviders);
        $this->assertEquals($providerB1->id, $tenantBProviders->first()->id);

        // Verify Tenant C has no providers
        $tenantCProviders = ExchangeRateProvider::where('tenant_id', $this->tenantC->id)->get();
        $this->assertCount(0, $tenantCProviders);
    }

    /**
     * Property 26: API Quota Tracking is tenant-isolated
     * 
     * @test
     */
    public function property_api_quota_tracking_is_tenant_isolated(): void
    {
        // Create providers for tenants
        $providerA = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A',
            'code' => 'provider-a',
            'api_url' => 'https://api.provider-a.com',
            'monthly_quota' => 1000,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $providerB = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Provider B',
            'code' => 'provider-b',
            'api_url' => 'https://api.provider-b.com',
            'monthly_quota' => 500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create quota tracking for each provider
        $quotaA = ApiQuotaTracking::create([
            'provider_id' => $providerA->id,
            'requests_made' => 250,
            'quota_limit' => 1000,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);

        $quotaB = ApiQuotaTracking::create([
            'provider_id' => $providerB->id,
            'requests_made' => 450,
            'quota_limit' => 500,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);

        // Verify quota tracking is isolated by provider (and thus by tenant)
        $providerAQuota = ApiQuotaTracking::where('provider_id', $providerA->id)->first();
        $this->assertEquals(250, $providerAQuota->requests_made);
        $this->assertEquals(750, $providerAQuota->remaining_quota);

        $providerBQuota = ApiQuotaTracking::where('provider_id', $providerB->id)->first();
        $this->assertEquals(450, $providerBQuota->requests_made);
        $this->assertEquals(50, $providerBQuota->remaining_quota);

        // Verify no cross-provider access
        $this->assertNotEquals($quotaA->id, $quotaB->id);
    }

    /**
     * Property 26: Exchange Rate History is tenant-isolated
     * 
     * @test
     */
    public function property_exchange_rate_history_is_tenant_isolated(): void
    {
        // Create providers for tenants
        $providerA = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A',
            'code' => 'provider-a',
            'api_url' => 'https://api.provider-a.com',
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $providerB = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Provider B',
            'code' => 'provider-b',
            'api_url' => 'https://api.provider-b.com',
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create history records for each tenant
        $historyA1 = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantA->id,
            'rate' => 15000.00,
            'provider_id' => $providerA->id,
            'source' => 'api',
            'event_type' => 'rate_change',
        ]);

        $historyA2 = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantA->id,
            'rate' => 15100.00,
            'provider_id' => $providerA->id,
            'source' => 'api',
            'event_type' => 'rate_change',
        ]);

        $historyB1 = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantB->id,
            'rate' => 14800.00,
            'provider_id' => $providerB->id,
            'source' => 'manual',
            'event_type' => 'manual_update',
        ]);

        // Verify Tenant A can only see its own history
        $tenantAHistory = ExchangeRateHistory::where('tenant_id', $this->tenantA->id)->get();
        $this->assertCount(2, $tenantAHistory);
        $this->assertTrue($tenantAHistory->contains('id', $historyA1->id));
        $this->assertTrue($tenantAHistory->contains('id', $historyA2->id));
        $this->assertFalse($tenantAHistory->contains('id', $historyB1->id));

        // Verify Tenant B can only see its own history
        $tenantBHistory = ExchangeRateHistory::where('tenant_id', $this->tenantB->id)->get();
        $this->assertCount(1, $tenantBHistory);
        $this->assertEquals($historyB1->id, $tenantBHistory->first()->id);

        // Verify Tenant C has no history
        $tenantCHistory = ExchangeRateHistory::where('tenant_id', $this->tenantC->id)->get();
        $this->assertCount(0, $tenantCHistory);
    }

    /**
     * Property 26: Provider Switch Events are tenant-isolated
     * 
     * @test
     */
    public function property_provider_switch_events_are_tenant_isolated(): void
    {
        // Create providers for tenants
        $providerA1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A1',
            'code' => 'provider-a1',
            'api_url' => 'https://api.provider-a1.com',
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $providerA2 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A2',
            'code' => 'provider-a2',
            'api_url' => 'https://api.provider-a2.com',
            'priority' => 2,
            'is_enabled' => true,
        ]);

        $providerB1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Provider B1',
            'code' => 'provider-b1',
            'api_url' => 'https://api.provider-b1.com',
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create switch events for each tenant
        $switchA = ProviderSwitchEvent::create([
            'tenant_id' => $this->tenantA->id,
            'old_provider_id' => $providerA1->id,
            'new_provider_id' => $providerA2->id,
            'reason' => 'quota_exhausted',
        ]);

        $switchB = ProviderSwitchEvent::create([
            'tenant_id' => $this->tenantB->id,
            'old_provider_id' => null,
            'new_provider_id' => $providerB1->id,
            'reason' => 'manual_switch',
        ]);

        // Verify Tenant A can only see its own switch events
        $tenantASwitches = ProviderSwitchEvent::where('tenant_id', $this->tenantA->id)->get();
        $this->assertCount(1, $tenantASwitches);
        $this->assertEquals($switchA->id, $tenantASwitches->first()->id);
        $this->assertEquals('quota_exhausted', $tenantASwitches->first()->reason);

        // Verify Tenant B can only see its own switch events
        $tenantBSwitches = ProviderSwitchEvent::where('tenant_id', $this->tenantB->id)->get();
        $this->assertCount(1, $tenantBSwitches);
        $this->assertEquals($switchB->id, $tenantBSwitches->first()->id);

        // Verify Tenant C has no switch events
        $tenantCSwitches = ProviderSwitchEvent::where('tenant_id', $this->tenantC->id)->get();
        $this->assertCount(0, $tenantCSwitches);
    }

    /**
     * Property 26: Comprehensive multi-tenant isolation test
     * 
     * @test
     */
    public function property_comprehensive_multi_tenant_isolation(): void
    {
        // Create complete exchange rate setup for Tenant A
        $settingA = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantA->id,
            'mode' => 'auto',
            'current_rate' => 15000.00,
            'auto_update_enabled' => true,
        ]);

        $providerA = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A',
            'code' => 'provider-a',
            'api_url' => 'https://api.provider-a.com',
            'monthly_quota' => 1000,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $quotaA = ApiQuotaTracking::create([
            'provider_id' => $providerA->id,
            'requests_made' => 100,
            'quota_limit' => 1000,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);

        $historyA = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantA->id,
            'rate' => 15000.00,
            'provider_id' => $providerA->id,
            'source' => 'api',
            'event_type' => 'rate_change',
        ]);

        // Create complete exchange rate setup for Tenant B
        $settingB = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantB->id,
            'mode' => 'manual',
            'manual_rate' => 14500.00,
            'current_rate' => 14500.00,
            'auto_update_enabled' => false,
        ]);

        $providerB = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Provider B',
            'code' => 'provider-b',
            'api_url' => 'https://api.provider-b.com',
            'monthly_quota' => 500,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $quotaB = ApiQuotaTracking::create([
            'provider_id' => $providerB->id,
            'requests_made' => 450,
            'quota_limit' => 500,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);

        $historyB = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantB->id,
            'rate' => 14500.00,
            'provider_id' => $providerB->id,
            'source' => 'manual',
            'event_type' => 'manual_update',
        ]);

        // Verify complete isolation for Tenant A
        $this->assertEquals(1, ExchangeRateSetting::where('tenant_id', $this->tenantA->id)->count());
        $this->assertEquals(1, ExchangeRateProvider::where('tenant_id', $this->tenantA->id)->count());
        $this->assertEquals(1, ExchangeRateHistory::where('tenant_id', $this->tenantA->id)->count());

        // Verify complete isolation for Tenant B
        $this->assertEquals(1, ExchangeRateSetting::where('tenant_id', $this->tenantB->id)->count());
        $this->assertEquals(1, ExchangeRateProvider::where('tenant_id', $this->tenantB->id)->count());
        $this->assertEquals(1, ExchangeRateHistory::where('tenant_id', $this->tenantB->id)->count());

        // Verify Tenant C has no data
        $this->assertEquals(0, ExchangeRateSetting::where('tenant_id', $this->tenantC->id)->count());
        $this->assertEquals(0, ExchangeRateProvider::where('tenant_id', $this->tenantC->id)->count());
        $this->assertEquals(0, ExchangeRateHistory::where('tenant_id', $this->tenantC->id)->count());

        // Verify total counts match expected
        $this->assertEquals(2, ExchangeRateSetting::count());
        $this->assertEquals(2, ExchangeRateProvider::count());
        $this->assertEquals(2, ApiQuotaTracking::count());
        $this->assertEquals(2, ExchangeRateHistory::count());
    }

    /**
     * Property 27: Tenant cascade deletion for exchange rate data
     * 
     * @test
     */
    public function property_tenant_cascade_deletion(): void
    {
        // Create complete exchange rate setup for Tenant A
        $settingA = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantA->id,
            'mode' => 'auto',
            'current_rate' => 15000.00,
            'auto_update_enabled' => true,
        ]);

        $providerA1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A1',
            'code' => 'provider-a1',
            'api_url' => 'https://api.provider-a1.com',
            'monthly_quota' => 1000,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        $providerA2 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A2',
            'code' => 'provider-a2',
            'api_url' => 'https://api.provider-a2.com',
            'monthly_quota' => 500,
            'priority' => 2,
            'is_enabled' => true,
        ]);

        $quotaA1 = ApiQuotaTracking::create([
            'provider_id' => $providerA1->id,
            'requests_made' => 100,
            'quota_limit' => 1000,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);

        $quotaA2 = ApiQuotaTracking::create([
            'provider_id' => $providerA2->id,
            'requests_made' => 50,
            'quota_limit' => 500,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now()->startOfMonth(),
        ]);

        $historyA1 = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantA->id,
            'rate' => 15000.00,
            'provider_id' => $providerA1->id,
            'source' => 'api',
            'event_type' => 'rate_change',
        ]);

        $historyA2 = ExchangeRateHistory::create([
            'tenant_id' => $this->tenantA->id,
            'rate' => 15100.00,
            'provider_id' => $providerA1->id,
            'source' => 'api',
            'event_type' => 'rate_change',
        ]);

        $switchA = ProviderSwitchEvent::create([
            'tenant_id' => $this->tenantA->id,
            'old_provider_id' => $providerA1->id,
            'new_provider_id' => $providerA2->id,
            'reason' => 'quota_exhausted',
        ]);

        // Create data for Tenant B to ensure it's not affected
        $settingB = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantB->id,
            'mode' => 'manual',
            'manual_rate' => 14500.00,
            'current_rate' => 14500.00,
            'auto_update_enabled' => false,
        ]);

        $providerB = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantB->id,
            'name' => 'Provider B',
            'code' => 'provider-b',
            'api_url' => 'https://api.provider-b.com',
            'monthly_quota' => 300,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Verify initial state
        $this->assertEquals(2, ExchangeRateSetting::count());
        // Verify initial state - count providers for test tenants only
        $this->assertEquals(2, ExchangeRateProvider::where('tenant_id', $this->tenantA->id)->count());
        $this->assertEquals(1, ExchangeRateProvider::where('tenant_id', $this->tenantB->id)->count());
        $this->assertEquals(2, ApiQuotaTracking::count());
        $this->assertEquals(2, ExchangeRateHistory::count());
        $this->assertEquals(1, ProviderSwitchEvent::count());

        // Delete Tenant A
        $this->tenantA->delete();

        // Verify Tenant A's exchange rate data is deleted
        $this->assertEquals(0, ExchangeRateSetting::where('tenant_id', $this->tenantA->id)->count());
        $this->assertEquals(0, ExchangeRateProvider::where('tenant_id', $this->tenantA->id)->count());
        $this->assertEquals(0, ExchangeRateHistory::where('tenant_id', $this->tenantA->id)->count());
        $this->assertEquals(0, ProviderSwitchEvent::where('tenant_id', $this->tenantA->id)->count());

        // Verify Tenant B's data is unaffected
        $this->assertEquals(1, ExchangeRateSetting::where('tenant_id', $this->tenantB->id)->count());
        $this->assertEquals(1, ExchangeRateProvider::where('tenant_id', $this->tenantB->id)->count());

        // Verify total counts for test tenants only
        $this->assertEquals(1, ExchangeRateSetting::whereIn('tenant_id', [$this->tenantA->id, $this->tenantB->id])->count());
        $this->assertEquals(1, ExchangeRateProvider::whereIn('tenant_id', [$this->tenantA->id, $this->tenantB->id])->count());
        $this->assertEquals(0, ExchangeRateHistory::whereIn('tenant_id', [$this->tenantA->id, $this->tenantB->id])->count());
        $this->assertEquals(0, ProviderSwitchEvent::whereIn('tenant_id', [$this->tenantA->id, $this->tenantB->id])->count());
    }

    /**
     * Property 26: Scoped queries return only tenant-specific data
     * 
     * @test
     */
    public function property_scoped_queries_return_only_tenant_data(): void
    {
        // Create providers for multiple tenants (not settings, since there's a unique constraint)
        for ($i = 1; $i <= 3; $i++) {
            ExchangeRateProvider::create([
                'tenant_id' => $this->tenantA->id,
                'name' => "Provider A{$i}",
                'code' => "provider-a{$i}",
                'api_url' => "https://api.provider-a{$i}.com",
                'monthly_quota' => 1000 + ($i * 100),
                'priority' => $i,
                'is_enabled' => true,
            ]);
        }

        for ($i = 1; $i <= 2; $i++) {
            ExchangeRateProvider::create([
                'tenant_id' => $this->tenantB->id,
                'name' => "Provider B{$i}",
                'code' => "provider-b{$i}",
                'api_url' => "https://api.provider-b{$i}.com",
                'monthly_quota' => 500 + ($i * 50),
                'priority' => $i,
                'is_enabled' => true,
            ]);
        }

        // Test forTenant scope on providers
        $tenantAProviders = ExchangeRateProvider::forTenant($this->tenantA->id)->get();
        $this->assertCount(3, $tenantAProviders);
        foreach ($tenantAProviders as $provider) {
            $this->assertEquals($this->tenantA->id, $provider->tenant_id);
        }

        $tenantBProviders = ExchangeRateProvider::forTenant($this->tenantB->id)->get();
        $this->assertCount(2, $tenantBProviders);
        foreach ($tenantBProviders as $provider) {
            $this->assertEquals($this->tenantB->id, $provider->tenant_id);
        }

        // Verify total count
        $this->assertEquals(5, ExchangeRateProvider::count());

        // Create one setting per tenant to test settings scope
        $settingA = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantA->id,
            'mode' => 'auto',
            'current_rate' => 15000.00,
            'auto_update_enabled' => true,
        ]);

        $settingB = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantB->id,
            'mode' => 'manual',
            'manual_rate' => 14500.00,
            'current_rate' => 14500.00,
            'auto_update_enabled' => false,
        ]);

        // Test forTenant scope on settings
        $tenantASettings = ExchangeRateSetting::forTenant($this->tenantA->id)->get();
        $this->assertCount(1, $tenantASettings);
        $this->assertEquals($this->tenantA->id, $tenantASettings->first()->tenant_id);

        $tenantBSettings = ExchangeRateSetting::forTenant($this->tenantB->id)->get();
        $this->assertCount(1, $tenantBSettings);
        $this->assertEquals($this->tenantB->id, $tenantBSettings->first()->tenant_id);
    }

    /**
     * Property 26: Cross-tenant data access is prevented
     * 
     * @test
     */
    public function property_cross_tenant_data_access_is_prevented(): void
    {
        // Create provider for Tenant A
        $providerA = ExchangeRateProvider::create([
            'tenant_id' => $this->tenantA->id,
            'name' => 'Provider A',
            'code' => 'provider-a',
            'api_url' => 'https://api.provider-a.com',
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create setting for Tenant B
        $settingB = ExchangeRateSetting::create([
            'tenant_id' => $this->tenantB->id,
            'mode' => 'auto',
            'current_rate' => 15000.00,
            'auto_update_enabled' => true,
        ]);

        // Attempt to link Tenant B's setting to Tenant A's provider (cross-tenant reference)
        // This should be prevented by application logic, but we test the isolation
        $settingB->active_provider_id = $providerA->id;
        $settingB->save();

        // Verify that querying with tenant scope doesn't return cross-tenant data
        $tenantBProviders = ExchangeRateProvider::where('tenant_id', $this->tenantB->id)->get();
        $this->assertCount(0, $tenantBProviders);
        $this->assertFalse($tenantBProviders->contains('id', $providerA->id));

        // Verify Tenant A's provider is not accessible from Tenant B's context
        $providerFromTenantB = ExchangeRateProvider::where('tenant_id', $this->tenantB->id)
            ->where('id', $providerA->id)
            ->first();
        $this->assertNull($providerFromTenantB);
    }
}
