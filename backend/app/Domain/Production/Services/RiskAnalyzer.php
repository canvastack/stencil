<?php

namespace App\Domain\Production\Services;

use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Production\ValueObjects\ResourceAllocation;
use App\Domain\Production\ValueObjects\RiskFactor;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;

/**
 * Risk Analyzer Service
 * 
 * Analyzes production risks based on order complexity, resource availability,
 * vendor performance, and historical data to identify potential issues.
 */
class RiskAnalyzer
{
    public function __construct(
        private VendorRepositoryInterface $vendorRepository
    ) {}

    /**
     * Identify risk factors for production plan
     * 
     * @return array<RiskFactor>
     */
    public function identifyRiskFactors(
        PurchaseOrder $order,
        ResourceAllocation $resources
    ): array {
        $risks = [];
        
        // Analyze timeline risks
        $risks = array_merge($risks, $this->analyzeTimelineRisks($order));
        
        // Analyze resource risks
        $risks = array_merge($risks, $this->analyzeResourceRisks($resources));
        
        // Analyze vendor risks
        $risks = array_merge($risks, $this->analyzeVendorRisks($order));
        
        // Analyze quality risks
        $risks = array_merge($risks, $this->analyzeQualityRisks($order));
        
        // Analyze financial risks
        $risks = array_merge($risks, $this->analyzeFinancialRisks($order, $resources));
        
        // Analyze external risks
        $risks = array_merge($risks, $this->analyzeExternalRisks($order));
        
        // Sort risks by severity and probability
        usort($risks, fn(RiskFactor $a, RiskFactor $b) => $b->getRiskScore() <=> $a->getRiskScore());
        
        return $risks;
    }

    /**
     * Analyze timeline-related risks
     */
    private function analyzeTimelineRisks(PurchaseOrder $order): array
    {
        $risks = [];
        
        // Check delivery timeline pressure
        $estimatedDelivery = $order->getEstimatedDelivery();
        $now = new \DateTimeImmutable();
        $daysUntilDelivery = $now->diff($estimatedDelivery)->days;
        
        if ($daysUntilDelivery < 7) {
            $risks[] = new RiskFactor(
                id: 'timeline_pressure_' . $order->getId()->getValue(),
                type: 'timeline_pressure',
                description: 'Very tight delivery timeline with less than 7 days available',
                severity: 'high',
                probability: 0.8,
                impact: 'May require overtime work, rush orders, and compromise on quality checks',
                mitigationStrategies: [
                    'Prioritize critical path activities',
                    'Arrange overtime shifts',
                    'Expedite material deliveries',
                    'Streamline quality checkpoints'
                ],
                category: 'timeline'
            );
        } elseif ($daysUntilDelivery < 14) {
            $risks[] = new RiskFactor(
                id: 'timeline_moderate_' . $order->getId()->getValue(),
                type: 'timeline_constraint',
                description: 'Moderate timeline pressure with 7-14 days available',
                severity: 'medium',
                probability: 0.5,
                impact: 'May require careful scheduling and resource prioritization',
                mitigationStrategies: [
                    'Optimize production schedule',
                    'Ensure resource availability',
                    'Monitor progress closely'
                ],
                category: 'timeline'
            );
        }
        
        // Check order complexity vs timeline
        $complexity = $this->assessOrderComplexity($order);
        if ($complexity === 'high' && $daysUntilDelivery < 21) {
            $risks[] = new RiskFactor(
                id: 'complexity_timeline_' . $order->getId()->getValue(),
                type: 'complexity_timeline_mismatch',
                description: 'High complexity order with insufficient timeline',
                severity: 'critical',
                probability: 0.9,
                impact: 'High risk of delays, quality issues, or cost overruns',
                mitigationStrategies: [
                    'Negotiate timeline extension',
                    'Simplify specifications where possible',
                    'Allocate additional resources',
                    'Implement parallel processing'
                ],
                category: 'timeline'
            );
        }
        
        return $risks;
    }

    /**
     * Analyze resource-related risks
     */
    private function analyzeResourceRisks(ResourceAllocation $resources): array
    {
        $risks = [];
        
        // Check critical resource availability
        if (!$resources->hasCriticalResourcesAvailable()) {
            $risks[] = new RiskFactor(
                id: 'critical_resource_unavailable',
                type: 'resource_unavailability',
                description: 'Critical resources are not available when needed',
                severity: 'critical',
                probability: 0.95,
                impact: 'Production delays, potential order cancellation',
                mitigationStrategies: [
                    'Secure alternative resources',
                    'Adjust production schedule',
                    'Negotiate with suppliers',
                    'Consider outsourcing'
                ],
                category: 'resource'
            );
        }
        
        // Check resource utilization
        if ($resources->getUtilizationRate() > 0.9) {
            $risks[] = new RiskFactor(
                id: 'resource_overutilization',
                type: 'resource_strain',
                description: 'Resources are over-utilized with little buffer capacity',
                severity: 'high',
                probability: 0.7,
                impact: 'Equipment breakdowns, worker fatigue, quality issues',
                mitigationStrategies: [
                    'Add buffer capacity',
                    'Schedule maintenance breaks',
                    'Cross-train workers',
                    'Monitor equipment health'
                ],
                category: 'resource'
            );
        }
        
        // Check material supply risks
        $materialCost = $resources->getMaterialCost();
        $totalCost = $resources->getTotalCost();
        $materialRatio = $materialCost->getAmount() / max($totalCost->getAmount(), 1);
        
        if ($materialRatio > 0.6) {
            $risks[] = new RiskFactor(
                id: 'material_dependency',
                type: 'material_supply_risk',
                description: 'High dependency on material supplies (>60% of total cost)',
                severity: 'medium',
                probability: 0.4,
                impact: 'Vulnerable to supply chain disruptions and price fluctuations',
                mitigationStrategies: [
                    'Diversify suppliers',
                    'Maintain safety stock',
                    'Negotiate fixed-price contracts',
                    'Develop alternative materials'
                ],
                category: 'material'
            );
        }
        
        return $risks;
    }

    /**
     * Analyze vendor-related risks
     */
    private function analyzeVendorRisks(PurchaseOrder $order): array
    {
        $risks = [];
        
        $vendorId = $order->getVendorId();
        if (!$vendorId) {
            $risks[] = new RiskFactor(
                id: 'no_vendor_assigned_' . $order->getId()->getValue(),
                type: 'vendor_assignment',
                description: 'No vendor assigned to order',
                severity: 'critical',
                probability: 1.0,
                impact: 'Cannot proceed with production',
                mitigationStrategies: [
                    'Assign qualified vendor immediately',
                    'Review vendor selection criteria',
                    'Consider emergency vendor options'
                ],
                category: 'vendor'
            );
            return $risks;
        }
        
        $vendor = $this->vendorRepository->findById($vendorId);
        if (!$vendor) {
            return $risks;
        }
        
        // Check vendor performance history
        $vendorRating = $vendor->getRating();
        if ($vendorRating < 3.5) {
            $risks[] = new RiskFactor(
                id: 'vendor_low_rating_' . $vendorId->getValue(),
                type: 'vendor_performance',
                description: "Vendor has low performance rating ({$vendorRating}/5.0)",
                severity: 'high',
                probability: 0.8,
                impact: 'Quality issues, delays, communication problems',
                mitigationStrategies: [
                    'Increase quality inspections',
                    'Implement closer monitoring',
                    'Prepare backup vendor',
                    'Negotiate performance guarantees'
                ],
                category: 'vendor'
            );
        }
        
        // Check vendor capacity
        $vendorLeadTime = $vendor->getLeadTime();
        if ($vendorLeadTime > 14) {
            $risks[] = new RiskFactor(
                id: 'vendor_long_leadtime_' . $vendorId->getValue(),
                type: 'vendor_capacity',
                description: "Vendor has long lead time ({$vendorLeadTime} days)",
                severity: 'medium',
                probability: 0.6,
                impact: 'Potential delays in material delivery and production start',
                mitigationStrategies: [
                    'Order materials early',
                    'Find faster suppliers for critical items',
                    'Negotiate expedited delivery',
                    'Adjust production schedule'
                ],
                category: 'vendor'
            );
        }
        
        // Check vendor specialization match
        if (!$this->isVendorSpecializationMatch($vendor, $order)) {
            $risks[] = new RiskFactor(
                id: 'vendor_specialization_mismatch_' . $vendorId->getValue(),
                type: 'vendor_capability',
                description: 'Vendor specialization may not fully match order requirements',
                severity: 'medium',
                probability: 0.5,
                impact: 'Quality issues, longer production time, higher costs',
                mitigationStrategies: [
                    'Provide detailed specifications',
                    'Conduct capability assessment',
                    'Arrange technical support',
                    'Consider specialist subcontractors'
                ],
                category: 'vendor'
            );
        }
        
        return $risks;
    }

    /**
     * Analyze quality-related risks
     */
    private function analyzeQualityRisks(PurchaseOrder $order): array
    {
        $risks = [];
        
        $complexity = $this->assessOrderComplexity($order);
        
        // High complexity orders have higher quality risks
        if ($complexity === 'high') {
            $risks[] = new RiskFactor(
                id: 'quality_complexity_' . $order->getId()->getValue(),
                type: 'quality_complexity',
                description: 'High complexity order increases quality risk',
                severity: 'high',
                probability: 0.6,
                impact: 'Defects, rework, customer dissatisfaction',
                mitigationStrategies: [
                    'Implement additional quality checkpoints',
                    'Use experienced personnel',
                    'Conduct prototype testing',
                    'Increase inspection frequency'
                ],
                category: 'quality'
            );
        }
        
        // Check for custom specifications
        $orderItems = $order->getItems();
        $hasCustomSpecs = false;
        foreach ($orderItems as $item) {
            if (isset($item['custom_specifications']) && !empty($item['custom_specifications'])) {
                $hasCustomSpecs = true;
                break;
            }
        }
        
        if ($hasCustomSpecs) {
            $risks[] = new RiskFactor(
                id: 'quality_custom_specs_' . $order->getId()->getValue(),
                type: 'quality_specification',
                description: 'Custom specifications increase quality control complexity',
                severity: 'medium',
                probability: 0.4,
                impact: 'Specification misinterpretation, quality deviations',
                mitigationStrategies: [
                    'Clarify specifications with customer',
                    'Create detailed work instructions',
                    'Conduct specification review meetings',
                    'Implement approval checkpoints'
                ],
                category: 'quality'
            );
        }
        
        return $risks;
    }

    /**
     * Analyze financial risks
     */
    private function analyzeFinancialRisks(PurchaseOrder $order, ResourceAllocation $resources): array
    {
        $risks = [];
        
        // Check cost overrun risk
        $orderTotal = $order->getTotalAmount();
        $resourceCost = $resources->getTotalCost();
        $costRatio = $resourceCost->getAmount() / max($orderTotal->getAmount(), 1);
        
        if ($costRatio > 0.8) {
            $risks[] = new RiskFactor(
                id: 'cost_overrun_' . $order->getId()->getValue(),
                type: 'financial_overrun',
                description: 'Resource costs are high relative to order value (>80%)',
                severity: 'high',
                probability: 0.7,
                impact: 'Reduced profit margins, potential losses',
                mitigationStrategies: [
                    'Review and optimize resource allocation',
                    'Negotiate better supplier rates',
                    'Identify cost reduction opportunities',
                    'Consider value engineering'
                ],
                category: 'financial'
            );
        }
        
        // Check payment terms risk
        $paymentStatus = $order->getPaymentStatus();
        if ($paymentStatus->getValue() === 'pending') {
            $risks[] = new RiskFactor(
                id: 'payment_pending_' . $order->getId()->getValue(),
                type: 'payment_risk',
                description: 'Payment is still pending for this order',
                severity: 'medium',
                probability: 0.3,
                impact: 'Cash flow issues, potential order cancellation',
                mitigationStrategies: [
                    'Follow up on payment',
                    'Require advance payment',
                    'Implement payment milestones',
                    'Consider payment insurance'
                ],
                category: 'financial'
            );
        }
        
        return $risks;
    }

    /**
     * Analyze external risks
     */
    private function analyzeExternalRisks(PurchaseOrder $order): array
    {
        $risks = [];
        
        // Weather-related risks (for delivery and outdoor work)
        $estimatedDelivery = $order->getEstimatedDelivery();
        $month = (int) $estimatedDelivery->format('n');
        
        // Rainy season in Indonesia (October to March)
        if ($month >= 10 || $month <= 3) {
            $risks[] = new RiskFactor(
                id: 'weather_risk_' . $order->getId()->getValue(),
                type: 'weather_risk',
                description: 'Delivery scheduled during rainy season',
                severity: 'low',
                probability: 0.3,
                impact: 'Potential delivery delays due to weather conditions',
                mitigationStrategies: [
                    'Plan for weather contingencies',
                    'Use covered transportation',
                    'Schedule indoor work during bad weather',
                    'Maintain flexible delivery windows'
                ],
                category: 'external'
            );
        }
        
        // Supply chain disruption risk
        $risks[] = new RiskFactor(
            id: 'supply_chain_disruption',
            type: 'supply_chain_risk',
            description: 'General supply chain disruption risk',
            severity: 'low',
            probability: 0.2,
            impact: 'Material shortages, price increases, delivery delays',
            mitigationStrategies: [
                'Maintain diverse supplier base',
                'Monitor supply chain health',
                'Keep safety stock for critical materials',
                'Develop contingency suppliers'
            ],
            category: 'external'
        );
        
        return $risks;
    }

    /**
     * Assess order complexity
     */
    private function assessOrderComplexity(PurchaseOrder $order): string
    {
        $complexityScore = 0;
        
        // Check number of items
        $itemCount = count($order->getItems());
        $complexityScore += min($itemCount * 2, 10); // Max 10 points for items
        
        // Check order value (higher value = more complex)
        $orderValue = $order->getTotalAmount()->getAmount();
        if ($orderValue > 10000000) { // > 10M IDR
            $complexityScore += 8;
        } elseif ($orderValue > 5000000) { // > 5M IDR
            $complexityScore += 5;
        } elseif ($orderValue > 1000000) { // > 1M IDR
            $complexityScore += 3;
        }
        
        // Check for custom specifications
        foreach ($order->getItems() as $item) {
            if (isset($item['custom_specifications']) && !empty($item['custom_specifications'])) {
                $complexityScore += 5;
                break;
            }
        }
        
        // Check timeline pressure
        $estimatedDelivery = $order->getEstimatedDelivery();
        $now = new \DateTimeImmutable();
        $daysUntilDelivery = $now->diff($estimatedDelivery)->days;
        
        if ($daysUntilDelivery < 7) {
            $complexityScore += 8;
        } elseif ($daysUntilDelivery < 14) {
            $complexityScore += 5;
        } elseif ($daysUntilDelivery < 21) {
            $complexityScore += 3;
        }
        
        // Determine complexity level
        return match(true) {
            $complexityScore >= 20 => 'very_high',
            $complexityScore >= 15 => 'high',
            $complexityScore >= 10 => 'medium',
            default => 'low'
        };
    }

    /**
     * Check if vendor specialization matches order requirements
     */
    private function isVendorSpecializationMatch($vendor, PurchaseOrder $order): bool
    {
        // In a real implementation, this would check vendor capabilities
        // against order requirements. For now, we'll use a simple heuristic.
        
        $vendorRating = $vendor->getRating();
        $orderComplexity = $this->assessOrderComplexity($order);
        
        // High-rated vendors can handle complex orders
        if ($vendorRating >= 4.0) {
            return true;
        }
        
        // Medium-rated vendors can handle low to medium complexity
        if ($vendorRating >= 3.0 && in_array($orderComplexity, ['low', 'medium'])) {
            return true;
        }
        
        // Low-rated vendors can only handle low complexity
        if ($vendorRating >= 2.0 && $orderComplexity === 'low') {
            return true;
        }
        
        return false;
    }
}