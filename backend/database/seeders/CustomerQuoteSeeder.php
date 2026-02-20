<?php

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CustomerQuoteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first tenant
        $tenant = Tenant::first();
        
        if (!$tenant) {
            $this->command->error('No tenant found. Please run TenantSeeder first.');
            return;
        }

        // Get or create a customer
        $customer = Customer::where('tenant_id', $tenant->id)->first();
        
        if (!$customer) {
            $customer = Customer::create([
                'tenant_id' => $tenant->id,
                'name' => 'Test Customer',
                'email' => 'customer@example.com',
                'phone' => '+62812345678',
                'password' => bcrypt('password'),
                'account_type' => 'customer',
                'email_verified_at' => now(),
            ]);
        }

        // Get or create an order
        $order = Order::where('customer_id', $customer->id)->first();
        
        if (!$order) {
            $order = Order::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'order_number' => 'ORD-' . strtoupper(Str::random(8)),
                'status' => 'pending',
                'items' => json_encode([
                    [
                        'product_id' => Str::uuid(),
                        'product_name' => 'Custom Etching Plate',
                        'quantity' => 1,
                        'specifications' => [
                            'material' => 'stainless_steel',
                            'dimensions' => '10x15cm',
                            'text_content' => 'Company Logo',
                        ],
                        'pricing' => [
                            'unit_price' => 15000000, // 150,000 IDR in cents
                            'total_price' => 15000000,
                        ],
                    ],
                ]),
                'subtotal_amount' => 15000000,
                'tax_amount' => 1500000,
                'shipping_amount' => 1000000,
                'total_amount' => 17500000,
                'currency' => 'IDR',
            ]);
        }

        // Create customer quotes with different statuses
        $statuses = ['draft', 'sent', 'accepted', 'rejected', 'countered'];
        
        foreach ($statuses as $index => $status) {
            CustomerQuote::create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'quote_number' => 'CQ-' . strtoupper(Str::random(8)),
                'title' => "Customer Quote - " . ucfirst($status),
                'status' => $status,
                'customer_token' => Str::uuid(),
                'items' => json_encode([
                    [
                        'product_name' => 'Custom Etching Plate',
                        'quantity' => 1,
                        'unit_price' => 15000000,
                        'total_price' => 15000000,
                    ],
                ]),
                'pricing' => json_encode([
                    'subtotal' => 15000000,
                    'tax' => 1500000,
                    'shipping' => 1000000,
                    'grand_total' => 17500000,
                    'currency' => 'IDR',
                ]),
                'terms' => json_encode([
                    'payment_terms' => '50% down payment, 50% on delivery',
                    'delivery_time' => '7-10 business days',
                    'valid_until' => now()->addDays(30)->toDateString(),
                    'notes' => 'Standard terms and conditions apply',
                ]),
                'valid_until' => now()->addDays(30),
                'sent_at' => $status !== 'draft' ? now()->subDays(5) : null,
                'viewed_at' => in_array($status, ['accepted', 'rejected', 'countered']) ? now()->subDays(4) : null,
                'responded_at' => in_array($status, ['accepted', 'rejected', 'countered']) ? now()->subDays(3) : null,
            ]);
        }

        $this->command->info('Customer quotes seeded successfully!');
        $this->command->info('Customer email: customer@example.com');
        $this->command->info('Customer password: password');
    }
}
