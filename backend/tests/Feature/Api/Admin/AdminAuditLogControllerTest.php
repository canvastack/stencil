<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Admin Audit Log Controller Feature Tests
 * 
 * Tests the admin audit log viewing and export functionality.
 * 
 * Requirements:
 * - 16.5: Display audit logs on admin vendor detail page
 * - 16.6: Filter audit logs by date range and action type
 * - 16.7: Retain audit logs for at least 2 years
 * - 16.8: Export audit logs to CSV format
 */
class AdminAuditLogControllerTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private UserEloquentModel $adminUser;
    private Vendor $vendor;
    private UserEloquentModel $vendorUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'domain' => 'test-tenant.localhost',
        ]);

        // Create admin user
        $this->adminUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
            'email' => 'admin@test.com',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Test Vendor',
            'email' => 'vendor@test.com',
            'status' => 'active',
        ]);

        // Create vendor user
        $this->vendorUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->uuid, // Use UUID instead of ID
            'account_type' => 'vendor',
            'email' => 'vendor@test.com',
        ]);
    }

    /** @test */
    public function it_returns_audit_logs_for_authenticated_admin(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs
        AuditLog::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'tenant_id',
                        'user_id',
                        'user_type',
                        'action_type',
                        'resource_type',
                        'resource_id',
                        'ip_address',
                        'user_agent',
                        'created_at',
                    ]
                ],
                'meta' => [
                    'total',
                    'page',
                    'per_page',
                    'last_page',
                    'filters',
                ]
            ]);

        $this->assertCount(5, $response->json('data'));
        $this->assertEquals(5, $response->json('meta.total'));
    }

    /** @test */
    public function it_filters_audit_logs_by_vendor_id(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create another vendor user
        $anotherVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $anotherVendorUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $anotherVendor->uuid, // Use UUID instead of ID
            'account_type' => 'vendor',
        ]);

        // Create audit logs for different vendors
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $anotherVendorUser->id,
            'user_type' => 'vendor',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs?vendor_id=' . $this->vendorUser->id, [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        $this->assertEquals(3, $response->json('meta.total'));
        
        // Verify all returned logs belong to the specified vendor
        foreach ($response->json('data') as $log) {
            $this->assertEquals($this->vendorUser->id, $log['user_id']);
        }
    }

    /** @test */
    public function it_filters_audit_logs_by_action_type(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs with different action types
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'quote.accepted',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs?action_type=vendor.login', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        
        // Verify all returned logs have the specified action type
        foreach ($response->json('data') as $log) {
            $this->assertEquals('vendor.login', $log['action_type']);
        }
    }

    /** @test */
    public function it_filters_audit_logs_by_date_range(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs with different dates
        AuditLog::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'created_at' => '2024-01-01 10:00:00',
        ]);

        AuditLog::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'created_at' => '2024-01-15 10:00:00',
        ]);

        AuditLog::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'created_at' => '2024-02-01 10:00:00',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs?date_from=2024-01-10&date_to=2024-01-20', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertStringContainsString('2024-01-15', $response->json('data.0.created_at'));
    }

    /** @test */
    public function it_filters_audit_logs_by_resource_type(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs with different resource types
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'resource_type' => 'quote',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'resource_type' => 'vendor_profile',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs?resource_type=quote', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        
        // Verify all returned logs have the specified resource type
        foreach ($response->json('data') as $log) {
            $this->assertEquals('quote', $log['resource_type']);
        }
    }

    /** @test */
    public function it_supports_pagination(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create 25 audit logs
        AuditLog::factory()->count(25)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
        ]);

        // Act - Get first page with 10 items
        $response = $this->getJson('/api/v1/admin/audit-logs?page=1&per_page=10', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(10, $response->json('data'));
        $this->assertEquals(25, $response->json('meta.total'));
        $this->assertEquals(1, $response->json('meta.page'));
        $this->assertEquals(10, $response->json('meta.per_page'));
        $this->assertEquals(3, $response->json('meta.last_page'));
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create another tenant
        $anotherTenant = TenantEloquentModel::factory()->create();

        // Create audit logs for different tenants
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $anotherTenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(3, $response->json('data'));
        
        // Verify all returned logs belong to the correct tenant
        foreach ($response->json('data') as $log) {
            $this->assertEquals($this->tenant->id, $log['tenant_id']);
        }
    }

    /** @test */
    public function it_requires_authentication(): void
    {
        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(401);
    }

    /** @test */
    public function it_validates_date_format(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs?date_from=invalid-date', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date_from']);
    }

    /** @test */
    public function it_returns_audit_log_statistics(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs with different action types
        AuditLog::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
        ]);

        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'quote.accepted',
        ]);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs/statistics', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'total_logs',
                    'top_actions',
                    'user_type_distribution',
                    'top_resources',
                    'date_range',
                ]
            ]);

        $this->assertEquals(8, $response->json('data.total_logs'));
    }

    /** @test */
    public function it_exports_audit_logs_to_csv(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
        ]);

        // Act
        $response = $this->get('/api/v1/admin/audit-logs/export', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition');
        
        // Verify CSV content
        $csv = $response->getContent();
        $this->assertStringContainsString('ID,Tenant ID,User ID,User Type,Action Type', $csv);
        $this->assertStringContainsString('vendor.login', $csv);
    }

    /** @test */
    public function it_exports_filtered_audit_logs_to_csv(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs with different action types
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'quote.accepted',
        ]);

        // Act
        $response = $this->get('/api/v1/admin/audit-logs/export?action_type=vendor.login', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        
        // Verify CSV content only contains filtered action type
        $csv = $response->getContent();
        $this->assertStringContainsString('vendor.login', $csv);
        $this->assertStringNotContainsString('quote.accepted', $csv);
    }

    /** @test */
    public function it_returns_empty_result_when_no_audit_logs_exist(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Act
        $response = $this->getJson('/api/v1/admin/audit-logs', [
            'X-Tenant-ID' => (string) $this->tenant->id,
        ]);

        // Assert
        $response->assertStatus(200);
        $this->assertCount(0, $response->json('data'));
        $this->assertEquals(0, $response->json('meta.total'));
    }

    /** @test */
    public function it_combines_multiple_filters(): void
    {
        // Arrange
        Sanctum::actingAs($this->adminUser, ['*']);

        // Create audit logs with different combinations
        AuditLog::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
            'resource_type' => 'vendor',
            'created_at' => '2024-01-15 10:00:00',
        ]);

        AuditLog::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'quote.accepted',
            'resource_type' => 'quote',
            'created_at' => '2024-01-15 10:00:00',
        ]);

        AuditLog::factory()->create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
            'resource_type' => 'vendor',
            'created_at' => '2024-02-01 10:00:00',
        ]);

        // Act - Filter by action_type, resource_type, and date_range
        $response = $this->getJson(
            '/api/v1/admin/audit-logs?action_type=vendor.login&resource_type=vendor&date_from=2024-01-10&date_to=2024-01-20',
            [
                'X-Tenant-ID' => (string) $this->tenant->id,
            ]
        );

        // Assert
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('vendor.login', $response->json('data.0.action_type'));
        $this->assertEquals('vendor', $response->json('data.0.resource_type'));
    }
}

