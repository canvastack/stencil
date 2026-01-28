<?php

namespace App\Domain\Vendor\Services;

use App\Domain\Vendor\ValueObjects\OrderRequirements;
use App\Domain\Vendor\ValueObjects\VendorMatchCollection;
use App\Domain\Vendor\ValueObjects\VendorRecommendation;
use App\Domain\Vendor\ValueObjects\ScoredVendor;
use App\Domain\Vendor\Entities\Vendor;

/**
 * Vendor Matching Service
 * 
 * Intelligent vendor matching system with scoring algorithm
 * Finds and ranks the best vendors for specific order requirements
 */
class VendorMatchingService
{
    public function __construct(
        private VendorScoringEngine $scoringEngine,
        private VendorCapabilityAnalyzer $capabilityAnalyzer
    ) {}
    
    /**
     * Find best vendors for order requirements
     */
    public function findBestVendorsForOrder(
        OrderRequirements $requirements,
        int $maxVendors = 5
    ): VendorMatchCollection {
        
        // 1. Filter vendors by basic capabilities (from vendors table)
        $capableVendors = $this->capabilityAnalyzer->filterCapableVendors($requirements);
        
        // 2. Score each vendor using vendors.rating, vendors.total_orders, vendors.specializations
        $scoredVendors = [];
        foreach ($capableVendors as $vendor) {
            $score = $this->scoringEngine->scoreVendor($vendor, $requirements);
            if ($score->getTotalScore() >= 70) { // Minimum threshold
                $scoredVendors[] = new ScoredVendor($vendor, $score);
            }
        }
        
        // 3. Sort by score and return top vendors
        usort($scoredVendors, fn($a, $b) => $b->getScore()->getTotalScore() <=> $a->getScore()->getTotalScore());
        
        return new VendorMatchCollection(
            array_slice($scoredVendors, 0, $maxVendors),
            $requirements
        );
    }
    
    /**
     * Recommend optimal vendor from matches
     */
    public function recommendOptimalVendor(VendorMatchCollection $matches): VendorRecommendation
    {
        $topVendor = $matches->getTopVendor();
        
        if (!$topVendor) {
            throw new \InvalidArgumentException('No qualified vendors found in matches');
        }
        
        $alternatives = $matches->getAlternatives(3);
        
        return new VendorRecommendation(
            primaryVendor: $topVendor,
            alternatives: $alternatives,
            reasoning: $this->generateRecommendationReasoning($topVendor),
            riskAssessment: $this->assessVendorRisk($topVendor->getVendor())
        );
    }
    
    /**
     * Find vendors by material specialization
     */
    public function findVendorsByMaterial(string $material, int $limit = 10): array
    {
        return $this->capabilityAnalyzer->findVendorsByMaterial($material, $limit);
    }
    
    /**
     * Find vendors by equipment capability
     */
    public function findVendorsByEquipment(array $equipment, int $limit = 10): array
    {
        return $this->capabilityAnalyzer->findVendorsByEquipment($equipment, $limit);
    }
    
    /**
     * Get vendor compatibility score for specific requirements
     */
    public function getCompatibilityScore(Vendor $vendor, OrderRequirements $requirements): float
    {
        $score = $this->scoringEngine->scoreVendor($vendor, $requirements);
        return $score->getTotalScore();
    }
    
    /**
     * Generate recommendation reasoning
     */
    private function generateRecommendationReasoning(ScoredVendor $scoredVendor): string
    {
        $vendor = $scoredVendor->getVendor();
        $score = $scoredVendor->getScore();
        $breakdown = $score->getBreakdown();
        
        $reasons = [];
        
        // Technical capability
        if (($breakdown['technical_capability'] ?? 0) >= 35) {
            $reasons[] = "excellent technical capabilities";
        }
        
        // Cost effectiveness
        if (($breakdown['cost_effectiveness'] ?? 0) >= 20) {
            $reasons[] = "competitive pricing";
        }
        
        // Quality track record
        if (($breakdown['quality_track_record'] ?? 0) >= 18) {
            $reasons[] = "proven quality track record";
        }
        
        // Delivery performance
        if (($breakdown['delivery_performance'] ?? 0) >= 9) {
            $reasons[] = "reliable delivery performance";
        }
        
        // Overall rating
        if ($vendor->getRating() >= 4.5) {
            $reasons[] = "high customer satisfaction rating ({$vendor->getRating()}/5.0)";
        }
        
        if (empty($reasons)) {
            return "Selected based on overall compatibility score of {$score->getTotalScore()}%";
        }
        
        return "Recommended for " . implode(', ', $reasons) . 
               " with an overall compatibility score of {$score->getTotalScore()}%";
    }
    
    /**
     * Assess vendor risk (simplified implementation)
     */
    private function assessVendorRisk(Vendor $vendor): object
    {
        $riskLevel = 'low';
        $riskFactors = [];
        
        // Check vendor rating
        if ($vendor->getRating() < 3.5) {
            $riskLevel = 'high';
            $riskFactors[] = 'Low customer rating';
        } elseif ($vendor->getRating() < 4.0) {
            $riskLevel = 'medium';
            $riskFactors[] = 'Moderate customer rating';
        }
        
        // Check total orders (experience)
        $totalOrders = $vendor->getTotalOrders();
        if ($totalOrders < 10) {
            $riskLevel = $riskLevel === 'low' ? 'medium' : 'high';
            $riskFactors[] = 'Limited order history';
        }
        
        // Check capacity utilization
        $capacityUtilization = $vendor->getCurrentCapacityUtilization();
        if ($capacityUtilization > 0.95) {
            $riskLevel = $riskLevel === 'low' ? 'medium' : 'high';
            $riskFactors[] = 'High capacity utilization';
        }
        
        return (object) [
            'risk_level' => $riskLevel,
            'risk_factors' => $riskFactors,
            'mitigation_strategies' => $this->generateMitigationStrategies($riskFactors),
            'monitoring_recommendations' => $this->generateMonitoringRecommendations($riskLevel)
        ];
    }
    
    /**
     * Generate mitigation strategies
     */
    private function generateMitigationStrategies(array $riskFactors): array
    {
        $strategies = [];
        
        foreach ($riskFactors as $factor) {
            switch ($factor) {
                case 'Low customer rating':
                    $strategies[] = 'Request additional quality samples before production';
                    $strategies[] = 'Implement stricter quality checkpoints';
                    break;
                case 'Limited order history':
                    $strategies[] = 'Start with smaller test order';
                    $strategies[] = 'Require additional references';
                    break;
                case 'High capacity utilization':
                    $strategies[] = 'Negotiate flexible delivery timeline';
                    $strategies[] = 'Identify backup vendor options';
                    break;
            }
        }
        
        return array_unique($strategies);
    }
    
    /**
     * Generate monitoring recommendations
     */
    private function generateMonitoringRecommendations(string $riskLevel): array
    {
        return match($riskLevel) {
            'high' => [
                'Daily progress check-ins',
                'Weekly quality reviews',
                'Milestone-based payments only',
                'Backup vendor on standby'
            ],
            'medium' => [
                'Bi-weekly progress updates',
                'Mid-production quality check',
                'Standard payment terms with milestones'
            ],
            'low' => [
                'Standard progress reporting',
                'Final quality inspection',
                'Normal payment terms'
            ],
            default => ['Standard monitoring']
        };
    }
}