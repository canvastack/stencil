<?php

namespace App\Domain\Vendor\Rules;

use App\Domain\Shared\Rules\BusinessRule;
use App\Domain\Shared\Rules\RuleResult;

class VendorCapabilityRule extends BusinessRule
{
    protected int $priority = 90;
    protected array $applicableContexts = ['vendor_selection', 'order_assignment', 'vendor_validation'];

    public function getRuleCode(): string
    {
        return 'vendor_capability';
    }

    public function getName(): string
    {
        return 'Vendor Capability Validation';
    }

    public function getDescription(): string
    {
        return 'Validates vendor production capabilities, capacity, and quality certifications';
    }

    public function getCategory(): string
    {
        return 'vendor';
    }

    public function getDefaultParameters(): array
    {
        return [
            'required_materials' => ['stainless_steel', 'aluminum', 'brass'],
            'required_certifications' => ['ISO9001'],
            'minimum_capacity' => 100, // orders per month
        ];
    }

    public function evaluate($context): RuleResult
    {
        $vendorId = is_object($context) && method_exists($context, 'getVendorId')
            ? $context->getVendorId()
            : ($context['vendor_id'] ?? null);

        $orderRequirements = is_object($context) && method_exists($context, 'getOrderRequirements')
            ? $context->getOrderRequirements()
            : ($context['order_requirements'] ?? []);

        if (!$vendorId) {
            return RuleResult::failure('Vendor ID is required for capability validation');
        }

        // Mock vendor data for testing - in real implementation, fetch from database
        $vendorCapabilities = [
            'materials' => ['stainless_steel', 'aluminum'],
            'certifications' => ['ISO9001', 'ISO14001'],
            'monthly_capacity' => 150,
            'current_load' => 80
        ];

        $requiredMaterial = $orderRequirements['material'] ?? 'stainless_steel';
        $requiredCertifications = $orderRequirements['quality_certifications'] ?? ['ISO9001'];

        // Check material capability
        if (!in_array($requiredMaterial, $vendorCapabilities['materials'])) {
            return RuleResult::failure(
                "Vendor cannot produce {$requiredMaterial}. Available materials: " . implode(', ', $vendorCapabilities['materials'])
            );
        }

        // Check certifications
        $missingCertifications = array_diff($requiredCertifications, $vendorCapabilities['certifications']);
        if (!empty($missingCertifications)) {
            return RuleResult::failure(
                "Vendor missing required certifications: " . implode(', ', $missingCertifications)
            );
        }

        // Check capacity
        $availableCapacity = $vendorCapabilities['monthly_capacity'] - $vendorCapabilities['current_load'];
        if ($availableCapacity < 10) { // Minimum 10 orders capacity required
            return RuleResult::failure(
                "Vendor has insufficient capacity. Available: {$availableCapacity} orders"
            );
        }

        return RuleResult::success([
            'capability_score' => 95, // Mock score
            'available_capacity' => $availableCapacity,
            'estimated_delivery' => '14 days'
        ]);
    }
}