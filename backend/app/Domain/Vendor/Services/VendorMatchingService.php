<?php

namespace App\Domain\Vendor\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Domain\Order\Services\VendorNegotiationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VendorMatchingService
{
    public function __construct(
        private VendorNegotiationService $negotiationService
    ) {}

    /**
     * Find matching vendors for an order
     */
    public function findMatches(Order $order, array $criteria = []): array
    {
        $query = Vendor::where('status', 'active');

        // Apply quality tier filter
        if (!empty($criteria['quality_tier'])) {
            $query->where('quality_tier', $criteria['quality_tier']);
        }

        // Apply lead time filter
        if (!empty($criteria['max_lead_time'])) {
            $query->where('average_lead_time_days', '<=', $criteria['max_lead_time']);
        }

        // Apply specialization filter
        if (!empty($criteria['specializations'])) {
            $query->where(function ($q) use ($criteria) {
                foreach ($criteria['specializations'] as $specialization) {
                    $q->orWhereJsonContains('specializations', $specialization);
                }
            });
        }

        $vendors = $query->get();

        // Calculate compatibility scores and matches
        $matches = [];
        foreach ($vendors as $vendor) {
            $match = $this->calculateVendorMatch($vendor, $order, $criteria);
            if ($match['compatibility_score'] > 0) {
                $matches[] = $match;
            }
        }

        // Sort by compatibility score (highest first)
        usort($matches, function ($a, $b) {
            return $b['compatibility_score'] <=> $a['compatibility_score'];
        });

        return $matches;
    }

    /**
     * Calculate vendor compatibility for order
     */
    private function calculateVendorMatch(Vendor $vendor, Order $order, array $criteria = []): array
    {
        $score = 0;
        $maxScore = 100;

        // Quality tier match (25 points)
        $qualityScore = $this->calculateQualityScore($vendor, $order, $criteria);
        $score += $qualityScore;

        // Specialization match (30 points)
        $specializationScore = $this->calculateSpecializationScore($vendor, $order);
        $score += $specializationScore['score'];

        // Performance history (25 points)
        $performanceScore = $this->calculatePerformanceScore($vendor);
        $score += $performanceScore['score'];

        // Capacity and availability (20 points)
        $capacityScore = $this->calculateCapacityScore($vendor, $order);
        $score += $capacityScore;

        // Calculate estimated price and lead time
        $estimatedPrice = $this->estimatePrice($vendor, $order);
        $estimatedLeadTime = $this->estimateLeadTime($vendor, $order);

        return [
            'vendor' => $vendor,
            'compatibility_score' => min($score, $maxScore),
            'estimated_price' => $estimatedPrice,
            'estimated_lead_time' => $estimatedLeadTime,
            'specialization_match' => $specializationScore['matches'],
            'past_performance' => $performanceScore['details'],
            'availability_status' => $this->getAvailabilityStatus($vendor),
        ];
    }

    /**
     * Calculate quality tier compatibility score
     */
    private function calculateQualityScore(Vendor $vendor, Order $order, array $criteria): float
    {
        $requiredTier = $criteria['quality_tier'] ?? 'standard';
        $vendorTier = $vendor->quality_tier ?? 'standard';

        $tierLevels = ['standard' => 1, 'premium' => 2, 'exclusive' => 3];
        
        $requiredLevel = $tierLevels[$requiredTier] ?? 1;
        $vendorLevel = $tierLevels[$vendorTier] ?? 1;

        if ($vendorLevel >= $requiredLevel) {
            return 25; // Full score for meeting requirements
        } elseif ($vendorLevel + 1 >= $requiredLevel) {
            return 15; // Partial score for close match
        }

        return 0; // No score for insufficient quality tier
    }

    /**
     * Calculate specialization match score
     */
    private function calculateSpecializationScore(Vendor $vendor, Order $order): array
    {
        $vendorSpecs = $vendor->specializations ?? [];
        $orderItems = $order->items ?? [];

        // Extract material types from order items
        $requiredSpecs = [];
        foreach ($orderItems as $item) {
            if (isset($item['material_type'])) {
                $requiredSpecs[] = $item['material_type'];
            }
            if (isset($item['process_type'])) {
                $requiredSpecs[] = $item['process_type'];
            }
        }

        $matches = array_intersect($vendorSpecs, $requiredSpecs);
        $matchPercentage = count($requiredSpecs) > 0 
            ? (count($matches) / count($requiredSpecs)) 
            : 0;

        return [
            'score' => $matchPercentage * 30,
            'matches' => $matches,
            'total_required' => count($requiredSpecs),
            'total_matched' => count($matches),
        ];
    }

    /**
     * Calculate vendor performance score based on history
     */
    private function calculatePerformanceScore(Vendor $vendor): array
    {
        // Get recent vendor orders
        $recentOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(6))
            ->get();

        if ($recentOrders->isEmpty()) {
            return [
                'score' => 12.5, // Default neutral score
                'details' => [
                    'orders_completed' => 0,
                    'average_rating' => 0,
                    'on_time_rate' => 0,
                    'completion_rate' => 0,
                ]
            ];
        }

        $totalOrders = $recentOrders->count();
        $onTimeOrders = $recentOrders->where('delivery_status', 'on_time')->count();
        $avgRating = $recentOrders->where('quality_rating', '>', 0)->avg('quality_rating') ?? 0;

        $onTimeRate = $totalOrders > 0 ? ($onTimeOrders / $totalOrders) : 0;
        $performanceScore = ($onTimeRate * 15) + (($avgRating / 5) * 10);

        return [
            'score' => min($performanceScore, 25),
            'details' => [
                'orders_completed' => $totalOrders,
                'average_rating' => round($avgRating, 2),
                'on_time_rate' => round($onTimeRate * 100, 1),
                'completion_rate' => 100, // Assuming completed orders
            ]
        ];
    }

    /**
     * Calculate vendor capacity score
     */
    private function calculateCapacityScore(Vendor $vendor, Order $order): float
    {
        // Get active orders for vendor
        $activeOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->count();

        // Simplified capacity calculation
        $maxCapacity = 10; // Assume max 10 concurrent orders
        $currentUtilization = $activeOrders / $maxCapacity;

        if ($currentUtilization <= 0.5) {
            return 20; // High availability
        } elseif ($currentUtilization <= 0.8) {
            return 12; // Medium availability
        }

        return 5; // Low availability
    }

    /**
     * Estimate price based on vendor and order
     */
    private function estimatePrice(Vendor $vendor, Order $order): float
    {
        $basePrice = $order->total_amount ?? 0;
        
        // Quality tier multiplier
        $qualityMultipliers = [
            'standard' => 1.0,
            'premium' => 1.2,
            'exclusive' => 1.5,
        ];

        $multiplier = $qualityMultipliers[$vendor->quality_tier ?? 'standard'] ?? 1.0;
        
        // Add some variance based on vendor performance
        $performanceAdjustment = ($vendor->performance_score ?? 3.0) / 5.0; // 0.6 to 1.0
        $finalMultiplier = $multiplier * $performanceAdjustment;

        return round($basePrice * $finalMultiplier, 2);
    }

    /**
     * Estimate lead time based on vendor capabilities
     */
    private function estimateLeadTime(Vendor $vendor, Order $order): int
    {
        $baseDays = $vendor->average_lead_time_days ?? 14;
        
        // Adjust based on order complexity (simplified)
        $itemCount = is_array($order->items) ? count($order->items) : 1;
        $complexityMultiplier = 1 + ($itemCount - 1) * 0.1; // Add 10% per additional item
        
        return (int) ceil($baseDays * $complexityMultiplier);
    }

    /**
     * Get vendor availability status
     */
    private function getAvailabilityStatus(Vendor $vendor): string
    {
        $activeOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->count();

        if ($activeOrders <= 3) {
            return 'available';
        } elseif ($activeOrders <= 7) {
            return 'busy';
        }

        return 'full';
    }

    /**
     * Start negotiation with vendor
     */
    public function startNegotiation(Order $order, Vendor $vendor, array $options = []): OrderVendorNegotiation
    {
        return $this->negotiationService->startNegotiation($order, [
            'vendor_id' => $vendor->id,
            'initial_offer' => $options['initial_offer'] ?? $order->total_amount,
            'currency' => $order->currency ?? 'IDR',
            'notes' => $options['notes'] ?? 'Negotiation started via vendor matching',
            'expires_at' => $options['expires_at'] ?? now()->addDays(7),
        ]);
    }
}