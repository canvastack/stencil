<?php

namespace App\Domain\Vendor\Services;

use App\Domain\Vendor\ValueObjects\OrderRequirements;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;

/**
 * Vendor Capability Analyzer
 * 
 * Analyzes and filters vendors based on their capabilities
 * to match specific order requirements
 */
class VendorCapabilityAnalyzer
{
    public function __construct(
        private VendorRepositoryInterface $vendorRepository
    ) {}
    
    /**
     * Filter vendors that can handle the order requirements
     */
    public function filterCapableVendors(OrderRequirements $requirements): array
    {
        // Get all active vendors
        $allVendors = $this->vendorRepository->findActiveVendors();
        
        $capableVendors = [];
        
        foreach ($allVendors as $vendor) {
            if ($this->canVendorHandleRequirements($vendor, $requirements)) {
                $capableVendors[] = $vendor;
            }
        }
        
        return $capableVendors;
    }
    
    /**
     * Find vendors by material specialization
     */
    public function findVendorsByMaterial(string $material, int $limit = 10): array
    {
        $allVendors = $this->vendorRepository->findActiveVendors();
        $materialVendors = [];
        
        foreach ($allVendors as $vendor) {
            if ($vendor->canProduceMaterial($material)) {
                $materialVendors[] = $vendor;
                
                if (count($materialVendors) >= $limit) {
                    break;
                }
            }
        }
        
        // Sort by specialization and rating
        usort($materialVendors, function($a, $b) use ($material) {
            $aSpecialized = $a->isSpecializedIn($material) ? 1 : 0;
            $bSpecialized = $b->isSpecializedIn($material) ? 1 : 0;
            
            if ($aSpecialized !== $bSpecialized) {
                return $bSpecialized - $aSpecialized; // Specialized first
            }
            
            return $b->getRating() <=> $a->getRating(); // Higher rating first
        });
        
        return $materialVendors;
    }
    
    /**
     * Find vendors by equipment capability
     */
    public function findVendorsByEquipment(array $equipment, int $limit = 10): array
    {
        $allVendors = $this->vendorRepository->findActiveVendors();
        $equipmentVendors = [];
        
        foreach ($allVendors as $vendor) {
            $vendorEquipment = $vendor->getAvailableEquipment();
            $matchCount = count(array_intersect($equipment, $vendorEquipment));
            
            if ($matchCount > 0) {
                $equipmentVendors[] = [
                    'vendor' => $vendor,
                    'match_count' => $matchCount,
                    'match_percentage' => $matchCount / count($equipment)
                ];
                
                if (count($equipmentVendors) >= $limit) {
                    break;
                }
            }
        }
        
        // Sort by match percentage and rating
        usort($equipmentVendors, function($a, $b) {
            if ($a['match_percentage'] !== $b['match_percentage']) {
                return $b['match_percentage'] <=> $a['match_percentage'];
            }
            
            return $b['vendor']->getRating() <=> $a['vendor']->getRating();
        });
        
        return array_map(fn($item) => $item['vendor'], $equipmentVendors);
    }
    
    /**
     * Check if vendor can handle specific requirements
     */
    private function canVendorHandleRequirements(Vendor $vendor, OrderRequirements $requirements): bool
    {
        // Check material capability
        if (!$vendor->canProduceMaterial($requirements->getMaterial())) {
            return false;
        }
        
        // Check equipment requirements
        $requiredEquipment = $requirements->getRequiredEquipment();
        $vendorEquipment = $vendor->getAvailableEquipment();
        
        if (!empty($requiredEquipment)) {
            $equipmentMatch = count(array_intersect($requiredEquipment, $vendorEquipment));
            $equipmentMatchPercentage = $equipmentMatch / count($requiredEquipment);
            
            // Require at least 50% equipment match
            if ($equipmentMatchPercentage < 0.5) {
                return false;
            }
        }
        
        // Check capacity availability
        $capacityUtilization = $vendor->getCurrentCapacityUtilization();
        if ($capacityUtilization >= 1.0) {
            return false; // Vendor is at full capacity
        }
        
        // Check minimum order requirements
        $minOrderValue = $vendor->getMinimumOrderValue();
        if ($minOrderValue !== null) {
            // This would need order value calculation
            // For now, assume all orders meet minimum requirements
        }
        
        // Check lead time compatibility
        $vendorLeadTime = $vendor->getLeadTime();
        $requiredTime = $requirements->getEstimatedProductionTime();
        
        // Allow up to 50% longer lead time
        if ($vendorLeadTime > $requiredTime * 1.5) {
            return false;
        }
        
        // Check quality requirements
        if (!$this->meetsQualityRequirements($vendor, $requirements)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check if vendor meets quality requirements
     */
    private function meetsQualityRequirements(Vendor $vendor, OrderRequirements $requirements): bool
    {
        $qualityRequirements = $requirements->getQualityRequirements();
        
        if (empty($qualityRequirements)) {
            return true; // No specific quality requirements
        }
        
        $vendorRating = $vendor->getRating();
        $qualityRatings = $vendor->getQualityRatings();
        
        // Check minimum rating requirement
        if (isset($qualityRequirements['minimum_rating'])) {
            if ($vendorRating < $qualityRequirements['minimum_rating']) {
                return false;
            }
        }
        
        // Check quality score requirement
        if (isset($qualityRequirements['minimum_quality_score'])) {
            $qualityScore = $qualityRatings['quality_score'] ?? 0;
            if ($qualityScore < $qualityRequirements['minimum_quality_score']) {
                return false;
            }
        }
        
        // Check required certifications
        if (isset($qualityRequirements['required_certifications'])) {
            $vendorCertifications = $vendor->getMetadata()['certifications'] ?? [];
            $requiredCertifications = $qualityRequirements['required_certifications'];
            
            foreach ($requiredCertifications as $certification) {
                if (!in_array($certification, $vendorCertifications)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Get vendor capability summary
     */
    public function getVendorCapabilitySummary(Vendor $vendor): array
    {
        return [
            'vendor_id' => $vendor->getId()->toString(),
            'vendor_name' => $vendor->getName(),
            'supported_materials' => $vendor->getSupportedMaterials(),
            'specializations' => $vendor->getSpecializations(),
            'available_equipment' => $vendor->getAvailableEquipment(),
            'capacity_utilization' => $vendor->getCurrentCapacityUtilization(),
            'lead_time' => $vendor->getLeadTime(),
            'minimum_order_value' => $vendor->getMinimumOrderValue()?->toArray(),
            'quality_ratings' => $vendor->getQualityRatings(),
            'certifications' => $vendor->getMetadata()['certifications'] ?? [],
            'is_active' => $vendor->isActive()
        ];
    }
    
    /**
     * Analyze capability gaps for requirements
     */
    public function analyzeCapabilityGaps(OrderRequirements $requirements): array
    {
        $allVendors = $this->vendorRepository->findActiveVendors();
        $capableVendors = $this->filterCapableVendors($requirements);
        
        $totalVendors = count($allVendors);
        $capableCount = count($capableVendors);
        
        $gaps = [];
        
        // Material capability gap
        $materialCapableCount = 0;
        foreach ($allVendors as $vendor) {
            if ($vendor->canProduceMaterial($requirements->getMaterial())) {
                $materialCapableCount++;
            }
        }
        
        if ($materialCapableCount < $totalVendors * 0.3) { // Less than 30% can handle material
            $gaps[] = [
                'type' => 'material_capability',
                'description' => "Limited vendors ({$materialCapableCount}/{$totalVendors}) can handle {$requirements->getMaterial()}",
                'severity' => 'high'
            ];
        }
        
        // Equipment capability gap
        $requiredEquipment = $requirements->getRequiredEquipment();
        if (!empty($requiredEquipment)) {
            $equipmentCapableCount = 0;
            foreach ($allVendors as $vendor) {
                $vendorEquipment = $vendor->getAvailableEquipment();
                $matchCount = count(array_intersect($requiredEquipment, $vendorEquipment));
                if ($matchCount >= count($requiredEquipment) * 0.5) {
                    $equipmentCapableCount++;
                }
            }
            
            if ($equipmentCapableCount < $totalVendors * 0.2) { // Less than 20% have required equipment
                $gaps[] = [
                    'type' => 'equipment_capability',
                    'description' => "Limited vendors ({$equipmentCapableCount}/{$totalVendors}) have required equipment",
                    'severity' => 'medium'
                ];
            }
        }
        
        // Capacity gap
        $availableCapacityCount = 0;
        foreach ($allVendors as $vendor) {
            if ($vendor->getCurrentCapacityUtilization() < 0.9) {
                $availableCapacityCount++;
            }
        }
        
        if ($availableCapacityCount < $totalVendors * 0.4) { // Less than 40% have available capacity
            $gaps[] = [
                'type' => 'capacity_availability',
                'description' => "Limited vendor capacity available ({$availableCapacityCount}/{$totalVendors})",
                'severity' => 'medium'
            ];
        }
        
        return [
            'total_vendors' => $totalVendors,
            'capable_vendors' => $capableCount,
            'capability_ratio' => $totalVendors > 0 ? $capableCount / $totalVendors : 0,
            'gaps' => $gaps,
            'recommendations' => $this->generateGapRecommendations($gaps)
        ];
    }
    
    /**
     * Generate recommendations based on capability gaps
     */
    private function generateGapRecommendations(array $gaps): array
    {
        $recommendations = [];
        
        foreach ($gaps as $gap) {
            switch ($gap['type']) {
                case 'material_capability':
                    $recommendations[] = 'Consider expanding vendor network for specialized materials';
                    $recommendations[] = 'Evaluate alternative materials with better vendor availability';
                    break;
                case 'equipment_capability':
                    $recommendations[] = 'Partner with vendors to upgrade equipment capabilities';
                    $recommendations[] = 'Consider outsourcing specialized processes';
                    break;
                case 'capacity_availability':
                    $recommendations[] = 'Plan orders with longer lead times';
                    $recommendations[] = 'Develop relationships with additional vendors';
                    break;
            }
        }
        
        if (empty($recommendations)) {
            $recommendations[] = 'Vendor capabilities are well-aligned with requirements';
        }
        
        return array_unique($recommendations);
    }
}