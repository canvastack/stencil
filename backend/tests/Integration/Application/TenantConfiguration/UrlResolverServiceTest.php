<?php

namespace Tests\Integration\Application\TenantConfiguration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\TenantConfiguration\Services\UrlResolverService;
use App\Application\TenantConfiguration\UseCases\ResolveTenantFromUrlUseCase;
use App\Domain\Tenant\Services\UrlPatternMatcher;
use App\Domain\Tenant\Services\TenantResolver;
use App\Domain\Tenant\Repositories\TenantRepositoryInterface;
use App\Domain\Tenant\Repositories\TenantUrlConfigRepositoryInterface;
use App\Domain\Tenant\Repositories\CustomDomainRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Domain\Tenant\Exceptions\TenantNotFoundException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;

class UrlResolverServiceTest extends TestCase
{
    use RefreshDatabase;

    private UrlResolverService $service;
    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create([
            'slug' => 'testcorp',
            'name' => 'Test Corporation'
        ]);

        $urlPatternMatcher = new UrlPatternMatcher(
            baseDomain: 'stencil.canvastack.com',
            excludedSubdomains: ['www', 'api', 'admin', 'platform', 'mail'],
            pathPrefix: 't'
        );

        $tenantResolver = new TenantResolver(
            app(TenantRepositoryInterface::class),
            app(TenantUrlConfigRepositoryInterface::class),
            app(CustomDomainRepositoryInterface::class)
        );

        $useCase = new ResolveTenantFromUrlUseCase($urlPatternMatcher, $tenantResolver);

        $this->service = new UrlResolverService($useCase);

        Config::set('tenant-url.cache.enabled', true);
        Config::set('tenant-url.cache.ttl', 3600);
        Config::set('tenant-url.cache.prefix', 'tenant_url:');
        Config::set('tenant-url.detection.subdomain.base_domain', 'stencil.canvastack.com');
        Config::set('tenant-url.detection.path.prefix', 't');
    }

    public function test_resolves_tenant_from_request_with_subdomain(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $result = $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/');

        $this->assertEquals($this->tenant->uuid, $result['uuid']);
        $this->assertEquals('testcorp', $result['slug']);
        $this->assertEquals('Test Corporation', $result['name']);
    }

    public function test_resolves_tenant_from_request_with_path(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'path',
            'url_path' => 'testcorp',
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $result = $this->service->resolveTenantFromRequest('stencil.canvastack.com', 't/testcorp');

        $this->assertEquals($this->tenant->uuid, $result['uuid']);
        $this->assertEquals('testcorp', $result['slug']);
    }

    public function test_resolves_tenant_from_request_with_custom_domain(): void
    {
        $customDomain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'testcorp.com',
            'status' => 'active',
            'is_verified' => true,
            'verified_at' => now()
        ]);

        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'custom_domain',
            'custom_domain_id' => $customDomain->id,
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $result = $this->service->resolveTenantFromRequest('testcorp.com', '/');

        $this->assertEquals($this->tenant->uuid, $result['uuid']);
    }

    public function test_resolve_tenant_with_subdomain_pattern(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $result = $this->service->resolveTenant('subdomain', 'testcorp');

        $this->assertEquals($this->tenant->uuid, $result['uuid']);
        $this->assertEquals('testcorp', $result['slug']);
    }

    public function test_resolve_tenant_with_path_pattern(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'path',
            'url_path' => 'testcorp',
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $result = $this->service->resolveTenant('path', 'testcorp');

        $this->assertEquals($this->tenant->uuid, $result['uuid']);
    }

    public function test_resolve_tenant_with_custom_domain_pattern(): void
    {
        $customDomain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'testcorp.com',
            'status' => 'active',
            'is_verified' => true,
            'verified_at' => now()
        ]);

        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'custom_domain',
            'custom_domain_id' => $customDomain->id,
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $result = $this->service->resolveTenant('custom_domain', 'testcorp.com');

        $this->assertEquals($this->tenant->uuid, $result['uuid']);
    }

    public function test_caches_tenant_resolution_when_enabled(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        Cache::flush();

        $result1 = $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/');
        
        $cacheKey = 'tenant_url:' . md5('testcorp.stencil.canvastack.com:/');
        $this->assertTrue(Cache::has($cacheKey));

        $result2 = $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/');
        
        $this->assertEquals($result1, $result2);
    }

    public function test_clears_specific_cache_entry(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        Cache::flush();

        $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/');
        
        $cacheKey = 'tenant_url:' . md5('testcorp.stencil.canvastack.com:/');
        $this->assertTrue(Cache::has($cacheKey));

        $this->service->clearCache('testcorp.stencil.canvastack.com', '/');
        
        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_warm_cache_preloads_tenant_data(): void
    {
        $tenant2 = TenantEloquentModel::factory()->create(['slug' => 'acmecorp']);
        $tenant3 = TenantEloquentModel::factory()->create(['slug' => 'globalcorp']);

        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $tenant2->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'acmecorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        Cache::flush();

        $tenants = [
            ['url_pattern' => 'subdomain', 'identifier' => 'testcorp'],
            ['url_pattern' => 'subdomain', 'identifier' => 'acmecorp'],
        ];

        $this->service->warmCache($tenants);

        $cacheKey1 = 'tenant_url:' . md5('testcorp.stencil.canvastack.com:/');
        $cacheKey2 = 'tenant_url:' . md5('acmecorp.stencil.canvastack.com:/');

        $this->assertTrue(Cache::has($cacheKey1));
        $this->assertTrue(Cache::has($cacheKey2));
    }

    public function test_throws_exception_for_nonexistent_tenant(): void
    {
        $this->expectException(TenantNotFoundException::class);

        $this->service->resolveTenantFromRequest('nonexistent.stencil.canvastack.com', '/');
    }

    public function test_disabled_cache_skips_caching(): void
    {
        Config::set('tenant-url.cache.enabled', false);

        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        Cache::flush();

        $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/');
        
        $cacheKey = 'tenant_url:' . md5('testcorp.stencil.canvastack.com:/');
        $this->assertFalse(Cache::has($cacheKey));
    }

    public function test_clears_all_cache_entries(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        Cache::flush();

        $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/dashboard');
        $this->service->resolveTenantFromRequest('testcorp.stencil.canvastack.com', '/settings');
        
        $cacheKey1 = 'tenant_url:' . md5('testcorp.stencil.canvastack.com:/dashboard');
        $cacheKey2 = 'tenant_url:' . md5('testcorp.stencil.canvastack.com:/settings');
        
        $this->assertTrue(Cache::has($cacheKey1));
        $this->assertTrue(Cache::has($cacheKey2));

        $this->service->clearAllCache();

        $this->assertFalse(Cache::has($cacheKey1));
        $this->assertFalse(Cache::has($cacheKey2));
    }
}
