<?php

namespace App\Domain\Vendor\Services;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Vendor\ValueObjects\OrderRequirements;
use App\Domain\Vendor\ValueObjects\VendorScore;
use App\Domain\Shared\ValueObjects\Money;

/**
 * Vendor Scoring Engine
 * 
 * Calculates comprehensive vendor scores based on multiple criteria:
 * - Technical capability (40%)
 * - Cost effectiveness (25%)
 * - Quality track record (20%)
 * - Delivery performance (10%)
 * - Relationship score (5%)
 */
class VendorScoringEngine
{
    private array $scoringWeights;
    
    public function __construct()
    {
        $this->initializeScoringWeights();
    }
    
    /**
     * Score vendor for specific order requirements
     */
    public function scoreVendor(Vendor $vendor, OrderRequirements $requirements): VendorScore
    {
        $scores = [
            'technical_capability' => $this->scoreTechnicalCapability($vendor, $requirements) * $this->scoringWeights['technical_capability'],
            'cost_effectiveness' => $this->scoreCostEffectiveness($vendor, $requirements) * $this->scoringWeights['cost_effectiveness'],
            'quality_track_record' => $this->scoreQualityRecord($vendor) * $this->scoringWeights['quality_track_record'],
            'delivery_performance' => $this->scoreDeliveryPerformance($vendor) * $this->scoringWeights['delivery_performance'],
            'relationship_score' => $this->scoreRelationship($vendor) * $this->scoringWeights['relationship_score']
        ];
        
        $totalScore = array_sum($scores);
        
        return new VendorScore(
            totalScore: $totalScore,
            breakdown: $scores,
            strengths: $this->identifyStrengths($scores),
            weaknesses: $this->identifyWeaknesses($scores),
            recommendations: $this->generateScoreRecommendations($scores)
        );
    }
    
    /**
     * Score technical capability (0-100 points)
     */
    private function scoreTechnicalCapability(Vendor $vendor, OrderRequirements $requirements): float
    {
        $score = 0;
        
        // Material capability (0-25 points) - check vendors.specializations JSON field
        if ($vendor->canProduceMaterial($requirements->getMaterial())) {
            $score += 25;
            
            // Bonus for specialization in vendors.specializations
            if ($vendor->isSpecializedIn($requirements->getMaterial())) {
                $score += 5;
            }
        }
        
        // Equipment capability (0-20 points) - check vendors.metadata JSON field
        $requiredEquipment = $requirements->getRequiredEquipment();
        $availableEquipment = $vendor->getAvailableEquipment();
        
        if (!empty($requiredEquipment)) {
            $equipmentMatch = count(array_intersect($requiredEquipment, $availableEquipment)) / count($requiredEquipment);
            $score += $equipmentMatch * 20;
        } else {
            $score += 15; // Default if no specific equipment required
        }
        
        // Capacity availability (0-15 points) - check vendors.lead_time and current orders
        $capacityUtilization = $vendor->getCurrentCapacityUtilization();
        if ($capacityUtilization < 0.8) {
            $score += 15;
        } elseif ($capacityUtilization < 0.9) {
            $score += 10;
        } elseif ($capacityUtilization < 0.95) {
            $score += 5;
        }
        
        // Experience with similar orders (0-15 points)
        $totalOrders = $vendor->getTotalOrders();
        if ($totalOrders >= 100) {
            $score += 15;
        } elseif ($totalOrders >= 50) {
            $score += 12;
        } elseif ($totalOrders >= 20) {
            $score += 8;
        } elseif ($totalOrders >= 5) {
            $score += 5;
        }
        
        // Quality certifications (0-10 points)
        $certifications = $vendor->getMetadata()['certifications'] ?? [];
        $score += min(count($certifications) * 2, 10);
        
        // Timeline compatibility (0-15 points)
        $vendorLeadTime = $vendor->getLeadTime();
        $requiredTime = $requirements->getEstimatedProductionTime();
        
        if ($vendorLeadTime <= $requiredTime) {
            $score += 15;
        } elseif ($vendorLeadTime <= $requiredTime * 1.2) {
            $score += 10;
        } elseif ($vendorLeadTime <= $requiredTime * 1.5) {
            $score += 5;
        }
        
        return min($score, 100);
    }
    
    /**
     * Score cost effectiveness (0-100 points)
     */
    private function scoreCostEffectiveness(Vendor $vendor, OrderRequirements $requirements): float
    {
        try {
            $vendorQuote = $vendor->generateQuote($requirements);
            $marketAverage = $this->getMarketAveragePrice($requirements);
            
            // Compare using vendor_price field (stored in cents)
            $priceRatio = $vendorQuote->getTotalPrice()->getAmountInCents() / $marketAverage->getAmountInCents();
            
            // Score based on price competitiveness
            if ($priceRatio <= 0.85) return 100; // 15% below market
            if ($priceRatio <= 0.90) return 90;  // 10% below market
            if ($priceRatio <= 0.95) return 80;  // 5% below market
            if ($priceRatio <= 1.00) return 70;  // At market price
            if ($priceRatio <= 1.05) return 60;  // 5% above market
            if ($priceRatio <= 1.10) return 50;  // 10% above market
            
            return 40; // More than 10% above market
        } catch (\Exception $e) {
            // If quote generation fails, use vendor rating as fallback
            return $vendor->getRating() * 20; // Convert 5-point rating to 100-point scale
        }
    }
    
    /**
     * Score quality track record (0-100 points)
     */
    private function scoreQualityRecord(Vendor $vendor): float
    {
        $qualityRatings = $vendor->getQualityRatings();
        
        // Overall rating (0-40 points)
        $overallRating = $qualityRatings['overall_rating'] ?? 0;
        $ratingScore = ($overallRating / 5.0) * 40;
        
        // Quality consistency (0-30 points)
        $qualityScore = ($qualityRatings['quality_score'] ?? 0) / 5.0 * 30;
        
        // Completed orders ratio (0-20 points)
        $totalOrders = $qualityRatings['total_orders'] ?? 0;
        $completedOrders = $qualityRatings['completed_orders'] ?? 0;
        
        if ($totalOrders > 0) {
            $completionRatio = $completedOrders / $totalOrders;
            $completionScore = $completionRatio * 20;
        } else {
            $completionScore = 0;
        }
        
        // Experience bonus (0-10 points)
        $experienceBonus = min($totalOrders / 10, 10); // 1 point per 10 orders, max 10
        
        return min($ratingScore + $qualityScore + $completionScore + $experienceBonus, 100);
    }
    
    /**
     * Score delivery performance (0-100 points)
     */
    private function scoreDeliveryPerformance(Vendor $vendor): float
    {
        $qualityRatings = $vendor->getQualityRatings();
        
        // Delivery score from ratings (0-60 points)
        $deliveryScore = ($qualityRatings['delivery_score'] ?? 0) / 5.0 * 60;
        
        // Lead time competitiveness (0-25 points)
        $leadTime = $vendor->getLeadTime();
        $leadTimeScore = match(true) {
            $leadTime <= 7 => 25,   // 1 week or less
            $leadTime <= 14 => 20,  // 2 weeks
            $leadTime <= 21 => 15,  // 3 weeks
            $leadTime <= 30 => 10,  // 1 month
            default => 5
        };
        
        // Capacity management (0-15 points)
        $capacityUtilization = $vendor->getCurrentCapacityUtilization();
        $capacityScore = match(true) {
            $capacityUtilization <= 0.7 => 15,  // Low utilization = good availability
            $capacityUtilization <= 0.8 => 12,
            $capacityUtilization <= 0.9 => 8,
            $capacityUtilization <= 0.95 => 4,
            default => 0
        };
        
        return min($deliveryScore + $leadTimeScore + $capacityScore, 100);
    }
    
    /**
     * Score relationship (0-100 points)
     */
    private function scoreRelationship(Vendor $vendor): float
    {
        $score = 0;
        
        // Communication score (0-40 points)
        $qualityRatings = $vendor->getQualityRatings();
        $communicationScore = ($qualityRatings['communication_score'] ?? 0) / 5.0 * 40;
        
        // Vendor status (0-20 points)
        if ($vendor->isActive()) {
            $score += 20;
        }
        
        // Payment history (0-20 points)
        $paymentHistory = $vendor->getPaymentHistory();
        if ($paymentHistory->hasNoDelays()) {
            $score += 20;
        } elseif ($paymentHistory->hasMinorDelays()) {
            $score += 15;
        } else {
            $score += 5;
        }
        
        // Credit score (0-20 points)
        $creditScore = $vendor->getCreditScore();
        if ($creditScore >= 750) {
            $score += 20;
        } elseif ($creditScore >= 700) {
            $score += 15;
        } elseif ($creditScore >= 650) {
            $score += 10;
        } elseif ($creditScore >= 600) {
            $score += 5;
        }
        
        return min($communicationScore + $score, 100);
    }
    
    /**
     * Get market average price (simplified implementation)
     */
    private function getMarketAveragePrice(OrderRequirements $requirements): Money
    {
        // This would typically query historical data or market rates
        // For now, use a simplified calculation based on material and quantity
        
        $basePricePerUnit = match(strtolower($requirements->getMaterial())) {
            'steel', 'stainless steel' => 75000, // 750 IDR per unit
            'aluminum' => 60000, // 600 IDR per unit
            'glass' => 50000, // 500 IDR per unit
            'acrylic' => 40000, // 400 IDR per unit
            default => 55000 // 550 IDR per unit
        };
        
        $quantity = $requirements->getQuantity();
        $complexityMultiplier = match($requirements->getComplexity()) {
            'simple' => 1.0,
            'medium' => 1.3,
            'high' => 1.7,
            'custom' => 2.2,
            default => 1.3
        };
        
        $totalPrice = $basePricePerUnit * $quantity * $complexityMultiplier;
        
        return Money::fromCents((int) $totalPrice);
    }
    
    /**
     * Identify vendor strengths
     */
    private function identifyStrengths(array $scores): array
    {
        $strengths = [];
        
        foreach ($scores as $category => $score) {
            $percentage = ($score / $this->scoringWeights[$category]) * 100;
            
            if ($percentage >= 85) {
                $strengths[] = match($category) {
                    'technical_capability' => 'Excellent technical capabilities and equipment',
                    'cost_effectiveness' => 'Highly competitive pricing',
                    'quality_track_record' => 'Outstanding quality track record',
                    'delivery_performance' => 'Reliable delivery performance',
                    'relationship_score' => 'Strong business relationship',
                    default => ucfirst(str_replace('_', ' ', $category))
                };
            }
        }
        
        return $strengths;
    }
    
    /**
     * Identify vendor weaknesses
     */
    private function identifyWeaknesses(array $scores): array
    {
        $weaknesses = [];
        
        foreach ($scores as $category => $score) {
            $percentage = ($score / $this->scoringWeights[$category]) * 100;
            
            if ($percentage < 60) {
                $weaknesses[] = match($category) {
                    'technical_capability' => 'Limited technical capabilities or equipment',
                    'cost_effectiveness' => 'Higher than market pricing',
                    'quality_track_record' => 'Inconsistent quality performance',
                    'delivery_performance' => 'Delivery reliability concerns',
                    'relationship_score' => 'Limited business relationship',
                    default => ucfirst(str_replace('_', ' ', $category))
                };
            }
        }
        
        return $weaknesses;
    }
    
    /**
     * Generate score-based recommendations
     */
    private function generateScoreRecommendations(array $scores): array
    {
        $recommendations = [];
        
        foreach ($scores as $category => $score) {
            $percentage = ($score / $this->scoringWeights[$category]) * 100;
            
            if ($percentage < 70) {
                $recommendations[] = match($category) {
                    'technical_capability' => 'Request detailed capability assessment and equipment verification',
                    'cost_effectiveness' => 'Negotiate pricing or consider alternative vendors for cost optimization',
                    'quality_track_record' => 'Implement additional quality checkpoints and sample approvals',
                    'delivery_performance' => 'Establish clear delivery milestones and backup plans',
                    'relationship_score' => 'Improve communication protocols and payment terms',
                    default => 'Monitor ' . str_replace('_', ' ', $category) . ' closely'
                };
            }
        }
        
        if (empty($recommendations)) {
            $recommendations[] = 'Vendor meets all criteria - proceed with standard monitoring';
        }
        
        return $recommendations;
    }
    
    /**
     * Initialize scoring weights
     */
    private function initializeScoringWeights(): void
    {
        $this->scoringWeights = [
            'technical_capability' => 0.40, // 40%
            'cost_effectiveness' => 0.25,   // 25%
            'quality_track_record' => 0.20, // 20%
            'delivery_performance' => 0.10, // 10%
            'relationship_score' => 0.05     // 5%
        ];
    }
}