<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Order\Enums\PaymentType;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first tenant
        $tenant = TenantEloquentModel::first();
        if (!$tenant) {
            $this->command->error('No tenant found. Please seed tenants first.');
            return;
        }

        // Get first customer or create one
        $customer = Customer::where('tenant_id', $tenant->id)->first();
        if (!$customer) {
            $customer = Customer::create([
                'tenant_id' => $tenant->id,
                'name' => 'Customer Test',
                'email' => 'customer.test@example.com',
                'phone' => '081234567890',
                'address' => 'Jl. Test No. 123, Jakarta',
            ]);
        }

        $this->command->info("Creating sample orders for tenant: {$tenant->name}");

        // Create sample orders with PT CEX business model data
        $sampleOrders = [
            [
                'order_number' => 'ETC-251229-0015',
                'customer_name' => 'PT Etching Solutions',
                'customer_email' => 'procurement@etching-solutions.co.id',
                'customer_phone' => '021-55667788',
                'status' => OrderStatus::COMPLETED->value,
                'payment_status' => PaymentStatus::PAID->value,
                'payment_type' => PaymentType::DP50->value,
                'total_amount' => 850000000, // 8.5 juta
                'vendor_cost' => 600000000, // 6 juta
                'customer_price' => 850000000, // 8.5 juta
                'markup_amount' => 250000000, // 2.5 juta
                'markup_percentage' => 41.67,
                'paid_amount' => 850000000, // Full payment
                'remaining_amount' => 0,
                'items' => json_encode([
                    [
                        'name' => 'Premium Etching Service Package',
                        'quantity' => 150,
                        'unit_price' => 56667,
                        'total_price' => 8500000,
                        'specifications' => 'High-grade stainless steel etching with precision finishing'
                    ]
                ]),
                'notes' => 'Premium etching project completed with excellent quality',
                'dp_received_at' => now()->subDays(15),
                'final_payment_at' => now()->subDays(7),
                'production_start' => now()->subDays(12),
                'production_end' => now()->subDays(5),
                'quality_check_at' => now()->subDays(4),
                'shipped_at' => now()->subDays(2),
            ],
            [
                'customer_name' => 'PT Manufaktur Jaya',
                'customer_email' => 'order@manufaktur-jaya.com',
                'customer_phone' => '021-12345678',
                'status' => OrderStatus::PENDING->value,
                'payment_status' => PaymentStatus::UNPAID->value,
                'payment_type' => PaymentType::DP50->value,
                'total_amount' => 500000000, // 5 juta
                'vendor_cost' => 350000000, // 3.5 juta
                'customer_price' => 500000000, // 5 juta
                'markup_amount' => 150000000, // 1.5 juta
                'markup_percentage' => 42.86,
                'paid_amount' => 0,
                'remaining_amount' => 500000000,
                'items' => json_encode([
                    [
                        'name' => 'Custom Etching Plate Stainless Steel',
                        'quantity' => 100,
                        'unit_price' => 50000,
                        'total_price' => 5000000,
                        'specifications' => 'Size: 10x15cm, Thickness: 2mm'
                    ]
                ]),
                'notes' => 'Urgent project for industrial application',
            ],
            [
                'customer_name' => 'CV Teknik Presisi',
                'customer_email' => 'procurement@teknik-presisi.co.id',
                'customer_phone' => '021-87654321',
                'status' => OrderStatus::VENDOR_SOURCING->value,
                'payment_status' => PaymentStatus::UNPAID->value,
                'payment_type' => PaymentType::FULL100->value,
                'total_amount' => 750000000, // 7.5 juta
                'vendor_cost' => 600000000, // 6 juta
                'customer_price' => 750000000, // 7.5 juta
                'markup_amount' => 150000000, // 1.5 juta
                'markup_percentage' => 25.00,
                'paid_amount' => 0,
                'remaining_amount' => 750000000,
                'items' => json_encode([
                    [
                        'name' => 'Precision Metal Cutting Service',
                        'quantity' => 50,
                        'unit_price' => 150000,
                        'total_price' => 7500000,
                        'specifications' => 'Laser cutting with 0.1mm precision'
                    ]
                ]),
                'notes' => 'High precision required for automotive parts',
            ],
            [
                'customer_name' => 'PT Indo Etching',
                'customer_email' => 'orders@indoetching.com',
                'customer_phone' => '021-11223344',
                'status' => OrderStatus::PARTIAL_PAYMENT->value,
                'payment_status' => PaymentStatus::PARTIALLY_PAID->value,
                'payment_type' => PaymentType::DP50->value,
                'total_amount' => 300000000, // 3 juta
                'vendor_cost' => 220000000, // 2.2 juta
                'customer_price' => 300000000, // 3 juta
                'markup_amount' => 80000000, // 800k
                'markup_percentage' => 36.36,
                'paid_amount' => 150000000, // 1.5 juta (50% DP)
                'remaining_amount' => 150000000,
                'items' => json_encode([
                    [
                        'name' => 'Chemical Etching Process',
                        'quantity' => 200,
                        'unit_price' => 15000,
                        'total_price' => 3000000,
                        'specifications' => 'Aluminum plates with custom pattern'
                    ]
                ]),
                'notes' => 'DP 50% sudah diterima, menunggu proses produksi',
                'dp_received_at' => now()->subDays(3),
            ],
            [
                'customer_name' => 'Berkah Metal Works',
                'customer_email' => 'info@berkah-metal.com',
                'customer_phone' => '021-99887766',
                'status' => OrderStatus::IN_PRODUCTION->value,
                'payment_status' => PaymentStatus::PAID->value,
                'payment_type' => PaymentType::FULL100->value,
                'total_amount' => 125000000, // 1.25 juta
                'vendor_cost' => 90000000, // 900k
                'customer_price' => 125000000, // 1.25 juta
                'markup_amount' => 35000000, // 350k
                'markup_percentage' => 38.89,
                'paid_amount' => 125000000, // Full payment
                'remaining_amount' => 0,
                'items' => json_encode([
                    [
                        'name' => 'Steel Plate Engraving',
                        'quantity' => 25,
                        'unit_price' => 50000,
                        'total_price' => 1250000,
                        'specifications' => 'Logo engraving on steel nameplates'
                    ]
                ]),
                'notes' => 'Payment completed, production in progress',
                'final_payment_at' => now()->subDays(5),
                'production_start' => now()->subDays(2),
            ],
            [
                'customer_name' => 'Precision Tools Co',
                'customer_email' => 'order@precision-tools.id',
                'customer_phone' => '021-55443322',
                'status' => OrderStatus::COMPLETED->value,
                'payment_status' => PaymentStatus::PAID->value,
                'payment_type' => PaymentType::DP50->value,
                'total_amount' => 200000000, // 2 juta
                'vendor_cost' => 145000000, // 1.45 juta
                'customer_price' => 200000000, // 2 juta
                'markup_amount' => 55000000, // 550k
                'markup_percentage' => 37.93,
                'paid_amount' => 200000000, // Full payment
                'remaining_amount' => 0,
                'items' => json_encode([
                    [
                        'name' => 'Tool Die Manufacturing',
                        'quantity' => 10,
                        'unit_price' => 200000,
                        'total_price' => 2000000,
                        'specifications' => 'Custom tool die for manufacturing process'
                    ]
                ]),
                'notes' => 'Order completed successfully, customer satisfied',
                'dp_received_at' => now()->subDays(10),
                'final_payment_at' => now()->subDays(5),
                'production_start' => now()->subDays(8),
                'production_end' => now()->subDays(3),
                'quality_check_at' => now()->subDays(2),
                'shipped_at' => now()->subDays(1),
            ],
        ];

        foreach ($sampleOrders as $orderData) {
            Order::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'order_number' => $orderData['order_number'] ?? 'ORD-' . strtoupper(uniqid()),
                'status' => $orderData['status'],
                'payment_status' => $orderData['payment_status'],
                'total_amount' => $orderData['total_amount'],
                'vendor_cost' => $orderData['vendor_cost'] ?? null,
                'customer_price' => $orderData['customer_price'] ?? null,
                'markup_amount' => $orderData['markup_amount'] ?? null,
                'markup_percentage' => $orderData['markup_percentage'] ?? null,
                'total_paid_amount' => $orderData['paid_amount'] ?? 0,
                'items' => $orderData['items'],
                'notes' => $orderData['notes'],
                'internal_notes' => "Customer: {$orderData['customer_name']}, Email: {$orderData['customer_email']}, Phone: {$orderData['customer_phone']}",
                'dp_received_at' => $orderData['dp_received_at'] ?? null,
                'final_payment_at' => $orderData['final_payment_at'] ?? null,
                'production_start' => $orderData['production_start'] ?? null,
                'production_end' => $orderData['production_end'] ?? null,
                'quality_check_at' => $orderData['quality_check_at'] ?? null,
                'shipped_at' => $orderData['shipped_at'] ?? null,
                'created_at' => now()->subDays(rand(1, 30)),
                'updated_at' => now()->subDays(rand(0, 5)),
            ]);
        }

        $this->command->info('OrderSeeder completed! Created ' . count($sampleOrders) . ' sample orders including ETC-251229-0015.');
    }
}