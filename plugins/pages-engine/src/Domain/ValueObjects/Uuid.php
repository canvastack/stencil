<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use InvalidArgumentException;

final class Uuid
{
    private const PATTERN = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = strtolower($value);
    }

    private function validate(string $value): void
    {
        if (!preg_match(self::PATTERN, $value)) {
            throw new InvalidArgumentException("Invalid UUID format: {$value}");
        }
    }

    public function getValue(): string
    {
        return $this->value;
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
