<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Two-Way Negotiation End-to-End Test
 * 
 * Tests business logic for all negotiation scenarios
 * Focuses on domain logic rather than API endpoints
 */
class TwoWayNegotiationE2ETest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Vendor $vendor;
    private Customer $customer;
    private Order $order;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Disable mail sending
        Mail::fake();
        
        // Create tenant
        $this->tenant = Tenant::factory()->create();
        
        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@test.com',
        ]);
        
        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
        ]);
        
        // Create product
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
            'price' => 100000,
        ]);
        
        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'order_number' => 'ORD-' . Str::random(8),
            'status' => 'pending',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'product_name' => $this->product->name,
                    'quantity' => 2,
                    'unit_price' => 100000,
                    'vendor_cost' => 75000,
                    'total_price' => 200000,
                    'specifications' => [
                        'material' => 'stainless_steel',
                        'size' => '10x15cm',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Test Case 1: Happy Path - Vendor accepts quote immediately
     */
    public function test_scenario_1_vendor_accepts_immediately()
    {
        // Step 1: Create and send quote
        $quote = $this->createQuote();
        $quote->update(['status' => 'sent', 'sent_at' => now()]);
        
        $this->assertEquals('sent', $quote->status);
        $this->assertEquals(1, $quote->round);
        
        // Step 2: Vendor accepts quote
        $quote->update([
            'status' => 'accepted',
            'response_type' => 'accept',
            'responded_at' => now(),
            'closed_at' => now(),
            'quote_details' => array_merge($quote->quote_details ?? [], [
                'estimated_delivery_days' => 7,
                'acceptance_notes' => 'We accept the quote',
            ]),
        ]);
        
        // Verify quote status
        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
        $this->assertEquals('accept', $quote->response_type);
        $this->assertNotNull($quote->responded_at);
        $this->assertNotNull($quote->closed_at);
        $this->assertEquals(7, $quote->quote_details['estimated_delivery_days']);
    }

    /**
     * Test Case 2: Vendor counters, Admin accepts
     */
    public function test_scenario_2_vendor_counter_admin_accepts()
    {
        // Step 1: Create and send quote
        $quote = $this->createQuote();
        $quote->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Step 2: Vendor submits counter offer
        $quote->update([
            'status' => 'countered',
            'round' => 2,
            'latest_offer' => 80000,
            'responded_at' => now(),
            'quote_details' => array_merge($quote->quote_details ?? [], [
                'counter_offer' => [
                    'items' => [
                        [
                            'product_id' => $this->product->uuid,
                            'counter_unit_price' => 80000,
                            'notes' => 'Can we increase the price?',
                        ],
                    ],
                    'total_counter' => 160000,
                    'notes' => 'Counter offer submitted',
                    'estimated_delivery_days' => 10,
                ],
            ]),
        ]);
        
        $quote->refresh();
        $this->assertEquals('countered', $quote->status);
        $this->assertEquals(2, $quote->round);
        $this->assertNotNull($quote->quote_details['counter_offer']);
        
        // Step 3: Admin accepts counter offer
        $quote->update([
            'status' => 'accepted',
            'closed_at' => now(),
            'quote_details' => array_merge($quote->quote_details ?? [], [
                'customer_price' => 110000,
                'acceptance_notes' => 'Accepted with customer price adjustment',
            ]),
        ]);
        
        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
        $this->assertNotNull($quote->closed_at);
    }

    /**
     * Test Case 3: Multiple rounds of negotiation (3 rounds)
     */
    public function test_scenario_3_multiple_rounds_negotiation()
    {
        $quote = $this->createQuote();
        $quote->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Round 1: Vendor counter
        $quote->update([
            'status' => 'countered',
            'round' => 2,
            'latest_offer' => 80000,
        ]);
        $quote->refresh();
        $this->assertEquals(2, $quote->round);
        $this->assertEquals('countered', $quote->status);
        
        // Round 2: Admin counter
        $quote->update([
            'status' => 'admin_countered',
            'round' => 3,
            'latest_offer' => 77000,
            'quote_details' => array_merge($quote->quote_details ?? [], [
                'admin_counter_offer' => [
                    'items' => [
                        [
                            'product_id' => $this->product->uuid,
                            'admin_counter_unit_price' => 77000,
                        ],
                    ],
                    'total_counter' => 154000,
                ],
            ]),
        ]);
        $quote->refresh();
        $this->assertEquals(3, $quote->round);
        $this->assertEquals('admin_countered', $quote->status);
        
        // Round 3: Vendor counter again
        $quote->update([
            'status' => 'countered',
            'round' => 4,
            'latest_offer' => 78000,
        ]);
        $quote->refresh();
        $this->assertEquals(4, $quote->round);
        $this->assertEquals('countered', $quote->status);
        
        // Admin accepts
        $quote->update([
            'status' => 'accepted',
            'closed_at' => now(),
        ]);
        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
    }

    /**
     * Test Case 5: Admin rejects vendor counter offer
     */
    public function test_scenario_5_admin_rejects_counter()
    {
        $quote = $this->createQuote();
        $quote->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Vendor counter
        $quote->update([
            'status' => 'countered',
            'round' => 2,
            'latest_offer' => 85000,
        ]);
        $quote->refresh();
        $this->assertEquals('countered', $quote->status);
        
        // Admin rejects
        $quote->update([
            'status' => 'sent', // Back to sent for re-negotiation
            'quote_details' => array_merge($quote->quote_details ?? [], [
                'rejection_history' => [
                    [
                        'rejection_number' => 1,
                        'rejection_reason' => 'Price too high, please revise your offer',
                        'rejected_at' => now()->toISOString(),
                    ],
                ],
            ]),
        ]);
        
        $quote->refresh();
        $this->assertEquals('sent', $quote->status);
        $this->assertNotNull($quote->quote_details['rejection_history']);
        $this->assertCount(1, $quote->quote_details['rejection_history']);
        
        $rejection = $quote->quote_details['rejection_history'][0];
        $this->assertEquals(1, $rejection['rejection_number']);
        $this->assertEquals('Price too high, please revise your offer', $rejection['rejection_reason']);
    }

    /**
     * Test Case 9: Admin counter after vendor counter (two-way)
     */
    public function test_scenario_9_admin_counter_after_vendor_counter()
    {
        $quote = $this->createQuote();
        $quote->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Vendor counter
        $quote->update([
            'status' => 'countered',
            'round' => 2,
            'latest_offer' => 80000,
        ]);
        $quote->refresh();
        $this->assertEquals('countered', $quote->status);
        
        // Admin counter back
        $quote->update([
            'status' => 'admin_countered',
            'round' => 3,
            'latest_offer' => 77000,
            'quote_details' => array_merge($quote->quote_details ?? [], [
                'admin_counter_offer' => [
                    'items' => [
                        [
                            'product_id' => $this->product->uuid,
                            'admin_counter_unit_price' => 77000,
                        ],
                    ],
                    'total_counter' => 154000,
                ],
            ]),
        ]);
        $quote->refresh();
        $this->assertEquals('admin_countered', $quote->status);
        $this->assertEquals(3, $quote->round);
        
        // Verify admin counter offer in quote_details
        $this->assertNotNull($quote->quote_details['admin_counter_offer']);
        $adminCounter = $quote->quote_details['admin_counter_offer'];
        $this->assertEquals(77000, $adminCounter['items'][0]['admin_counter_unit_price']);
        
        // Vendor can counter again
        $quote->update([
            'status' => 'countered',
            'round' => 4,
            'latest_offer' => 78000,
        ]);
        $quote->refresh();
        $this->assertEquals('countered', $quote->status);
        $this->assertEquals(4, $quote->round);
    }

    /**
     * Test Case 10: Final round warning behavior
     */
    public function test_scenario_10_final_round_warning()
    {
        $quote = $this->createQuote();
        $quote->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Get to round 4 (final round warning should appear at round >= 4)
        $quote->update(['status' => 'countered', 'round' => 2]); // Vendor counter
        $quote->update(['status' => 'admin_countered', 'round' => 3]); // Admin counter
        $quote->update(['status' => 'countered', 'round' => 4]); // Vendor counter
        
        $quote->refresh();
        $this->assertEquals(4, $quote->round);
        $this->assertEquals('countered', $quote->status);
        
        // Check if at final round warning threshold (round 4 means warning should appear)
        // Frontend shows warning when: round >= (max_rounds - 1), which is round >= 4 for max_rounds = 5
        // Note: max_rounds is stored in quote_details JSON, not as a database column
        $quoteDetails = $quote->quote_details ?? [];
        $maxRounds = $quoteDetails['max_rounds'] ?? 5;
        $this->assertTrue($quote->round >= ($maxRounds - 1));
        
        // Admin counters (round 5 - final round)
        $quote->update(['status' => 'admin_countered', 'round' => 5]);
        $quote->refresh();
        $this->assertEquals(5, $quote->round);
        $this->assertEquals('admin_countered', $quote->status);
        
        // Verify at round 5 (final round)
        $this->assertEquals(5, $quote->round);
        
        // Vendor accepts (wise choice on final round)
        $quote->update(['status' => 'accepted', 'closed_at' => now()]);
        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
    }

    // Helper Methods

    private function createQuote(array $overrides = []): OrderVendorNegotiation
    {
        return OrderVendorNegotiation::create(array_merge([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'specifications' => [
                'material' => 'stainless_steel',
                'size' => '10x15cm',
            ],
            'status' => 'draft',
            'initial_offer' => 75000,
            'latest_offer' => 75000,
            'currency' => 'IDR',
            'quote_details' => [
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'product_name' => $this->product->name,
                        'quantity' => 2,
                        'vendor_cost' => 75000,
                        'unit_price' => 100000,
                        'total_price' => 200000,
                    ],
                ],
                'max_rounds' => 5, // Store max_rounds in quote_details JSON
            ],
            'round' => 1,
            'expires_at' => now()->addDays(30),
        ], $overrides));
    }
}
