<?php

namespace App\Domain\Payment\Enums;

enum WorkflowDecision: string
{
    case PENDING = 'pending';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case ESCALATED = 'escalated';
    case SKIPPED = 'skipped';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending Decision',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
            self::ESCALATED => 'Escalated',
            self::SKIPPED => 'Skipped',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PENDING => 'Awaiting decision from assigned approver',
            self::APPROVED => 'Request has been approved',
            self::REJECTED => 'Request has been rejected',
            self::ESCALATED => 'Request has been escalated to higher authority',
            self::SKIPPED => 'This step was skipped due to automation or business rules',
        };
    }

    public function isFinal(): bool
    {
        return in_array($this, [
            self::APPROVED,
            self::REJECTED,
            self::SKIPPED,
        ]);
    }

    public function isPending(): bool
    {
        return $this === self::PENDING;
    }

    public function isPositive(): bool
    {
        return in_array($this, [
            self::APPROVED,
            self::SKIPPED,
        ]);
    }

    public function isNegative(): bool
    {
        return $this === self::REJECTED;
    }

    public function requiresAction(): bool
    {
        return in_array($this, [
            self::PENDING,
            self::ESCALATED,
        ]);
    }

    public function getColorClass(): string
    {
        return match ($this) {
            self::PENDING => 'bg-yellow-100 text-yellow-800',
            self::APPROVED => 'bg-green-100 text-green-800',
            self::REJECTED => 'bg-red-100 text-red-800',
            self::ESCALATED => 'bg-orange-100 text-orange-800',
            self::SKIPPED => 'bg-gray-100 text-gray-800',
        };
    }

    public function getIconClass(): string
    {
        return match ($this) {
            self::PENDING => 'fas fa-clock',
            self::APPROVED => 'fas fa-check-circle',
            self::REJECTED => 'fas fa-times-circle',
            self::ESCALATED => 'fas fa-arrow-up',
            self::SKIPPED => 'fas fa-forward',
        };
    }

    public static function fromString(string $decision): self
    {
        return match (strtolower($decision)) {
            'pending' => self::PENDING,
            'approved' => self::APPROVED,
            'rejected' => self::REJECTED,
            'escalated' => self::ESCALATED,
            'skipped' => self::SKIPPED,
            default => throw new \ValueError("Invalid workflow decision: {$decision}"),
        };
    }

    public static function getFinalDecisions(): array
    {
        return [
            self::APPROVED,
            self::REJECTED,
            self::SKIPPED,
        ];
    }

    public static function getPendingDecisions(): array
    {
        return [
            self::PENDING,
            self::ESCALATED,
        ];
    }

    public static function getPositiveDecisions(): array
    {
        return [
            self::APPROVED,
            self::SKIPPED,
        ];
    }

    public static function getNegativeDecisions(): array
    {
        return [
            self::REJECTED,
        ];
    }
}