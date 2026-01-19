<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Exceptions;

use InvalidArgumentException;

final class InvalidUrlPatternException extends InvalidArgumentException
{
    public static function empty(): self
    {
        return new self('URL pattern cannot be empty');
    }

    public static function invalidPlaceholder(string $placeholder): self
    {
        return new self("Invalid placeholder: {$placeholder}");
    }

    public static function missingRequiredPlaceholder(string $placeholder): self
    {
        return new self("Required placeholder missing: {$placeholder}");
    }
}
