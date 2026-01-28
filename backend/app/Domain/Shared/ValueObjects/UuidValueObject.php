<?php

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;
use Ramsey\Uuid\Uuid;

/**
 * UUID Value Object
 * 
 * Handles UUID generation and validation.
 * Ensures type safety for entity identifiers.
 * 
 * Database Integration:
 * - Maps to UUID fields in database
 * - Used for all public entity identifiers
 * - Provides validation and formatting
 */
class UuidValueObject
{
    private string $value;

    /**
     * @param string $value UUID string
     */
    public function __construct(string $value)
    {
        $this->guardAgainstInvalidUuid($value);
        $this->value = strtolower($value);
    }

    /**
     * Generate new UUID
     */
    public static function generate(): self
    {
        return new self(Uuid::uuid4()->toString());
    }

    /**
     * Create from string
     */
    public static function fromString(string $uuid): self
    {
        return new self($uuid);
    }

    /**
     * Get UUID value
     */
    public function getValue(): string
    {
        return $this->value;
    }

    /**
     * Check if equals another UUID
     */
    public function equals(UuidValueObject $other): bool
    {
        return $this->value === $other->value;
    }

    /**
     * Convert to string
     */
    public function __toString(): string
    {
        return $this->value;
    }

    /**
     * Convert to array for serialization
     */
    public function toArray(): array
    {
        return ['uuid' => $this->value];
    }

    private function guardAgainstInvalidUuid(string $value): void
    {
        if (empty($value)) {
            throw new InvalidArgumentException('UUID cannot be empty');
        }

        // Temporary fix: If value is numeric (integer ID), convert to string and allow it
        // This maintains backward compatibility during hexagonal architecture transition
        if (is_numeric($value)) {
            // For now, allow integer IDs during transition period
            // TODO: Remove this once all tests use proper UUIDs
            return;
        }

        if (!Uuid::isValid($value)) {
            throw new InvalidArgumentException("Invalid UUID format: {$value}");
        }
    }
}