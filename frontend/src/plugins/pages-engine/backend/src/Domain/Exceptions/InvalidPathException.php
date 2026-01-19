<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Exceptions;

use InvalidArgumentException;

final class InvalidPathException extends InvalidArgumentException
{
    public static function empty(): self
    {
        return new self('Path cannot be empty');
    }

    public static function mustStartWithSlash(string $value): self
    {
        return new self("Path must start with '/'. Given: {$value}");
    }

    public static function invalidFormat(string $value): self
    {
        return new self("Path format invalid. Given: {$value}");
    }

    public static function tooDeep(int $maxDepth): self
    {
        return new self("Path depth cannot exceed {$maxDepth} levels");
    }
}
