<?php

declare(strict_types=1);

namespace App\Domain\Vendor\ValueObjects;

use InvalidArgumentException;

/**
 * OnboardingStatus Value Object
 * 
 * Represents the onboarding progress status of a vendor.
 * Requirements: 17.1, 17.7
 */
final class OnboardingStatus
{
    private const PENDING = 'pending';
    private const IN_PROGRESS = 'in_progress';
    private const COMPLETED = 'completed';

    private const VALID_STATUSES = [
        self::PENDING,
        self::IN_PROGRESS,
        self::COMPLETED,
    ];

    private string $value;

    private function __construct(string $value)
    {
        if (!in_array($value, self::VALID_STATUSES, true)) {
            throw new InvalidArgumentException(
                sprintf('Invalid onboarding status: %s. Valid statuses are: %s', 
                    $value, 
                    implode(', ', self::VALID_STATUSES)
                )
            );
        }

        $this->value = $value;
    }

    public static function pending(): self
    {
        return new self(self::PENDING);
    }

    public static function inProgress(): self
    {
        return new self(self::IN_PROGRESS);
    }

    public static function completed(): self
    {
        return new self(self::COMPLETED);
    }

    public static function fromString(string $value): self
    {
        return new self($value);
    }

    public function isPending(): bool
    {
        return $this->value === self::PENDING;
    }

    public function isInProgress(): bool
    {
        return $this->value === self::IN_PROGRESS;
    }

    public function isCompleted(): bool
    {
        return $this->value === self::COMPLETED;
    }

    public function toString(): string
    {
        return $this->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }
}
