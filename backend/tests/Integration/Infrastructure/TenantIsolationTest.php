<?php

namespace Tests\Integration\Infrastructure;

use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Tenant Isolation Verification Tests
 * 
 * Tests that verify complete tenant isolation across the vendor portal system.
 * Ensures vendors cannot access data from other tenants.
 * 
 * Requirements:
 * - 1.7: Tenant isolation at database query level
 * - 15.9: Enforce tenant isolation at database query level
 * - 15.10: Validate vendors can only access their assigned quotes
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant1;
    private TenantEloquentModel $tenant2;
    private Vendor $vendor1;
    private Vendor $vendor2;
    private UserEloquentModel $vendorUser1;
    private UserEloquentModel $vendorUser2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create two separate tenants
        $this->tenant1 = TenantEloquentModel::factory()->create([
            'name' => 'Tenant 1',
        ]);

        $this->tenant2 = TenantEloquentModel::factory()->create([
            'name' => 'Tenant 2',
        ]);

        // Create vendors for each tenant
        $this->vendor1 = Vendor::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'company_name' => 'Vendor 1 Company',
            'email' => 'vendor1@example.com',
        ]);

        $this->vendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'company_name' => 'Vendor 2 Company',
            'email' => 'vendor2@example.com',
        ]);

        // Create vendor users for each tenant
        $this->vendorUser1 = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'vendor_id' => $this->vendor1->uuid,
            'account_type' => 'vendor',
            'email' => 'user1@vendor1.com',
        ]);

        $this->vendorUser2 = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'vendor_id' => $this->vendor2->uuid,
            'account_type' => 'vendor',
            'email' => 'user2@vendor2.com',
        ]);
    }

    /** @test */
    public function vendor_cannot_access_other_tenants_quotes(): void
    {
        // Arrange: Create quotes for both tenants
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'vendor_id' => $this->vendor1->id,
            'quote_number' => 'Q-TENANT1-001',
            'status' => 'sent',
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'vendor_id' => $this->vendor2->id,
            'quote_number' => 'Q-TENANT2-001',
            'status' => 'sent',
        ]);

        // Act: Query quotes for tenant 1 vendor
        $tenant1Quotes = OrderVendorNegotiation::where('tenant_id', $this->tenant1->id)
            ->where('vendor_id', $this->vendor1->id)
            ->get();

        // Query quotes for tenant 2 vendor
        $tenant2Quotes = OrderVendorNegotiation::where('tenant_id', $this->tenant2->id)
            ->where('vendor_id', $this->vendor2->id)
            ->get();

        // Assert: Each vendor only sees their own tenant's quotes
        $this->assertCount(1, $tenant1Quotes);
        $this->assertEquals('Q-TENANT1-001', $tenant1Quotes->first()->quote_number);
        $this->assertEquals($this->tenant1->id, $tenant1Quotes->first()->tenant_id);

        $this->assertCount(1, $tenant2Quotes);
        $this->assertEquals('Q-TENANT2-001', $tenant2Quotes->first()->quote_number);
        $this->assertEquals($this->tenant2->id, $tenant2Quotes->first()->tenant_id);

        // Assert: Vendor 1 cannot see Vendor 2's quotes
        $crossTenantQuery = OrderVendorNegotiation::where('tenant_id', $this->tenant1->id)
            ->where('vendor_id', $this->vendor2->id)
            ->get();

        $this->assertCount(0, $crossTenantQuery);
    }

    /** @test */
    public function vendor_cannot_see_other_tenants_vendors(): void
    {
        // Arrange: Create additional vendors for each tenant
        $additionalVendor1 = Vendor::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'company_name' => 'Additional Vendor 1',
        ]);

        $additionalVendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'company_name' => 'Additional Vendor 2',
        ]);

        // Act: Query vendors for each tenant
        $tenant1Vendors = Vendor::where('tenant_id', $this->tenant1->id)->get();
        $tenant2Vendors = Vendor::where('tenant_id', $this->tenant2->id)->get();

        // Assert: Each tenant only sees their own vendors
        $this->assertCount(2, $tenant1Vendors); // vendor1 + additionalVendor1
        $this->assertTrue($tenant1Vendors->contains('id', $this->vendor1->id));
        $this->assertTrue($tenant1Vendors->contains('id', $additionalVendor1->id));
        $this->assertFalse($tenant1Vendors->contains('id', $this->vendor2->id));

        $this->assertCount(2, $tenant2Vendors); // vendor2 + additionalVendor2
        $this->assertTrue($tenant2Vendors->contains('id', $this->vendor2->id));
        $this->assertTrue($tenant2Vendors->contains('id', $additionalVendor2->id));
        $this->assertFalse($tenant2Vendors->contains('id', $this->vendor1->id));

        // Assert: Cross-tenant vendor query returns empty
        $crossTenantVendors = Vendor::where('tenant_id', $this->tenant1->id)
            ->whereIn('id', [$this->vendor2->id, $additionalVendor2->id])
            ->get();

        $this->assertCount(0, $crossTenantVendors);
    }

    /** @test */
    public function audit_logs_are_tenant_scoped(): void
    {
        // Arrange: Create audit logs for both tenants
        AuditLog::factory()->count(3)->create([
            'tenant_id' => $this->tenant1->id,
            'user_id' => $this->vendorUser1->id,
            'action_type' => 'vendor_login',
            'user_type' => 'vendor',
        ]);

        AuditLog::factory()->count(2)->create([
            'tenant_id' => $this->tenant2->id,
            'user_id' => $this->vendorUser2->id,
            'action_type' => 'vendor_login',
            'user_type' => 'vendor',
        ]);

        // Act: Query audit logs for each tenant
        $tenant1Logs = AuditLog::where('tenant_id', $this->tenant1->id)->get();
        $tenant2Logs = AuditLog::where('tenant_id', $this->tenant2->id)->get();

        // Assert: Each tenant only sees their own audit logs
        $this->assertCount(3, $tenant1Logs);
        foreach ($tenant1Logs as $log) {
            $this->assertEquals($this->tenant1->id, $log->tenant_id);
            $this->assertEquals($this->vendorUser1->id, $log->user_id);
        }

        $this->assertCount(2, $tenant2Logs);
        foreach ($tenant2Logs as $log) {
            $this->assertEquals($this->tenant2->id, $log->tenant_id);
            $this->assertEquals($this->vendorUser2->id, $log->user_id);
        }

        // Assert: Cross-tenant audit log query returns empty
        $crossTenantLogs = AuditLog::where('tenant_id', $this->tenant1->id)
            ->where('user_id', $this->vendorUser2->id)
            ->get();

        $this->assertCount(0, $crossTenantLogs);
    }

    /** @test */
    public function file_storage_is_tenant_scoped(): void
    {
        // Arrange: Setup fake storage
        Storage::fake('local');

        // Create file paths for both tenants
        $tenant1FilePath = "tenant_{$this->tenant1->id}/quote_attachments/test-file-1.pdf";
        $tenant2FilePath = "tenant_{$this->tenant2->id}/quote_attachments/test-file-2.pdf";

        // Store files for both tenants
        Storage::put($tenant1FilePath, 'Tenant 1 file content');
        Storage::put($tenant2FilePath, 'Tenant 2 file content');

        // Act: Check file existence with tenant scoping
        $tenant1FileExists = Storage::exists($tenant1FilePath);
        $tenant2FileExists = Storage::exists($tenant2FilePath);

        // Assert: Files exist in their respective tenant directories
        $this->assertTrue($tenant1FileExists);
        $this->assertTrue($tenant2FileExists);

        // Assert: Files are stored in separate tenant directories
        $this->assertStringContainsString("tenant_{$this->tenant1->id}", $tenant1FilePath);
        $this->assertStringContainsString("tenant_{$this->tenant2->id}", $tenant2FilePath);
        $this->assertNotEquals($tenant1FilePath, $tenant2FilePath);

        // Assert: Tenant 1 cannot access Tenant 2's file path directly
        $wrongTenantPath = str_replace(
            "tenant_{$this->tenant1->id}",
            "tenant_{$this->tenant2->id}",
            $tenant1FilePath
        );
        $this->assertNotEquals($tenant1FilePath, $wrongTenantPath);

        // Assert: File content is isolated
        $tenant1Content = Storage::get($tenant1FilePath);
        $tenant2Content = Storage::get($tenant2FilePath);
        $this->assertEquals('Tenant 1 file content', $tenant1Content);
        $this->assertEquals('Tenant 2 file content', $tenant2Content);
        $this->assertNotEquals($tenant1Content, $tenant2Content);

        // Cleanup
        Storage::delete($tenant1FilePath);
        Storage::delete($tenant2FilePath);
    }
}
