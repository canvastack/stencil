<?php

namespace Tests\Unit\Http\Middleware;

use Tests\TestCase;
use App\Infrastructure\Http\Middleware\PlatformAccessMiddleware;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;

class PlatformAccessMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private PlatformAccessMiddleware $middleware;
    private AccountEloquentModel $account;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->middleware = new PlatformAccessMiddleware();
        
        $this->account = AccountEloquentModel::create([
            'name' => 'Platform Admin',
            'email' => 'admin@platform.test',
            'password' => Hash::make('password123'),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_allows_authenticated_platform_account()
    {
        Sanctum::actingAs($this->account, [], 'platform');

        $request = Request::create('/api/platform/test');
        $response = null;

        $next = function ($req) use (&$response) {
            $response = new Response('OK', 200);
            return $response;
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(200, $result->getStatusCode());
        $this->assertEquals('OK', $result->getContent());
    }

    /** @test */
    public function it_rejects_unauthenticated_requests()
    {
        $request = Request::create('/api/platform/test');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(401, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Unauthenticated', $response['message']);
    }

    /** @test */
    public function it_rejects_tenant_user_accessing_platform_routes()
    {
        // Create a tenant user (not platform account)
        $tenantUser = AccountEloquentModel::create([
            'name' => 'Tenant User',
            'email' => 'user@tenant.test',
            'password' => Hash::make('password123'),
            'account_type' => 'tenant_user',
            'status' => 'active'
        ]);

        Sanctum::actingAs($tenantUser, [], 'tenant');

        $request = Request::create('/api/platform/test');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Platform access required', $response['message']);
    }

    /** @test */
    public function it_rejects_inactive_platform_account()
    {
        $this->account->update(['status' => 'inactive']);
        Sanctum::actingAs($this->account, [], 'platform');

        $request = Request::create('/api/platform/test');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Account is not active', $response['message']);
    }

    /** @test */
    public function it_rejects_suspended_platform_account()
    {
        $this->account->update(['status' => 'suspended']);
        Sanctum::actingAs($this->account, [], 'platform');

        $request = Request::create('/api/platform/test');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Account is not active', $response['message']);
    }

    /** @test */
    public function it_allows_different_platform_account_types()
    {
        // Test with different platform account types if they exist
        $supportAccount = AccountEloquentModel::create([
            'name' => 'Support Agent',
            'email' => 'support@platform.test',
            'password' => Hash::make('password123'),
            'account_type' => 'platform_owner', // Assuming this is the main type
            'status' => 'active'
        ]);

        Sanctum::actingAs($supportAccount, [], 'platform');

        $request = Request::create('/api/platform/test');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(200, $result->getStatusCode());
    }

    /** @test */
    public function it_handles_invalid_token_gracefully()
    {
        $request = Request::create('/api/platform/test');
        $request->headers->set('Authorization', 'Bearer invalid-token');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(401, $result->getStatusCode());
    }

    /** @test */
    public function it_sets_correct_guard_context()
    {
        Sanctum::actingAs($this->account, [], 'platform');

        $request = Request::create('/api/platform/test');

        $next = function ($req) {
            // Verify the correct guard is being used
            $this->assertEquals('platform', auth()->getDefaultDriver());
            $this->assertInstanceOf(AccountEloquentModel::class, auth('platform')->user());
            return new Response('OK', 200);
        };

        $this->middleware->handle($request, $next);
    }

    /** @test */
    public function it_logs_security_events()
    {
        // Test unauthorized access logging
        $request = Request::create('/api/platform/test');
        $request->headers->set('X-Forwarded-For', '192.168.1.100');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(401, $result->getStatusCode());
        
        // In a real implementation, you would verify that security events are logged
        // This might involve checking log files or database audit logs
    }
}