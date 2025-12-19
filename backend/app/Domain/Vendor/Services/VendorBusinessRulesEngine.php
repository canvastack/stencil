<?php

namespace App\Domain\Vendor\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class VendorBusinessRulesEngine
{
    /**
     * Business rules configuration
     */
    private array $businessRules = [
        'vendor_selection' => [
            'minimum_quality_score' => 3.0,
            'maximum_concurrent_orders' => 10,
            'required_certifications_for_premium' => ['ISO_9001', 'ISO_14001'],
            'quality_tier_requirements' => [
                'exclusive' => ['min_performance_score' => 4.5, 'min_completed_orders' => 50],
                'premium' => ['min_performance_score' => 4.0, 'min_completed_orders' => 20],
                'standard' => ['min_performance_score' => 3.0, 'min_completed_orders' => 5],
            ],
        ],
        'negotiation' => [
            'maximum_rounds' => 5,
            'minimum_discount_threshold' => 5, // percentage
            'maximum_discount_threshold' => 25, // percentage
            'auto_approval_threshold' => 1000000, // IDR
            'negotiation_expiry_days' => 7,
        ],
        'payment' => [
            'maximum_down_payment_percentage' => 70,
            'minimum_down_payment_percentage' => 30,
            'maximum_payment_terms_days' => 90,
            'auto_disburse_threshold' => 500000, // IDR
            'overdue_grace_period_days' => 3,
        ],
        'performance' => [
            'minimum_on_time_delivery_rate' => 80, // percentage
            'minimum_quality_rating' => 3.5,
            'maximum_lead_time_variance' => 20, // percentage
            'performance_review_frequency_days' => 90,
        ],
    ];

    /**
     * Evaluate if vendor is eligible for order assignment
     */
    public function evaluateVendorEligibility(Vendor $vendor, Order $order): array
    {
        $results = [
            'eligible' => true,
            'reasons' => [],
            'warnings' => [],
            'score' => 0,
        ];

        // Check quality score requirement
        $minQualityScore = $this->businessRules['vendor_selection']['minimum_quality_score'];
        if (($vendor->performance_score ?? 0) < $minQualityScore) {
            $results['eligible'] = false;
            $results['reasons'][] = "Vendor performance score ({$vendor->performance_score}) below minimum requirement ({$minQualityScore})";
        } else {
            $results['score'] += 20;
        }

        // Check concurrent orders capacity
        $maxConcurrentOrders = $this->businessRules['vendor_selection']['maximum_concurrent_orders'];
        $currentOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->count();

        if ($currentOrders >= $maxConcurrentOrders) {
            $results['eligible'] = false;
            $results['reasons'][] = "Vendor has reached maximum concurrent orders limit ({$maxConcurrentOrders})";
        } elseif ($currentOrders > ($maxConcurrentOrders * 0.8)) {
            $results['warnings'][] = "Vendor is near capacity ({$currentOrders}/{$maxConcurrentOrders} orders)";
            $results['score'] += 10;
        } else {
            $results['score'] += 20;
        }

        // Check quality tier requirements
        $qualityTierRules = $this->businessRules['vendor_selection']['quality_tier_requirements'][$vendor->quality_tier ?? 'standard'] ?? [];
        
        if (!empty($qualityTierRules)) {
            $completedOrders = VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', 'completed')
                ->count();

            if ($completedOrders < $qualityTierRules['min_completed_orders']) {
                $results['eligible'] = false;
                $results['reasons'][] = "Insufficient completed orders ({$completedOrders}) for {$vendor->quality_tier} tier (minimum: {$qualityTierRules['min_completed_orders']})";
            } else {
                $results['score'] += 15;
            }

            if (($vendor->performance_score ?? 0) < $qualityTierRules['min_performance_score']) {
                $results['eligible'] = false;
                $results['reasons'][] = "Performance score too low for {$vendor->quality_tier} tier (minimum: {$qualityTierRules['min_performance_score']})";
            } else {
                $results['score'] += 15;
            }
        }

        // Check order value compatibility
        $orderValue = $order->total_amount ?? 0;
        if ($vendor->quality_tier === 'exclusive' && $orderValue < 5000000) { // 5M IDR
            $results['warnings'][] = "Order value may be too low for exclusive vendor";
        } elseif ($vendor->quality_tier === 'standard' && $orderValue > 50000000) { // 50M IDR
            $results['warnings'][] = "Order value may be too high for standard vendor";
        } else {
            $results['score'] += 10;
        }

        // Check specialization match
        $orderRequirements = $this->extractOrderRequirements($order);
        $vendorSpecializations = $vendor->specializations ?? [];
        $matchCount = count(array_intersect($orderRequirements, $vendorSpecializations));
        
        if ($matchCount === 0 && !empty($orderRequirements)) {
            $results['warnings'][] = "No specialization match found";
        } else {
            $results['score'] += min(20, $matchCount * 5);
        }

        return $results;
    }

    /**
     * Validate negotiation terms
     */
    public function validateNegotiationTerms(array $negotiationData): array
    {
        $results = [
            'valid' => true,
            'violations' => [],
            'warnings' => [],
            'adjustments' => [],
        ];

        $rules = $this->businessRules['negotiation'];
        
        // Check maximum rounds
        if (($negotiationData['round'] ?? 1) > $rules['maximum_rounds']) {
            $results['valid'] = false;
            $results['violations'][] = "Negotiation exceeded maximum rounds ({$rules['maximum_rounds']})";
        }

        // Check discount thresholds
        if (isset($negotiationData['original_amount']) && isset($negotiationData['proposed_amount'])) {
            $discountPercent = (($negotiationData['original_amount'] - $negotiationData['proposed_amount']) / $negotiationData['original_amount']) * 100;
            
            if ($discountPercent > $rules['maximum_discount_threshold']) {
                $results['valid'] = false;
                $results['violations'][] = "Discount ({$discountPercent}%) exceeds maximum allowed ({$rules['maximum_discount_threshold']}%)";
            } elseif ($discountPercent < $rules['minimum_discount_threshold'] && $discountPercent > 0) {
                $results['warnings'][] = "Discount ({$discountPercent}%) below recommended minimum ({$rules['minimum_discount_threshold']}%)";
            }
        }

        // Check auto-approval threshold
        if (($negotiationData['proposed_amount'] ?? 0) <= $rules['auto_approval_threshold']) {
            $results['adjustments'][] = [
                'type' => 'auto_approval',
                'message' => "Amount qualifies for auto-approval",
                'threshold' => $rules['auto_approval_threshold']
            ];
        }

        return $results;
    }

    /**
     * Validate payment terms
     */
    public function validatePaymentTerms(array $paymentData): array
    {
        $results = [
            'valid' => true,
            'violations' => [],
            'warnings' => [],
            'adjustments' => [],
        ];

        $rules = $this->businessRules['payment'];

        // Check down payment percentage
        if (isset($paymentData['down_payment_percentage'])) {
            $downPaymentPercent = $paymentData['down_payment_percentage'];
            
            if ($downPaymentPercent > $rules['maximum_down_payment_percentage']) {
                $results['adjustments'][] = [
                    'type' => 'down_payment_adjustment',
                    'original' => $downPaymentPercent,
                    'adjusted' => $rules['maximum_down_payment_percentage'],
                    'message' => "Down payment adjusted to maximum allowed percentage"
                ];
            } elseif ($downPaymentPercent < $rules['minimum_down_payment_percentage']) {
                $results['adjustments'][] = [
                    'type' => 'down_payment_adjustment',
                    'original' => $downPaymentPercent,
                    'adjusted' => $rules['minimum_down_payment_percentage'],
                    'message' => "Down payment adjusted to minimum required percentage"
                ];
            }
        }

        // Check payment terms
        if (isset($paymentData['payment_terms_days'])) {
            $paymentTerms = $paymentData['payment_terms_days'];
            
            if ($paymentTerms > $rules['maximum_payment_terms_days']) {
                $results['valid'] = false;
                $results['violations'][] = "Payment terms ({$paymentTerms} days) exceed maximum allowed ({$rules['maximum_payment_terms_days']} days)";
            }
        }

        // Check auto-disburse threshold
        if (($paymentData['amount'] ?? 0) <= $rules['auto_disburse_threshold']) {
            $results['adjustments'][] = [
                'type' => 'auto_disburse',
                'message' => "Amount qualifies for auto-disbursement",
                'threshold' => $rules['auto_disburse_threshold']
            ];
        }

        return $results;
    }

    /**
     * Evaluate vendor performance
     */
    public function evaluateVendorPerformance(Vendor $vendor): array
    {
        $rules = $this->businessRules['performance'];
        
        // Get recent performance data
        $recentOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subDays($rules['performance_review_frequency_days']))
            ->get();

        $results = [
            'status' => 'excellent',
            'score' => 0,
            'issues' => [],
            'recommendations' => [],
            'metrics' => [],
        ];

        if ($recentOrders->isEmpty()) {
            $results['status'] = 'insufficient_data';
            $results['recommendations'][] = "Insufficient recent orders for performance evaluation";
            return $results;
        }

        // Calculate on-time delivery rate
        $onTimeCount = $recentOrders->where('delivery_status', 'on_time')->count();
        $onTimeRate = ($onTimeCount / $recentOrders->count()) * 100;
        $results['metrics']['on_time_delivery_rate'] = $onTimeRate;

        if ($onTimeRate < $rules['minimum_on_time_delivery_rate']) {
            $results['status'] = 'concerning';
            $results['issues'][] = "On-time delivery rate ({$onTimeRate}%) below minimum requirement ({$rules['minimum_on_time_delivery_rate']}%)";
        } else {
            $results['score'] += 25;
        }

        // Calculate quality rating
        $avgQuality = $recentOrders->whereNotNull('quality_rating')->avg('quality_rating') ?? 0;
        $results['metrics']['average_quality_rating'] = $avgQuality;

        if ($avgQuality < $rules['minimum_quality_rating']) {
            $results['status'] = 'concerning';
            $results['issues'][] = "Average quality rating ({$avgQuality}) below minimum requirement ({$rules['minimum_quality_rating']})";
        } else {
            $results['score'] += 25;
        }

        // Calculate lead time variance
        $ordersWithLeadTime = $recentOrders->whereNotNull(['estimated_lead_time_days', 'actual_lead_time_days']);
        if ($ordersWithLeadTime->isNotEmpty()) {
            $avgVariance = $ordersWithLeadTime->map(function ($order) {
                return abs($order->actual_lead_time_days - $order->estimated_lead_time_days) / $order->estimated_lead_time_days * 100;
            })->avg();
            
            $results['metrics']['lead_time_variance'] = $avgVariance;

            if ($avgVariance > $rules['maximum_lead_time_variance']) {
                $results['status'] = 'concerning';
                $results['issues'][] = "Lead time variance ({$avgVariance}%) exceeds maximum allowed ({$rules['maximum_lead_time_variance']}%)";
            } else {
                $results['score'] += 25;
            }
        }

        // Calculate completion rate
        $totalAssignedOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->where('created_at', '>=', now()->subDays($rules['performance_review_frequency_days']))
            ->count();

        if ($totalAssignedOrders > 0) {
            $completionRate = ($recentOrders->count() / $totalAssignedOrders) * 100;
            $results['metrics']['completion_rate'] = $completionRate;

            if ($completionRate < 90) {
                $results['status'] = 'concerning';
                $results['issues'][] = "Order completion rate ({$completionRate}%) is concerning";
            } else {
                $results['score'] += 25;
            }
        }

        // Generate recommendations
        if ($results['score'] >= 75) {
            $results['status'] = 'excellent';
            $results['recommendations'][] = "Vendor shows excellent performance, consider for premium orders";
        } elseif ($results['score'] >= 50) {
            $results['status'] = 'good';
            $results['recommendations'][] = "Good performance, monitor for improvements";
        } else {
            $results['status'] = 'needs_improvement';
            $results['recommendations'][] = "Performance review required, consider training or replacement";
        }

        return $results;
    }

    /**
     * Apply business rules to vendor matching
     */
    public function applyBusinessRulesFilter(Collection $vendorMatches, Order $order): Collection
    {
        return $vendorMatches->filter(function ($match) use ($order) {
            $eligibility = $this->evaluateVendorEligibility($match['vendor'], $order);
            $match['eligibility'] = $eligibility;
            return $eligibility['eligible'];
        })->map(function ($match) {
            // Adjust compatibility score based on business rules
            $match['compatibility_score'] = min(100, $match['compatibility_score'] + $match['eligibility']['score']);
            return $match;
        });
    }

    /**
     * Get business rules configuration
     */
    public function getBusinessRules(?string $category = null): array
    {
        if ($category) {
            return $this->businessRules[$category] ?? [];
        }
        
        return $this->businessRules;
    }

    /**
     * Update business rule
     */
    public function updateBusinessRule(string $category, string $rule, $value): bool
    {
        if (!isset($this->businessRules[$category])) {
            return false;
        }

        $this->businessRules[$category][$rule] = $value;
        
        // In a real implementation, this would be persisted to database/cache
        Log::info('Business rule updated', [
            'category' => $category,
            'rule' => $rule,
            'new_value' => $value,
        ]);

        return true;
    }

    // Private helper methods

    private function extractOrderRequirements(Order $order): array
    {
        $requirements = [];
        $items = $order->items ?? [];

        foreach ($items as $item) {
            if (isset($item['material_type'])) {
                $requirements[] = $item['material_type'];
            }
            if (isset($item['process_type'])) {
                $requirements[] = $item['process_type'];
            }
            if (isset($item['finish_type'])) {
                $requirements[] = $item['finish_type'];
            }
        }

        return array_unique($requirements);
    }
}