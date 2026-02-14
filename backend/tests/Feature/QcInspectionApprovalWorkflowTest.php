<?php

namespace Tests\Feature;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Mail\QcInspectionRejectedNotification;
use App\Models\OrderQcInspection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class QcInspectionApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant first
        $tenant = Tenant::factory()->create();

        $this->admin = User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'tenant',
        ]);

        // Create customer for the order
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Create order with explicit tenant_id and customer_id to avoid factory creating new ones
        $this->order = Order::factory()->create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'status' => 'quality_control',
        ]);
    }

    /** @test */
    public function it_creates_qc_inspection_with_approval_decision()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'inspection_duration_minutes' => 25,
                'checklist_results' => [
                    'physical_specifications' => [
                        'dimensions_accuracy' => [
                            'status' => 'pass',
                            'notes' => 'All dimensions correct',
                        ],
                    ],
                ],
                'overall_rating' => 'excellent',
                'total_score' => 95.5,
                'critical_items_passed' => true,
                'decision' => 'approved',
                'decision_notes' => null,
                'photos' => ['photo1.jpg', 'photo2.jpg'],
            ]);

        if ($response->status() !== 201) {
            dump('Response status: ' . $response->status());
            dump('Response body: ' . $response->getContent());
            dump('Order UUID: ' . $this->order->uuid);
        }

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'order_id',
                    'decision',
                    'decision_label',
                ],
            ]);

        $this->assertDatabaseHas('order_qc_inspections', [
            'order_id' => $this->order->id,
            'decision' => 'approved',
            'critical_items_passed' => true,
        ]);
    }

    /** @test */
    public function it_updates_order_status_to_shipping_when_approved()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => true,
                'decision' => 'approved',
                'total_score' => 95,
            ]);

        if ($response->status() !== 201) {
            dump('Response status: ' . $response->status());
            dump('Response body: ' . $response->getContent());
        }

        $response->assertStatus(201);

        $this->order->refresh();
        $this->assertEquals('shipping', $this->order->status);
    }

    /** @test */
    public function it_updates_order_status_to_in_production_when_rejected()
    {
        Mail::fake();

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => false,
                'decision' => 'rejected',
                'decision_notes' => 'Quality issues found',
                'total_score' => 60,
                'rework_deadline' => now()->addDays(7)->toISOString(),
            ]);

        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);
    }

    /** @test */
    public function it_sends_vendor_notification_when_rejected()
    {
        Mail::fake();

        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $this->admin->tenant_id,
            'email' => 'vendor@example.com',
        ]);

        $this->order->update(['vendor_id' => $vendor->id]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => false,
                'decision' => 'rejected',
                'decision_notes' => 'Quality issues found',
                'total_score' => 60,
            ]);

        if ($response->status() !== 201) {
            dump('Response status: ' . $response->status());
            dump('Response body: ' . $response->getContent());
        }

        $response->assertStatus(201);

        // Check if mail was queued (not sent immediately because it implements ShouldQueue)
        Mail::assertQueued(QcInspectionRejectedNotification::class);
    }

    /** @test */
    public function it_does_not_send_notification_when_approved()
    {
        Mail::fake();

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => true,
                'decision' => 'approved',
                'total_score' => 95,
            ]);

        Mail::assertNotSent(QcInspectionRejectedNotification::class);
    }

    /** @test */
    public function it_retrieves_all_inspections_for_an_order()
    {
        OrderQcInspection::factory()->count(3)->create([
            'tenant_id' => $this->admin->tenant_id,
            'order_id' => $this->order->id,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->getJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections");

        $response->assertOk()
            ->assertJsonCount(3, 'data');
    }

    /** @test */
    public function it_retrieves_specific_inspection()
    {
        $inspection = OrderQcInspection::factory()->create([
            'tenant_id' => $this->admin->tenant_id,
            'order_id' => $this->order->id,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->getJson("/api/v1/admin/qc-inspections/{$inspection->uuid}");

        $response->assertOk()
            ->assertJson([
                'data' => [
                    'id' => $inspection->uuid,
                    'decision' => $inspection->decision,
                ],
            ]);
    }

    /** @test */
    public function it_updates_inspection()
    {
        $inspection = OrderQcInspection::factory()->create([
            'tenant_id' => $this->admin->tenant_id,
            'order_id' => $this->order->id,
            'decision' => 'approved',
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->putJson("/api/v1/admin/qc-inspections/{$inspection->uuid}", [
                'decision_notes' => 'Updated notes',
                'vendor_response' => 'Vendor acknowledged',
            ]);

        $response->assertOk();

        $inspection->refresh();
        $this->assertEquals('Updated notes', $inspection->decision_notes);
        $this->assertEquals('Vendor acknowledged', $inspection->vendor_response);
    }

    /** @test */
    public function it_deletes_inspection()
    {
        $inspection = OrderQcInspection::factory()->create([
            'tenant_id' => $this->admin->tenant_id,
            'order_id' => $this->order->id,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->deleteJson("/api/v1/admin/qc-inspections/{$inspection->uuid}");

        $response->assertOk();

        $this->assertDatabaseMissing('order_qc_inspections', [
            'id' => $inspection->id,
        ]);
    }

    /** @test */
    public function it_tracks_reinspection_count()
    {
        $originalInspection = OrderQcInspection::factory()->rejected()->create([
            'tenant_id' => $this->admin->tenant_id,
            'order_id' => $this->order->id,
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => true,
                'decision' => 'approved',
                'total_score' => 95,
                'is_reinspection' => true,
                'original_inspection_uuid' => $originalInspection->uuid,
            ]);

        $originalInspection->refresh();
        $this->assertEquals(1, $originalInspection->reinspection_count);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                // Missing required fields
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'inspection_date',
                'checklist_results',
                'critical_items_passed',
                'decision',
            ]);
    }

    /** @test */
    public function it_validates_decision_values()
    {
        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => true,
                'decision' => 'invalid_decision',
                'total_score' => 95,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['decision']);
    }

    /** @test */
    public function it_enforces_tenant_isolation()
    {
        $otherTenant = Tenant::factory()->create();
        
        $otherTenantAdmin = User::factory()->create([
            'tenant_id' => $otherTenant->id,
            'account_type' => 'tenant',
        ]);

        \Laravel\Sanctum\Sanctum::actingAs($otherTenantAdmin, ['*']);
        
        $response = $this->getJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections");

        $response->assertStatus(404);
    }

    /** @test */
    public function it_calculates_photo_count_correctly()
    {
        $photos = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];

        \Laravel\Sanctum\Sanctum::actingAs($this->admin, ['*']);
        
        $response = $this->postJson("/api/v1/admin/orders/{$this->order->uuid}/qc-inspections", [
                'inspection_date' => now()->toISOString(),
                'checklist_results' => [],
                'critical_items_passed' => true,
                'decision' => 'approved',
                'total_score' => 95,
                'photos' => $photos,
            ]);

        if ($response->status() !== 201) {
            dump('Response status: ' . $response->status());
            dump('Response body: ' . $response->getContent());
        }

        $response->assertStatus(201);

        $this->assertDatabaseHas('order_qc_inspections', [
            'order_id' => $this->order->id,
            'photo_count' => 3,
        ]);
    }
}
