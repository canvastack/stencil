<?php

namespace Database\Seeders;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
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

        // Get admin user for created_by
        $adminUser = User::first();

        if (!$adminUser) {
            $this->command->error('No user found. Please run UserSeeder first.');
            return;
        }

        // Get or create a customer
        $customer = Customer::where('tenant_id', $tenant->id)->first();

        if (!$customer) {
            $customer = Customer::create([
                'tenant_id'          => $tenant->id,
                'name'               => 'Test Customer',
                'email'              => 'customer@example.com',
                'phone'              => '+62812345678',
                'password'           => bcrypt('password'),
                'account_type'       => 'customer',
                'email_verified_at'  => now(),
            ]);
        }

        // Get or create an order
        $order = Order::where('customer_id', $customer->id)->first();

        if (!$order) {
            $order = Order::create([
                'tenant_id'     => $tenant->id,
                'customer_id'   => $customer->id,
                'order_number'  => 'ORD-' . strtoupper(Str::random(8)),
                'status'        => 'pending',
                'items'         => json_encode([
                    [
                        'product_id'     => Str::uuid(),
                        'product_name'   => 'Custom Etching Plate',
                        'quantity'       => 1,
                        'specifications' => [
                            'material'     => 'stainless_steel',
                            'dimensions'   => '10x15cm',
                            'text_content' => 'Company Logo',
                        ],
                        'pricing' => [
                            'unit_price'  => 15000000,
                            'total_price' => 15000000,
                        ],
                    ],
                ]),
                'subtotal'       => 15000000,
                'tax'            => 1500000,
                'shipping_cost'  => 1000000,
                'total_amount'   => 17500000,
                'currency'       => 'IDR',
            ]);
        }

        // Get or create a vendor
        $vendor = Vendor::where('tenant_id', $tenant->id)->first();

        if (!$vendor) {
            $vendor = Vendor::create([
                'tenant_id'      => $tenant->id,
                'name'           => 'Demo Vendor',
                'code'           => 'VEND-DEMO',
                'email'          => 'vendor@demo.com',
                'phone'          => '+62811111111',
                'contact_person' => 'Vendor Contact',
                'status'         => 'active',
            ]);
        }

        // Get or create a vendor sourcing request
        $sourcing = VendorSourcing::where('tenant_id', $tenant->id)->first();

        if (!$sourcing) {
            $sourcing = VendorSourcing::create([
                'tenant_id'   => $tenant->id,
                'order_id'    => (string) $order->id,
                'title'       => 'Sourcing for Custom Etching Plate',
                'description' => 'Looking for vendor to produce custom etching plates',
                'status'      => 'completed',
                'requirements' => json_encode([
                    'material'   => 'stainless_steel',
                    'dimensions' => '10x15cm',
                    'quantity'   => 1,
                ]),
            ]);
        }

        // Get or create a vendor quote
        $vendorQuote = VendorQuote::where('tenant_id', $tenant->id)->first();

        if (!$vendorQuote) {
            $vendorQuote = VendorQuote::create([
                'tenant_id'          => $tenant->id,
                'sourcing_request_id' => $sourcing->id,
                'vendor_id'          => $vendor->id,
                'amount'             => 12000000,
                'description'        => 'Quote for custom etching plate production',
                'status'             => 'accepted',
                'valid_until'        => now()->addDays(30),
                'terms'              => json_encode([
                    'payment_terms'  => 'Net 30',
                    'delivery_time'  => '7 business days',
                ]),
            ]);
        }

        // Create customer quotes with different statuses
        $statuses = ['draft', 'sent', 'accepted', 'rejected', 'countered'];

        foreach ($statuses as $status) {
            CustomerQuote::create([
                'tenant_id'                => $tenant->id,
                'order_id'                 => $order->id,
                'vendor_quote_id'          => $vendorQuote->id,
                'quote_number'             => 'CQ-' . strtoupper(Str::random(8)),
                'title'                    => 'Customer Quote - ' . ucfirst($status),
                'status'                   => $status,
                'vendor_total_cost'        => 12000000,
                'base_profit_amount'       => 3000000,
                'base_profit_percentage'   => 25.00,
                'handling_fee'             => 500000,
                'shipping_cost'            => 1000000,
                'insurance'                => 0,
                'other_costs'              => 0,
                'subtotal'                 => 15000000,
                'tax_rate'                 => 11.00,
                'tax_amount'               => 1650000,
                'grand_total'              => 16650000,
                'total_profit_amount'      => 3000000,
                'total_profit_percentage'  => 22.00,
                'currency'                 => 'IDR',
                'payment_terms'            => '50% down payment, 50% on delivery',
                'delivery_timeline'        => '7-10 business days',
                'terms_and_conditions'     => 'Standard terms and conditions apply',
                'valid_until'              => now()->addDays(30),
                'created_by'               => $adminUser->id,
                'sent_at'                  => $status !== 'draft' ? now()->subDays(5) : null,
                'viewed_at'                => in_array($status, ['accepted', 'rejected', 'countered']) ? now()->subDays(4) : null,
                'responded_at'             => in_array($status, ['accepted', 'rejected', 'countered']) ? now()->subDays(3) : null,
                'approved_at'              => $status === 'accepted' ? now()->subDays(2) : null,
                'rejected_at'              => $status === 'rejected' ? now()->subDays(2) : null,
                'history'                  => [],
                'metadata'                 => [],
            ]);
        }

        $this->command->info('Customer quotes seeded successfully!');
        $this->command->info('Customer email: customer@example.com');
        $this->command->info('Customer password: password');
    }
}
