<?php

namespace App\Domain\Production\Enums;

/**
 * Issue Type Enum
 * 
 * Defines the types of issues that can occur during production.
 */
enum IssueType: string
{
    case TIMELINE_DELAY = 'timeline_delay';
    case QUALITY_ISSUE = 'quality_issue';
    case RESOURCE_CONSTRAINT = 'resource_constraint';
    case VENDOR_ISSUE = 'vendor_issue';
    case EQUIPMENT_FAILURE = 'equipment_failure';
    case MATERIAL_SHORTAGE = 'material_shortage';
    case LABOR_SHORTAGE = 'labor_shortage';
    case SPECIFICATION_CHANGE = 'specification_change';
    case EXTERNAL_DEPENDENCY = 'external_dependency';
    case SAFETY_CONCERN = 'safety_concern';
    case COST_OVERRUN = 'cost_overrun';
    case COMMUNICATION_BREAKDOWN = 'communication_breakdown';

    /**
     * Get human-readable label
     */
    public function getLabel(): string
    {
        return match($this) {
            self::TIMELINE_DELAY => 'Timeline Delay',
            self::QUALITY_ISSUE => 'Quality Issue',
            self::RESOURCE_CONSTRAINT => 'Resource Constraint',
            self::VENDOR_ISSUE => 'Vendor Issue',
            self::EQUIPMENT_FAILURE => 'Equipment Failure',
            self::MATERIAL_SHORTAGE => 'Material Shortage',
            self::LABOR_SHORTAGE => 'Labor Shortage',
            self::SPECIFICATION_CHANGE => 'Specification Change',
            self::EXTERNAL_DEPENDENCY => 'External Dependency',
            self::SAFETY_CONCERN => 'Safety Concern',
            self::COST_OVERRUN => 'Cost Overrun',
            self::COMMUNICATION_BREAKDOWN => 'Communication Breakdown'
        };
    }

    /**
     * Get default severity for issue type
     */
    public function getDefaultSeverity(): string
    {
        return match($this) {
            self::TIMELINE_DELAY => 'high',
            self::QUALITY_ISSUE => 'high',
            self::RESOURCE_CONSTRAINT => 'medium',
            self::VENDOR_ISSUE => 'medium',
            self::EQUIPMENT_FAILURE => 'critical',
            self::MATERIAL_SHORTAGE => 'high',
            self::LABOR_SHORTAGE => 'medium',
            self::SPECIFICATION_CHANGE => 'medium',
            self::EXTERNAL_DEPENDENCY => 'low',
            self::SAFETY_CONCERN => 'critical',
            self::COST_OVERRUN => 'high',
            self::COMMUNICATION_BREAKDOWN => 'low'
        };
    }

    /**
     * Get category for grouping
     */
    public function getCategory(): string
    {
        return match($this) {
            self::TIMELINE_DELAY => 'schedule',
            self::QUALITY_ISSUE => 'quality',
            self::RESOURCE_CONSTRAINT, 
            self::EQUIPMENT_FAILURE, 
            self::MATERIAL_SHORTAGE, 
            self::LABOR_SHORTAGE => 'resource',
            self::VENDOR_ISSUE, 
            self::EXTERNAL_DEPENDENCY => 'external',
            self::SPECIFICATION_CHANGE, 
            self::COMMUNICATION_BREAKDOWN => 'process',
            self::SAFETY_CONCERN => 'safety',
            self::COST_OVERRUN => 'financial'
        };
    }

    /**
     * Check if issue type blocks production
     */
    public function blocksProduction(): bool
    {
        return match($this) {
            self::EQUIPMENT_FAILURE,
            self::MATERIAL_SHORTAGE,
            self::SAFETY_CONCERN => true,
            default => false
        };
    }

    /**
     * Get all issue types by category
     */
    public static function getByCategory(string $category): array
    {
        return array_filter(
            self::cases(),
            fn(self $type) => $type->getCategory() === $category
        );
    }

    /**
     * Get critical issue types
     */
    public static function getCriticalTypes(): array
    {
        return array_filter(
            self::cases(),
            fn(self $type) => $type->getDefaultSeverity() === 'critical'
        );
    }

    /**
     * Get production-blocking issue types
     */
    public static function getProductionBlockingTypes(): array
    {
        return array_filter(
            self::cases(),
            fn(self $type) => $type->blocksProduction()
        );
    }
}