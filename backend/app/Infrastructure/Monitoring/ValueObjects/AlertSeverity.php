<?php

namespace App\Infrastructure\Monitoring\ValueObjects;

/**
 * Alert Severity Enumeration
 * 
 * Defines the severity levels for system alerts.
 */
enum AlertSeverity: string
{
    case CRITICAL = 'critical';
    case WARNING = 'warning';
    case INFO = 'info';

    /**
     * Get color code for UI display
     */
    public function getColor(): string
    {
        return match($this) {
            self::CRITICAL => '#dc2626', // red-600
            self::WARNING => '#d97706',  // amber-600
            self::INFO => '#2563eb'      // blue-600
        };
    }

    /**
     * Get icon for UI display
     */
    public function getIcon(): string
    {
        return match($this) {
            self::CRITICAL => 'alert-triangle',
            self::WARNING => 'alert-circle',
            self::INFO => 'info'
        };
    }

    /**
     * Get priority weight for sorting
     */
    public function getPriority(): int
    {
        return match($this) {
            self::CRITICAL => 1,
            self::WARNING => 2,
            self::INFO => 3
        };
    }

    /**
     * Get human-readable label
     */
    public function getLabel(): string
    {
        return match($this) {
            self::CRITICAL => 'Critical',
            self::WARNING => 'Warning',
            self::INFO => 'Information'
        };
    }

    /**
     * Check if severity requires immediate attention
     */
    public function requiresImmediateAttention(): bool
    {
        return $this === self::CRITICAL;
    }

    /**
     * Get all severity levels
     */
    public static function all(): array
    {
        return [
            self::CRITICAL,
            self::WARNING,
            self::INFO
        ];
    }
}