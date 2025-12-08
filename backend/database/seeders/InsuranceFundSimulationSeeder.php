<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Domain\Order\Services\InsuranceFundService;
use Carbon\Carbon;

class InsuranceFundSimulationSeeder extends Seeder
{
    /**
     * Run the database seeds for insurance fund simulation.
     */
    public function run(): void
    {
        $this->command->info('Seeding Insurance Fund simulation data...');

        // Get tenant ID (assuming we're working with tenant 1)
        $tenantId = '1';

        // Clear existing insurance fund transactions for clean simulation
        InsuranceFundTransaction::where('tenant_id', $tenantId)->delete();

        // Start with initial fund setup (6 months ago)
        $initialDate = Carbon::now()->subMonths(6);
        $currentBalance = 25000000; // Start with 25M IDR

        InsuranceFundTransaction::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'tenant_id' => $tenantId,
            'transaction_type' => 'contribution',
            'amount' => $currentBalance,
            'description' => 'Initial insurance fund capitalization',
            'balance_before' => 0,
            'balance_after' => $currentBalance,
            'created_at' => $initialDate,
            'updated_at' => $initialDate,
        ]);

        // Get some orders to use for realistic contributions
        $orders = Order::where('tenant_id', $tenantId)->take(20)->get();
        $refundRequests = RefundRequest::where('tenant_id', $tenantId)->take(10)->get();

        // Simulate monthly contributions from completed orders (last 6 months)
        for ($monthsBack = 5; $monthsBack >= 0; $monthsBack--) {
            $monthDate = Carbon::now()->subMonths($monthsBack)->startOfMonth();
            
            // Add 2-3 contributions per month from orders
            $monthlyContributions = rand(2, 4);
            
            for ($i = 0; $i < $monthlyContributions; $i++) {
                $order = $orders->random();
                $contributionRate = 0.025; // 2.5%
                $contributionAmount = $order->total_amount * $contributionRate;
                
                $transactionDate = $monthDate->copy()->addDays(rand(1, 28))->addHours(rand(8, 17));
                $currentBalance += $contributionAmount;

                InsuranceFundTransaction::create([
                    'id' => \Illuminate\Support\Str::uuid(),
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'transaction_type' => 'contribution',
                    'amount' => $contributionAmount,
                    'description' => "Insurance contribution from order {$order->order_number}",
                    'balance_before' => $currentBalance - $contributionAmount,
                    'balance_after' => $currentBalance,
                    'created_at' => $transactionDate,
                    'updated_at' => $transactionDate,
                ]);
            }

            // Add some withdrawals for refund claims (1-2 per month)
            if ($monthsBack < 4) { // Only last 4 months have withdrawals
                $monthlyWithdrawals = rand(0, 2);
                
                for ($i = 0; $i < $monthlyWithdrawals; $i++) {
                    if ($refundRequests->count() > 0) {
                        $refund = $refundRequests->random();
                        $withdrawalAmount = rand(500000, 3000000); // Random withdrawal 500K - 3M
                        
                        if ($withdrawalAmount <= $currentBalance) {
                            $transactionDate = $monthDate->copy()->addDays(rand(10, 28))->addHours(rand(9, 16));
                            $currentBalance -= $withdrawalAmount;

                            InsuranceFundTransaction::create([
                                'id' => \Illuminate\Support\Str::uuid(),
                                'tenant_id' => $tenantId,
                                'refund_request_id' => $refund->id,
                                'transaction_type' => 'withdrawal',
                                'amount' => $withdrawalAmount,
                                'description' => "Insurance claim payout for refund {$refund->request_number}",
                                'balance_before' => $currentBalance + $withdrawalAmount,
                                'balance_after' => $currentBalance,
                                'created_at' => $transactionDate,
                                'updated_at' => $transactionDate,
                            ]);
                        }
                    }
                }
            }
        }

        // Add some recent transactions for this month
        $thisMonth = Carbon::now()->startOfMonth();
        
        // Recent contributions (2 this month)
        for ($i = 0; $i < 2; $i++) {
            $order = $orders->random();
            $contributionAmount = $order->total_amount * 0.025;
            $transactionDate = $thisMonth->copy()->addDays(rand(1, Carbon::now()->day))->addHours(rand(9, 17));
            $currentBalance += $contributionAmount;

            InsuranceFundTransaction::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'tenant_id' => $tenantId,
                'order_id' => $order->id,
                'transaction_type' => 'contribution',
                'amount' => $contributionAmount,
                'description' => "Insurance contribution from order {$order->order_number}",
                'balance_before' => $currentBalance - $contributionAmount,
                'balance_after' => $currentBalance,
                'created_at' => $transactionDate,
                'updated_at' => $transactionDate,
            ]);
        }

        // One recent withdrawal this month
        if ($refundRequests->count() > 0) {
            $refund = $refundRequests->random();
            $withdrawalAmount = 1500000; // 1.5M withdrawal
            $transactionDate = Carbon::now()->subDays(3)->addHours(14);
            $currentBalance -= $withdrawalAmount;

            InsuranceFundTransaction::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'tenant_id' => $tenantId,
                'refund_request_id' => $refund->id,
                'transaction_type' => 'withdrawal',
                'amount' => $withdrawalAmount,
                'description' => "Insurance claim payout for refund {$refund->request_number}",
                'balance_before' => $currentBalance + $withdrawalAmount,
                'balance_after' => $currentBalance,
                'created_at' => $transactionDate,
                'updated_at' => $transactionDate,
            ]);
        }

        $finalCount = InsuranceFundTransaction::where('tenant_id', $tenantId)->count();
        $finalBalance = InsuranceFundService::getBalance($tenantId);
        
        $this->command->info("✅ Insurance Fund simulation seeded successfully!");
        $this->command->info("   → {$finalCount} transactions created");
        $this->command->info("   → Final balance: IDR " . number_format($finalBalance, 0, ',', '.'));
    }
}