<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\VendorPayment;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Carbon\Carbon;

class VendorPaymentSeeder extends Seeder
{
    public function run(): void
    {
        // Get first available tenant
        $tenant = TenantEloquentModel::first();
        
        if (!$tenant) {
            $this->command->warn('No tenant found. Skipping VendorPaymentSeeder.');
            return;
        }
        
        $this->command->info('Using tenant: ' . $tenant->name);

        $vendors = Vendor::where('tenant_id', $tenant->id)->get();
        
        if ($vendors->isEmpty()) {
            $this->command->warn('No vendors found for tenant. Please run VendorSeeder first.');
            return;
        }

        $this->command->info('Seeding vendor payments...');

        $paymentStatuses = ['pending', 'paid', 'overdue', 'scheduled', 'processing'];
        $paymentMethods = ['bank_transfer', 'wire_transfer', 'check', 'cash'];

        foreach ($vendors as $vendor) {
            // Create 5-8 payments per vendor
            $paymentCount = rand(5, 8);
            
            for ($i = 0; $i < $paymentCount; $i++) {
                $amount = rand(5000000, 50000000);
                $taxAmount = $amount * 0.11; // 11% PPN
                $totalAmount = $amount + $taxAmount;
                
                $createdDate = Carbon::now()->subDays(rand(1, 90));
                $dueDate = (clone $createdDate)->addDays(rand(15, 60));
                $status = $paymentStatuses[array_rand($paymentStatuses)];
                
                $paidDate = null;
                if ($status === 'paid') {
                    $paidDate = (clone $dueDate)->subDays(rand(1, 10));
                } elseif ($status === 'overdue') {
                    $dueDate = Carbon::now()->subDays(rand(1, 15));
                }

                VendorPayment::create([
                    'tenant_id' => $tenant->id,
                    'vendor_id' => $vendor->id,
                    'order_id' => 'ORD-' . rand(10000, 99999),
                    'invoice_number' => 'INV-' . date('Ymd') . '-' . str_pad($vendor->id, 3, '0', STR_PAD_LEFT) . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                    'vendor_name' => $vendor->name,
                    'description' => 'Payment for materials order ' . rand(1000, 9999),
                    'amount' => $amount,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'due_date' => $dueDate,
                    'paid_date' => $paidDate,
                    'status' => $status,
                    'payment_method' => $status === 'paid' ? $paymentMethods[array_rand($paymentMethods)] : null,
                    'payment_details' => $status === 'paid' ? [
                        'bank_name' => 'Bank Mandiri',
                        'account_number' => '1234567890',
                        'reference_number' => 'REF-' . rand(100000, 999999),
                    ] : null,
                    'created_at' => $createdDate,
                    'updated_at' => $status === 'paid' ? $paidDate : $createdDate,
                ]);
            }
        }

        $totalPayments = VendorPayment::where('tenant_id', $tenant->id)->count();
        $this->command->info("Vendor payments seeded successfully. Total: {$totalPayments} payments.");
    }
}
