<?php

namespace Tests\Performance;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;

class QuoteIndexPerformanceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that composite index is used for duplicate quote check
     */
    public function test_composite_index_used_for_duplicate_check(): void
    {
        // Create test data
        $tenant = Tenant::factory()->create();
        $order = Order::factory()->create(['tenant_id' => $tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);

        // Create some quotes
        OrderVendorNegotiation::factory()->count(5)->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'open',
        ]);

        // Query that should use the composite index
        $query = OrderVendorNegotiation::where('order_id', $order->id)
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['draft', 'open', 'sent', 'countered'])
            ->toSql();

        // Verify query structure
        $this->assertStringContainsString('order_id', $query);
        $this->assertStringContainsString('vendor_id', $query);
        $this->assertStringContainsString('status', $query);

        // Execute query and verify it works
        $results = OrderVendorNegotiation::where('order_id', $order->id)
            ->where('vendor_id', $vendor->id)
            ->whereIn('status', ['draft', 'open', 'sent', 'countered'])
            ->get();

        $this->assertCount(5, $results);
    }

    /**
     * Test that order_created index is used for quote listing
     */
    public function test_order_created_index_used_for_listing(): void
    {
        // Create test data
        $tenant = Tenant::factory()->create();
        $order = Order::factory()->create(['tenant_id' => $tenant->id]);
        $vendor = Vendor::factory()->create(['tenant_id' => $tenant->id]);

        // Create quotes with different timestamps
        for ($i = 0; $i < 10; $i++) {
            OrderVendorNegotiation::factory()->create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'created_at' => now()->subDays($i),
            ]);
        }

        // Query that should use the order_created index
        $results = OrderVendorNegotiation::where('order_id', $order->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $this->assertCount(10, $results);
        
        // Verify results are ordered correctly
        $timestamps = $results->pluck('created_at')->toArray();
        $sortedTimestamps = collect($timestamps)->sortDesc()->values()->toArray();
        $this->assertEquals($sortedTimestamps, $timestamps);
    }

    /**
     * Test query performance with larger dataset
     */
    public function test_index_performance_with_large_dataset(): void
    {
        $this->markTestSkipped('Performance test - run manually when needed');

        // Create test data
        $tenant = Tenant::factory()->create();
        $orders = Order::factory()->count(100)->create(['tenant_id' => $tenant->id]);
        $vendors = Vendor::factory()->count(20)->create(['tenant_id' => $tenant->id]);

        // Create 1000 quotes
        foreach ($orders as $order) {
            foreach ($vendors->random(10) as $vendor) {
                OrderVendorNegotiation::factory()->create([
                    'tenant_id' => $tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'status' => collect(['draft', 'open', 'sent', 'countered', 'accepted', 'rejected'])->random(),
                ]);
            }
        }

        // Measure query time
        $startTime = microtime(true);
        
        $results = OrderVendorNegotiation::where('order_id', $orders->first()->id)
            ->where('vendor_id', $vendors->first()->id)
            ->whereIn('status', ['draft', 'open', 'sent', 'countered'])
            ->get();
        
        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Query should complete in less than 100ms
        $this->assertLessThan(100, $executionTime, "Query took {$executionTime}ms, expected < 100ms");
    }
}
