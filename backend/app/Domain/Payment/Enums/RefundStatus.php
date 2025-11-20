<?php

namespace App\Domain\Payment\Enums;

enum RefundStatus: string
{
    case PENDING = 'pending';
    case PROCESSING = 'processing';
    case APPROVED = 'approved';
    case REJECTED = 'rejected';
    case COMPLETED = 'completed';
    case FAILED = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending Approval',
            self::PROCESSING => 'Processing Refund',
            self::APPROVED => 'Approved for Refund',
            self::REJECTED => 'Refund Rejected',
            self::COMPLETED => 'Refund Completed',
            self::FAILED => 'Refund Failed',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PENDING => 'Refund request is waiting for approval',
            self::PROCESSING => 'Refund is being processed by payment gateway',
            self::APPROVED => 'Refund request has been approved and ready for processing',
            self::REJECTED => 'Refund request has been rejected',
            self::COMPLETED => 'Refund has been successfully completed',
            self::FAILED => 'Refund processing failed',
        };
    }

    public function isActive(): bool
    {
        return !in_array($this, [
            self::COMPLETED,
            self::FAILED,
            self::REJECTED,
        ]);
    }

    public function requiresApproval(): bool
    {
        return $this === self::PENDING;
    }

    public function canBeProcessed(): bool
    {
        return $this === self::APPROVED;
    }

    public function canBeApproved(): bool
    {
        return $this === self::PENDING;
    }

    public function canBeRejected(): bool
    {
        return $this === self::PENDING;
    }

    public function isFinal(): bool
    {
        return in_array($this, [
            self::COMPLETED,
            self::FAILED,
            self::REJECTED,
        ]);
    }

    public function isSuccess(): bool
    {
        return $this === self::COMPLETED;
    }

    public function isFailure(): bool
    {
        return in_array($this, [
            self::FAILED,
            self::REJECTED,
        ]);
    }

    public function getAllowedTransitions(): array
    {
        return match ($this) {
            self::PENDING => [
                self::APPROVED,
                self::REJECTED,
            ],
            self::APPROVED => [
                self::PROCESSING,
                self::REJECTED,
            ],
            self::PROCESSING => [
                self::COMPLETED,
                self::FAILED,
            ],
            self::REJECTED => [],
            self::COMPLETED => [],
            self::FAILED => [
                self::PENDING, // Allow retry
                self::REJECTED,
            ],
        };
    }

    public function canTransitionTo(RefundStatus $newStatus): bool
    {
        return in_array($newStatus, $this->getAllowedTransitions());
    }

    public function getColorClass(): string
    {
        return match ($this) {
            self::PENDING => 'bg-yellow-100 text-yellow-800',
            self::PROCESSING => 'bg-blue-100 text-blue-800',
            self::APPROVED => 'bg-green-100 text-green-800',
            self::REJECTED => 'bg-red-100 text-red-800',
            self::COMPLETED => 'bg-green-100 text-green-800',
            self::FAILED => 'bg-red-100 text-red-800',
        };
    }

    public function getIconClass(): string
    {
        return match ($this) {
            self::PENDING => 'fas fa-clock',
            self::PROCESSING => 'fas fa-spinner fa-spin',
            self::APPROVED => 'fas fa-check-circle',
            self::REJECTED => 'fas fa-times-circle',
            self::COMPLETED => 'fas fa-check-circle',
            self::FAILED => 'fas fa-exclamation-triangle',
        };
    }

    public static function fromString(string $status): self
    {
        return match (strtolower($status)) {
            'pending' => self::PENDING,
            'processing' => self::PROCESSING,
            'approved' => self::APPROVED,
            'rejected' => self::REJECTED,
            'completed' => self::COMPLETED,
            'failed' => self::FAILED,
            default => throw new \ValueError("Invalid refund status: {$status}"),
        };
    }

    public static function getActiveStatuses(): array
    {
        return [
            self::PENDING,
            self::PROCESSING,
            self::APPROVED,
        ];
    }

    public static function getFinalStatuses(): array
    {
        return [
            self::COMPLETED,
            self::FAILED,
            self::REJECTED,
        ];
    }

    public static function getSuccessStatuses(): array
    {
        return [
            self::COMPLETED,
        ];
    }

    public static function getFailureStatuses(): array
    {
        return [
            self::FAILED,
            self::REJECTED,
        ];
    }
}