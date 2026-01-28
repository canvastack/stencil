<?php

namespace App\Domain\Quality\Rules;

use App\Domain\Shared\Rules\BusinessRule;
use App\Domain\Shared\Rules\RuleResult;

class QualityStandardsRule extends BusinessRule
{
    protected int $priority = 80;
    protected array $applicableContexts = ['order_creation', 'quality_validation', 'vendor_assignment'];

    public function getRuleCode(): string
    {
        return 'quality_standards';
    }

    public function getName(): string
    {
        return 'Quality Standards Validation';
    }

    public function getDescription(): string
    {
        return 'Validates quality standards and inspection requirements for orders and vendor capabilities';
    }

    public function getCategory(): string
    {
        return 'quality';
    }

    public function getDefaultParameters(): array
    {
        return [
            'required_standards' => ['premium', 'standard'],
            'inspection_required_threshold' => 1000000000, // IDR 10M in cents
            'mandatory_certifications' => ['ISO9001']
        ];
    }

    public function evaluate($context): RuleResult
    {
        $orderRequirements = is_object($context) && method_exists($context, 'getOrderRequirements')
            ? $context->getOrderRequirements()
            : ($context['order_requirements'] ?? []);

        $vendorId = is_object($context) && method_exists($context, 'getVendorId')
            ? $context->getVendorId()
            : ($context['vendor_id'] ?? null);

        $orderValue = is_object($context) && method_exists($context, 'getOrderValue')
            ? $context->getOrderValue()->getAmount()
            : ($context['order_value'] ?? 0);

        $requiredStandards = $orderRequirements['quality_standards'] ?? ['standard'];
        $requiredCertifications = $orderRequirements['quality_certifications'] ?? ['ISO9001'];

        // Mock vendor quality capabilities - in real implementation, fetch from database
        $vendorCapabilities = [
            'quality_standards' => ['premium', 'standard', 'basic'],
            'certifications' => ['ISO9001', 'ISO14001'],
            'inspection_capabilities' => true,
            'quality_score' => 95
        ];

        $unmetStandards = [];
        foreach ($requiredStandards as $standard) {
            if (!in_array($standard, $vendorCapabilities['quality_standards'])) {
                $unmetStandards[] = $standard;
            }
        }

        if (!empty($unmetStandards)) {
            return RuleResult::failure(
                "Vendor cannot meet quality standards: " . implode(', ', $unmetStandards)
            );
        }

        // Check certifications
        $missingCertifications = array_diff($requiredCertifications, $vendorCapabilities['certifications']);
        if (!empty($missingCertifications)) {
            return RuleResult::failure(
                "Vendor missing required quality certifications: " . implode(', ', $missingCertifications)
            );
        }

        // Determine inspection requirements
        $inspectionThreshold = $this->parameters['inspection_required_threshold'] ?? 1000000000;
        $inspectionRequired = $orderValue >= $inspectionThreshold || in_array('premium', $requiredStandards);

        $qualityPlan = $this->generateQualityPlan($requiredStandards, $inspectionRequired);
        $inspectionPoints = $this->defineInspectionPoints($orderRequirements, $inspectionRequired);

        return RuleResult::success([
            'quality_plan' => $qualityPlan,
            'inspection_points' => $inspectionPoints,
            'inspection_required' => $inspectionRequired,
            'vendor_quality_score' => $vendorCapabilities['quality_score']
        ]);
    }

    private function generateQualityPlan(array $standards, bool $inspectionRequired): array
    {
        $plan = [
            'standards' => $standards,
            'documentation_required' => true,
            'quality_checkpoints' => []
        ];

        if (in_array('premium', $standards)) {
            $plan['quality_checkpoints'][] = 'material_verification';
            $plan['quality_checkpoints'][] = 'process_validation';
            $plan['quality_checkpoints'][] = 'final_inspection';
        } else {
            $plan['quality_checkpoints'][] = 'final_inspection';
        }

        if ($inspectionRequired) {
            $plan['quality_checkpoints'][] = 'third_party_inspection';
        }

        return $plan;
    }

    private function defineInspectionPoints(array $requirements, bool $inspectionRequired): array
    {
        $points = [
            'visual_inspection' => true,
            'dimensional_check' => true,
            'surface_finish' => true
        ];

        if ($inspectionRequired) {
            $points['material_composition'] = true;
            $points['stress_testing'] = true;
            $points['durability_testing'] = true;
        }

        if (isset($requirements['material']) && $requirements['material'] === 'stainless_steel') {
            $points['corrosion_resistance'] = true;
        }

        return $points;
    }
}