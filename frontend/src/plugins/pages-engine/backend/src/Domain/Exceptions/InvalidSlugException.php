<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Exceptions;

use InvalidArgumentException;

final class InvalidSlugException extends InvalidArgumentException
{
    public static function empty(): self
    {
        return new self('Slug cannot be empty');
    }

    public static function invalidFormat(string $value): self
    {
        return new self("Slug must contain only lowercase letters, numbers, and hyphens. Given: {$value}");
    }

    public static function tooLong(int $maxLength): self
    {
        return new self("Slug cannot exceed {$maxLength} characters");
    }
}
