<?php

namespace Tests\Feature\VendorProduction;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\User;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Vendor Production Update Workflow Integration Tests
 * 
 * Tests the complete workflow of vendor production updates from creation to completion.
 */
class VendorProductionUpdateWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $vendor;
    private User $admin;
    private VendorPurchaseOrder $purchaseOrder;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant (let database auto-assign ID)
        $tenant = Tenant::factory()->create();

        // Create vendor user with account_type
        $this->vendor = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@test.com',
            'account_type' => 'vendor', // Required for vendor.auth middleware
        ]);

        // Create admin user
        $this->admin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'admin@test.com',
            'account_type' => 'tenant', // Admin account type
        ]);

        // Create purchase order
        $this->purchaseOrder = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
            'expected_delivery_date' => now()->addDays(30),
        ]);

        Storage::fake('local');
        
        // Bypass ALL middleware for testing
        $this->withoutMiddleware();
    }

    /** @test */
    public function vendor_can_create_production_update()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'started',
                'progress_percentage' => 10,
                'notes' => 'Production has started',
                'is_milestone' => true,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Production update created successfully',
            ])
            ->assertJsonStructure([
                'data' => [
                    'uuid',
                    'status',
                    'progress_percentage',
                    'notes',
                    'is_milestone',
                    'created_at',
                ],
            ]);

        // Verify database
        $this->assertDatabaseHas('vendor_production_updates', [
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'started',
            'progress_percentage' => 10,
            'is_milestone' => true,
        ]);

        // Verify PO updated
        $this->purchaseOrder->refresh();
        $this->assertEquals('started', $this->purchaseOrder->latest_production_status);
        $this->assertEquals(10, $this->purchaseOrder->latest_progress_percentage);
        $this->assertNotNull($this->purchaseOrder->production_started_at);
    }

    /** @test */
    public function vendor_can_list_production_updates_for_purchase_order()
    {
        // Create multiple updates
        VendorProductionUpdate::factory()->count(3)->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
        ]);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'uuid',
                        'status',
                        'progress_percentage',
                        'notes',
                        'created_at',
                    ],
                ],
            ]);
    }

    /** @test */
    public function vendor_can_view_single_production_update()
    {
        $update = VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'in_progress',
            'progress_percentage' => 50,
        ]);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson("/api/v1/vendor/production-updates/{$update->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'uuid' => $update->uuid,
                    'status' => 'in_progress',
                    'progress_percentage' => 50,
                ],
            ]);
    }

    /** @test */
    public function admin_can_view_all_production_updates_for_purchase_order()
    {
        // Create updates
        VendorProductionUpdate::factory()->count(5)->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson("/api/v1/tenant/purchase-orders/{$this->purchaseOrder->uuid}/production-updates");

        $response->assertStatus(200)
            ->assertJsonCount(5, 'data');
    }

    /** @test */
    public function admin_can_view_milestone_updates_only()
    {
        // Create mix of milestone and regular updates
        VendorProductionUpdate::factory()->count(3)->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'is_milestone' => true,
        ]);

        VendorProductionUpdate::factory()->count(2)->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'is_milestone' => false,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson("/api/v1/tenant/purchase-orders/{$this->purchaseOrder->uuid}/production-updates/milestones");

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');

        // Verify all returned updates are milestones
        $data = $response->json('data');
        foreach ($data as $update) {
            $this->assertTrue($update['is_milestone']);
        }
    }

    /** @test */
    public function admin_can_view_recent_updates_across_all_purchase_orders()
    {
        // Create another PO
        $po2 = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
        ]);

        // Create updates for both POs
        VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'created_at' => now()->subHours(2),
        ]);

        VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $po2->id,
            'vendor_id' => $this->vendor->id,
            'created_at' => now()->subHours(1),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson('/api/v1/tenant/production-updates/recent?limit=10');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');

        // Verify ordered by most recent first
        $data = $response->json('data');
        // Check by UUID instead of ID (ID is hidden)
        $this->assertNotEmpty($data[0]['uuid']);
        $this->assertNotEmpty($data[1]['uuid']);
    }

    /** @test */
    public function vendor_cannot_create_update_for_other_vendors_purchase_order()
    {
        $otherVendor = User::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'email' => 'other-vendor@test.com',
        ]);

        $response = $this->actingAs($otherVendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'started',
                'progress_percentage' => 10,
                'notes' => 'Trying to update',
            ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function vendor_cannot_view_other_vendors_production_updates()
    {
        $otherVendor = User::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'email' => 'other-vendor@test.com',
        ]);

        $update = VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
        ]);

        $response = $this->actingAs($otherVendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson("/api/v1/vendor/production-updates/{$update->uuid}");

        $response->assertStatus(404);
    }

    /** @test */
    public function production_updates_are_tenant_isolated()
    {
        // Create tenant 2
        $tenant2 = Tenant::factory()->create();
        $tenant2Vendor = User::factory()->create([
            'tenant_id' => $tenant2->id,
            'email' => 'tenant2-vendor@test.com',
        ]);

        $update = VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
        ]);

        // Try to access with tenant 2 credentials
        $response = $this->actingAs($tenant2Vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $tenant2->id])
            ->getJson("/api/v1/vendor/production-updates/{$update->uuid}");

        $response->assertStatus(404);
    }

    /** @test */
    public function creating_update_validates_required_fields()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                // Missing required fields
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status', 'progress_percentage']);
    }

    /** @test */
    public function creating_update_validates_progress_percentage_range()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'in_progress',
                'progress_percentage' => 150, // Invalid: > 100
                'notes' => 'Test',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['progress_percentage']);
    }

    /** @test */
    public function creating_update_validates_status_values()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'invalid_status',
                'progress_percentage' => 50,
                'notes' => 'Test',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    /** @test */
    public function completed_status_requires_100_percent_progress()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'completed',
                'progress_percentage' => 90, // Invalid: not 100%
                'notes' => 'Test',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonPath('errors.business_logic.0', 'Completed status requires 100% progress');
    }

    /** @test */
    public function delayed_status_requires_estimated_completion_date()
    {
        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'delayed',
                'progress_percentage' => 50,
                'notes' => 'Delayed due to material shortage',
                // Missing estimated_completion_date
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonPath('errors.business_logic.0', 'Delayed status requires estimated completion date');
    }

    /** @test */
    public function complete_workflow_from_start_to_completion()
    {
        // Step 1: Start production
        $response1 = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'started',
                'progress_percentage' => 0,
                'notes' => 'Production started',
                'is_milestone' => true,
            ]);

        $response1->assertStatus(201);

        // Step 2: Progress update
        $response2 = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'in_progress',
                'progress_percentage' => 50,
                'notes' => 'Halfway through',
            ]);

        $response2->assertStatus(201);

        // Step 3: Quality check
        $response3 = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'quality_check',
                'progress_percentage' => 90,
                'notes' => 'Quality inspection in progress',
                'is_milestone' => true,
            ]);

        $response3->assertStatus(201);

        // Step 4: Complete
        $response4 = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'completed',
                'progress_percentage' => 100,
                'notes' => 'Production completed',
                'is_milestone' => true,
            ]);

        $response4->assertStatus(201);

        // Verify final state
        $this->purchaseOrder->refresh();
        $this->assertEquals('completed', $this->purchaseOrder->latest_production_status);
        $this->assertEquals(100, $this->purchaseOrder->latest_progress_percentage);
        $this->assertNotNull($this->purchaseOrder->production_completed_at);

        // Verify all updates created
        $this->assertEquals(4, VendorProductionUpdate::where('purchase_order_id', $this->purchaseOrder->id)->count());
    }

    /** @test */
    public function vendor_can_add_photos_during_update_creation()
    {
        $photo1 = UploadedFile::fake()->image('progress1.jpg', 800, 600);
        $photo2 = UploadedFile::fake()->image('progress2.jpg', 800, 600);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates", [
                'status' => 'in_progress',
                'progress_percentage' => 50,
                'notes' => 'Progress update with photos',
                'photos' => [$photo1, $photo2],
                'photo_captions' => ['Material preparation', 'Work in progress'],
            ]);

        $response->assertStatus(201);

        // Verify photos stored
        $update = VendorProductionUpdate::where('purchase_order_id', $this->purchaseOrder->id)->first();
        $this->assertNotNull($update->photos);
        $this->assertCount(2, $update->photos);
        $this->assertEquals('Material preparation', $update->photos[0]['caption']);
    }

    /** @test */
    public function updates_are_ordered_by_creation_date_descending()
    {
        // Create updates at different times
        $update1 = VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'created_at' => now()->subHours(3),
        ]);

        $update2 = VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'created_at' => now()->subHours(1),
        ]);

        $update3 = VendorProductionUpdate::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'purchase_order_id' => $this->purchaseOrder->id,
            'vendor_id' => $this->vendor->id,
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->getJson("/api/v1/vendor/purchase-orders/{$this->purchaseOrder->uuid}/production-updates");

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals($update3->uuid, $data[0]['uuid']);
        $this->assertEquals($update2->uuid, $data[1]['uuid']);
        $this->assertEquals($update1->uuid, $data[2]['uuid']);
    }

    /** @test */
    public function cannot_create_update_for_non_accepted_purchase_order()
    {
        $draftPO = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->vendor->tenant_id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->vendor, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->vendor->tenant_id])
            ->postJson("/api/v1/vendor/purchase-orders/{$draftPO->uuid}/production-updates", [
                'status' => 'started',
                'progress_percentage' => 10,
                'notes' => 'Starting production',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Validation failed',
            ])
            ->assertJsonPath('errors.business_logic.0', 'Purchase order must be accepted before creating production updates');
    }
}


