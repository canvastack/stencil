<?php

namespace Tests\Unit\Http\Middleware;

use Tests\TestCase;
use App\Infrastructure\Presentation\Http\Middleware\TenantContextMiddleware;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

class TenantContextMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private TenantContextMiddleware $middleware;
    private TenantEloquentModel $tenant;
    private UserEloquentModel $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->middleware = new TenantContextMiddleware();
        
        $this->tenant = TenantEloquentModel::create([
            'name' => 'Test Company',
            'slug' => 'test-company',
            'domain' => 'test-company.com',
            'status' => 'active',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addYear()
        ]);

        $this->user = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => Hash::make('password123'),
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_identifies_tenant_from_subdomain()
    {
        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            $tenant = $req->attributes->get('tenant');
            $this->assertInstanceOf(TenantEloquentModel::class, $tenant);
            $this->assertEquals('test-company', $tenant->slug);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_identifies_tenant_from_custom_domain()
    {
        $request = Request::create('https://test-company.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.com');

        $next = function ($req) {
            $tenant = $req->attributes->get('tenant');
            $this->assertInstanceOf(TenantEloquentModel::class, $tenant);
            $this->assertEquals('test-company.com', $tenant->domain);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_identifies_tenant_from_path_parameter()
    {
        $request = Request::create('/api/tenant/test-company/test');

        $next = function ($req) {
            $tenant = $req->attributes->get('tenant');
            $this->assertInstanceOf(TenantEloquentModel::class, $tenant);
            $this->assertEquals('test-company', $tenant->slug);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_rejects_request_for_nonexistent_tenant()
    {
        $request = Request::create('https://nonexistent.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'nonexistent.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(404, $result->getStatusCode());
        
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Tenant not found', $response['message']);
    }

    /** @test */
    public function it_rejects_request_for_inactive_tenant()
    {
        $this->tenant->update(['status' => 'inactive']);

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(403, $result->getStatusCode());
        
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Tenant is not active', $response['message']);
    }

    /** @test */
    public function it_rejects_request_for_expired_subscription()
    {
        $this->tenant->update([
            'subscription_status' => 'expired',
            'subscription_ends_at' => now()->subDays(1)
        ]);

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(403, $result->getStatusCode());
        
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Subscription has expired', $response['message']);
    }

    /** @test */
    public function it_allows_trial_tenant_within_trial_period()
    {
        $this->tenant->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(7)
        ]);

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_rejects_expired_trial_tenant()
    {
        $this->tenant->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->subDays(1)
        ]);

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(403, $result->getStatusCode());
        
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Trial period has expired', $response['message']);
    }

    /** @test */
    public function it_enforces_tenant_scoped_authentication()
    {
        Sanctum::actingAs($this->user, [], 'tenant');

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            $tenant = $req->attributes->get('tenant');
            $user = auth('tenant')->user();
            
            // Verify user belongs to the tenant
            $this->assertEquals($tenant->id, $user->tenant_id);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_rejects_user_from_different_tenant()
    {
        // Create another tenant and user
        $otherTenant = TenantEloquentModel::create([
            'name' => 'Other Company',
            'slug' => 'other-company',
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        $otherUser = UserEloquentModel::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other User',
            'email' => 'other@test.com',
            'password' => Hash::make('password123'),
            'status' => 'active'
        ]);

        // Try to authenticate other user for our tenant
        Sanctum::actingAs($otherUser, [], 'tenant');

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(403, $result->getStatusCode());
        
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('User does not belong to this tenant', $response['message']);
    }

    /** @test */
    public function it_sets_tenant_context_in_application()
    {
        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            // Verify tenant context is available globally
            $tenant = app('tenant.current');
            $this->assertInstanceOf(TenantEloquentModel::class, $tenant);
            $this->assertEquals('test-company', $tenant->slug);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_handles_suspended_tenant()
    {
        $this->tenant->update(['status' => 'suspended']);

        $request = Request::create('https://test-company.canvastencil.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.canvastencil.com');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(403, $result->getStatusCode());
        
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Tenant is suspended', $response['message']);
    }

    /** @test */
    public function it_prioritizes_custom_domain_over_subdomain()
    {
        $request = Request::create('https://test-company.com/api/test');
        $request->server->set('HTTP_HOST', 'test-company.com');

        $next = function ($req) {
            $tenant = $req->attributes->get('tenant');
            $this->assertEquals('test-company.com', $tenant->domain);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_handles_www_prefix_in_custom_domain()
    {
        $this->tenant->update(['domain' => 'www.test-company.com']);

        $request = Request::create('https://www.test-company.com/api/test');
        $request->server->set('HTTP_HOST', 'www.test-company.com');

        $next = function ($req) {
            $tenant = $req->attributes->get('tenant');
            $this->assertEquals('www.test-company.com', $tenant->domain);
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);
        $this->assertEquals(200, $result->getStatusCode());
    }
}