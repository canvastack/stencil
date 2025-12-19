<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Facades\DB;

class VendorOrderSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing orders and vendors
        $orders = Order::limit(20)->get();
        $vendors = Vendor::limit(10)->get();
        
        if ($orders->isEmpty() || $vendors->isEmpty()) {
            $this->command->info('No orders or vendors found. Please run OrderSeeder and VendorSeeder first.');
            return;
        }

        $vendorOrders = [];
        
        foreach ($orders as $order) {
            // Assign 1-3 vendors per order
            $assignedVendors = $vendors->random(rand(1, 3));
            
            foreach ($assignedVendors as $vendor) {
                $vendorOrders[] = [
                    'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'assignment_type' => collect(['direct', 'sourcing', 'negotiation'])->random(),
                    'status' => collect(['pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'])->random(),
                    'estimated_price' => rand(50000, 500000) / 100,
                    'final_price' => rand(45000, 480000) / 100,
                    'estimated_lead_time_days' => rand(1, 30),
                    'actual_lead_time_days' => rand(1, 35),
                    'delivery_status' => collect(['on_time', 'late', 'early', 'pending'])->random(),
                    'quality_rating' => rand(200, 500) / 100, // 2.00 to 5.00
                    'notes' => 'Sample vendor order assignment for ' . $vendor->name,
                    'assigned_at' => now()->subDays(rand(1, 30)),
                    'accepted_at' => now()->subDays(rand(1, 25)),
                    'started_at' => now()->subDays(rand(1, 20)),
                    'completed_at' => rand(0, 1) ? now()->subDays(rand(1, 15)) : null,
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now()->subDays(rand(1, 5)),
                ];
            }
        }

        // Insert in chunks to avoid memory issues
        DB::table('vendor_orders')->insert($vendorOrders);
        
        $this->command->info('Created ' . count($vendorOrders) . ' vendor orders');
    }
}