<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\ValueObjects;

use Plugins\PagesEngine\Domain\Exceptions\InvalidSlugException;

final class CategorySlug
{
    private const MAX_LENGTH = 100;
    private const PATTERN = '/^[a-z0-9-]+$/';

    private string $value;

    public function __construct(string $value)
    {
        $this->validate($value);
        $this->value = $this->normalize($value);
    }

    private function validate(string $value): void
    {
        if (empty($value)) {
            throw InvalidSlugException::empty();
        }

        $normalized = $this->normalize($value);

        if (!preg_match(self::PATTERN, $normalized)) {
            throw InvalidSlugException::invalidFormat($value);
        }

        if (strlen($normalized) > self::MAX_LENGTH) {
            throw InvalidSlugException::tooLong(self::MAX_LENGTH);
        }
    }

    private function normalize(string $value): string
    {
        return strtolower(trim($value));
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
