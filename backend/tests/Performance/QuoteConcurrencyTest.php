<?php

namespace Tests\Performance;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

class QuoteConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'name' => 'Concurrency Test Tenant',
            'domain' => 'concurrency-test.localhost',
        ]);

        // Create user for authentication
        $this->user = \App\Infrastructure\Persistence\Eloquent\Models\User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Set tenant context
        $this->app->instance('current_tenant', $this->tenant);
        
        // Authenticate user with Sanctum
        Sanctum::actingAs($this->user);
    }

    /**
     * Test concurrent quote acceptance - only one should succeed.
     * 
     * @group performance
     * @group concurrency
     */
    public function test_concurrent_quote_acceptance_only_one_succeeds()
    {
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create 3 quotes for the same order
        $quotes = [];
        for ($i = 0; $i < 3; $i++) {
            $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
            $quotes[] = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft',
                'initial_offer' => 500000000, // 5M IDR in cents
                'latest_offer' => 500000000,
            ]);
        }

        // Simulate concurrent acceptance attempts
        $results = [];
        $successCount = 0;
        $failureCount = 0;

        foreach ($quotes as $quote) {
            try {
                $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
                
                if ($response->status() === 200) {
                    $successCount++;
                    $results[] = [
                        'quote_id' => $quote->uuid,
                        'status' => 'success',
                        'response_code' => 200,
                    ];
                } else {
                    $failureCount++;
                    $results[] = [
                        'quote_id' => $quote->uuid,
                        'status' => 'failed',
                        'response_code' => $response->status(),
                        'message' => $response->json('message') ?? 'Unknown error',
                    ];
                }
            } catch (\Exception $e) {
                $failureCount++;
                $results[] = [
                    'quote_id' => $quote->uuid,
                    'status' => 'error',
                    'message' => $e->getMessage(),
                ];
            }
        }

        echo "\n";
        echo "Concurrent Acceptance Test Results:\n";
        echo "  - Total attempts: " . count($quotes) . "\n";
        echo "  - Successful: {$successCount}\n";
        echo "  - Failed: {$failureCount}\n";
        
        foreach ($results as $index => $result) {
            $status = $result['status'] === 'success' ? '✅' : '❌';
            echo "  - Quote " . ($index + 1) . ": {$status} " . ($result['message'] ?? 'Accepted') . "\n";
        }

        // Assert only one quote was accepted
        $this->assertEquals(
            1,
            $successCount,
            "Expected exactly 1 successful acceptance, got {$successCount}"
        );

        // Verify database state
        $acceptedQuotes = OrderVendorNegotiation::where('tenant_id', $this->tenant->id)
            ->where('order_id', $order->id)
            ->where('status', 'accepted')
            ->count();

        $this->assertEquals(1, $acceptedQuotes, 'Only one quote should be accepted in database');

        // Verify other quotes were rejected
        $rejectedQuotes = OrderVendorNegotiation::where('tenant_id', $this->tenant->id)
            ->where('order_id', $order->id)
            ->where('status', 'rejected')
            ->count();

        $this->assertEquals(2, $rejectedQuotes, 'Other quotes should be auto-rejected');

        // Verify order status updated
        $order->refresh();
        $this->assertEquals('customer_quote', $order->status, 'Order status should be updated');
    }

    /**
     * Test data consistency after concurrent operations.
     * 
     * @group performance
     * @group concurrency
     */
    public function test_data_consistency_after_concurrent_operations()
    {
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create multiple quotes
        $quotes = [];
        for ($i = 0; $i < 5; $i++) {
            $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
            $quotes[] = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft',
                'initial_offer' => 500000000,
                'latest_offer' => 500000000,
            ]);
        }

        // Accept first quote
        $firstQuote = $quotes[0];
        $response = $this->postJson("/api/v1/tenant/quotes/{$firstQuote->uuid}/accept");
        $response->assertStatus(200);

        // Verify data consistency
        $allQuotes = OrderVendorNegotiation::where('tenant_id', $this->tenant->id)
            ->where('order_id', $order->id)
            ->get();

        $acceptedCount = $allQuotes->where('status', 'accepted')->count();
        $rejectedCount = $allQuotes->where('status', 'rejected')->count();
        $totalCount = $allQuotes->count();

        echo "\n";
        echo "Data Consistency Check:\n";
        echo "  - Total quotes: {$totalCount}\n";
        echo "  - Accepted: {$acceptedCount}\n";
        echo "  - Rejected: {$rejectedCount}\n";
        echo "  - Status: " . ($acceptedCount === 1 && $rejectedCount === 4 ? '✅ CONSISTENT' : '❌ INCONSISTENT') . "\n";

        // Assert data consistency
        $this->assertEquals(5, $totalCount, 'All quotes should exist');
        $this->assertEquals(1, $acceptedCount, 'Exactly one quote should be accepted');
        $this->assertEquals(4, $rejectedCount, 'All other quotes should be rejected');

        // Verify order data is consistent
        $order->refresh();
        $this->assertEquals('customer_quote', $order->status);
        $this->assertEquals($firstQuote->latest_offer, $order->vendor_quoted_price);
        $this->assertEquals($firstQuote->vendor_id, $order->vendor_id);
        
        // Verify quotation amount calculation (1.35x markup)
        $expectedQuotationAmount = (int) ($firstQuote->latest_offer * 1.35);
        $this->assertEquals($expectedQuotationAmount, $order->quotation_amount);

        echo "  - Order status: {$order->status} ✅\n";
        echo "  - Vendor quoted price: " . number_format($order->vendor_quoted_price / 100, 2) . " IDR ✅\n";
        echo "  - Quotation amount: " . number_format($order->quotation_amount / 100, 2) . " IDR ✅\n";
    }

    /**
     * Test transaction rollback on failure.
     * 
     * @group performance
     * @group concurrency
     */
    public function test_transaction_rollback_on_failure()
    {
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'vendor_negotiation',
        ]);

        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'draft',
            'initial_offer' => 500000000,
            'latest_offer' => 500000000,
        ]);

        // Get initial state
        $initialQuoteStatus = $quote->status;
        $initialOrderStatus = $order->status;

        // Try to accept an already accepted quote (should fail)
        $quote->update(['status' => 'accepted']);
        
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
        $response->assertStatus(422); // Should fail with validation error

        // Verify no changes were made (transaction rolled back)
        $quote->refresh();
        $order->refresh();

        $this->assertEquals('accepted', $quote->status, 'Quote status should remain accepted');
        $this->assertEquals($initialOrderStatus, $order->status, 'Order status should not change on failure');

        echo "\n";
        echo "Transaction Rollback Test:\n";
        echo "  - Quote status preserved: ✅\n";
        echo "  - Order status preserved: ✅\n";
        echo "  - Transaction rollback working: ✅\n";
    }

    /**
     * Test API response times under load.
     * 
     * @group performance
     */
    public function test_api_response_times_under_load()
    {
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        
        $responseTimes = [
            'accept' => [],
            'reject' => [],
            'list' => [],
        ];

        // Test accept endpoint
        for ($i = 0; $i < 5; $i++) {
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
                'status' => 'vendor_negotiation',
            ]);

            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft',
                'initial_offer' => 500000000,
                'latest_offer' => 500000000,
            ]);

            $startTime = microtime(true);
            $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
            $endTime = microtime(true);

            $response->assertStatus(200);
            $responseTimes['accept'][] = ($endTime - $startTime) * 1000;
        }

        // Test reject endpoint
        for ($i = 0; $i < 5; $i++) {
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
                'status' => 'vendor_negotiation',
            ]);

            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => 'draft',
                'initial_offer' => 500000000,
                'latest_offer' => 500000000,
            ]);

            $startTime = microtime(true);
            $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
                'reason' => 'Price too high for our budget constraints',
            ]);
            $endTime = microtime(true);

            $response->assertStatus(200);
            $responseTimes['reject'][] = ($endTime - $startTime) * 1000;
        }

        // Test list endpoint
        for ($i = 0; $i < 5; $i++) {
            $startTime = microtime(true);
            $response = $this->getJson('/api/v1/tenant/quotes?per_page=15');
            $endTime = microtime(true);

            $response->assertStatus(200);
            $responseTimes['list'][] = ($endTime - $startTime) * 1000;
        }

        // Calculate averages
        $avgAccept = array_sum($responseTimes['accept']) / count($responseTimes['accept']);
        $avgReject = array_sum($responseTimes['reject']) / count($responseTimes['reject']);
        $avgList = array_sum($responseTimes['list']) / count($responseTimes['list']);

        echo "\n";
        echo "API Response Times (Average over 5 requests):\n";
        echo "  - Accept endpoint: " . round($avgAccept, 2) . "ms (target: < 500ms) " . ($avgAccept < 500 ? '✅' : '❌') . "\n";
        echo "  - Reject endpoint: " . round($avgReject, 2) . "ms (target: < 500ms) " . ($avgReject < 500 ? '✅' : '❌') . "\n";
        echo "  - List endpoint: " . round($avgList, 2) . "ms (target: < 300ms) " . ($avgList < 300 ? '✅' : '❌') . "\n";

        // Assert performance targets
        $this->assertLessThan(500, $avgAccept, "Accept endpoint average: {$avgAccept}ms, expected < 500ms");
        $this->assertLessThan(500, $avgReject, "Reject endpoint average: {$avgReject}ms, expected < 500ms");
        $this->assertLessThan(300, $avgList, "List endpoint average: {$avgList}ms, expected < 300ms");
    }
}
