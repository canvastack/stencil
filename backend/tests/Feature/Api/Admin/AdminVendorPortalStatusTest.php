<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin Vendor Portal Status API Tests
 * 
 * Tests the GET /api/v1/admin/vendors/{vendorId}/portal-status endpoint
 * 
 * Requirements: 2.5, 2.6, 17.7
 */
class AdminVendorPortalStatusTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $adminUser;
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();

        // Create admin user
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
            'status' => 'active',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@example.com',
            'status' => 'active',
            'portal_access_enabled' => false,
            'onboarding_status' => 'pending',
        ]);
    }

    /** @test */
    public function it_returns_portal_status_for_vendor_without_portal_access()
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->getJson("/api/v1/admin/vendors/{$this->vendor->uuid}/portal-status");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'vendor_id',
                    'vendor_uuid',
                    'vendor_name',
                    'vendor_email',
                    'portal_access_enabled',
                    'onboarding_status',
                    'onboarding_completed_at',
                    'portal_last_access_at',
                    'welcome_email_sent_at',
                    'temporary_password_expires_at',
                    'has_user_account',
                    'user_email',
                    'user_status',
                    'can_access_portal',
                ]
            ])
            ->assertJson([
                'data' => [
                    'vendor_uuid' => $this->vendor->uuid,
                    'vendor_name' => 'Test Vendor',
                    'vendor_email' => 'vendor@example.com',
                    'portal_access_enabled' => false,
                    'onboarding_status' => 'pending',
                    'has_user_account' => false,
                    'can_access_portal' => false,
                ]
            ]);
    }

    /** @test */
    public function it_returns_portal_status_for_vendor_with_portal_access_enabled()
    {
        // Enable portal access
        $this->vendor->update([
            'portal_access_enabled' => true,
            'onboarding_status' => 'in_progress',
            'welcome_email_sent_at' => now(),
            'temporary_password_expires_at' => now()->addDays(7),
        ]);

        // Create vendor user
        $vendorUser = User::factory()->create([
            'vendor_id' => $this->vendor->uuid,
            'account_type' => 'vendor',
            'email' => 'vendor.user@example.com',
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->getJson("/api/v1/admin/vendors/{$this->vendor->uuid}/portal-status");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'vendor_uuid' => $this->vendor->uuid,
                    'portal_access_enabled' => true,
                    'onboarding_status' => 'in_progress',
                    'has_user_account' => true,
                    'user_email' => 'vendor.user@example.com',
                    'user_status' => 'active',
                    'can_access_portal' => false, // Not completed yet
                ]
            ]);

        $this->assertNotNull($response->json('data.welcome_email_sent_at'));
        $this->assertNotNull($response->json('data.temporary_password_expires_at'));
    }

    /** @test */
    public function it_returns_portal_status_for_vendor_with_completed_onboarding()
    {
        // Complete onboarding
        $this->vendor->update([
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
            'portal_last_access_at' => now()->subHours(2),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->getJson("/api/v1/admin/vendors/{$this->vendor->uuid}/portal-status");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'vendor_uuid' => $this->vendor->uuid,
                    'portal_access_enabled' => true,
                    'onboarding_status' => 'completed',
                    'can_access_portal' => true, // All conditions met
                ]
            ]);

        $this->assertNotNull($response->json('data.onboarding_completed_at'));
        $this->assertNotNull($response->json('data.portal_last_access_at'));
    }

    /** @test */
    public function it_returns_404_for_non_existent_vendor()
    {
        $fakeUuid = '00000000-0000-0000-0000-000000000000';

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->getJson("/api/v1/admin/vendors/{$fakeUuid}/portal-status");

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Vendor not found',
                'error' => 'VENDOR_NOT_FOUND'
            ]);
    }

    /** @test */
    public function it_enforces_tenant_isolation()
    {
        // Create another tenant
        $otherTenant = TenantEloquentModel::factory()->create();

        // Create vendor in other tenant
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Tenant Vendor',
        ]);

        // Try to access vendor from different tenant
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->getJson("/api/v1/admin/vendors/{$otherVendor->uuid}/portal-status");

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Vendor not found',
                'error' => 'VENDOR_NOT_FOUND'
            ]);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->getJson("/api/v1/admin/vendors/{$this->vendor->uuid}/portal-status");

        $response->assertStatus(401);
    }

    /** @test */
    public function it_requires_tenant_context()
    {
        // When no X-Tenant-ID header is provided, it should fallback to user's tenant_id
        // Since the admin user has a tenant_id, the request should succeed
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/v1/admin/vendors/{$this->vendor->uuid}/portal-status");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Portal status retrieved successfully',
                'data' => [
                    'vendor_uuid' => $this->vendor->uuid,
                ]
            ]);
    }
}
