<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Infrastructure\Persistence\Eloquent\Models\RefundApproval;
use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel as Order;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel as Customer;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel as User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use Carbon\Carbon;

class RefundDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Run for each active tenant
        $tenants = Tenant::where('status', 'active')->get();

        foreach ($tenants as $tenant) {
            $this->seedTenantRefundData($tenant);
        }
    }

    private function seedTenantRefundData(Tenant $tenant): void
    {
        // Get sample data for the tenant using the correct column name
        $customers = Customer::where('tenant_id', $tenant->id)->take(10)->get();
        $orders = Order::where('tenant_id', $tenant->id)->take(20)->get(); 
        $users = User::where('tenant_id', $tenant->id)->take(5)->get();

        if ($customers->isEmpty() || $orders->isEmpty() || $users->isEmpty()) {
            $this->command->info("Skipping tenant {$tenant->name} - missing required data");
            return;
        }

        // Create 25 diverse refund requests for realistic simulation
        $refundRequests = $this->createRefundRequests($tenant, $customers, $orders, $users);

        // Create approvals for processed refunds
        $this->createApprovals($refundRequests, $users);

        // Create insurance fund transactions
        $this->createInsuranceFundTransactions($tenant, $refundRequests);

        $this->command->info("Created refund data for tenant: {$tenant->name}");
    }

    private function createRefundRequests(Tenant $tenant, $customers, $orders, $users): array
    {
        $refundReasons = [
            'customer_request', 'quality_issue', 'timeline_delay', 
            'vendor_failure', 'production_error', 'shipping_damage'
        ];

        $refundTypes = ['full_refund', 'partial_refund', 'replacement_order', 'credit_note'];
        $statuses = [
            'pending_review', 'under_investigation', 'pending_finance', 
            'pending_manager', 'approved', 'processing', 'completed', 'rejected'
        ];

        $refundRequests = [];

        for ($i = 1; $i <= 25; $i++) {
            $customer = $customers->random();
            $order = $orders->random();
            $requester = $users->random();
            $reason = $refundReasons[array_rand($refundReasons)];
            $type = $refundTypes[array_rand($refundTypes)];
            $status = $statuses[array_rand($statuses)];

            // Generate realistic amounts based on order
            $orderTotal = $order->total_amount ?? rand(5000000, 50000000);
            $customerPaidAmount = $orderTotal * (rand(50, 100) / 100);
            $vendorCostPaid = $orderTotal * (rand(30, 70) / 100);
            $productionProgress = rand(0, 100);
            
            // Calculate refund amounts based on scenario
            $refundableToCustomer = $this->calculateRefundAmount($reason, $customerPaidAmount, $productionProgress);
            $customerRequestAmount = $type === 'full_refund' ? $customerPaidAmount : $refundableToCustomer * (rand(80, 120) / 100);

            $refundRequest = RefundRequest::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'request_number' => 'RFD-' . date('Ymd') . '-T' . $tenant->id . '-' . sprintf('%03d', $i),
                'refund_reason' => $reason,
                'refund_type' => $type,
                'customer_request_amount' => $customerRequestAmount,
                'customer_notes' => $this->generateCustomerNotes($reason),
                'status' => $status,
                'calculation' => [
                    'order_total' => $orderTotal,
                    'customer_paid_amount' => $customerPaidAmount,
                    'vendor_cost_paid' => $vendorCostPaid,
                    'production_progress' => $productionProgress,
                    'refund_reason' => $reason,
                    'quality_issue_percentage' => $reason === 'quality_issue' ? rand(40, 80) : 0,
                    'fault_party' => $this->determineFaultParty($reason),
                    'refundable_to_customer' => $refundableToCustomer,
                    'company_loss' => max(0, $refundableToCustomer * (rand(5, 15) / 100)),
                    'vendor_recoverable' => $reason === 'vendor_failure' ? $vendorCostPaid * (rand(70, 90) / 100) : 0,
                    'insurance_cover' => $refundableToCustomer > 10000000 ? $refundableToCustomer * 0.1 : 0,
                    'applied_rules' => $this->getAppliedRules($reason),
                    'calculated_at' => now()->toISOString(),
                    'calculated_by' => 'system'
                ],
                'requested_by' => $requester->id,
                'requested_at' => $this->getRandomRecentDate(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $refundRequests[] = $refundRequest;
        }

        return $refundRequests;
    }

    private function createApprovals($refundRequests, $users): void
    {
        $approvalDecisions = ['approved', 'rejected', 'needs_info'];
        $processedStatuses = ['approved', 'processing', 'completed', 'rejected'];

        foreach ($refundRequests as $request) {
            // Only create approvals for requests that have been processed
            if (!in_array($request->status, $processedStatuses)) {
                continue;
            }

            $approver = $users->random();
            $decision = $request->status === 'rejected' ? 'rejected' : 'approved';

            RefundApproval::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'tenant_id' => $request->tenant_id,
                'refund_request_id' => $request->id,
                'approval_level' => 1,
                'approver_id' => $approver->id,
                'decision' => $decision,
                'decision_notes' => $this->generateApprovalNotes($decision),
                'adjusted_amount' => $request->calculation['refundable_to_customer'],
                'decided_at' => $this->getRandomDateAfter($request->requested_at),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function createInsuranceFundTransactions(Tenant $tenant, $refundRequests): void
    {
        $currentBalance = 50000000; // Start with 50M balance

        // Create initial fund setup
        InsuranceFundTransaction::create([
            'id' => \Illuminate\Support\Str::uuid(),
            'tenant_id' => $tenant->id,
            'transaction_type' => 'contribution',
            'amount' => $currentBalance,
            'description' => 'Initial insurance fund setup',
            'refund_request_id' => null,
            'balance_before' => 0,
            'balance_after' => $currentBalance,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Add monthly contributions
        for ($month = 5; $month >= 1; $month--) {
            $contributionAmount = rand(5000000, 10000000);
            $currentBalance += $contributionAmount;

            InsuranceFundTransaction::create([
                'id' => \Illuminate\Support\Str::uuid(),
                'tenant_id' => $tenant->id,
                'transaction_type' => 'contribution',
                'amount' => $contributionAmount,
                'description' => 'Monthly contribution to insurance fund',
                'refund_request_id' => null,
                'balance_before' => $currentBalance - $contributionAmount,
                'balance_after' => $currentBalance,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Create withdrawals for completed refunds that used insurance
        foreach ($refundRequests as $request) {
            if ($request->status === 'completed' && $request->calculation['insurance_cover'] > 0) {
                $withdrawalAmount = $request->calculation['insurance_cover'];
                $currentBalance -= $withdrawalAmount;

                InsuranceFundTransaction::create([
                    'id' => \Illuminate\Support\Str::uuid(),
                    'tenant_id' => $tenant->id,
                    'transaction_type' => 'withdrawal',
                    'amount' => $withdrawalAmount,
                    'description' => "Insurance cover for refund {$request->request_number}",
                    'refund_request_id' => $request->id,
                    'balance_before' => $currentBalance + $withdrawalAmount,
                    'balance_after' => $currentBalance,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function calculateRefundAmount(string $reason, float $customerPaid, int $productionProgress): float
    {
        switch ($reason) {
            case 'customer_request':
                return $customerPaid * (100 - $productionProgress) / 100;
            case 'quality_issue':
                return $customerPaid * (rand(60, 90) / 100);
            case 'timeline_delay':
                return $customerPaid * (rand(40, 70) / 100);
            case 'vendor_failure':
                return $customerPaid * (rand(80, 100) / 100);
            case 'production_error':
                return $customerPaid * (rand(70, 95) / 100);
            case 'shipping_damage':
                return $customerPaid * (rand(85, 100) / 100);
            default:
                return $customerPaid * 0.5;
        }
    }

    private function generateCustomerNotes(string $reason): string
    {
        $notes = [
            'customer_request' => [
                'Perubahan rencana bisnis, tidak jadi membutuhkan produk ini',
                'Proyek ditunda oleh manajemen, mohon refund untuk pembayaran',
                'Budget dialihkan ke proyek lain yang lebih prioritas'
            ],
            'quality_issue' => [
                'Produk yang diterima tidak sesuai dengan spesifikasi yang diminta',
                'Kualitas finishing tidak memenuhi standar yang diharapkan',
                'Material yang digunakan berbeda dari yang disetujui di awal'
            ],
            'timeline_delay' => [
                'Keterlambatan produksi menyebabkan missed deadline proyek kami',
                'Penundaan delivery berulang kali sehingga proyek terpaksa batal',
                'Timeline yang tidak realistis dari awal, mohon kompensasi'
            ],
            'vendor_failure' => [
                'Vendor tidak responsif dan tidak memenuhi komitmen',
                'Kualitas kerja vendor sangat buruk dan tidak profesional',
                'Vendor gagal deliver sesuai scope of work yang disepakati'
            ],
            'production_error' => [
                'Error dalam proses produksi menyebabkan produk cacat',
                'Kesalahan dalam dimensi dan ukuran produk',
                'Proses finishing yang salah sehingga hasil tidak sesuai'
            ],
            'shipping_damage' => [
                'Produk rusak saat pengiriman karena packaging yang kurang baik',
                'Kerusakan akibat mishandling oleh kurir',
                'Produk hancur karena tidak ada proteksi yang memadai'
            ]
        ];

        $reasonNotes = $notes[$reason] ?? ['Permintaan refund untuk pesanan ini'];
        return $reasonNotes[array_rand($reasonNotes)];
    }

    private function generateApprovalNotes(string $decision): string
    {
        if ($decision === 'approved') {
            $notes = [
                'Refund disetujui sesuai dengan kebijakan perusahaan',
                'Setelah investigasi, kami setujui refund sesuai kalkulasi sistem',
                'Approved berdasarkan review dokumentasi dan bukti yang ada',
                'Refund justified dan sesuai dengan terms & conditions'
            ];
        } else {
            $notes = [
                'Tidak memenuhi kriteria refund berdasarkan kebijakan',
                'Evidence yang diberikan tidak cukup untuk mendukung claim',
                'Sudah melewati batas waktu yang ditentukan untuk refund',
                'Refund request tidak sesuai dengan terms yang disepakati'
            ];
        }

        return $notes[array_rand($notes)];
    }

    private function determineFaultParty(string $reason): string
    {
        switch ($reason) {
            case 'customer_request':
                return 'customer';
            case 'vendor_failure':
                return 'vendor';
            case 'production_error':
            case 'timeline_delay':
                return 'company';
            case 'quality_issue':
            case 'shipping_damage':
                return rand(0, 1) ? 'vendor' : 'company';
            default:
                return 'shared';
        }
    }

    private function getAppliedRules(string $reason): array
    {
        $baseRules = ['standard_refund_calculation'];
        
        switch ($reason) {
            case 'quality_issue':
                $baseRules[] = 'quality_issue_proportional';
                break;
            case 'timeline_delay':
                $baseRules[] = 'timeline_penalty_applied';
                break;
            case 'vendor_failure':
                $baseRules[] = 'vendor_liability_recovery';
                break;
        }

        if (rand(0, 2) === 0) {
            $baseRules[] = 'insurance_fund_applied';
        }

        return $baseRules;
    }

    private function getRandomRecentDate(): string
    {
        return Carbon::now()
            ->subDays(rand(1, 30))
            ->subHours(rand(0, 23))
            ->toISOString();
    }

    private function getRandomDateAfter(string $baseDate): string
    {
        return Carbon::parse($baseDate)
            ->addDays(rand(1, 5))
            ->addHours(rand(1, 12))
            ->toISOString();
    }
}