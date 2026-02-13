<?php

namespace Tests\Unit\Http\Middleware;

use Tests\TestCase;
use App\Http\Middleware\VendorAuthMiddleware;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * VendorAuthMiddleware Test
 * 
 * Tests vendor authentication middleware functionality.
 * Requirements: 1.6, 1.8, 15.11
 * 
 * Task: 5.5.5.1 Create VendorAuthMiddlewareTest
 * - Test valid token allows access
 * - Test invalid token returns 401
 * - Test expired token returns 401
 * - Test non-vendor account type returns 403
 * - Test portal access disabled returns 403
 * - Test onboarding not completed returns 403
 * - Test inactive vendor returns 403
 * - Test last activity timestamp is updated
 */
class VendorAuthMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    private VendorAuthMiddleware $middleware;
    private TenantEloquentModel $tenant;
    private Vendor $vendor;
    private UserEloquentModel $vendorUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->middleware = new VendorAuthMiddleware();
        
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

    /** @test */
    public function it_allows_authenticated_vendor_with_valid_token()
    {
        // Create token with vendor:access ability
        $token = $this->vendorUser->createToken('vendor-token', ['vendor:access']);
        Sanctum::actingAs($this->vendorUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes');
        $response = null;

        $next = function ($req) use (&$response) {
            $response = new Response('OK', 200);
            return $response;
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(200, $result->getStatusCode());
        $this->assertEquals('OK', $result->getContent());
        
        // Verify vendor and vendor_user are added to request
        $this->assertNotNull($request->get('vendor'));
        $this->assertNotNull($request->get('vendor_user'));
    }

    /** @test */
    public function it_rejects_unauthenticated_requests()
    {
        $request = Request::create('/api/v1/vendor/quotes');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(401, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Unauthenticated. Please login to access vendor portal.', $response['message']);
        $this->assertEquals('UNAUTHENTICATED', $response['error']);
    }

    /** @test */
    public function it_rejects_invalid_token()
    {
        $request = Request::create('/api/v1/vendor/quotes');
        $request->headers->set('Authorization', 'Bearer invalid-token-12345');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(401, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Unauthenticated. Please login to access vendor portal.', $response['message']);
    }

    /** @test */
    public function it_rejects_expired_token()
    {
        // Create an expired token
        $token = $this->vendorUser->createToken('vendor-token', ['vendor:access']);
        
        // Manually expire the token by updating the database
        PersonalAccessToken::where('tokenable_id', $this->vendorUser->id)
            ->update(['expires_at' => now()->subDay()]);
        
        // Try to use the expired token
        $request = Request::create('/api/v1/vendor/quotes');
        $request->headers->set('Authorization', 'Bearer ' . $token->plainTextToken);

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(401, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Unauthenticated. Please login to access vendor portal.', $response['message']);
    }

    /** @test */
    public function it_rejects_non_vendor_account_type()
    {
        // Create a tenant user (not vendor)
        $tenantUser = UserEloquentModel::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
            'name' => 'Tenant User',
            'email' => 'tenant@test.com',
            'password' => Hash::make('password123'),
            'status' => 'active',
        ]);

        Sanctum::actingAs($tenantUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Access denied. This endpoint is only accessible to vendor accounts.', $response['message']);
        $this->assertEquals('FORBIDDEN_ACCOUNT_TYPE', $response['error']);
    }

    /** @test */
    public function it_rejects_when_portal_access_is_disabled()
    {
        // Disable portal access
        $this->vendor->update(['portal_access_enabled' => false]);

        Sanctum::actingAs($this->vendorUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Portal access is disabled for your account. Please contact support.', $response['message']);
        $this->assertEquals('PORTAL_ACCESS_DISABLED', $response['error']);
    }

    /** @test */
    public function it_rejects_when_onboarding_is_not_completed()
    {
        // Set onboarding status to in_progress
        $this->vendor->update([
            'onboarding_status' => 'in_progress',
            'onboarding_completed_at' => null,
        ]);

        Sanctum::actingAs($this->vendorUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Please complete your onboarding process first.', $response['message']);
        $this->assertEquals('ONBOARDING_INCOMPLETE', $response['error']);
        $this->assertEquals('in_progress', $response['onboarding_status']);
    }

    /** @test */
    public function it_rejects_when_vendor_is_inactive()
    {
        // Set vendor status to inactive
        $this->vendor->update(['status' => 'inactive']);

        Sanctum::actingAs($this->vendorUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(403, $result->getStatusCode());
        $response = json_decode($result->getContent(), true);
        $this->assertEquals('Your vendor account is not active. Please contact support.', $response['message']);
        $this->assertEquals('VENDOR_INACTIVE', $response['error']);
    }

    /** @test */
    public function it_updates_last_activity_timestamp()
    {
        // Record the initial last_login_at
        $initialLastLogin = $this->vendorUser->last_login_at;

        // Wait a moment to ensure timestamp difference
        sleep(1);

        Sanctum::actingAs($this->vendorUser, ['vendor:access'], 'sanctum');

        $request = Request::create('/api/v1/vendor/quotes');

        $next = function ($req) {
            return new Response('OK', 200);
        };

        $result = $this->middleware->handle($request, $next);

        $this->assertEquals(200, $result->getStatusCode());

        // Refresh the user from database
        $this->vendorUser->refresh();

        // Verify last_login_at was updated
        $this->assertNotNull($this->vendorUser->last_login_at);
        if ($initialLastLogin) {
            $this->assertNotEquals($initialLastLogin, $this->vendorUser->last_login_at);
        }
        $this->assertTrue($this->vendorUser->last_login_at->isToday());
    }
}
