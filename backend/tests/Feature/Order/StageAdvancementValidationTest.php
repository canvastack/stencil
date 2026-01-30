<?php

namespace Tests\Feature\Order;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Laravel\Sanctum\Sanctum;

/**
 * Unit tests for stage advancement validation
 * 
 * Tests Requirement 3.2:
 * - Test error message when no accepted quote exists
 */
class StageAdvancementValidationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test-tenant.localhost',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);
        
        // Set tenant context for multi-tenancy
        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);
    }

    /**
     * Test error message when no accepted quote exists
     * Validates: Requirement 3.2
     */
    public function test_error_message_when_no_accepted_quote_exists(): void
    {
        // Create order in vendor_negotiation status without accepted quote
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => null,
            'vendor_id' => null,
            'quotation_amount' => null,
        ]);

        // Attempt to advance to customer_quote stage
        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
            'action' => 'advance',
            'target_stage' => 'customer_quote',
            'notes' => 'Attempting to advance without accepted quote',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert validation error
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'errors' => ['vendor_negotiation']
        ]);
        
        // Assert specific error message
        $response->assertJson([
            'errors' => [
                'vendor_negotiation' => [
                    'No accepted vendor quote found. Please accept a quote before proceeding to customer quote stage.'
                ]
            ]
        ]);
    }

    /**
     * Test error message when order is missing vendor quoted price
     * Validates: Requirement 3.2
     */
    public function test_error_message_when_missing_vendor_quoted_price(): void
    {
        // Create order in vendor_negotiation status
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => null, // Missing
            'vendor_id' => $this->vendor->id,
            'quotation_amount' => 13500000,
        ]);

        // Create accepted quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 10000000,
            'latest_offer' => 10000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => now(),
        ]);

        // Attempt to advance to customer_quote stage
        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
            'action' => 'advance',
            'target_stage' => 'customer_quote',
            'notes' => 'Attempting to advance with missing vendor price',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert validation error
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'errors' => ['vendor_negotiation']
        ]);
        
        // Assert specific error message
        $response->assertJson([
            'errors' => [
                'vendor_negotiation' => [
                    'Order is missing vendor quoted price. Please ensure quote data is properly synced.'
                ]
            ]
        ]);
    }

    /**
     * Test error message when order is missing quotation amount
     * Validates: Requirement 3.2
     */
    public function test_error_message_when_missing_quotation_amount(): void
    {
        // Create order in vendor_negotiation status
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => 10000000,
            'vendor_id' => $this->vendor->id,
            'quotation_amount' => null, // Missing
        ]);

        // Create accepted quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 10000000,
            'latest_offer' => 10000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => now(),
        ]);

        // Attempt to advance to customer_quote stage
        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
            'action' => 'advance',
            'target_stage' => 'customer_quote',
            'notes' => 'Attempting to advance with missing quotation amount',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert validation error
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'errors' => ['vendor_negotiation']
        ]);
        
        // Assert specific error message
        $response->assertJson([
            'errors' => [
                'vendor_negotiation' => [
                    'Order is missing quotation amount. Please ensure quote data is properly synced.'
                ]
            ]
        ]);
    }

    /**
     * Test error message when order is missing vendor assignment
     * Validates: Requirement 3.2
     */
    public function test_error_message_when_missing_vendor_assignment(): void
    {
        // Create order in vendor_negotiation status
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => 10000000,
            'vendor_id' => null, // Missing
            'quotation_amount' => 13500000,
        ]);

        // Create accepted quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 10000000,
            'latest_offer' => 10000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => now(),
        ]);

        // Attempt to advance to customer_quote stage
        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
            'action' => 'advance',
            'target_stage' => 'customer_quote',
            'notes' => 'Attempting to advance with missing vendor',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert validation error
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'errors' => ['vendor_negotiation']
        ]);
        
        // Assert specific error message
        $response->assertJson([
            'errors' => [
                'vendor_negotiation' => [
                    'Order is missing vendor assignment. Please ensure quote data is properly synced.'
                ]
            ]
        ]);
    }

    /**
     * Test successful stage advancement with all requirements met
     * Validates: Requirement 3.3
     */
    public function test_successful_stage_advancement_with_accepted_quote(): void
    {
        // Create order in vendor_negotiation status with all required fields
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => 10000000,
            'vendor_id' => $this->vendor->id,
            'quotation_amount' => 13500000,
        ]);

        // Create accepted quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 10000000,
            'latest_offer' => 10000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => now(),
        ]);

        // Attempt to advance to customer_quote stage
        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
            'action' => 'advance',
            'target_stage' => 'customer_quote',
            'notes' => 'Advancing with all requirements met',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert successful advancement
        $response->assertStatus(200);
        $response->assertJsonPath('data.status', 'customer_quote');
        
        // Verify order status updated
        $order->refresh();
        $this->assertEquals('customer_quote', $order->status);
    }

    /**
     * Test that validation only applies to vendor_negotiation -> customer_quote transition
     * Validates: Requirement 3.1
     */
    public function test_validation_only_applies_to_specific_transition(): void
    {
        // Create order in pending status (not vendor_negotiation)
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'pending',
        ]);

        // Attempt to advance to vendor_sourcing (different transition)
        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
            'action' => 'advance',
            'target_stage' => 'vendor_sourcing',
            'notes' => 'Advancing from pending to vendor_sourcing',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Should not trigger vendor_negotiation validation
        // (may succeed or fail for other reasons, but not vendor_negotiation validation)
        if ($response->status() === 422) {
            $errors = $response->json('errors');
            $this->assertArrayNotHasKey('vendor_negotiation', $errors ?? [],
                'Vendor negotiation validation should not apply to other transitions');
        } else {
            // If it succeeds, that's also fine - just assert it didn't fail with vendor_negotiation error
            $this->assertTrue(true, 'Transition succeeded without vendor_negotiation validation');
        }
    }
}
