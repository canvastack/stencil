<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;

class OrderVendorNegotiationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first available tenant (demo-etching)
        $tenant = Tenant::first();
        
        if (!$tenant) {
            $this->command->warn('No tenant found, skipping OrderVendorNegotiation seeder');
            return;
        }

        // Get some orders and vendors for this tenant
        $orders = Order::where('tenant_id', $tenant->id)->limit(10)->get();
        $vendors = Vendor::where('tenant_id', $tenant->id)->limit(5)->get();

        if ($orders->isEmpty() || $vendors->isEmpty()) {
            $this->command->warn('No orders or vendors found for tenant ' . $tenant->name . ', skipping OrderVendorNegotiation seeder');
            return;
        }

        $negotiations = [];
        $statuses = ['open', 'countered', 'accepted', 'rejected', 'cancelled', 'expired'];
        
        for ($i = 0; $i < 25; $i++) {
            $order = $orders->random();
            $vendor = $vendors->random();
            $status = $statuses[array_rand($statuses)];
            $initialOffer = rand(50000000, 500000000); // 500k - 5M in cents (IDR)
            
            $negotiation = [
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'status' => $status,
                'initial_offer' => $initialOffer,
                'latest_offer' => $status === 'countered' ? $initialOffer + rand(-10000000, 20000000) : $initialOffer,
                'currency' => 'IDR',
                'round' => $status === 'countered' ? rand(1, 5) : 1,
                'terms' => json_encode([
                    'delivery_days' => rand(7, 30),
                    'payment_method' => ['bank_transfer', 'cod', 'credit'][array_rand(['bank_transfer', 'cod', 'credit'])],
                    'warranty_months' => rand(6, 24),
                    'free_shipping' => rand(0, 1) === 1,
                ]),
                'history' => json_encode([
                    [
                        'action' => 'initial_quote',
                        'offer' => $initialOffer,
                        'timestamp' => now()->subDays(rand(1, 30))->toISOString(),
                        'user_id' => 1,
                    ],
                ]),
                'expires_at' => $status === 'open' ? now()->addDays(rand(7, 30)) : null,
                'closed_at' => in_array($status, ['accepted', 'rejected', 'cancelled', 'expired']) ? now()->subDays(rand(1, 10)) : null,
                'created_at' => now()->subDays(rand(1, 60)),
                'updated_at' => now()->subDays(rand(0, 30)),
            ];

            $negotiations[] = $negotiation;
        }

        foreach ($negotiations as $negotiationData) {
            OrderVendorNegotiation::create($negotiationData);
        }

        $this->command->info('Created 25 order vendor negotiations for tenant ' . $tenant->name);
    }
}