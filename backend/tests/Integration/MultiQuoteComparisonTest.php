<?php

namespace Tests\Integration;

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
 * Integration Test for Multi-Quote Comparison Scenario
 * 
 * This test validates the workflow for comparing multiple vendor quotes
 * and ensuring proper handling when one quote is accepted.
 * 
 * Test Scenario:
 * 1. Create multiple quotes for same order
 * 2. Compare quotes (price, lead time, terms)
 * 3. Accept best quote
 * 4. Verify other quotes rejected
 * 
 * Validates: Requirements 7.1, 7.2, 7.3
 */
class MultiQuoteComparisonTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private array $vendors;
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

        // Create multiple vendors for comparison
        $this->vendors = [
            Vendor::factory()->create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Vendor A - Premium',
            ]),
            Vendor::factory()->create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Vendor B - Budget',
            ]),
            Vendor::factory()->create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Vendor C - Fast',
            ]),
        ];

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);
    }

    /**
     * Test creating and comparing multiple quotes for same order
     * 
     * @test
     * Validates: Requirements 7.1, 7.2
     */
    public function it_creates_and_compares_multiple_vendor_quotes(): void
    {
        // ============================================================
        // STEP 1: Create order in vendor_negotiation stage
        // ============================================================
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // ============================================================
        // STEP 2: Create multiple quotes with different characteristics
        // ============================================================
        
        // Vendor A: Premium quality, higher price, longer lead time
        $quoteAData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[0]->uuid,
            'initial_offer' => 1200.00, // IDR 12,000
            'currency' => 'IDR',
            'terms' => [
                'payment_terms' => 'Net 45',
                'quality_guarantee' => 'Premium',
                'warranty' => '2 years',
            ],
            'lead_time_days' => 21,
        ];

        // Vendor B: Budget option, lowest price, standard lead time
        $quoteBData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[1]->uuid,
            'initial_offer' => 900.00, // IDR 9,000 (best price)
            'currency' => 'IDR',
            'terms' => [
                'payment_terms' => 'Net 30',
                'quality_guarantee' => 'Standard',
                'warranty' => '1 year',
            ],
            'lead_time_days' => 14,
        ];

        // Vendor C: Fast delivery, moderate price, shortest lead time
        $quoteCData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[2]->uuid,
            'initial_offer' => 1050.00, // IDR 10,500
            'currency' => 'IDR',
            'terms' => [
                'payment_terms' => 'Net 15',
                'quality_guarantee' => 'Standard',
                'warranty' => '1 year',
                'express_delivery' => true,
            ],
            'lead_time_days' => 7, // Fastest delivery
        ];

        // Create all quotes
        $responseA = $this->postJson('/api/v1/tenant/quotes', $quoteAData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $responseB = $this->postJson('/api/v1/tenant/quotes', $quoteBData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $responseC = $this->postJson('/api/v1/tenant/quotes', $quoteCData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $responseA->assertStatus(201);
        $responseB->assertStatus(201);
        $responseC->assertStatus(201);

        $quoteAId = $responseA->json('data.id');
        $quoteBId = $responseB->json('data.id');
        $quoteCId = $responseC->json('data.id');

        // ============================================================
        // STEP 3: Verify all quotes are visible for comparison
        // ============================================================
        
        // Fetch all quotes for the order
        $quotesResponse = $this->getJson(
            "/api/v1/tenant/quotes?order_id={$order->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $quotesResponse->assertStatus(200);
        $quotes = $quotesResponse->json('data');

        // Verify all 3 quotes are returned
        $this->assertCount(3, $quotes, 'Should display all quotes regardless of status');

        // Verify all quotes have 'open' status
        foreach ($quotes as $quote) {
            $this->assertEquals('open', $quote['status']);
        }

        // ============================================================
        // STEP 4: Compare quotes by different criteria
        // ============================================================
        
        // Extract quote data for comparison
        $quoteA = collect($quotes)->firstWhere('id', $quoteAId);
        $quoteB = collect($quotes)->firstWhere('id', $quoteBId);
        $quoteC = collect($quotes)->firstWhere('id', $quoteCId);

        // Compare prices
        $this->assertEquals(1200.00, $quoteA['quoted_price']);
        $this->assertEquals(900.00, $quoteB['quoted_price']); // Lowest price
        $this->assertEquals(1050.00, $quoteC['quoted_price']);

        // Compare lead times
        $this->assertEquals(21, $quoteA['lead_time_days']);
        $this->assertEquals(14, $quoteB['lead_time_days']);
        $this->assertEquals(7, $quoteC['lead_time_days']); // Fastest delivery

        // Compare terms
        $this->assertArrayHasKey('terms', $quoteA);
        $this->assertArrayHasKey('terms', $quoteB);
        $this->assertArrayHasKey('terms', $quoteC);

        // Verify order shows 3 active quotes
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $this->assertEquals(3, $orderResponse->json('data.active_quotes'));
    }

    /**
     * Test accepting best quote and verifying other quotes are rejected
     * 
     * @test
     * Validates: Requirement 7.3
     */
    public function it_rejects_other_quotes_when_one_is_accepted(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create multiple quotes
        $quotes = [];
        foreach ($this->vendors as $index => $vendor) {
            $quoteData = [
                'order_id' => $order->uuid,
                'vendor_id' => $vendor->uuid,
                'initial_offer' => 1000.00 + ($index * 100), // Varying prices
                'currency' => 'IDR',
                'terms' => ['payment_terms' => 'Net 30'],
                'lead_time_days' => 14,
            ];

            $response = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
                'X-Tenant-ID' => $this->tenant->id,
            ]);

            $response->assertStatus(201);
            $quotes[] = [
                'id' => $response->json('data.id'),
                'vendor_id' => $vendor->id,
            ];
        }

        // Verify all quotes are open
        foreach ($quotes as $quote) {
            $dbQuote = OrderVendorNegotiation::where('uuid', $quote['id'])->first();
            $this->assertEquals('open', $dbQuote->status);
        }

        // ============================================================
        // Accept the first quote (best choice for this scenario)
        // ============================================================
        
        $acceptedQuoteId = $quotes[0]['id'];
        $acceptResponse = $this->postJson(
            "/api/v1/tenant/quotes/{$acceptedQuoteId}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $acceptResponse->assertStatus(200);

        // ============================================================
        // Verify accepted quote status
        // ============================================================
        
        $acceptedQuote = OrderVendorNegotiation::where('uuid', $acceptedQuoteId)->first();
        $this->assertEquals('accepted', $acceptedQuote->status);
        $this->assertNotNull($acceptedQuote->closed_at);

        // ============================================================
        // Verify other quotes are automatically rejected
        // ============================================================
        
        for ($i = 1; $i < count($quotes); $i++) {
            $rejectedQuote = OrderVendorNegotiation::where('uuid', $quotes[$i]['id'])->first();
            
            $this->assertEquals(
                'rejected',
                $rejectedQuote->status,
                "Quote {$quotes[$i]['id']} should be rejected when another quote is accepted"
            );
        }

        // Verify order has no more active quotes
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $this->assertEquals(0, $orderResponse->json('data.active_quotes'));
        $this->assertEquals($acceptedQuoteId, $orderResponse->json('data.accepted_quote'));
    }

    /**
     * Test that rejected quotes preserve all data for historical reference
     * 
     * @test
     * Validates: Requirement 7.4
     */
    public function it_preserves_rejected_quote_data_for_history(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create two quotes with detailed data
        $quote1Data = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[0]->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'terms' => [
                'payment_terms' => 'Net 30',
                'delivery_method' => 'Express',
                'special_notes' => 'Premium quality materials',
            ],
            'lead_time_days' => 14,
        ];

        $quote2Data = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[1]->uuid,
            'initial_offer' => 950.00,
            'currency' => 'IDR',
            'terms' => [
                'payment_terms' => 'Net 45',
                'delivery_method' => 'Standard',
                'special_notes' => 'Budget-friendly option',
            ],
            'lead_time_days' => 21,
        ];

        $response1 = $this->postJson('/api/v1/tenant/quotes', $quote1Data, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $response2 = $this->postJson('/api/v1/tenant/quotes', $quote2Data, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $quote1Id = $response1->json('data.id');
        $quote2Id = $response2->json('data.id');

        // Store original quote data before acceptance
        $originalQuote1 = OrderVendorNegotiation::where('uuid', $quote1Id)->first();
        $originalQuote1Data = [
            'initial_offer' => $originalQuote1->initial_offer,
            'latest_offer' => $originalQuote1->latest_offer,
            'terms' => $originalQuote1->terms,
            'lead_time_days' => $originalQuote1->lead_time_days,
            'vendor_id' => $originalQuote1->vendor_id,
        ];

        // Accept quote 2
        $acceptResponse = $this->postJson(
            "/api/v1/tenant/quotes/{$quote2Id}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $acceptResponse->assertStatus(200);

        // ============================================================
        // Verify rejected quote data is preserved
        // ============================================================
        
        $rejectedQuote = OrderVendorNegotiation::where('uuid', $quote1Id)->first();

        // Verify status changed to rejected
        $this->assertEquals('rejected', $rejectedQuote->status);

        // Verify all original data is preserved
        $this->assertEquals(
            $originalQuote1Data['initial_offer'],
            $rejectedQuote->initial_offer,
            'Initial offer should be preserved'
        );

        $this->assertEquals(
            $originalQuote1Data['latest_offer'],
            $rejectedQuote->latest_offer,
            'Latest offer should be preserved'
        );

        $this->assertEquals(
            $originalQuote1Data['terms'],
            $rejectedQuote->terms,
            'Terms should be preserved'
        );

        $this->assertEquals(
            $originalQuote1Data['lead_time_days'],
            $rejectedQuote->lead_time_days,
            'Lead time should be preserved'
        );

        $this->assertEquals(
            $originalQuote1Data['vendor_id'],
            $rejectedQuote->vendor_id,
            'Vendor ID should be preserved'
        );

        // Verify quote is still in database
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'uuid' => $quote1Id,
            'status' => 'rejected',
            'order_id' => $order->id,
        ]);
    }

    /**
     * Test viewing quote history with negotiation rounds
     * 
     * @test
     * Validates: Requirement 7.5
     */
    public function it_displays_quote_history_with_negotiation_rounds(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quote with negotiation history
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendors[0]->id,
            'initial_offer' => 1000000, // IDR 10,000 in cents
            'latest_offer' => 900000,   // IDR 9,000 in cents (after negotiation)
            'currency' => 'IDR',
            'status' => 'countered',
            'round' => 2,
            'history' => [
                [
                    'round' => 1,
                    'offer' => 1000000,
                    'timestamp' => now()->subDays(2)->toIso8601String(),
                    'action' => 'initial_offer',
                ],
                [
                    'round' => 2,
                    'offer' => 900000,
                    'timestamp' => now()->subDay()->toIso8601String(),
                    'action' => 'counter_offer',
                ],
            ],
        ]);

        // Fetch quote via API
        $quoteResponse = $this->getJson(
            "/api/v1/tenant/quotes/{$quote->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $quoteResponse->assertStatus(200);
        $quoteData = $quoteResponse->json('data');

        // Verify negotiation history is included
        $this->assertArrayHasKey('history', $quoteData);
        $this->assertCount(2, $quoteData['history']);

        // Verify round information
        $this->assertEquals(2, $quoteData['round']);

        // Verify status changes are tracked
        $this->assertEquals('countered', $quoteData['status']);
    }

    /**
     * Test comparing quotes with different currencies (edge case)
     * 
     * @test
     */
    public function it_handles_quotes_with_different_currencies(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quotes with different currencies
        $quoteIDRData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[0]->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $quoteUSDData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendors[1]->uuid,
            'initial_offer' => 100.00,
            'currency' => 'USD',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $responseIDR = $this->postJson('/api/v1/tenant/quotes', $quoteIDRData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $responseUSD = $this->postJson('/api/v1/tenant/quotes', $quoteUSDData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $responseIDR->assertStatus(201);
        $responseUSD->assertStatus(201);

        // Fetch all quotes
        $quotesResponse = $this->getJson(
            "/api/v1/tenant/quotes?order_id={$order->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $quotes = $quotesResponse->json('data');
        $this->assertCount(2, $quotes);

        // Verify currencies are preserved
        $quoteIDR = collect($quotes)->firstWhere('currency', 'IDR');
        $quoteUSD = collect($quotes)->firstWhere('currency', 'USD');

        $this->assertNotNull($quoteIDR);
        $this->assertNotNull($quoteUSD);
        $this->assertEquals('IDR', $quoteIDR['currency']);
        $this->assertEquals('USD', $quoteUSD['currency']);
    }

    /**
     * Test that only open and countered quotes count as active
     * 
     * @test
     */
    public function it_counts_only_open_and_countered_quotes_as_active(): void
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
            'vendor_id' => $this->vendors[0]->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        $counteredQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendors[1]->id,
            'initial_offer' => 950000,
            'latest_offer' => 900000,
            'currency' => 'IDR',
            'status' => 'countered',
        ]);

        $expiredQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendors[2]->id,
            'initial_offer' => 1100000,
            'latest_offer' => 1100000,
            'currency' => 'IDR',
            'status' => 'expired',
        ]);

        // Fetch order
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Should count only open and countered quotes
        $this->assertEquals(2, $orderResponse->json('data.active_quotes'));
    }
}
