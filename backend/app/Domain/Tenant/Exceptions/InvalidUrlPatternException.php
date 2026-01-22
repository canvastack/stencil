<?php

namespace App\Domain\Tenant\Exceptions;

use DomainException;

class InvalidUrlPatternException extends DomainException
{
    public static function forHost(string $host): self
    {
        return new self("Invalid URL pattern detected for host: {$host}");
    }

    public static function forPath(string $path): self
    {
        return new self("Invalid URL pattern detected for path: {$path}");
    }

    public static function unsupportedPattern(string $pattern): self
    {
        return new self("Unsupported URL pattern: {$pattern}");
    }
}
