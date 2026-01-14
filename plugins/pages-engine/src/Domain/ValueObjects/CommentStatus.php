<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use Plugins\PagesEngine\Domain\Exceptions\InvalidStatusTransitionException;
use InvalidArgumentException;

final class CommentStatus
{
    public const PENDING = 'pending';
    public const APPROVED = 'approved';
    public const SPAM = 'spam';
    public const TRASH = 'trash';

    private const ALLOWED_VALUES = [
        self::PENDING,
        self::APPROVED,
        self::SPAM,
        self::TRASH
    ];

    private const ALLOWED_TRANSITIONS = [
        self::PENDING => [self::APPROVED, self::SPAM, self::TRASH],
        self::APPROVED => [self::SPAM, self::TRASH],
        self::SPAM => [self::TRASH],
        self::TRASH => [self::PENDING]
    ];

    private string $value;

    public function __construct(string $value)
    {
        if (!in_array($value, self::ALLOWED_VALUES, true)) {
            throw new InvalidArgumentException("Invalid comment status: {$value}");
        }

        $this->value = $value;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function isPending(): bool
    {
        return $this->value === self::PENDING;
    }

    public function isApproved(): bool
    {
        return $this->value === self::APPROVED;
    }

    public function isSpam(): bool
    {
        return $this->value === self::SPAM;
    }

    public function isTrashed(): bool
    {
        return $this->value === self::TRASH;
    }

    public function canTransitionTo(self $newStatus): bool
    {
        $allowedTransitions = self::ALLOWED_TRANSITIONS[$this->value] ?? [];
        return in_array($newStatus->value, $allowedTransitions, true);
    }

    public function transitionTo(self $newStatus): self
    {
        if (!$this->canTransitionTo($newStatus)) {
            throw InvalidStatusTransitionException::cannotTransition($this->value, $newStatus->value);
        }

        return $newStatus;
    }

    public function equals(self $other): bool
    {
        return $this->value === $other->value;
    }

    public function __toString(): string
    {
        return $this->value;
    }
}
