<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\ValueObjects;

/**
 * ApprovalDecision Value Object
 * 
 * Immutable value object representing the result of an approval decision.
 * Encapsulates whether a quote should be auto-approved or require manual approval.
 */
final class ApprovalDecision
{
    private function __construct(
        private readonly bool $autoApprove,
        private readonly ?string $reason,
        private readonly array $metadata
    ) {}

    /**
     * Create auto-approval decision
     */
    public static function autoApprove(array $metadata = []): self
    {
        return new self(
            autoApprove: true,
            reason: null,
            metadata: $metadata
        );
    }

    /**
     * Create manual approval decision
     */
    public static function manualApproval(string $reason, array $metadata = []): self
    {
        return new self(
            autoApprove: false,
            reason: $reason,
            metadata: $metadata
        );
    }

    /**
     * Check if auto-approval is allowed
     */
    public function shouldAutoApprove(): bool
    {
        return $this->autoApprove;
    }

    /**
     * Check if manual approval is required
     */
    public function requiresManualApproval(): bool
    {
        return !$this->autoApprove;
    }

    /**
     * Get approval method string
     */
    public function getApprovalMethod(): string
    {
        return $this->autoApprove ? 'auto' : 'manual';
    }

    /**
     * Get reason for decision
     */
    public function getReason(): ?string
    {
        return $this->reason;
    }

    /**
     * Get decision metadata
     */
    public function getMetadata(): array
    {
        return $this->metadata;
    }

    /**
     * Get specific metadata value
     */
    public function getMetadataValue(string $key, mixed $default = null): mixed
    {
        return $this->metadata[$key] ?? $default;
    }

    /**
     * Get human-readable message
     */
    public function getMessage(): string
    {
        if ($this->autoApprove) {
            return 'Quote automatically approved based on approval rules';
        }

        return $this->reason ?? 'Manual approval required';
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'auto_approve' => $this->autoApprove,
            'approval_method' => $this->getApprovalMethod(),
            'requires_manual_approval' => $this->requiresManualApproval(),
            'reason' => $this->reason,
            'message' => $this->getMessage(),
            'metadata' => $this->metadata,
        ];
    }

    /**
     * Check equality
     */
    public function equals(self $other): bool
    {
        return $this->autoApprove === $other->autoApprove
            && $this->reason === $other->reason
            && $this->metadata === $other->metadata;
    }
}
