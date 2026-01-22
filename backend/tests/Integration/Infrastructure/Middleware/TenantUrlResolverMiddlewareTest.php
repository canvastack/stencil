<?php

namespace Tests\Integration\Infrastructure\Middleware;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use App\Infrastructure\Presentation\Http\Middleware\TenantUrlResolverMiddleware;
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
use Illuminate\Support\Facades\Config;

class TenantUrlResolverMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private TenantUrlResolverMiddleware $middleware;
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
        $urlResolverService = new UrlResolverService($useCase);

        $this->middleware = new TenantUrlResolverMiddleware($urlResolverService);

        Config::set('tenant-url.cache.enabled', false);
        Config::set('tenant-url.monitoring.enabled', true);
        Config::set('tenant-url.monitoring.slow_threshold_ms', 10);
        Config::set('tenant-url.fallback.show_404', true);
        Config::set('tenant-url.fallback.log_failures', true);
        Config::set('tenant-url.fallback.redirect_to', 'https://www.stencil.canvastack.com');
    }

    public function test_resolves_tenant_from_subdomain_and_sets_context(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $request = Request::create('http://testcorp.stencil.canvastack.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertEquals($this->tenant->id, $req->attributes->get('tenant_id'));
            $this->assertEquals($this->tenant->uuid, $req->attributes->get('tenant_uuid'));
            $this->assertEquals('testcorp', $req->attributes->get('tenant_slug'));
            $this->assertEquals('Test Corporation', $req->attributes->get('tenant_name'));

            $this->assertEquals($this->tenant->id, app('tenant.id'));
            $this->assertEquals($this->tenant->uuid, app('tenant.uuid'));

            $this->assertEquals($this->tenant->id, config('app.current_tenant_id'));
            $this->assertEquals($this->tenant->uuid, config('app.current_tenant_uuid'));

            return response('OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_resolves_tenant_from_path_and_sets_context(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'path',
            'url_path' => 'testcorp',
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $request = Request::create('http://stencil.canvastack.com/t/testcorp/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertEquals($this->tenant->id, $req->attributes->get('tenant_id'));
            $this->assertEquals($this->tenant->uuid, $req->attributes->get('tenant_uuid'));
            return response('OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_resolves_tenant_from_custom_domain_and_sets_context(): void
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

        $request = Request::create('http://testcorp.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertEquals($this->tenant->id, $req->attributes->get('tenant_id'));
            return response('OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_platform_routes(): void
    {
        $request = Request::create('http://stencil.canvastack.com/api/v1/platform/tenants', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertNull($req->attributes->get('tenant_id'));
            $this->assertNull($req->attributes->get('tenant_uuid'));
            return response('Platform OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_platform_admin_routes(): void
    {
        $request = Request::create('http://stencil.canvastack.com/platform/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertNull($req->attributes->get('tenant_id'));
            return response('Platform OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_bypasses_admin_platform_routes(): void
    {
        $request = Request::create('http://stencil.canvastack.com/admin/platform/settings', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertNull($req->attributes->get('tenant_id'));
            return response('Platform OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_returns_404_when_tenant_not_found_and_fallback_enabled(): void
    {
        Config::set('tenant-url.fallback.show_404', true);

        $request = Request::create('http://nonexistent.stencil.canvastack.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            return response('Should not reach here', 200);
        });

        $this->assertEquals(404, $response->getStatusCode());
        $responseData = json_decode($response->getContent(), true);
        $this->assertEquals('Tenant not found', $responseData['message']);
    }

    public function test_redirects_when_tenant_not_found_and_fallback_disabled(): void
    {
        Config::set('tenant-url.fallback.show_404', false);
        Config::set('tenant-url.fallback.redirect_to', 'https://www.stencil.canvastack.com');

        $request = Request::create('http://nonexistent.stencil.canvastack.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            return response('Should not reach here', 200);
        });

        $this->assertEquals(302, $response->getStatusCode());
        $this->assertEquals('https://www.stencil.canvastack.com', $response->headers->get('Location'));
    }

    public function test_returns_400_for_invalid_url_pattern(): void
    {
        $request = Request::create('http://stencil.canvastack.com/', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            return response('Should not reach here', 200);
        });

        $this->assertEquals(400, $response->getStatusCode());
    }

    public function test_returns_500_for_unexpected_errors(): void
    {
        $mockService = $this->createMock(UrlResolverService::class);
        $mockService->method('resolveTenantFromRequest')
            ->willThrowException(new \Exception('Unexpected database error'));

        $middleware = new TenantUrlResolverMiddleware($mockService);

        $request = Request::create('http://testcorp.stencil.canvastack.com/dashboard', 'GET');

        $response = $middleware->handle($request, function ($req) {
            return response('Should not reach here', 200);
        });

        $this->assertEquals(500, $response->getStatusCode());
    }

    public function test_handles_subdomain_with_hyphen(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'test-corp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $request = Request::create('http://test-corp.stencil.canvastack.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertEquals($this->tenant->id, $req->attributes->get('tenant_id'));
            return response('OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_handles_path_with_trailing_segments(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'path',
            'url_path' => 'testcorp',
            'is_primary' => false,
            'is_enabled' => true
        ]);

        $request = Request::create('http://stencil.canvastack.com/t/testcorp/dashboard/settings', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            $this->assertEquals($this->tenant->id, $req->attributes->get('tenant_id'));
            return response('OK', 200);
        });

        $this->assertEquals(200, $response->getStatusCode());
    }

    public function test_rejects_disabled_tenant_configuration(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => false
        ]);

        $request = Request::create('http://testcorp.stencil.canvastack.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            return response('Should not reach here', 200);
        });

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function test_rejects_unverified_custom_domain(): void
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

        $request = Request::create('http://testcorp.com/dashboard', 'GET');

        $response = $this->middleware->handle($request, function ($req) {
            return response('Should not reach here', 200);
        });

        $this->assertEquals(404, $response->getStatusCode());
    }

    public function test_multiple_requests_for_same_tenant_maintain_context(): void
    {
        TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'testcorp',
            'is_primary' => true,
            'is_enabled' => true
        ]);

        $request1 = Request::create('http://testcorp.stencil.canvastack.com/dashboard', 'GET');
        $request2 = Request::create('http://testcorp.stencil.canvastack.com/settings', 'GET');

        $response1 = $this->middleware->handle($request1, function ($req) {
            return response('OK', 200);
        });

        $response2 = $this->middleware->handle($request2, function ($req) {
            $this->assertEquals($this->tenant->id, $req->attributes->get('tenant_id'));
            return response('OK', 200);
        });

        $this->assertEquals(200, $response1->getStatusCode());
        $this->assertEquals(200, $response2->getStatusCode());
    }
}
