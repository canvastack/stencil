<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Illuminate\Support\Facades\DB;

class PaymentSimulationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates various payment scenarios for testing:
     * 1. Pending payment (just accepted)
     * 2. Partial payment (DP paid)
     * 3. Fully paid
     * 4. Overdue payment
     * 5. Refunded payment
     */
    public function run(): void
    {
        $this->command->info('🔄 Starting Payment Simulation Seeder...');

        // Get customer for testing
        $customer = Customer::where('email', 'customer@demo.com')->first();
        
        if (!$customer) {
            $this->command->error('❌ Customer not found. Please run CustomerSeeder first.');
            return;
        }

        $this->command->info("✅ Using customer: {$customer->name} ({$customer->email})");

        // Create payment scenarios
        $this->createPendingPaymentQuote($customer);
        $this->createPartialPaymentQuote($customer);
        $this->createFullyPaidQuote($customer);
        $this->createOverduePaymentQuote($customer);
        $this->createRefundedPaymentQuote($customer);

        $this->command->info('✅ Payment Simulation Seeder completed!');
    }


    /**
     * Scenario 1: Pending Payment (Just Accepted)
     */
    private function createPendingPaymentQuote(Customer $customer): void
    {
        $order = Order::create([
            'tenant_id' => $customer->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-' . now()->format('Ymd') . '-' . rand(1000, 9999),
            'status' => 'pending_payment',
            'payment_status' => 'unpaid',
            'items' => json_encode([
                [
                    'product_id' => 'prod-uuid-1',
                    'product_name' => 'Custom Etching Plate - Stainless Steel',
                    'quantity' => 5,
                    'specifications' => [
                        'material' => 'stainless_steel',
                        'dimensions' => '20x30cm',
                        'text_content' => 'Company Logo + Text',
                        'finish' => 'polished',
                    ],
                    'pricing' => [
                        'unit_price' => 25000000, // IDR 250,000 in cents
                        'total_price' => 125000000, // IDR 1,250,000
                    ],
                ],
            ]),
            'subtotal' => 125000000,
            'tax' => 13750000, // 11% PPN
            'total_amount' => 138750000, // IDR 1,387,500
            'currency' => 'IDR',
        ]);

        $quote = CustomerQuote::create([
            'tenant_id' => $customer->tenant_id,
            'order_id' => $order->id,
            'vendor_quote_id' => 1, // Dummy vendor quote
            'quote_number' => 'QT-' . now()->format('Ymd') . '-PENDING',
            'title' => 'Custom Etching Plate - Pending Payment',
            'description' => 'Quote accepted, awaiting payment',
            'status' => 'accepted',
            'created_by' => 1, // Admin user
            
            // Pricing (in cents)
            'vendor_total_cost' => 100000000, // IDR 1,000,000
            'base_profit_amount' => 25000000, // IDR 250,000
            'base_profit_percentage' => 25.00,
            'handling_fee' => 5000000, // IDR 50,000
            'shipping_cost' => 10000000, // IDR 100,000
            'insurance' => 2500000, // IDR 25,000
            'subtotal' => 142500000,
            'tax_rate' => 11.00,
            'tax_amount' => 15675000,
            'grand_total' => 158175000, // IDR 1,581,750
            'total_profit_amount' => 25000000,
            'total_profit_percentage' => 25.00,
            'currency' => 'IDR',
            
            // Terms
            'valid_until' => now()->addDays(7),
            'payment_terms' => 'Full payment required within 3 days',
            'delivery_timeline' => '7-10 working days after payment',
            
            // Timestamps
            'sent_at' => now()->subDays(2),
            'viewed_at' => now()->subDays(1),
            'responded_at' => now()->subHours(2),
            'approved_at' => now()->subHours(2),
        ]);

        $this->command->info("✅ Created: Pending Payment Quote - {$quote->quote_number}");
    }

    /**
     * Scenario 2: Partial Payment (Down Payment Paid)
     */
    private function createPartialPaymentQuote(Customer $customer): void
    {
        $order = Order::create([
            'tenant_id' => $customer->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-' . now()->format('Ymd') . '-' . rand(1000, 9999),
            'status' => 'payment_verified',
            'payment_status' => 'partial',
            'items' => json_encode([
                [
                    'product_id' => 'prod-uuid-2',
                    'product_name' => 'Custom Glass Etching - Premium',
                    'quantity' => 3,
                    'specifications' => [
                        'material' => 'tempered_glass',
                        'dimensions' => '30x40cm',
                        'design' => 'Custom artwork',
                        'frame' => 'wooden_frame',
                    ],
                    'pricing' => [
                        'unit_price' => 50000000, // IDR 500,000
                        'total_price' => 150000000, // IDR 1,500,000
                    ],
                ],
            ]),
            'subtotal' => 150000000,
            'tax' => 16500000,
            'total_amount' => 166500000,
            'currency' => 'IDR',
        ]);

        $quote = CustomerQuote::create([
            'tenant_id' => $customer->tenant_id,
            'order_id' => $order->id,
            'vendor_quote_id' => 1,
            'quote_number' => 'QT-' . now()->format('Ymd') . '-PARTIAL',
            'title' => 'Custom Glass Etching - DP Paid',
            'description' => 'Down payment received, production starting',
            'status' => 'accepted',
            'created_by' => 1,
            
            // Pricing
            'vendor_total_cost' => 120000000,
            'base_profit_amount' => 30000000,
            'base_profit_percentage' => 25.00,
            'handling_fee' => 8000000,
            'shipping_cost' => 15000000,
            'insurance' => 5000000,
            'subtotal' => 178000000,
            'tax_rate' => 11.00,
            'tax_amount' => 19580000,
            'grand_total' => 197580000, // IDR 1,975,800
            'total_profit_amount' => 30000000,
            'total_profit_percentage' => 25.00,
            'currency' => 'IDR',
            
            // Terms
            'valid_until' => now()->addDays(14),
            'payment_terms' => 'DP 50% paid, remaining 50% before delivery',
            'delivery_timeline' => '10-14 working days',
            
            // Timestamps
            'sent_at' => now()->subDays(5),
            'viewed_at' => now()->subDays(4),
            'responded_at' => now()->subDays(3),
            'approved_at' => now()->subDays(3),
        ]);

        $this->command->info("✅ Created: Partial Payment Quote - {$quote->quote_number} (DP: IDR 987,900)");
    }

    /**
     * Scenario 3: Fully Paid
     */
    private function createFullyPaidQuote(Customer $customer): void
    {
        $order = Order::create([
            'tenant_id' => $customer->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-' . now()->format('Ymd') . '-' . rand(1000, 9999),
            'status' => 'in_production',
            'payment_status' => 'paid',
            'items' => json_encode([
                [
                    'product_id' => 'prod-uuid-3',
                    'product_name' => 'Award Plaque - Gold Finish',
                    'quantity' => 10,
                    'specifications' => [
                        'material' => 'brass',
                        'dimensions' => '15x20cm',
                        'finish' => 'gold_plated',
                        'engraving' => 'Custom text per piece',
                    ],
                    'pricing' => [
                        'unit_price' => 35000000, // IDR 350,000
                        'total_price' => 350000000, // IDR 3,500,000
                    ],
                ],
            ]),
            'subtotal' => 350000000,
            'tax' => 38500000,
            'total_amount' => 388500000,
            'currency' => 'IDR',
        ]);

        $quote = CustomerQuote::create([
            'tenant_id' => $customer->tenant_id,
            'order_id' => $order->id,
            'vendor_quote_id' => 1,
            'quote_number' => 'QT-' . now()->format('Ymd') . '-PAID',
            'title' => 'Award Plaque - Fully Paid',
            'description' => 'Payment complete, in production',
            'status' => 'accepted',
            'created_by' => 1,
            
            // Pricing
            'vendor_total_cost' => 280000000,
            'base_profit_amount' => 70000000,
            'base_profit_percentage' => 25.00,
            'handling_fee' => 15000000,
            'shipping_cost' => 25000000,
            'insurance' => 10000000,
            'subtotal' => 400000000,
            'tax_rate' => 11.00,
            'tax_amount' => 44000000,
            'grand_total' => 444000000, // IDR 4,440,000
            'total_profit_amount' => 70000000,
            'total_profit_percentage' => 25.00,
            'currency' => 'IDR',
            
            // Terms
            'valid_until' => now()->addDays(30),
            'payment_terms' => 'Full payment received',
            'delivery_timeline' => '14-21 working days',
            
            // Timestamps
            'sent_at' => now()->subDays(10),
            'viewed_at' => now()->subDays(9),
            'responded_at' => now()->subDays(8),
            'approved_at' => now()->subDays(8),
        ]);

        $this->command->info("✅ Created: Fully Paid Quote - {$quote->quote_number} (Paid: IDR 4,440,000)");
    }

    /**
     * Scenario 4: Overdue Payment
     */
    private function createOverduePaymentQuote(Customer $customer): void
    {
        $order = Order::create([
            'tenant_id' => $customer->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-' . now()->format('Ymd') . '-' . rand(1000, 9999),
            'status' => 'pending_payment',
            'payment_status' => 'unpaid',
            'items' => json_encode([
                [
                    'product_id' => 'prod-uuid-4',
                    'product_name' => 'Metal Name Plate - Aluminum',
                    'quantity' => 20,
                    'specifications' => [
                        'material' => 'aluminum',
                        'dimensions' => '10x5cm',
                        'finish' => 'brushed',
                        'mounting' => 'adhesive_back',
                    ],
                    'pricing' => [
                        'unit_price' => 8000000, // IDR 80,000
                        'total_price' => 160000000, // IDR 1,600,000
                    ],
                ],
            ]),
            'subtotal' => 160000000,
            'tax' => 17600000,
            'total_amount' => 177600000,
            'currency' => 'IDR',
        ]);

        $quote = CustomerQuote::create([
            'tenant_id' => $customer->tenant_id,
            'order_id' => $order->id,
            'vendor_quote_id' => 1,
            'quote_number' => 'QT-' . now()->format('Ymd') . '-OVERDUE',
            'title' => 'Metal Name Plate - Payment Overdue',
            'description' => 'Quote accepted but payment overdue',
            'status' => 'accepted',
            'created_by' => 1,
            
            // Pricing
            'vendor_total_cost' => 128000000,
            'base_profit_amount' => 32000000,
            'base_profit_percentage' => 25.00,
            'handling_fee' => 6000000,
            'shipping_cost' => 12000000,
            'insurance' => 3000000,
            'subtotal' => 181000000,
            'tax_rate' => 11.00,
            'tax_amount' => 19910000,
            'grand_total' => 200910000, // IDR 2,009,100
            'total_profit_amount' => 32000000,
            'total_profit_percentage' => 25.00,
            'currency' => 'IDR',
            
            // Terms - Payment deadline passed
            'valid_until' => now()->subDays(2), // Expired 2 days ago
            'payment_terms' => 'Payment required within 3 days (OVERDUE)',
            'delivery_timeline' => '5-7 working days after payment',
            
            // Timestamps
            'sent_at' => now()->subDays(7),
            'viewed_at' => now()->subDays(6),
            'responded_at' => now()->subDays(5),
            'approved_at' => now()->subDays(5),
        ]);

        $this->command->info("⚠️  Created: Overdue Payment Quote - {$quote->quote_number} (Overdue by 2 days)");
    }

    /**
     * Scenario 5: Refunded Payment
     */
    private function createRefundedPaymentQuote(Customer $customer): void
    {
        $order = Order::create([
            'tenant_id' => $customer->tenant_id,
            'customer_id' => $customer->id,
            'order_number' => 'ORD-' . now()->format('Ymd') . '-' . rand(1000, 9999),
            'status' => 'cancelled',
            'payment_status' => 'refunded',
            'items' => json_encode([
                [
                    'product_id' => 'prod-uuid-5',
                    'product_name' => 'Custom Trophy - Crystal',
                    'quantity' => 2,
                    'specifications' => [
                        'material' => 'crystal_glass',
                        'dimensions' => '25x15cm',
                        'base' => 'wooden_base',
                        'engraving' => 'Front and back',
                    ],
                    'pricing' => [
                        'unit_price' => 75000000, // IDR 750,000
                        'total_price' => 150000000, // IDR 1,500,000
                    ],
                ],
            ]),
            'subtotal' => 150000000,
            'tax' => 16500000,
            'total_amount' => 166500000,
            'currency' => 'IDR',
        ]);

        $quote = CustomerQuote::create([
            'tenant_id' => $customer->tenant_id,
            'order_id' => $order->id,
            'vendor_quote_id' => 1,
            'quote_number' => 'QT-' . now()->format('Ymd') . '-REFUND',
            'title' => 'Custom Trophy - Refunded',
            'description' => 'Order cancelled, payment refunded',
            'status' => 'rejected',
            'created_by' => 1,
            
            // Pricing
            'vendor_total_cost' => 120000000,
            'base_profit_amount' => 30000000,
            'base_profit_percentage' => 25.00,
            'handling_fee' => 10000000,
            'shipping_cost' => 18000000,
            'insurance' => 7000000,
            'subtotal' => 185000000,
            'tax_rate' => 11.00,
            'tax_amount' => 20350000,
            'grand_total' => 205350000, // IDR 2,053,500
            'total_profit_amount' => 30000000,
            'total_profit_percentage' => 25.00,
            'currency' => 'IDR',
            
            // Terms
            'valid_until' => now()->addDays(30),
            'payment_terms' => 'Refunded due to cancellation',
            'delivery_timeline' => 'N/A - Order cancelled',
            
            // Rejection
            'rejection_reason' => 'Customer requested cancellation after payment',
            
            // Timestamps
            'sent_at' => now()->subDays(15),
            'viewed_at' => now()->subDays(14),
            'responded_at' => now()->subDays(13),
            'approved_at' => now()->subDays(13),
            'rejected_at' => now()->subDays(2),
        ]);

        $this->command->info("💰 Created: Refunded Payment Quote - {$quote->quote_number} (Refunded: IDR 2,053,500)");
    }
}
