<?php

namespace App\Domain\Production\Services;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Production\ValueObjects\ProductionPlan;
use App\Domain\Production\ValueObjects\ProductionRequirements;
use App\Domain\Production\ValueObjects\ResourceAllocation;
use App\Domain\Production\ValueObjects\ProductionTimeline;
use App\Domain\Production\ValueObjects\ProductionMilestone;
use App\Domain\Production\ValueObjects\RiskFactor;
use App\Domain\Production\Services\ResourceScheduler;
use App\Domain\Production\Services\CapacityOptimizer;
use App\Domain\Production\Services\RiskAnalyzer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use DateTimeImmutable;
use DateInterval;

/**
 * Production Planning Service
 * 
 * Orchestrates production planning for orders with intelligent resource allocation,
 * timeline optimization, and risk assessment.
 * 
 * Integrates with existing orders table using:
 * - orders.estimated_delivery for timeline planning
 * - orders.metadata for production plan storage
 * - orders.items for requirements analysis
 * - orders.vendor_id for vendor capacity assessment
 */
class ProductionPlanningService
{
    public function __construct(
        private ResourceScheduler $resourceScheduler,
        private CapacityOptimizer $capacityOptimizer,
        private RiskAnalyzer $riskAnalyzer
    ) {}

    /**
     * Create comprehensive production plan for order
     */
    public function createProductionPlan(PurchaseOrder $order): ProductionPlan
    {
        // 1. Analyze order requirements from orders.items
        $requirements = $this->analyzeOrderRequirements($order);
        
        // 2. Assess required resources based on order specifications
        $resources = $this->assessRequiredResources($requirements, $order);
        
        // 3. Calculate optimal timeline using orders.estimated_delivery
        $timeline = $this->calculateOptimalTimeline($order, $resources);
        
        // 4. Define production milestones based on order complexity
        $milestones = $this->defineMilestones($timeline, $requirements, $order);
        
        // 5. Identify risk factors using vendor and order data
        $riskFactors = $this->riskAnalyzer->identifyRiskFactors($order, $resources);
        
        // 6. Optimize resource allocation for efficiency
        $optimizedResources = $this->capacityOptimizer->optimizeAllocation($resources, $timeline);
        
        // 7. Create contingency plans for identified risks
        $contingencyPlans = $this->createContingencyPlans($riskFactors, $order);
        
        // 8. Define quality checkpoints throughout production
        $qualityCheckpoints = $this->defineQualityCheckpoints($timeline, $requirements, $order);
        
        return new ProductionPlan(
            orderId: $order->getId(),
            requirements: $requirements,
            resources: $optimizedResources,
            timeline: $timeline,
            milestones: $milestones,
            riskFactors: $riskFactors,
            contingencyPlans: $contingencyPlans,
            qualityCheckpoints: $qualityCheckpoints,
            createdAt: new DateTimeImmutable()
        );
    }

    /**
     * Analyze order requirements from order data
     */
    private function analyzeOrderRequirements(PurchaseOrder $order): ProductionRequirements
    {
        $orderItems = $order->getItems();
        $specifications = $this->extractSpecifications($orderItems);
        $quantity = $this->calculateTotalQuantity($orderItems);
        $complexityLevel = $this->assessComplexityLevel($order);
        
        return new ProductionRequirements(
            productType: $this->determineProductType($orderItems),
            specifications: $specifications,
            quantity: $quantity,
            complexityLevel: $complexityLevel,
            materialRequirements: $this->analyzeMaterialRequirements($orderItems, $specifications),
            equipmentNeeded: $this->analyzeEquipmentNeeds($orderItems, $specifications),
            skillsRequired: $this->analyzeSkillRequirements($orderItems, $complexityLevel),
            estimatedCost: $this->estimateProductionCost($orderItems, $complexityLevel),
            estimatedHours: $this->estimateProductionHours($orderItems, $complexityLevel),
            qualityStandard: $this->determineQualityStandard($order)
        );
    }

    /**
     * Assess required resources based on requirements
     */
    private function assessRequiredResources(ProductionRequirements $requirements, PurchaseOrder $order): ResourceAllocation
    {
        $materials = $this->assessMaterialResources($requirements);
        $equipment = $this->assessEquipmentResources($requirements);
        $labor = $this->assessLaborResources($requirements);
        $facilities = $this->assessFacilityResources($requirements);
        $tooling = $this->assessToolingResources($requirements);
        
        $totalCost = $this->calculateTotalResourceCost($materials, $equipment, $labor, $facilities, $tooling);
        $utilizationRate = $this->calculateBaseUtilizationRate($requirements);
        
        return new ResourceAllocation(
            materials: $materials,
            equipment: $equipment,
            labor: $labor,
            facilities: $facilities,
            tooling: $tooling,
            totalCost: $totalCost,
            utilizationRate: $utilizationRate
        );
    }

    /**
     * Calculate optimal timeline using order delivery date
     */
    private function calculateOptimalTimeline(PurchaseOrder $order, ResourceAllocation $resources): ProductionTimeline
    {
        $estimatedDelivery = $order->getEstimatedDelivery();
        $productionDays = $this->calculateRequiredProductionDays($order, $resources);
        
        // Calculate start date (delivery date minus production time minus buffer)
        $bufferDays = $this->calculateBufferDays($order);
        $totalDays = $productionDays + $bufferDays;
        
        $startDate = $estimatedDelivery->sub(new DateInterval('P' . $totalDays . 'D'));
        $endDate = $estimatedDelivery->sub(new DateInterval('P' . $bufferDays . 'D'));
        
        // Define production phases
        $phases = $this->defineProductionPhases($startDate, $endDate, $order);
        
        // Identify critical path
        $criticalPath = $this->identifyCriticalPath($phases);
        
        return new ProductionTimeline(
            startDate: $startDate,
            endDate: $endDate,
            phases: $phases,
            bufferTime: new DateInterval('P' . $bufferDays . 'D'),
            criticalPath: $criticalPath
        );
    }

    /**
     * Define production milestones
     */
    private function defineMilestones(ProductionTimeline $timeline, ProductionRequirements $requirements, PurchaseOrder $order): array
    {
        $milestones = [];
        $phases = $timeline->getPhases();
        
        foreach ($phases as $phase) {
            $milestoneId = 'milestone_' . $phase->getName() . '_' . $order->getId()->getValue();
            
            $milestones[] = new ProductionMilestone(
                id: $milestoneId,
                name: ucfirst(str_replace('_', ' ', $phase->getName())) . ' Complete',
                description: 'Completion of ' . $phase->getDescription(),
                dueDate: $phase->getEndDate(),
                isCritical: $phase->isCritical(),
                isCompleted: false,
                completedAt: null,
                deliverables: $this->getMilestoneDeliverables($phase->getName()),
                dependencies: $this->getMilestoneDependencies($phase->getName(), $phases),
                assignedTo: $this->assignMilestoneResponsible($phase->getName()),
                progress: 0.0
            );
        }
        
        return $milestones;
    }

    /**
     * Create contingency plans for identified risks
     */
    private function createContingencyPlans(array $riskFactors, PurchaseOrder $order): array
    {
        $contingencyPlans = [];
        
        foreach ($riskFactors as $risk) {
            if ($risk->requiresImmediateAttention()) {
                $planId = 'contingency_' . $risk->getId();
                
                $contingencyPlans[] = new ContingencyPlan(
                    id: $planId,
                    name: 'Contingency for ' . $risk->getType(),
                    description: 'Contingency plan to mitigate ' . $risk->getDescription(),
                    triggerConditions: $this->getContingencyTriggers($risk),
                    actions: $risk->getMitigationStrategies(),
                    requiredResources: $this->getContingencyResources($risk),
                    estimatedCost: $this->estimateContingencyCost($risk, $order),
                    implementationTimeDays: $this->estimateContingencyTime($risk),
                    priority: $this->mapRiskSeverityToPriority($risk->getSeverity()),
                    responsibleParty: $this->assignContingencyResponsible($risk)
                );
            }
        }
        
        return $contingencyPlans;
    }

    /**
     * Define quality checkpoints throughout production
     */
    private function defineQualityCheckpoints(ProductionTimeline $timeline, ProductionRequirements $requirements, PurchaseOrder $order): array
    {
        $checkpoints = [];
        $phases = $timeline->getPhases();
        
        // Standard quality checkpoints for each phase
        $standardCheckpoints = [
            'design' => [
                'name' => 'Design Review',
                'criteria' => ['specification_compliance', 'technical_feasibility', 'customer_approval'],
                'methods' => ['design_review_meeting', 'technical_analysis', 'customer_sign_off'],
                'mandatory' => true
            ],
            'material_preparation' => [
                'name' => 'Material Inspection',
                'criteria' => ['material_quality', 'quantity_verification', 'specification_match'],
                'methods' => ['visual_inspection', 'measurement_verification', 'quality_testing'],
                'mandatory' => true
            ],
            'production' => [
                'name' => 'In-Process Quality Control',
                'criteria' => ['dimensional_accuracy', 'surface_quality', 'process_compliance'],
                'methods' => ['measurement_checks', 'visual_inspection', 'process_monitoring'],
                'mandatory' => true
            ],
            'finishing' => [
                'name' => 'Finishing Quality Check',
                'criteria' => ['surface_finish', 'appearance', 'durability'],
                'methods' => ['visual_inspection', 'touch_test', 'durability_testing'],
                'mandatory' => true
            ],
            'final_inspection' => [
                'name' => 'Final Quality Inspection',
                'criteria' => ['overall_quality', 'specification_compliance', 'packaging'],
                'methods' => ['comprehensive_inspection', 'final_testing', 'packaging_check'],
                'mandatory' => true
            ]
        ];
        
        foreach ($phases as $phase) {
            $phaseName = $phase->getName();
            if (isset($standardCheckpoints[$phaseName])) {
                $checkpoint = $standardCheckpoints[$phaseName];
                $checkpointId = 'qc_' . $phaseName . '_' . $order->getId()->getValue();
                
                $checkpoints[] = new QualityCheckpoint(
                    id: $checkpointId,
                    name: $checkpoint['name'],
                    description: 'Quality checkpoint for ' . $phase->getDescription(),
                    phase: $phaseName,
                    criteria: $checkpoint['criteria'],
                    validationMethods: $checkpoint['methods'],
                    requiredDocumentation: $this->getRequiredDocumentation($phaseName),
                    responsibleParty: $this->assignQualityResponsible($phaseName),
                    isMandatory: $checkpoint['mandatory']
                );
            }
        }
        
        return $checkpoints;
    }

    // Helper methods for production planning

    private function extractSpecifications(array $orderItems): array
    {
        $specifications = [];
        foreach ($orderItems as $item) {
            if (isset($item['specifications'])) {
                $specifications = array_merge($specifications, $item['specifications']);
            }
        }
        return $specifications;
    }

    private function calculateTotalQuantity(array $orderItems): int
    {
        return array_reduce($orderItems, fn($total, $item) => $total + ($item['quantity'] ?? 1), 0);
    }

    private function assessComplexityLevel(PurchaseOrder $order): string
    {
        $score = 0;
        
        // Order value factor
        $orderValue = $order->getTotalAmount()->getAmount();
        if ($orderValue > 10000000) $score += 3;
        elseif ($orderValue > 5000000) $score += 2;
        elseif ($orderValue > 1000000) $score += 1;
        
        // Item count factor
        $itemCount = count($order->getItems());
        if ($itemCount > 10) $score += 3;
        elseif ($itemCount > 5) $score += 2;
        elseif ($itemCount > 2) $score += 1;
        
        // Timeline pressure factor
        $daysUntilDelivery = (new DateTimeImmutable())->diff($order->getEstimatedDelivery())->days;
        if ($daysUntilDelivery < 7) $score += 3;
        elseif ($daysUntilDelivery < 14) $score += 2;
        elseif ($daysUntilDelivery < 21) $score += 1;
        
        return match(true) {
            $score >= 7 => 'very_high',
            $score >= 5 => 'high',
            $score >= 3 => 'medium',
            default => 'low'
        };
    }

    private function determineProductType(array $orderItems): string
    {
        // Analyze items to determine primary product type
        $types = [];
        foreach ($orderItems as $item) {
            $types[] = $item['type'] ?? 'custom_etching';
        }
        
        // Return most common type or default
        $typeCounts = array_count_values($types);
        return array_key_first($typeCounts) ?? 'custom_etching';
    }

    private function analyzeMaterialRequirements(array $orderItems, array $specifications): array
    {
        $materials = [];
        
        foreach ($orderItems as $item) {
            $material = $item['material'] ?? 'steel';
            $quantity = $item['quantity'] ?? 1;
            
            if (!isset($materials[$material])) {
                $materials[$material] = 0;
            }
            $materials[$material] += $quantity;
        }
        
        return $materials;
    }

    private function analyzeEquipmentNeeds(array $orderItems, array $specifications): array
    {
        $equipment = ['laser_engraver', 'precision_etcher'];
        
        // Add specialized equipment based on specifications
        if (isset($specifications['precision']) && $specifications['precision'] === 'high') {
            $equipment[] = 'cnc_machine';
        }
        
        if (isset($specifications['finish']) && $specifications['finish'] === 'polished') {
            $equipment[] = 'polishing_equipment';
        }
        
        return array_unique($equipment);
    }

    private function analyzeSkillRequirements(array $orderItems, string $complexityLevel): array
    {
        $skills = ['precision_etching', 'quality_control'];
        
        if (in_array($complexityLevel, ['high', 'very_high'])) {
            $skills[] = 'artistic_design';
            $skills[] = 'technical_drawing';
        }
        
        return $skills;
    }

    private function estimateProductionCost(array $orderItems, string $complexityLevel): Money
    {
        $baseCost = count($orderItems) * 500000; // 500K IDR per item base cost
        
        $multiplier = match($complexityLevel) {
            'very_high' => 2.5,
            'high' => 2.0,
            'medium' => 1.5,
            'low' => 1.0,
            default => 1.0
        };
        
        return new Money((int)($baseCost * $multiplier), 'IDR');
    }

    private function estimateProductionHours(array $orderItems, string $complexityLevel): int
    {
        $baseHours = count($orderItems) * 8; // 8 hours per item base
        
        $multiplier = match($complexityLevel) {
            'very_high' => 2.0,
            'high' => 1.5,
            'medium' => 1.2,
            'low' => 1.0,
            default => 1.0
        };
        
        return (int)($baseHours * $multiplier);
    }

    private function determineQualityStandard(PurchaseOrder $order): string
    {
        // Determine quality standard based on order value and customer
        $orderValue = $order->getTotalAmount()->getAmount();
        
        if ($orderValue > 10000000) {
            return 'premium';
        } elseif ($orderValue > 5000000) {
            return 'high';
        } else {
            return 'standard';
        }
    }

    // Additional helper methods would continue here...
    // For brevity, I'll include key methods that complete the implementation

    private function calculateRequiredProductionDays(PurchaseOrder $order, ResourceAllocation $resources): int
    {
        $baseProductionDays = 5; // Base 5 days
        
        $itemCount = count($order->getItems());
        $additionalDays = ceil($itemCount / 3); // 1 additional day per 3 items
        
        return $baseProductionDays + $additionalDays;
    }

    private function calculateBufferDays(PurchaseOrder $order): int
    {
        $orderValue = $order->getTotalAmount()->getAmount();
        
        // Higher value orders get more buffer time
        if ($orderValue > 10000000) {
            return 3;
        } elseif ($orderValue > 5000000) {
            return 2;
        } else {
            return 1;
        }
    }

    // Placeholder implementations for remaining helper methods
    private function defineProductionPhases($startDate, $endDate, $order): array { return []; }
    private function identifyCriticalPath($phases): array { return []; }
    private function getMilestoneDeliverables($phaseName): array { return []; }
    private function getMilestoneDependencies($phaseName, $phases): array { return []; }
    private function assignMilestoneResponsible($phaseName): string { return 'production_manager'; }
    private function getContingencyTriggers($risk): array { return []; }
    private function getContingencyResources($risk): array { return []; }
    private function estimateContingencyCost($risk, $order): Money { return new Money(1000000, 'IDR'); }
    private function estimateContingencyTime($risk): int { return 1; }
    private function mapRiskSeverityToPriority($severity): string { return $severity; }
    private function assignContingencyResponsible($risk): string { return 'production_manager'; }
    private function getRequiredDocumentation($phaseName): array { return []; }
    private function assignQualityResponsible($phaseName): string { return 'quality_manager'; }
    private function assessMaterialResources($requirements): array { return []; }
    private function assessEquipmentResources($requirements): array { return []; }
    private function assessLaborResources($requirements): array { return []; }
    private function assessFacilityResources($requirements): array { return []; }
    private function assessToolingResources($requirements): array { return []; }
    private function calculateTotalResourceCost($materials, $equipment, $labor, $facilities, $tooling): Money { return new Money(5000000, 'IDR'); }
    private function calculateBaseUtilizationRate($requirements): float { return 0.75; }
}