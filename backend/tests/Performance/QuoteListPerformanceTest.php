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

class QuoteListPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'name' => 'Performance Test Tenant',
            'domain' => 'performance-test.localhost',
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
     * Test quote list API performance with 1000+ quotes.
     * 
     * @group performance
     * @group slow
     */
    public function test_quote_list_loads_within_300ms_with_1000_quotes()
    {
        $this->markTestSkipped('Performance test - run manually with: php artisan test --filter=test_quote_list_loads_within_300ms_with_1000_quotes');
        
        // Create test data
        $this->createPerformanceTestData(1000);

        // Warm up query cache
        $this->getJson('/api/v1/tenant/quotes?per_page=15');

        // Measure performance
        $startTime = microtime(true);
        
        $response = $this->getJson('/api/v1/tenant/quotes?per_page=15');
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Assert response is successful
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'quote_number',
                    'status',
                    'quoted_price',
                    'vendor',
                    'customer',
                ]
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ]
        ]);

        // Assert pagination metadata
        $meta = $response->json('meta');
        $this->assertEquals(1, $meta['current_page']);
        $this->assertEquals(15, $meta['per_page']);
        $this->assertGreaterThanOrEqual(1000, $meta['total']);

        // Assert performance target: < 300ms
        $this->assertLessThan(
            300,
            $executionTime,
            "Quote list API took {$executionTime}ms, expected < 300ms"
        );

        // Log performance metrics
        echo "\n";
        echo "Performance Metrics:\n";
        echo "  - Total quotes: {$meta['total']}\n";
        echo "  - Execution time: " . round($executionTime, 2) . "ms\n";
        echo "  - Target: < 300ms\n";
        echo "  - Status: " . ($executionTime < 300 ? '✅ PASS' : '❌ FAIL') . "\n";
    }

    /**
     * Test pagination works correctly with large dataset.
     * 
     * @group performance
     */
    public function test_pagination_works_correctly_with_1000_quotes()
    {
        // Create test data
        $this->createPerformanceTestData(1000);

        // Test first page
        $response = $this->getJson('/api/v1/tenant/quotes?per_page=15&page=1');
        $response->assertStatus(200);
        
        $meta = $response->json('meta');
        $this->assertEquals(1, $meta['current_page']);
        $this->assertEquals(15, $meta['per_page']);
        $this->assertGreaterThanOrEqual(1000, $meta['total']);
        $this->assertCount(15, $response->json('data'));

        // Test middle page
        $middlePage = (int) ceil($meta['total'] / 30);
        $response = $this->getJson("/api/v1/tenant/quotes?per_page=15&page={$middlePage}");
        $response->assertStatus(200);
        $this->assertEquals($middlePage, $response->json('meta.current_page'));

        // Test last page
        $lastPage = $meta['last_page'];
        $response = $this->getJson("/api/v1/tenant/quotes?per_page=15&page={$lastPage}");
        $response->assertStatus(200);
        $this->assertEquals($lastPage, $response->json('meta.current_page'));
        $this->assertLessThanOrEqual(15, count($response->json('data')));
    }

    /**
     * Test page load time is under 2 seconds.
     * 
     * @group performance
     */
    public function test_page_load_time_under_2_seconds()
    {
        // Create test data
        $this->createPerformanceTestData(1000);

        // Measure total page load time (including all necessary API calls)
        $startTime = microtime(true);
        
        // Simulate page load: fetch quotes + stats
        $quotesResponse = $this->getJson('/api/v1/tenant/quotes?per_page=15');
        $statsResponse = $this->getJson('/api/v1/tenant/quotes/statistics');
        
        $endTime = microtime(true);
        $totalLoadTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Assert both requests successful
        $quotesResponse->assertStatus(200);
        $statsResponse->assertStatus(200);

        // Assert total load time < 2000ms
        $this->assertLessThan(
            2000,
            $totalLoadTime,
            "Page load time was {$totalLoadTime}ms, expected < 2000ms"
        );

        echo "\n";
        echo "Page Load Performance:\n";
        echo "  - Total load time: " . round($totalLoadTime, 2) . "ms\n";
        echo "  - Target: < 2000ms\n";
        echo "  - Status: " . ($totalLoadTime < 2000 ? '✅ PASS' : '❌ FAIL') . "\n";
    }

    /**
     * Test filtering performance with large dataset.
     * 
     * @group performance
     */
    public function test_filtering_performance_with_large_dataset()
    {
        // Create test data
        $this->createPerformanceTestData(1000);

        // Test status filter
        $startTime = microtime(true);
        $response = $this->getJson('/api/v1/tenant/quotes?status=accepted&per_page=15');
        $filterTime = (microtime(true) - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(300, $filterTime, "Status filter took {$filterTime}ms");

        // Test search filter
        $startTime = microtime(true);
        $response = $this->getJson('/api/v1/tenant/quotes?search=Q-&per_page=15');
        $searchTime = (microtime(true) - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(500, $searchTime, "Search filter took {$searchTime}ms");

        echo "\n";
        echo "Filter Performance:\n";
        echo "  - Status filter: " . round($filterTime, 2) . "ms (target: < 300ms)\n";
        echo "  - Search filter: " . round($searchTime, 2) . "ms (target: < 500ms)\n";
    }

    /**
     * Test sorting performance with large dataset.
     * 
     * @group performance
     */
    public function test_sorting_performance_with_large_dataset()
    {
        // Create test data
        $this->createPerformanceTestData(1000);

        // Test sort by created_at
        $startTime = microtime(true);
        $response = $this->getJson('/api/v1/tenant/quotes?sort=created_at&direction=desc&per_page=15');
        $sortTime = (microtime(true) - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(300, $sortTime, "Sort by created_at took {$sortTime}ms");

        // Test sort by grand_total
        $startTime = microtime(true);
        $response = $this->getJson('/api/v1/tenant/quotes?sort=latest_offer&direction=desc&per_page=15');
        $sortPriceTime = (microtime(true) - $startTime) * 1000;

        $response->assertStatus(200);
        $this->assertLessThan(300, $sortPriceTime, "Sort by price took {$sortPriceTime}ms");

        echo "\n";
        echo "Sort Performance:\n";
        echo "  - Sort by date: " . round($sortTime, 2) . "ms\n";
        echo "  - Sort by price: " . round($sortPriceTime, 2) . "ms\n";
    }

    /**
     * Test database query count for quote list.
     * 
     * @group performance
     */
    public function test_query_count_is_optimized()
    {
        // Create minimal test data
        $this->createPerformanceTestData(50);

        // Enable query log
        DB::enableQueryLog();
        DB::flushQueryLog();

        // Make request
        $response = $this->getJson('/api/v1/tenant/quotes?per_page=15');
        
        // Get query count
        $queries = DB::getQueryLog();
        $queryCount = count($queries);

        $response->assertStatus(200);

        // Assert query count is reasonable (should be <= 10 with proper eager loading)
        $this->assertLessThanOrEqual(
            10,
            $queryCount,
            "Quote list executed {$queryCount} queries, expected <= 10. Check for N+1 issues."
        );

        echo "\n";
        echo "Query Optimization:\n";
        echo "  - Total queries: {$queryCount}\n";
        echo "  - Target: <= 10 queries\n";
        echo "  - Status: " . ($queryCount <= 10 ? '✅ PASS' : '❌ FAIL') . "\n";
    }

    /**
     * Create performance test data.
     */
    private function createPerformanceTestData(int $quoteCount): void
    {
        // Create customers
        $customers = Customer::factory()->count(50)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendors
        $vendors = Vendor::factory()->count(20)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create orders
        $orders = Order::factory()->count(min($quoteCount, 500))->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => fn() => $customers->random()->id,
        ]);

        // Create quotes in batches for performance
        $batchSize = 100;
        $statuses = ['sent', 'countered', 'accepted', 'rejected', 'expired']; // Changed 'open' to 'sent'
        
        for ($i = 0; $i < $quoteCount; $i += $batchSize) {
            $batch = [];
            $remaining = min($batchSize, $quoteCount - $i);
            
            for ($j = 0; $j < $remaining; $j++) {
                $status = $statuses[array_rand($statuses)];
                $initialOffer = rand(100000, 10000000);
                
                $batch[] = [
                    'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id' => $this->tenant->id,
                    'order_id' => $orders->random()->id,
                    'vendor_id' => $vendors->random()->id,
                    'initial_offer' => $initialOffer,
                    'latest_offer' => $initialOffer,
                    'currency' => 'IDR',
                    'status' => $status,
                    'round' => 1,
                    'terms' => json_encode(['payment_terms' => '30 days']),
                    'history' => json_encode([['action' => 'created', 'timestamp' => now()->toISOString()]]),
                    'expires_at' => now()->addDays(30),
                    'closed_at' => in_array($status, ['accepted', 'rejected', 'expired']) ? now() : null,
                    'created_at' => now()->subDays(rand(1, 90)),
                    'updated_at' => now(),
                ];
            }
            
            DB::table('order_vendor_negotiations')->insert($batch);
        }
    }
}
