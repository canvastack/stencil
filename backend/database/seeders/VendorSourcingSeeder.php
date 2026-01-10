<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Carbon\Carbon;

class VendorSourcingSeeder extends Seeder
{
    public function run(): void
    {
        // Get first available tenant
        $tenant = TenantEloquentModel::first();
        
        if (!$tenant) {
            $this->command->warn('No tenant found. Skipping VendorSourcingSeeder.');
            return;
        }
        
        $this->command->info('Using tenant: ' . $tenant->name);

        $vendors = Vendor::where('tenant_id', $tenant->id)->limit(5)->get();
        
        if ($vendors->isEmpty()) {
            $this->command->warn('No vendors found for tenant. Please run VendorSeeder first.');
            return;
        }

        $sourcingRequests = [
            [
                'title' => 'Procurement: Canvas Material for Summer Collection',
                'description' => 'Need high-quality canvas material for our summer collection production. Total 5000 yards required.',
                'status' => 'active',
                'requirements' => [
                    'material' => 'Canvas',
                    'quantity' => 5000,
                    'unit' => 'yards',
                    'quality_tier' => 'premium',
                    'deadline' => Carbon::now()->addDays(30)->format('Y-m-d'),
                    'budget' => 250000000,
                ],
                'responses' => 3,
            ],
            [
                'title' => 'Urgent: Leather Supply for Custom Orders',
                'description' => 'Require premium leather for 200 custom bag orders. Delivery needed within 2 weeks.',
                'status' => 'negotiating',
                'assigned_vendor' => $vendors[1]->name ?? null,
                'requirements' => [
                    'material' => 'Leather',
                    'quantity' => 200,
                    'unit' => 'square meters',
                    'quality_tier' => 'exclusive',
                    'deadline' => Carbon::now()->addDays(14)->format('Y-m-d'),
                    'budget' => 150000000,
                ],
                'responses' => 2,
                'best_quote' => 145000000,
            ],
            [
                'title' => 'Fabric Sourcing for Winter Line',
                'description' => 'Sourcing wool and synthetic blend fabrics for upcoming winter product line.',
                'status' => 'completed',
                'assigned_vendor' => $vendors[0]->name ?? null,
                'requirements' => [
                    'material' => 'Wool Blend',
                    'quantity' => 3000,
                    'unit' => 'yards',
                    'quality_tier' => 'premium',
                    'deadline' => Carbon::now()->subDays(10)->format('Y-m-d'),
                    'budget' => 180000000,
                ],
                'responses' => 5,
                'best_quote' => 165000000,
            ],
            [
                'title' => 'Metal Hardware Components Procurement',
                'description' => 'Need zippers, buckles, and metal fittings for Q1 production batch.',
                'status' => 'active',
                'requirements' => [
                    'material' => 'Metal Hardware',
                    'quantity' => 10000,
                    'unit' => 'pieces',
                    'quality_tier' => 'standard',
                    'deadline' => Carbon::now()->addDays(45)->format('Y-m-d'),
                    'budget' => 85000000,
                ],
                'responses' => 1,
            ],
            [
                'title' => 'Dye and Color Materials Supply',
                'description' => 'Organic dyes and coloring materials for eco-friendly product line.',
                'status' => 'cancelled',
                'requirements' => [
                    'material' => 'Organic Dyes',
                    'quantity' => 500,
                    'unit' => 'liters',
                    'quality_tier' => 'premium',
                    'deadline' => Carbon::now()->addDays(20)->format('Y-m-d'),
                    'budget' => 60000000,
                ],
                'responses' => 0,
            ],
        ];

        $this->command->info('Seeding vendor sourcing requests...');

        foreach ($sourcingRequests as $request) {
            $sourcing = VendorSourcing::create([
                'tenant_id' => $tenant->id,
                'order_id' => 'ORD-' . rand(10000, 99999),
                'title' => $request['title'],
                'description' => $request['description'],
                'status' => $request['status'],
                'assigned_vendor' => $request['assigned_vendor'] ?? null,
                'requirements' => $request['requirements'],
                'responses' => $request['responses'],
                'best_quote' => $request['best_quote'] ?? null,
                'created_at' => Carbon::now()->subDays(rand(1, 60)),
            ]);

            // Create quotes for active and negotiating requests
            if (in_array($request['status'], ['active', 'negotiating', 'completed']) && $request['responses'] > 0) {
                for ($i = 0; $i < $request['responses']; $i++) {
                    if (isset($vendors[$i])) {
                        $quoteAmount = $request['requirements']['budget'] * (0.85 + (rand(0, 20) / 100));
                        
                        VendorQuote::create([
                            'tenant_id' => $tenant->id,
                            'sourcing_request_id' => $sourcing->id,
                            'vendor_id' => $vendors[$i]->id,
                            'amount' => $quoteAmount,
                            'description' => 'Quote for ' . $request['title'],
                            'status' => $request['status'] === 'completed' ? 'accepted' : ($i === 0 ? 'pending' : 'pending'),
                            'valid_until' => Carbon::now()->addDays(30),
                            'terms' => [
                                'payment_terms' => '30 days net',
                                'delivery_time' => rand(7, 30) . ' days',
                                'warranty' => '90 days',
                            ],
                            'created_at' => Carbon::now()->subDays(rand(1, 30)),
                        ]);
                    }
                }
            }
        }

        $this->command->info('Vendor sourcing requests and quotes seeded successfully.');
    }
}
