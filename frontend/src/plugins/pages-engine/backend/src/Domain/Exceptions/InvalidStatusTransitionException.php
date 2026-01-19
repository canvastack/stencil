<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Domain\Exceptions;

use RuntimeException;

final class InvalidStatusTransitionException extends RuntimeException
{
    public static function cannotTransition(string $from, string $to): self
    {
        return new self("Cannot transition from '{$from}' to '{$to}'");
    }
}
