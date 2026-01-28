<?php

namespace App\Domain\Vendor\Rules;

use App\Domain\Shared\Rules\BusinessRule;
use App\Domain\Shared\Rules\RuleResult;

class VendorPerformanceRule extends BusinessRule
{
    protected int $priority = 75;
    protected array $applicableContexts = ['vendor_selection', 'vendor_evaluation'];

    public function getRuleCode(): string
    {
        return 'vendor_performance';
    }

    public function getName(): string
    {
        return 'Vendor Performance Validation';
    }

    public function getDescription(): string
    {
        return 'Validates vendor performance metrics including on-time delivery, quality, and customer satisfaction';
    }

    public function getCategory(): string
    {
        return 'vendor';
    }

    public function getDefaultParameters(): array
    {
        return [
            'minimum_on_time_delivery' => 0.95, // 95%
            'minimum_quality_acceptance' => 0.98, // 98%
            'minimum_customer_satisfaction' => 4.5, // 4.5/5.0
        ];
    }

    public function evaluate($context): RuleResult
    {
        $vendorId = is_object($context) && method_exists($context, 'getVendorId')
            ? $context->getVendorId()
            : ($context['vendor_id'] ?? null);

        if (!$vendorId) {
            return RuleResult::failure('Vendor ID is required for performance validation');
        }

        // Mock performance data - in real implementation, fetch from database
        $performance = [
            'on_time_delivery_rate' => 0.96,
            'quality_acceptance_rate' => 0.99,
            'customer_satisfaction_score' => 4.7,
            'total_orders' => 150,
            'completed_orders' => 144
        ];

        $warnings = [];

        // Check on-time delivery rate
        $minOnTime = $this->parameters['minimum_on_time_delivery'] ?? 0.95;
        if ($performance['on_time_delivery_rate'] < $minOnTime) {
            $onTimePercent = $performance['on_time_delivery_rate'] * 100;
            $minOnTimePercent = $minOnTime * 100;
            $warnings[] = "Vendor on-time delivery rate ({$onTimePercent}%) below minimum {$minOnTimePercent}%";
        }

        // Check quality acceptance rate
        $minQuality = $this->parameters['minimum_quality_acceptance'] ?? 0.98;
        if ($performance['quality_acceptance_rate'] < $minQuality) {
            $qualityPercent = $performance['quality_acceptance_rate'] * 100;
            $minQualityPercent = $minQuality * 100;
            $warnings[] = "Vendor quality acceptance rate ({$qualityPercent}%) below minimum {$minQualityPercent}%";
        }

        // Check customer satisfaction
        $minSatisfaction = $this->parameters['minimum_customer_satisfaction'] ?? 4.5;
        if ($performance['customer_satisfaction_score'] < $minSatisfaction) {
            $warnings[] = "Vendor customer satisfaction ({$performance['customer_satisfaction_score']}/5.0) below minimum {$minSatisfaction}";
        }

        // Calculate overall performance score
        $performanceScore = (
            $performance['on_time_delivery_rate'] * 0.4 +
            $performance['quality_acceptance_rate'] * 0.4 +
            ($performance['customer_satisfaction_score'] / 5.0) * 0.2
        ) * 100;

        return RuleResult::success([
            'performance_score' => round($performanceScore, 2),
            'on_time_delivery_rate' => $performance['on_time_delivery_rate'],
            'quality_acceptance_rate' => $performance['quality_acceptance_rate'],
            'customer_satisfaction_score' => $performance['customer_satisfaction_score'],
            'recommendation' => $performanceScore >= 90 ? 'preferred' : ($performanceScore >= 80 ? 'approved' : 'review_required')
        ], $warnings);
    }
}