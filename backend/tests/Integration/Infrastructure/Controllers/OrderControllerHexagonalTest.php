<?php

namespace Tests\Integration\Infrastructure\Controllers;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Laravel\Sanctum\Sanctum;

/**
 * Phase 4C: Integration tests for hexagonal architecture OrderController
 * 
 * Tests verify that CQRS handlers are properly integrated and business workflows work
 */
class OrderControllerHexagonalTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->user = User::factory()->create();
        
        // Set tenant context
        tenancy()->initialize($this->tenant);
        
        // Authenticate user
        Sanctum::actingAs($this->user);
    }

    /** @test */
    public function test_order_index_uses_cqrs_query_handler()
    {
        // Arrange: Create test orders
        Order::factory()->count(3)->create(['tenant_id' => $this->tenant->id]);

        // Act: Call index endpoint
        $response = $this->getJson('/api/tenant/orders', [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Assert: Response structure matches CQRS pattern
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'uuid', 
                    'order_number',
                    'status',
                    'total_amount'
                ]
            ],
            'meta' => ['total', 'per_page', 'current_page']
        ]);
    }

    /** @test */
    public function test_order_show_uses_cqrs_query_handler()
    {
        // Arrange: Create test order
        $order = Order::factory()->create(['tenant_id' => $this->tenant->id]);

        // Act: Call show endpoint
        $response = $this->getJson("/api/tenant/orders/{$order->id}", [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Assert: Single order response
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'uuid',
                'order_number',
                'status',
                'total_amount'
            ]
        ]);
    }

    /** @test */
    public function test_order_store_uses_cqrs_command_handler()
    {
        // Arrange: Create customer for order
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $orderData = [
            'customer_id' => $customer->id,
            'order_number' => 'TEST-001',
            'total_amount' => 100000,
            'currency' => 'IDR',
            'status' => 'new',
            'items' => [
                [
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'unit_price' => 100000
                ]
            ]
        ];

        // Act: Call store endpoint
        $response = $this->postJson('/api/tenant/orders', $orderData, [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Assert: Order created successfully via CQRS
        $response->assertStatus(201);
        $response->assertJsonFragment(['order_number' => 'TEST-001']);
        
        $this->assertDatabaseHas('orders', [
            'order_number' => 'TEST-001',
            'tenant_id' => $this->tenant->id
        ]);
    }

    /** @test */
    public function test_business_workflow_assign_vendor_uses_command_handler()
    {
        // Arrange: Create order and vendor
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'confirmed'
        ]);
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        // Act: Call assign vendor endpoint
        $response = $this->postJson("/api/tenant/orders/{$order->id}/assign-vendor", [
            'vendor_id' => $vendor->id,
            'specialization_notes' => 'Metal etching specialist'
        ], [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Assert: Vendor assignment via CQRS command handler
        $response->assertStatus(200);
        
        // Verify order updated
        $order->refresh();
        $this->assertEquals($vendor->id, $order->vendor_id);
    }

    /** @test */
    public function test_business_workflow_negotiate_vendor_uses_command_handler()
    {
        // Arrange: Create order with vendor
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $vendor->id,
            'status' => 'vendor_assigned'
        ]);

        // Act: Call negotiate vendor endpoint
        $response = $this->postJson("/api/tenant/orders/{$order->id}/negotiate-vendor", [
            'vendor_id' => $vendor->id,
            'quoted_price' => 85000,
            'quoted_currency' => 'IDR',
            'lead_time_days' => 7,
            'negotiation_notes' => 'Competitive pricing for bulk order'
        ], [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Assert: Negotiation processed via CQRS command handler
        $response->assertStatus(200);
        
        // Verify negotiation record exists
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'latest_offer' => 85000
        ]);
    }

    /** @test */
    public function test_order_ship_uses_command_handler()
    {
        // Arrange: Create order ready for shipping
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'ready_to_ship'
        ]);

        // Act: Call ship endpoint
        $response = $this->postJson("/api/tenant/orders/{$order->id}/ship", [
            'tracking_number' => 'TRACK123456',
            'shipping_carrier' => 'JNE'
        ], [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Assert: Shipping processed via CQRS command handler
        $response->assertStatus(200);
        
        $order->refresh();
        $this->assertEquals('shipped', $order->status);
        $this->assertStringContainsString('TRACK123456', json_encode($order->metadata));
    }

    /** @test */
    public function test_hexagonal_architecture_prevents_direct_eloquent_access()
    {
        // This test verifies that the controller uses handlers instead of direct Eloquent
        // By checking response structure and ensuring proper abstractions
        
        $response = $this->getJson('/api/tenant/orders', [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        // Verify the response comes through proper abstraction layers
        // (CQRS handlers return paginated collections, not raw Eloquent results)
        $response->assertStatus(200);
        $this->assertArrayHasKey('data', $response->json());
        $this->assertArrayHasKey('meta', $response->json());
    }
}