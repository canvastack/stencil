<?php

namespace App\Domain\Vendor\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\VendorPayment;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VendorFinancialService
{
    /**
     * Get comprehensive financial overview
     */
    public function getFinancialOverview(Carbon $dateFrom, Carbon $dateTo, ?int $vendorId = null, ?string $status = null): array
    {
        $query = VendorPayment::whereBetween('created_at', [$dateFrom, $dateTo]);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $payments = $query->get();

        // Calculate summary statistics
        $totalPayments = $payments->sum('total_amount');
        $pendingPayments = $payments->where('status', 'pending')->sum('total_amount');
        $processedPayments = $payments->whereIn('status', ['paid', 'processing'])->sum('total_amount');
        $overduePayments = $payments->where('status', 'overdue')->sum('total_amount');

        // Calculate average payment time
        $paidPayments = $payments->where('status', 'paid')->filter(function ($payment) {
            return $payment->paid_date && $payment->created_at;
        });

        $avgPaymentDays = $paidPayments->isEmpty() ? 0 : $paidPayments->map(function ($payment) {
            return $payment->created_at->diffInDays($payment->paid_date);
        })->average();

        // Vendor-specific metrics
        $vendorMetrics = $this->calculateVendorMetrics($payments);

        // Monthly breakdown
        $monthlyBreakdown = $this->getMonthlyBreakdown($payments, $dateFrom, $dateTo);

        return [
            'summary' => [
                'total_payments' => $totalPayments,
                'pending_amount' => $pendingPayments,
                'processed_amount' => $processedPayments,
                'overdue_amount' => $overduePayments,
                'payment_count' => $payments->count(),
                'average_payment_days' => round($avgPaymentDays, 1),
                'vendor_count' => $payments->pluck('vendor_id')->unique()->count(),
            ],
            'vendor_metrics' => $vendorMetrics,
            'monthly_breakdown' => $monthlyBreakdown,
            'status_distribution' => $this->getStatusDistribution($payments),
        ];
    }

    /**
     * Get cash flow analysis
     */
    public function getCashFlowAnalysis(string $period, Carbon $dateFrom, Carbon $dateTo, ?int $vendorId = null): array
    {
        $query = VendorPayment::whereBetween('created_at', [$dateFrom, $dateTo]);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        $payments = $query->with('vendor')->get();

        // Group by period
        $groupedPayments = $this->groupPaymentsByPeriod($payments, $period);

        // Calculate cash flow metrics
        $cashFlowData = $groupedPayments->map(function ($periodPayments, $periodKey) {
            $outflow = $periodPayments->sum('total_amount');
            $pendingOutflow = $periodPayments->where('status', 'pending')->sum('total_amount');
            $actualOutflow = $periodPayments->where('status', 'paid')->sum('total_amount');

            return [
                'period' => $periodKey,
                'total_outflow' => $outflow,
                'pending_outflow' => $pendingOutflow,
                'actual_outflow' => $actualOutflow,
                'payment_count' => $periodPayments->count(),
                'vendor_count' => $periodPayments->pluck('vendor_id')->unique()->count(),
                'average_payment' => $periodPayments->count() > 0 ? $outflow / $periodPayments->count() : 0,
            ];
        })->values();

        // Calculate trends
        $trends = $this->calculateCashFlowTrends($cashFlowData);

        return [
            'cash_flow_data' => $cashFlowData,
            'trends' => $trends,
            'projections' => $this->generateCashFlowProjections($cashFlowData, $period),
        ];
    }

    /**
     * Get vendor profitability analysis
     */
    public function getVendorProfitability(Carbon $dateFrom, Carbon $dateTo, int $minOrders = 1, string $sortBy = 'total_profit', string $sortOrder = 'desc', int $limit = 20): array
    {
        $vendorData = VendorOrder::with(['vendor', 'order'])
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->where('status', 'completed')
            ->get()
            ->groupBy('vendor_id')
            ->map(function ($orders, $vendorId) {
                $vendor = $orders->first()->vendor;
                $totalOrders = $orders->count();

                if ($totalOrders < 1) {
                    return null;
                }

                // Calculate financial metrics
                $totalRevenue = $orders->sum(function ($vendorOrder) {
                    return $vendorOrder->order->total_amount ?? 0;
                });

                $totalCost = $orders->sum('final_price');
                $totalProfit = $totalRevenue - $totalCost;
                $profitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

                // Calculate performance metrics
                $avgLeadTime = $orders->whereNotNull('actual_lead_time_days')->avg('actual_lead_time_days') ?? 0;
                $onTimeRate = $orders->where('delivery_status', 'on_time')->count() / $totalOrders * 100;
                $avgQualityRating = $orders->whereNotNull('quality_rating')->avg('quality_rating') ?? 0;

                return [
                    'vendor_id' => $vendorId,
                    'vendor_name' => $vendor->name,
                    'vendor_code' => $vendor->code,
                    'quality_tier' => $vendor->quality_tier,
                    'order_count' => $totalOrders,
                    'total_revenue' => $totalRevenue,
                    'total_cost' => $totalCost,
                    'total_profit' => $totalProfit,
                    'profit_margin' => round($profitMargin, 2),
                    'average_order_value' => $totalOrders > 0 ? $totalRevenue / $totalOrders : 0,
                    'average_lead_time' => round($avgLeadTime, 1),
                    'on_time_rate' => round($onTimeRate, 1),
                    'average_quality_rating' => round($avgQualityRating, 2),
                    'roi' => $totalCost > 0 ? ($totalProfit / $totalCost) * 100 : 0,
                ];
            })
            ->filter(function ($data) use ($minOrders) {
                return $data && $data['order_count'] >= $minOrders;
            })
            ->sortBy([$sortBy, $sortOrder === 'desc' ? SORT_DESC : SORT_ASC])
            ->take($limit)
            ->values();

        return $vendorData->toArray();
    }

    /**
     * Get payment schedule and projections
     */
    public function getPaymentSchedule(Carbon $dateFrom, Carbon $dateTo, ?int $vendorId = null, bool $includeProjections = true): array
    {
        $query = VendorPayment::with(['vendor', 'order'])
            ->whereBetween('due_date', [$dateFrom, $dateTo]);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        $scheduledPayments = $query->orderBy('due_date')->get();

        // Group by week for better visualization
        $weeklySchedule = $scheduledPayments->groupBy(function ($payment) {
            return $payment->due_date->startOfWeek()->toDateString();
        })->map(function ($weekPayments, $weekStart) {
            $totalAmount = $weekPayments->sum('total_amount');
            $pendingAmount = $weekPayments->where('status', 'pending')->sum('total_amount');
            $overdueAmount = $weekPayments->where('status', 'overdue')->sum('total_amount');

            return [
                'week_start' => $weekStart,
                'week_end' => Carbon::parse($weekStart)->endOfWeek()->toDateString(),
                'payment_count' => $weekPayments->count(),
                'total_amount' => $totalAmount,
                'pending_amount' => $pendingAmount,
                'overdue_amount' => $overdueAmount,
                'vendor_count' => $weekPayments->pluck('vendor_id')->unique()->count(),
                'payments' => $weekPayments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'vendor_name' => $payment->vendor->name ?? 'Unknown',
                        'order_number' => $payment->order->order_number ?? null,
                        'amount' => $payment->total_amount,
                        'status' => $payment->status,
                        'due_date' => $payment->due_date->toDateString(),
                        'days_until_due' => now()->diffInDays($payment->due_date, false),
                    ];
                })->values(),
            ];
        });

        $result = [
            'weekly_schedule' => $weeklySchedule->values(),
            'summary' => [
                'total_scheduled' => $scheduledPayments->sum('total_amount'),
                'pending_count' => $scheduledPayments->where('status', 'pending')->count(),
                'overdue_count' => $scheduledPayments->where('status', 'overdue')->count(),
                'upcoming_7_days' => $scheduledPayments->filter(function ($payment) {
                    return $payment->due_date->between(now(), now()->addDays(7));
                })->sum('total_amount'),
            ],
        ];

        if ($includeProjections) {
            $result['projections'] = $this->generatePaymentProjections($scheduledPayments);
        }

        return $result;
    }

    /**
     * Create payment plan for order
     */
    public function createPaymentPlan(Order $order, array $planData): array
    {
        $vendorId = $planData['vendor_id'];
        $totalAmount = $planData['total_amount'];
        $paymentType = $planData['payment_type'];

        $paymentPlan = [
            'order_id' => $order->id,
            'vendor_id' => $vendorId,
            'total_amount' => $totalAmount,
            'payment_type' => $paymentType,
            'installments' => [],
        ];

        switch ($paymentType) {
            case 'down_payment':
                $downPaymentPercentage = $planData['down_payment_percentage'] ?? 50;
                $downPaymentAmount = $planData['down_payment_amount'] ?? ($totalAmount * $downPaymentPercentage / 100);
                $remainingAmount = $totalAmount - $downPaymentAmount;

                $paymentPlan['installments'] = [
                    [
                        'sequence' => 1,
                        'type' => 'down_payment',
                        'amount' => $downPaymentAmount,
                        'percentage' => round(($downPaymentAmount / $totalAmount) * 100, 2),
                        'due_date' => now()->addDays(7)->toDateString(),
                        'description' => 'Down payment for order initiation',
                    ],
                    [
                        'sequence' => 2,
                        'type' => 'final_payment',
                        'amount' => $remainingAmount,
                        'percentage' => round(($remainingAmount / $totalAmount) * 100, 2),
                        'due_date' => now()->addDays($planData['payment_terms_days'] ?? 30)->toDateString(),
                        'description' => 'Final payment on completion',
                    ],
                ];
                break;

            case 'full_payment':
                $paymentPlan['installments'] = [
                    [
                        'sequence' => 1,
                        'type' => 'full_payment',
                        'amount' => $totalAmount,
                        'percentage' => 100,
                        'due_date' => now()->addDays($planData['payment_terms_days'] ?? 30)->toDateString(),
                        'description' => 'Full payment',
                    ],
                ];
                break;

            case 'installments':
                $installmentCount = $planData['installment_count'] ?? 3;
                $installmentAmount = $totalAmount / $installmentCount;
                $paymentTermsDays = $planData['payment_terms_days'] ?? 30;

                for ($i = 1; $i <= $installmentCount; $i++) {
                    $paymentPlan['installments'][] = [
                        'sequence' => $i,
                        'type' => 'installment',
                        'amount' => $i === $installmentCount ? ($totalAmount - ($installmentAmount * ($installmentCount - 1))) : $installmentAmount,
                        'percentage' => round((100 / $installmentCount), 2),
                        'due_date' => now()->addDays($paymentTermsDays * $i)->toDateString(),
                        'description' => "Installment {$i} of {$installmentCount}",
                    ];
                }
                break;
        }

        // Create VendorPayment records for each installment
        foreach ($paymentPlan['installments'] as $installment) {
            VendorPayment::create([
                'tenant_id' => $order->tenant_id,
                'vendor_id' => $vendorId,
                'order_id' => $order->id,
                'invoice_number' => $this->generateInvoiceNumber($order, $installment['sequence']),
                'amount' => $installment['amount'],
                'total_amount' => $installment['amount'], // Assuming no taxes for now
                'status' => 'pending',
                'payment_method' => 'bank_transfer',
                'due_date' => Carbon::parse($installment['due_date']),
                'description' => $installment['description'],
                'notes' => $planData['notes'] ?? null,
            ]);
        }

        return $paymentPlan;
    }

    /**
     * Process payment disbursement
     */
    public function processDisbursement(VendorPayment $payment, array $disbursementData): array
    {
        if ($payment->status !== 'pending') {
            throw new \DomainException('Only pending payments can be disbursed');
        }

        $payment->update([
            'status' => 'processing',
            'payment_method' => $disbursementData['disbursement_method'],
            'bank_account' => $disbursementData['bank_account_id'] ?? $disbursementData['wallet_account'] ?? null,
            'notes' => ($payment->notes ?? '') . "\nDisbursement: " . ($disbursementData['notes'] ?? ''),
            'metadata' => array_merge($payment->metadata ?? [], [
                'disbursement' => [
                    'method' => $disbursementData['disbursement_method'],
                    'reference_number' => $disbursementData['reference_number'] ?? null,
                    'processed_by' => $disbursementData['processed_by'],
                    'processed_at' => now()->toIso8601String(),
                ]
            ]),
        ]);

        // Simulate processing time (in real scenario, this would integrate with payment gateway)
        $payment->update([
            'status' => 'paid',
            'paid_date' => now(),
        ]);

        return [
            'payment_id' => $payment->id,
            'status' => $payment->status,
            'disbursement_method' => $disbursementData['disbursement_method'],
            'reference_number' => $disbursementData['reference_number'] ?? null,
            'processed_at' => now()->toIso8601String(),
        ];
    }

    // Private helper methods

    private function calculateVendorMetrics($payments): array
    {
        return $payments->groupBy('vendor_id')->map(function ($vendorPayments, $vendorId) {
            $vendor = $vendorPayments->first()->vendor;
            $totalAmount = $vendorPayments->sum('total_amount');
            $avgAmount = $vendorPayments->avg('total_amount');
            $paymentCount = $vendorPayments->count();

            return [
                'vendor_id' => $vendorId,
                'vendor_name' => $vendor->name ?? 'Unknown',
                'total_amount' => $totalAmount,
                'average_amount' => $avgAmount,
                'payment_count' => $paymentCount,
                'pending_amount' => $vendorPayments->where('status', 'pending')->sum('total_amount'),
                'paid_amount' => $vendorPayments->where('status', 'paid')->sum('total_amount'),
            ];
        })->values()->toArray();
    }

    private function getMonthlyBreakdown($payments, Carbon $dateFrom, Carbon $dateTo): array
    {
        return $payments->groupBy(function ($payment) {
            return $payment->created_at->format('Y-m');
        })->map(function ($monthPayments, $month) {
            return [
                'month' => $month,
                'total_amount' => $monthPayments->sum('total_amount'),
                'payment_count' => $monthPayments->count(),
                'pending_amount' => $monthPayments->where('status', 'pending')->sum('total_amount'),
                'paid_amount' => $monthPayments->where('status', 'paid')->sum('total_amount'),
                'vendor_count' => $monthPayments->pluck('vendor_id')->unique()->count(),
            ];
        })->values()->toArray();
    }

    private function getStatusDistribution($payments): array
    {
        return $payments->groupBy('status')->map(function ($statusPayments, $status) {
            return [
                'status' => $status,
                'count' => $statusPayments->count(),
                'total_amount' => $statusPayments->sum('total_amount'),
                'percentage' => round(($statusPayments->count() / $payments->count()) * 100, 1),
            ];
        })->values()->toArray();
    }

    private function groupPaymentsByPeriod($payments, string $period)
    {
        return $payments->groupBy(function ($payment) use ($period) {
            switch ($period) {
                case 'daily':
                    return $payment->created_at->format('Y-m-d');
                case 'weekly':
                    return $payment->created_at->startOfWeek()->format('Y-m-d');
                case 'quarterly':
                    $quarter = ceil($payment->created_at->month / 3);
                    return $payment->created_at->year . '-Q' . $quarter;
                case 'monthly':
                default:
                    return $payment->created_at->format('Y-m');
            }
        });
    }

    private function calculateCashFlowTrends($cashFlowData): array
    {
        if ($cashFlowData->count() < 2) {
            return ['trend' => 'insufficient_data'];
        }

        $latest = $cashFlowData->last();
        $previous = $cashFlowData->get($cashFlowData->count() - 2);

        $outflowChange = $latest['total_outflow'] - $previous['total_outflow'];
        $outflowChangePercent = $previous['total_outflow'] > 0 
            ? ($outflowChange / $previous['total_outflow']) * 100 
            : 0;

        return [
            'outflow_trend' => $outflowChange >= 0 ? 'increasing' : 'decreasing',
            'outflow_change_amount' => $outflowChange,
            'outflow_change_percent' => round($outflowChangePercent, 2),
            'average_payment_trend' => $latest['average_payment'] >= $previous['average_payment'] ? 'increasing' : 'decreasing',
        ];
    }

    private function generateCashFlowProjections($cashFlowData, string $period): array
    {
        // Simple projection based on average of last 3 periods
        $recentPeriods = $cashFlowData->take(-3);
        $avgOutflow = $recentPeriods->avg('total_outflow');
        $avgPaymentCount = $recentPeriods->avg('payment_count');

        return [
            'next_period_projected_outflow' => round($avgOutflow, 2),
            'next_period_projected_payments' => round($avgPaymentCount),
            'confidence_level' => $recentPeriods->count() >= 3 ? 'medium' : 'low',
        ];
    }

    private function generatePaymentProjections($scheduledPayments): array
    {
        $now = now();
        
        return [
            'next_7_days' => $scheduledPayments->filter(fn($p) => $p->due_date->between($now, $now->copy()->addDays(7)))->sum('total_amount'),
            'next_30_days' => $scheduledPayments->filter(fn($p) => $p->due_date->between($now, $now->copy()->addDays(30)))->sum('total_amount'),
            'next_90_days' => $scheduledPayments->filter(fn($p) => $p->due_date->between($now, $now->copy()->addDays(90)))->sum('total_amount'),
            'overdue_risk' => $scheduledPayments->where('status', 'pending')->filter(fn($p) => $p->due_date->isPast())->count(),
        ];
    }

    private function generateInvoiceNumber(Order $order, int $sequence): string
    {
        $orderNumber = $order->order_number ?? $order->id;
        return "INV-{$orderNumber}-{$sequence}";
    }
}