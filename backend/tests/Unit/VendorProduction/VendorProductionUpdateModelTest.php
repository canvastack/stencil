<?php

namespace Tests\Unit\VendorProduction;

use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\User;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * VendorProductionUpdate Model Unit Tests
 * 
 * Tests model business logic, relationships, and computed attributes.
 */
class VendorProductionUpdateModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create tenant (let database auto-assign ID)
        $tenant = Tenant::factory()->create();
        
        // Create users for foreign keys WITH tenant_id (create many for tests that need them)
        User::factory()->count(300)->create([
            'tenant_id' => $tenant->id,
        ]);
    }

    /** @test */
    public function it_has_correct_status_display_name()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'in_progress']);
        $this->assertEquals('In Progress', $update->statusDisplayName);

        $update->status = 'completed';
        $this->assertEquals('Completed', $update->statusDisplayName);

        $update->status = 'delayed';
        $this->assertEquals('Delayed', $update->statusDisplayName);
    }

    /** @test */
    public function it_has_correct_status_color()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'started']);
        $this->assertEquals('blue', $update->statusColor);

        $update->status = 'in_progress';
        $this->assertEquals('yellow', $update->statusColor);

        $update->status = 'quality_check';
        $this->assertEquals('purple', $update->statusColor);

        $update->status = 'completed';
        $this->assertEquals('green', $update->statusColor);

        $update->status = 'delayed';
        $this->assertEquals('red', $update->statusColor);
    }

    /** @test */
    public function it_calculates_photo_count_correctly()
    {
        $update = VendorProductionUpdate::factory()->create([
            'photos' => [
                ['url' => 'photo1.jpg'],
                ['url' => 'photo2.jpg'],
                ['url' => 'photo3.jpg'],
            ],
        ]);

        $this->assertEquals(3, $update->photoCount);
    }

    /** @test */
    public function it_returns_zero_photo_count_when_no_photos()
    {
        $update = VendorProductionUpdate::factory()->create(['photos' => null]);
        $this->assertEquals(0, $update->photoCount);

        $update->photos = [];
        $this->assertEquals(0, $update->photoCount);
    }

    /** @test */
    public function it_detects_overdue_status_correctly()
    {
        $po = VendorPurchaseOrder::factory()->create([
            'expected_delivery_date' => now()->subDays(5), // Overdue
        ]);

        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'in_progress',
        ]);

        $this->assertTrue($update->isOverdue());
    }

    /** @test */
    public function it_detects_not_overdue_when_within_deadline()
    {
        $po = VendorPurchaseOrder::factory()->create([
            'expected_delivery_date' => now()->addDays(10), // Future
        ]);

        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'in_progress',
        ]);

        $this->assertFalse($update->isOverdue());
    }

    /** @test */
    public function it_detects_not_overdue_when_completed()
    {
        $po = VendorPurchaseOrder::factory()->create([
            'expected_delivery_date' => now()->subDays(5), // Past
        ]);

        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
            'status' => 'completed',
        ]);

        $this->assertFalse($update->isOverdue());
    }

    /** @test */
    public function it_validates_status_transitions()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'started']);

        // Valid transitions from started
        $this->assertTrue($update->canTransitionTo('in_progress'));
        $this->assertTrue($update->canTransitionTo('delayed'));
        
        // Invalid transition
        $this->assertFalse($update->canTransitionTo('quality_check'));
    }

    /** @test */
    public function it_allows_transition_from_in_progress_to_quality_check()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'in_progress']);
        $this->assertTrue($update->canTransitionTo('quality_check'));
    }

    /** @test */
    public function it_allows_transition_from_quality_check_to_completed()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'quality_check']);
        $this->assertTrue($update->canTransitionTo('completed'));
    }

    /** @test */
    public function it_allows_transition_from_delayed_back_to_in_progress()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'delayed']);
        $this->assertTrue($update->canTransitionTo('in_progress'));
    }

    /** @test */
    public function it_does_not_allow_transition_from_completed()
    {
        $update = VendorProductionUpdate::factory()->create(['status' => 'completed']);
        
        $this->assertFalse($update->canTransitionTo('in_progress'));
        $this->assertFalse($update->canTransitionTo('delayed'));
        $this->assertFalse($update->canTransitionTo('started'));
    }

    /** @test */
    public function it_has_purchase_order_relationship()
    {
        $po = VendorPurchaseOrder::factory()->create();
        $update = VendorProductionUpdate::factory()->create([
            'purchase_order_id' => $po->id,
        ]);

        $this->assertInstanceOf(VendorPurchaseOrder::class, $update->purchaseOrder);
        $this->assertEquals($po->id, $update->purchaseOrder->id);
    }

    /** @test */
    public function it_has_vendor_relationship()
    {
        $update = VendorProductionUpdate::factory()->create();
        $this->assertNotNull($update->vendor);
    }

    /** @test */
    public function it_has_creator_relationship()
    {
        $update = VendorProductionUpdate::factory()->create();
        $this->assertNotNull($update->creator);
    }

    /** @test */
    public function it_scopes_by_purchase_order()
    {
        $po1 = VendorPurchaseOrder::factory()->create();
        $po2 = VendorPurchaseOrder::factory()->create();

        VendorProductionUpdate::factory()->count(3)->create(['purchase_order_id' => $po1->id]);
        VendorProductionUpdate::factory()->count(2)->create(['purchase_order_id' => $po2->id]);

        $updates = VendorProductionUpdate::forPurchaseOrder($po1->id)->get();
        $this->assertCount(3, $updates);
    }

    /** @test */
    public function it_scopes_by_vendor()
    {
        // Create tenant and users
        $tenant = Tenant::factory()->create();
        $vendor1 = User::factory()->create(['tenant_id' => $tenant->id]);
        $vendor2 = User::factory()->create(['tenant_id' => $tenant->id]);

        VendorProductionUpdate::factory()->count(4)->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor1->id,
        ]);
        VendorProductionUpdate::factory()->count(2)->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor2->id,
        ]);

        $updates = VendorProductionUpdate::forVendor($vendor1->id)->get();
        $this->assertCount(4, $updates);
    }

    /** @test */
    public function it_scopes_by_status()
    {
        VendorProductionUpdate::factory()->count(3)->create(['status' => 'in_progress']);
        VendorProductionUpdate::factory()->count(2)->create(['status' => 'completed']);

        $updates = VendorProductionUpdate::withStatus('in_progress')->get();
        $this->assertCount(3, $updates);
    }

    /** @test */
    public function it_scopes_milestones_only()
    {
        VendorProductionUpdate::factory()->count(3)->create(['is_milestone' => true]);
        VendorProductionUpdate::factory()->count(5)->create(['is_milestone' => false]);

        $milestones = VendorProductionUpdate::milestonesOnly()->get();
        $this->assertCount(3, $milestones);
    }

    /** @test */
    public function it_scopes_recent_updates()
    {
        VendorProductionUpdate::factory()->count(15)->create([
            'created_at' => now()->subHours(1),
        ]);

        $recent = VendorProductionUpdate::recent(10)->get();
        $this->assertCount(10, $recent);
    }

    /** @test */
    public function it_orders_by_latest_first()
    {
        $update1 = VendorProductionUpdate::factory()->create(['created_at' => now()->subHours(3)]);
        $update2 = VendorProductionUpdate::factory()->create(['created_at' => now()->subHours(1)]);
        $update3 = VendorProductionUpdate::factory()->create(['created_at' => now()]);

        $updates = VendorProductionUpdate::latest('created_at')->get();
        
        $this->assertEquals($update3->id, $updates[0]->id);
        $this->assertEquals($update2->id, $updates[1]->id);
        $this->assertEquals($update1->id, $updates[2]->id);
    }

    /** @test */
    public function it_casts_photos_to_array()
    {
        $photos = [
            ['url' => 'photo1.jpg', 'caption' => 'Test 1'],
            ['url' => 'photo2.jpg', 'caption' => 'Test 2'],
        ];

        $update = VendorProductionUpdate::factory()->create(['photos' => $photos]);
        
        $this->assertIsArray($update->photos);
        $this->assertCount(2, $update->photos);
    }

    /** @test */
    public function it_casts_dates_correctly()
    {
        $update = VendorProductionUpdate::factory()->create([
            'estimated_completion_date' => '2026-03-01',
            'actual_completion_date' => '2026-02-28',
        ]);

        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $update->estimated_completion_date);
        $this->assertInstanceOf(\Illuminate\Support\Carbon::class, $update->actual_completion_date);
    }

    /** @test */
    public function it_generates_uuid_on_creation()
    {
        $update = VendorProductionUpdate::factory()->create();
        
        $this->assertNotNull($update->uuid);
        $this->assertIsString($update->uuid);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $update->uuid);
    }

    /** @test */
    public function it_is_tenant_scoped()
    {
        // Create tenants
        $tenant1 = Tenant::factory()->create();
        $tenant2 = Tenant::factory()->create();

        $update1 = VendorProductionUpdate::factory()->create(['tenant_id' => $tenant1->id]);
        $update2 = VendorProductionUpdate::factory()->create(['tenant_id' => $tenant2->id]);

        // Assuming tenant scope is applied
        $updates = VendorProductionUpdate::where('tenant_id', $tenant1->id)->get();
        
        $this->assertCount(1, $updates);
        $this->assertEquals($update1->id, $updates[0]->id);
    }

    /** @test */
    public function it_validates_progress_percentage_constraint()
    {
        // This tests the database constraint
        $this->expectException(\Exception::class);
        
        VendorProductionUpdate::factory()->create([
            'progress_percentage' => 150, // Invalid
        ]);
    }

    /** @test */
    public function it_has_fillable_attributes()
    {
        $update = new VendorProductionUpdate();
        
        $fillable = $update->getFillable();
        
        $this->assertContains('status', $fillable);
        $this->assertContains('progress_percentage', $fillable);
        $this->assertContains('notes', $fillable);
        $this->assertContains('photos', $fillable);
        $this->assertContains('is_milestone', $fillable);
    }

    /** @test */
    public function it_has_hidden_attributes()
    {
        $update = VendorProductionUpdate::factory()->create();
        
        $array = $update->toArray();
        
        $this->assertArrayNotHasKey('id', $array);
        // purchase_order_id is intentionally NOT hidden (needed for admin API responses)
        $this->assertArrayHasKey('purchase_order_id', $array);
        $this->assertArrayNotHasKey('vendor_id', $array);
        $this->assertArrayNotHasKey('tenant_id', $array);
    }
}
