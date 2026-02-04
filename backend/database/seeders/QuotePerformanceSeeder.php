<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Support\Facades\DB;
use Spatie\Multitenancy\Models\Tenant;

class QuotePerformanceSeeder extends Seeder
{
    /**
     * Run the database seeds for performance testing.
     * Creates 1000+ quotes for testing pagination and query performance.
     */
    public function run(): void
    {
        $this->command->info('Starting Quote Performance Seeder...');
        
        // Get first tenant
        $tenant = Tenant::first();
        
        if (!$tenant) {
            $this->command->error('No tenant found. Please run tenant seeder first.');
            return;
        }
        
        $this->command->info("Using tenant: {$tenant->name} (ID: {$tenant->id})");
        
        // Get existing customers and vendors
        $customers = Customer::where('tenant_id', $tenant->id)->limit(50)->get();
        $vendors = Vendor::where('tenant_id', $tenant->id)->limit(20)->get();
        
        if ($customers->isEmpty() || $vendors->isEmpty()) {
            $this->command->error('No customers or vendors found. Please run seeders first.');
            return;
        }
        
        $this->command->info("Found {$customers->count()} customers and {$vendors->count()} vendors");
        
        // Get or create orders for quotes
        $orders = Order::where('tenant_id', $tenant->id)->limit(500)->get();
        
        if ($orders->isEmpty()) {
            $this->command->error('No orders found. Please run order seeder first.');
            return;
        }
        
        $this->command->info("Found {$orders->count()} orders");
        
        // Define quote statuses with realistic distribution
        $statuses = [
            'open' => 350,      // 35% open quotes
            'countered' => 200, // 20% countered
            'accepted' => 250,  // 25% accepted
            'rejected' => 150,  // 15% rejected
            'expired' => 50,    // 5% expired
        ];
        
        $totalQuotes = array_sum($statuses);
        $this->command->info("Creating {$totalQuotes} quotes...");
        
        $bar = $this->command->getOutput()->createProgressBar($totalQuotes);
        $bar->start();
        
        $createdCount = 0;
        
        // Disable query log for performance
        DB::connection()->disableQueryLog();
        
        // Create quotes in batches for better performance
        $batchSize = 100;
        $quoteBatch = [];
        
        foreach ($statuses as $status => $count) {
            for ($i = 0; $i < $count; $i++) {
                $order = $orders->random();
                $vendor = $vendors->random();
                $customer = $customers->random();
                
                // Generate realistic pricing
                $initialOffer = rand(100000, 10000000); // 1,000 - 100,000 IDR in cents
                $latestOffer = $initialOffer;
                
                // For countered quotes, adjust the latest offer
                if ($status === 'countered') {
                    $latestOffer = $initialOffer * (rand(80, 95) / 100); // 5-20% discount
                }
                
                // Generate history based on status
                $history = [
                    [
                        'action' => 'created',
                        'timestamp' => now()->subDays(rand(1, 90))->toISOString(),
                        'user_id' => 1,
                        'notes' => 'Quote created',
                    ]
                ];
                
                if ($status === 'countered') {
                    $history[] = [
                        'action' => 'counter_offered',
                        'previous_offer' => $initialOffer,
                        'new_offer' => $latestOffer,
                        'timestamp' => now()->subDays(rand(1, 30))->toISOString(),
                        'user_id' => 1,
                        'notes' => 'Counter offer submitted',
                    ];
                }
                
                if ($status === 'accepted') {
                    $history[] = [
                        'action' => 'accepted',
                        'timestamp' => now()->subDays(rand(1, 30))->toISOString(),
                        'user_id' => 1,
                        'notes' => 'Quote accepted',
                    ];
                }
                
                if ($status === 'rejected') {
                    $history[] = [
                        'action' => 'rejected',
                        'reason' => 'Price too high for budget',
                        'timestamp' => now()->subDays(rand(1, 30))->toISOString(),
                        'user_id' => 1,
                    ];
                }
                
                $closedAt = in_array($status, ['accepted', 'rejected', 'expired']) 
                    ? now()->subDays(rand(1, 30)) 
                    : null;
                
                $expiresAt = in_array($status, ['open', 'countered'])
                    ? now()->addDays(rand(7, 30))
                    : now()->subDays(rand(1, 30));
                
                $quoteBatch[] = [
                    'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                    'tenant_id' => $tenant->id,
                    'order_id' => $order->id,
                    'vendor_id' => $vendor->id,
                    'initial_offer' => $initialOffer,
                    'latest_offer' => $latestOffer,
                    'currency' => 'IDR',
                    'status' => $status,
                    'round' => $status === 'countered' ? rand(1, 3) : 1,
                    'quote_details' => json_encode([
                        'payment_terms' => '30 days',
                        'delivery_time' => rand(7, 30) . ' days',
                        'warranty' => rand(6, 24) . ' months',
                    ]),
                    'history' => json_encode($history),
                    'expires_at' => $expiresAt,
                    'closed_at' => $closedAt,
                    'created_at' => now()->subDays(rand(1, 90)),
                    'updated_at' => now()->subDays(rand(0, 30)),
                ];
                
                // Insert batch when it reaches batch size
                if (count($quoteBatch) >= $batchSize) {
                    DB::table('order_vendor_negotiations')->insert($quoteBatch);
                    $createdCount += count($quoteBatch);
                    $quoteBatch = [];
                    $bar->advance($batchSize);
                }
            }
        }
        
        // Insert remaining quotes
        if (!empty($quoteBatch)) {
            DB::table('order_vendor_negotiations')->insert($quoteBatch);
            $createdCount += count($quoteBatch);
            $bar->advance(count($quoteBatch));
        }
        
        $bar->finish();
        $this->command->newLine(2);
        
        $this->command->info("✅ Successfully created {$createdCount} quotes for performance testing");
        $this->command->info("Status distribution:");
        foreach ($statuses as $status => $count) {
            $this->command->info("  - {$status}: {$count} quotes");
        }
    }
}
