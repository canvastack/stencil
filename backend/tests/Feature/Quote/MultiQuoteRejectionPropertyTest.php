<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Property-based tests for multi-quote rejection logic
 * 
 * Property 19: Quote Rejection on Acceptance
 * Validates: Requirements 7.3
 * 
 * Property 20: Quote Data Preservation
 * Validates: Requirements 7.4
 */
class MultiQuoteRejectionPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor1;
    private Vendor $vendor2;
    private Vendor $vendor3;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant using factory
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test-tenant.localhost',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create multiple vendors
        $this->vendor1 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Vendor A',
        ]);


        $this->vendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Vendor B',
        ]);

        $this->vendor3 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Vendor C',
        ]);

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);
    }

    /**
     * Property 19: Quote Rejection on Acceptance
     * 
     * For any order with multiple open quotes, accepting one quote should mark 
     * all other open quotes for that order as rejected.
     * 
     * Validates: Requirements 7.3
     */
    public function test_quote_rejection_on_acceptance_property(): void
    {
        // Test with various numbers of quotes (2 to 5 quotes per order)
        $testCases = [
            ['num_quotes' => 2, 'accept_index' => 0],
            ['num_quotes' => 3, 'accept_index' => 1],
            ['num_quotes' => 4, 'accept_index' => 2],
            ['num_quotes' => 5, 'accept_index' => 3],
            ['num_quotes' => 3, 'accept_index' => 0],
            ['num_quotes' => 4, 'accept_index' => 3],
        ];

        foreach ($testCases as $testCase) {
            $numQuotes = $testCase['num_quotes'];
            $acceptIndex = $testCase['accept_index'];

            // Create order in vendor_negotiation status
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'status' => 'vendor_negotiation',
            ]);

            // Create multiple quotes for the same order
            $quotes = [];
            $vendors = [$this->vendor1, $this->vendor2, $this->vendor3];
            
            for ($i = 0; $i < $numQuotes; $i++) {
                $vendor = $vendors[$i % count($vendors)];
                $status = ($i % 2 === 0) ? 'sent' : 'countered'; // Mix of sent and countered (changed from 'open')
                
                $quotes[] = OrderVendorNegotiation::create([
                    'tenant_id' => $this->tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'initial_offer' => 1000000 * ($i + 1), // Different prices
                    'latest_offer' => 1000000 * ($i + 1),
                    'currency' => 'IDR',
                    'status' => $status,
                    'terms' => [
                        'payment_terms' => "Net " . (30 + $i * 10),
                        'delivery_time' => ($i + 1) . " weeks",
                    ],
                ]);
            }

            // Accept one quote
            $acceptedQuote = $quotes[$acceptIndex];
            $response = $this->postJson("/api/v1/tenant/quotes/{$acceptedQuote->uuid}/accept", [], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);

            $response->assertStatus(200);

            // Refresh all quotes
            foreach ($quotes as $quote) {
                $quote->refresh();
            }

            // Property assertion: The accepted quote should have status 'accepted'
            $this->assertEquals(
                'accepted',
                $acceptedQuote->status,
                "The accepted quote should have status 'accepted'"
            );

            // Property assertion: All other open/countered quotes should be rejected
            for ($i = 0; $i < $numQuotes; $i++) {
                if ($i !== $acceptIndex) {
                    $this->assertEquals(
                        'rejected',
                        $quotes[$i]->status,
                        "Quote {$i} should be rejected when another quote is accepted (was {$quotes[$i]->status})"
                    );

                    // Verify closed_at is set for rejected quotes
                    $this->assertNotNull(
                        $quotes[$i]->closed_at,
                        "Rejected quote {$i} should have closed_at timestamp set"
                    );
                }
            }

            // Count rejected quotes
            $rejectedCount = OrderVendorNegotiation::where('order_id', $order->id)
                ->where('status', 'rejected')
                ->count();

            $this->assertEquals(
                $numQuotes - 1,
                $rejectedCount,
                "Should have exactly " . ($numQuotes - 1) . " rejected quotes"
            );

            // Count accepted quotes
            $acceptedCount = OrderVendorNegotiation::where('order_id', $order->id)
                ->where('status', 'accepted')
                ->count();

            $this->assertEquals(
                1,
                $acceptedCount,
                "Should have exactly 1 accepted quote"
            );
        }
    }

    /**
     * Test that only open and countered quotes are rejected
     */
    public function test_only_open_and_countered_quotes_are_rejected(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quotes with different statuses
        $openQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $counteredQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 2000000,
            'latest_offer' => 2000000,
            'currency' => 'IDR',
            'status' => 'countered',
        ]);

        $expiredQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor3->id,
            'initial_offer' => 3000000,
            'latest_offer' => 3000000,
            'currency' => 'IDR',
            'status' => 'expired',
            'closed_at' => now()->subDays(1),
        ]);

        $cancelledQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 4000000,
            'latest_offer' => 4000000,
            'currency' => 'IDR',
            'status' => 'rejected', // Already rejected, should remain rejected
            'closed_at' => now()->subDays(2),
        ]);

        // Accept the open quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$openQuote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh all quotes
        $openQuote->refresh();
        $counteredQuote->refresh();
        $expiredQuote->refresh();
        $cancelledQuote->refresh();

        // Assertions
        $this->assertEquals('accepted', $openQuote->status);
        $this->assertEquals('rejected', $counteredQuote->status, 'Countered quote should be rejected');
        $this->assertEquals('expired', $expiredQuote->status, 'Expired quote should remain expired');
        $this->assertEquals('rejected', $cancelledQuote->status, 'Already rejected quote should remain rejected'); // Changed from 'cancelled'
    }

    /**
     * Test that quotes from different orders are not affected
     */
    public function test_quotes_from_different_orders_not_affected(): void
    {
        // Create two orders
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quotes for order 1
        $order1Quote1 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order1->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $order1Quote2 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order1->id,
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 2000000,
            'latest_offer' => 2000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        // Create quotes for order 2
        $order2Quote1 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order2->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 3000000,
            'latest_offer' => 3000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $order2Quote2 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order2->id,
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 4000000,
            'latest_offer' => 4000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        // Accept quote from order 1
        $response = $this->postJson("/api/v1/tenant/quotes/{$order1Quote1->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh all quotes
        $order1Quote1->refresh();
        $order1Quote2->refresh();
        $order2Quote1->refresh();
        $order2Quote2->refresh();

        // Assertions for order 1
        $this->assertEquals('accepted', $order1Quote1->status);
        $this->assertEquals('rejected', $order1Quote2->status);

        // Assertions for order 2 - should remain unchanged
        $this->assertEquals('draft', $order2Quote1->status, 'Order 2 quotes should not be affected'); // Changed from 'open'
        $this->assertEquals('draft', $order2Quote2->status, 'Order 2 quotes should not be affected'); // Changed from 'open'
    }

    /**
     * Test rejection with various quote counts (property test with multiple iterations)
     */
    public function test_rejection_property_with_multiple_iterations(): void
    {
        // Run property test with 10 iterations
        for ($iteration = 0; $iteration < 10; $iteration++) {
            // Random number of quotes between 2 and 6
            $numQuotes = rand(2, 6);
            
            // Random index to accept
            $acceptIndex = rand(0, $numQuotes - 1);

            // Create order
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'status' => 'vendor_negotiation',
            ]);

            // Create quotes
            $quotes = [];
            $vendors = [$this->vendor1, $this->vendor2, $this->vendor3];
            
            for ($i = 0; $i < $numQuotes; $i++) {
                $vendor = $vendors[$i % count($vendors)];
                $status = (rand(0, 1) === 0) ? 'sent' : 'countered'; // Changed from 'open' to 'sent'
                
                $quotes[] = OrderVendorNegotiation::create([
                    'tenant_id' => $this->tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'initial_offer' => rand(100000, 10000000),
                    'latest_offer' => rand(100000, 10000000),
                    'currency' => 'IDR',
                    'status' => $status,
                ]);
            }

            // Accept one quote
            $acceptedQuote = $quotes[$acceptIndex];
            $response = $this->postJson("/api/v1/tenant/quotes/{$acceptedQuote->uuid}/accept", [], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);

            $response->assertStatus(200);

            // Verify property: exactly (numQuotes - 1) quotes should be rejected
            $rejectedCount = OrderVendorNegotiation::where('order_id', $order->id)
                ->where('status', 'rejected')
                ->count();

            $this->assertEquals(
                $numQuotes - 1,
                $rejectedCount,
                "Iteration {$iteration}: Should have exactly " . ($numQuotes - 1) . " rejected quotes out of {$numQuotes} total"
            );

            // Verify property: exactly 1 quote should be accepted
            $acceptedCount = OrderVendorNegotiation::where('order_id', $order->id)
                ->where('status', 'accepted')
                ->count();

            $this->assertEquals(
                1,
                $acceptedCount,
                "Iteration {$iteration}: Should have exactly 1 accepted quote"
            );
        }
    }

    /**
     * Property 20: Quote Data Preservation
     * 
     * For any rejected quote, all quote data should remain in the database 
     * unchanged except for the status field.
     * 
     * Validates: Requirements 7.4
     */
    public function test_quote_data_preservation_property(): void
    {
        // Test with various quote configurations
        $testCases = [
            [
                'initial_offer' => 1000000,
                'latest_offer' => 1200000,
                'currency' => 'IDR',
                'terms' => [
                    'payment_terms' => 'Net 30',
                    'delivery_time' => '2 weeks',
                    'warranty' => '1 year',
                ],
                'round' => 2,
                'history' => [
                    ['action' => 'created', 'timestamp' => now()->subDays(5)->toISOString()],
                    ['action' => 'countered', 'timestamp' => now()->subDays(3)->toISOString()],
                ],
            ],
            [
                'initial_offer' => 5000000,
                'latest_offer' => 4500000,
                'currency' => 'USD',
                'terms' => [
                    'payment_terms' => 'Net 60',
                    'delivery_time' => '4 weeks',
                    'warranty' => '2 years',
                    'special_conditions' => 'Bulk discount applied',
                ],
                'round' => 3,
                'history' => [
                    ['action' => 'created', 'timestamp' => now()->subDays(10)->toISOString()],
                    ['action' => 'countered', 'timestamp' => now()->subDays(7)->toISOString()],
                    ['action' => 'countered', 'timestamp' => now()->subDays(4)->toISOString()],
                ],
            ],
            [
                'initial_offer' => 10000000,
                'latest_offer' => 10000000,
                'currency' => 'IDR',
                'terms' => [
                    'payment_terms' => 'Net 45',
                    'delivery_time' => '3 weeks',
                ],
                'round' => 1,
                'history' => [
                    ['action' => 'created', 'timestamp' => now()->subDays(2)->toISOString()],
                ],
            ],
        ];

        foreach ($testCases as $index => $testCase) {
            // Create order
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'status' => 'vendor_negotiation',
            ]);

            // Create quote to be accepted
            $acceptedQuote = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $this->vendor1->id,
                'initial_offer' => 2000000,
                'latest_offer' => 2000000,
                'currency' => 'IDR',
                'status' => 'draft',
            ]);

            // Create quote to be rejected with specific data
            $rejectedQuote = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $this->vendor2->id,
                'initial_offer' => $testCase['initial_offer'],
                'latest_offer' => $testCase['latest_offer'],
                'currency' => $testCase['currency'],
                'terms' => $testCase['terms'],
                'round' => $testCase['round'],
                'history' => $testCase['history'],
                'status' => 'draft',
            ]);

            // Store original data before rejection
            $originalData = [
                'tenant_id' => $rejectedQuote->tenant_id,
                'order_id' => $rejectedQuote->order_id,
                'vendor_id' => $rejectedQuote->vendor_id,
                'initial_offer' => $rejectedQuote->initial_offer,
                'latest_offer' => $rejectedQuote->latest_offer,
                'currency' => $rejectedQuote->currency,
                'quote_details' => $rejectedQuote->quote_details,
                'round' => $rejectedQuote->round,
                'history' => $rejectedQuote->history,
                'created_at' => $rejectedQuote->created_at,
            ];

            // Accept the first quote (which should reject the second)
            $response = $this->postJson("/api/v1/tenant/quotes/{$acceptedQuote->uuid}/accept", [], [
                'X-Tenant-ID' => $this->tenant->id,
            ]);

            $response->assertStatus(200);

            // Refresh the rejected quote
            $rejectedQuote->refresh();

            // Property assertion: Status should be changed to 'rejected'
            $this->assertEquals(
                'rejected',
                $rejectedQuote->status,
                "Test case {$index}: Quote status should be 'rejected'"
            );

            // Property assertion: closed_at should be set
            $this->assertNotNull(
                $rejectedQuote->closed_at,
                "Test case {$index}: Quote closed_at should be set"
            );

            // Property assertion: All other data should be preserved
            $this->assertEquals(
                $originalData['tenant_id'],
                $rejectedQuote->tenant_id,
                "Test case {$index}: tenant_id should be preserved"
            );

            $this->assertEquals(
                $originalData['order_id'],
                $rejectedQuote->order_id,
                "Test case {$index}: order_id should be preserved"
            );

            $this->assertEquals(
                $originalData['vendor_id'],
                $rejectedQuote->vendor_id,
                "Test case {$index}: vendor_id should be preserved"
            );

            $this->assertEquals(
                $originalData['initial_offer'],
                $rejectedQuote->initial_offer,
                "Test case {$index}: initial_offer should be preserved"
            );

            $this->assertEquals(
                $originalData['latest_offer'],
                $rejectedQuote->latest_offer,
                "Test case {$index}: latest_offer should be preserved"
            );

            $this->assertEquals(
                $originalData['currency'],
                $rejectedQuote->currency,
                "Test case {$index}: currency should be preserved"
            );

            $this->assertEquals(
                $originalData['quote_details'],
                $rejectedQuote->quote_details,
                "Test case {$index}: quote details should be preserved"
            );

            $this->assertEquals(
                $originalData['round'],
                $rejectedQuote->round,
                "Test case {$index}: round should be preserved"
            );

            $this->assertEquals(
                $originalData['history'],
                $rejectedQuote->history,
                "Test case {$index}: history should be preserved"
            );

            $this->assertEquals(
                $originalData['created_at']->toISOString(),
                $rejectedQuote->created_at->toISOString(),
                "Test case {$index}: created_at should be preserved"
            );

            // Verify the quote still exists in database
            $this->assertDatabaseHas('order_vendor_negotiations', [
                'id' => $rejectedQuote->id,
                'status' => 'rejected',
                'initial_offer' => $originalData['initial_offer'],
                'latest_offer' => $originalData['latest_offer'],
            ]);
        }
    }

    /**
     * Test that rejected quotes can still be queried and displayed
     */
    public function test_rejected_quotes_remain_queryable(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create multiple quotes
        $quote1 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $quote2 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 2000000,
            'latest_offer' => 2000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        $quote3 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor3->id,
            'initial_offer' => 3000000,
            'latest_offer' => 3000000,
            'currency' => 'IDR',
            'status' => 'draft',
        ]);

        // Accept one quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Query all quotes for the order
        $allQuotes = OrderVendorNegotiation::where('order_id', $order->id)->get();
        
        $this->assertCount(3, $allQuotes, 'All 3 quotes should still exist in database');

        // Query rejected quotes specifically
        $rejectedQuotes = OrderVendorNegotiation::where('order_id', $order->id)
            ->where('status', 'rejected')
            ->get();

        $this->assertCount(2, $rejectedQuotes, 'Should have 2 rejected quotes');

        // Verify rejected quotes can be retrieved via API
        $response = $this->getJson("/api/v1/tenant/quotes?order_id={$order->id}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        $this->assertCount(3, $responseData, 'API should return all 3 quotes including rejected ones');

        // Verify rejected quotes have all their data
        $rejectedQuotesFromApi = array_filter($responseData, function($q) {
            return $q['status'] === 'rejected';
        });

        $this->assertCount(2, $rejectedQuotesFromApi, 'API should return 2 rejected quotes');

        foreach ($rejectedQuotesFromApi as $rejectedQuoteData) {
            $this->assertArrayHasKey('quoted_price', $rejectedQuoteData);
            $this->assertArrayHasKey('vendor_name', $rejectedQuoteData);
            $this->assertArrayHasKey('terms', $rejectedQuoteData);
            $this->assertArrayHasKey('created_at', $rejectedQuoteData);
            $this->assertNotNull($rejectedQuoteData['closed_at'], 'Rejected quote should have closed_at');
        }
    }
}
