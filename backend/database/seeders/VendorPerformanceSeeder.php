<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Ramsey\Uuid\Uuid;
use Carbon\Carbon;

class VendorPerformanceSeeder extends Seeder
{
    /**
     * Seed vendor performance data for metrics dashboards
     * 
     * This seeder creates vendor_orders with realistic performance metrics
     * to replace hardcoded delivery and quality metrics in VendorPerformance.tsx
     * 
     * Generates data distribution:
     * - Delivery: 85% on-time, 10% early, 5% late
     * - Quality: 65% excellent (4.5+), 28% good (4.0-4.4), 5% average (3.5-3.9), 2% poor (<3.5)
     */
    public function run(): void
    {
        // Get first available tenant (flexible approach)
        $tenant = Tenant::first();
        
        if (!$tenant) {
            $this->command->warn('No tenant found. Skipping vendor performance seeding.');
            return;
        }
        
        $this->command->info('Using tenant: ' . $tenant->name);

        $vendors = Vendor::where('tenant_id', $tenant->id)->get();
        $orders = Order::where('tenant_id', $tenant->id)->limit(200)->get();
        
        if ($vendors->isEmpty() || $orders->isEmpty()) {
            $this->command->warn('No vendors or orders found. Please run VendorSeeder and OrderSeeder first.');
            return;
        }

        $vendorOrders = [];
        $totalOrders = 240; // Target number of completed orders for metrics

        $this->command->info('Creating ' . $totalOrders . ' vendor performance records...');

        for ($i = 0; $i < $totalOrders; $i++) {
            $vendor = $vendors->random();
            $order = $orders->random();
            
            // Determine delivery status based on distribution
            $deliveryRand = rand(1, 100);
            if ($deliveryRand <= 85) {
                $deliveryStatus = 'on_time';
                $actualDays = rand(5, $vendor->average_lead_time_days ?? 10);
            } elseif ($deliveryRand <= 95) {
                $deliveryStatus = 'early';
                $actualDays = rand(3, ($vendor->average_lead_time_days ?? 10) - 2);
            } else {
                $deliveryStatus = 'late';
                $actualDays = rand(($vendor->average_lead_time_days ?? 10) + 1, 20);
            }

            // Determine quality rating based on distribution
            $qualityRand = rand(1, 100);
            if ($qualityRand <= 65) {
                // Excellent (4.5+)
                $qualityRating = 4.5 + (rand(0, 50) / 100); // 4.50 to 5.00
            } elseif ($qualityRand <= 93) {
                // Good (4.0-4.4)
                $qualityRating = 4.0 + (rand(0, 40) / 100); // 4.00 to 4.40
            } elseif ($qualityRand <= 98) {
                // Average (3.5-3.9)
                $qualityRating = 3.5 + (rand(0, 40) / 100); // 3.50 to 3.90
            } else {
                // Poor (<3.5)
                $qualityRating = 2.0 + (rand(0, 150) / 100); // 2.00 to 3.50
            }

            $assignedDate = Carbon::now()->subDays(rand(30, 180));
            $completedDate = $assignedDate->copy()->addDays($actualDays);

            $vendorOrders[] = [
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'assignment_type' => collect(['direct', 'sourcing', 'negotiation'])->random(),
                'status' => 'completed',
                'estimated_price' => rand(100000, 5000000),
                'final_price' => rand(95000, 4800000),
                'estimated_lead_time_days' => $vendor->average_lead_time_days ?? 10,
                'actual_lead_time_days' => $actualDays,
                'delivery_status' => $deliveryStatus,
                'quality_rating' => round($qualityRating, 2),
                'notes' => 'Performance record for metrics aggregation',
                'assigned_at' => $assignedDate,
                'accepted_at' => $assignedDate->copy()->addHours(2),
                'started_at' => $assignedDate->copy()->addDays(1),
                'completed_at' => $completedDate,
                'created_at' => $assignedDate,
                'updated_at' => $completedDate,
            ];

            // Insert in batches of 50 to avoid memory issues
            if (count($vendorOrders) >= 50) {
                DB::table('vendor_orders')->insert($vendorOrders);
                $vendorOrders = [];
            }
        }

        // Insert remaining records
        if (!empty($vendorOrders)) {
            DB::table('vendor_orders')->insert($vendorOrders);
        }

        // Update vendor statistics based on created performance data
        $this->updateVendorStatistics($tenant);

        $this->command->info('✓ Created ' . $totalOrders . ' vendor performance records');
        $this->command->info('✓ Delivery distribution: ~85% on-time, ~10% early, ~5% late');
        $this->command->info('✓ Quality distribution: ~65% excellent, ~28% good, ~5% average, ~2% poor');
    }

    /**
     * Update vendor statistics based on performance data
     */
    private function updateVendorStatistics(Tenant $tenant): void
    {
        $vendors = Vendor::where('tenant_id', $tenant->id)->get();

        foreach ($vendors as $vendor) {
            $orders = VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', 'completed')
                ->get();

            if ($orders->isEmpty()) {
                continue;
            }

            $totalOrders = $orders->count();
            $onTimeOrders = $orders->where('delivery_status', 'on_time')->count();
            $completionRate = ($onTimeOrders / $totalOrders) * 100;
            $avgQualityRating = $orders->avg('quality_rating');
            $avgLeadTime = $orders->avg('actual_lead_time_days');
            $totalValue = $orders->sum('final_price');

            $vendor->update([
                'total_orders' => $totalOrders,
                'completion_rate' => round($completionRate, 2),
                'rating' => round($avgQualityRating, 2),
                'average_lead_time_days' => round($avgLeadTime),
                'total_value' => $totalValue,
                'performance_score' => round(($completionRate * 0.4) + ($avgQualityRating * 20 * 0.6), 2),
            ]);
        }

        $this->command->info('✓ Updated vendor statistics based on performance data');
    }
}
