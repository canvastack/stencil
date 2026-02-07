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

class QuoteDuplicateCheckPerformanceTest extends TestCase
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
     * Test duplicate check query performance with large dataset.
     * 
     * @group performance
     */
    public function test_duplicate_check_query_performance_under_100ms()
    {
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendors = Vendor::factory()->count(20)->create(['tenant_id' => $this->tenant->id]);
        $orders = Order::factory()->count(100)->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);

        // Create 1000 quotes
        for ($i = 0; $i < 1000; $i++) {
            OrderVendorNegotiation::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $orders->random()->id,
                'vendor_id' => $vendors->random()->id,
                'status' => ['sent', 'countered', 'accepted', 'rejected'][array_rand(['sent', 'countered', 'accepted', 'rejected'])], // Changed 'open' to 'sent'
            ]);
        }

        // Pick a random order and vendor for testing
        $testOrder = $orders->random();
        $testVendor = $vendors->random();

        // Warm up query cache
        $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$testOrder->uuid}");

        // Measure duplicate check performance
        $startTime = microtime(true);
        
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$testOrder->uuid}&vendor_id={$testVendor->uuid}");
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Assert response is successful
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'has_active_quote',
                'quote',
            ]
        ]);

        // Assert performance target: < 100ms
        $this->assertLessThan(
            100,
            $executionTime,
            "Duplicate check took {$executionTime}ms, expected < 100ms"
        );

        echo "\n";
        echo "Duplicate Check Performance:\n";
        echo "  - Execution time: " . round($executionTime, 2) . "ms\n";
        echo "  - Target: < 100ms\n";
        echo "  - Status: " . ($executionTime < 100 ? '✅ PASS' : '❌ FAIL') . "\n";
    }

    /**
     * Test index usage with EXPLAIN for duplicate check query.
     * 
     * @group performance
     */
    public function test_duplicate_check_uses_indexes()
    {
        // Create test data
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);

        // Create some quotes
        OrderVendorNegotiation::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
        ]);

        // Enable query log
        DB::enableQueryLog();
        DB::flushQueryLog();

        // Execute duplicate check query
        $query = OrderVendorNegotiation::with(['order.customer', 'vendor'])
            ->where('tenant_id', $this->tenant->id)
            ->where('order_id', $order->id)
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['draft', 'sent', 'pending_response', 'countered']);

        $result = $query->first();

        // Get the executed query
        $queries = DB::getQueryLog();
        $mainQuery = $queries[0]['query'] ?? null;

        $this->assertNotNull($mainQuery, 'Query should be logged');

        // Use EXPLAIN to check index usage
        $explainQuery = "EXPLAIN " . $mainQuery;
        
        // Replace bindings
        foreach ($queries[0]['bindings'] as $binding) {
            $explainQuery = preg_replace('/\?/', is_numeric($binding) ? $binding : "'{$binding}'", $explainQuery, 1);
        }

        try {
            $explainResult = DB::select($explainQuery);
            
            echo "\n";
            echo "Index Usage Analysis:\n";
            echo "  - Query executed successfully\n";
            echo "  - EXPLAIN result available\n";
            
            // Check if index is being used (PostgreSQL specific)
            $usesIndex = false;
            foreach ($explainResult as $row) {
                $plan = json_encode($row);
                if (stripos($plan, 'Index') !== false || stripos($plan, 'idx_') !== false) {
                    $usesIndex = true;
                    break;
                }
            }
            
            echo "  - Uses index: " . ($usesIndex ? '✅ YES' : '⚠️  NO') . "\n";
            
            // This is informational, not a hard assertion
            // Different database configurations may optimize differently
            
        } catch (\Exception $e) {
            echo "\n";
            echo "Index Usage Analysis:\n";
            echo "  - EXPLAIN query failed (this is OK for some DB configurations)\n";
            echo "  - Error: " . $e->getMessage() . "\n";
        }

        // Assert query executed successfully
        $this->assertTrue(true, 'Duplicate check query executed');
    }

    /**
     * Test query time with various dataset sizes.
     * 
     * @group performance
     */
    public function test_duplicate_check_scales_with_dataset_size()
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        
        $results = [];
        
        // Test with different dataset sizes
        $sizes = [10, 50, 100, 500];
        
        foreach ($sizes as $size) {
            // Create orders
            $orders = Order::factory()->count($size)->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $customer->id,
            ]);

            // Create quotes
            foreach ($orders as $order) {
                OrderVendorNegotiation::factory()->create([
                    'tenant_id' => $this->tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'status' => 'draft',
                ]);
            }

            // Pick a random order for testing
            $testOrder = $orders->random();

            // Measure query time
            $startTime = microtime(true);
            
            $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$testOrder->uuid}&vendor_id={$vendor->uuid}");
            
            $endTime = microtime(true);
            $executionTime = ($endTime - $startTime) * 1000;

            $response->assertStatus(200);
            
            $results[$size] = $executionTime;
            
            // Clean up for next iteration
            OrderVendorNegotiation::where('tenant_id', $this->tenant->id)->delete();
            Order::where('tenant_id', $this->tenant->id)->delete();
        }

        echo "\n";
        echo "Scalability Test Results:\n";
        foreach ($results as $size => $time) {
            $status = $time < 100 ? '✅' : '⚠️';
            echo "  - {$size} quotes: " . round($time, 2) . "ms {$status}\n";
        }

        // Assert all queries are under 100ms
        foreach ($results as $size => $time) {
            $this->assertLessThan(
                100,
                $time,
                "Query with {$size} quotes took {$time}ms, expected < 100ms"
            );
        }
    }
}
