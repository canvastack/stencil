<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use Plugins\PagesEngine\Domain\Exceptions\InvalidStatusTransitionException;
use InvalidArgumentException;

final class ContentStatus
{
    public const DRAFT = 'draft';
    public const PUBLISHED = 'published';
    public const SCHEDULED = 'scheduled';
    public const ARCHIVED = 'archived';
    public const TRASHED = 'trashed';

    private const ALLOWED_VALUES = [
        self::DRAFT,
        self::PUBLISHED,
        self::SCHEDULED,
        self::ARCHIVED,
        self::TRASHED
    ];

    private const ALLOWED_TRANSITIONS = [
        self::DRAFT => [self::PUBLISHED, self::SCHEDULED, self::TRASHED],
        self::PUBLISHED => [self::DRAFT, self::ARCHIVED, self::TRASHED],
        self::SCHEDULED => [self::DRAFT, self::PUBLISHED, self::TRASHED],
        self::ARCHIVED => [self::PUBLISHED, self::TRASHED],
        self::TRASHED => [self::DRAFT]
    ];

    private string $value;

    public function __construct(string $value)
    {
        if (!in_array($value, self::ALLOWED_VALUES, true)) {
            throw new InvalidArgumentException("Invalid content status: {$value}");
        }

        $this->value = $value;
    }

    public function getValue(): string
    {
        return $this->value;
    }

    public function isDraft(): bool
    {
        return $this->value === self::DRAFT;
    }

    public function isPublished(): bool
    {
        return $this->value === self::PUBLISHED;
    }

    public function isScheduled(): bool
    {
        return $this->value === self::SCHEDULED;
    }

    public function isArchived(): bool
    {
        return $this->value === self::ARCHIVED;
    }

    public function isTrashed(): bool
    {
        return $this->value === self::TRASHED;
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
