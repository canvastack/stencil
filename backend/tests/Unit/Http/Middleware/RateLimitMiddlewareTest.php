<?php

namespace Tests\Unit\Http\Middleware;

use Tests\TestCase;
use App\Http\Middleware\VendorRateLimitMiddleware;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Laravel\Sanctum\Sanctum;

/**
 * RateLimitMiddleware Test
 * 
 * Tests vendor rate limiting middleware functionality.
 * Requirements: 1.5, 3.6, 15.5
 * 
 * Task: 5.5.5.2 Create RateLimitMiddlewareTest
 * - Test login rate limiting (5 per 15 min)
 * - Test API rate limiting (60 per min)
 */
class RateLimitMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private VendorRateLimitMiddleware $middleware;
    private TenantEloquentModel $tenant;
    private Vendor $vendor;
    private UserEloquentModel $vendorUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->middleware = new VendorRateLimitMiddleware();
        
        // Clear all rate limiters before each test
        RateLimiter::clear('vendor-login:127.0.0.1');
        RateLimiter::clear('vendor-api:1');
        
        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();
        
        // Create vendor with portal access enabled and onboarding completed
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ]);
        
        // Create vendor user
        $this->vendorUser = UserEloquentModel::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->uuid,
            'account_type' => 'vendor',
            'name' => 'Vendor User',
            'email' => 'vendor@test.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);
    }

    protected function tearDown(): void
    {
        // Clear rate limiters after each test
        RateLimiter::clear('vendor-login:127.0.0.1');
        RateLimiter::clear('vendor-api:' . $this->vendorUser->id);
        
        parent::tearDown();
    }

    /** @test */
    public function it_enforces_login_rate_limit_of_5_attempts_per_15_minutes()
    {
        $request = Request::create('/api/v1/vendor/auth/login', 'POST');
        $request->server->set('REMOTE_ADDR', '127.0.0.1');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        // First 5 attempts should succeed
        for ($i = 1; $i <= 5; $i++) {
            $result = $this->middleware->handle($request, $next, 'login');
            
            $this->assertEquals(200, $result->getStatusCode(), "Attempt {$i} should succeed");
            $this->assertEquals('OK', $result->getContent());
            
            // Verify rate limit headers are present
            $this->assertTrue($result->headers->has('X-RateLimit-Limit'));
            $this->assertTrue($result->headers->has('X-RateLimit-Remaining'));
            $this->assertEquals(5, $result->headers->get('X-RateLimit-Limit'));
            $this->assertEquals(5 - $i, $result->headers->get('X-RateLimit-Remaining'));
        }

        // 6th attempt should be rate limited
        $result = $this->middleware->handle($request, $next, 'login');
        
        $this->assertEquals(429, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Too many requests. Please try again later.', $response['message']);
        $this->assertEquals('Rate limit exceeded', $response['error']);
        $this->assertArrayHasKey('retry_after', $response);
        $this->assertTrue($result->headers->has('Retry-After'));
    }

    /** @test */
    public function it_enforces_api_rate_limit_of_60_requests_per_minute()
    {
        Sanctum::actingAs($this->vendorUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes', 'GET');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        // First 60 requests should succeed
        for ($i = 1; $i <= 60; $i++) {
            $result = $this->middleware->handle($request, $next, 'api');
            
            $this->assertEquals(200, $result->getStatusCode(), "Request {$i} should succeed");
            $this->assertEquals('OK', $result->getContent());
            
            // Verify rate limit headers are present
            $this->assertTrue($result->headers->has('X-RateLimit-Limit'));
            $this->assertTrue($result->headers->has('X-RateLimit-Remaining'));
            $this->assertEquals(60, $result->headers->get('X-RateLimit-Limit'));
            $this->assertEquals(60 - $i, $result->headers->get('X-RateLimit-Remaining'));
        }

        // 61st request should be rate limited
        $result = $this->middleware->handle($request, $next, 'api');
        
        $this->assertEquals(429, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Too many requests. Please try again later.', $response['message']);
        $this->assertEquals('Rate limit exceeded', $response['error']);
        $this->assertArrayHasKey('retry_after', $response);
        $this->assertTrue($result->headers->has('Retry-After'));
    }
}
