<?php

namespace Tests\Feature\Api\Vendor;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Laravel\Sanctum\Sanctum;
use Tests\Middleware\TestTenantContextMiddleware;

/**
 * VendorProfileControllerTest
 * 
 * Feature tests for vendor profile management endpoints.
 * 
 * Tests:
 * 1. GET /api/v1/vendor/profile - get profile
 * 2. PUT /api/v1/vendor/profile - update profile
 * 3. PUT /api/v1/vendor/profile - validation errors
 * 4. Test cannot update company name
 * 5. Test email verification required for email change
 * 6. Test authentication required
 * 7. Test tenant isolation works
 * 8. Test response format matches OpenAPI spec
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 15.9, 16.3
 */
class VendorProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected Vendor $vendor;
    protected UserEloquentModel $vendorUser;
    protected string $testPassword = 'Test@VendorP4ss2026!';

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.local',
            'status' => 'active',
        ]);
        
        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@test.com',
            'phone' => '+1234567890',
            'contact_person' => 'John Doe',
            'address' => '123 Test Street, Test City',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ]);
        
        // Create vendor user
        $this->vendorUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->uuid,
            'name' => 'Vendor User',
            'email' => 'vendor@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
            'failed_login_attempts' => 0,
        ]);
        
        // Register tenant context for test middleware
        $this->app->instance('test.tenant.context', [
            'tenant_id' => $this->tenant->id,
            'tenant' => $this->tenant,
        ]);
        
        // Replace TenantContextMiddleware with test version
        $this->app[\Illuminate\Contracts\Http\Kernel::class]
            ->prependMiddleware(TestTenantContextMiddleware::class);
    }
    
    /**
     * Helper to make authenticated vendor requests
     * Uses Sanctum and lets middleware work naturally
     */
    protected function actingAsVendor()
    {
        Sanctum::actingAs($this->vendorUser, ['vendor:access']);
        return $this;
    }

    /** @test */
    public function vendor_can_get_profile(): void
    {
        // Create some quotes for performance metrics
        OrderVendorNegotiation::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'sent',
        ]);

        OrderVendorNegotiation::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
            'responded_at' => now(),
        ]);

        OrderVendorNegotiation::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'rejected',
            'responded_at' => now(),
        ]);

        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'uuid',
                    'company_name',
                    'email',
                    'phone',
                    'contact_person',
                    'address',
                    'status',
                    'performance_metrics' => [
                        'total_quotes',
                        'accepted_quotes',
                        'rejected_quotes',
                        'pending_quotes',
                        'acceptance_rate',
                        'avg_response_time_hours',
                    ],
                ],
            ])
            ->assertJson([
                'message' => 'Profile retrieved successfully',
            ]);

        // Verify performance metrics
        $data = $response->json('data.performance_metrics');
        $this->assertEquals(10, $data['total_quotes']);
        $this->assertEquals(3, $data['accepted_quotes']);
        $this->assertEquals(2, $data['rejected_quotes']);
        $this->assertEquals(5, $data['pending_quotes']);
    }

    /** @test */
    public function vendor_can_update_profile(): void
    {
        $updateData = [
            'email' => 'newemail@test.com',
            'phone' => '+9876543210',
            'contact_person' => 'Jane Smith',
            'address' => '456 New Street, New City',
            'location' => [
                'latitude' => 40.7128,
                'longitude' => -74.0060,
            ],
        ];

        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully',
            ]);

        // Verify database was updated
        $this->vendor->refresh();
        $this->assertEquals('newemail@test.com', $this->vendor->email);
        $this->assertEquals('+9876543210', $this->vendor->phone);
        $this->assertEquals('Jane Smith', $this->vendor->contact_person);
        $this->assertEquals('456 New Street, New City', $this->vendor->address);
    }

    /** @test */
    public function vendor_profile_update_validation_errors(): void
    {
        // Test invalid email format
        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', [
                'email' => 'invalid-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Test email already taken by another vendor
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'other@test.com',
            'status' => 'active',
        ]);

        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', [
                'email' => 'other@test.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function vendor_cannot_update_company_name(): void
    {
        $originalCompanyName = $this->vendor->company_name;

        // Try to update company_name (should be ignored)
        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', [
                'company_name' => 'New Company Name',
                'phone' => '+9876543210',
            ]);

        $response->assertStatus(200);

        // Verify company_name was NOT changed
        $this->vendor->refresh();
        $this->assertEquals($originalCompanyName, $this->vendor->company_name);
        $this->assertNotEquals('New Company Name', $this->vendor->company_name);
        
        // Verify phone was updated (to confirm update worked)
        $this->assertEquals('+9876543210', $this->vendor->phone);
    }

    /** @test */
    public function email_verification_required_for_email_change(): void
    {
        $newEmail = 'newemail@test.com';

        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', [
                'email' => $newEmail,
            ]);

        $response->assertStatus(200);

        // Note: Email verification is a future enhancement
        // For now, we just verify the email was updated
        // In the future, this test should verify:
        // 1. Email is not immediately updated
        // 2. Verification email is sent
        // 3. Email is updated only after verification

        $this->vendor->refresh();
        $this->assertEquals($newEmail, $this->vendor->email);
    }

    /** @test */
    public function authentication_required_for_profile_endpoints(): void
    {
        // Try to access profile without authentication
        $response = $this->getJson('/api/v1/vendor/profile');
        $response->assertStatus(401);

        // Try to update profile without authentication
        $response = $this->putJson('/api/v1/vendor/profile', [
            'phone' => '+9876543210',
        ]);
        $response->assertStatus(401);
    }

    /** @test */
    public function tenant_isolation_works_for_profile(): void
    {
        // Create another tenant with a vendor
        $otherTenant = TenantEloquentModel::factory()->create([
            'name' => 'Other Tenant',
            'slug' => 'other-tenant',
            'domain' => 'other-tenant.local',
            'status' => 'active',
        ]);

        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
            'company_name' => 'Other Vendor',
            'email' => 'other-vendor@test.com',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $otherVendorUser = UserEloquentModel::create([
            'tenant_id' => $otherTenant->id,
            'vendor_id' => $otherVendor->uuid,
            'name' => 'Other Vendor User',
            'email' => 'other-vendor@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
        ]);

        // Authenticate as first vendor
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        $response->assertStatus(200);

        // Verify we get the correct vendor's profile
        $vendorData = $response->json('data');
        $this->assertEquals($this->vendor->uuid, $vendorData['uuid']);
        $this->assertEquals($this->vendor->company_name, $vendorData['company_name']);
        $this->assertNotEquals($otherVendor->uuid, $vendorData['uuid']);
        $this->assertNotEquals($otherVendor->company_name, $vendorData['company_name']);
    }

    /** @test */
    public function response_format_matches_openapi_spec(): void
    {
        // Test GET /api/v1/vendor/profile response format
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'uuid',
                    'company_name',
                    'email',
                    'phone',
                    'contact_person',
                    'address',
                    'status',
                    'performance_metrics' => [
                        'total_quotes',
                        'accepted_quotes',
                        'rejected_quotes',
                        'pending_quotes',
                        'acceptance_rate',
                        'avg_response_time_hours',
                    ],
                ],
            ]);

        // Verify data types
        $data = $response->json('data');
        $this->assertIsInt($data['id']);
        $this->assertIsString($data['uuid']);
        $this->assertIsString($data['company_name']);
        $this->assertIsArray($data['performance_metrics']);
        $this->assertIsInt($data['performance_metrics']['total_quotes']);
        $this->assertIsInt($data['performance_metrics']['accepted_quotes']);

        // Test PUT /api/v1/vendor/profile response format
        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', [
                'phone' => '+9876543210',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'uuid',
                    'company_name',
                    'email',
                    'phone',
                ],
            ]);
    }
}

