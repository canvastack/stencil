<?php

namespace App\Application\Order\Services;

use App\Domain\Order\Entities\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PT Custom Etching Xenial Business Logic Service
 * 
 * Handles specific business logic for PT CEX broker/makelar model:
 * - Customer order input → vendor sourcing → price negotiation → customer quotation
 * - Payment processing (DP 50% vs Full 100%) → production monitoring → delivery
 * - Profit calculation and payment allocation automation
 */
class PtCexBusinessService
{
    /**
     * Calculate markup amount and percentage for PT CEX business model
     */
    public function calculateMarkup(float $vendorCost, float $customerPrice): array
    {
        if ($vendorCost <= 0 || $customerPrice <= 0) {
            return [
                'markup_amount' => 0,
                'markup_percentage' => 0,
                'is_profitable' => false
            ];
        }

        $markupAmount = $customerPrice - $vendorCost;
        $markupPercentage = ($markupAmount / $vendorCost) * 100;

        return [
            'markup_amount' => $markupAmount,
            'markup_percentage' => round($markupPercentage, 2),
            'is_profitable' => $markupAmount > 0
        ];
    }

    /**
     * Calculate payment amounts based on PT CEX payment model
     */
    public function calculatePaymentAmounts(float $totalAmount, string $paymentType): array
    {
        switch ($paymentType) {
            case 'dp_50':
                $downPayment = $totalAmount * 0.5;
                $remainingAmount = $totalAmount - $downPayment;
                break;
                
            case 'full_100':
                $downPayment = $totalAmount;
                $remainingAmount = 0;
                break;
                
            default:
                throw new \InvalidArgumentException("Invalid payment type: {$paymentType}");
        }

        return [
            'down_payment' => $downPayment,
            'remaining_amount' => $remainingAmount,
            'total_amount' => $totalAmount
        ];
    }

    /**
     * Validate business rules for PT CEX order transitions
     */
    public function validateBusinessRules(Order $order, string $newStatus): array
    {
        $errors = [];

        switch ($newStatus) {
            case 'vendor_sourcing':
                // Must have customer and order details
                if (empty($order->customer_id)) {
                    $errors[] = 'Customer is required for vendor sourcing';
                }
                if (empty($order->items) || count($order->items) === 0) {
                    $errors[] = 'Order items are required for vendor sourcing';
                }
                break;

            case 'vendor_negotiation':
                // Must have vendor assigned
                if (empty($order->vendor_id)) {
                    $errors[] = 'Vendor must be assigned before negotiation';
                }
                break;

            case 'customer_quote':
                // Must have vendor cost for markup calculation
                if (empty($order->vendor_cost) || $order->vendor_cost <= 0) {
                    $errors[] = 'Vendor cost is required for customer quotation';
                }
                if (empty($order->customer_price) || $order->customer_price <= 0) {
                    $errors[] = 'Customer price is required for quotation';
                }
                break;

            case 'awaiting_payment':
                // Must have valid quotation
                if (empty($order->customer_price) || $order->customer_price <= 0) {
                    $errors[] = 'Valid customer price is required';
                }
                if (empty($order->payment_type)) {
                    $errors[] = 'Payment type must be selected (DP 50% or Full 100%)';
                }
                break;

            case 'partial_payment':
                // Validate DP amount (must be at least 50%)
                $expectedDp = $order->customer_price * 0.5;
                if ($order->paid_amount < $expectedDp) {
                    $errors[] = "DP must be at least 50% (Rp " . number_format($expectedDp) . ")";
                }
                break;

            case 'full_payment':
                // Validate full payment
                if ($order->paid_amount < $order->customer_price) {
                    $errors[] = 'Full payment amount must equal customer price';
                }
                break;

            case 'in_production':
                // Must have payment received
                if (!in_array($order->status, ['partial_payment', 'full_payment'])) {
                    $errors[] = 'Payment must be received before production';
                }
                if (empty($order->vendor_id)) {
                    $errors[] = 'Vendor must be assigned for production';
                }
                break;
        }

        return $errors;
    }

    /**
     * Create payment allocations for PT CEX business model
     */
    public function createPaymentAllocations(Order $order, array $paymentTransaction): void
    {
        DB::beginTransaction();
        
        try {
            $allocations = [];

            if ($paymentTransaction['direction'] === 'incoming') {
                // Customer payment allocation
                $this->allocateCustomerPayment($order, $paymentTransaction, $allocations);
            } else {
                // Vendor payment allocation
                $this->allocateVendorPayment($order, $paymentTransaction, $allocations);
            }

            // Store allocations in database
            foreach ($allocations as $allocation) {
                DB::table('payment_allocations')->insert(array_merge($allocation, [
                    'uuid' => \Illuminate\Support\Str::uuid(),
                    'tenant_id' => $order->tenant_id,
                    'order_id' => $order->id,
                    'order_payment_transaction_id' => $paymentTransaction['id'],
                    'allocated_by' => auth()->id(),
                    'allocated_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            DB::commit();
            
            Log::info('Payment allocations created', [
                'order_id' => $order->id,
                'transaction_id' => $paymentTransaction['id'],
                'allocations_count' => count($allocations)
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Failed to create payment allocations', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Allocate customer payment (DP or full payment)
     */
    private function allocateCustomerPayment(Order $order, array $transaction, array &$allocations): void
    {
        $amount = $transaction['amount'];
        
        if ($order->payment_type === 'dp_50') {
            // DP 50% allocation
            $vendorDpAmount = $this->calculateVendorDpAmount($order, $amount);
            $profitAmount = $amount - $vendorDpAmount;

            $allocations[] = [
                'allocation_type' => 'vendor_dp',
                'allocated_amount' => $vendorDpAmount,
                'allocated_percentage' => ($vendorDpAmount / $amount) * 100,
                'description' => 'Vendor DP allocation from customer DP',
                'target_vendor_id' => $order->vendor_id,
                'status' => 'allocated'
            ];

            $allocations[] = [
                'allocation_type' => 'profit_margin',
                'allocated_amount' => $profitAmount,
                'allocated_percentage' => ($profitAmount / $amount) * 100,
                'description' => 'Company profit margin from DP',
                'status' => 'allocated'
            ];

        } elseif ($order->payment_type === 'full_100') {
            // Full payment allocation
            $vendorPayment = $order->vendor_cost;
            $profitAmount = $amount - $vendorPayment;

            $allocations[] = [
                'allocation_type' => 'vendor_final',
                'allocated_amount' => $vendorPayment,
                'allocated_percentage' => ($vendorPayment / $amount) * 100,
                'description' => 'Full vendor payment',
                'target_vendor_id' => $order->vendor_id,
                'status' => 'allocated'
            ];

            $allocations[] = [
                'allocation_type' => 'profit_margin',
                'allocated_amount' => $profitAmount,
                'allocated_percentage' => ($profitAmount / $amount) * 100,
                'description' => 'Company profit margin from full payment',
                'status' => 'allocated'
            ];
        }
    }

    /**
     * Calculate vendor DP amount (must be less than customer DP)
     */
    private function calculateVendorDpAmount(Order $order, float $customerDpAmount): float
    {
        if (!$order->vendor_cost) {
            return 0;
        }

        // Vendor DP is 40% of vendor cost or 80% of customer DP, whichever is less
        $vendorDp40Percent = $order->vendor_cost * 0.4;
        $customerDp80Percent = $customerDpAmount * 0.8;

        return min($vendorDp40Percent, $customerDp80Percent);
    }

    /**
     * Allocate vendor payment
     */
    private function allocateVendorPayment(Order $order, array $transaction, array &$allocations): void
    {
        $allocations[] = [
            'allocation_type' => $transaction['type'] === 'dp' ? 'vendor_dp' : 'vendor_final',
            'allocated_amount' => $transaction['amount'],
            'allocated_percentage' => 100,
            'description' => 'Payment to vendor for order production',
            'target_vendor_id' => $order->vendor_id,
            'status' => 'paid'
        ];
    }

    /**
     * Generate business analytics for PT CEX dashboard
     */
    public function generateBusinessAnalytics(string $tenantId, array $dateRange = null): array
    {
        $query = DB::table('orders')->where('tenant_id', $tenantId);
        
        if ($dateRange) {
            $query->whereBetween('created_at', $dateRange);
        }

        $orders = $query->get();
        
        return [
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('customer_price'),
            'total_vendor_costs' => $orders->sum('vendor_cost'),
            'total_profit' => $orders->sum('markup_amount'),
            'average_markup_percentage' => $orders->avg('markup_percentage'),
            'orders_by_status' => $orders->groupBy('status')->map->count(),
            'orders_by_payment_type' => $orders->groupBy('payment_type')->map->count(),
            'monthly_trend' => $this->calculateMonthlyTrend($orders),
            'top_profitable_orders' => $orders->where('markup_amount', '>', 0)
                                              ->sortByDesc('markup_amount')
                                              ->take(5)
                                              ->values()
        ];
    }

    /**
     * Calculate monthly business trend
     */
    private function calculateMonthlyTrend($orders): array
    {
        return $orders->groupBy(function ($order) {
            return \Carbon\Carbon::parse($order->created_at)->format('Y-m');
        })->map(function ($monthOrders) {
            return [
                'orders_count' => $monthOrders->count(),
                'revenue' => $monthOrders->sum('customer_price'),
                'profit' => $monthOrders->sum('markup_amount'),
                'average_markup' => $monthOrders->avg('markup_percentage')
            ];
        });
    }
}