<?php

namespace Tests\Integration\Application\TenantConfiguration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
use App\Domain\Tenant\Exceptions\InvalidUrlPatternException;
use Illuminate\Support\Facades\Cache;

class ResolveTenantFromUrlUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private ResolveTenantFromUrlUseCase $useCase;
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

        $this->useCase = new ResolveTenantFromUrlUseCase(
            $urlPatternMatcher,
            $tenantResolver
        );
    }

    public function test_resolves_tenant_from_subdomain_successfully(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $result = $this->useCase->execute('testcorp.stencil.canvastack.com', '/');

        $this->assertTrue($result['success']);
        $this->assertEquals('subdomain', $result['pattern']);
        $this->assertEquals('testcorp', $result['identifier']);
        $this->assertEquals($this->tenant->uuid, $result['tenant']['uuid']);
        $this->assertEquals('testcorp', $result['tenant']['slug']);
        $this->assertEquals('Test Corporation', $result['tenant']['name']);
    }

    public function test_resolves_tenant_from_path_successfully(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'path',
            'url_path' => 'testcorp',
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $result = $this->useCase->execute('stencil.canvastack.com', 't/testcorp');

        $this->assertTrue($result['success']);
        $this->assertEquals('path', $result['pattern']);
        $this->assertEquals('testcorp', $result['identifier']);
        $this->assertEquals($this->tenant->uuid, $result['tenant']['uuid']);
    }

    public function test_resolves_tenant_from_custom_domain_successfully(): void
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

        $result = $this->useCase->execute('testcorp.com', '/');

        $this->assertTrue($result['success']);
        $this->assertEquals('custom_domain', $result['pattern']);
        $this->assertEquals('testcorp.com', $result['identifier']);
        $this->assertEquals($this->tenant->uuid, $result['tenant']['uuid']);
    }

    public function test_throws_exception_for_nonexistent_subdomain(): void
    {
        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No tenant found for subdomain: nonexistent');

        $this->useCase->execute('nonexistent.stencil.canvastack.com', '/');
    }

    public function test_throws_exception_for_nonexistent_path(): void
    {
        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No tenant found for path: nonexistent');

        $this->useCase->execute('stencil.canvastack.com', 't/nonexistent');
    }

    public function test_throws_exception_for_nonexistent_custom_domain(): void
    {
        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('No tenant found for custom domain: nonexistent.com');

        $this->useCase->execute('nonexistent.com', '/');
    }

    public function test_throws_exception_for_invalid_url_pattern(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->useCase->execute('stencil.canvastack.com', '/');
    }

    public function test_throws_exception_for_excluded_subdomain(): void
    {
        $this->expectException(InvalidUrlPatternException::class);

        $this->useCase->execute('www.stencil.canvastack.com', '/');
    }

    public function test_throws_exception_for_disabled_subdomain_configuration(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => false
        ]);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Tenant URL configuration is inactive for subdomain: testcorp');

        $this->useCase->execute('testcorp.stencil.canvastack.com', '/');
    }

    public function test_throws_exception_for_unverified_custom_domain(): void
    {
        $customDomain = CustomDomainEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'domain_name' => 'testcorp.com',
            'status' => 'active',
            'is_verified' => false,
            'verified_at' => null
        ]);

        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'custom_domain',
            'custom_domain_id' => $customDomain->id,
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $this->expectException(TenantNotFoundException::class);
        $this->expectExceptionMessage('Custom domain not verified: testcorp.com');

        $this->useCase->execute('testcorp.com', '/');
    }

    public function test_execute_with_cache_caches_result(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        Cache::flush();

        $result1 = $this->useCase->executeWithCache('testcorp.stencil.canvastack.com', '/', 60);
        $result2 = $this->useCase->executeWithCache('testcorp.stencil.canvastack.com', '/', 60);

        $this->assertEquals($result1, $result2);
        $this->assertTrue($result1['success']);
    }

    public function test_resolves_tenant_with_hyphenated_subdomain(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'test-corp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $result = $this->useCase->execute('test-corp.stencil.canvastack.com', '/');

        $this->assertTrue($result['success']);
        $this->assertEquals('test-corp', $result['identifier']);
    }

    public function test_resolves_tenant_with_numeric_slug(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'path',
            'url_path' => 'testcorp123',
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $result = $this->useCase->execute('stencil.canvastack.com', 't/testcorp123');

        $this->assertTrue($result['success']);
        $this->assertEquals('testcorp123', $result['identifier']);
    }

    public function test_result_includes_all_required_tenant_fields(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $result = $this->useCase->execute('testcorp.stencil.canvastack.com', '/');

        $this->assertArrayHasKey('tenant', $result);
        $this->assertArrayHasKey('id', $result['tenant']);
        $this->assertArrayHasKey('uuid', $result['tenant']);
        $this->assertArrayHasKey('slug', $result['tenant']);
        $this->assertArrayHasKey('name', $result['tenant']);
        $this->assertArrayHasKey('status', $result['tenant']);
        $this->assertArrayHasKey('is_active', $result['tenant']);
    }
}
