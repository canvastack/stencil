<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\ValueObjects;

use InvalidArgumentException;

/**
 * ApprovalSettings Value Object
 * 
 * Immutable value object representing approval configuration rules.
 * Self-validating with equality by value.
 */
final class ApprovalSettings
{
    private function __construct(
        private readonly bool $autoApprovalEnabled,
        private readonly int $autoApprovalThreshold,
        private readonly bool $requireEmailVerification,
        private readonly int $minSuccessfulOrders,
        private readonly float $minPaymentSuccessRate,
        private readonly bool $autoApproveStandardProducts,
        private readonly bool $requireApprovalCustomProducts,
        private readonly int $maxNegotiationRounds,
        private readonly bool $allowCustomerCounterOffer,
        private readonly bool $notifyAdminOnAutoApprove,
        private readonly bool $notifyAdminOnPendingApproval
    ) {
        $this->validate();
    }

    /**
     * Create ApprovalSettings from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            autoApprovalEnabled: $data['auto_approval_enabled'] ?? false,
            autoApprovalThreshold: $data['auto_approval_threshold'] ?? 0,
            requireEmailVerification: $data['require_email_verification'] ?? true,
            minSuccessfulOrders: $data['min_successful_orders'] ?? 0,
            minPaymentSuccessRate: $data['min_payment_success_rate'] ?? 0.0,
            autoApproveStandardProducts: $data['auto_approve_standard_products'] ?? false,
            requireApprovalCustomProducts: $data['require_approval_custom_products'] ?? true,
            maxNegotiationRounds: $data['max_negotiation_rounds'] ?? 3,
            allowCustomerCounterOffer: $data['allow_customer_counter_offer'] ?? true,
            notifyAdminOnAutoApprove: $data['notify_admin_on_auto_approve'] ?? true,
            notifyAdminOnPendingApproval: $data['notify_admin_on_pending_approval'] ?? true
        );
    }

    /**
     * Create default settings
     */
    public static function default(): self
    {
        return new self(
            autoApprovalEnabled: false,
            autoApprovalThreshold: 1000000, // Rp 10,000 in cents
            requireEmailVerification: true,
            minSuccessfulOrders: 1,
            minPaymentSuccessRate: 80.0,
            autoApproveStandardProducts: false,
            requireApprovalCustomProducts: true,
            maxNegotiationRounds: 3,
            allowCustomerCounterOffer: true,
            notifyAdminOnAutoApprove: true,
            notifyAdminOnPendingApproval: true
        );
    }

    /**
     * Validate settings
     */
    private function validate(): void
    {
        if ($this->autoApprovalThreshold < 0) {
            throw new InvalidArgumentException('Auto approval threshold must be non-negative');
        }

        if ($this->minSuccessfulOrders < 0) {
            throw new InvalidArgumentException('Minimum successful orders must be non-negative');
        }

        if ($this->minPaymentSuccessRate < 0 || $this->minPaymentSuccessRate > 100) {
            throw new InvalidArgumentException('Payment success rate must be between 0 and 100');
        }

        if ($this->maxNegotiationRounds < 1) {
            throw new InvalidArgumentException('Maximum negotiation rounds must be at least 1');
        }
    }

    /**
     * Check if value meets threshold for auto-approval
     */
    public function meetsValueThreshold(int $amount): bool
    {
        return $amount < $this->autoApprovalThreshold;
    }

    /**
     * Check if customer meets trust requirements
     */
    public function meetsTrustRequirements(
        bool $emailVerified,
        int $successfulOrders,
        float $paymentSuccessRate
    ): bool {
        if ($this->requireEmailVerification && !$emailVerified) {
            return false;
        }

        if ($successfulOrders < $this->minSuccessfulOrders) {
            return false;
        }

        if ($paymentSuccessRate < $this->minPaymentSuccessRate) {
            return false;
        }

        return true;
    }

    // Getters

    public function isAutoApprovalEnabled(): bool
    {
        return $this->autoApprovalEnabled;
    }

    public function getAutoApprovalThreshold(): int
    {
        return $this->autoApprovalThreshold;
    }

    public function requiresEmailVerification(): bool
    {
        return $this->requireEmailVerification;
    }

    public function getMinSuccessfulOrders(): int
    {
        return $this->minSuccessfulOrders;
    }

    public function getMinPaymentSuccessRate(): float
    {
        return $this->minPaymentSuccessRate;
    }

    public function shouldAutoApproveStandardProducts(): bool
    {
        return $this->autoApproveStandardProducts;
    }

    public function requiresApprovalForCustomProducts(): bool
    {
        return $this->requireApprovalCustomProducts;
    }

    public function getMaxNegotiationRounds(): int
    {
        return $this->maxNegotiationRounds;
    }

    public function allowsCustomerCounterOffer(): bool
    {
        return $this->allowCustomerCounterOffer;
    }

    public function shouldNotifyAdminOnAutoApprove(): bool
    {
        return $this->notifyAdminOnAutoApprove;
    }

    public function shouldNotifyAdminOnPendingApproval(): bool
    {
        return $this->notifyAdminOnPendingApproval;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'auto_approval_enabled' => $this->autoApprovalEnabled,
            'auto_approval_threshold' => $this->autoApprovalThreshold,
            'require_email_verification' => $this->requireEmailVerification,
            'min_successful_orders' => $this->minSuccessfulOrders,
            'min_payment_success_rate' => $this->minPaymentSuccessRate,
            'auto_approve_standard_products' => $this->autoApproveStandardProducts,
            'require_approval_custom_products' => $this->requireApprovalCustomProducts,
            'max_negotiation_rounds' => $this->maxNegotiationRounds,
            'allow_customer_counter_offer' => $this->allowCustomerCounterOffer,
            'notify_admin_on_auto_approve' => $this->notifyAdminOnAutoApprove,
            'notify_admin_on_pending_approval' => $this->notifyAdminOnPendingApproval,
        ];
    }

    /**
     * Check equality by value
     */
    public function equals(self $other): bool
    {
        return $this->toArray() === $other->toArray();
    }
}
