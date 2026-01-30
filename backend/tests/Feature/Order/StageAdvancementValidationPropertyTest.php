<?php

namespace Tests\Feature\Order;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Laravel\Sanctum\Sanctum;
use Faker\Factory as Faker;
use Faker\Generator;

/**
 * Property-Based Test for Stage Advancement Validation
 * 
 * **Feature: vendor-negotiation-integration, Property 11: Stage Advancement Requires Accepted Quote**
 * **Validates: Requirements 3.1, 3.3**
 * 
 * This test validates that stage advancement from vendor_negotiation to customer_quote
 * requires an accepted quote, and that the validation works consistently across all
 * possible order states and quote configurations.
 */
class StageAdvancementValidationPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Generator $faker;
    private TenantEloquentModel $tenant;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->faker = Faker::create();
        
        // Create tenant and user for testing
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        // Authenticate user with Sanctum
        Sanctum::actingAs($this->user);
        
        // Set tenant context for multi-tenancy
        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);
    }

    /**
     * Property Test: Stage Advancement Requires Accepted Quote
     * 
     * For any order in vendor_negotiation stage, attempting to advance to customer_quote
     * stage should succeed if and only if an accepted quote exists for that order.
     * 
     * @test
     */
    public function property_stage_advancement_requires_accepted_quote(): void
    {
        $iterations = 20; // Reduced from 100 to avoid rate limiting
        
        for ($i = 0; $i < $iterations; $i++) {
            // Generate random order configuration
            $hasAcceptedQuote = $this->faker->boolean();
            $hasOtherQuotes = $this->faker->boolean();
            $quoteCount = $hasOtherQuotes ? $this->faker->numberBetween(1, 5) : 0;
            
            // Create order in vendor_negotiation stage
            $order = $this->createOrderInVendorNegotiationStage();
            
            // Create quotes based on configuration
            if ($hasAcceptedQuote) {
                $this->createAcceptedQuote($order);
            }
            
            for ($j = 0; $j < $quoteCount; $j++) {
                $this->createQuoteWithRandomStatus($order, ['open', 'countered', 'rejected', 'expired']);
            }
            
            // Attempt to advance stage
            $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
                'notes' => 'Advancing to customer quote stage',
            ], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);
            
            // Property: Advancement succeeds if and only if accepted quote exists
            if ($hasAcceptedQuote) {
                $response->assertStatus(200);
                $response->assertJsonPath('data.status', 'customer_quote');
            } else {
                $response->assertStatus(422);
                $response->assertJsonPath('errors.vendor_negotiation.0', 
                    'No accepted vendor quote found. Please accept a quote before proceeding to customer quote stage.');
            }
            
            // Clean up for next iteration
            $order->vendorNegotiations()->delete();
            $order->delete();
        }
    }

    /**
     * Property Test: Validation Checks Required Fields
     * 
     * For any order with an accepted quote, the validation should verify that
     * vendor_quoted_price, quotation_amount, and vendor_id are all present.
     * 
     * @test
     */
    public function property_validation_checks_required_fields(): void
    {
        $iterations = 20; // Reduced from 100 to avoid rate limiting
        
        for ($i = 0; $i < $iterations; $i++) {
            // Create order in vendor_negotiation stage
            $order = $this->createOrderInVendorNegotiationStage();
            
            // Create accepted quote
            $quote = $this->createAcceptedQuote($order);
            
            // Randomly remove one of the required fields
            $fieldToRemove = $this->faker->randomElement(['vendor_quoted_price', 'quotation_amount', 'vendor_id']);
            $order->update([$fieldToRemove => null]);
            
            // Attempt to advance stage
            $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
                'notes' => 'Advancing to customer quote stage',
            ], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);
            
            // Property: Advancement should fail if any required field is missing
            $response->assertStatus(422);
            $response->assertJsonStructure(['errors' => ['vendor_negotiation']]);
            
            // Clean up
            $order->vendorNegotiations()->delete();
            $order->delete();
        }
    }

    /**
     * Property Test: Validation Only Applies to Specific Transition
     * 
     * For any order, the vendor negotiation validation should only apply when
     * transitioning from vendor_negotiation to customer_quote, not other transitions.
     * 
     * @test
     */
    public function property_validation_only_applies_to_specific_transition(): void
    {
        $iterations = 10; // Reduced from 50 to avoid rate limiting
        
        // Test various stage transitions that should NOT trigger validation
        $otherTransitions = [
            ['from' => 'new', 'to' => 'pending'],
            ['from' => 'pending', 'to' => 'vendor_sourcing'],
            ['from' => 'vendor_sourcing', 'to' => 'vendor_negotiation'],
            ['from' => 'customer_quote', 'to' => 'awaiting_payment'],
        ];
        
        for ($i = 0; $i < $iterations; $i++) {
            $transition = $this->faker->randomElement($otherTransitions);
            
            // Create order in the "from" stage
            $order = $this->createOrderInStage($transition['from']);
            
            // Attempt to advance stage (without accepted quote)
            $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
                'action' => 'advance',
                'target_stage' => $transition['to'],
                'notes' => 'Advancing stage',
            ], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);
            
            // Property: Validation should not be triggered for other transitions
            // (may fail for other reasons, but not vendor_negotiation validation)
            if ($response->status() === 422) {
                $errors = $response->json('errors');
                $this->assertArrayNotHasKey('vendor_negotiation', $errors ?? [],
                    "Vendor negotiation validation should not apply to {$transition['from']} -> {$transition['to']} transition");
            }
            
            // Clean up
            $order->delete();
        }
    }

    /**
     * Property Test: Multiple Quotes Scenario
     * 
     * For any order with multiple quotes, only the presence of at least one
     * accepted quote should allow stage advancement.
     * 
     * @test
     */
    public function property_multiple_quotes_scenario(): void
    {
        $iterations = 10; // Reduced from 50 to avoid rate limiting
        
        for ($i = 0; $i < $iterations; $i++) {
            // Create order in vendor_negotiation stage
            $order = $this->createOrderInVendorNegotiationStage();
            
            // Create multiple quotes with various statuses
            $quoteCount = $this->faker->numberBetween(2, 5);
            $acceptedQuoteIndex = $this->faker->numberBetween(0, $quoteCount - 1);
            
            for ($j = 0; $j < $quoteCount; $j++) {
                if ($j === $acceptedQuoteIndex) {
                    $this->createAcceptedQuote($order);
                } else {
                    $this->createQuoteWithRandomStatus($order, ['open', 'countered', 'rejected', 'expired']);
                }
            }
            
            // Attempt to advance stage
            $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/advance-stage", [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
                'notes' => 'Advancing to customer quote stage',
            ], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);
            
            // Property: Should succeed because at least one quote is accepted
            $response->assertStatus(200);
            $response->assertJsonPath('data.status', 'customer_quote');
            
            // Clean up
            $order->vendorNegotiations()->delete();
            $order->delete();
        }
    }

    // Helper Methods

    private function createOrderInVendorNegotiationStage(): Order
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        
        return Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'vendor_id' => $vendor->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => $this->faker->numberBetween(1000000, 10000000), // in cents
            'quotation_amount' => $this->faker->numberBetween(1350000, 13500000), // in cents
        ]);
    }

    private function createOrderInStage(string $stage): Order
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        
        return Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => $stage,
        ]);
    }

    private function createAcceptedQuote(Order $order): OrderVendorNegotiation
    {
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        
        return OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'accepted',
            'initial_offer' => $this->faker->numberBetween(1000000, 10000000),
            'latest_offer' => $this->faker->numberBetween(1000000, 10000000),
            'closed_at' => now(),
        ]);
    }

    private function createQuoteWithRandomStatus(Order $order, array $possibleStatuses): OrderVendorNegotiation
    {
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $status = $this->faker->randomElement($possibleStatuses);
        
        return OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => $status,
            'initial_offer' => $this->faker->numberBetween(1000000, 10000000),
            'latest_offer' => $this->faker->numberBetween(1000000, 10000000),
            'closed_at' => in_array($status, ['accepted', 'rejected', 'expired']) ? now() : null,
        ]);
    }
}
